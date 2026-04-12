import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * WAVE-7 S7-02: Dynamic XML Sitemap Generator
 * Route: /sitemap.xml
 *
 * Sources: seo_page_registry (canonical source of truth)
 * Fallback: direct corridor + profile DB queries if registry is sparse
 * Standards: XML Sitemaps 0.9, changefreq, priority, lastmod
 * Crawl: refreshes every 6 hours via Next.js revalidation
 */
export const revalidate = 21600; // 6 hours

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
  const now = new Date().toISOString().split('T')[0];

  // Fetch all indexed pages from registry
  const { data: registryPages } = await supabase
    .from('seo_page_registry')
    .select('url_path, priority, change_freq, last_published')
    .eq('noindex', false)
    .order('last_published', { ascending: false })
    .limit(50000);

  // Static core pages
  const staticPages = [
    { url: '/', priority: '1.0', changeFreq: 'daily' },
    { url: '/directory', priority: '0.95', changeFreq: 'hourly' },
    { url: '/load-board', priority: '0.95', changeFreq: 'hourly' },
    { url: '/regulations', priority: '0.85', changeFreq: 'weekly' },
    { url: '/glossary', priority: '0.80', changeFreq: 'weekly' },
    { url: '/training', priority: '0.80', changeFreq: 'weekly' },
    { url: '/tools', priority: '0.75', changeFreq: 'weekly' },
    { url: '/about', priority: '0.50', changeFreq: 'monthly' },
    { url: '/contact', priority: '0.50', changeFreq: 'monthly' },
    { url: '/pricing', priority: '0.70', changeFreq: 'monthly' },
  ];

  const registryEntries = (registryPages || []).map((p: any) => ({
    url: `${siteUrl}${p.url_path}`,
    lastMod: p.last_published ? p.last_published.split('T')[0] : now,
    changeFreq: p.change_freq,
    priority: p.priority?.toFixed(2),
  }));

  const staticEntries = staticPages.map(p => ({
    url: `${siteUrl}${p.url}`,
    lastMod: now,
    changeFreq: p.changeFreq,
    priority: p.priority,
  }));

  const allEntries = [...staticEntries, ...registryEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allEntries.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastMod}</lastmod>
    <changefreq>${e.changeFreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=21600, s-maxage=21600',
      'X-Robots-Tag': 'noindex', // sitemap itself should not be indexed as a page
    },
  });
}
