import { NextResponse } from 'next/server';

/**
 * /sitemap_index.xml — Master Sitemap Index
 *
 * Points Google to all country-partitioned sitemaps + specialist sitemaps.
 * Heat-ordered: highest-value countries listed first for crawl priority.
 *
 * Submit THIS file to Google Search Console as the primary sitemap.
 */

const BASE_URL = process.env.DOMAIN || 'https://haulcommand.com';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1h

// Country-partitioned sitemaps (heat-descending order)
const COUNTRY_SITEMAPS = [
    '/sitemap-US.xml',      // Tier 0: Primary market
    '/sitemap-CA.xml',      // Tier 0: Primary market
    '/sitemap-AU.xml',      // Tier A: Beachhead
    '/sitemap-GB.xml',      // Tier A: Beachhead
    '/sitemap-DE.xml',      // Tier B: Growth
    '/sitemap-INTL-TIER2.xml', // Tier B+C: NZ, SE, NO, AE, SA, ZA
];

// Specialist/content sitemaps
const SPECIALIST_SITEMAPS = [
    '/sitemap.xml',                     // Legacy mega-sitemap (US+CA dynamic)
    '/sitemap-seo.xml',                 // SEO programmatic pages
    '/sitemap-pilot-car-city.xml',      // City-level pilot car pages
    '/sitemap-corridors.xml',           // Corridor detail pages
    '/sitemap-answers-industries.xml',  // Answers + industry verticals
    '/sitemap-glossary.xml',            // Glossary terms
];

export async function GET() {
    const now = new Date().toISOString();

    const allSitemaps = [...COUNTRY_SITEMAPS, ...SPECIALIST_SITEMAPS];

    const entries = allSitemaps.map(
        (path) =>
            `  <sitemap>\n    <loc>${BASE_URL}${path}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`
    ).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
