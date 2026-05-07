import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_URLS_PER_SITEMAP = 50000;
const BASE = 'https://www.haulcommand.com';

const CANONICAL_STATIC_PATHS = [
    '/',
    '/directory',
    '/glossary',
    '/escort-requirements',
    '/blog',
    '/pricing',
    '/tools',
    '/rates',
    '/training',
    '/load-board',
    '/load-board/post',
    '/reposition',
    '/claim',
    '/corridor',
    '/contact',
    '/available-now',
    '/regulations',
    '/resources',
    '/resources/forms',
    '/trucker-services',
    '/advertise/buy',
    '/map',
    // Specialty rate SEO pages
    '/rates/pilot-car',
    '/rates/specialty/height-pole',
    '/rates/specialty/route-survey',
    '/rates/specialty/bucket-truck',
    '/rates/specialty/police-escort',
    '/rates/specialty/night-moves',
    '/rates/specialty/multi-day',
    '/rates/specialty/deadhead',
    '/rates/specialty/wait-time',
    '/rates/detention',
    // Country rate pages
    '/rates/us',
    '/rates/ca',
    '/rates/au',
    '/rates/gb',
    '/rates/de',
    '/rates/ae',
    '/rates/za',
    '/rates/br',
    '/rates/nz',
    // Role landing pages — commercial intent, high value
    '/roles/pilot-car-operator',
    '/roles/broker',
    '/roles/heavy-haul-carrier',
    '/roles/dispatcher',
    // Top state rate pages
    ...['tx', 'ca', 'fl', 'ny', 'la', 'oh', 'pa', 'mt', 'wy', 'co', 'ga', 'wa', 'or', 'az']
        .map((state) => `/rates/us/${state}`),
    // Hyper-local SEO pages (top 50 US cities)
    ...[
        'houston-tx', 'dallas-tx', 'san-antonio-tx', 'austin-tx', 'los-angeles-ca',
        'san-francisco-ca', 'san-diego-ca', 'phoenix-az', 'chicago-il', 'miami-fl',
        'orlando-fl', 'tampa-fl', 'jacksonville-fl', 'atlanta-ga', 'denver-co',
        'seattle-wa', 'portland-or', 'las-vegas-nv', 'nashville-tn', 'memphis-tn',
        'charlotte-nc', 'raleigh-nc', 'new-york-ny', 'philadelphia-pa', 'pittsburgh-pa',
        'detroit-mi', 'indianapolis-in', 'columbus-oh', 'cleveland-oh', 'kansas-city-mo',
        'st-louis-mo', 'oklahoma-city-ok', 'tulsa-ok', 'new-orleans-la', 'baton-rouge-la',
        'minneapolis-mn', 'milwaukee-wi', 'salt-lake-city-ut', 'albuquerque-nm',
        'birmingham-al', 'richmond-va', 'norfolk-va', 'louisville-ky', 'sacramento-ca',
        'el-paso-tx', 'midland-tx', 'boise-id', 'omaha-ne', 'des-moines-ia', 'little-rock-ar',
    ].map((city) => `/near/${city}`),
];

const CONSTANT_YIELDS = CANONICAL_STATIC_PATHS.map((path) => `${BASE}${path === '/' ? '' : path}`);

function uniqueUrls(urls: string[]) {
    return Array.from(new Set(urls.filter(Boolean)));
}

export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { url } = req;
        const urlObj = new URL(url);
        const chunkParam = urlObj.searchParams.get('chunk');

        let dynamicUrls: string[] = [];

        if (!chunkParam) {
            const { count } = await supabase
               .from('hc_global_operators')
               .select('*', { count: 'estimated', head: true });

            const totalRecords = count || 0;
            const totalChunks = Math.max(1, Math.ceil(totalRecords / MAX_URLS_PER_SITEMAP));

            const sitemapIndexBody = [
                `<?xml version="1.0" encoding="UTF-8"?>`,
                `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
                ...Array.from({ length: totalChunks }).map((_, i) => `
                    <sitemap>
                        <loc>${BASE}/sitemap.xml?chunk=${i}</loc>
                        <lastmod>${new Date().toISOString()}</lastmod>
                    </sitemap>
                `),
                `</sitemapindex>`,
            ].join('\n');

            return new NextResponse(sitemapIndexBody, {
                headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600' },
            });
        }

        const chunkId = parseInt(chunkParam, 10);
        const startIndex = chunkId * MAX_URLS_PER_SITEMAP;

        const { data: routeBlock } = await supabase
            .from('hc_global_operators')
            .select('slug, country_code, updated_at')
            .range(startIndex, startIndex + MAX_URLS_PER_SITEMAP - 1);

        if (routeBlock) {
            dynamicUrls = routeBlock.map((op) => `${BASE}/directory/profile/${op.slug}`);
        }

        // Add blog articles and trucker-services pages to chunk 0.
        let blogUrls: string[] = [];
        let placeUrls: string[] = [];
        if (chunkId === 0) {
            const { data: blogPosts } = await supabase
                .from('hc_blog_articles')
                .select('slug')
                .eq('status', 'published');
            if (blogPosts) {
                blogUrls = blogPosts.map((b: any) => `${BASE}/blog/${b.slug}`);
            }

            // Top 2000 trucker-services pages by demand_score.
            const { data: places } = await supabase
                .from('hc_places')
                .select('slug')
                .not('slug', 'is', null)
                .order('demand_score', { ascending: false })
                .limit(2000);
            if (places) {
                placeUrls = places.map((p: any) => `${BASE}/trucker-services/${p.slug}`);
            }

            // Add canonical corridor pages.
            const { data: corridors } = await supabase
                .from('hc_corridors')
                .select('corridor_key')
                .not('corridor_key', 'is', null)
                .order('demand_score', { ascending: false });
            if (corridors) {
                placeUrls.push(...corridors.map((c: any) => `${BASE}/corridor/${c.corridor_key}`));
            }
        }

        const finalUrls = uniqueUrls(chunkId === 0
            ? [...CONSTANT_YIELDS, ...blogUrls, ...placeUrls, ...dynamicUrls]
            : dynamicUrls);

        const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${finalUrls.map((link) => `
          <url>
            <loc>${link}</loc>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>`).join('')}
        </urlset>`;

        return new NextResponse(xmlTemplate, {
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=86400' },
        });
    } catch (e) {
        // Fallback: at minimum return the constant URLs as a valid sitemap.
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${CONSTANT_YIELDS.map((u) => `<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('')}
        </urlset>`;
        return new NextResponse(fallback, {
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=300' },
        });
    }
}
