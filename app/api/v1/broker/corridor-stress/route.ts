export const dynamic = 'force-dynamic';
/**
 * Phase 9 â€” Dynamic Surge & Pricing Brain
 * GET /api/v1/broker/corridor-stress?corridor=I-10_TX_LA
 *
 * Returns the latest Corridor Stress Index and liquidity signals for
 * a given corridor. Powers broker search UI, heatmaps, and urgency pricing display.
 *
 * Public broker surface â€” no enterprise key required.
 * Enterprise-grade shortage predictions live at /intel/surge/[corridor].
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// â”€â”€ Stress Index computation (Layers 1 + 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CorridorStats {
    open_load_count: number;
    available_escort_count: number;
    fill_time_p50_minutes: number | null;
    recent_fill_failures: number;
    broker_urgency_signals: number;
}

/**
 * Layer 1 â€” Corridor Stress Index (0-100).
 *
 * Computed from:
 *  - supply/demand ratio (inverse â€” high demand + low supply = high stress)
 *  - fill time vs. historical baseline
 *  - recent failure rate
 *  - active broker urgency signals
 */
function computeStressIndex(stats: CorridorStats): number {
    const supply = Math.max(stats.available_escort_count, 1);
    const demand = Math.max(stats.open_load_count, 0);

    // Layer 2 â€” Liquidity imbalance (smoothed ratio)
    const rawRatio = demand / supply;
    const imbalanceScore = Math.min(rawRatio / 3, 1); // normalize: ratio of 3 = near-max stress

    // Fill time stress: baseline is 60 min; stress climbs above that
    const fillStress = stats.fill_time_p50_minutes
        ? Math.min((stats.fill_time_p50_minutes - 60) / 120, 1)  // 0 at 60m, max at 3h
        : 0;

    // Failure rate contribution
    const failureStress = Math.min(stats.recent_fill_failures / 5, 1); // 0 when 0 failures, max at 5+

    // Broker urgency signal amplifier
    const urgencyBoost = Math.min(stats.broker_urgency_signals * 0.05, 0.2); // caps at 0.20

    // Weighted combination
    const raw =
        imbalanceScore * 0.50 +
        fillStress * 0.25 +
        failureStress * 0.15 +
        urgencyBoost * 0.10;

    return Math.round(Math.min(raw, 1) * 100);
}

function classifyStress(index: number): { label: string; color: string; broker_tier: string } {
    if (index >= 80) return { label: "Critical Shortage", color: "red", broker_tier: "guaranteed_coverage" };
    if (index >= 65) return { label: "High Demand", color: "orange", broker_tier: "priority" };
    if (index >= 40) return { label: "Active", color: "yellow", broker_tier: "standard" };
    return { label: "Healthy", color: "green", broker_tier: "standard" };
}

// â”€â”€ Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const corridor_id = searchParams.get("corridor");

    if (!corridor_id) {
        return NextResponse.json({ error: "?corridor= is required" }, { status: 400 });
    }

    // 1. Fetch the most recent stress snapshot from DB (written by background job)
    const { data: snapshot } = await getSupabase()
        .from("corridor_stress_log")
        .select("*")
        .eq("corridor_id", corridor_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .single();

    // 2. If no snapshot exists, compute on the fly from live data
    let liveStats: CorridorStats;

    if (snapshot && snapshot.computed_at) {
        const ageSeconds = (Date.now() - new Date(snapshot.computed_at).getTime()) / 1000;
        if (ageSeconds < 90) {
            // Fresh enough â€” return cached
            const stress = snapshot.stress_index ?? computeStressIndex(snapshot);
            const classification = classifyStress(stress);
            return NextResponse.json({
                corridor_id,
                stress_index: stress,
                ...classification,
                open_loads: snapshot.open_load_count,
                available_escorts: snapshot.available_escort_count,
                liquidity_ratio: snapshot.liquidity_ratio,
                data_freshness_seconds: Math.round(ageSeconds),
                source: "cache",
            });
        }
    }

    // 3. Live computation â€” query corridor data directly
    //    In prod: corridor_id maps to a geo polygon; here we use state codes as proxy.
    const [originState, destState] = corridor_id.split("_").slice(1, 3);

    const [loadCountRes, escortCountRes] = await Promise.all([
        getSupabase()
        .from("loads")
            .select("id", { count: "exact", head: true })
            .eq("status", "open")
            .in("origin_state", [originState].filter(Boolean)),

        getSupabase()
        .from("driver_profiles")
            .select("id", { count: "exact", head: true })
            .eq("is_available", true)
            .overlaps("states_licensed", [originState, destState].filter(Boolean)),
    ]);

    liveStats = {
        open_load_count: loadCountRes.count ?? 0,
        available_escort_count: escortCountRes.count ?? 0,
        fill_time_p50_minutes: null,  // computed async in background job
        recent_fill_failures: 0,
        broker_urgency_signals: 0,
    };

    const stress = computeStressIndex(liveStats);
    const classification = classifyStress(stress);
    const liquidity = liveStats.open_load_count / Math.max(liveStats.available_escort_count, 1);

    // 4. Persist the new snapshot to the log
    await getSupabase().from("corridor_stress_log").insert({
        corridor_id,
        origin_state: originState,
        dest_state: destState,
        open_load_count: liveStats.open_load_count,
        available_escort_count: liveStats.available_escort_count,
        stress_index: stress,
        liquidity_ratio: liquidity,
    });

    return NextResponse.json({
        corridor_id,
        stress_index: stress,
        ...classification,
        open_loads: liveStats.open_load_count,
        available_escorts: liveStats.available_escort_count,
        liquidity_ratio: parseFloat(liquidity.toFixed(4)),
        data_freshness_seconds: 0,
        source: "live",
    });
}
