import { NextResponse } from 'next/server';

/**
 * /sitemap-US.xml — United States country-partitioned sitemap
 *
 * Covers: all 50 state hubs, US corridors, US ports, US counties,
 * US metro/city pages, emergency pages, tools, comparisons.
 * URLs are heat-sorted (high-priority pages first).
 */

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';
export const dynamic = 'force-dynamic';

const SERVICES = ['pilot-car', 'escort-vehicle', 'oversize-escort', 'wide-load-escort', 'super-load-escort', 'high-pole', 'mobile-home-escort', 'heavy-haul-escort'];
const US_STATES = ['tx', 'ca', 'fl', 'ga', 'oh', 'pa', 'il', 'ny', 'la', 'nc', 'tn', 'al', 'mi', 'az', 'ok', 'in', 'mo', 'ky', 'sc', 'ms', 'ar', 'va', 'mn', 'co', 'ks', 'ia', 'wi', 'wa', 'or', 'nv', 'ut', 'nm', 'nd', 'sd', 'wy', 'mt', 'ne', 'id', 'wv', 'md', 'nj', 'ct', 'de', 'nh', 'me', 'ma', 'ri', 'vt'];

const HIGHWAYS: Record<string, string[]> = {
    i10: ['ca', 'az', 'nm', 'tx', 'la', 'ms', 'al', 'fl'],
    i20: ['tx', 'la', 'ms', 'al', 'ga', 'sc'],
    i35: ['tx', 'ok', 'ks', 'mo', 'ia', 'mn'],
    i40: ['ca', 'az', 'nm', 'tx', 'ok', 'ar', 'tn', 'nc'],
    i70: ['ut', 'co', 'ks', 'mo', 'il', 'in', 'oh', 'wv', 'pa', 'md'],
    i75: ['fl', 'ga', 'tn', 'ky', 'oh', 'mi'],
    i80: ['ca', 'nv', 'ut', 'wy', 'ne', 'ia', 'il', 'in', 'oh', 'pa', 'nj'],
    i90: ['wa', 'id', 'mt', 'wy', 'sd', 'mn', 'wi', 'il', 'in', 'oh', 'pa', 'ny', 'ma'],
    i95: ['fl', 'ga', 'sc', 'nc', 'va', 'md', 'de', 'pa', 'nj', 'ny', 'ct', 'ri', 'ma', 'nh', 'me'],
    i15: ['ca', 'nv', 'ut', 'id', 'mt'],
    i25: ['nm', 'co', 'wy'],
    i45: ['tx'],
    i55: ['la', 'ms', 'tn', 'il'],
    i65: ['al', 'tn', 'ky', 'in'],
    i85: ['al', 'ga', 'sc', 'nc'],
    i94: ['mt', 'nd', 'mn', 'wi', 'il', 'in', 'mi'],
    i44: ['ok', 'mo'],
    i59: ['al', 'ms'],
    i64: ['mo', 'il', 'in', 'oh', 'wv', 'va'],
};

const US_PORTS = [
    'houston', 'los-angeles', 'long-beach', 'savannah', 'jacksonville', 'miami',
    'port-everglades', 'tampa', 'new-orleans', 'mobile', 'baltimore',
    'new-york-new-jersey', 'seattle', 'tacoma', 'oakland', 'norfolk',
];

const US_BORDERS = ['laredo', 'ambassador-bridge', 'peace-bridge', 'blue-water-bridge'];

const COUNTY_SLUGS = [
    'reeves-county-tx', 'pecos-county-tx', 'lea-county-nm', 'williams-county-nd',
    'stark-county-nd', 'sweetwater-county-wy', 'uintah-county-ut', 'kern-county-ca',
    'imperial-county-ca', 'mohave-county-az', 'yuma-county-az', 'finney-county-ks',
    'seward-county-ks', 'colfax-county-nm', 'eddy-county-nm', 'ward-county-nd',
    'dunn-county-nd', 'converse-county-wy', 'campbell-county-wy', 'lincoln-county-nv',
    'alachua-county-fl', 'marion-county-fl', 'dixie-county-fl', 'levy-county-fl',
    'columbia-county-fl', 'bell-county-tx', 'coryell-county-tx', 'mclennan-county-tx',
    'midland-county-tx', 'ector-county-tx', 'chatham-county-ga', 'bibb-county-ga',
    'lowndes-county-ga',
];

const EMERGENCY_SLUGS = ['emergency-pilot-car', 'last-minute-escort', 'same-day-pilot-car', '24-hour-pilot-car'];
const VERTICAL_SLUGS = ['mobile-home-transport', 'wind-turbine-transport', 'heavy-equipment-transport', 'farm-equipment-transport', 'boat-transport', 'modular-building-transport', 'crane-transport', 'transformer-transport'];

function u(loc: string, priority: number, changefreq = 'weekly', lastmod?: string): string {
    const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `<url><loc>${DOMAIN}${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const urls: string[] = [];
    const now = new Date().toISOString();

    // ── Tier 1: Money pages (priority 1.0 → 0.85) ──
    urls.push(u('/', 1.0, 'daily', now));
    urls.push(u('/loads', 0.95, 'always', now));
    urls.push(u('/directory', 0.93, 'daily', now));
    urls.push(u('/united-states', 0.92, 'weekly', now));
    urls.push(u('/tools', 0.88, 'weekly'));
    urls.push(u('/leaderboards', 0.85, 'daily', now));

    // ── Tier 1: US state hub pages (all 50 — highest heat first) ──
    US_STATES.forEach((st, i) => {
        const p = Math.max(0.70, 0.90 - i * 0.003);
        urls.push(u(`/directory/us/${st}`, p, 'weekly'));
        SERVICES.forEach(svc => urls.push(u(`/directory/us/${st}/${svc}`, p - 0.05, 'weekly')));
        urls.push(u(`/rates/${st}/pilot-car-cost`, p - 0.10, 'monthly'));
        urls.push(u(`/requirements/${st}/escort-vehicle-rules`, p - 0.10, 'monthly'));
    });

    // ── Corridor pages (high CPC — heat-sorted) ──
    Object.entries(HIGHWAYS).forEach(([hwy, states]) => {
        states.forEach(st => urls.push(u(`/routes/${hwy}/${st}/pilot-car`, 0.82, 'weekly')));
    });

    // ── Ports ──
    US_PORTS.forEach(p => urls.push(u(`/port/${p}/escort-services`, 0.78, 'monthly')));

    // ── Borders ──
    US_BORDERS.forEach(b => urls.push(u(`/border/${b}/escort-services`, 0.72, 'monthly')));

    // ── Counties ──
    COUNTY_SLUGS.forEach(s => urls.push(u(`/county/${s}/pilot-car`, 0.76, 'weekly')));

    // ── Emergency & Vertical ──
    EMERGENCY_SLUGS.forEach(s => urls.push(u(`/emergency/${s}`, 0.88, 'monthly')));
    VERTICAL_SLUGS.forEach(v => urls.push(u(`/industry/${v}/pilot-car`, 0.80, 'monthly')));

    // ── Tools ──
    ['permit-checker', 'rate-lookup', 'route-complexity', 'state-requirements', 'route-iq'].forEach(t =>
        urls.push(u(`/tools/${t}`, 0.80, 'monthly'))
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
