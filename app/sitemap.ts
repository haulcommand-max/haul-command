// app/sitemap.ts — Next.js dynamic sitemap
// Serves all published URLs from hc_sitemap_urls to Google/Bing/AI crawlers
// Next.js calls this automatically at /sitemap.xml
import { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 3600; // regenerate every hour

const BASE = 'https://www.haulcommand.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = getSupabaseAdmin();

    // ── 1. Pull all registered URLs from hc_sitemap_urls ──
    const { data: dbUrls } = await supabase
      .from('hc_sitemap_urls')
      .select('url, lastmod, priority, changefreq')
      .order('priority', { ascending: false })
      .limit(48000); // reserve 2k slots for dynamic pages below

    type SitemapEntry = MetadataRoute.Sitemap[0];

    const registeredUrls: SitemapEntry[] = (dbUrls ?? []).map(u => ({
      url: u.url,
      lastModified: u.lastmod ? new Date(u.lastmod) : new Date(),
      changeFrequency: (u.changefreq as SitemapEntry['changeFrequency']) ?? 'weekly',
      priority: u.priority ?? 0.5,
    }));

    // ── 2. Corridor slug pages (new Corridor OS — not yet in hc_sitemap_urls) ──
    const { data: corridors } = await supabase
      .from('hc_corridors')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(500);

    const corridorUrls: SitemapEntry[] = (corridors ?? []).map(c => ({
      url: `${BASE}/corridors/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));

    // ── 3. Coming-soon / waitlist pages for dormant markets ──
    const { data: dormantCountries } = await supabase
      .from('hc_country_readiness')
      .select('country_code, updated_at')
      .in('market_mode', ['dormant'])
      .limit(200);

    const comingSoonUrls: SitemapEntry[] = (dormantCountries ?? []).map(c => ({
      url: `${BASE}/${c.country_code.toLowerCase()}/coming-soon`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }));

    // ── 4. Active country hub pages ──
    const { data: activeCountries } = await supabase
      .from('hc_country_readiness')
      .select('country_code, updated_at')
      .in('market_mode', ['active', 'seeded'])
      .limit(100);

    const countryUrls: SitemapEntry[] = (activeCountries ?? []).map(c => ({
      url: `${BASE}/${c.country_code.toLowerCase()}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // ── Combine and deduplicate by URL ──
    const allEntries = [
      ...registeredUrls,
      ...corridorUrls,
      ...comingSoonUrls,
      ...countryUrls,
    ];

    const seen = new Set<string>();
    const deduped = allEntries.filter(e => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

    // If no DB entries at all, return static fallback
    if (deduped.length === 0) return getStaticFallback();

    return deduped;

  } catch {
    return getStaticFallback();
  }
}

function getStaticFallback(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/tools/permit-checker/us`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/tools/escort-rules/us`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/escort-requirements`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/directory/us`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/directory/ca`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/directory/au`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/directory/gb`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/glossary`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/corridors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },

    // Broker + operator engagement surfaces (high search-volume intent pages)
    { url: `${BASE}/repositioning`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/available-now`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/leaderboards`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/load-board`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/claim`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/dashboard/broker`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
    { url: `${BASE}/roles/escort-provider`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/roles/pilot-car-operator`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/roles/heavy-haul-broker`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },

    // US state market pages
    ...['tx','ca','fl','il','oh','pa','ny','ga','nc','az','wa','co','mn','mi','tn','nv','or','mo','ok','al','la','sc','ky','ut','ia','ar','ms','ks','ne','id','nm','sd','nd','mt','wy','wv','vt','nh','me','ri','ct','de','md','va','in','wi','hi','ak'].map(state => ({
      url: `${BASE}/market/${state}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),

    // Corridor slug pages (static sample — 80 seeded US corridors)
    ...['houston-tx-to-beaumont-tx','houston-tx-to-baton-rouge-la','dallas-tx-to-oklahoma-city-ok',
        'los-angeles-ca-to-phoenix-az','chicago-il-to-detroit-mi','atlanta-ga-to-charlotte-nc',
        'miami-fl-to-jacksonville-fl','denver-co-to-salt-lake-city-ut','seattle-wa-to-portland-or',
        'kansas-city-mo-to-st-louis-mo'].map(slug => ({
      url: `${BASE}/corridors/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    // Dormant market coming-soon pages (slate/copper tier sample)
    ...['pl','cz','sk','hu','si','ee','lv','lt','hr','ro','bg','gr','tr','kw','om','bh',
        'sg','my','jp','kr','cl','ar','co','pe','vn','ph'].map(cc => ({
      url: `${BASE}/${cc}/coming-soon`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),

    // Top country regulation pages
    ...['us','ca','au','gb','de','nl','nz','za','mx','br','sg','ae','no','se','fr'].map(country => ({
      url: `${BASE}/regulations/${country}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];
}
