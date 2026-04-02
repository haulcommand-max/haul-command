import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_URLS_PER_SITEMAP = 50000;
const CONSTANT_YIELDS = [
    'https://haulcommand.com/',
    'https://haulcommand.com/broker',
    'https://haulcommand.com/directory',
    'https://haulcommand.com/blog',
    'https://haulcommand.com/pricing'
];

export async function GET(req: Request) {
    const supabase = createClient();
    
    // 14. AUTOMATED SITEMAP CHUNKING (50k BLOCKS)
    // To prevent Googlebot timeout, we chunk the 1.5M operator dataset 
    const { url } = req;
    const urlObj = new URL(url);
    const chunkParam = urlObj.searchParams.get('chunk');

    let dynamicUrls: string[] = [];

    if (!chunkParam) {
        // If master sitemap limit requested, emit the SITEMAP_INDEX referencing the chunks
        const { count } = await supabase
           .from('hc_global_operators')
           .select('*', { count: 'exact', head: true })
           .eq('is_public', true);
        
        const totalRecords = count || 0;
        const totalChunks = Math.ceil(totalRecords / MAX_URLS_PER_SITEMAP);

        const sitemapIndexBody = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
              ...Array.from({ length: totalChunks }).map((_, i) => `
                <sitemap>
                    <loc>https://haulcommand.com/sitemap.xml?chunk=${i}</loc>
                    <lastmod>${new Date().toISOString()}</lastmod>
                </sitemap>
              `),
            `</sitemapindex>`
        ].join('\n');

        return new NextResponse(sitemapIndexBody, { 
            headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600' }
        });
    }

    // Process Specific Chunk Block
    const chunkId = parseInt(chunkParam, 10);
    const startIndex = chunkId * MAX_URLS_PER_SITEMAP;
    
    const { data: routeBlock } = await supabase
        .from('hc_global_operators')
        .select('slug, country_code, updated_at')
        .eq('is_public', true)
        .range(startIndex, startIndex + MAX_URLS_PER_SITEMAP - 1);
        
    if (routeBlock) {
        dynamicUrls = routeBlock.map(op => `https://haulcommand.com/directory/profile/${op.slug}`);
    }

    // Build standard URL payload
    const finalUrls = chunkId === 0 ? [...CONSTANT_YIELDS, ...dynamicUrls] : dynamicUrls;

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
}
