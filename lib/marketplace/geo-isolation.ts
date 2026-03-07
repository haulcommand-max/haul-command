// lib/marketplace/geo-isolation.ts
//
// Geo Isolation Engine for the Escort Marketplace
// Enforces country/admin1 visibility rules at query, match, notification, and render layers.
// Supports cross-border exceptions when compliance rules pass.

export interface GeoScope {
    country_code: string;
    admin1_code?: string | null;
    cross_border_allowed: boolean;
    permitted_cross_border_countries?: string[];
}

export interface GeoIsolationResult {
    allowed: boolean;
    reason?: string;
    scope: GeoScope;
}

// ============================================================
// COUNTRY & ADMIN1 RULES
// ============================================================

// Countries with admin1-level isolation (state/province enforcement)
const ADMIN1_ENFORCED_COUNTRIES = new Set([
    "US", "CA", "AU", "DE", "BR", "IN", "MX",
]);

// Pre-approved cross-border corridors
const CROSS_BORDER_CORRIDORS: Record<string, string[]> = {
    US: ["CA", "MX"],
    CA: ["US"],
    GB: ["IE"],
    IE: ["GB"],
    NL: ["DE", "BE"],
    DE: ["NL", "AT", "FR", "PL", "CZ"],
    FR: ["DE", "ES", "IT", "BE"],
    ES: ["FR", "PT"],
    IT: ["FR", "AT", "CH"],
    AU: ["NZ"],
    NZ: ["AU"],
    SG: ["MY"],
    AE: ["SA", "OM"],
    ZA: [],
};

// ============================================================
// ENFORCEMENT
// ============================================================

/**
 * Check if an operator is visible to a load request based on geo rules.
 */
export function checkGeoVisibility(
    operatorCountry: string,
    operatorAdmin1: string[],
    loadCountry: string,
    loadAdmin1: string | null,
    crossBorderFlag: boolean
): GeoIsolationResult {
    const scope: GeoScope = {
        country_code: loadCountry,
        admin1_code: loadAdmin1,
        cross_border_allowed: crossBorderFlag,
    };

    // Same country — always check
    if (operatorCountry === loadCountry) {
        // If admin1 is enforced and specified, check overlap
        if (
            ADMIN1_ENFORCED_COUNTRIES.has(loadCountry) &&
            loadAdmin1 &&
            operatorAdmin1.length > 0
        ) {
            const hasOverlap = operatorAdmin1.includes(loadAdmin1);
            if (!hasOverlap) {
                return {
                    allowed: false,
                    reason: `Operator admin1 coverage [${operatorAdmin1.join(",")}] does not include load admin1 [${loadAdmin1}]`,
                    scope,
                };
            }
        }
        return { allowed: true, scope };
    }

    // Different country — cross-border check
    if (!crossBorderFlag) {
        return {
            allowed: false,
            reason: `Cross-border not allowed. Operator country [${operatorCountry}] != load country [${loadCountry}]`,
            scope,
        };
    }

    // Check if cross-border corridor exists
    const permittedCountries = CROSS_BORDER_CORRIDORS[loadCountry] ?? [];
    if (!permittedCountries.includes(operatorCountry)) {
        return {
            allowed: false,
            reason: `No approved cross-border corridor from [${loadCountry}] to [${operatorCountry}]`,
            scope: { ...scope, permitted_cross_border_countries: permittedCountries },
        };
    }

    return {
        allowed: true,
        scope: { ...scope, permitted_cross_border_countries: permittedCountries },
    };
}

/**
 * Filter a list of operators by geo isolation rules.
 */
export function filterByGeoIsolation<T extends { country_code: string; admin1_coverage: string[] }>(
    operators: T[],
    loadCountry: string,
    loadAdmin1: string | null,
    crossBorderFlag: boolean
): { allowed: T[]; blocked: { operator: T; reason: string }[] } {
    const allowed: T[] = [];
    const blocked: { operator: T; reason: string }[] = [];

    for (const op of operators) {
        const result = checkGeoVisibility(
            op.country_code,
            op.admin1_coverage,
            loadCountry,
            loadAdmin1,
            crossBorderFlag
        );

        if (result.allowed) {
            allowed.push(op);
        } else {
            blocked.push({ operator: op, reason: result.reason ?? "Geo isolation blocked" });
        }
    }

    return { allowed, blocked };
}

/**
 * Get the permitted visibility scope for a user based on their country/admin1.
 * Used at the UI render layer to determine what listings/loads to show.
 */
export function getUserVisibilityScope(
    userCountry: string,
    userAdmin1: string | null,
    expandedRadius: boolean = false
): {
    primary_country: string;
    primary_admin1: string | null;
    visible_countries: string[];
    admin1_enforced: boolean;
} {
    const admin1Enforced = ADMIN1_ENFORCED_COUNTRIES.has(userCountry);
    const crossBorderCountries = CROSS_BORDER_CORRIDORS[userCountry] ?? [];

    // If expanded radius, show cross-border countries too
    const visibleCountries = expandedRadius
        ? [userCountry, ...crossBorderCountries]
        : [userCountry];

    return {
        primary_country: userCountry,
        primary_admin1: admin1Enforced ? userAdmin1 : null,
        visible_countries: visibleCountries,
        admin1_enforced: admin1Enforced,
    };
}

// ============================================================
// SUPPORTED COUNTRIES (25-country matrix)
// ============================================================

export const SUPPORTED_COUNTRIES = [
    { code: "US", name: "United States", currency: "USD", admin1_label: "State" },
    { code: "CA", name: "Canada", currency: "CAD", admin1_label: "Province" },
    { code: "AU", name: "Australia", currency: "AUD", admin1_label: "State" },
    { code: "GB", name: "United Kingdom", currency: "GBP", admin1_label: "Region" },
    { code: "NZ", name: "New Zealand", currency: "NZD", admin1_label: "Region" },
    { code: "IE", name: "Ireland", currency: "EUR", admin1_label: "County" },
    { code: "NL", name: "Netherlands", currency: "EUR", admin1_label: "Province" },
    { code: "DE", name: "Germany", currency: "EUR", admin1_label: "Bundesland" },
    { code: "FR", name: "France", currency: "EUR", admin1_label: "Région" },
    { code: "ES", name: "Spain", currency: "EUR", admin1_label: "Comunidad" },
    { code: "IT", name: "Italy", currency: "EUR", admin1_label: "Regione" },
    { code: "AE", name: "United Arab Emirates", currency: "AED", admin1_label: "Emirate" },
    { code: "ZA", name: "South Africa", currency: "ZAR", admin1_label: "Province" },
    { code: "SG", name: "Singapore", currency: "SGD", admin1_label: null },
    { code: "MX", name: "Mexico", currency: "MXN", admin1_label: "Estado" },
    { code: "BR", name: "Brazil", currency: "BRL", admin1_label: "Estado" },
    { code: "JP", name: "Japan", currency: "JPY", admin1_label: "Prefecture" },
    { code: "KR", name: "South Korea", currency: "KRW", admin1_label: "Province" },
    { code: "IN", name: "India", currency: "INR", admin1_label: "State" },
    { code: "SA", name: "Saudi Arabia", currency: "SAR", admin1_label: "Region" },
    { code: "OM", name: "Oman", currency: "OMR", admin1_label: "Governorate" },
    { code: "MY", name: "Malaysia", currency: "MYR", admin1_label: "State" },
    { code: "BE", name: "Belgium", currency: "EUR", admin1_label: "Region" },
    { code: "AT", name: "Austria", currency: "EUR", admin1_label: "Bundesland" },
    { code: "PT", name: "Portugal", currency: "EUR", admin1_label: "Distrito" },
] as const;

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];
