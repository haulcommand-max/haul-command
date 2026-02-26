export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /sitemap-seo.xml — dynamic sitemap for regulation + corridor SEO pages
export async function GET() {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    const { data: pages } = await supabase
        .from('seo_pages')
        .select('slug, type, updated_at, status')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

    const urls = (pages ?? []).map(p => {
        const loc = p.type === 'corridor'
            ? `${baseUrl}/corridors/${p.slug}`
            : `${baseUrl}/rules/${p.slug}`;
        const lastmod = p.updated_at
            ? new Date(p.updated_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        const priority = p.type === 'corridor' ? '0.7' : '0.8';
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
    });
}
