import { supabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PRIORITY_CITIES } from '@/lib/seo/city-data';
import { getIndexableCities } from '@/lib/seo/indexability';

// ── Killer Move URL sets ──────────────────────────────────────
const EMERGENCY_SLUGS = ['emergency-pilot-car', 'last-minute-escort', 'same-day-pilot-car', '24-hour-pilot-car'];
const VERTICAL_SLUGS = ['mobile-home-transport', 'wind-turbine-transport', 'heavy-equipment-transport', 'farm-equipment-transport', 'boat-transport', 'modular-building-transport', 'crane-transport', 'transformer-transport'];
const COMPETITOR_SLUGS = ['truckstop', 'dat-freight', 'uship'];
const COUNTY_SLUGS = ['reeves-county-tx', 'pecos-county-tx', 'lea-county-nm', 'williams-county-nd', 'stark-county-nd', 'sweetwater-county-wy', 'uintah-county-ut', 'kern-county-ca', 'imperial-county-ca', 'mohave-county-az', 'yuma-county-az', 'finney-county-ks', 'seward-county-ks', 'colfax-county-nm', 'eddy-county-nm', 'ward-county-nd', 'dunn-county-nd', 'converse-county-wy', 'campbell-county-wy', 'lincoln-county-nv', 'alachua-county-fl', 'marion-county-fl', 'dixie-county-fl', 'levy-county-fl', 'columbia-county-fl', 'bell-county-tx', 'coryell-county-tx', 'mclennan-county-tx', 'midland-county-tx', 'ector-county-tx', 'chatham-county-ga', 'bibb-county-ga', 'lowndes-county-ga', 'wood-buffalo-ab', 'grande-prairie-county-ab', 'northern-rockies-bc', 'peace-river-bc', 'division-11-sk', 'division-16-sk', 'division-15-mb', 'kenora-district-on', 'thunder-bay-district-on', 'sudbury-district-on'];

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';

// All services
const SERVICES = ['pilot-car', 'escort-vehicle', 'oversize-escort', 'wide-load-escort', 'super-load-escort', 'high-pole', 'mobile-home-escort', 'heavy-haul-escort'];
const US_STATES = ['al', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'];
const CA_PROVINCES = ['ab', 'bc', 'mb', 'nb', 'nl', 'ns', 'on', 'pe', 'qc', 'sk'];
const HIGHWAYS = ['i10', 'i20', 'i35', 'i40', 'i70', 'i75', 'i80', 'i90', 'i95'];
const HWY_STATES: Record<string, string[]> = {
    i10: ['ca', 'az', 'nm', 'tx', 'la', 'ms', 'al', 'fl'], i20: ['tx', 'la', 'ms', 'al', 'ga', 'sc'],
    i35: ['tx', 'ok', 'ks', 'mo', 'ia', 'mn'], i40: ['ca', 'az', 'nm', 'tx', 'ok', 'ar', 'tn', 'nc'],
    i70: ['ut', 'co', 'ks', 'mo', 'il', 'in', 'oh', 'wv', 'pa', 'md'], i75: ['fl', 'ga', 'tn', 'ky', 'oh', 'mi'],
    i80: ['ca', 'nv', 'ut', 'wy', 'ne', 'ia', 'il', 'in', 'oh', 'pa', 'nj'],
    i90: ['wa', 'id', 'mt', 'wy', 'sd', 'mn', 'wi', 'il', 'in', 'oh', 'pa', 'ny', 'ma'],
    i95: ['fl', 'ga', 'sc', 'nc', 'va', 'md', 'de', 'pa', 'nj', 'ny', 'ct', 'ri', 'ma', 'nh', 'me'],
};
const PORTS = ['houston', 'long-beach', 'savannah', 'norfolk', 'new-orleans', 'mobile', 'tampa', 'seattle'];
const BORDERS = ['ambassador-bridge', 'peace-bridge', 'blue-water-bridge', 'laredo', 'sweetgrass-coutts', 'pacific-highway'];
const COMPARISONS = ['pilot-car-vs-police-escort', 'escort-vehicle-requirements-by-state'];
const RADII = ['25', '50', '100', '150'];

export async function GET() {
    const supabase = supabaseServer();

    const [profilesRes, loadsRes] = await Promise.all([
        supabase.from('profiles').select('id, updated_at').eq('is_public', true).limit(5000),
        supabase.from('directory_active_loads_view').select('load_id').limit(500),
    ]);

    const now = new Date().toISOString();
    let urls: string[] = [];

    // ── Static pages ────────────────────────────────────────────
    urls.push(...[
        `<url><loc>${DOMAIN}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
        `<url><loc>${DOMAIN}/loads</loc><changefreq>always</changefreq><priority>0.95</priority></url>`,
        `<url><loc>${DOMAIN}/directory</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
        `<url><loc>${DOMAIN}/leaderboards</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`,
        `<url><loc>${DOMAIN}/tools</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>`,
        `<url><loc>${DOMAIN}/tools/permit-checker</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
        `<url><loc>${DOMAIN}/tools/rate-lookup</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
        `<url><loc>${DOMAIN}/tools/route-complexity</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
        `<url><loc>${DOMAIN}/tools/state-requirements</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
        `<url><loc>${DOMAIN}/services/marketplace</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
        `<url><loc>${DOMAIN}/jobs</loc><changefreq>daily</changefreq><priority>0.85</priority></url>`,
    ]);

    // ── 200 Priority Cities × 3 patterns (services, jobs, directory) ─
    const usCities = PRIORITY_CITIES.filter(c => c.country === 'US');
    const caCities = PRIORITY_CITIES.filter(c => c.country === 'CA');

    usCities.forEach(c => {
        const slug = c.slug;
        const st = c.state.toLowerCase();
        urls.push(`<url><loc>${DOMAIN}/directory/us/${st}/${slug}</loc><changefreq>weekly</changefreq><priority>0.82</priority></url>`);
        SERVICES.forEach(svc => {
            urls.push(`<url><loc>${DOMAIN}/directory/us/${st}/${slug}/${svc}</loc><changefreq>weekly</changefreq><priority>0.78</priority></url>`);
        });
        // Metro radius for metro cities
        if (c.isMetro) {
            RADII.forEach(r => urls.push(`<url><loc>${DOMAIN}/near/${slug}/pilot-car-within-${r}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`));
        }
    });

    caCities.forEach(c => {
        const slug = c.slug;
        const prov = c.state.toLowerCase();
        urls.push(`<url><loc>${DOMAIN}/directory/ca/${prov}/${slug}</loc><changefreq>weekly</changefreq><priority>0.78</priority></url>`);
    });

    // ── State pages × services ───────────────────────────────────
    US_STATES.forEach(st => {
        urls.push(`<url><loc>${DOMAIN}/directory/us/${st}</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>`);
        SERVICES.forEach(svc => {
            urls.push(`<url><loc>${DOMAIN}/directory/us/${st}/${svc}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
        });
        urls.push(`<url><loc>${DOMAIN}/rates/${st}/pilot-car-cost</loc><changefreq>monthly</changefreq><priority>0.75</priority></url>`);
        urls.push(`<url><loc>${DOMAIN}/requirements/${st}/escort-vehicle-rules</loc><changefreq>monthly</changefreq><priority>0.75</priority></url>`);
    });

    // ── Canada provinces ─────────────────────────────────────────
    CA_PROVINCES.forEach(prov => {
        urls.push(`<url><loc>${DOMAIN}/directory/ca/${prov}</loc><changefreq>weekly</changefreq><priority>0.75</priority></url>`);
    });

    // ── Corridor pages ───────────────────────────────────────────
    HIGHWAYS.forEach(hwy => {
        (HWY_STATES[hwy] || []).forEach(st => {
            urls.push(`<url><loc>${DOMAIN}/routes/${hwy}/${st}/pilot-car</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
        });
    });

    // ── Port + border + comparison ───────────────────────────────
    PORTS.forEach(p => urls.push(`<url><loc>${DOMAIN}/port/${p}/escort-services</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`));
    BORDERS.forEach(b => urls.push(`<url><loc>${DOMAIN}/border/${b}/escort-services</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`));
    COMPARISONS.forEach(c => urls.push(`<url><loc>${DOMAIN}/compare/${c}</loc><changefreq>monthly</changefreq><priority>0.65</priority></url>`));

    // ── Killer Move #2: Emergency pages ─────────────────────────
    EMERGENCY_SLUGS.forEach(s => urls.push(`<url><loc>${DOMAIN}/emergency/${s}</loc><changefreq>monthly</changefreq><priority>0.88</priority></url>`));

    // ── Killer Move #3: Industry verticals ──────────────────────
    VERTICAL_SLUGS.forEach(v => urls.push(`<url><loc>${DOMAIN}/industry/${v}/pilot-car</loc><changefreq>monthly</changefreq><priority>0.82</priority></url>`));

    // ── Killer Move #4: Competitor intercepts ────────────────────
    COMPETITOR_SLUGS.forEach(c => urls.push(`<url><loc>${DOMAIN}/alternatives/${c}</loc><changefreq>monthly</changefreq><priority>0.75</priority></url>`));

    // ── County Sniper: 43 priority counties ─────────────────────
    COUNTY_SLUGS.forEach(s => urls.push(`<url><loc>${DOMAIN}/county/${s}/pilot-car</loc><changefreq>weekly</changefreq><priority>0.78</priority></url>`));

    // ── Corridor expansion (Domination Pack v2 — 20 US hwys) ────
    const EXTRA_HWY_STATES: Record<string, string[]> = {
        i15: ['ca', 'nv', 'ut', 'id', 'mt'], i25: ['nm', 'co', 'wy'],
        i45: ['tx'], i55: ['la', 'ms', 'tn', 'il'],
        i65: ['al', 'tn', 'ky', 'in'], i85: ['al', 'ga', 'sc', 'nc'],
        i94: ['mt', 'nd', 'mn', 'wi', 'il', 'in', 'mi'],
        i44: ['ok', 'mo'], i59: ['al', 'ms'],
        i64: ['mo', 'il', 'in', 'oh', 'wv', 'va'],
    };
    Object.entries(EXTRA_HWY_STATES).forEach(([hwy, states]) =>
        states.forEach(st => urls.push(`<url><loc>${DOMAIN}/routes/${hwy}/${st}/pilot-car</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`))
    );

    // Canada corridors (Domination Pack v2)
    const CA_CORRIDORS = [
        ['hwy-401', 'on'], ['hwy-400', 'on'], ['hwy-417', 'on'],
        ['hwy-20', 'qc'], ['hwy-40', 'qc'], ['hwy-15', 'qc'],
        ['trans-canada', 'bc'], ['trans-canada', 'ab'], ['trans-canada', 'sk'],
        ['trans-canada', 'mb'], ['trans-canada', 'on'], ['trans-canada', 'nb'],
        ['trans-canada', 'ns'], ['yellowhead', 'ab'], ['yellowhead', 'bc'],
        ['qeii', 'ab'],
    ];
    CA_CORRIDORS.forEach(([hwy, prov]) =>
        urls.push(`<url><loc>${DOMAIN}/routes/${hwy}/${prov}/pilot-car</loc><changefreq>weekly</changefreq><priority>0.75</priority></url>`)
    );

    // Expanded port list (Domination Pack v2 — 22 ports)
    const ALL_PORTS = [
        'los-angeles', 'long-beach', 'houston', 'savannah', 'jacksonville', 'miami',
        'port-everglades', 'tampa', 'new-orleans', 'mobile', 'baltimore',
        'new-york-new-jersey', 'seattle', 'tacoma', 'oakland', 'norfolk',
        'vancouver', 'prince-rupert', 'montreal', 'halifax', 'saint-john', 'hamilton-on',
    ];
    ALL_PORTS.filter(p => !PORTS.includes(p)).forEach(p =>
        urls.push(`<url><loc>${DOMAIN}/port/${p}/escort-services</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    );

    // Police escort comparison + superload pages
    const AUTHORITY_SLUGS = ['police-escort-vs-pilot-car', 'superload-escort-requirements', 'twic-escort-requirements'];
    AUTHORITY_SLUGS.forEach(s => urls.push(`<url><loc>${DOMAIN}/compare/${s}</loc><changefreq>monthly</changefreq><priority>0.65</priority></url>`));


    // ── Dynamic: DB cities — PROGRESSIVE via unified indexability engine ──
    // Only includes cities with real entities, revenue-weighted priority, real lastmod
    const indexableCities = await getIndexableCities(45000);

    for (const city of indexableCities) {
        const sitemapPriority = Math.min(0.85, Math.max(0.5, city.priority)).toFixed(2);
        const lastmodTag = city.lastmod ? `<lastmod>${city.lastmod}</lastmod>` : '';
        urls.push(`<url><loc>${DOMAIN}/directory/${city.country}/${city.state}/${city.slug}</loc>${lastmodTag}<changefreq>weekly</changefreq><priority>${sitemapPriority}</priority></url>`);
    }

    // ── Dynamic: profiles ────────────────────────────────────────
    (profilesRes.data ?? []).forEach((p: any) => {
        urls.push(`<url><loc>${DOMAIN}/claim/${p.id}</loc><lastmod>${p.updated_at || now}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    });

    // ── Dynamic: loads ───────────────────────────────────────────
    (loadsRes.data ?? []).forEach((l: any) => {
        urls.push(`<url><loc>${DOMAIN}/loads/${l.load_id}</loc><changefreq>always</changefreq><priority>0.5</priority></url>`);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
