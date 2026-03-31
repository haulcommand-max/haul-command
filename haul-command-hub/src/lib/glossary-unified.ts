/**
 * Haul Command — Unified Glossary Data Loader
 *
 * Single entry point for ALL glossary data access.
 * Priority: Supabase glossary_public (primary) → local TypeScript files (fallback).
 *
 * This replaces direct imports of:
 * - lib/glossary.ts (getAllTerms)
 * - lib/hc-loaders/glossary.ts (fetchGlossaryTerms, fetchGlossaryTermBySlug)
 */

import { normalizeTermSlug, resolveTermSlug, resolveCountrySlug, COUNTRY_SLUG_MAP } from './glossary-slugs';

// ─── Unified Term Interface ──────────────────────────────────────

export interface UnifiedGlossaryTerm {
  /** Internal DB id (never exposed in URLs) */
  id: string;
  /** Canonical URL slug (hyphenated) */
  slug: string;
  /** Display term name */
  term: string;
  /** Short definition (1-2 sentences) */
  shortDefinition: string;
  /** Extended definition */
  longDefinition: string | null;
  /** Why this matters operationally */
  whyItMatters: string | null;
  /** Category for filtering */
  category: string;
  /** Surface/topic categories */
  surfaceCategories: string[];
  /** ISO2 country codes where applicable */
  applicableCountries: string[];
  /** AKA / synonyms */
  synonyms: string[];
  /** Acronyms */
  acronyms: string[];
  /** Tags for search */
  tags: string[];
  /** Related tool slugs */
  relatedTools: Array<{ slug: string; name?: string }>;
  /** Related regulation/rule references */
  relatedRules: Array<{ slug: string; name?: string }>;
  /** Related service categories */
  relatedServices: Array<{ slug: string; name?: string }>;
  /** Data source for debugging */
  _source: 'supabase' | 'local';
}

// ─── Supabase Loader ─────────────────────────────────────────────

async function fetchFromSupabase(): Promise<UnifiedGlossaryTerm[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
      .from('glossary_public')
      .select('*')
      .order('term', { ascending: true });

    if (error || !data) {
      console.warn('[glossary] Supabase fetch failed, will use local fallback:', error?.message);
      return [];
    }

    return data
      .filter((row: any) => row && row.id && row.term)
      .map((row: any) => ({
      id: row.id,
      slug: normalizeTermSlug(row.slug || row.id),
      term: row.term,
      shortDefinition: row.short_definition || '',
      longDefinition: row.long_definition || null,
      whyItMatters: row.why_it_matters || null,
      category: row.category || 'general',
      surfaceCategories: row.surface_categories || [],
      applicableCountries: row.applicable_countries || [],
      synonyms: row.synonyms || [],
      acronyms: row.acronyms || [],
      tags: row.tags || [],
      relatedTools: (row.related_tools || []).map((t: any) =>
        typeof t === 'string' ? { slug: t } : t
      ),
      relatedRules: (row.related_rules || []).map((r: any) =>
        typeof r === 'string' ? { slug: r } : r
      ),
      relatedServices: (row.related_services || []).map((s: any) =>
        typeof s === 'string' ? { slug: s } : s
      ),
      _source: 'supabase' as const,
    }));
  } catch (err) {
    console.warn('[glossary] Supabase import/fetch error:', err);
    return [];
  }
}

// ─── Local Fallback Loader ───────────────────────────────────────

async function fetchFromLocal(): Promise<UnifiedGlossaryTerm[]> {
  try {
    const { getAllTerms } = await import('./glossary');
    const terms = getAllTerms();

    return terms
      .filter((t) => t && t.id && t.term) // Skip malformed entries
      .map((t) => ({
        id: t.id,
        slug: normalizeTermSlug(t.id),
        term: t.term,
        shortDefinition: t.definition || '',
        longDefinition: null,
        whyItMatters: null,
        category: t.category || 'general',
        surfaceCategories: [],
        applicableCountries: t.countries || [],
        synonyms: t.aliases || [],
        acronyms: [],
        tags: t.seoKeywords || [],
        relatedTools: [],
        relatedRules: [],
        relatedServices: [],
        _source: 'local' as const,
      }));
  } catch (err) {
    console.error('[glossary] Local fallback also failed:', err);
    return [];
  }
}

// ─── Unified API ─────────────────────────────────────────────────

let _cache: UnifiedGlossaryTerm[] | null = null;

/**
 * Fetch all glossary terms (Supabase first, local fallback).
 * Results are cached for the duration of the request/build.
 */
export async function getGlossaryTerms(): Promise<UnifiedGlossaryTerm[]> {
  if (_cache) return _cache;

  let terms = await fetchFromSupabase();
  if (terms.length === 0) {
    terms = await fetchFromLocal();
  }

  _cache = terms;
  return terms;
}

/**
 * Fetch a single term by its canonical slug.
 * Handles alias resolution (underscore→hyphen, jammed words, etc.)
 */
export async function getGlossaryTermBySlug(rawSlug: string): Promise<UnifiedGlossaryTerm | null> {
  const canonicalSlug = resolveTermSlug(rawSlug);
  const terms = await getGlossaryTerms();

  // Primary: exact slug match
  const exact = terms.find(t => t.slug === canonicalSlug);
  if (exact) return exact;

  // Secondary: try the raw input as-is (handles edge cases)
  const raw = terms.find(t => t.slug === rawSlug || normalizeTermSlug(t.id) === canonicalSlug);
  if (raw) return raw;

  // Tertiary: search by ID with normalization
  const byId = terms.find(t => normalizeTermSlug(t.id) === canonicalSlug);
  return byId || null;
}

/**
 * Get all terms applicable to a specific country.
 */
export async function getGlossaryTermsByCountry(countrySlugOrIso: string): Promise<UnifiedGlossaryTerm[]> {
  const iso = resolveCountrySlug(countrySlugOrIso)?.toUpperCase();
  if (!iso) return [];

  const terms = await getGlossaryTerms();
  return terms.filter(t =>
    t.applicableCountries.length === 0 || // universal terms
    t.applicableCountries.includes(iso)
  );
}

/**
 * Get unique category list from all terms.
 */
export async function getGlossaryCategories(): Promise<string[]> {
  const terms = await getGlossaryTerms();
  return [...new Set(terms.map(t => t.category))].sort();
}

/**
 * Get all unique canonical slugs (for generateStaticParams).
 */
export async function getAllTermSlugs(): Promise<string[]> {
  const terms = await getGlossaryTerms();
  return [...new Set(terms.map(t => t.slug))];
}

/**
 * Search terms by query string.
 */
export async function searchGlossaryTerms(query: string): Promise<UnifiedGlossaryTerm[]> {
  const q = query.toLowerCase();
  const terms = await getGlossaryTerms();

  return terms.filter(t =>
    t.term.toLowerCase().includes(q) ||
    t.synonyms.some(s => s.toLowerCase().includes(q)) ||
    t.shortDefinition.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q)) ||
    t.slug.includes(q)
  );
}
