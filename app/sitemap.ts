import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

/**
 * app/sitemap.ts
 * Haul Command — Dynamic Sitemap with <image:image> tags
 *
 * Covers:
 *   1. Static high-priority pages
 *   2. Operator profiles with operator vehicle images
 *   3. Corridor pages
 *   4. Regulation pages
 *   5. Load type hubs
 *   6. Compare pages
 *   7. Glossary
 *
 * Next.js sitemap() supports images via the `images` field on each URL.
 * Google Image Search reads image:image tags for ranking.
 */

const BASE = 'https://haulcommand.com';
const NOW = new Date().toISOString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // ── Static pages ──────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: NOW, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/directory`, lastModified: NOW, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${BASE}/loads`, lastModified: NOW, changeFrequency: 'daily', priority: 0.90 },
    { url: `${BASE}/rates/corridors`, lastModified: NOW, changeFrequency: 'daily', priority: 0.90 },
    { url: `${BASE}/regulations`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/training`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/glossary`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.80 },
    { url: `${BASE}/tools/permit-research`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.80 },
    { url: `${BASE}/tools/route-planner`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.80 },
    { url: `${BASE}/claim`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/partner/apply`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.70 },
    { url: `${BASE}/compare/us-pilot-cars-vs-haul-command`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.70 },
    { url: `${BASE}/compare/oversized-io-vs-haul-command`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.70 },
    { url: `${BASE}/compare/that-trucking-vs-haul-command`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.70 },
  ];

  // ── Load type hubs ────────────────────────────────────
  const loadTypes = ['wind-energy', 'transformers', 'mining-equipment', 'aerospace', 'bridge-beams', 'modular-homes'];
  const loadTypePages: MetadataRoute.Sitemap = loadTypes.map((t) => ({
    url: `${BASE}/loads/${t}`,
    lastModified: NOW,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // ── Operator profiles with images ────────────────────
  const { data: operators } = await supabase
    .from('operator_profiles')
    .select('id, updated_at, slug, primary_photo_url, display_name, city_name, region_code')
    .eq('visibility_status', 'public')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5000);

  const operatorPages: MetadataRoute.Sitemap = (operators ?? []).map((op: any) => ({
    url: `${BASE}/directory/operator/${op.slug ?? op.id}`,
    lastModified: op.updated_at ?? NOW,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
    ...(op.primary_photo_url
      ? { images: [op.primary_photo_url] }
      : {}),
  }));

  // ── Corridor pages ────────────────────────────────────
  const { data: corridors } = await supabase
    .from('hc_corridors')
    .select('id, slug, updated_at, origin, destination')
    .not('slug', 'is', null)
    .limit(1000);

  const corridorPages: MetadataRoute.Sitemap = (corridors ?? []).map((c: any) => ({
    url: `${BASE}/corridors/${c.slug ?? c.id}`,
    lastModified: c.updated_at ?? NOW,
    changeFrequency: 'weekly' as const,
    priority: 0.80,
  }));

  // ── Regulation pages ─────────────────────────────────
  const { data: regulations } = await supabase
    .from('hc_regulations')
    .select('jurisdiction_code, topic, updated_at')
    .limit(500);

  const regulationPages: MetadataRoute.Sitemap = (regulations ?? []).map((r: any) => ({
    url: `${BASE}/regulations/${r.jurisdiction_code?.toLowerCase().replace(':', '/')}/${r.topic}`,
    lastModified: r.updated_at ?? NOW,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  // ── Glossary terms ────────────────────────────────────
  const { data: glossaryTerms } = await supabase
    .from('hc_glossary')
    .select('slug, updated_at')
    .not('slug', 'is', null)
    .limit(300);

  const glossaryPages: MetadataRoute.Sitemap = (glossaryTerms ?? []).map((g: any) => ({
    url: `${BASE}/glossary/${g.slug}`,
    lastModified: g.updated_at ?? NOW,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  return [
    ...staticPages,
    ...loadTypePages,
    ...operatorPages,
    ...corridorPages,
    ...regulationPages,
    ...glossaryPages,
  ];
}
