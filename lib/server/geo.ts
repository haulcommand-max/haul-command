import { supabaseServer } from "@/lib/supabase/server";

// ── Country queries (reads from global_countries) ────────────────────────────

export interface Country {
    id: string;
    name: string;
    slug: string;      // lowercase iso2
    iso2: string;
    iso3: string | null;
    tier: string;
}

/**
 * Look up a country by its URL slug (lowercase iso2 code).
 * Uses global_countries table (the canonical country registry).
 * Returns null if not found or not active.
 */
export async function getCountryBySlug(slug: string): Promise<Country | null> {
    const supabase = supabaseServer();

    const { data, error } = await supabase
        .from("global_countries")
        .select("id,name,iso2,iso3,activation_phase")
        .eq("iso2", slug.toUpperCase())
        .maybeSingle();

    if (error) {
        console.error("[geo] getCountryBySlug error:", error.message);
        return null;
    }
    if (!data) return null;

    return {
        id: data.id,
        name: data.name,
        slug: slug.toLowerCase(),
        iso2: data.iso2,
        iso3: data.iso3,
        tier: data.activation_phase ?? "monitor",
    };
}

// ── Region queries (reads from state_regulations + geo_regions) ──────────────

export interface Region {
    code: string;
    slug: string;
    name: string;
    region_type: string | null;
}

/**
 * Get all regions (states/provinces) for a given country iso2.
 * Falls back to empty array. NEVER returns mock data.
 *
 * Reads from state_regulations (canonical state list) as primary.
 */
export async function getRegionsByCountry(countryIso2: string): Promise<Region[]> {
    const supabase = supabaseServer();

    // state_regulations has state_code, state_name, country (where country = 'US'/'CA')
    const { data, error } = await supabase
        .from("state_regulations")
        .select("state_code,state_name")
        .eq("country", countryIso2.toUpperCase())
        .order("state_name", { ascending: true });

    if (error) {
        console.error("[geo] getRegionsByCountry error:", error.message);
        return [];
    }

    return (data ?? []).map((r: any) => ({
        code: r.state_code,
        slug: r.state_code.toLowerCase(),
        name: r.state_name,
        region_type: null,
    }));
}

/**
 * Find a region by its code (e.g., "FL") within a country.
 */
export async function getRegionByCode(
    countryIso2: string,
    regionCode: string
): Promise<Region | null> {
    const supabase = supabaseServer();

    const { data, error } = await supabase
        .from("state_regulations")
        .select("state_code,state_name")
        .eq("country", countryIso2.toUpperCase())
        .eq("admin1_code", regionCode.toUpperCase())
        .maybeSingle();

    if (error || !data) return null;

    return {
        code: data.admin1_code,
        slug: data.admin1_code.toLowerCase(),
        name: data.state_name,
        region_type: null,
    };
}

// ── City queries (derived from directory_listings) ───────────────────────────

/**
 * Get distinct cities that have directory listings in a given country+region.
 * This is the authoritative source — no mock cities.
 */
export async function getCitiesByCountryRegion(
    countryIso2: string,
    regionCode: string,
    limit = 500
): Promise<string[]> {
    const supabase = supabaseServer();

    // directory_listings may use either upper or lower case codes
    const { data, error } = await supabase
        .from("hc_global_operators")
        .select("city")
        .ilike("country_code", countryIso2)
        .ilike("admin1_code", regionCode)
        .not("city", "is", null)
        .limit(limit);

    if (error) {
        console.error("[geo] getCitiesByCountryRegion error:", error.message);
        return [];
    }

    const cities = Array.from(
        new Set((data ?? []).map((r: { city: string }) => (r.city || "").trim()).filter(Boolean))
    );
    cities.sort((a, b) => a.localeCompare(b));
    return cities;
}

/**
 * Get all active countries, optionally filtered by activation phase.
 */
export async function getAllCountries(activationPhase?: string): Promise<Country[]> {
    const supabase = supabaseServer();

    let query = supabase
        .from("global_countries")
        .select("id,name,iso2,iso3,activation_phase")
        .order("name", { ascending: true });

    if (activationPhase) {
        query = query.eq("activation_phase", activationPhase);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[geo] getAllCountries error:", error.message);
        return [];
    }

    return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.iso2.toLowerCase(),
        iso2: r.iso2,
        iso3: r.iso3,
        tier: r.activation_phase ?? "monitor",
    }));
}
