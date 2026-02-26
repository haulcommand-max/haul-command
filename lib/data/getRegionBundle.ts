/**
 * getRegionBundle — master server-side data loader for region hub pages
 *
 * Pulls all relevant data for a /directory/[country]/[region] page in
 * a single parallel Promise.all() call. Falls back to empty arrays
 * so pages never hard-fail on missing data.
 *
 * Tables queried (all normalized on country_code + region_code):
 *   - driver_profiles     → escort/operator listings
 *   - seo_region_stats    → aggregate coverage stats
 *   - seo_market_pulse    → city-level hub breakdown
 *   - corridor_stress_log → live corridor heat for region
 *
 * Usage:
 *   const bundle = await getRegionBundle("US", "FL");
 */

import { supabaseServer } from "@/lib/supabase/server";

export interface RegionOperator {
    user_id: string;
    company_name: string | null;
    home_base_city: string | null;
    home_base_state: string | null;
    home_base_country: string | null;
    country_code: string | null;
    region_code: string | null;
    trust_score: number | null;
    final_score: number | null;
    availability_status: string | null;
    verified: boolean | null;
    position_types: string[] | null;
    states_licensed: string[] | null;
    avg_response_seconds: number | null;
    joined_at: string | null;
    vehicle_type: string | null;
    has_high_pole: boolean | null;
    insurance_verified: boolean | null;
    twic_verified: boolean | null;
}

export interface RegionStats {
    total_providers: number;
    coverage_cities: number;
    region_trust_index: number;
    avg_fill_minutes: number | null;
    active_loads: number | null;
}

export interface RegionCity {
    city: string;
    total_providers: number;
    active_loads: number;
    verified_providers: number;
}

export interface RegionCorridorHeat {
    corridor_id: string;
    stress_index: number;
    open_load_count: number | null;
    available_escort_count: number | null;
}

export interface RegionPricing {
    service_type: string;
    service_type_category: string;
    unit: string;
    low: number | null;
    high: number | null;
    p25_rate: number | null;
    p75_rate: number | null;
    currency_code: string;
    confidence: string;
    region_group: string | null;
    surge_multiplier: number | null;
    tier_min_miles: number | null;
    tier_max_miles: number | null;
    notes: string | null;
}

export interface TruckStop {
    id: string;
    name: string;
    city: string | null;
    has_parking: boolean | null;
    has_showers: boolean | null;
    has_scales: boolean | null;
    has_wifi: boolean | null;
    fuel_lanes: number | null;
    region_code: string | null;
}

export interface PilotCarHotel {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    is_pilot_car_friendly: boolean | null;
    has_truck_parking: boolean | null;
    rate_notes: string | null;
}

export interface RegionBundle {
    operators: RegionOperator[];
    stats: RegionStats | null;
    cities: RegionCity[];
    corridors: RegionCorridorHeat[];
    pricing: RegionPricing[];
    truckStops: TruckStop[];
    hotels: PilotCarHotel[];
}

/** Empty bundle returned when any critical error occurs — prevents 500s */
const EMPTY_BUNDLE: RegionBundle = {
    operators: [],
    stats: null,
    cities: [],
    corridors: [],
    pricing: [],
    truckStops: [],
    hotels: [],
};

export async function getRegionBundle(
    country: string,  // "US" | "CA" — already uppercased
    region: string,   // "FL", "TX", "ON" — already uppercased
): Promise<RegionBundle> {
    try {
        const supabase = supabaseServer();

        // Look up region_group — use maybeSingle() to avoid PGRST116 throw on no row
        const { data: groupRow } = await supabase
            .from("region_group_map")
            .select("region_group")
            .eq("country_code", country)
            .eq("region_code", region)
            .maybeSingle();
        const regionGroup = groupRow?.region_group ?? "National";

        const [
            operatorsRes,
            statsRes,
            citiesRes,
            corridorsRes,
            pricingRes,
            truckStopsRes,
            hotelsRes,
        ] = await Promise.all([

            // Escort/operator listings from escort_profiles (canonical operator table)
            supabase
                .from("escort_profiles")
                .select(`
            user_id, company_name, home_base_city, home_base_state, home_base_country,
            country_code, region_code, trust_score, final_score, availability_status,
            verified, position_types, states_licensed, avg_response_seconds, joined_at,
            vehicle_type, has_high_pole, insurance_verified, twic_verified
          `)
                .eq("country_code", country)
                .eq("region_code", region)
                .eq("is_published", true)
                .order("trust_score", { ascending: false })
                .limit(100),

            // Aggregate stats — maybeSingle() returns null (not throw) on no row
            supabase
                .from("seo_region_stats")
                .select("*")
                .eq("country", country)
                .eq("region_code", region)
                .maybeSingle(),

            // City-level breakdown
            supabase
                .from("seo_market_pulse")
                .select("city, total_providers, active_loads, verified_providers")
                .eq("country", country)
                .eq("region_code", region)
                .order("total_providers", { ascending: false })
                .limit(30),

            // Corridor heat — table may not exist; error is safely caught below
            supabase
                .from("corridor_stress_log")
                .select("corridor_id, stress_index, open_load_count, available_escort_count")
                .or(`origin_state.eq.${region},dest_state.eq.${region}`)
                .order("stress_index", { ascending: false })
                .limit(10),

            // Rate benchmarks
            supabase
                .from("rate_benchmarks")
                .select(`
                    service_type, service_type_category, unit, low, high, p25_rate, p75_rate,
                    currency_code, confidence, region_group,
                    surge_multiplier, tier_min_miles, tier_max_miles, notes
                `)
                .eq("country_code", country)
                .eq("effective_year", 2026)
                .in("region_group", [regionGroup, "National"])
                .is("effective_end_date", null)
                .order("service_type_category")
                .order("service_type")
                .limit(100),

            // Truck stops
            supabase
                .from("truck_stops")
                .select("id, name, city, has_parking, has_showers, has_scales, has_wifi, fuel_lanes, region_code")
                .eq("region_code", region)
                .order("name")
                .limit(50),

            // Pilot-car-friendly hotels
            supabase
                .from("hotels")
                .select("id, name, city, state, is_pilot_car_friendly, has_truck_parking, rate_notes")
                .eq("state", region)
                .order("name")
                .limit(30),
        ]);

        return {
            operators: (operatorsRes.data ?? []) as unknown as RegionOperator[],
            stats: (statsRes.data ?? null) as RegionStats | null,
            cities: (citiesRes.data ?? []) as RegionCity[],
            corridors: (corridorsRes.data ?? []) as RegionCorridorHeat[],
            pricing: (pricingRes.data ?? []) as RegionPricing[],
            truckStops: (truckStopsRes.data ?? []) as TruckStop[],
            hotels: (hotelsRes.data ?? []) as PilotCarHotel[],
        };
    } catch (err) {
        // Never let a DB error propagate to a 500 — return empty bundle
        // Region page renders gracefully with empty data (Coverage growing UX)
        console.error(`[getRegionBundle] ${country}/${region} failed:`, err);
        return EMPTY_BUNDLE;
    }
}
