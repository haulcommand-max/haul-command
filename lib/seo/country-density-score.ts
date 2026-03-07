// lib/seo/country-density-score.ts
//
// Country Density Score (CDS) Engine
// Determines when a country is credible, promotable, and monetizable.
// Controls indexability, AdGrid, and paid acquisition gates.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type DensityBand = "stealth" | "emerging" | "credible" | "dominant";

export interface CDSResult {
    country_code: string;
    density_score: number;
    density_band: DensityBand;
    indexable: boolean;
    adgrid_enabled: boolean;
    paid_acquisition_allowed: boolean;
    signals: CDSSignals;
    actions: string[];
}

export interface CDSSignals {
    operator_supply_norm: number;
    place_coverage_norm: number;
    geographic_spread_norm: number;
    freshness_activity_norm: number;
    claim_velocity_norm: number;
    authority_signals_norm: number;
}

// ============================================================
// SIGNAL WEIGHTS
// ============================================================

const WEIGHTS = {
    operator_supply: 0.30,
    place_coverage: 0.20,
    geographic_spread: 0.15,
    freshness_activity: 0.15,
    claim_velocity: 0.10,
    authority_signals: 0.10,
} as const;

// ============================================================
// DEFAULT THRESHOLDS (per country target)
// ============================================================

const DEFAULT_THRESHOLDS = {
    operator_target: 25,
    place_target: 250,
    city_target: 10,
    freshness_target: 50,    // updates in 30d
    claim_target: 10,        // claims in 30d
    authority_target: 5,     // chamber + edu + gov links
};

// ============================================================
// BAND ACTIONS
// ============================================================

const BAND_ACTIONS: Record<DensityBand, string[]> = {
    stealth: [
        "noindex_country_pages",
        "suppress_paid_ads",
        "continue_seeding",
    ],
    emerging: [
        "index_country_pages",
        "enable_light_internal_links",
        "begin_claim_campaigns",
    ],
    credible: [
        "promote_in_search",
        "enable_adgrid_sales",
        "surface_in_broker_tools",
    ],
    dominant: [
        "full_marketplace_push",
        "aggressive_backlinking",
        "paid_acquisition_allowed",
    ],
};

// ============================================================
// COMPUTE CDS FOR A COUNTRY
// ============================================================

export async function computeCountryDensityScore(
    countryCode: string
): Promise<CDSResult> {
    const supabase = getSupabaseAdmin();

    // Fetch seed targets (or use defaults)
    const { data: targets } = await supabase
        .from("country_seed_targets")
        .select("*")
        .eq("country_code", countryCode)
        .maybeSingle();

    const t = (targets as any) ?? DEFAULT_THRESHOLDS;
    const operatorTarget = t.target_operators ?? DEFAULT_THRESHOLDS.operator_target;
    const placeTarget = t.target_places ?? DEFAULT_THRESHOLDS.place_target;
    const cityTarget = t.target_cities ?? DEFAULT_THRESHOLDS.city_target;

    // Count real data
    const [operators, places, cities, freshness, claims, authority] = await Promise.all([
        countOperators(supabase, countryCode),
        countPlaces(supabase, countryCode),
        countUniqueCities(supabase, countryCode),
        countFreshnessUpdates(supabase, countryCode),
        countClaims(supabase, countryCode),
        countAuthoritySignals(supabase, countryCode),
    ]);

    // Normalize (0-1)
    const signals: CDSSignals = {
        operator_supply_norm: clamp(operators / operatorTarget),
        place_coverage_norm: clamp(places / placeTarget),
        geographic_spread_norm: clamp(cities / cityTarget),
        freshness_activity_norm: clamp(freshness / DEFAULT_THRESHOLDS.freshness_target),
        claim_velocity_norm: clamp(claims / DEFAULT_THRESHOLDS.claim_target),
        authority_signals_norm: clamp(authority / DEFAULT_THRESHOLDS.authority_target),
    };

    // Weighted sum
    const rawScore =
        signals.operator_supply_norm * WEIGHTS.operator_supply +
        signals.place_coverage_norm * WEIGHTS.place_coverage +
        signals.geographic_spread_norm * WEIGHTS.geographic_spread +
        signals.freshness_activity_norm * WEIGHTS.freshness_activity +
        signals.claim_velocity_norm * WEIGHTS.claim_velocity +
        signals.authority_signals_norm * WEIGHTS.authority_signals;

    const densityScore = Math.round(rawScore * 100);

    // Band classification
    let band: DensityBand;
    if (densityScore >= 85) band = "dominant";
    else if (densityScore >= 65) band = "credible";
    else if (densityScore >= 40) band = "emerging";
    else band = "stealth";

    const result: CDSResult = {
        country_code: countryCode,
        density_score: densityScore,
        density_band: band,
        indexable: band !== "stealth",
        adgrid_enabled: band === "credible" || band === "dominant",
        paid_acquisition_allowed: band === "dominant",
        signals,
        actions: BAND_ACTIONS[band],
    };

    // Persist
    await supabase.from("country_density_scores").upsert(
        {
            country_code: countryCode,
            density_score: densityScore,
            density_band: band,
            operator_supply_norm: signals.operator_supply_norm,
            place_coverage_norm: signals.place_coverage_norm,
            geographic_spread_norm: signals.geographic_spread_norm,
            freshness_activity_norm: signals.freshness_activity_norm,
            claim_velocity_norm: signals.claim_velocity_norm,
            authority_signals_norm: signals.authority_signals_norm,
            verified_operators: operators,
            total_places: places,
            unique_cities: cities,
            updates_30d: freshness,
            claims_30d: claims,
            chamber_links: authority,
            indexable: result.indexable,
            adgrid_enabled: result.adgrid_enabled,
            paid_acquisition_allowed: result.paid_acquisition_allowed,
            computed_at: new Date().toISOString(),
        },
        { onConflict: "country_code" }
    );

    return result;
}

// ============================================================
// COMPUTE ALL COUNTRIES
// ============================================================

export async function computeAllCountryCDS(): Promise<CDSResult[]> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
        .from("country_seed_targets")
        .select("country_code");

    const countries = ((data ?? []) as any[]).map((c) => c.country_code);
    const results: CDSResult[] = [];

    for (const cc of countries) {
        const result = await computeCountryDensityScore(cc);
        results.push(result);
    }

    return results;
}

// ============================================================
// ANTI-THIN CONTENT GUARD
// ============================================================

export interface ThinContentCheck {
    page_path: string;
    is_indexable: boolean;
    thin_content_flag: boolean;
    reason?: string;
}

export async function evaluatePageIndexability(
    pagePath: string,
    countryCode: string,
    regionCode?: string
): Promise<ThinContentCheck> {
    const supabase = getSupabaseAdmin();

    // Get CDS
    const { data: cds } = await supabase
        .from("country_density_scores")
        .select("density_band,indexable,verified_operators,unique_cities")
        .eq("country_code", countryCode)
        .maybeSingle();

    const score = cds as any;

    // Anti-thin guards
    let indexable = score?.indexable ?? false;
    let thinFlag = false;
    let reason: string | undefined;

    if (!score || score.verified_operators < 10) {
        indexable = false;
        thinFlag = true;
        reason = `Operators ${score?.verified_operators ?? 0} < 10 minimum`;
    } else if (score.unique_cities < 5) {
        indexable = false;
        thinFlag = true;
        reason = `Cities ${score.unique_cities} < 5 minimum`;
    }

    // Persist control
    await supabase.from("page_index_controls").upsert(
        {
            page_path: pagePath,
            page_type: regionCode ? "region_page" : "country_hub",
            country_code: countryCode,
            region_code: regionCode ?? null,
            is_indexable: indexable,
            thin_content_flag: thinFlag,
            operator_count: score?.verified_operators ?? 0,
            freshness_score: score?.freshness_activity_norm ?? 0,
            last_evaluated_at: new Date().toISOString(),
        },
        { onConflict: "page_path" }
    );

    return { page_path: pagePath, is_indexable: indexable, thin_content_flag: thinFlag, reason };
}

// ============================================================
// HELPERS
// ============================================================

function clamp(v: number): number {
    return Math.min(1, Math.max(0, v));
}

async function countOperators(supabase: any, cc: string): Promise<number> {
    const { count } = await supabase
        .from("operator_listings")
        .select("id", { count: "exact", head: true })
        .eq("country_code", cc)
        .eq("verified", true);
    return count ?? 0;
}

async function countPlaces(supabase: any, cc: string): Promise<number> {
    const { count } = await supabase
        .from("places")
        .select("id", { count: "exact", head: true })
        .eq("country_code", cc);
    return count ?? 0;
}

async function countUniqueCities(supabase: any, cc: string): Promise<number> {
    // Approximate via distinct query
    const { data } = await supabase
        .from("operator_listings")
        .select("city")
        .eq("country_code", cc)
        .limit(1000);
    const unique = new Set(((data ?? []) as any[]).map((d: any) => d.city?.toLowerCase()));
    return unique.size;
}

async function countFreshnessUpdates(supabase: any, cc: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await supabase
        .from("operator_listings")
        .select("id", { count: "exact", head: true })
        .eq("country_code", cc)
        .gte("updated_at", thirtyDaysAgo);
    return count ?? 0;
}

async function countClaims(supabase: any, cc: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await supabase
        .from("claim_flow_matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "claimed")
        .gte("resolved_at", thirtyDaysAgo);
    return count ?? 0;
}

async function countAuthoritySignals(supabase: any, cc: string): Promise<number> {
    const { count } = await supabase
        .from("backlink_registry")
        .select("id", { count: "exact", head: true })
        .eq("country_code", cc)
        .eq("status", "active")
        .in("link_type", ["chamber", "edu", "gov"]);
    return count ?? 0;
}
