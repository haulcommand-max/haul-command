import { cookies, headers } from 'next/headers';

/**
 * Global locale system — All 57 countries.
 *
 * Detection chain:
 *   1. Cookie (user explicitly chose via language switcher)
 *   2. Middleware header (detected from Accept-Language + Vercel geo)
 *   3. Fallback to en-US
 */

export type SupportedLocale =
    // Tier A Gold (10)
    | 'en-US' | 'en-CA' | 'fr-CA' | 'en-AU' | 'en-GB' | 'en-NZ'
    | 'en-ZA' | 'de-DE' | 'nl-NL' | 'ar-AE' | 'pt-BR'
    // Tier B Blue (18)
    | 'en-IE' | 'sv-SE' | 'nb-NO' | 'da-DK' | 'fi-FI'
    | 'nl-BE' | 'de-AT' | 'de-CH' | 'es-ES' | 'fr-FR'
    | 'it-IT' | 'pt-PT' | 'ar-SA' | 'ar-QA' | 'es-MX'
    | 'hi-IN' | 'id-ID' | 'th-TH'
    // Tier C Silver (26)
    | 'pl-PL' | 'cs-CZ' | 'sk-SK' | 'hu-HU' | 'sl-SI'
    | 'et-EE' | 'lv-LV' | 'lt-LT' | 'hr-HR' | 'ro-RO'
    | 'bg-BG' | 'el-GR' | 'tr-TR' | 'ar-KW' | 'ar-OM'
    | 'ar-BH' | 'en-SG' | 'ms-MY' | 'ja-JP' | 'ko-KR'
    | 'es-CL' | 'es-AR' | 'es-CO' | 'es-PE' | 'vi-VN' | 'en-PH'
    // Tier D Slate (3)
    | 'es-UY' | 'es-PA' | 'es-CR';

const LOCALE_COOKIE = 'hc_locale';
const LOCALE_HEADER = 'x-hc-locale';
const COUNTRY_HEADER = 'x-hc-country';
const DIR_HEADER = 'x-hc-dir';

/** Default locale per country code — all 57 countries */
export const COUNTRY_DEFAULT_LOCALE: Record<string, SupportedLocale> = {
    US: 'en-US', CA: 'en-CA', AU: 'en-AU', GB: 'en-GB', NZ: 'en-NZ',
    ZA: 'en-ZA', DE: 'de-DE', NL: 'nl-NL', AE: 'ar-AE', BR: 'pt-BR',
    IE: 'en-IE', SE: 'sv-SE', NO: 'nb-NO', DK: 'da-DK', FI: 'fi-FI',
    BE: 'nl-BE', AT: 'de-AT', CH: 'de-CH', ES: 'es-ES', FR: 'fr-FR',
    IT: 'it-IT', PT: 'pt-PT', SA: 'ar-SA', QA: 'ar-QA', MX: 'es-MX',
    IN: 'hi-IN', ID: 'id-ID', TH: 'th-TH', PL: 'pl-PL', CZ: 'cs-CZ',
    SK: 'sk-SK', HU: 'hu-HU', SI: 'sl-SI', EE: 'et-EE', LV: 'lv-LV',
    LT: 'lt-LT', HR: 'hr-HR', RO: 'ro-RO', BG: 'bg-BG', GR: 'el-GR',
    TR: 'tr-TR', KW: 'ar-KW', OM: 'ar-OM', BH: 'ar-BH', SG: 'en-SG',
    MY: 'ms-MY', JP: 'ja-JP', KR: 'ko-KR', CL: 'es-CL', AR: 'es-AR',
    CO: 'es-CO', PE: 'es-PE', VN: 'vi-VN', PH: 'en-PH', UY: 'es-UY',
    PA: 'es-PA', CR: 'es-CR',
};

/** Countries with secondary locale toggles */
export const COUNTRY_TOGGLES: Record<string, { locales: SupportedLocale[]; show: boolean }> = {
    CA: { locales: ['en-CA', 'fr-CA'], show: true },
    AE: { locales: ['ar-AE', 'en-US'], show: true },                // English widely spoken
    SA: { locales: ['ar-SA', 'en-US'], show: true },                // English for business
    BE: { locales: ['nl-BE', 'fr-FR'], show: true },                // Dutch + French
    CH: { locales: ['de-CH', 'fr-FR', 'it-IT'], show: true },      // German + French + Italian
    IN: { locales: ['hi-IN', 'en-US'], show: true },                // Hindi + English
    SG: { locales: ['en-SG', 'ms-MY'], show: true },                // English + Malay
    PH: { locales: ['en-PH', 'en-US'], show: true },                // Filipino + English
};

// ── Server helpers ─────────────────────────────────────────────────────────────

/** Get the current locale from middleware headers (server components). */
export async function getLocale(): Promise<SupportedLocale> {
    const heads = await headers();
    const locale = heads.get(LOCALE_HEADER) as SupportedLocale | null;
    if (locale && isValidLocale(locale)) return locale;
    return 'en-US';
}

/** Get the detected country from middleware headers. */
export async function getCountry(): Promise<string> {
    const heads = await headers();
    return heads.get(COUNTRY_HEADER) || 'US';
}

/** Get text direction from middleware headers. */
export async function getDir(): Promise<'ltr' | 'rtl'> {
    const heads = await headers();
    return (heads.get(DIR_HEADER) as 'ltr' | 'rtl') || 'ltr';
}

/** Check if a locale toggle should be shown for the current country. */
export async function showLocaleToggle(): Promise<boolean> {
    const country = await getCountry();
    return COUNTRY_TOGGLES[country]?.show ?? false;
}

/** Get available locale options for the current country. */
export async function getLocaleOptions(): Promise<SupportedLocale[]> {
    const country = await getCountry();
    return COUNTRY_TOGGLES[country]?.locales ?? [COUNTRY_DEFAULT_LOCALE[country] || 'en-US'];
}

/** Check if French toggle should show (CA-specific convenience). */
export async function showFrenchToggle(): Promise<boolean> {
    return (await getCountry()) === 'CA';
}

/** Type guard for locale values. */
export function isValidLocale(v: string): v is SupportedLocale {
    return v in LOCALE_LABELS;
}

/** Locale display names for toggles — all 57 countries. */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
    'en-US': 'English (US)', 'en-CA': 'English (CA)', 'fr-CA': 'Français (CA)',
    'en-AU': 'English (AU)', 'en-GB': 'English (UK)', 'en-NZ': 'English (NZ)',
    'en-ZA': 'English (ZA)', 'de-DE': 'Deutsch', 'nl-NL': 'Nederlands',
    'ar-AE': 'العربية (الإمارات)', 'pt-BR': 'Português (BR)',
    'en-IE': 'English (IE)', 'sv-SE': 'Svenska', 'nb-NO': 'Norsk',
    'da-DK': 'Dansk', 'fi-FI': 'Suomi', 'nl-BE': 'Nederlands (BE)',
    'de-AT': 'Deutsch (AT)', 'de-CH': 'Deutsch (CH)', 'es-ES': 'Español (ES)',
    'fr-FR': 'Français', 'it-IT': 'Italiano', 'pt-PT': 'Português (PT)',
    'ar-SA': 'العربية (السعودية)', 'ar-QA': 'العربية (قطر)', 'es-MX': 'Español (MX)',
    'hi-IN': 'हिन्दी', 'id-ID': 'Bahasa Indonesia', 'th-TH': 'ไทย',
    'pl-PL': 'Polski', 'cs-CZ': 'Čeština', 'sk-SK': 'Slovenčina',
    'hu-HU': 'Magyar', 'sl-SI': 'Slovenščina', 'et-EE': 'Eesti',
    'lv-LV': 'Latviešu', 'lt-LT': 'Lietuvių', 'hr-HR': 'Hrvatski',
    'ro-RO': 'Română', 'bg-BG': 'Български', 'el-GR': 'Ελληνικά',
    'tr-TR': 'Türkçe', 'ar-KW': 'العربية (الكويت)', 'ar-OM': 'العربية (عُمان)',
    'ar-BH': 'العربية (البحرين)', 'en-SG': 'English (SG)', 'ms-MY': 'Bahasa Melayu',
    'ja-JP': '日本語', 'ko-KR': '한국어', 'es-CL': 'Español (CL)',
    'es-AR': 'Español (AR)', 'es-CO': 'Español (CO)', 'es-PE': 'Español (PE)',
    'vi-VN': 'Tiếng Việt', 'en-PH': 'English (PH)', 'es-UY': 'Español (UY)',
    'es-PA': 'Español (PA)', 'es-CR': 'Español (CR)',
};

/** Get the language code from a locale (for hreflang). */
export function localeToHreflang(locale: SupportedLocale): string {
    return locale.toLowerCase().replace('_', '-');
}

/** Get the language code (just the lang part, no region). */
export function localeToLang(locale: SupportedLocale): string {
    return locale.split('-')[0];
}
