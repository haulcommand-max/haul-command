// ────────────────────────────────────────────────────────────
// Haul Command — Global hreflang Generator (v2)
// Once-and-done: generates hreflang alternates from the registry
// for any page type across all 52 countries.
//
// Aligns with:  haul_command_hreflang_global_rollout spec v1.0
// ────────────────────────────────────────────────────────────

import { COUNTRIES, CountryConfig } from '@/lib/seo-countries';

const BASE_URL = 'https://hub.haulcommand.com';

// ─── Locale override map ───
// Some countries need non-trivial lang→hreflang mapping.
// Norwegian ISO 639-1 "no" → Google prefers "nb" (Bokmål).
// All others: `{lang}-{code}`.
const LOCALE_OVERRIDES: Record<string, string> = {
    NO: 'nb-NO',   // Norwegian Bokmål, not generic "no"
};

/**
 * Maps a CountryConfig to its hreflang locale code.
 * Google hreflang format: language-REGION  (e.g. en-US, de-DE, pt-BR)
 */
function toHreflang(country: CountryConfig): string {
    return LOCALE_OVERRIDES[country.code] || `${country.lang}-${country.code}`;
}

// ─── Country Hub hreflang ───
// Generates alternates for /{country} pages across all 52 countries.
export function generateCountryHubHreflang(): Record<string, string> {
    const languages: Record<string, string> = {};

    for (const c of COUNTRIES) {
        languages[toHreflang(c)] = `${BASE_URL}/${c.slug}`;
    }

    // x-default → countries index (language-agnostic landing)
    languages['x-default'] = `${BASE_URL}/countries`;

    return languages;
}

// ─── Service Page hreflang ───
// Generates alternates for /{country}/{service} pages.
export function generateServiceHreflang(serviceSlug: string): Record<string, string> {
    const languages: Record<string, string> = {};

    for (const c of COUNTRIES) {
        languages[toHreflang(c)] = `${BASE_URL}/${c.slug}/${serviceSlug}`;
    }

    languages['x-default'] = `${BASE_URL}/countries`;

    return languages;
}

// ─── Guide Page hreflang ───
// Generates alternates for /{country}/guide/{slug} pages.
export function generateGuideHreflang(guideSlug: string): Record<string, string> {
    const languages: Record<string, string> = {};

    for (const c of COUNTRIES) {
        languages[toHreflang(c)] = `${BASE_URL}/${c.slug}/guide/${guideSlug}`;
    }

    languages['x-default'] = `${BASE_URL}/countries`;

    return languages;
}

// ─── City-Service Page hreflang (future) ───
// For /{country}/{city}/{service} when city pages are built.
export function generateCityServiceHreflang(
    citySlug: string,
    serviceSlug: string
): Record<string, string> {
    const languages: Record<string, string> = {};

    for (const c of COUNTRIES) {
        languages[toHreflang(c)] = `${BASE_URL}/${c.slug}/city/${citySlug}/${serviceSlug}`;
    }

    languages['x-default'] = `${BASE_URL}/countries`;

    return languages;
}

// ─── Dictionary Term hreflang ───
export function generateDictionaryTermHreflang(termId: string): Record<string, string> {
    const languages: Record<string, string> = {};

    for (const c of COUNTRIES) {
        languages[toHreflang(c)] = `${BASE_URL}/dictionary/${c.slug}/${termId}`;
    }

    languages['x-default'] = `${BASE_URL}/dictionary`;

    return languages;
}

// ─── Generic hreflang builder ───
// Takes a path builder function and returns the hreflang map.
// Used for future page types (near-me, corridors, metros, etc.)
export function generateHreflang(
    pathBuilder: (country: CountryConfig) => string
): Record<string, string> {
    const languages: Record<string, string> = {};

    for (const c of COUNTRIES) {
        languages[toHreflang(c)] = `${BASE_URL}${pathBuilder(c)}`;
    }

    languages['x-default'] = `${BASE_URL}/countries`;

    return languages;
}

// ─── Sitemap hreflang entries ───
// Returns xhtml:link data for sitemap.xml hreflang extension.
// Each entry = { loc, alternates: [{ hreflang, href }] }
export interface SitemapHreflangEntry {
    loc: string;
    alternates: Array<{ hreflang: string; href: string }>;
}

/**
 * Generates sitemap hreflang entries for a page type.
 * This creates bidirectional links: each country page links to ALL other variants.
 */
export function generateSitemapHreflangEntries(
    pathBuilder: (country: CountryConfig) => string
): SitemapHreflangEntry[] {
    const entries: SitemapHreflangEntry[] = [];

    // Build the full alternate set once
    const alternates = COUNTRIES.map((c) => ({
        hreflang: toHreflang(c),
        href: `${BASE_URL}${pathBuilder(c)}`,
    }));
    alternates.push({ hreflang: 'x-default', href: `${BASE_URL}/countries` });

    // Each country page gets the full alternate set
    for (const c of COUNTRIES) {
        entries.push({
            loc: `${BASE_URL}${pathBuilder(c)}`,
            alternates,
        });
    }

    return entries;
}

// ─── Pre-built sitemap generators for each page type ───

export function getSitemapHreflangCountryHubs(): SitemapHreflangEntry[] {
    return generateSitemapHreflangEntries((c) => `/${c.slug}`);
}

export function getSitemapHreflangServices(serviceSlug: string): SitemapHreflangEntry[] {
    return generateSitemapHreflangEntries((c) => `/${c.slug}/${serviceSlug}`);
}

export function getSitemapHreflangGuides(guideSlug: string): SitemapHreflangEntry[] {
    return generateSitemapHreflangEntries((c) => `/${c.slug}/guide/${guideSlug}`);
}

// ─── Validation helpers ───

/**
 * Validates hreflang entries are bidirectional (every page references every other page).
 * Returns any errors found.
 */
export function validateHreflangBidirectional(
    entries: SitemapHreflangEntry[]
): string[] {
    const errors: string[] = [];
    const locSet = new Set(entries.map((e) => e.loc));

    for (const entry of entries) {
        for (const alt of entry.alternates) {
            if (alt.hreflang !== 'x-default' && !locSet.has(alt.href)) {
                errors.push(`${entry.loc} references ${alt.href} but it's not in the entry set`);
            }
        }

        // Self-referencing check
        const selfRef = entry.alternates.find((a) => a.href === entry.loc);
        if (!selfRef) {
            errors.push(`${entry.loc} missing self-referencing hreflang`);
        }

        // x-default check
        const xDefault = entry.alternates.find((a) => a.hreflang === 'x-default');
        if (!xDefault) {
            errors.push(`${entry.loc} missing x-default hreflang`);
        }
    }

    return errors;
}
