import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GlossaryTerm {
    slug: string;
    term: string;
    short_definition: string;
    long_definition: string | null;
    category: string | null;
    synonyms: string[];
    related_slugs: string[];
    acronyms: string[];
    tags: string[];
    jurisdiction: string | null;
    example_usage: string | null;
    common_mistakes: string | null;
    sources: any[];
    updated_at: string;
}

export interface GlossaryIndexItem {
    slug: string;
    term: string;
    short_definition: string;
    category: string | null;
}

// ── Server Functions ───────────────────────────────────────────────────────────

export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('glossary_public')
        .select('*')
        .eq('slug', slug)
        .limit(1)
        .single();
    return data ?? null;
}

export async function searchGlossary(q: string): Promise<GlossaryTerm[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('glossary_public')
        .select('*')
        .or(`term.ilike.%${q}%,short_definition.ilike.%${q}%`)
        .order('term')
        .limit(50);
    return data ?? [];
}

export const getGlossaryIndex = unstable_cache(
    async (): Promise<GlossaryIndexItem[]> => {
        const supabase = await createClient();
        const { data } = await supabase
            .from('glossary_public')
            .select('slug, term, short_definition, category')
            .order('term');
        return data ?? [];
    },
    ['glossary-index'],
    { revalidate: 86400, tags: ['glossary_index'] }
);

/**
 * Get a lightweight map of term → slug for client-side annotation.
 * Includes synonyms and acronyms for broader matching.
 */
export const getGlossaryAnnotationMap = unstable_cache(
    async (): Promise<Record<string, string>> => {
        const supabase = await createClient();
        const { data } = await supabase
            .from('glossary_public')
            .select('slug, term, synonyms, acronyms');

        const map: Record<string, string> = {};
        for (const row of data ?? []) {
            // Primary term
            map[row.term.toLowerCase()] = row.slug;
            // Synonyms
            for (const syn of row.synonyms ?? []) {
                map[syn.toLowerCase()] = row.slug;
            }
            // Acronyms
            for (const acr of row.acronyms ?? []) {
                map[acr.toLowerCase()] = row.slug;
            }
        }
        return map;
    },
    ['glossary-annotation-map'],
    { revalidate: 86400, tags: ['glossary'] }
);

/**
 * Record where a glossary term was used (for credibility proof + analytics).
 */
export async function recordGlossaryUsage(
    termSlug: string,
    pagePath: string,
    pageType: string,
    contextSnippet?: string,
    occurrences: number = 1,
): Promise<void> {
    const supabase = await createClient();
    await supabase
        .from('glossary_term_usages')
        .upsert(
            {
                term_slug: termSlug,
                page_path: pagePath,
                page_type: pageType,
                context_snippet: contextSnippet ?? null,
                last_seen_at: new Date().toISOString(),
                occurrences,
            },
            { onConflict: 'term_slug,page_path' }
        );
}

/**
 * Get usage proof for a term (where it appears across the site).
 */
export async function getTermUsages(termSlug: string, limit: number = 10) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('glossary_term_usages')
        .select('page_path, page_type, context_snippet, occurrences, last_seen_at')
        .eq('term_slug', termSlug)
        .order('occurrences', { ascending: false })
        .limit(limit);
    return data ?? [];
}
