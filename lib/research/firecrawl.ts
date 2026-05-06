import FirecrawlApp from '@mendable/firecrawl-js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

async function wasRecentlyCrawled(url: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data } = await supabase
    .from('hc_firecrawl_runs')
    .select('id')
    .eq('url', url)
    .gte('created_at', since)
    .limit(1)
    .single()
  return !!data
}

async function logCredits(runId: string, pages: number) {
  await supabase.from('hc_firecrawl_credit_ledger').insert({
    run_id: runId,
    credits_used: pages,
    logged_at: new Date().toISOString(),
  })
}

export async function crawlUrl(url: string, options?: any) {
  if (await wasRecentlyCrawled(url)) return null

  const runId = crypto.randomUUID()
  await supabase.from('hc_firecrawl_runs').insert({
    id: runId, url, status: 'running', created_at: new Date().toISOString(),
  })

  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
      ...options,
    }) as any

    await supabase.from('hc_firecrawl_runs').update({
      status: 'completed', completed_at: new Date().toISOString(),
    }).eq('id', runId)

    await supabase.from('hc_firecrawl_run_pages').insert({
      run_id: runId, url, markdown: result.markdown, created_at: new Date().toISOString(),
    })

    await logCredits(runId, 1)
    return result
  } catch (err: any) {
    await supabase.from('hc_firecrawl_failures').insert({
      run_id: runId, url, error: err.message, failed_at: new Date().toISOString(),
    })
    throw err
  }
}

export async function scrapePermitSite(state: string, url: string) {
  const result = await crawlUrl(url)
  if (!result) return null

  const extraction = {
    state,
    url,
    content: result.markdown,
    extracted_at: new Date().toISOString(),
  }

  await supabase.from('hc_firecrawl_extractions').insert({
    source_url: url,
    source_type: 'permit_site',
    state,
    content: result.markdown,
    created_at: new Date().toISOString(),
  })

  return extraction
}

export async function crawlCompetitor(domain: string) {
  const urls = [
    `https://${domain}`,
    `https://${domain}/pricing`,
    `https://${domain}/about`,
  ]

  const results = []
  for (const url of urls) {
    try {
      const r = await crawlUrl(url)
      if (r) results.push({ url, content: r.markdown })
    } catch {}
  }

  await supabase.from('hc_firecrawl_observations').insert({
    domain,
    observation_type: 'competitor_crawl',
    data: results,
    observed_at: new Date().toISOString(),
  })

  return results
}
