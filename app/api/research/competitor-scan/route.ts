import { NextRequest, NextResponse } from 'next/server'
import { crawlCompetitor } from '@/lib/research/firecrawl'
import { searchCompetitors } from '@/lib/research/tavily'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_COMPETITORS = [
  'wideloadshipping.com',
  'odsnorthamerica.com',
  'oversize.io',
  'heavyhaulers.com',
]

export async function POST(req: NextRequest) {
  const { domains = DEFAULT_COMPETITORS } = await req.json()

  const [crawlResults, searchResults] = await Promise.allSettled([
    Promise.all(domains.map((d: string) => crawlCompetitor(d).catch(() => null))),
    searchCompetitors(domains),
  ])

  const extractions = crawlResults.status === 'fulfilled' ? crawlResults.value : []

  const structured = extractions.map((pages: any, i: number) => ({
    domain: domains[i],
    pages_crawled: pages?.length ?? 0,
    content_summary: pages?.[0]?.content?.slice(0, 300) ?? null,
  }))

  await supabase.from('hc_firecrawl_extractions').insert(
    structured.map(s => ({
      source_url: `https://${s.domain}`,
      source_type: 'competitor',
      content: JSON.stringify(s),
      created_at: new Date().toISOString(),
    }))
  )

  return NextResponse.json({ competitors: structured })
}
