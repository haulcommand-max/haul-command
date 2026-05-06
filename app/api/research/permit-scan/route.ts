import { NextRequest, NextResponse } from 'next/server'
import { scrapePermitSite } from '@/lib/research/firecrawl'
import { searchPermitChanges } from '@/lib/research/tavily'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { state, url } = await req.json()
  if (!state) return NextResponse.json({ error: 'state required' }, { status: 400 })

  const [crawlResult, tavilyResults] = await Promise.allSettled([
    url ? scrapePermitSite(state, url) : Promise.resolve(null),
    searchPermitChanges(state),
  ])

  const tavilyData = tavilyResults.status === 'fulfilled' ? tavilyResults.value : []

  // Compare against existing permit rules
  const { data: existingRules } = await supabase
    .from('hc_permit_rules')
    .select('id, rule_summary, updated_at')
    .eq('state', state)
    .order('updated_at', { ascending: false })
    .limit(5)

  const changes = []
  for (const result of tavilyData) {
    const isNew = !existingRules?.some(r =>
      result.content?.toLowerCase().includes(r.rule_summary?.toLowerCase())
    )
    if (isNew && result.score > 0.5) {
      changes.push({ title: result.title, url: result.url, score: result.score })

      await supabase.from('hc_permit_rule_changes').insert({
        state,
        source_url: result.url,
        title: result.title,
        summary: result.content?.slice(0, 500),
        detected_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ changes_detected: changes.length > 0, changes })
}
