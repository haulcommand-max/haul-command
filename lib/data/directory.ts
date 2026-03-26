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
    metadata?: any;
};

export async function getDirectoryDriverBySlug(slug: string): Promise<DirectoryProfileRow | null> {
    const sb = supabaseServer();

    // Query massive unified directory_listings table instead of outdated driver view
    const { data, error } = await sb
        .from("directory_listings")
        .select("*")
        .eq("slug", slug)
        .eq("is_visible", true)
        .maybeSingle();

    if (error || !data) {
        console.error("Error fetching driver by slug:", error);
        return null;
    }

    // Map `directory_listings` schema back to legacy `DirectoryProfileRow`
    return {
        id: data.id,
        slug: data.slug,
        user_id: data.entity_id || data.id,
        display_name: data.name,
        city: data.city || 'National',
        state: data.region_code || 'US',
        zip: data.metadata?.zip || '',
        description: data.metadata?.description || '',
        verified_tier: data.rank_score >= 80 ? 'V2' : (data.rank_score >= 40 ? 'V1' : 'V0'),
        equipment_tags: data.metadata?.equipment || [],
        service_area_states: data.metadata?.service_area || [data.region_code],
        review_count: data.metadata?.review_count || 0,
        avg_rating: (data.rank_score || 0) / 20, // Map 0-100 to 0.0-5.0
        years_in_business: data.metadata?.years_in_business || 1,
        logo_url: data.metadata?.logo_url || null,
        cover_image_url: data.metadata?.cover_image_url || null,
        verification_badges: data.metadata?.badges || [],
        joined_at: data.created_at || new Date().toISOString(),
        public_phone: data.metadata?.phone || null,
        public_website: data.metadata?.website || null,
        metadata: data.metadata || {}
    } as DirectoryProfileRow;
}

export async function getDirectoryDriversByState(stateCode: string) {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_listings")
        .select("slug, name, city, region_code, rank_score, metadata")
        .eq("region_code", stateCode)
        .eq("is_visible", true)
        .limit(50);

    if (error || !data) {
        console.error("Error fetching drivers by state:", error);
        return [];
    }

    return data.map(d => ({
        slug: d.slug,
        display_name: d.name,
        city: d.city,
        state: d.region_code,
        verified_tier: d.rank_score >= 80 ? 'V2' : 'V0',
        avg_rating: (d.rank_score || 0) / 20,
        review_count: d.metadata?.review_count || 0,
        equipment_tags: d.metadata?.equipment || []
    }));
}

export async function getDirectoryDriversByCity(city: string, state: string) {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_listings")
        .select("slug, name, city, region_code, rank_score, metadata")
        .ilike("city", city)
        .eq("region_code", state)
        .eq("is_visible", true)
        .limit(50);

    if (error || !data) {
        console.error("Error fetching drivers by city:", error);
        return [];
    }

    return data.map(d => ({
        slug: d.slug,
        display_name: d.name,
        city: d.city,
        state: d.region_code,
        verified_tier: d.rank_score >= 80 ? 'V2' : 'V0',
        avg_rating: (d.rank_score || 0) / 20,
        review_count: d.metadata?.review_count || 0,
        equipment_tags: d.metadata?.equipment || []
    }));
}
