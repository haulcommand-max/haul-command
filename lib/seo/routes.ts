/**
 * International SEO Route Contract
 *
 * URL pattern: /{country}/{lang}/{kind}/{slug}
 * Examples:
 *   /us/en/city/gainesville-fl
 *   /us/es/corridor/i-75
 *   /ca/fr/port/port-de-montreal
 *   /de/de/corridor/a7
 */

// ── Route Types ────────────────────────────────────────────────────────────

export type CountryCode = string;   // "us", "ca", "au", "gb", "de", ...
export type LangCode = string;      // "en", "es", "fr", "de", "sv", "no", "ar"
export type PageKind = 'city' | 'corridor' | 'port' | 'category';

export type RouteParams = {
    country: CountryCode;
    lang: LangCode;
};

export type VariantRouteParams = RouteParams & {
    slug: string;
};

// ── DB Types ───────────────────────────────────────────────────────────────

export type SeoPageVariant = {
    id: string;
    concept_id: string;
    locale_id: string;
    path: string;
    canonical_path: string;
    title: string | null;
    meta_description: string | null;
    blocks: unknown[];
    indexing_mode: 'preview' | 'noindex' | 'index';
    quality_score: number;
    updated_at: string;
};

export type HreflangLink = {
    hreflang: string;
    href: string;
};

// ── Path Builder ───────────────────────────────────────────────────────────

export function buildVariantPath(
    country: string,
    lang: string,
    kind: PageKind,
    slug: string,
): string {
    return `/${country.toLowerCase()}/${lang.toLowerCase()}/${kind}/${slug}`;
}

// ── Robots Meta ────────────────────────────────────────────────────────────

export function robotsMeta(indexingMode: SeoPageVariant['indexing_mode']): string {
    return indexingMode === 'index' ? 'index,follow' : 'noindex,follow';
}
