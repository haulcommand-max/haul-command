import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_URLS_PER_SITEMAP = 50000;
const BASE = 'https://www.haulcommand.com';
const CONSTANT_YIELDS = [
    `${BASE}/`,
    `${BASE}/directory`,
    `${BASE}/glossary`,
    `${BASE}/requirements`,
    `${BASE}/blog`,
    `${BASE}/pricing`,
    `${BASE}/tools`,
    `${BASE}/rates`,
    `${BASE}/training`,
    `${BASE}/loads`,
    `${BASE}/reposition`,
    `${BASE}/claim`,
    `${BASE}/corridors`,
    `${BASE}/contact`,
    `${BASE}/available-now`,
    `${BASE}/regulations`,
    `${BASE}/resources`,
    `${BASE}/trucker-services`,
    `${BASE}/rates/height-pole`,
    `${BASE}/rates/route-survey`,
    `${BASE}/rates/bucket-truck`,
    `${BASE}/rates/police-escort`,
    `${BASE}/rates/night-moves`,
    `${BASE}/rates/multi-day`,
    `${BASE}/rates/deadhead`,
    `${BASE}/rates/wait-time`,
    `${BASE}/rates/us`,
    `${BASE}/rates/ca`,
    `${BASE}/rates/au`,
    `${BASE}/rates/gb`,
    `${BASE}/map`,
    // Specialty rate SEO pages
    `${BASE}/rates/pilot-car`,
    `${BASE}/rates/height-pole`,
    `${BASE}/rates/route-survey`,
    `${BASE}/rates/bucket-truck`,
    `${BASE}/rates/police-escort`,
    `${BASE}/rates/night-moves`,
    `${BASE}/rates/deadhead`,
    `${BASE}/rates/detention`,
    // Country rate pages
    `${BASE}/rates/us`, `${BASE}/rates/ca`, `${BASE}/rates/au`,
    `${BASE}/rates/gb`, `${BASE}/rates/de`, `${BASE}/rates/ae`,
    `${BASE}/rates/za`, `${BASE}/rates/br`, `${BASE}/rates/nz`,
    // Top state rate pages
    ...['tx','ca','fl','ny','la','oh','pa','mt','wy','co','ga','wa','or','az'].map(s => `${BASE}/rates/us/${s}`),
    // Role landing pages — commercial intent, high value
    `${BASE}/roles/pilot-car-operator`,
    `${BASE}/roles/broker`,
    `${BASE}/roles/heavy-haul-carrier`,
    `${BASE}/roles/dispatcher`,
    // Hyper-local SEO pages (top 50 US cities)
    ...['houston-tx','dallas-tx','san-antonio-tx','austin-tx','los-angeles-ca',
       'san-francisco-ca','san-diego-ca','phoenix-az','chicago-il','miami-fl',
       'orlando-fl','tampa-fl','jacksonville-fl','atlanta-ga','denver-co',
       'seattle-wa','portland-or','las-vegas-nv','nashville-tn','memphis-tn',
       'charlotte-nc','raleigh-nc','new-york-ny','philadelphia-pa','pittsburgh-pa',
       'detroit-mi','indianapolis-in','columbus-oh','cleveland-oh','kansas-city-mo',
       'st-louis-mo','oklahoma-city-ok','tulsa-ok','new-orleans-la','baton-rouge-la',
       'minneapolis-mn','milwaukee-wi','salt-lake-city-ut','albuquerque-nm',
       'birmingham-al','richmond-va','norfolk-va','louisville-ky','sacramento-ca',
       'el-paso-tx','midland-tx','boise-id','omaha-ne','des-moines-ia','little-rock-ar'
    ].map(c => `${BASE}/near/${c}`),
];

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
                `</sitemapindex>`
            ].join('\n');

            return new NextResponse(sitemapIndexBody, {
                headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600' }
            });
        }

        const chunkId = parseInt(chunkParam, 10);
        const startIndex = chunkId * MAX_URLS_PER_SITEMAP;

        const { data: routeBlock } = await supabase
            .from('hc_global_operators')
            .select('slug, country_code, updated_at')
            .range(startIndex, startIndex + MAX_URLS_PER_SITEMAP - 1);

        if (routeBlock) {
            dynamicUrls = routeBlock.map(op => `${BASE}/directory/profile/${op.slug}`);
        }

        // Add blog articles and trucker-services pages to chunk 0
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
            // Top 2000 trucker-services pages by demand_score
            const { data: places } = await supabase
                .from('hc_places')
                .select('slug')
                .not('slug', 'is', null)
                .order('demand_score', { ascending: false })
                .limit(2000);
            if (places) {
                placeUrls = places.map((p: any) => `${BASE}/trucker-services/${p.slug}`);
            }
            // Add corridor pages
            const { data: corridors } = await supabase
                .from('hc_corridors')
                .select('corridor_key')
                .not('corridor_key', 'is', null)
                .order('demand_score', { ascending: false });
            if (corridors) {
                placeUrls.push(...corridors.map((c: any) => `${BASE}/corridors/${c.corridor_key}`));
            }
        }

        const finalUrls = chunkId === 0
            ? [...CONSTANT_YIELDS, ...blogUrls, ...placeUrls, ...dynamicUrls]
            : dynamicUrls;

        const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${finalUrls.map(link => `
          <url>
            <loc>${link}</loc>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>`).join('')}
        </urlset>`;

        return new NextResponse(xmlTemplate, {
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=86400' }
        });
    } catch (e) {
        // Fallback: at minimum return the constant URLs as a valid sitemap
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${CONSTANT_YIELDS.map(u => `<url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('')}
        </urlset>`;
        return new NextResponse(fallback, {
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=300' }
        });
    }
}
