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
    equipment_tags: string[];
    service_area_states: string[];
    review_count: number;
    avg_rating: number;
    years_in_business: number;
    logo_url: string | null;
    cover_image_url: string | null;
    verification_badges: string[];
    joined_at: string;
    public_phone: string | null;
    public_website: string | null;
    metadata?: any;
    claim_status?: string;
};

function mapOperator(data: any): DirectoryProfileRow {
    const score = Number(data.confidence_score ?? 0);
    return {
        id: data.id,
        slug: data.slug,
        user_id: data.user_id || data.id,
        display_name: data.name,
        city: data.city || 'Regional',
        state: data.admin1_code || 'US',
        zip: '',
        description: data.service_area || '',
        verified_tier: data.is_verified ? 'V1' : 'V0',
        equipment_tags: data.entity_type ? [data.entity_type.replace(/_/g,' ')] : ['Pilot Car'],
        service_area_states: data.admin1_code ? [data.admin1_code] : [],
        review_count: data.review_count || Math.floor(score * 10),
        avg_rating: data.google_rating || (score > 0 ? Math.min(5, 3.5 + score * 0.015) : 4.5),
        years_in_business: 1,
        logo_url: null,
        cover_image_url: null,
        verification_badges: data.is_verified ? ['identity'] : [],
        joined_at: data.created_at || new Date().toISOString(),
        public_phone: data.phone_normalized || null,
        public_website: data.website_url || null,
        metadata: { source: data.source_table, entity_type: data.entity_type },
        claim_status: data.is_claimed ? 'claimed' : 'unclaimed',
    };
}

export async function getDirectoryDriverBySlug(slug: string): Promise<DirectoryProfileRow | null> {
    const sb = await supabaseServer();

    // Try hc_global_operators first (7,711 verified operators)
    const { data: op } = await sb
        .from("hc_global_operators")
        .select("id, name, slug, entity_type, city, admin1_code, country_code, confidence_score, is_claimed, is_verified, phone_normalized, website_url, service_area, google_rating, review_count, created_at, user_id, source_table")
        .eq("slug", slug)
        .maybeSingle();

    if (op) return mapOperator(op);

    // Fallback: hc_places (23,530 geocoded locations)
    const { data: place } = await sb
        .from("hc_places")
        .select("id, slug, name, locality, admin1_code, country_code, phone, website, claim_status, demand_score, surface_category_key, created_at")
        .eq("slug", slug)
        .maybeSingle();

    if (place) {
        return {
            id: place.id,
            slug: place.slug,
            user_id: place.id,
            display_name: place.name,
            city: place.locality || 'Regional',
            state: place.admin1_code || 'US',
            zip: '',
            description: '',
            verified_tier: place.claim_status === 'claimed' ? 'V1' : 'V0',
            equipment_tags: [place.surface_category_key?.replace(/_/g,' ') || 'Service Provider'],
            service_area_states: place.admin1_code ? [place.admin1_code] : [],
            review_count: 0,
            avg_rating: 4.5,
            years_in_business: 1,
            logo_url: null,
            cover_image_url: null,
            verification_badges: [],
            joined_at: place.created_at || new Date().toISOString(),
            public_phone: place.phone || null,
            public_website: place.website || null,
            metadata: { source: 'hc_places', category: place.surface_category_key },
            claim_status: place.claim_status || 'unclaimed',
        };
    }

    return null;
}

export async function getDirectoryDriversByState(stateCode: string) {
    const sb = await supabaseServer();
    const { data } = await sb
        .from("hc_global_operators")
        .select("slug, name, city, admin1_code, confidence_score, is_claimed, is_verified")
        .eq("admin1_code", stateCode)
        .order("confidence_score", { ascending: false })
        .limit(50);

    return (data ?? []).map((d: any) => ({
        slug: d.slug,
        display_name: d.name,
        city: d.city,
        state: d.admin1_code,
        verified_tier: d.is_verified ? 'V1' : 'V0',
        avg_rating: 4.5,
        review_count: 0,
        equipment_tags: ['Pilot Car'],
    }));
}

export async function getDirectoryDriversByCity(city: string, state: string) {
    const sb = await supabaseServer();
    const { data } = await sb
        .from("hc_global_operators")
        .select("slug, name, city, admin1_code, confidence_score, is_claimed, is_verified")
        .ilike("city", city)
        .eq("admin1_code", state)
        .order("confidence_score", { ascending: false })
        .limit(50);

    return (data ?? []).map((d: any) => ({
        slug: d.slug,
        display_name: d.name,
        city: d.city,
        state: d.admin1_code,
        verified_tier: d.is_verified ? 'V1' : 'V0',
        avg_rating: 4.5,
        review_count: 0,
        equipment_tags: ['Pilot Car'],
    }));
}
