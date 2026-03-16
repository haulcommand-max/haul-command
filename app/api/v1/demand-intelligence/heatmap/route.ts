// app/api/v1/demand-intelligence/heatmap/route.ts
//
// GET /api/v1/demand-intelligence/heatmap?country_code=US&min_score=70
// Returns regional demand scores for corridor heatmap rendering.
// Includes surge overlays and heatmap colors.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    const countryCode = url.searchParams.get("country_code") ?? "US";
    const minScore = parseInt(url.searchParams.get("min_score") ?? "0");
    const tier = url.searchParams.get("tier");
    const regionCode = url.searchParams.get("region_code");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 500);

    let query = supabase
        .from("regional_demand_scores")
        .select("*")
        .eq("country_code", countryCode)
        .gte("demand_score", minScore)
        .order("demand_score", { ascending: false })
        .limit(limit);

    if (tier) query = query.eq("demand_tier", tier);
    if (regionCode) query = query.eq("region_code", regionCode);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const regions = (data ?? []) as any[];

    // Compute heatmap colors
    const heatmapRegions = regions.map((r) => ({
        ...r,
        heatmap_color: getHeatmapColor(r.demand_score),
    }));

    // Get active surges for overlay
    const { data: surges } = await supabase
        .from("demand_spike_events")
        .select("event_type,region_code,estimated_escort_demand,status")
        .eq("country_code", countryCode)
        .in("status", ["upcoming", "active"]);

    // Summary
    const summary = {
        total_regions: regions.length,
        tier_S: regions.filter((r) => r.demand_tier === "S").length,
        tier_A: regions.filter((r) => r.demand_tier === "A").length,
        tier_B: regions.filter((r) => r.demand_tier === "B").length,
        avg_score: regions.length
            ? Math.round(regions.reduce((s, r) => s + r.demand_score, 0) / regions.length)
            : 0,
        active_surges: (surges ?? []).length,
    };

    return NextResponse.json({
        ok: true,
        country_code: countryCode,
        summary,
        regions: heatmapRegions,
        surge_overlay: surges ?? [],
    });
}

function getHeatmapColor(score: number): string {
    if (score >= 90) return "red";
    if (score >= 70) return "orange";
    if (score >= 50) return "yellow";
    if (score >= 30) return "green";
    return "white";
}
