import { NextResponse } from 'next/server';
import { MAJOR_CORRIDORS } from '@/lib/seo/pilot-car-taxonomy';

const BASE_URL = 'https://haulcommand.com';

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
    const urls = MAJOR_CORRIDORS.map(
        (c) =>
            `  <url>\n    <loc>${BASE_URL}/corridors/${c.slug}/pilot-car</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>`
    ).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
