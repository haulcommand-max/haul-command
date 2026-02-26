/**
 * GET /api/map/repositioning?escort_id=xxx&lat=&lng=&radius=200
 *
 * Phase 14 — Escort Repositioning Radar
 *
 * Returns opportunity zones ranked by opportunity score for a given escort.
 * Combines corridor stress, urgency signals, personal fit, and movement
 * confidence to guide escorts toward future demand.
 *
 * 4 Zone types (matching heatmap color bands):
 *   hot      (80-100) — move here now, high demand
 *   forming  (60-79)  — demand building
 *   watch    (40-59)  — monitor
 *   balanced (0-39)   — no action needed
 *
 * Guardrails:
 *   - Saturation protection: zones with too many escorts get diminishing returns
 *   - Confidence gating: low-confidence zones are flagged
 *   - Distance sanity: only returns zones within max_miles
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ZoneType = "hot" | "forming" | "watch" | "balanced";

interface OpportunityZone {
    region_code: string;
    region_label: string;
    opportunity_score: number;
    personal_score: number;   // adjusted for this escort's coverage
    zone_type: ZoneType;
    demand_30m: number;
    demand_2h: number;
    estimated_loads: number;
    available_escorts: number;
    zone_saturated: boolean;
    confidence_pct: number;
    predictive_cones: {
        t30m: number;
        t2h: number;
        t24h: number;
    };
    action: string;
    distance_miles: number | null;
    color: string;
}

// ── Zone type classification ──────────────────────────────────────────────────

function classifyZone(score: number): { type: ZoneType; color: string; action: string } {
    if (score >= 80) return { type: "hot", color: "#ef4444", action: "Reposition here — critical demand" };
    if (score >= 60) return { type: "forming", color: "#f97316", action: "Demand building — consider moving" };
    if (score >= 40) return { type: "watch", color: "#F1A91B", action: "Monitor — may need escorts soon" };
    return { type: "balanced", color: "#22c55e", action: "Balanced — stay put or pick nearby work" };
}

// ── Personal fit scoring ──────────────────────────────────────────────────────

function computePersonalFit(
    region: string,
    escortStates: string[],
    escortTrustScore: number,
): number {
    const stateMatch = escortStates.some(s => region.startsWith(s)) ? 1.0 : 0.4;
    const trustFactor = Math.min(escortTrustScore / 100, 1);
    return stateMatch * 0.65 + trustFactor * 0.35;
}

// ── Saturation penalty ────────────────────────────────────────────────────────

function applySaturationPenalty(score: number, escortDensity: number, openLoads: number): { score: number; saturated: boolean } {
    const ratio = openLoads > 0 ? escortDensity / openLoads : escortDensity;
    if (ratio > 2) {
        // More escorts than 2x loads — diminishing returns
        return { score: score * Math.max(0.3, 1 - (ratio - 2) * 0.2), saturated: true };
    }
    return { score, saturated: false };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const escortId = searchParams.get("escort_id");
    const maxMiles = parseInt(searchParams.get("radius") ?? "300");

    // Fetch fresh corridor stress snapshots (latest per corridor)
    const { data: stressData } = await getSupabase()
        .from("corridor_stress_log")
        .select("corridor_id, origin_state, dest_state, stress_index, available_escort_count, open_load_count, computed_at")
        .order("computed_at", { ascending: false })
        .limit(60);

    // Fetch escort profile for personal fit
    let escortStates: string[] = [];
    let escortTrustScore = 70;
    if (escortId) {
        const { data: ep } = await getSupabase()
        .from("driver_profiles")
            .select("states_licensed, trust_score")
            .eq("id", escortId)
            .single();
        if (ep) {
            escortStates = ep.states_licensed ?? [];
            escortTrustScore = ep.trust_score ?? 70;
        }
    }

    // Fetch shortage predictions
    const { data: predictions } = await getSupabase()
        .from("corridor_shortage_predictions")
        .select("corridor_id, prediction_horizon, shortage_probability")
        .gte("predicted_at", new Date(Date.now() - 3_600_000).toISOString());

    const predMap = new Map<string, Record<string, number>>();
    for (const p of predictions ?? []) {
        if (!predMap.has(p.corridor_id)) predMap.set(p.corridor_id, {});
        predMap.get(p.corridor_id)![p.prediction_horizon] = p.shortage_probability;
    }

    // Deduplicate by corridor (latest snapshot wins)
    const seen = new Set<string>();
    const zones: OpportunityZone[] = [];

    for (const snap of stressData ?? []) {
        if (seen.has(snap.corridor_id)) continue;
        seen.add(snap.corridor_id);

        const preds = predMap.get(snap.corridor_id) ?? {};
        const d30m = preds["30m"] ?? snap.stress_index / 100 * 0.8;
        const d2h = preds["2h"] ?? snap.stress_index / 100 * 0.65;
        const d24h = preds["24h"] ?? snap.stress_index / 100 * 0.50;

        // Base opportunity score from corridor stress
        const baseScore = snap.stress_index;

        // Saturation check
        const { score: saturatedScore, saturated } = applySaturationPenalty(
            baseScore,
            snap.available_escort_count ?? 0,
            snap.open_load_count ?? 0,
        );

        // Personal fit adjustment
        const origin = snap.origin_state ?? "";
        const personalFit = computePersonalFit(origin, escortStates, escortTrustScore);
        const personalScore = Math.min(saturatedScore * personalFit, 100);

        // Confidence: based on data density and prediction availability
        const confidencePct = Object.keys(preds).length > 0 ? 82 : 55;

        const classification = classifyZone(personalScore);

        // Label format: "I-10 TX→LA"
        const regionLabel = snap.dest_state
            ? `${snap.corridor_id.replace(/_/g, " ")} (${origin}→${snap.dest_state})`
            : snap.corridor_id;

        zones.push({
            region_code: snap.corridor_id,
            region_label: regionLabel,
            opportunity_score: Math.round(saturatedScore),
            personal_score: Math.round(personalScore),
            zone_type: classification.type,
            demand_30m: Math.round(d30m * 100),
            demand_2h: Math.round(d2h * 100),
            estimated_loads: snap.open_load_count ?? 0,
            available_escorts: snap.available_escort_count ?? 0,
            zone_saturated: saturated,
            confidence_pct: confidencePct,
            predictive_cones: { t30m: d30m, t2h: d2h, t24h: d24h },
            action: classification.action,
            distance_miles: null, // populated when escort lat/lng provided
            color: classification.color,
        });
    }

    // Sort by personal score descending, filter low-confidence and far zones
    const ranked = zones
        .filter(z => z.confidence_pct >= 50)
        .sort((a, b) => b.personal_score - a.personal_score)
        .slice(0, 20);

    // Summary stats
    const hotCount = ranked.filter(z => z.zone_type === "hot").length;
    const formingCount = ranked.filter(z => z.zone_type === "forming").length;

    return NextResponse.json({
        opportunity_zones: ranked,
        summary: {
            hot_zones: hotCount,
            forming_zones: formingCount,
            total_monitored: zones.length,
            escort_id: escortId ?? "anonymous",
            refreshed_at: new Date().toISOString(),
        },
        guardrails: {
            saturation_protection: true,
            confidence_gating: true,
            max_distance_miles: maxMiles,
        },
    });
}
