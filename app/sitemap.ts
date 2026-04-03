// app/sitemap.ts — Next.js dynamic sitemap
// Serves all published URLs from hc_sitemap_urls to Google/Bing/AI crawlers
// Next.js calls this automatically at /sitemap.xml
import { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = getSupabaseAdmin();

    // Pull all published URLs — Next.js handles 50k limit per file automatically
    const { data: urls } = await supabase
      .from('hc_sitemap_urls')
      .select('url, lastmod, priority, changefreq')
      .order('priority', { ascending: false })
      .limit(50000); // Google's limit per sitemap file

    if (!urls || urls.length === 0) {
      return getStaticFallback();
    }

    return urls.map(u => ({
      url: u.url,
      lastModified: u.lastmod ? new Date(u.lastmod) : new Date(),
      changeFrequency: (u.changefreq as MetadataRoute.Sitemap[0]['changeFrequency']) ?? 'weekly',
      priority: u.priority ?? 0.5,
    }));
  } catch {
    return getStaticFallback();
  }
}

function getStaticFallback(): MetadataRoute.Sitemap {
  const base = 'https://www.haulcommand.com';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tools/permit-checker/us`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tools/escort-rules/us`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/escort-requirements`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/directory/us`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/directory/ca`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/directory/au`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/directory/gb`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/glossary`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/training`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/advertise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/developers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },

    // ── Market / State Pages ────────────────────────────────────────────────
    ...['tx','ca','fl','il','oh','pa','ny','ga','nc','az','wa','co','mn','mi','tn','nv','or','mo','ok','al','la','sc','ky','ut','ia','ar','ms','ks','ne','id','nm','sd','nd','mt','wy','wv','vt','nh','me','ri','ct','de','md','va','in','wi','hi','ak'].map(state => ({
      url: `${base}/market/${state}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),

    // ── Find / Role / City — Highest Commercial Intent Family ───────────────
    ...[
      ['pilot-car-operator','houston'],['pilot-car-operator','dallas'],['pilot-car-operator','los-angeles'],
      ['pilot-car-operator','chicago'],['pilot-car-operator','phoenix'],['pilot-car-operator','san-antonio'],
      ['pilot-car-operator','miami'],['pilot-car-operator','denver'],['pilot-car-operator','atlanta'],
      ['pilot-car-operator','seattle'],['escort-vehicle-operator','houston'],['escort-vehicle-operator','dallas'],
      ['escort-vehicle-operator','los-angeles'],['escort-vehicle-operator','chicago'],
      ['height-pole-operator','houston'],['height-pole-operator','los-angeles'],
      ['route-survey-specialist','dallas'],['route-survey-specialist','chicago'],
    ].map(([role, city]) => ({
      url: `${base}/find/${role}/${city}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),

    // ── Corridors — High SEO ROI ────────────────────────────────────────────
    ...[
      ['tx','la'],['tx','nm'],['tx','ok'],['tx','ar'],['ca','az'],['ca','or'],['ca','nv'],
      ['fl','ga'],['fl','al'],['il','wi'],['il','in'],['oh','pa'],['oh','ky'],['ny','pa'],
      ['wa','or'],['co','ut'],['co','nm'],['mn','wi'],['mn','nd'],['ga','sc'],['ga','al'],
      ['nc','va'],['nc','sc'],['la','ms'],['la','al'],['ok','ks'],['ok','ar'],['az','nm'],
      ['az','ut'],['nv','ut'],['id','mt'],['id','or'],['wy','mt'],['wy','co'],['sd','nd'],
    ].map(([origin, dest]) => ({
      url: `${base}/corridors/${origin}/vs/${dest}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    // ── Best-For Pages ──────────────────────────────────────────────────────
    ...['oversize-load','wide-load','heavy-haul','wind-turbine','bridge-beam','oil-field-equipment',
        'construction-equipment','manufactured-home','crane','utility-poles'].map(loadType => ({
      url: `${base}/best-for/${loadType}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // ── Top Country Regulations ─────────────────────────────────────────────
    ...['us','ca','au','gb','de','nl','nz','za','mx','br','sg','ae','no','se','fr'].map(country => ({
      url: `${base}/regulations/${country}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];
}
