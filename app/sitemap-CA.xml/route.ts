import { NextResponse } from 'next/server';

/**
 * /sitemap-CA.xml — Canada country-partitioned sitemap
 *
 * Covers: 10 provinces + territories, CA corridors (Trans-Canada, QE II, etc.),
 * CA ports, CA border crossings.
 */

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';
export const dynamic = 'force-dynamic';

const CA_PROVINCES = ['on', 'ab', 'bc', 'qc', 'sk', 'mb', 'nb', 'ns', 'nl', 'pe', 'nt', 'yt', 'nu'];

const CA_CORRIDORS: [string, string][] = [
    ['hwy-401', 'on'], ['hwy-400', 'on'], ['hwy-417', 'on'],
    ['hwy-20', 'qc'], ['hwy-40', 'qc'], ['hwy-15', 'qc'],
    ['trans-canada', 'bc'], ['trans-canada', 'ab'], ['trans-canada', 'sk'],
    ['trans-canada', 'mb'], ['trans-canada', 'on'], ['trans-canada', 'nb'],
    ['trans-canada', 'ns'], ['yellowhead', 'ab'], ['yellowhead', 'bc'],
    ['qeii', 'ab'],
];

const CA_PORTS = ['vancouver', 'prince-rupert', 'montreal', 'halifax', 'saint-john', 'hamilton-on'];
const CA_BORDERS = ['sweetgrass-coutts', 'pacific-highway', 'ambassador-bridge', 'peace-bridge', 'blue-water-bridge'];

const CA_COUNTIES = [
    'wood-buffalo-ab', 'grande-prairie-county-ab', 'northern-rockies-bc',
    'peace-river-bc', 'division-11-sk', 'division-16-sk', 'division-15-mb',
    'kenora-district-on', 'thunder-bay-district-on', 'sudbury-district-on',
];

function u(loc: string, priority: number, changefreq = 'weekly', lastmod?: string): string {
    const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `<url><loc>${DOMAIN}${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const urls: string[] = [];
    const now = new Date().toISOString();

    // ── Canada hub ──
    urls.push(u('/canada', 0.90, 'weekly', now));

    // ── Provinces ──
    CA_PROVINCES.forEach((prov, i) => {
        const p = Math.max(0.65, 0.85 - i * 0.01);
        urls.push(u(`/directory/ca/${prov}`, p, 'weekly'));
    });

    // ── Corridors ──
    CA_CORRIDORS.forEach(([hwy, prov]) =>
        urls.push(u(`/routes/${hwy}/${prov}/pilot-car`, 0.78, 'weekly'))
    );

    // ── Ports ──
    CA_PORTS.forEach(p => urls.push(u(`/port/${p}/escort-services`, 0.72, 'monthly')));

    // ── Border crossings ──
    CA_BORDERS.forEach(b => urls.push(u(`/border/${b}/escort-services`, 0.70, 'monthly')));

    // ── Counties/districts ──
    CA_COUNTIES.forEach(c => urls.push(u(`/county/${c}/pilot-car`, 0.68, 'weekly')));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
