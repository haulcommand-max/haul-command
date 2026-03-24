import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://haulcommand.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  // Fetch blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(500);

  // Fetch active corridors
  const { data: corridors } = await supabase
    .from('corridors')
    .select('id, origin_state, destination_state, updated_at')
    .limit(300);

  // Fetch regulation pages
  const { data: regPages } = await supabase
    .from('regulation_pages')
    .select('jurisdiction, generated_at')
    .limit(100);

  // Static high-value pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/loads`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/route-check`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/corridors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/regulations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/partners`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/partners/autonomous-vehicles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/enterprise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/autonomous`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/rates`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/press`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/legal/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/legal/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.published_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Corridor intel pages
  const corridorPages: MetadataRoute.Sitemap = (corridors ?? []).map(c => ({
    url: `${BASE}/corridors/${c.origin_state?.toLowerCase()}-${c.destination_state?.toLowerCase()}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Regulation pages (57 countries)
  const regSitemapPages: MetadataRoute.Sitemap = (regPages ?? []).map(r => ({
    url: `${BASE}/regulations/${encodeURIComponent(r.jurisdiction.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: r.generated_at ? new Date(r.generated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...corridorPages,
    ...regSitemapPages,
  ];
}
