import { supabaseServer } from "@/lib/supabase/server";

export type LoadRow = {
    id: string;
    slug: string;
    posted_at: string;
    origin_city: string;
    origin_state: string;
    origin_country: string;
    dest_city: string;
    dest_state: string;
    dest_country: string;
    description: string;
    equipment_required: string[];
    rate_per_mile: number | null;
    total_rate: number | null;
    currency: string;
    status: string;
    broker_id: string;
    broker_name: string | null;
    broker_tier: string | null;
    broker_slug: string | null;
    pickup_date: string | null;
    length_ft: number | null;
    width_ft: number | null;
    height_ft: number | null;
    weight_lbs: number | null;
};

export async function getLiveLoadBySlug(slug: string): Promise<LoadRow | null> {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_active_loads_view")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        console.error("Error fetching load by slug:", error);
        return null;
    }

    return data as LoadRow;
}

export async function getActiveLoadsFeed(limit = 50) {
    const sb = supabaseServer();

    const { data, error } = await sb
        .from("directory_active_loads_view")
        .select("id, slug, posted_at, origin_city, origin_state, dest_city, dest_state, equipment_required, status, broker_name")
        .order("posted_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching load feed:", error);
        return [];
    }

    return data;
}
