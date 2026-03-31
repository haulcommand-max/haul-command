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
    claim_status?: string;
};

export async function getDirectoryDriverBySlug(slug: string): Promise<DirectoryProfileRow | null> {
    const sb = await supabaseServer();

    // Query canonical hc_real_operators table instead of deprecated directory_listings
    const { data, error } = await sb
        .from("hc_real_operators")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();

    if (error || !data) {
        console.error("Error fetching driver by slug:", error);
        return null;
    }

    // Map `hc_real_operators` schema to UI `DirectoryProfileRow`
    return {
        id: data.id,
        slug: data.slug,
        user_id: data.claimed_by_user_id || data.id,
        display_name: data.display_name,
        city: data.city || 'Regional',
        state: data.state_code || 'US',
        zip: '',
        description: data.description || '',
        verified_tier: data.claim_status === 'verified' ? 'V1' : 'V0',
        equipment_tags: data.entity_type === 'pilot_car' ? ['Pilot Car Escort'] : [data.entity_type],
        service_area_states: [data.state_code || 'US'],
        review_count: Math.floor(data.trust_score * 50) || 0,
        avg_rating: (data.trust_score * 5) || 4.5,
        years_in_business: 1,
        logo_url: null,
        cover_image_url: null,
        verification_badges: data.trust_classification === 'verified' ? ['identity'] : [],
        joined_at: data.created_at || new Date().toISOString(),
        public_phone: data.phone || null,
        public_website: data.website || null,
        metadata: { trust_classification: data.trust_classification, source: data.source_system },
        claim_status: data.claim_status
    } as DirectoryProfileRow;
}

export async function getDirectoryDriversByState(stateCode: string) {
    const sb = await supabaseServer();

    const { data, error } = await sb
        .from("hc_real_operators")
        .select("slug, display_name, city, state_code, trust_score, claim_status")
        .eq("state_code", stateCode)
        .eq("is_public", true)
        .order("trust_score", { ascending: false })
        .limit(50);

    if (error || !data) {
        console.error("Error fetching drivers by state:", error);
        return [];
    }

    return data.map((d: any) => ({
        slug: d.slug,
        display_name: d.display_name,
        city: d.city,
        state: d.state_code,
        verified_tier: d.claim_status === 'verified' ? 'V1' : 'V0',
        avg_rating: (d.trust_score * 5) || 4.5,
        review_count: Math.floor(d.trust_score * 50) || 0,
        equipment_tags: ['Pilot Car']
    }));
}

export async function getDirectoryDriversByCity(city: string, state: string) {
    const sb = await supabaseServer();

    const { data, error } = await sb
        .from("hc_real_operators")
        .select("slug, display_name, city, state_code, trust_score, claim_status")
        .ilike("city", city)
        .eq("state_code", state)
        .eq("is_public", true)
        .order("trust_score", { ascending: false })
        .limit(50);

    if (error || !data) {
        console.error("Error fetching drivers by city:", error);
        return [];
    }

    return data.map((d: any) => ({
        slug: d.slug,
        display_name: d.display_name,
        city: d.city,
        state: d.state_code,
        verified_tier: d.claim_status === 'verified' ? 'V1' : 'V0',
        avg_rating: (d.trust_score * 5) || 4.5,
        review_count: Math.floor(d.trust_score * 50) || 0,
        equipment_tags: ['Pilot Car']
    }));
}
