import { NextResponse } from 'next/server';

/**
 * /sitemap-GB.xml — United Kingdom country-partitioned sitemap
 *
 * Covers: England, Scotland, Wales, N. Ireland regions,
 * motorway corridors, major ports.
 */

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';
export const dynamic = 'force-dynamic';

const GB_REGIONS = [
    'england', 'scotland', 'wales', 'northern-ireland',
    'south-east', 'north-west', 'west-midlands', 'yorkshire',
    'east-midlands', 'east-of-england', 'south-west', 'north-east',
];
const GB_METROS = [
    'london', 'manchester', 'birmingham', 'leeds', 'glasgow',
    'liverpool', 'bristol', 'sheffield', 'edinburgh', 'cardiff',
    'belfast', 'newcastle', 'nottingham', 'southampton', 'aberdeen',
];
const GB_CORRIDORS = [
    'm1-motorway', 'm6-motorway', 'm25-motorway', 'm62-motorway',
    'm4-motorway', 'm5-motorway', 'a1-road', 'm74-motorway',
    'm8-motorway', 'a9-road',
];
const GB_PORTS = [
    'felixstowe', 'southampton', 'london-gateway', 'liverpool',
    'tilbury', 'immingham', 'dover', 'hull',
];

function u(loc: string, priority: number, changefreq = 'weekly'): string {
    return `<url><loc>${DOMAIN}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const urls: string[] = [];

    urls.push(u('/gb', 0.85, 'weekly'));

    GB_REGIONS.forEach((r, i) => urls.push(u(`/directory/gb/${r}`, Math.max(0.55, 0.80 - i * 0.018), 'weekly')));
    GB_METROS.forEach(m => urls.push(u(`/directory/gb/metro/${m}`, 0.72, 'weekly')));
    GB_CORRIDORS.forEach(c => urls.push(u(`/corridors/${c}`, 0.74, 'weekly')));
    GB_PORTS.forEach(p => urls.push(u(`/ports/gb/port/${p}`, 0.68, 'monthly')));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
        },
    });
}
