import { NextResponse } from 'next/server';
import { AI_ANSWER_SEEDS, LOAD_TYPES } from '@/lib/seo/pilot-car-taxonomy';

const BASE_URL = 'https://haulcommand.com';

export const dynamic = 'force-static';
export const revalidate = 86400;

function buildUrls(paths: string[], priority: string, freq: string) {
    return paths
        .map(
            (p) =>
                `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
        )
        .join('\n');
}

export async function GET() {
    const answerUrls = buildUrls(
        AI_ANSWER_SEEDS.map((a) => `/answers/${a.slug}`),
        '0.8',
        'monthly'
    );

    const industryUrls = buildUrls(
        LOAD_TYPES.map((l) => `/industries/${l.slug}`),
        '0.75',
        'monthly'
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${answerUrls}
${industryUrls}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
