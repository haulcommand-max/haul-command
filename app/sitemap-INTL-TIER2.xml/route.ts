import { NextResponse } from 'next/server';

/**
 * /sitemap-INTL-TIER2.xml — International Tier 2+3 sitemap
 *
 * Covers: NZ, SE, NO, AE, SA, ZA — heat-gated markets.
 * Lean sitemap: country hub + top regions + metros only.
 * Expands as heat data validates demand.
 */

const DOMAIN = process.env.DOMAIN || 'https://haulcommand.com';
export const dynamic = 'force-dynamic';

interface CountryData {
    code: string;
    regions: string[];
    metros: string[];
}

const TIER2_COUNTRIES: CountryData[] = [
    {
        code: 'nz',
        regions: ['auckland', 'canterbury', 'waikato', 'bay-of-plenty', 'wellington', 'otago'],
        metros: ['auckland', 'christchurch', 'wellington', 'hamilton', 'tauranga', 'dunedin'],
    },
    {
        code: 'se',
        regions: ['vastra-gotaland', 'stockholm', 'skane', 'ostergotland', 'vasterbotten', 'norrbotten'],
        metros: ['stockholm', 'gothenburg', 'malmo', 'uppsala', 'lulea', 'umea'],
    },
    {
        code: 'no',
        regions: ['vestland', 'oslo', 'rogaland', 'trondelag', 'nordland', 'viken'],
        metros: ['oslo', 'bergen', 'stavanger', 'trondheim', 'tromso', 'kristiansand'],
    },
    {
        code: 'ae',
        regions: ['dubai', 'abu-dhabi', 'sharjah', 'ras-al-khaimah', 'fujairah'],
        metros: ['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'al-ain'],
    },
    {
        code: 'sa',
        regions: ['riyadh', 'eastern-province', 'makkah', 'madinah', 'asir', 'tabuk'],
        metros: ['riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 'khobar'],
    },
    {
        code: 'za',
        regions: ['gauteng', 'western-cape', 'kwazulu-natal', 'eastern-cape', 'mpumalanga', 'limpopo'],
        metros: ['johannesburg', 'cape-town', 'durban', 'pretoria', 'port-elizabeth', 'east-london'],
    },
];

function u(loc: string, priority: number, changefreq = 'weekly'): string {
    return `<url><loc>${DOMAIN}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const urls: string[] = [];

    for (const country of TIER2_COUNTRIES) {
        urls.push(u(`/${country.code}`, 0.72, 'weekly'));
        country.regions.forEach(r => urls.push(u(`/directory/${country.code}/${r}`, 0.62, 'weekly')));
        country.metros.forEach(m => urls.push(u(`/directory/${country.code}/metro/${m}`, 0.60, 'weekly')));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=14400, s-maxage=14400, stale-while-revalidate=86400',
        },
    });
}
