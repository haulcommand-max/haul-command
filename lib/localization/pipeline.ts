/**
 * Localization Pipeline — Mixed Language Detection + Unit Toggle Checker
 *
 * Solves the multilingual_email_score gap (40→90/100 target).
 * Validates profiles and content for:
 *  - Mixed language contamination
 *  - Incorrect unit systems for the locale (metric vs imperial)
 *  - Missing translations for critical fields
 */

// ── Country locale config ──────────────────────────────────────────────────

export const COUNTRY_LOCALE_CONFIG: Record<string, {
    primaryLanguage: string;
    measurementSystem: 'metric' | 'imperial';
    currency: string;
    dateFormat: 'MDY' | 'DMY' | 'YMD';
    vapiPersona: string;
}> = {
    US: { primaryLanguage: 'en', measurementSystem: 'imperial', currency: 'USD', dateFormat: 'MDY', vapiPersona: 'en_us' },
    CA: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'CAD', dateFormat: 'DMY', vapiPersona: 'en_ca' },
    AU: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'AUD', dateFormat: 'DMY', vapiPersona: 'en_au' },
    GB: { primaryLanguage: 'en', measurementSystem: 'imperial', currency: 'GBP', dateFormat: 'DMY', vapiPersona: 'en_uk' },
    NZ: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'NZD', dateFormat: 'DMY', vapiPersona: 'en_nz' },
    SE: { primaryLanguage: 'sv', measurementSystem: 'metric', currency: 'SEK', dateFormat: 'YMD', vapiPersona: 'future_sv' },
    NO: { primaryLanguage: 'no', measurementSystem: 'metric', currency: 'NOK', dateFormat: 'DMY', vapiPersona: 'future_no' },
    AE: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'AED', dateFormat: 'DMY', vapiPersona: 'en_us' },
    SA: { primaryLanguage: 'ar', measurementSystem: 'metric', currency: 'SAR', dateFormat: 'DMY', vapiPersona: 'future_ar' },
    DE: { primaryLanguage: 'de', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_de' },
    ZA: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'ZAR', dateFormat: 'DMY', vapiPersona: 'en_us' },
    MX: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'MXN', dateFormat: 'DMY', vapiPersona: 'future_es' },
    TR: { primaryLanguage: 'tr', measurementSystem: 'metric', currency: 'TRY', dateFormat: 'DMY', vapiPersona: 'future_tr' },
    NL: { primaryLanguage: 'nl', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_nl' },
    BE: { primaryLanguage: 'nl', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_nl' },
    IT: { primaryLanguage: 'it', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_it' },
    // Expansion countries (9 additions → total 25 matches enabled_target_countries_v)
    BR: { primaryLanguage: 'pt', measurementSystem: 'metric', currency: 'BRL', dateFormat: 'DMY', vapiPersona: 'future_pt' },
    CL: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'CLP', dateFormat: 'DMY', vapiPersona: 'future_es' },
    PL: { primaryLanguage: 'pl', measurementSystem: 'metric', currency: 'PLN', dateFormat: 'DMY', vapiPersona: 'future_pl' },
    IE: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'en_uk' },
    DK: { primaryLanguage: 'da', measurementSystem: 'metric', currency: 'DKK', dateFormat: 'DMY', vapiPersona: 'future_da' },
    FI: { primaryLanguage: 'fi', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_fi' },
    ES: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_es' },
    CH: { primaryLanguage: 'de', measurementSystem: 'metric', currency: 'CHF', dateFormat: 'DMY', vapiPersona: 'future_de' },
    AT: { primaryLanguage: 'de', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_de' },
    FR: { primaryLanguage: 'fr', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', vapiPersona: 'future_fr' },
};

// ── Mixed Language Detection ───────────────────────────────────────────────

// Stopword lists for primary detection languages
const LANGUAGE_STOPWORDS: Record<string, Set<string>> = {
    en: new Set(['the', 'is', 'at', 'and', 'or', 'for', 'in', 'on', 'to', 'with', 'of', 'a', 'an', 'this', 'that', 'from', 'by', 'as', 'are', 'was', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'can', 'not', 'but', 'which', 'than']),
    sv: new Set(['och', 'att', 'det', 'som', 'en', 'på', 'av', 'för', 'med', 'är', 'den', 'till', 'har', 'inte', 'kan', 'om', 'men', 'var', 'ett', 'vi', 'de', 'jag', 'så', 'alla', 'hade', 'från', 'denna', 'nu']),
    no: new Set(['og', 'det', 'som', 'en', 'på', 'av', 'for', 'med', 'er', 'den', 'til', 'har', 'ikke', 'kan', 'om', 'men', 'var', 'et', 'vi', 'de', 'jeg', 'så', 'alle', 'hadde', 'fra', 'denne', 'nå']),
    de: new Set(['und', 'der', 'die', 'das', 'ist', 'in', 'den', 'von', 'zu', 'für', 'mit', 'auf', 'es', 'ein', 'eine', 'sich', 'nicht', 'auch', 'als', 'an', 'aus', 'nach', 'wie', 'bei', 'über', 'oder', 'aber', 'so', 'um', 'hat', 'noch', 'nur']),
    ar: new Set(['في', 'من', 'على', 'إلى', 'هذا', 'هذه', 'التي', 'الذي', 'هو', 'هي', 'كان', 'كانت', 'لم', 'لن', 'أن', 'عن', 'مع', 'أو', 'بين', 'كل']),
    es: new Set(['de', 'la', 'el', 'en', 'y', 'los', 'del', 'se', 'las', 'un', 'por', 'con', 'no', 'una', 'su', 'para', 'es', 'al', 'que', 'lo', 'más', 'pero', 'fue', 'esta', 'como', 'son']),
};

export interface MixedLanguageResult {
    isMixed: boolean;
    primaryLanguageRatio: number;
    foreignTokens: string[];
    riskLevel: 'clean' | 'warning' | 'mixed';
    suggestions: string[];
}

export function detectMixedLanguage(text: string, expectedLanguage: string): MixedLanguageResult {
    if (!text || text.length < 20) {
        return { isMixed: false, primaryLanguageRatio: 1.0, foreignTokens: [], riskLevel: 'clean', suggestions: [] };
    }

    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (words.length < 5) {
        return { isMixed: false, primaryLanguageRatio: 1.0, foreignTokens: [], riskLevel: 'clean', suggestions: [] };
    }

    const primaryStopwords = LANGUAGE_STOPWORDS[expectedLanguage] || LANGUAGE_STOPWORDS.en;
    let primaryHits = 0;
    let foreignHits = 0;
    const foreignTokens: string[] = [];

    // Check each word against primary + all other language stopwords
    for (const word of words) {
        if (primaryStopwords.has(word)) {
            primaryHits++;
            continue;
        }
        // Check if it matches ANY foreign language stopwords
        for (const [lang, stopwords] of Object.entries(LANGUAGE_STOPWORDS)) {
            if (lang !== expectedLanguage && stopwords.has(word)) {
                foreignHits++;
                foreignTokens.push(word);
                break;
            }
        }
    }

    const totalStopwords = primaryHits + foreignHits;
    if (totalStopwords === 0) {
        return { isMixed: false, primaryLanguageRatio: 1.0, foreignTokens: [], riskLevel: 'clean', suggestions: [] };
    }

    const primaryRatio = primaryHits / totalStopwords;
    const foreignRatio = foreignHits / totalStopwords;
    const isMixed = foreignRatio >= 0.25;

    const riskLevel: MixedLanguageResult['riskLevel'] =
        foreignRatio >= 0.40 ? 'mixed' :
            foreignRatio >= 0.25 ? 'warning' : 'clean';

    const suggestions: string[] = [];
    if (isMixed) {
        suggestions.push(`Content appears to contain ${(foreignRatio * 100).toFixed(0)}% foreign language tokens.`);
        suggestions.push(`Expected language: ${expectedLanguage}. Consider professional translation.`);
    }

    return {
        isMixed,
        primaryLanguageRatio: Math.round(primaryRatio * 100) / 100,
        foreignTokens: foreignTokens.slice(0, 10),
        riskLevel,
        suggestions,
    };
}

// ── Unit System Checker ────────────────────────────────────────────────────

const IMPERIAL_PATTERNS = [
    /\b\d+\s*(?:ft|feet|foot)\b/i,
    /\b\d+['′]\s*\d*["″]?\b/,
    /\b\d+\s*(?:lb|lbs|pounds?)\b/i,
    /\b\d+\s*(?:mi|miles?)\b/i,
    /\b\d+\s*(?:in|inch(?:es)?)\b/i,
    /\b\d+\s*(?:gal|gallons?)\b/i,
];

const METRIC_PATTERNS = [
    /\b\d+\s*(?:m|meters?|metres?)\b/i,
    /\b\d+\s*(?:km|kilometers?|kilometres?)\b/i,
    /\b\d+\s*(?:kg|kilograms?)\b/i,
    /\b\d+\s*(?:cm|centimeters?|centimetres?)\b/i,
    /\b\d+\s*(?:L|liters?|litres?)\b/i,
    /\b\d+\s*(?:t|tonnes?|metric\s+tons?)\b/i,
];

export interface UnitCheckResult {
    expectedSystem: 'metric' | 'imperial';
    foundImperial: boolean;
    foundMetric: boolean;
    mismatch: boolean;
    suggestions: string[];
}

export function checkUnitSystem(text: string, countryCode: string): UnitCheckResult {
    const config = COUNTRY_LOCALE_CONFIG[countryCode];
    const expectedSystem = config?.measurementSystem ?? 'metric';

    const foundImperial = IMPERIAL_PATTERNS.some(p => p.test(text));
    const foundMetric = METRIC_PATTERNS.some(p => p.test(text));

    const mismatch =
        (expectedSystem === 'metric' && foundImperial && !foundMetric) ||
        (expectedSystem === 'imperial' && foundMetric && !foundImperial);

    const suggestions: string[] = [];
    if (mismatch) {
        suggestions.push(`Country ${countryCode} uses ${expectedSystem} system but content contains ${expectedSystem === 'metric' ? 'imperial' : 'metric'} units.`);
        suggestions.push(`Consider converting units or providing dual-unit display.`);
    }

    return { expectedSystem, foundImperial, foundMetric, mismatch, suggestions };
}

// ── Profile Translation Readiness ──────────────────────────────────────────

export interface TranslationReadiness {
    countryCode: string;
    primaryLanguage: string;
    requiredFields: string[];
    missingTranslations: string[];
    score: number;      // 0-100
    ready: boolean;
}

const CRITICAL_PROFILE_FIELDS = [
    'name', 'description', 'services', 'hours_label',
    'claim_cta', 'verified_badge_label', 'contact_label',
];

export function assessTranslationReadiness(
    countryCode: string,
    translatedFields: Record<string, boolean>,
): TranslationReadiness {
    const config = COUNTRY_LOCALE_CONFIG[countryCode];
    const primaryLanguage = config?.primaryLanguage ?? 'en';

    // English countries are always ready
    if (primaryLanguage === 'en') {
        return {
            countryCode,
            primaryLanguage,
            requiredFields: CRITICAL_PROFILE_FIELDS,
            missingTranslations: [],
            score: 100,
            ready: true,
        };
    }

    const missing = CRITICAL_PROFILE_FIELDS.filter(f => !translatedFields[f]);
    const score = Math.round(((CRITICAL_PROFILE_FIELDS.length - missing.length) / CRITICAL_PROFILE_FIELDS.length) * 100);

    return {
        countryCode,
        primaryLanguage,
        requiredFields: CRITICAL_PROFILE_FIELDS,
        missingTranslations: missing,
        score,
        ready: score >= 80,
    };
}

// ── Listmonk sequence translation status ───────────────────────────────────

export const REQUIRED_EMAIL_SEQUENCES = [
    'claim_followup',
    'verification_steps',
    'premium_offer',
    'advertiser_nurture',
] as const;

export type EmailSequence = typeof REQUIRED_EMAIL_SEQUENCES[number];

export function computeMultilingualEmailScore(
    translatedSequences: Record<string, EmailSequence[]>,
    allCountries: string[],
): number {
    const nonEnglishCountries = allCountries.filter(cc => {
        const config = COUNTRY_LOCALE_CONFIG[cc];
        return config && config.primaryLanguage !== 'en';
    });

    if (nonEnglishCountries.length === 0) return 100;

    let totalRequired = nonEnglishCountries.length * REQUIRED_EMAIL_SEQUENCES.length;
    let totalTranslated = 0;

    for (const cc of nonEnglishCountries) {
        const translated = translatedSequences[cc] ?? [];
        totalTranslated += translated.length;
    }

    return Math.round((totalTranslated / totalRequired) * 100);
}
