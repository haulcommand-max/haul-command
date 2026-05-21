import { expect, test, type APIRequestContext } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function supabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY are required for tools registry e2e')
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function toolEligibleCount() {
  const { count, error } = await supabase()
    .from('v_sitemap_tools_eligible')
    .select('slug', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count || 0
}

async function verifiedCounts() {
  const { data, error } = await supabase()
    .from('v_tool_counts_verified')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('v_tool_counts_verified returned no rows')
  return data as { verified_live: number }
}

async function eligibleTools() {
  const { data, error } = await supabase()
    .from('v_sitemap_tools_eligible')
    .select('slug, page_url')
  if (error) throw new Error(error.message)
  return data || []
}

async function xmlLocs(request: APIRequestContext, path: string): Promise<string[]> {
  const response = await request.get(path)
  expect(response.ok()).toBeTruthy()
  const text = await response.text()
  const locs = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  if (text.includes('<sitemapindex')) {
    const nested = await Promise.all(locs.map((loc) => xmlLocs(request, new URL(loc).pathname + new URL(loc).search)))
    return nested.flat()
  }
  return locs
}

test.describe('tools registry substrate gate', () => {
  test('Open Tool buttons equal verified_live and all hrefs return 200', async ({ page, request }) => {
    const counts = await verifiedCounts()
    await page.goto('/tools')
    const openLinks = page.locator('[data-tool-cta="open"]')
    await expect(openLinks).toHaveCount(counts.verified_live)
    const hrefs = await openLinks.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute('href')).filter(Boolean))
    for (const href of hrefs) {
      const response = await request.get(href as string)
      expect(response.status(), `${href} should return HTTP 200`).toBe(200)
    }
  })

  test('eligible tool pages expose canonical, x-default hreflang, Organization JSON-LD, and tool schema', async ({ page }) => {
    for (const tool of await eligibleTools()) {
      if (!tool.page_url) continue
      await page.goto(tool.page_url)
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1)
      const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          try {
            const parsed = JSON.parse(node.textContent || '{}')
            return Array.isArray(parsed) ? parsed : [parsed]
          } catch {
            return []
          }
        })
      )
      expect(schemas.some((schema) => schema['@type'] === 'Organization'), `${tool.page_url} missing Organization schema`).toBeTruthy()
      expect(schemas.some((schema) => schema['@type'] && schema['@type'] !== 'Organization' && schema['@type'] !== 'WebSite' && schema['@type'] !== 'BreadcrumbList'), `${tool.page_url} missing tool-specific schema`).toBeTruthy()
    }
  })

  test('tool pages do not render fabricated operator or partner counts', async ({ page }) => {
    const banned = [/11,400/, /3,200 verified partners/i, /3,200/, /verified partners/i]
    for (const tool of await eligibleTools()) {
      if (!tool.page_url) continue
      await page.goto(tool.page_url)
      const body = await page.locator('body').innerText()
      for (const pattern of banned) {
        expect(pattern.test(body), `${tool.page_url} rendered banned claim ${pattern}`).toBeFalsy()
      }
    }
  })

  test('/sitemap.xml tool URL count matches v_sitemap_tools_eligible', async ({ request }) => {
    const expected = await toolEligibleCount()
    const locs = await xmlLocs(request, '/sitemap.xml')
    const toolLocs = locs.filter((loc) => new URL(loc).pathname.startsWith('/tools/'))
    expect(toolLocs.length).toBe(expected)
  })

  test('Escort Requirement Checker stays on its own route', async ({ page }) => {
    await page.goto('/tools/escort-requirement-checker')
    await expect(page).toHaveURL(/\/tools\/escort-requirement-checker/)
    await expect(page).not.toHaveURL(/\/tools\/escort-calculator/)
    await expect(page.locator('h1')).toHaveCount(1)
  })
})
