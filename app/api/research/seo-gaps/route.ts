import { NextRequest, NextResponse } from 'next/server'
import { searchIndustry } from '@/lib/research/tavily'
import { createClient } from '@supabase/supabase-js'
import { isInternalRequest } from '@/lib/auth/internal-request'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (!isInternalRequest(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keyword, country = 'United States' } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const results = await searchIndustry(keyword, country)

  // Check coverage in hc_seo_pages
  const { data: existing } = await supabase
    .from('hc_seo_pages')
    .select('slug, keyword')
    .ilike('keyword', `%${keyword}%`)
    .limit(10)

  const gaps = []
  for (const result of results.slice(0, 10)) {
    const alreadyCovered = existing?.some(p =>
      result.title?.toLowerCase().includes(p.keyword?.toLowerCase())
    )
    if (!alreadyCovered) {
      gaps.push({ keyword: result.title, url: result.url, score: result.score })
      await supabase.from('hc_seo_gap_queue').insert({
        keyword: result.title,
        source_url: result.url,
        country,
        priority_score: result.score,
        created_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ gap_count: gaps.length, gaps })
}
