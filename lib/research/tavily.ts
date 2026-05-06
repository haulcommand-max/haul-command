import { tavily } from '@tavily/core'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let _tavily: ReturnType<typeof tavily> | null = null
function getTavily() {
  if (!_tavily) {
    if (!process.env.TAVILY_API_KEY) throw new Error('TAVILY_API_KEY not set')
    _tavily = tavily({ apiKey: process.env.TAVILY_API_KEY })
  }
  return _tavily
}

async function saveSignals(results: any[], source_query: string, signal_type: string) {
  for (const r of results) {
    await supabase.from('hc_firecrawl_signals').insert({
      source: 'tavily',
      source_query,
      signal_type,
      url: r.url,
      title: r.title,
      content: r.content,
      score: r.score,
      created_at: new Date().toISOString(),
    })
  }
}

export async function searchIndustry(query: string, country?: string) {
  const fullQuery = country ? `${query} ${country} heavy haul transportation` : `${query} heavy haul transportation`
  const response = await getTavily().search(fullQuery, { maxResults: 10, searchDepth: 'advanced' })
  await saveSignals(response.results, fullQuery, 'industry_intel')
  return response.results
}

export async function searchCompetitors(competitors: string[]) {
  const results: any[] = []
  for (const name of competitors) {
    const response = await getTavily().search(`${name} oversize heavy haul pricing features 2025`, { maxResults: 5 })
    await saveSignals(response.results, name, 'competitor_intel')
    results.push({ competitor: name, results: response.results })
  }
  return results
}

export async function searchPermitChanges(state: string) {
  const query = `${state} oversize overweight permit requirements changes 2025`
  const response = await getTavily().search(query, { maxResults: 8, searchDepth: 'advanced' })
  await saveSignals(response.results, query, 'permit_change')
  return response.results
}

export async function searchCorridorIntel(corridor: string) {
  const query = `${corridor} oversize load route permit requirements`
  const response = await getTavily().search(query, { maxResults: 6 })
  await saveSignals(response.results, query, 'corridor_intel')
  return response.results
}
