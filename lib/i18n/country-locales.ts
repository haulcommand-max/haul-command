// ══════════════════════════════════════════════════════════════
// GLOBALIZATION PLUMBING — i18n + Currency + Timezone
// Spec: HC_DOMINATION_PATCH_V1 Phase 4
// Purpose: Make the 52-country directory feel local everywhere
// ══════════════════════════════════════════════════════════════

// ── Supported Locales ──

export interface LocaleConfig {
    iso2: string;
    /** Primary locale code (BCP 47) */
    locale: string;
    /** Fallback locale */
    fallback: string;
    /** Native language name */
    nativeName: string;
    /** English name */
    englishName: string;
    /** IANA timezone (primary) */
    primaryTimezone: string;
    /** All common timezones in this country */
    timezones: string[];
    /** ISO 4217 currency code */
    currency: string;
    /** Currency symbol */
    currencySymbol: string;
    /** Measurement system */
    measurementSystem: "metric" | "imperial" | "mixed";
    /** Date format pattern */
    dateFormat: "MDY" | "DMY" | "YMD";
    /** Distance unit */
    distanceUnit: "km" | "mi";
    /** Weight unit */
    weightUnit: "kg" | "t" | "lb" | "ton";
    /** Number grouping separator */
    thousandsSep: string;
    /** Decimal separator */
    decimalSep: string;
}

// ── All 52 country locale configs ──

export const COUNTRY_LOCALES: Record<string, LocaleConfig> = {
    // ── Tier A Gold ──
    US: { iso2: "US", locale: "en-US", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "America/New_York", timezones: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"], currency: "USD", currencySymbol: "$", measurementSystem: "imperial", dateFormat: "MDY", distanceUnit: "mi", weightUnit: "lb", thousandsSep: ",", decimalSep: "." },
    CA: { iso2: "CA", locale: "en-CA", fallback: "en", nativeName: "English / Français", englishName: "English / French", primaryTimezone: "America/Toronto", timezones: ["America/Toronto", "America/Winnipeg", "America/Edmonton", "America/Vancouver", "America/Halifax", "America/St_Johns"], currency: "CAD", currencySymbol: "C$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "kg", thousandsSep: ",", decimalSep: "." },
    AU: { iso2: "AU", locale: "en-AU", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "Australia/Sydney", timezones: ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth", "Australia/Adelaide", "Australia/Darwin"], currency: "AUD", currencySymbol: "A$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    GB: { iso2: "GB", locale: "en-GB", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "Europe/London", timezones: ["Europe/London"], currency: "GBP", currencySymbol: "£", measurementSystem: "mixed", dateFormat: "DMY", distanceUnit: "mi", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    NZ: { iso2: "NZ", locale: "en-NZ", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "Pacific/Auckland", timezones: ["Pacific/Auckland", "Pacific/Chatham"], currency: "NZD", currencySymbol: "NZ$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    ZA: { iso2: "ZA", locale: "en-ZA", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "Africa/Johannesburg", timezones: ["Africa/Johannesburg"], currency: "ZAR", currencySymbol: "R", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    DE: { iso2: "DE", locale: "de-DE", fallback: "en", nativeName: "Deutsch", englishName: "German", primaryTimezone: "Europe/Berlin", timezones: ["Europe/Berlin"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    NL: { iso2: "NL", locale: "nl-NL", fallback: "en", nativeName: "Nederlands", englishName: "Dutch", primaryTimezone: "Europe/Amsterdam", timezones: ["Europe/Amsterdam"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    AE: { iso2: "AE", locale: "ar-AE", fallback: "en", nativeName: "العربية", englishName: "Arabic", primaryTimezone: "Asia/Dubai", timezones: ["Asia/Dubai"], currency: "AED", currencySymbol: "د.إ", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    BR: { iso2: "BR", locale: "pt-BR", fallback: "en", nativeName: "Português", englishName: "Portuguese", primaryTimezone: "America/Sao_Paulo", timezones: ["America/Sao_Paulo", "America/Manaus", "America/Recife", "America/Belem"], currency: "BRL", currencySymbol: "R$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },

    // ── Tier B Blue ──
    IE: { iso2: "IE", locale: "en-IE", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "Europe/Dublin", timezones: ["Europe/Dublin"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    SE: { iso2: "SE", locale: "sv-SE", fallback: "en", nativeName: "Svenska", englishName: "Swedish", primaryTimezone: "Europe/Stockholm", timezones: ["Europe/Stockholm"], currency: "SEK", currencySymbol: "kr", measurementSystem: "metric", dateFormat: "YMD", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    NO: { iso2: "NO", locale: "nb-NO", fallback: "en", nativeName: "Norsk", englishName: "Norwegian", primaryTimezone: "Europe/Oslo", timezones: ["Europe/Oslo"], currency: "NOK", currencySymbol: "kr", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    DK: { iso2: "DK", locale: "da-DK", fallback: "en", nativeName: "Dansk", englishName: "Danish", primaryTimezone: "Europe/Copenhagen", timezones: ["Europe/Copenhagen"], currency: "DKK", currencySymbol: "kr", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    FI: { iso2: "FI", locale: "fi-FI", fallback: "en", nativeName: "Suomi", englishName: "Finnish", primaryTimezone: "Europe/Helsinki", timezones: ["Europe/Helsinki"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    BE: { iso2: "BE", locale: "nl-BE", fallback: "en", nativeName: "Nederlands / Français", englishName: "Dutch / French", primaryTimezone: "Europe/Brussels", timezones: ["Europe/Brussels"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    AT: { iso2: "AT", locale: "de-AT", fallback: "en", nativeName: "Deutsch", englishName: "German", primaryTimezone: "Europe/Vienna", timezones: ["Europe/Vienna"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    CH: { iso2: "CH", locale: "de-CH", fallback: "en", nativeName: "Deutsch / Français / Italiano", englishName: "German / French / Italian", primaryTimezone: "Europe/Zurich", timezones: ["Europe/Zurich"], currency: "CHF", currencySymbol: "CHF", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: "'", decimalSep: "." },
    ES: { iso2: "ES", locale: "es-ES", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "Europe/Madrid", timezones: ["Europe/Madrid", "Atlantic/Canary"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    FR: { iso2: "FR", locale: "fr-FR", fallback: "en", nativeName: "Français", englishName: "French", primaryTimezone: "Europe/Paris", timezones: ["Europe/Paris"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    IT: { iso2: "IT", locale: "it-IT", fallback: "en", nativeName: "Italiano", englishName: "Italian", primaryTimezone: "Europe/Rome", timezones: ["Europe/Rome"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    PT: { iso2: "PT", locale: "pt-PT", fallback: "en", nativeName: "Português", englishName: "Portuguese", primaryTimezone: "Europe/Lisbon", timezones: ["Europe/Lisbon", "Atlantic/Azores"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    SA: { iso2: "SA", locale: "ar-SA", fallback: "en", nativeName: "العربية", englishName: "Arabic", primaryTimezone: "Asia/Riyadh", timezones: ["Asia/Riyadh"], currency: "SAR", currencySymbol: "﷼", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    QA: { iso2: "QA", locale: "ar-QA", fallback: "en", nativeName: "العربية", englishName: "Arabic", primaryTimezone: "Asia/Qatar", timezones: ["Asia/Qatar"], currency: "QAR", currencySymbol: "﷼", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    MX: { iso2: "MX", locale: "es-MX", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Mexico_City", timezones: ["America/Mexico_City", "America/Cancun", "America/Chihuahua", "America/Tijuana"], currency: "MXN", currencySymbol: "$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },

    // ── Tier C Silver ──
    PL: { iso2: "PL", locale: "pl-PL", fallback: "en", nativeName: "Polski", englishName: "Polish", primaryTimezone: "Europe/Warsaw", timezones: ["Europe/Warsaw"], currency: "PLN", currencySymbol: "zł", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    CZ: { iso2: "CZ", locale: "cs-CZ", fallback: "en", nativeName: "Čeština", englishName: "Czech", primaryTimezone: "Europe/Prague", timezones: ["Europe/Prague"], currency: "CZK", currencySymbol: "Kč", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    SK: { iso2: "SK", locale: "sk-SK", fallback: "en", nativeName: "Slovenčina", englishName: "Slovak", primaryTimezone: "Europe/Bratislava", timezones: ["Europe/Bratislava"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    HU: { iso2: "HU", locale: "hu-HU", fallback: "en", nativeName: "Magyar", englishName: "Hungarian", primaryTimezone: "Europe/Budapest", timezones: ["Europe/Budapest"], currency: "HUF", currencySymbol: "Ft", measurementSystem: "metric", dateFormat: "YMD", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    SI: { iso2: "SI", locale: "sl-SI", fallback: "en", nativeName: "Slovenščina", englishName: "Slovenian", primaryTimezone: "Europe/Ljubljana", timezones: ["Europe/Ljubljana"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    EE: { iso2: "EE", locale: "et-EE", fallback: "en", nativeName: "Eesti", englishName: "Estonian", primaryTimezone: "Europe/Tallinn", timezones: ["Europe/Tallinn"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    LV: { iso2: "LV", locale: "lv-LV", fallback: "en", nativeName: "Latviešu", englishName: "Latvian", primaryTimezone: "Europe/Riga", timezones: ["Europe/Riga"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    LT: { iso2: "LT", locale: "lt-LT", fallback: "en", nativeName: "Lietuvių", englishName: "Lithuanian", primaryTimezone: "Europe/Vilnius", timezones: ["Europe/Vilnius"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "YMD", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    HR: { iso2: "HR", locale: "hr-HR", fallback: "en", nativeName: "Hrvatski", englishName: "Croatian", primaryTimezone: "Europe/Zagreb", timezones: ["Europe/Zagreb"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    RO: { iso2: "RO", locale: "ro-RO", fallback: "en", nativeName: "Română", englishName: "Romanian", primaryTimezone: "Europe/Bucharest", timezones: ["Europe/Bucharest"], currency: "RON", currencySymbol: "lei", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    BG: { iso2: "BG", locale: "bg-BG", fallback: "en", nativeName: "Български", englishName: "Bulgarian", primaryTimezone: "Europe/Sofia", timezones: ["Europe/Sofia"], currency: "BGN", currencySymbol: "лв", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: " ", decimalSep: "," },
    GR: { iso2: "GR", locale: "el-GR", fallback: "en", nativeName: "Ελληνικά", englishName: "Greek", primaryTimezone: "Europe/Athens", timezones: ["Europe/Athens"], currency: "EUR", currencySymbol: "€", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    TR: { iso2: "TR", locale: "tr-TR", fallback: "en", nativeName: "Türkçe", englishName: "Turkish", primaryTimezone: "Europe/Istanbul", timezones: ["Europe/Istanbul"], currency: "TRY", currencySymbol: "₺", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    KW: { iso2: "KW", locale: "ar-KW", fallback: "en", nativeName: "العربية", englishName: "Arabic", primaryTimezone: "Asia/Kuwait", timezones: ["Asia/Kuwait"], currency: "KWD", currencySymbol: "د.ك", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    OM: { iso2: "OM", locale: "ar-OM", fallback: "en", nativeName: "العربية", englishName: "Arabic", primaryTimezone: "Asia/Muscat", timezones: ["Asia/Muscat"], currency: "OMR", currencySymbol: "﷼", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    BH: { iso2: "BH", locale: "ar-BH", fallback: "en", nativeName: "العربية", englishName: "Arabic", primaryTimezone: "Asia/Bahrain", timezones: ["Asia/Bahrain"], currency: "BHD", currencySymbol: ".د.ب", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    SG: { iso2: "SG", locale: "en-SG", fallback: "en", nativeName: "English", englishName: "English", primaryTimezone: "Asia/Singapore", timezones: ["Asia/Singapore"], currency: "SGD", currencySymbol: "S$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    MY: { iso2: "MY", locale: "ms-MY", fallback: "en", nativeName: "Bahasa Melayu", englishName: "Malay", primaryTimezone: "Asia/Kuala_Lumpur", timezones: ["Asia/Kuala_Lumpur"], currency: "MYR", currencySymbol: "RM", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    JP: { iso2: "JP", locale: "ja-JP", fallback: "en", nativeName: "日本語", englishName: "Japanese", primaryTimezone: "Asia/Tokyo", timezones: ["Asia/Tokyo"], currency: "JPY", currencySymbol: "¥", measurementSystem: "metric", dateFormat: "YMD", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    KR: { iso2: "KR", locale: "ko-KR", fallback: "en", nativeName: "한국어", englishName: "Korean", primaryTimezone: "Asia/Seoul", timezones: ["Asia/Seoul"], currency: "KRW", currencySymbol: "₩", measurementSystem: "metric", dateFormat: "YMD", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    CL: { iso2: "CL", locale: "es-CL", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Santiago", timezones: ["America/Santiago", "Pacific/Easter"], currency: "CLP", currencySymbol: "$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    AR: { iso2: "AR", locale: "es-AR", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Argentina/Buenos_Aires", timezones: ["America/Argentina/Buenos_Aires"], currency: "ARS", currencySymbol: "$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    CO: { iso2: "CO", locale: "es-CO", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Bogota", timezones: ["America/Bogota"], currency: "COP", currencySymbol: "$", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    PE: { iso2: "PE", locale: "es-PE", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Lima", timezones: ["America/Lima"], currency: "PEN", currencySymbol: "S/", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },

    // ── Tier D Slate ──
    UY: { iso2: "UY", locale: "es-UY", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Montevideo", timezones: ["America/Montevideo"], currency: "UYU", currencySymbol: "$U", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
    PA: { iso2: "PA", locale: "es-PA", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Panama", timezones: ["America/Panama"], currency: "PAB", currencySymbol: "B/.", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ",", decimalSep: "." },
    CR: { iso2: "CR", locale: "es-CR", fallback: "en", nativeName: "Español", englishName: "Spanish", primaryTimezone: "America/Costa_Rica", timezones: ["America/Costa_Rica"], currency: "CRC", currencySymbol: "₡", measurementSystem: "metric", dateFormat: "DMY", distanceUnit: "km", weightUnit: "t", thousandsSep: ".", decimalSep: "," },
};

// ── Helpers ──

export function getLocaleConfig(iso2: string): LocaleConfig | undefined {
    return COUNTRY_LOCALES[iso2];
}

export function getAllCurrencies(): string[] {
    return [...new Set(Object.values(COUNTRY_LOCALES).map(l => l.currency))];
}

export function getCountriesByCurrency(currencyCode: string): string[] {
    return Object.entries(COUNTRY_LOCALES)
        .filter(([_, l]) => l.currency === currencyCode)
        .map(([iso2]) => iso2);
}

export function getCountriesByLanguage(langPrefix: string): string[] {
    return Object.entries(COUNTRY_LOCALES)
        .filter(([_, l]) => l.locale.startsWith(langPrefix))
        .map(([iso2]) => iso2);
}
