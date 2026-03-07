import { getSupabaseServerClient } from "@/lib/supabase/server";

const SURFACE_SELECT = "surface_key,country_code,city,state,surface_class,name,latitude,longitude,quality_score,brand,address,is_claimable" as const;

// ─── Country Class ────────────────────────────────────────

export async function getSurfacesForCountryClass(countryCode: string, surfaceClass: string, limit = 50, offset = 0) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_surfaces")
        .select(SURFACE_SELECT)
        .eq("country_code", countryCode)
        .eq("surface_class", surfaceClass)
        .order("quality_score", { ascending: false, nullsFirst: false })
        .order("name", { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data ?? [];
}

export async function getTopCitiesForCountryClass(countryCode: string, surfaceClass: string, limit = 20) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_surface_city_rollups")
        .select("city,country_code,surface_class,total,claimable")
        .eq("country_code", countryCode)
        .eq("surface_class", surfaceClass)
        .order("total", { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data ?? [];
}

// ─── City Class ───────────────────────────────────────────

export async function getSurfacesForCityClass(countryCode: string, city: string, surfaceClass: string, limit = 50, offset = 0) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_surfaces")
        .select(SURFACE_SELECT)
        .eq("country_code", countryCode)
        .ilike("city", city.replace(/-/g, ' '))
        .eq("surface_class", surfaceClass)
        .order("quality_score", { ascending: false, nullsFirst: false })
        .order("name", { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data ?? [];
}

// ─── Corridor Class ───────────────────────────────────────

export async function getSurfacesForCorridorClass(corridorSlug: string, surfaceClass: string, limit = 50, offset = 0) {
    const supabase = getSupabaseServerClient();
    // Match by corridor city names
    const { data: corridor } = await supabase
        .from("hc_corridor_edges")
        .select("origin_city,dest_city,origin_country")
        .eq("corridor_key", corridorSlug)
        .limit(1)
        .maybeSingle();

    if (!corridor) return [];

    const { data, error } = await supabase
        .from("hc_surfaces")
        .select(SURFACE_SELECT)
        .eq("country_code", corridor.origin_country)
        .eq("surface_class", surfaceClass)
        .or(`city.ilike.${corridor.origin_city},city.ilike.${corridor.dest_city}`)
        .order("quality_score", { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);
    if (error) throw error;
    return data ?? [];
}

// ─── Surface Profile ──────────────────────────────────────

export async function getSurfaceProfile(surfaceKey: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_surfaces")
        .select("*")
        .eq("surface_key", surfaceKey)
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// ─── Related Links ────────────────────────────────────────

export async function getRelatedLinksByPageKey(pageKeyId: string, limit = 20) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_internal_links")
        .select("target_page_key_id,link_type,anchor_text,weight")
        .eq("source_page_key_id", pageKeyId)
        .order("weight", { ascending: false })
        .order("anchor_text", { ascending: true })
        .limit(limit);
    if (error) throw error;

    // Fetch target slugs
    const ids = (data ?? []).map(d => d.target_page_key_id);
    if (!ids.length) return [];

    const { data: targets } = await supabase
        .from("hc_page_keys")
        .select("id,canonical_slug,h1,page_type,indexable,page_status")
        .in("id", ids)
        .eq("page_status", "active");

    const targetMap = new Map((targets ?? []).map(t => [t.id, t]));

    return (data ?? [])
        .filter(d => targetMap.has(d.target_page_key_id))
        .map(d => ({
            ...d,
            target: targetMap.get(d.target_page_key_id)!,
        }));
}

// ─── AdGrid Inventory ─────────────────────────────────────

export async function getAdGridInventoryByPageKey(pageKeyId: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_adgrid_page_inventory")
        .select("id,inventory_key,page_key_id,placement_type,traffic_band,floor_price_usd,is_sellable")
        .eq("page_key_id", pageKeyId)
        .eq("is_sellable", true)
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}
