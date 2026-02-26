import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BASE_URL = 'https://haulcommand.com';

export const dynamic = 'force-dynamic';

/**
 * GET /sitemap-glossary.xml
 *
 * Glossary sitemap — only published + indexable terms.
 * Uses real lastmod from updated_at. Anti-thin gate: noindex terms excluded.
 */
export async function GET() {
    const supabase = await createClient();

    const { data: terms } = await supabase
        .from('glossary_public')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false });

    const urls: string[] = [
        // Glossary index page
        `  <url>\n    <loc>${BASE_URL}/glossary</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ];

    for (const t of terms ?? []) {
        const lastmod = t.updated_at
            ? new Date(t.updated_at).toISOString().split('T')[0]
            : '';
        const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
        urls.push(
            `  <url>\n    <loc>${BASE_URL}/glossary/${t.slug}</loc>${lastmodTag}\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
        );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
    });
}
