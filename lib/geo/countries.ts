// lib/geo/countries.ts
//
// ████████████████████████████████████████████████████████████████████
// THE SINGLE SOURCE OF TRUTH FOR ALL 52 HAUL COMMAND COUNTRIES.
// ████████████████████████████████████████████████████████████████████
//
// RULES:
//   1. Every module that needs country data MUST import from here.
//   2. Do NOT duplicate country lists anywhere else in the codebase.
//   3. When adding a new country, add it HERE and it flows everywhere:
//      - Pricing (PPP tiers)
//      - Geo isolation (visibility & cross-border)
//      - Map (sidebar rail, heatmaps, clustering)
//      - SEO (directory pages, meta tags, breadcrumbs)
//      - Compliance (localization, legal zones)
//      - Strategy (priority scoring, install targets)
//      - Localization (currencies, admin1 labels, date formats)
//
// FILE IMPORTS THIS: None (root dependency — zero imports from Haul Command)
// FILES THAT IMPORT THIS: everything.

// ============================================================
// CORE TYPES
// ============================================================

export type CountryTier = "A" | "B" | "C" | "D";

export interface HCCountry {
    /** ISO 3166-1 alpha-2 */
    iso2: string;
    /** Full English name */
    name: string;
    /** HC priority tier */
    tier: CountryTier;
    /** ISO 4217 currency code */
    currency: string;
    /** What admin1 divisions are called (State, Province, Region, etc.) */
    admin1_label: string | null;
    /** Whether admin1-level geo isolation is enforced */
    admin1_enforced: boolean;
    /** HC continent/region bucket for UI grouping */
    region: HCRegion;
    /** PPP multiplier for pricing (1.00 = full price) */
    ppp_multiplier: number;
    /** Composite priority score (0–10) */
    priority_score: number;
    /** Year 1 install target (0 = proportional allocation) */
    year1_target: number;
    /** Pre-approved cross-border corridor ISO2 codes */
    cross_border_corridors: string[];
    /** Country calling code (for phone validation) */
    calling_code: string;
    /** Primary locale for this country */
    primary_locale: string;
    /** Driving side (for route planning) */
    drive_side: "right" | "left";
    /** Distance unit preference */
    distance_unit: "mi" | "km";
    /** Weight unit preference */
    weight_unit: "lbs" | "kg" | "tonnes";
}

export type HCRegion =
    | "north_america"
    | "europe_west"
    | "europe_north"
    | "europe_east"
    | "europe_south"
    | "middle_east"
    | "asia_pacific"
    | "latin_america"
    | "africa"
    | "oceania";

// ============================================================
// THE 52 COUNTRIES
// ============================================================

export const HC_COUNTRIES: readonly HCCountry[] = [
    // ── TIER A (Top 10 — explicit install targets) ──────────────────

    {
        iso2: "US", name: "United States", tier: "A",
        currency: "USD", admin1_label: "State", admin1_enforced: true,
        region: "north_america", ppp_multiplier: 1.00, priority_score: 9.73,
        year1_target: 420000, cross_border_corridors: ["CA", "MX"],
        calling_code: "+1", primary_locale: "en-US",
        drive_side: "right", distance_unit: "mi", weight_unit: "lbs",
    },
    {
        iso2: "CA", name: "Canada", tier: "A",
        currency: "CAD", admin1_label: "Province", admin1_enforced: true,
        region: "north_america", ppp_multiplier: 1.00, priority_score: 8.85,
        year1_target: 120000, cross_border_corridors: ["US"],
        calling_code: "+1", primary_locale: "en-CA",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "AU", name: "Australia", tier: "A",
        currency: "AUD", admin1_label: "State", admin1_enforced: true,
        region: "oceania", ppp_multiplier: 1.00, priority_score: 8.65,
        year1_target: 90000, cross_border_corridors: ["NZ"],
        calling_code: "+61", primary_locale: "en-AU",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "GB", name: "United Kingdom", tier: "A",
        currency: "GBP", admin1_label: "Region", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 8.25,
        year1_target: 80000, cross_border_corridors: ["IE"],
        calling_code: "+44", primary_locale: "en-GB",
        drive_side: "left", distance_unit: "mi", weight_unit: "kg",
    },
    {
        iso2: "NZ", name: "New Zealand", tier: "A",
        currency: "NZD", admin1_label: "Region", admin1_enforced: false,
        region: "oceania", ppp_multiplier: 1.00, priority_score: 7.65,
        year1_target: 45000, cross_border_corridors: ["AU"],
        calling_code: "+64", primary_locale: "en-NZ",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "ZA", name: "South Africa", tier: "A",
        currency: "ZAR", admin1_label: "Province", admin1_enforced: false,
        region: "africa", ppp_multiplier: 0.42, priority_score: 7.15,
        year1_target: 60000, cross_border_corridors: [],
        calling_code: "+27", primary_locale: "en-ZA",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "DE", name: "Germany", tier: "A",
        currency: "EUR", admin1_label: "Bundesland", admin1_enforced: true,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 7.35,
        year1_target: 50000, cross_border_corridors: ["NL", "AT", "FR", "PL", "CZ"],
        calling_code: "+49", primary_locale: "de-DE",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "NL", name: "Netherlands", tier: "A",
        currency: "EUR", admin1_label: "Province", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 6.85,
        year1_target: 35000, cross_border_corridors: ["DE", "BE"],
        calling_code: "+31", primary_locale: "nl-NL",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "AE", name: "United Arab Emirates", tier: "A",
        currency: "AED", admin1_label: "Emirate", admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 1.00, priority_score: 6.65,
        year1_target: 40000, cross_border_corridors: ["SA", "OM"],
        calling_code: "+971", primary_locale: "en-AE",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "BR", name: "Brazil", tier: "A",
        currency: "BRL", admin1_label: "Estado", admin1_enforced: true,
        region: "latin_america", ppp_multiplier: 0.58, priority_score: 6.55,
        year1_target: 60000, cross_border_corridors: [],
        calling_code: "+55", primary_locale: "pt-BR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },

    // ── TIER B (15 countries) ───────────────────────────────────────

    {
        iso2: "IE", name: "Ireland", tier: "B",
        currency: "EUR", admin1_label: "County", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 6.30,
        year1_target: 0, cross_border_corridors: ["GB"],
        calling_code: "+353", primary_locale: "en-IE",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "SE", name: "Sweden", tier: "B",
        currency: "SEK", admin1_label: "Län", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 1.00, priority_score: 6.10,
        year1_target: 0, cross_border_corridors: ["NO", "DK", "FI"],
        calling_code: "+46", primary_locale: "sv-SE",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "NO", name: "Norway", tier: "B",
        currency: "NOK", admin1_label: "Fylke", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 1.00, priority_score: 6.05,
        year1_target: 0, cross_border_corridors: ["SE"],
        calling_code: "+47", primary_locale: "nb-NO",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "DK", name: "Denmark", tier: "B",
        currency: "DKK", admin1_label: "Region", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 1.00, priority_score: 5.75,
        year1_target: 0, cross_border_corridors: ["SE", "DE"],
        calling_code: "+45", primary_locale: "da-DK",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "FI", name: "Finland", tier: "B",
        currency: "EUR", admin1_label: "Maakunta", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 1.00, priority_score: 5.65,
        year1_target: 0, cross_border_corridors: ["SE", "EE"],
        calling_code: "+358", primary_locale: "fi-FI",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "BE", name: "Belgium", tier: "B",
        currency: "EUR", admin1_label: "Region", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 5.85,
        year1_target: 0, cross_border_corridors: ["NL", "FR", "DE"],
        calling_code: "+32", primary_locale: "nl-BE",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "AT", name: "Austria", tier: "B",
        currency: "EUR", admin1_label: "Bundesland", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 5.60,
        year1_target: 0, cross_border_corridors: ["DE", "IT", "CH"],
        calling_code: "+43", primary_locale: "de-AT",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "CH", name: "Switzerland", tier: "B",
        currency: "CHF", admin1_label: "Kanton", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 1.00, priority_score: 5.95,
        year1_target: 0, cross_border_corridors: ["DE", "FR", "IT", "AT"],
        calling_code: "+41", primary_locale: "de-CH",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "ES", name: "Spain", tier: "B",
        currency: "EUR", admin1_label: "Comunidad", admin1_enforced: false,
        region: "europe_south", ppp_multiplier: 0.82, priority_score: 6.05,
        year1_target: 0, cross_border_corridors: ["FR", "PT"],
        calling_code: "+34", primary_locale: "es-ES",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "FR", name: "France", tier: "B",
        currency: "EUR", admin1_label: "Région", admin1_enforced: false,
        region: "europe_west", ppp_multiplier: 0.82, priority_score: 6.40,
        year1_target: 0, cross_border_corridors: ["DE", "ES", "IT", "BE", "CH"],
        calling_code: "+33", primary_locale: "fr-FR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "IT", name: "Italy", tier: "B",
        currency: "EUR", admin1_label: "Regione", admin1_enforced: false,
        region: "europe_south", ppp_multiplier: 0.82, priority_score: 6.00,
        year1_target: 0, cross_border_corridors: ["FR", "AT", "CH"],
        calling_code: "+39", primary_locale: "it-IT",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "PT", name: "Portugal", tier: "B",
        currency: "EUR", admin1_label: "Distrito", admin1_enforced: false,
        region: "europe_south", ppp_multiplier: 0.82, priority_score: 5.15,
        year1_target: 0, cross_border_corridors: ["ES"],
        calling_code: "+351", primary_locale: "pt-PT",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "SA", name: "Saudi Arabia", tier: "B",
        currency: "SAR", admin1_label: "Region", admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 0.82, priority_score: 6.35,
        year1_target: 0, cross_border_corridors: ["AE", "BH", "KW", "OM"],
        calling_code: "+966", primary_locale: "ar-SA",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "QA", name: "Qatar", tier: "B",
        currency: "QAR", admin1_label: null, admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 1.00, priority_score: 5.15,
        year1_target: 0, cross_border_corridors: ["SA"],
        calling_code: "+974", primary_locale: "ar-QA",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "MX", name: "Mexico", tier: "B",
        currency: "MXN", admin1_label: "Estado", admin1_enforced: true,
        region: "north_america", ppp_multiplier: 0.58, priority_score: 6.20,
        year1_target: 0, cross_border_corridors: ["US"],
        calling_code: "+52", primary_locale: "es-MX",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },

    // ── TIER C (24 countries) ───────────────────────────────────────

    {
        iso2: "PL", name: "Poland", tier: "C",
        currency: "PLN", admin1_label: "Województwo", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.58, priority_score: 5.30,
        year1_target: 0, cross_border_corridors: ["DE", "CZ", "SK", "LT"],
        calling_code: "+48", primary_locale: "pl-PL",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "CZ", name: "Czech Republic", tier: "C",
        currency: "CZK", admin1_label: "Kraj", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.82, priority_score: 4.60,
        year1_target: 0, cross_border_corridors: ["DE", "PL", "SK", "AT"],
        calling_code: "+420", primary_locale: "cs-CZ",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "SK", name: "Slovakia", tier: "C",
        currency: "EUR", admin1_label: "Kraj", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.82, priority_score: 4.10,
        year1_target: 0, cross_border_corridors: ["CZ", "PL", "HU", "AT"],
        calling_code: "+421", primary_locale: "sk-SK",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "HU", name: "Hungary", tier: "C",
        currency: "HUF", admin1_label: "Megye", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.58, priority_score: 4.45,
        year1_target: 0, cross_border_corridors: ["SK", "AT", "RO", "HR"],
        calling_code: "+36", primary_locale: "hu-HU",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "SI", name: "Slovenia", tier: "C",
        currency: "EUR", admin1_label: "Občina", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.82, priority_score: 3.65,
        year1_target: 0, cross_border_corridors: ["AT", "IT", "HR"],
        calling_code: "+386", primary_locale: "sl-SI",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "EE", name: "Estonia", tier: "C",
        currency: "EUR", admin1_label: "Maakond", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 0.82, priority_score: 3.40,
        year1_target: 0, cross_border_corridors: ["FI", "LV"],
        calling_code: "+372", primary_locale: "et-EE",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "LV", name: "Latvia", tier: "C",
        currency: "EUR", admin1_label: "Novads", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 0.58, priority_score: 3.25,
        year1_target: 0, cross_border_corridors: ["EE", "LT"],
        calling_code: "+371", primary_locale: "lv-LV",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "LT", name: "Lithuania", tier: "C",
        currency: "EUR", admin1_label: "Apskritis", admin1_enforced: false,
        region: "europe_north", ppp_multiplier: 0.58, priority_score: 3.55,
        year1_target: 0, cross_border_corridors: ["LV", "PL"],
        calling_code: "+370", primary_locale: "lt-LT",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "HR", name: "Croatia", tier: "C",
        currency: "EUR", admin1_label: "Županija", admin1_enforced: false,
        region: "europe_south", ppp_multiplier: 0.82, priority_score: 3.55,
        year1_target: 0, cross_border_corridors: ["SI", "HU"],
        calling_code: "+385", primary_locale: "hr-HR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "RO", name: "Romania", tier: "C",
        currency: "RON", admin1_label: "Județ", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.58, priority_score: 3.95,
        year1_target: 0, cross_border_corridors: ["HU", "BG"],
        calling_code: "+40", primary_locale: "ro-RO",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "BG", name: "Bulgaria", tier: "C",
        currency: "BGN", admin1_label: "Oblast", admin1_enforced: false,
        region: "europe_east", ppp_multiplier: 0.58, priority_score: 3.55,
        year1_target: 0, cross_border_corridors: ["RO", "GR", "TR"],
        calling_code: "+359", primary_locale: "bg-BG",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "GR", name: "Greece", tier: "C",
        currency: "EUR", admin1_label: "Periféria", admin1_enforced: false,
        region: "europe_south", ppp_multiplier: 0.58, priority_score: 4.45,
        year1_target: 0, cross_border_corridors: ["BG", "TR"],
        calling_code: "+30", primary_locale: "el-GR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "TR", name: "Turkey", tier: "C",
        currency: "TRY", admin1_label: "İl", admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 0.58, priority_score: 5.45,
        year1_target: 0, cross_border_corridors: ["BG", "GR"],
        calling_code: "+90", primary_locale: "tr-TR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "KW", name: "Kuwait", tier: "C",
        currency: "KWD", admin1_label: null, admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 1.00, priority_score: 4.50,
        year1_target: 0, cross_border_corridors: ["SA"],
        calling_code: "+965", primary_locale: "ar-KW",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "OM", name: "Oman", tier: "C",
        currency: "OMR", admin1_label: "Governorate", admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 0.82, priority_score: 4.05,
        year1_target: 0, cross_border_corridors: ["AE", "SA"],
        calling_code: "+968", primary_locale: "ar-OM",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "BH", name: "Bahrain", tier: "C",
        currency: "BHD", admin1_label: null, admin1_enforced: false,
        region: "middle_east", ppp_multiplier: 0.82, priority_score: 3.60,
        year1_target: 0, cross_border_corridors: ["SA"],
        calling_code: "+973", primary_locale: "ar-BH",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "SG", name: "Singapore", tier: "C",
        currency: "SGD", admin1_label: null, admin1_enforced: false,
        region: "asia_pacific", ppp_multiplier: 1.00, priority_score: 5.15,
        year1_target: 0, cross_border_corridors: ["MY"],
        calling_code: "+65", primary_locale: "en-SG",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "MY", name: "Malaysia", tier: "C",
        currency: "MYR", admin1_label: "State", admin1_enforced: false,
        region: "asia_pacific", ppp_multiplier: 0.82, priority_score: 5.05,
        year1_target: 0, cross_border_corridors: ["SG"],
        calling_code: "+60", primary_locale: "ms-MY",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "JP", name: "Japan", tier: "C",
        currency: "JPY", admin1_label: "Prefecture", admin1_enforced: false,
        region: "asia_pacific", ppp_multiplier: 1.00, priority_score: 5.40,
        year1_target: 0, cross_border_corridors: [],
        calling_code: "+81", primary_locale: "ja-JP",
        drive_side: "left", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "KR", name: "South Korea", tier: "C",
        currency: "KRW", admin1_label: "Province", admin1_enforced: false,
        region: "asia_pacific", ppp_multiplier: 1.00, priority_score: 5.00,
        year1_target: 0, cross_border_corridors: [],
        calling_code: "+82", primary_locale: "ko-KR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "CL", name: "Chile", tier: "C",
        currency: "CLP", admin1_label: "Región", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.82, priority_score: 5.20,
        year1_target: 0, cross_border_corridors: ["AR", "PE"],
        calling_code: "+56", primary_locale: "es-CL",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "AR", name: "Argentina", tier: "C",
        currency: "ARS", admin1_label: "Provincia", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.42, priority_score: 5.00,
        year1_target: 0, cross_border_corridors: ["CL", "UY", "BR"],
        calling_code: "+54", primary_locale: "es-AR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "CO", name: "Colombia", tier: "C",
        currency: "COP", admin1_label: "Departamento", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.42, priority_score: 5.00,
        year1_target: 0, cross_border_corridors: ["PA", "PE"],
        calling_code: "+57", primary_locale: "es-CO",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "PE", name: "Peru", tier: "C",
        currency: "PEN", admin1_label: "Región", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.42, priority_score: 4.70,
        year1_target: 0, cross_border_corridors: ["CL", "CO"],
        calling_code: "+51", primary_locale: "es-PE",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },

    // ── TIER D (3 countries) ────────────────────────────────────────

    {
        iso2: "UY", name: "Uruguay", tier: "D",
        currency: "UYU", admin1_label: "Departamento", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.82, priority_score: 3.35,
        year1_target: 0, cross_border_corridors: ["AR", "BR"],
        calling_code: "+598", primary_locale: "es-UY",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "PA", name: "Panama", tier: "D",
        currency: "USD", admin1_label: "Provincia", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.82, priority_score: 4.15,
        year1_target: 0, cross_border_corridors: ["CO", "CR"],
        calling_code: "+507", primary_locale: "es-PA",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
    {
        iso2: "CR", name: "Costa Rica", tier: "D",
        currency: "CRC", admin1_label: "Provincia", admin1_enforced: false,
        region: "latin_america", ppp_multiplier: 0.82, priority_score: 3.35,
        year1_target: 0, cross_border_corridors: ["PA"],
        calling_code: "+506", primary_locale: "es-CR",
        drive_side: "right", distance_unit: "km", weight_unit: "kg",
    },
] as const;

// ============================================================
// DERIVED LOOKUPS (zero-cost at import — computed once)
// ============================================================

/** Fast O(1) lookup by ISO2 code */
export const COUNTRY_BY_ISO2: ReadonlyMap<string, HCCountry> = new Map(
    HC_COUNTRIES.map((c) => [c.iso2, c])
);

/** All ISO2 codes */
export const ALL_ISO2_CODES: readonly string[] = HC_COUNTRIES.map((c) => c.iso2);

/** Count */
export const COUNTRY_COUNT = HC_COUNTRIES.length; // 52

/** By tier */
export function getCountriesByTier(tier: CountryTier): HCCountry[] {
    return HC_COUNTRIES.filter((c) => c.tier === tier);
}

/** By region */
export function getCountriesByRegion(region: HCRegion): HCCountry[] {
    return HC_COUNTRIES.filter((c) => c.region === region);
}

/** PPP multiplier for a country */
export function getPPPMultiplier(iso2: string): number {
    return COUNTRY_BY_ISO2.get(iso2)?.ppp_multiplier ?? 0.58;
}

/** Cross-border corridors for a country */
export function getCrossCorridors(iso2: string): string[] {
    return COUNTRY_BY_ISO2.get(iso2)?.cross_border_corridors ?? [];
}

/** Admin1 enforced? */
export function isAdmin1Enforced(iso2: string): boolean {
    return COUNTRY_BY_ISO2.get(iso2)?.admin1_enforced ?? false;
}

/** Get currency code */
export function getCurrency(iso2: string): string {
    return COUNTRY_BY_ISO2.get(iso2)?.currency ?? "USD";
}

/** Get primary locale */
export function getLocale(iso2: string): string {
    return COUNTRY_BY_ISO2.get(iso2)?.primary_locale ?? "en-US";
}

/** Flag emoji from ISO2 */
export function countryFlag(iso2: string): string {
    const codePoints = [...iso2.toUpperCase()].map(
        (c) => 0x1f1e6 + c.charCodeAt(0) - 65
    );
    try {
        return String.fromCodePoint(...codePoints);
    } catch {
        return "🌍";
    }
}

/** Is this a valid HC country? */
export function isHCCountry(iso2: string): boolean {
    return COUNTRY_BY_ISO2.has(iso2);
}

/** Get display name */
export function getCountryName(iso2: string): string {
    return COUNTRY_BY_ISO2.get(iso2)?.name ?? iso2;
}

/** Get distance unit for a country */
export function getDistanceUnit(iso2: string): "mi" | "km" {
    return COUNTRY_BY_ISO2.get(iso2)?.distance_unit ?? "km";
}

/** Tier A countries (highest priority) */
export function getTierACountries(): HCCountry[] {
    return getCountriesByTier("A");
}

/** Top N countries by priority score */
export function getTopCountries(n: number = 10): HCCountry[] {
    return [...HC_COUNTRIES]
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, n);
}
