/**
 * Hreflang Auto-Mesh Generator
 *
 * Generates bidirectional hreflang links for concept sets.
 * Every variant references every other variant (including itself) + x-default.
 *
 * Supports:
 *  - HTML <link> tags (primary)
 *  - Sitemap <xhtml:link> entries (via data export)
 */

import { createClient } from '@supabase/supabase-js';

const ABS_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

export type HreflangLink = {
    hreflang: string;
    href: string;
};

export type HreflangSet = {
    conceptId: string;
    conceptKey: string;
    links: HreflangLink[];
};

/**
 * Get full hreflang mesh for a concept.
 * Uses the v_hreflang_sets view (joins concepts → variants → locales).
 */
export async function getHreflangLinks(conceptId: string): Promise<HreflangLink[]> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data, error } = await supabase
        .from('v_hreflang_sets')
        .select('path, hreflang, is_default')
        .eq('concept_id', conceptId);

    if (error || !data?.length) return [];

    // Build symmetric mesh
    const links: HreflangLink[] = data.map((row) => ({
        hreflang: row.hreflang,
        href: `${ABS_BASE_URL}${row.path}`,
    }));

    // Add x-default (default locale, or first)
    const defaultVariant = data.find((r) => r.is_default) || data[0];
    links.push({
        hreflang: 'x-default',
        href: `${ABS_BASE_URL}${defaultVariant.path}`,
    });

    return links;
}

/**
 * Get hreflang links for a specific path.
 * Resolves variant → concept → all variants.
 */
export async function getHreflangLinksForPath(path: string): Promise<HreflangLink[]> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Find the variant's concept_id
    const { data: variant } = await supabase
        .from('seo_page_variants')
        .select('concept_id')
        .eq('path', path)
        .single();

    if (!variant) return [];

    return getHreflangLinks(variant.concept_id);
}

/**
 * Batch: Get hreflang sets for multiple concepts (for sitemap generation).
 */
export async function getHreflangSetsForSitemap(
    localeCountryCode: string,
    localeLanguageCode: string,
    templateKey?: string,
): Promise<HreflangSet[]> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get all indexable variants for this locale
    let query = supabase
        .from('v_sitemap_urls')
        .select('path, lastmod, hreflang, concept_id, template_key')
        .eq('country_code', localeCountryCode.toUpperCase())
        .eq('language_code', localeLanguageCode);

    if (templateKey) query = query.eq('template_key', templateKey);

    const { data: urls } = await query;
    if (!urls?.length) return [];

    // Get unique concept IDs
    const conceptIds = [...new Set(urls.map((u) => u.concept_id))];

    // Fetch all hreflang sets for these concepts
    const { data: allVariants } = await supabase
        .from('v_hreflang_sets')
        .select('concept_id, concept_key, path, hreflang, is_default')
        .in('concept_id', conceptIds);

    if (!allVariants?.length) return [];

    // Group by concept
    const byConceptMap = new Map<string, typeof allVariants>();
    for (const v of allVariants) {
        const existing = byConceptMap.get(v.concept_id) || [];
        existing.push(v);
        byConceptMap.set(v.concept_id, existing);
    }

    const sets: HreflangSet[] = [];
    for (const [conceptId, variants] of byConceptMap) {
        const links: HreflangLink[] = variants.map((v) => ({
            hreflang: v.hreflang,
            href: `${ABS_BASE_URL}${v.path}`,
        }));

        const defaultV = variants.find((v) => v.is_default) || variants[0];
        links.push({
            hreflang: 'x-default',
            href: `${ABS_BASE_URL}${defaultV.path}`,
        });

        sets.push({
            conceptId,
            conceptKey: variants[0].concept_key,
            links,
        });
    }

    return sets;
}
