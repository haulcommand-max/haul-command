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
  ];
}
