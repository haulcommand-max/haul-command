/**
 * International Sitemap Generator
 *
 * Architecture:
 *   /sitemap.xml → master index
 *   /sitemaps/{country}-{lang}/sitemap-index.xml → locale index
 *   /sitemaps/{country}-{lang}/{template}.xml → template partition
 *
 * Each partition includes:
 *   - <loc> for indexable URLs only
 *   - <xhtml:link> for full hreflang mesh per concept
 *   - <lastmod> from seo_page_variants.updated_at
 */

import { createClient } from '@supabase/supabase-js';
import { getHreflangSetsForSitemap } from './hreflang';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

// ── Types ──────────────────────────────────────────────────────────────────

type SitemapUrl = {
    loc: string;
    lastmod: string;
    hreflangLinks: Array<{ hreflang: string; href: string }>;
};

type LocaleInfo = {
    country_code: string;
    language_code: string;
    hreflang: string;
};

// ── Active Locales ─────────────────────────────────────────────────────────

export async function getActiveLocales(): Promise<LocaleInfo[]> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data } = await supabase
        .from('seo_locales')
        .select('country_code, language_code, hreflang')
        .eq('is_active', true)
        .order('country_code');

    return data || [];
}

// ── Template Keys ──────────────────────────────────────────────────────────

export async function getTemplateKeysForLocale(
    countryCode: string,
    languageCode: string,
): Promise<string[]> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data } = await supabase
        .from('v_sitemap_urls')
        .select('template_key')
        .eq('country_code', countryCode.toUpperCase())
        .eq('language_code', languageCode);

    if (!data?.length) return [];
    return [...new Set(data.map((d) => d.template_key))].sort();
}

// ── Master Sitemap Index ───────────────────────────────────────────────────

export async function generateMasterSitemapIndex(): Promise<string> {
    const locales = await getActiveLocales();
    const today = new Date().toISOString().split('T')[0];

    const entries = locales.map((l) => {
        const slug = `${l.country_code.toLowerCase()}-${l.language_code}`;
        return `  <sitemap>
    <loc>${SITE_URL}/sitemaps/${slug}/sitemap-index.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`;
}

// ── Locale Sitemap Index ───────────────────────────────────────────────────

export async function generateLocaleSitemapIndex(
    countryCode: string,
    languageCode: string,
): Promise<string> {
    const templates = await getTemplateKeysForLocale(countryCode, languageCode);
    const today = new Date().toISOString().split('T')[0];
    const slug = `${countryCode.toLowerCase()}-${languageCode}`;

    const entries = templates.map((t) =>
        `  <sitemap>
    <loc>${SITE_URL}/sitemaps/${slug}/${t}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`,
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`;
}

// ── Template Partition Sitemap (with hreflang) ─────────────────────────────

export async function generateTemplateSitemap(
    countryCode: string,
    languageCode: string,
    templateKey: string,
): Promise<string> {
    const sets = await getHreflangSetsForSitemap(countryCode, languageCode, templateKey);

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get URLs for this locale + template
    const { data: urls } = await supabase
        .from('v_sitemap_urls')
        .select('path, lastmod, concept_id')
        .eq('country_code', countryCode.toUpperCase())
        .eq('language_code', languageCode)
        .eq('template_key', templateKey)
        .order('path');

    if (!urls?.length) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`;
    }

    // Map concept → hreflang set
    const setMap = new Map(sets.map((s) => [s.conceptId, s.links]));

    const urlEntries = urls.map((url) => {
        const links = setMap.get(url.concept_id) || [];
        const hreflangXml = links
            .map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${l.href}"/>`)
            .join('\n');

        const lastmod = url.lastmod
            ? new Date(url.lastmod).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        return `  <url>
    <loc>${SITE_URL}${url.path}</loc>
    <lastmod>${lastmod}</lastmod>
${hreflangXml}
  </url>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>`;
}
