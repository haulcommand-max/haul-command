import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function resolveCountryClassPageKey(countrySlug: string, surfaceClass: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("*")
        .eq("page_type", "country_class")
        .eq("country_slug", countrySlug)
        .eq("surface_class", surfaceClass)
        .eq("page_status", "active")
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function resolveCityClassPageKey(countrySlug: string, citySlug: string, surfaceClass: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("*")
        .eq("page_type", "city_class")
        .eq("country_slug", countrySlug)
        .eq("city_slug", citySlug)
        .eq("surface_class", surfaceClass)
        .eq("page_status", "active")
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function resolveCorridorClassPageKey(corridorSlug: string, surfaceClass: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("*")
        .eq("page_type", "corridor_class")
        .eq("corridor_slug", corridorSlug)
        .eq("surface_class", surfaceClass)
        .eq("page_status", "active")
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function resolveNearbyClusterPageKey(anchorType: string, anchorSlug: string, surfaceClass: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("*")
        .eq("page_type", "nearby_cluster")
        .eq("anchor_type", anchorType)
        .eq("anchor_slug", anchorSlug)
        .eq("surface_class", surfaceClass)
        .eq("page_status", "active")
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function resolveSurfaceProfilePageKey(surfaceKey: string) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("*")
        .eq("page_type", "surface_profile")
        .eq("surface_key", surfaceKey)
        .eq("page_status", "active")
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}
