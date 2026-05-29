import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shouldIndexDirectoryOperator } from '@/lib/directory/operator-profile-seo';

const MAX_URLS_PER_SITEMAP = 50000;
const MAX_DYNAMIC_URLS_PER_SITEMAP = 45000;
const MAX_CHUNK_ZERO_EXTRA_URLS = MAX_URLS_PER_SITEMAP - MAX_DYNAMIC_URLS_PER_SITEMAP;
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
    '/rates/guide/pilot-car',
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
];

const CONSTANT_YIELDS = CANONICAL_STATIC_PATHS.map((path) => `${BASE}${path === '/' ? '' : path}`);

function uniqueUrls(urls: string[]) {
    return Array.from(new Set(urls.filter(Boolean)));
}

type SupabaseClient = ReturnType<typeof createClient>;

type SitemapPageRow = {
    page_url?: string | null;
    updated_at?: string | null;
    last_updated?: string | null;
    data_as_of?: string | null;
};

function escapeXml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toHaulCommandUrl(pathOrUrl?: string | null) {
    if (!pathOrUrl) return null;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;

    try {
        const parsed = trimmed.startsWith('http')
            ? new URL(trimmed)
            : new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, BASE);

        if (parsed.origin !== BASE) return null;
        return `${BASE}${parsed.pathname}`;
    } catch {
        return null;
    }
}

async function countRoleCountrySitemapUrls(supabase: SupabaseClient) {
    const coverageCount = await supabase
        .from('hc_role_country_coverage')
        .select('page_url', { count: 'estimated', head: true })
        .eq('index_verdict', 'index_now')
        .not('page_url', 'is', null);

    if (coverageCount.error) return 0;
    return coverageCount.count ?? 0;
}

async function fetchRoleCountrySitemapUrls(
    supabase: SupabaseClient,
    startIndex: number,
    endIndex: number,
) {
    if (endIndex < startIndex) return [];

    const fromCoverage = await supabase
        .from('hc_role_country_coverage')
        .select('page_url, data_as_of')
        .eq('index_verdict', 'index_now')
        .not('page_url', 'is', null)
        .order('page_url', { ascending: true })
        .range(startIndex, endIndex);

    if (!fromCoverage.error) {
        return ((fromCoverage.data ?? []) as SitemapPageRow[])
            .map((row) => toHaulCommandUrl(row.page_url))
            .filter((url): url is string => Boolean(url));
    }

    const fromEligibleView = await supabase
        .from('v_hc_sitemap_eligible_pages' as never)
        .select('page_url, last_updated')
        .like('page_url', '/directory/%/%')
        .order('page_url', { ascending: true })
        .range(startIndex, endIndex);

    if (fromEligibleView.error) return [];

    return ((fromEligibleView.data ?? []) as SitemapPageRow[])
        .map((row) => toHaulCommandUrl(row.page_url))
        .filter((url): url is string => Boolean(url));
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

            const totalOperatorRecords = count || 0;
            const totalRoleCountryRecords = await countRoleCountrySitemapUrls(supabase);
            const totalRecords = totalOperatorRecords + totalRoleCountryRecords;
            const totalChunks = Math.max(1, Math.ceil(totalRecords / MAX_DYNAMIC_URLS_PER_SITEMAP));

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

        const chunkId = Number.parseInt(chunkParam, 10);
        if (!Number.isFinite(chunkId) || chunkId < 0) {
            return new NextResponse('Invalid sitemap chunk', { status: 400 });
        }
        const startIndex = chunkId * MAX_DYNAMIC_URLS_PER_SITEMAP;
        const endIndex = startIndex + MAX_DYNAMIC_URLS_PER_SITEMAP - 1;

        const { count: operatorCount } = await supabase
            .from('hc_global_operators')
            .select('*', { count: 'estimated', head: true });

        const totalOperatorRecords = operatorCount || 0;
        const operatorStartIndex = startIndex;
        const operatorEndIndex = Math.min(endIndex, totalOperatorRecords - 1);

        const { data: routeBlock } = operatorStartIndex <= operatorEndIndex ? await supabase
            .from('hc_global_operators')
            .select('id, slug, name, city, admin1_code, country_code, claim_status, trust_score, metadata, updated_at')
            .range(operatorStartIndex, operatorEndIndex) : { data: null };

        if (routeBlock) {
            dynamicUrls = routeBlock
                .filter((op: any) => shouldIndexDirectoryOperator(op).index)
                .map((op: any) => `${BASE}/directory/dossier/${encodeURIComponent(op.slug || op.id)}`);
        }

        const roleCountryStartIndex = Math.max(0, startIndex - totalOperatorRecords);
        const roleCountryEndIndex = endIndex - totalOperatorRecords;
        if (roleCountryEndIndex >= 0) {
            dynamicUrls.push(...await fetchRoleCountrySitemapUrls(
                supabase,
                roleCountryStartIndex,
                roleCountryEndIndex,
            ));
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
                placeUrls.push(...corridors.map((c: any) => `${BASE}/corridors/${c.corridor_key}`));
            }
        }

        const chunkZeroExtraUrls = uniqueUrls([...CONSTANT_YIELDS, ...blogUrls, ...placeUrls])
            .slice(0, MAX_CHUNK_ZERO_EXTRA_URLS);
        const finalUrls = uniqueUrls(chunkId === 0
            ? [...chunkZeroExtraUrls, ...dynamicUrls]
            : dynamicUrls);

        const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${finalUrls.map((link) => `
          <url>
            <loc>${escapeXml(link)}</loc>
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
          ${CONSTANT_YIELDS.map((u) => `<url><loc>${escapeXml(u)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('')}
        </urlset>`;
        return new NextResponse(fallback, {
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=300' },
        });
    }
}
