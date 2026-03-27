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
    livekitVoiceNode: string;
}> = {
    US: { primaryLanguage: 'en', measurementSystem: 'imperial', currency: 'USD', dateFormat: 'MDY', livekitVoiceNode: 'nova_en' },
    CA: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'CAD', dateFormat: 'MDY', livekitVoiceNode: 'nova_en' },
    AU: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'AUD', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    GB: { primaryLanguage: 'en', measurementSystem: 'imperial', currency: 'GBP', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    NZ: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'NZD', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    ZA: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'ZAR', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    DE: { primaryLanguage: 'de', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_de' },
    NL: { primaryLanguage: 'nl', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_nl' },
    AE: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'AED', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    BR: { primaryLanguage: 'pt', measurementSystem: 'metric', currency: 'BRL', dateFormat: 'YMD', livekitVoiceNode: 'nova_pt' },
    IE: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    SE: { primaryLanguage: 'sv', measurementSystem: 'metric', currency: 'SEK', dateFormat: 'YMD', livekitVoiceNode: 'nova_sv' },
    NO: { primaryLanguage: 'nb', measurementSystem: 'metric', currency: 'NOK', dateFormat: 'YMD', livekitVoiceNode: 'nova_nb' },
    DK: { primaryLanguage: 'da', measurementSystem: 'metric', currency: 'DKK', dateFormat: 'YMD', livekitVoiceNode: 'nova_da' },
    FI: { primaryLanguage: 'fi', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_fi' },
    BE: { primaryLanguage: 'nl', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_nl' },
    AT: { primaryLanguage: 'de', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_de' },
    CH: { primaryLanguage: 'de', measurementSystem: 'metric', currency: 'CHF', dateFormat: 'YMD', livekitVoiceNode: 'nova_de' },
    ES: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    FR: { primaryLanguage: 'fr', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_fr' },
    IT: { primaryLanguage: 'it', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_it' },
    PT: { primaryLanguage: 'pt', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_pt' },
    SA: { primaryLanguage: 'ar', measurementSystem: 'metric', currency: 'SAR', dateFormat: 'YMD', livekitVoiceNode: 'nova_ar' },
    QA: { primaryLanguage: 'ar', measurementSystem: 'metric', currency: 'QAR', dateFormat: 'YMD', livekitVoiceNode: 'nova_ar' },
    MX: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'MXN', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    IN: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'INR', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    ID: { primaryLanguage: 'ind', measurementSystem: 'metric', currency: 'IDR', dateFormat: 'YMD', livekitVoiceNode: 'nova_ind' },
    TH: { primaryLanguage: 'tha', measurementSystem: 'metric', currency: 'THB', dateFormat: 'YMD', livekitVoiceNode: 'nova_tha' },
    PL: { primaryLanguage: 'pl', measurementSystem: 'metric', currency: 'PLN', dateFormat: 'YMD', livekitVoiceNode: 'nova_pl' },
    CZ: { primaryLanguage: 'cs', measurementSystem: 'metric', currency: 'CZK', dateFormat: 'YMD', livekitVoiceNode: 'nova_cs' },
    SK: { primaryLanguage: 'sk', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_sk' },
    HU: { primaryLanguage: 'hu', measurementSystem: 'metric', currency: 'HUF', dateFormat: 'YMD', livekitVoiceNode: 'nova_hu' },
    SI: { primaryLanguage: 'sl', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_sl' },
    EE: { primaryLanguage: 'et', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_et' },
    LV: { primaryLanguage: 'lv', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_lv' },
    LT: { primaryLanguage: 'lt', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_lt' },
    HR: { primaryLanguage: 'hr', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_hr' },
    RO: { primaryLanguage: 'ro', measurementSystem: 'metric', currency: 'RON', dateFormat: 'YMD', livekitVoiceNode: 'nova_ro' },
    BG: { primaryLanguage: 'bg', measurementSystem: 'metric', currency: 'BGN', dateFormat: 'YMD', livekitVoiceNode: 'nova_bg' },
    GR: { primaryLanguage: 'el', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_el' },
    TR: { primaryLanguage: 'tr', measurementSystem: 'metric', currency: 'TRY', dateFormat: 'YMD', livekitVoiceNode: 'nova_tr' },
    KW: { primaryLanguage: 'ar', measurementSystem: 'metric', currency: 'KWD', dateFormat: 'YMD', livekitVoiceNode: 'nova_ar' },
    OM: { primaryLanguage: 'ar', measurementSystem: 'metric', currency: 'OMR', dateFormat: 'YMD', livekitVoiceNode: 'nova_ar' },
    BH: { primaryLanguage: 'ar', measurementSystem: 'metric', currency: 'BHD', dateFormat: 'YMD', livekitVoiceNode: 'nova_ar' },
    SG: { primaryLanguage: 'en', measurementSystem: 'metric', currency: 'SGD', dateFormat: 'DMY', livekitVoiceNode: 'nova_en' },
    MY: { primaryLanguage: 'ms', measurementSystem: 'metric', currency: 'MYR', dateFormat: 'YMD', livekitVoiceNode: 'nova_ms' },
    JP: { primaryLanguage: 'ja', measurementSystem: 'metric', currency: 'JPY', dateFormat: 'YMD', livekitVoiceNode: 'nova_ja' },
    KR: { primaryLanguage: 'ko', measurementSystem: 'metric', currency: 'KRW', dateFormat: 'YMD', livekitVoiceNode: 'nova_ko' },
    CL: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'CLP', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    AR: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'ARS', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    CO: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'COP', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    PE: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'PEN', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    VN: { primaryLanguage: 'vie', measurementSystem: 'metric', currency: 'VND', dateFormat: 'YMD', livekitVoiceNode: 'nova_vie' },
    PH: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'PHP', dateFormat: 'MDY', livekitVoiceNode: 'nova_eng' },
    UY: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'UYU', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    PA: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'USD', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    CR: { primaryLanguage: 'es', measurementSystem: 'metric', currency: 'CRC', dateFormat: 'YMD', livekitVoiceNode: 'nova_es' },
    IL: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'ILS', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    NG: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'NGN', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    EG: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'EGP', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    KE: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'KES', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    MA: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'MAD', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    RS: { primaryLanguage: 'srp', measurementSystem: 'metric', currency: 'RSD', dateFormat: 'YMD', livekitVoiceNode: 'nova_srp' },
    UA: { primaryLanguage: 'ukr', measurementSystem: 'metric', currency: 'UAH', dateFormat: 'YMD', livekitVoiceNode: 'nova_ukr' },
    KZ: { primaryLanguage: 'kaz', measurementSystem: 'metric', currency: 'KZT', dateFormat: 'YMD', livekitVoiceNode: 'nova_kaz' },
    TW: { primaryLanguage: 'zho', measurementSystem: 'metric', currency: 'TWD', dateFormat: 'YMD', livekitVoiceNode: 'nova_zho' },
    PK: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'PKR', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    BD: { primaryLanguage: 'ben', measurementSystem: 'metric', currency: 'BDT', dateFormat: 'YMD', livekitVoiceNode: 'nova_ben' },
    MN: { primaryLanguage: 'mon', measurementSystem: 'metric', currency: 'MNT', dateFormat: 'YMD', livekitVoiceNode: 'nova_mon' },
    TT: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'TTD', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    JO: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'JOD', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    GH: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'GHS', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    TZ: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'TZS', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    GE: { primaryLanguage: 'kat', measurementSystem: 'metric', currency: 'GEL', dateFormat: 'YMD', livekitVoiceNode: 'nova_kat' },
    AZ: { primaryLanguage: 'aze', measurementSystem: 'metric', currency: 'AZN', dateFormat: 'YMD', livekitVoiceNode: 'nova_aze' },
    CY: { primaryLanguage: 'ell', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_ell' },
    IS: { primaryLanguage: 'isl', measurementSystem: 'metric', currency: 'ISK', dateFormat: 'YMD', livekitVoiceNode: 'nova_isl' },
    LU: { primaryLanguage: 'deu', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_deu' },
    EC: { primaryLanguage: 'spa', measurementSystem: 'metric', currency: 'USD', dateFormat: 'YMD', livekitVoiceNode: 'nova_spa' },
    BO: { primaryLanguage: 'aym', measurementSystem: 'metric', currency: 'BOB', dateFormat: 'YMD', livekitVoiceNode: 'nova_aym' },
    PY: { primaryLanguage: 'grn', measurementSystem: 'metric', currency: 'PYG', dateFormat: 'YMD', livekitVoiceNode: 'nova_grn' },
    GT: { primaryLanguage: 'spa', measurementSystem: 'metric', currency: 'GTQ', dateFormat: 'YMD', livekitVoiceNode: 'nova_spa' },
    DO: { primaryLanguage: 'spa', measurementSystem: 'metric', currency: 'DOP', dateFormat: 'YMD', livekitVoiceNode: 'nova_spa' },
    HN: { primaryLanguage: 'spa', measurementSystem: 'metric', currency: 'HNL', dateFormat: 'YMD', livekitVoiceNode: 'nova_spa' },
    SV: { primaryLanguage: 'spa', measurementSystem: 'metric', currency: 'USD', dateFormat: 'YMD', livekitVoiceNode: 'nova_spa' },
    NI: { primaryLanguage: 'spa', measurementSystem: 'metric', currency: 'NIO', dateFormat: 'YMD', livekitVoiceNode: 'nova_spa' },
    JM: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'JMD', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    GY: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'GYD', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    SR: { primaryLanguage: 'nld', measurementSystem: 'metric', currency: 'SRD', dateFormat: 'YMD', livekitVoiceNode: 'nova_nld' },
    BA: { primaryLanguage: 'bos', measurementSystem: 'metric', currency: 'BAM', dateFormat: 'YMD', livekitVoiceNode: 'nova_bos' },
    ME: { primaryLanguage: 'cnr', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_cnr' },
    MK: { primaryLanguage: 'mkd', measurementSystem: 'metric', currency: 'MKD', dateFormat: 'YMD', livekitVoiceNode: 'nova_mkd' },
    AL: { primaryLanguage: 'sqi', measurementSystem: 'metric', currency: 'ALL', dateFormat: 'YMD', livekitVoiceNode: 'nova_sqi' },
    MD: { primaryLanguage: 'ron', measurementSystem: 'metric', currency: 'MDL', dateFormat: 'YMD', livekitVoiceNode: 'nova_ron' },
    IQ: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'IQD', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    NA: { primaryLanguage: 'afr', measurementSystem: 'metric', currency: 'NAD', dateFormat: 'YMD', livekitVoiceNode: 'nova_afr' },
    AO: { primaryLanguage: 'por', measurementSystem: 'metric', currency: 'AOA', dateFormat: 'YMD', livekitVoiceNode: 'nova_por' },
    MZ: { primaryLanguage: 'por', measurementSystem: 'metric', currency: 'MZN', dateFormat: 'YMD', livekitVoiceNode: 'nova_por' },
    ET: { primaryLanguage: 'amh', measurementSystem: 'metric', currency: 'ETB', dateFormat: 'YMD', livekitVoiceNode: 'nova_amh' },
    CI: { primaryLanguage: 'fra', measurementSystem: 'metric', currency: 'XOF', dateFormat: 'YMD', livekitVoiceNode: 'nova_fra' },
    SN: { primaryLanguage: 'fra', measurementSystem: 'metric', currency: 'XOF', dateFormat: 'YMD', livekitVoiceNode: 'nova_fra' },
    BW: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'BWP', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    ZM: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'ZMW', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    UG: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'UGX', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    CM: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'XAF', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    KH: { primaryLanguage: 'khm', measurementSystem: 'metric', currency: 'KHR', dateFormat: 'YMD', livekitVoiceNode: 'nova_khm' },
    LK: { primaryLanguage: 'sin', measurementSystem: 'metric', currency: 'LKR', dateFormat: 'YMD', livekitVoiceNode: 'nova_sin' },
    UZ: { primaryLanguage: 'rus', measurementSystem: 'metric', currency: 'UZS', dateFormat: 'YMD', livekitVoiceNode: 'nova_rus' },
    LA: { primaryLanguage: 'lao', measurementSystem: 'metric', currency: 'LAK', dateFormat: 'YMD', livekitVoiceNode: 'nova_lao' },
    NP: { primaryLanguage: 'nep', measurementSystem: 'metric', currency: 'NPR', dateFormat: 'YMD', livekitVoiceNode: 'nova_nep' },
    DZ: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'DZD', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    TN: { primaryLanguage: 'ara', measurementSystem: 'metric', currency: 'TND', dateFormat: 'YMD', livekitVoiceNode: 'nova_ara' },
    MT: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'EUR', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    BN: { primaryLanguage: 'msa', measurementSystem: 'metric', currency: 'BND', dateFormat: 'YMD', livekitVoiceNode: 'nova_msa' },
    RW: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'RWF', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    MG: { primaryLanguage: 'fra', measurementSystem: 'metric', currency: 'MGA', dateFormat: 'YMD', livekitVoiceNode: 'nova_fra' },
    PG: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'PGK', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
    TM: { primaryLanguage: 'rus', measurementSystem: 'metric', currency: 'TMT', dateFormat: 'YMD', livekitVoiceNode: 'nova_rus' },
    KG: { primaryLanguage: 'kir', measurementSystem: 'metric', currency: 'KGS', dateFormat: 'YMD', livekitVoiceNode: 'nova_kir' },
    MW: { primaryLanguage: 'eng', measurementSystem: 'metric', currency: 'MWK', dateFormat: 'YMD', livekitVoiceNode: 'nova_eng' },
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
