import { cookies, headers } from 'next/headers';

/**
 * Global locale system.
 *
 * Phase 1 locales (fully supported):
 *   en-US, en-CA, fr-CA, en-AU, en-GB, en-NZ
 *
 * Phase 2+ locales (country detection active, content falls back to English):
 *   sv-SE, no-NO, en-AE, ar-SA, de-DE, en-ZA
 */

export type SupportedLocale =
    | 'en-US' | 'en-CA' | 'fr-CA'
    | 'en-AU' | 'en-GB' | 'en-NZ'
    | 'sv-SE' | 'no-NO' | 'en-AE'
    | 'ar-SA' | 'de-DE' | 'en-ZA';

const LOCALE_COOKIE = 'hc_locale';
const LOCALE_HEADER = 'x-hc-locale';
const COUNTRY_HEADER = 'x-hc-country';

/** Default locale per country code */
export const COUNTRY_DEFAULT_LOCALE: Record<string, SupportedLocale> = {
    US: 'en-US',
    CA: 'en-CA',
    AU: 'en-AU',
    GB: 'en-GB',
    NZ: 'en-NZ',
    SE: 'sv-SE',
    NO: 'no-NO',
    AE: 'en-AE',
    SA: 'ar-SA',
    DE: 'de-DE',
    ZA: 'en-ZA',
};

/** Countries that have a secondary locale toggle */
export const COUNTRY_TOGGLES: Record<string, { locales: SupportedLocale[]; show: boolean }> = {
    CA: { locales: ['en-CA', 'fr-CA'], show: true },
    // Future: AE: { locales: ['en-AE', 'ar-AE'], show: true },
};

// ── Server helpers ─────────────────────────────────────────────────────────────

/**
 * Get the current locale from middleware headers (server components).
 */
export async function getLocale(): Promise<SupportedLocale> {
    const heads = await headers();
    const locale = heads.get(LOCALE_HEADER) as SupportedLocale | null;
    if (locale && isValidLocale(locale)) return locale;
    return 'en-US';
}

/**
 * Get the detected country from middleware headers.
 */
export async function getCountry(): Promise<string> {
    const heads = await headers();
    return heads.get(COUNTRY_HEADER) || 'US';
}

/**
 * Check if a locale toggle should be shown for the current country.
 */
export async function showLocaleToggle(): Promise<boolean> {
    const country = await getCountry();
    return COUNTRY_TOGGLES[country]?.show ?? false;
}

/**
 * Check if French toggle should show (CA-specific convenience).
 */
export async function showFrenchToggle(): Promise<boolean> {
    return (await getCountry()) === 'CA';
}

/**
 * Type guard for locale values.
 */
export function isValidLocale(v: string): v is SupportedLocale {
    return v in LOCALE_LABELS;
}

/**
 * Locale display names for toggles.
 */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
    'en-US': 'English (US)',
    'en-CA': 'English (CA)',
    'fr-CA': 'Français',
    'en-AU': 'English (AU)',
    'en-GB': 'English (UK)',
    'en-NZ': 'English (NZ)',
    'sv-SE': 'Svenska',
    'no-NO': 'Norsk',
    'en-AE': 'English (UAE)',
    'ar-SA': 'العربية',
    'de-DE': 'Deutsch',
    'en-ZA': 'English (ZA)',
};

/**
 * Get the language code from a locale (for hreflang).
 */
export function localeToHreflang(locale: SupportedLocale): string {
    return locale.toLowerCase().replace('_', '-');
}
