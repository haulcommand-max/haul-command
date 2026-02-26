import { NextResponse } from 'next/server';

/**
 * /sitemap-AU.xml — Australia country-partitioned sitemap
 *
 * Covers: 8 states/territories, major AU corridors,
 * mining/industrial ports, metro areas.
 */

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';
export const dynamic = 'force-dynamic';

const AU_STATES = ['nsw', 'qld', 'vic', 'wa', 'sa', 'tas', 'nt', 'act'];
const AU_METROS = [
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide',
    'newcastle', 'gold-coast', 'townsville', 'darwin',
    'wollongong', 'geelong', 'cairns',
];
const AU_CORRIDORS = [
    'pacific-highway', 'bruce-highway', 'hume-highway',
    'great-western-highway', 'princes-highway', 'great-northern-highway',
    'stuart-highway', 'eyre-highway',
];
const AU_PORTS = [
    'melbourne', 'sydney', 'brisbane', 'fremantle',
    'port-hedland', 'gladstone', 'port-kembla', 'adelaide',
];

function u(loc: string, priority: number, changefreq = 'weekly', lastmod?: string): string {
    const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `<url><loc>${DOMAIN}${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const urls: string[] = [];

    // Country hub
    urls.push(u('/au', 0.85, 'weekly'));

    // States
    AU_STATES.forEach((st, i) => urls.push(u(`/directory/au/${st}`, Math.max(0.60, 0.80 - i * 0.02), 'weekly')));

    // Metro cities
    AU_METROS.forEach(m => urls.push(u(`/directory/au/metro/${m}`, 0.72, 'weekly')));

    // Corridors
    AU_CORRIDORS.forEach(c => urls.push(u(`/corridors/${c}`, 0.75, 'weekly')));

    // Ports
    AU_PORTS.forEach(p => urls.push(u(`/ports/au/port/${p}`, 0.70, 'monthly')));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
        },
    });
}
