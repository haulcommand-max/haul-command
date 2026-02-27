import { supabaseServer } from "@/lib/supabase/server";

// ── Trust Score ──

export async function getTrustScore(
    entityId: string,
    entityType: "escort" | "broker" | "carrier"
) {
    const supabase = supabaseServer();

    const { data, error } = await supabase
        .from("v_trust_scores")
        .select("trust_score")
        .eq("entity_id", entityId)
        .eq("entity_type", entityType)
        .single();

    if (error) return null;
    return data?.trust_score ?? null;
}

export async function getTrustScores(
    entityIds: string[],
    entityType: "escort" | "broker" | "carrier"
) {
    if (entityIds.length === 0) return new Map<string, number>();

    const supabase = supabaseServer();
    const { data, error } = await supabase
        .from("v_trust_scores")
        .select("entity_id, trust_score")
        .eq("entity_type", entityType)
        .in("entity_id", entityIds);

    if (error || !data) return new Map<string, number>();
    return new Map<string, number>(
        data.map((r: any) => [r.entity_id, r.trust_score])
    );
}

// ── Load Quality ──

export async function getLoadQualityScores(loadIds: string[]) {
    if (loadIds.length === 0) return new Map<string, number>();

    const supabase = supabaseServer();
    const { data, error } = await supabase
        .from("v_load_quality_scores")
        .select("load_id, load_quality_score")
        .in("load_id", loadIds);

    if (error || !data) return new Map<string, number>();
    return new Map<string, number>(
        data.map((r: any) => [r.load_id, r.load_quality_score])
    );
}

export async function getLoadQualityScore(loadId: string) {
    const supabase = supabaseServer();

    const { data, error } = await supabase
        .from("v_load_quality_scores")
        .select("load_quality_score, corridor_key, median_rate, rate_percentile_of_median")
        .eq("load_id", loadId)
        .single();

    if (error) return null;
    return data;
}
