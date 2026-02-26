import { supabaseServer } from "@/lib/supabase/server";

export type DirectoryProfileRow = {
    id: string;
    slug: string;
    user_id: string;
    display_name: string;
    city: string;
    state: string;
    zip: string;
    description: string;
    verified_tier: string;
    equipment_tags: string[]; // jsonb array
    service_area_states: string[]; // jsonb array
    review_count: number;
    avg_rating: number;
    years_in_business: number;
    logo_url: string | null;
    cover_image_url: string | null;
    verification_badges: string[]; // jsonb array
    joined_at: string;
    public_phone: string | null;
    public_website: string | null;
};

export async function getDirectoryDriverBySlug(slug: string): Promise<DirectoryProfileRow | null> {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_driver_profiles_view")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        console.error("Error fetching driver by slug:", error);
        return null;
    }

    return data as DirectoryProfileRow;
}

export async function getDirectoryDriversByState(stateCode: string) {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_driver_profiles_view")
        .select("slug, display_name, city, state, verified_tier, avg_rating, review_count, equipment_tags")
        .eq("state", stateCode)
        .limit(50);

    if (error) {
        console.error("Error fetching drivers by state:", error);
        return [];
    }

    return data;
}

export async function getDirectoryDriversByCity(city: string, state: string) {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_driver_profiles_view")
        .select("slug, display_name, city, state, verified_tier, avg_rating, review_count, equipment_tags")
        .eq("city", city)
        .eq("state", state)
        .limit(50);

    if (error) {
        console.error("Error fetching drivers by city:", error);
        return [];
    }

    return data;
}
