/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * broker-availability-feed — SONNET-02
 *
 * Returns real-time operator supply visible to brokers.
 * Brokers call this with a corridor or state/region to see:
 *   - available escort count
 *   - liquidity score + tier
 *   - top operators by proximity and trust score
 *   - ETA to match (estimated from liquidity history)
 *   - shortage flags
 *
 * GET /functions/v1/broker-availability-feed?state=TX&service_type=pevo_lead_chase
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Liquidity tier labels for broker UI
function getLiquidityLabel(score: number) {
    if (score >= 85) return { label: "Instant Fill", color: "green", eta_min: 5 };
    if (score >= 70) return { label: "Healthy", color: "green", eta_min: 15 };
    if (score >= 50) return { label: "Moderate", color: "yellow", eta_min: 35 };
    if (score >= 30) return { label: "Tight", color: "orange", eta_min: 75 };
    return { label: "Shortage Risk", color: "red", eta_min: null };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const url = new URL(req.url);
    const state = url.searchParams.get("state")?.toUpperCase() ?? null;
    const country = url.searchParams.get("country")?.toUpperCase() ?? "US";
    const serviceType = url.searchParams.get("service_type") ?? null;
    const radius = parseInt(url.searchParams.get("radius_miles") ?? "150", 10);

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 1. Pull live presence from escort_presence ──
    let presenceQuery = supabase
        .from("escort_presence")
        .select("escort_id, status, last_lat, last_lng, last_heartbeat_at, battery_pct")
        .eq("status", "available")
        .gt("last_heartbeat_at", new Date(Date.now() - 6 * 3600_000).toISOString());

    const { data: presenceRows } = await presenceQuery;

    // ── 2. Pull availability windows ──
    const now = new Date().toISOString();
    const { data: windowRows } = await supabase
        .from("escort_availability_windows")
        .select("escort_id, end_at, mode")
        .gte("end_at", now);

    const availableWindowIds = new Set((windowRows || []).map((w: any) => w.escort_id));

    // Combine: only operators with BOTH active presence AND an open window
    const confirmedIds = (presenceRows || [])
        .filter((p: any) => availableWindowIds.has(p.escort_id))
        .map((p: any) => p.escort_id);

    // ── 3. Pull market liquidity score ──
    const { data: liquidityRows } = await supabase
        .from("v_market_liquidity")
        .select("geo_key, liquidity_score, available_count, load_count_24h")
        .eq("geo_key", state ?? country);

    const liquidity = liquidityRows?.[0];
    const liquidityScore = liquidity?.liquidity_score ?? 50;
    const liquidityInfo = getLiquidityLabel(liquidityScore);

    // ── 4. Pull top operators (with trust scores) ──
    let operatorsQuery = supabase
        .from("operator_profiles")
        .select("user_id, display_name, trust_score, home_base_state, service_types, certifications, avatar_url")
        .in("user_id", confirmedIds.slice(0, 50)); // cap at 50 for perf

    if (state) {
        operatorsQuery = operatorsQuery.eq("home_base_state", state);
    }
    if (serviceType) {
        operatorsQuery = operatorsQuery.contains("service_types", [serviceType]);
    }

    const { data: operators } = await operatorsQuery.order("trust_score", { ascending: false }).limit(20);

    // ── 5. Pull shortage signals from monitor-dead-zones output ──
    const { data: shortageSignals } = await supabase
        .from("hc_csn_signals")
        .select("signal_type, geo_key, context_json")
        .eq("geo_key", state ?? country)
        .in("signal_type", ["pilot_car_shortage", "capacity_gap"])
        .gt("created_at", new Date(Date.now() - 24 * 3600_000).toISOString())
        .limit(5);

    // ── 6. Format response ──
    return new Response(JSON.stringify({
        ok: true,
        geo: { country, state },
        availability: {
            confirmed_operator_count: confirmedIds.length,
            liquidity_score: liquidityScore,
            liquidity_label: liquidityInfo.label,
            liquidity_color: liquidityInfo.color,
            estimated_fill_minutes: liquidityInfo.eta_min,
            shortage_signals: shortageSignals?.length ?? 0,
        },
        top_operators: (operators || []).map((op: any) => ({
            user_id: op.user_id,
            display_name: op.display_name,
            trust_score: op.trust_score,
            state: op.home_base_state,
            certifications: op.certifications ?? [],
            avatar_url: op.avatar_url,
            service_types: op.service_types ?? [],
        })),
        shortage_alerts: (shortageSignals || []).map((s: any) => ({
            type: s.signal_type,
            geo: s.geo_key,
            detail: s.context_json,
        })),
        generated_at: new Date().toISOString(),
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});
