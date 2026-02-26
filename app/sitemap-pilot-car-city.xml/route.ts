import { NextResponse } from 'next/server';
import { getAllCitySlugs } from '@/lib/seo/pilot-car-taxonomy';
import { getIndexableCities } from '@/lib/seo/indexability';

const BASE_URL = 'https://haulcommand.com';
const MAX_URLS = 45000;

export const dynamic = 'force-dynamic'; // needs DB for indexability check
export const revalidate = 86400; // 24h

/**
 * GET /sitemap-pilot-car-city.xml
 *
 * Progressive sitemap — only includes taxonomy cities that are indexable.
 * Priority is revenue-weighted. Lastmod uses real data signals.
 * Cities below threshold are excluded (not surfaced with noindex).
 */
export async function GET() {
    // Get taxonomy slugs
    const taxonomySlugs = getAllCitySlugs();

    // Get indexable cities from DB (with priority + lastmod)
    const indexableCities = await getIndexableCities(MAX_URLS);

    // Build lookup for fast matching
    const indexableSet = new Set(
        indexableCities.map(c => `${c.state}/${c.slug}`)
    );
    const indexableMap = new Map(
        indexableCities.map(c => [`${c.state}/${c.slug}`, c])
    );

    // Only include taxonomy cities that are indexable
    const urls: string[] = [];
    for (const { stateSlug, citySlug } of taxonomySlugs) {
        const key = `${stateSlug}/${citySlug}`;

        // Check if this city is indexable (has entities/content)
        const cityData = indexableMap.get(key);

        if (cityData || indexableSet.has(key)) {
            const priority = cityData?.priority ?? 0.5;
            const sitemapPriority = Math.min(0.9, Math.max(0.3, priority)).toFixed(2);
            const lastmod = cityData?.lastmod
                ? `\n    <lastmod>${cityData.lastmod}</lastmod>`
                : '';

            urls.push(
                `  <url>\n    <loc>${BASE_URL}/pilot-car/${stateSlug}/${citySlug}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>${sitemapPriority}</priority>\n  </url>`
            );
        }

        if (urls.length >= MAX_URLS) break;
    }

    // Also include indexable cities NOT in taxonomy (DB-only cities)
    for (const city of indexableCities) {
        const key = `${city.state}/${city.slug}`;
        const alreadyIncluded = taxonomySlugs.some(
            t => `${t.stateSlug}/${t.citySlug}` === key
        );
        if (!alreadyIncluded && urls.length < MAX_URLS) {
            const sitemapPriority = Math.min(0.9, Math.max(0.3, city.priority)).toFixed(2);
            const lastmod = city.lastmod ? `\n    <lastmod>${city.lastmod}</lastmod>` : '';
            urls.push(
                `  <url>\n    <loc>${BASE_URL}/pilot-car/${city.state}/${city.slug}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>${sitemapPriority}</priority>\n  </url>`
            );
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
}
