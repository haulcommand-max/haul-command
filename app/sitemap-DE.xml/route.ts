import { NextResponse } from 'next/server';

/**
 * /sitemap-DE.xml — Germany country-partitioned sitemap
 *
 * Covers: 16 Bundesländer, major Autobahn corridors,
 * industrial metros, ports.
 * Uses "Schwertransport" / "Begleitfahrzeug" terminology.
 */

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';
export const dynamic = 'force-dynamic';

const DE_STATES = [
    'nrw', 'bayern', 'baden-wuerttemberg', 'niedersachsen',
    'hessen', 'sachsen', 'rheinland-pfalz', 'berlin',
    'schleswig-holstein', 'brandenburg', 'thueringen',
    'sachsen-anhalt', 'mecklenburg-vorpommern', 'hamburg',
    'saarland', 'bremen',
];
const DE_METROS = [
    'berlin', 'hamburg', 'muenchen', 'koeln', 'frankfurt',
    'stuttgart', 'duesseldorf', 'dortmund', 'essen', 'leipzig',
    'bremen', 'dresden', 'hannover', 'nuernberg', 'duisburg',
];
const DE_CORRIDORS = [
    'a1-autobahn', 'a2-autobahn', 'a3-autobahn', 'a4-autobahn',
    'a5-autobahn', 'a6-autobahn', 'a7-autobahn', 'a8-autobahn',
    'a9-autobahn', 'a10-autobahn',
];
const DE_PORTS = ['hamburg', 'bremerhaven', 'wilhelmshaven', 'rostock', 'duisburg-inland'];

function u(loc: string, priority: number, changefreq = 'weekly'): string {
    return `<url><loc>${DOMAIN}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const urls: string[] = [];

    urls.push(u('/de', 0.82, 'weekly'));

    DE_STATES.forEach((st, i) => urls.push(u(`/directory/de/${st}`, Math.max(0.55, 0.78 - i * 0.012), 'weekly')));
    DE_METROS.forEach(m => urls.push(u(`/directory/de/metro/${m}`, 0.70, 'weekly')));
    DE_CORRIDORS.forEach(c => urls.push(u(`/corridors/${c}`, 0.72, 'weekly')));
    DE_PORTS.forEach(p => urls.push(u(`/ports/de/port/${p}`, 0.66, 'monthly')));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
        },
    });
}
