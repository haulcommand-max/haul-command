import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GlossaryConcept {
    concept_slug: string;
    concept_name: string;
    concept_description: string;
    category: string | null;
    global_priority: number;
}

export interface TermVariant {
    concept_slug: string;
    country_code: string;
    locale: string;
    term_local: string;
    is_primary: boolean;
    search_aliases: string[];
    regulatory_notes: string | null;
    industry_usage_score: number;
}

export interface ConceptWithVariants extends GlossaryConcept {
    variants: TermVariant[];
    primary_terms: Record<string, string>; // country_code → primary term
}

// ── API Functions ──────────────────────────────────────────────────────────────

/**
 * Fetch a concept with all its country variants.
 */
export async function getConceptWithVariants(conceptSlug: string): Promise<ConceptWithVariants | null> {
    const supabase = await createClient();

    const { data: concept } = await supabase
        .from('glossary_concepts')
        .select('*')
        .eq('concept_slug', conceptSlug)
        .single();

    if (!concept) return null;

    const { data: variants } = await supabase
        .from('glossary_term_variants')
        .select('*')
        .eq('concept_slug', conceptSlug)
        .eq('noindex', false)
        .order('is_primary', { ascending: false });

    const allVariants = variants ?? [];

    // Build primary term map
    const primary_terms: Record<string, string> = {};
    for (const v of allVariants) {
        if (v.is_primary && !primary_terms[v.country_code]) {
            primary_terms[v.country_code] = v.term_local;
        }
    }

    return {
        ...concept,
        variants: allVariants,
        primary_terms,
    };
}

/**
 * Get the localized term for a concept in a specific country.
 * Falls back to US English if no variant exists.
 */
export async function getLocalizedTerm(
    conceptSlug: string,
    countryCode: string,
): Promise<{ term: string; regulatory_notes: string | null } | null> {
    const supabase = await createClient();

    // Try exact country match (primary first)
    const { data } = await supabase
        .from('glossary_term_variants')
        .select('term_local, regulatory_notes, is_primary')
        .eq('concept_slug', conceptSlug)
        .eq('country_code', countryCode)
        .eq('noindex', false)
        .order('is_primary', { ascending: false })
        .limit(1);

    if (data?.[0]) {
        return { term: data[0].term_local, regulatory_notes: data[0].regulatory_notes };
    }

    // Fallback to US
    if (countryCode !== 'US') {
        const { data: usFallback } = await supabase
            .from('glossary_term_variants')
            .select('term_local, regulatory_notes')
            .eq('concept_slug', conceptSlug)
            .eq('country_code', 'US')
            .eq('is_primary', true)
            .limit(1);

        if (usFallback?.[0]) {
            return { term: usFallback[0].term_local, regulatory_notes: null };
        }
    }

    // Last resort: concept name
    const { data: concept } = await supabase
        .from('glossary_concepts')
        .select('concept_name')
        .eq('concept_slug', conceptSlug)
        .single();

    return concept ? { term: concept.concept_name, regulatory_notes: null } : null;
}

/**
 * Fetch all concepts (cached, for index page).
 */
export const getAllConcepts = unstable_cache(
    async (): Promise<GlossaryConcept[]> => {
        const supabase = await createClient();
        const { data } = await supabase
            .from('glossary_concepts')
            .select('*')
            .order('global_priority', { ascending: false });
        return data ?? [];
    },
    ['global-concepts'],
    { revalidate: 86400, tags: ['glossary'] }
);

/**
 * Fetch all active countries for the locale/market selector.
 */
export const getActiveCountries = unstable_cache(
    async () => {
        const supabase = await createClient();
        const { data } = await supabase
            .from('global_countries')
            .select('iso2, name, primary_language, seo_priority_score, is_active_market, activation_phase')
            .eq('is_active_market', true)
            .order('seo_priority_score', { ascending: false });
        return data ?? [];
    },
    ['active-countries'],
    { revalidate: 86400, tags: ['countries'] }
);

/**
 * Get "What this is called in other countries" panel data.
 */
export async function getCountryEquivalents(conceptSlug: string): Promise<{
    country_code: string;
    country_name: string;
    term: string;
    regulatory_notes: string | null;
}[]> {
    const supabase = await createClient();

    const { data: variants } = await supabase
        .from('glossary_term_variants')
        .select('country_code, term_local, regulatory_notes')
        .eq('concept_slug', conceptSlug)
        .eq('is_primary', true)
        .eq('noindex', false);

    if (!variants?.length) return [];

    // Fetch country names
    const countryCodes = [...new Set(variants.map(v => v.country_code))];
    const { data: countries } = await supabase
        .from('global_countries')
        .select('iso2, name')
        .in('iso2', countryCodes);

    const countryMap = new Map((countries ?? []).map(c => [c.iso2, c.name]));

    return variants.map(v => ({
        country_code: v.country_code,
        country_name: countryMap.get(v.country_code) || v.country_code,
        term: v.term_local,
        regulatory_notes: v.regulatory_notes,
    }));
}
