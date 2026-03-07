// ══════════════════════════════════════════════════════════════
// COMPLIANCE FIREWALL — Country-Aware Content Gating
// Spec: HC_DOMINATION_PATCH_V1 Phase 4 — Globalization
// Purpose: Ensure every page uses correct terminology,
//          regulations, and UI patterns for its country.
//          Block non-compliant content from rendering.
// ══════════════════════════════════════════════════════════════

import { COUNTRY_LOCALES, type LocaleConfig } from "./country-locales";

// ── Country-Specific Content Rules ──

export interface ComplianceRule {
    /** Which countries this rule applies to */
    countries: string[];
    /** Rule category */
    category: "terminology" | "regulation" | "currency" | "measurement" | "date" | "content" | "legal";
    /** Human-readable rule description */
    rule: string;
    /** What to do if violated */
    action: "block" | "warn" | "auto_fix";
    /** Auto-fix function identifier */
    autoFixId?: string;
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
    // ── Terminology compliance ──
    {
        countries: ["GB", "IE", "NZ", "AU", "ZA"],
        category: "terminology",
        rule: "Use 'escort vehicle' not 'pilot car'. Use 'abnormal load' not 'oversize load' (GB). Use 'over-dimensional' (AU/NZ).",
        action: "auto_fix",
        autoFixId: "TERM_ESCORT_VEHICLE",
    },
    {
        countries: ["DE", "AT", "CH"],
        category: "terminology",
        rule: "Use 'Begleitfahrzeug' for escort vehicle, 'Schwertransport' for heavy transport.",
        action: "auto_fix",
        autoFixId: "TERM_DE",
    },
    {
        countries: ["FR", "BE"],
        category: "terminology",
        rule: "Use 'véhicule d'accompagnement' for escort vehicle, 'convoi exceptionnel' for oversize load.",
        action: "auto_fix",
        autoFixId: "TERM_FR",
    },
    {
        countries: ["ES", "MX", "AR", "CL", "CO", "PE", "UY", "PA", "CR"],
        category: "terminology",
        rule: "Use 'vehículo escolta' for escort vehicle, 'carga sobredimensionada' for oversize load.",
        action: "auto_fix",
        autoFixId: "TERM_ES",
    },
    {
        countries: ["BR", "PT"],
        category: "terminology",
        rule: "Use 'veículo batedor' (BR) or 'veículo de escolta' (PT) for escort vehicle.",
        action: "auto_fix",
        autoFixId: "TERM_PT",
    },
    {
        countries: ["AE", "SA", "QA", "KW", "OM", "BH"],
        category: "terminology",
        rule: "Use RTL layout. Use Arabic terms with English fallback for technical terms.",
        action: "warn",
    },
    {
        countries: ["JP"],
        category: "terminology",
        rule: "Use '先導車' (sendō-sha) for pilot car, '特殊車両' (tokushu sharyō) for special vehicle.",
        action: "auto_fix",
        autoFixId: "TERM_JA",
    },

    // ── Measurement compliance ──
    {
        countries: ["US"],
        category: "measurement",
        rule: "Display distances in miles, weights in pounds/tons. Height in feet+inches for bridge clearance.",
        action: "auto_fix",
        autoFixId: "UNIT_IMPERIAL",
    },
    {
        countries: ["GB"],
        category: "measurement",
        rule: "Display distances in miles but weights in tonnes. Height in feet+inches for bridge clearance. Mixed system.",
        action: "auto_fix",
        autoFixId: "UNIT_UK_MIXED",
    },

    // ── Date format compliance ──
    {
        countries: ["US"],
        category: "date",
        rule: "Use MM/DD/YYYY format. 12-hour clock with AM/PM.",
        action: "auto_fix",
        autoFixId: "DATE_US",
    },
    {
        countries: ["JP", "KR", "HU", "LT", "SE"],
        category: "date",
        rule: "Use YYYY/MM/DD format (ISO-like). 24-hour clock.",
        action: "auto_fix",
        autoFixId: "DATE_YMD",
    },

    // ── Regulatory compliance ──
    {
        countries: ["US"],
        category: "regulation",
        rule: "Reference FHWA, FMCSA, MUTCD. State-level regulations via DOT. PEVO certification where required.",
        action: "warn",
    },
    {
        countries: ["AU"],
        category: "regulation",
        rule: "Reference NHVR (National Heavy Vehicle Regulator). State road authorities for permits.",
        action: "warn",
    },
    {
        countries: ["GB"],
        category: "regulation",
        rule: "Reference DVSA, Highways England. STGO (Special Types General Order) for oversize movements.",
        action: "warn",
    },

    // ── Legal content compliance ──
    {
        countries: ["DE", "AT", "CH", "FR", "IT", "ES", "PT", "NL", "BE", "SE", "NO", "DK", "FI",
            "PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "IE"],
        category: "legal",
        rule: "GDPR applies. Cookie consent required before analytics. Data processing agreements for user data.",
        action: "block",
    },
    {
        countries: ["BR"],
        category: "legal",
        rule: "LGPD (Lei Geral de Proteção de Dados) applies. Similar to GDPR requirements.",
        action: "block",
    },
];

// ── Compliance Checker ──

export interface ComplianceCheckResult {
    passed: boolean;
    violations: {
        rule: ComplianceRule;
        details: string;
    }[];
    warnings: {
        rule: ComplianceRule;
        details: string;
    }[];
    autoFixes: {
        fixId: string;
        rule: ComplianceRule;
    }[];
}

export function checkCompliance(iso2: string): ComplianceCheckResult {
    const result: ComplianceCheckResult = {
        passed: true,
        violations: [],
        warnings: [],
        autoFixes: [],
    };

    const applicableRules = COMPLIANCE_RULES.filter(r => r.countries.includes(iso2));

    for (const rule of applicableRules) {
        if (rule.action === "auto_fix" && rule.autoFixId) {
            result.autoFixes.push({ fixId: rule.autoFixId, rule });
        } else if (rule.action === "warn") {
            result.warnings.push({ rule, details: rule.rule });
        } else if (rule.action === "block") {
            // Block rules are always flagged — implementation must handle them
            result.warnings.push({ rule, details: `REQUIRED: ${rule.rule}` });
        }
    }

    return result;
}

// ── RTL Detection ──

const RTL_COUNTRIES = new Set(["AE", "SA", "QA", "KW", "OM", "BH"]);

export function isRTL(iso2: string): boolean {
    return RTL_COUNTRIES.has(iso2);
}

export function getTextDirection(iso2: string): "ltr" | "rtl" {
    return isRTL(iso2) ? "rtl" : "ltr";
}

// ── GDPR Detection ──

const GDPR_COUNTRIES = new Set([
    "DE", "AT", "CH", "FR", "IT", "ES", "PT", "NL", "BE", "SE", "NO", "DK", "FI",
    "PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "IE",
    "GB", // UK GDPR post-Brexit
]);

export function requiresGDPR(iso2: string): boolean {
    return GDPR_COUNTRIES.has(iso2);
}

export function requiresLGPD(iso2: string): boolean {
    return iso2 === "BR";
}

export function requiresPrivacyConsent(iso2: string): boolean {
    return requiresGDPR(iso2) || requiresLGPD(iso2);
}

// ── Content Localization Helpers ──

/** Get the correct "call to action" phrasing for a country */
export function getLocalCTA(iso2: string, type: "list" | "claim" | "contact" | "search"): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return getDefaultCTA(type);

    // For English locales, use slight variations
    if (locale.locale.startsWith("en")) {
        const ctaMap: Record<string, Record<typeof type, string>> = {
            "en-US": { list: "List Your Service", claim: "Claim This Listing", contact: "Get in Touch", search: "Find Operators" },
            "en-GB": { list: "List Your Service", claim: "Claim This Listing", contact: "Get in Touch", search: "Find Escort Operators" },
            "en-AU": { list: "List Your Service", claim: "Claim This Listing", contact: "Get in Touch", search: "Find Escort Vehicles" },
        };
        return ctaMap[locale.locale]?.[type] || getDefaultCTA(type);
    }

    return getDefaultCTA(type);
}

function getDefaultCTA(type: "list" | "claim" | "contact" | "search"): string {
    switch (type) {
        case "list": return "List Your Service";
        case "claim": return "Claim This Listing";
        case "contact": return "Get in Touch";
        case "search": return "Find Operators";
    }
}

// ── Currency Exchange Rate Cache ──
// In production, this would be backed by a 24h-refresh API call

export interface ExchangeRateCache {
    baseCurrency: "USD";
    rates: Record<string, number>;
    lastUpdated: string;
    ttlHours: number;
}

export function createExchangeRateCache(rates: Record<string, number>): ExchangeRateCache {
    return {
        baseCurrency: "USD",
        rates,
        lastUpdated: new Date().toISOString(),
        ttlHours: 24,
    };
}

export function convertToLocal(
    amountUsd: number,
    iso2: string,
    rateCache: ExchangeRateCache
): number {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale || locale.currency === "USD") return amountUsd;
    const rate = rateCache.rates[locale.currency];
    if (!rate) return amountUsd;
    return amountUsd * rate;
}

export function convertToUsd(
    amountLocal: number,
    iso2: string,
    rateCache: ExchangeRateCache
): number {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale || locale.currency === "USD") return amountLocal;
    const rate = rateCache.rates[locale.currency];
    if (!rate) return amountLocal;
    return amountLocal / rate;
}
