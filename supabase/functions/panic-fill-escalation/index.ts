import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * panic-fill-escalation
 *
 * Scans active loads and applies 4-stage escalation to rescue slow-filling loads.
 * Run via pg_cron every 5 minutes or triggered by load board events.
 *
 * Stages:
 *  1. Soft Nudge — suggest rate adjust, show fill probability warning
 *  2. Supply Expansion — expand match radius, push to nearby corridors
 *  3. Priority Rescue — recommend load boost, visibility boost
 *  4. Last Chance — auto-repost suggestion, flag for sales outreach
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EscalationAction {
    load_id: string;
    stage: 1 | 2 | 3 | 4;
    stage_label: string;
    actions: string[];
    broker_id?: string;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // Fetch active loads with their age and bid count
        const { data: activeLoads, error } = await supabase
            .from("loads")
            .select("id, broker_id, origin_state, created_at, status, rate_total, bid_count")
            .eq("status", "active")
            .order("created_at", { ascending: true });

        if (error) throw error;
        if (!activeLoads || activeLoads.length === 0) {
            return new Response(JSON.stringify({ escalated: 0, message: "No active loads" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Fetch liquidity data for risk assessment
        const { data: liquidityData } = await supabase
            .from("v_market_liquidity")
            .select("*");

        const liquidityMap = new Map(
            (liquidityData || []).map((l: any) => [l.geo_key, l])
        );

        const now = Date.now();
        const escalations: EscalationAction[] = [];

        for (const load of activeLoads) {
            const ageMinutes = (now - new Date(load.created_at).getTime()) / 60_000;
            const bids = load.bid_count || 0;
            const geo = load.origin_state || "XX";
            const liquidity = liquidityMap.get(geo);
            const liquidityScore = (liquidity as any)?.liquidity_score || 0;

            // Determine escalation stage
            let stage: 1 | 2 | 3 | 4 | null = null;
            let stageLabel = "";
            const actions: string[] = [];

            // Stage 1: Soft Nudge — Early risk (30+ min, no bids, or low liquidity)
            if (ageMinutes >= 30 && bids === 0 && !stage) {
                stage = 1;
                stageLabel = "soft_nudge";
                actions.push("suggest_rate_adjust", "show_fill_probability_warning", "highlight_nearby_drivers");
            }
            // Stage 1 also triggers if liquidity is yellow and load is 20+ min
            if (liquidityScore < 60 && ageMinutes >= 20 && bids === 0 && !stage) {
                stage = 1;
                stageLabel = "soft_nudge";
                actions.push("suggest_rate_adjust", "show_fill_probability_warning");
            }

            // Stage 2: Supply Expansion — 60+ min open, or low liquidity with no bids
            if (ageMinutes >= 60 && bids <= 1 && !stage) {
                stage = 2;
                stageLabel = "supply_expansion";
                actions.push("expand_match_radius", "push_to_nearby_corridors", "priority_push_to_top_drivers");
            }
            if (liquidityScore < 45 && ageMinutes >= 45 && bids === 0 && !stage) {
                stage = 2;
                stageLabel = "supply_expansion";
                actions.push("expand_match_radius", "priority_push_to_top_drivers");
            }

            // Stage 3: Priority Rescue — 120+ min open
            if (ageMinutes >= 120 && bids <= 2 && !stage) {
                stage = 3;
                stageLabel = "priority_rescue";
                actions.push("recommend_load_boost", "temporary_visibility_boost", "broker_urgency_banner");
            }

            // Stage 4: Last Chance — 180+ min open or critically low liquidity
            if (ageMinutes >= 180 && !stage) {
                stage = 4;
                stageLabel = "last_chance";
                actions.push("auto_repost_suggestion", "concierge_outreach_flag", "mark_for_sales_followup");
            }
            if (liquidityScore < 20 && ageMinutes >= 90 && bids === 0 && !stage) {
                stage = 4;
                stageLabel = "last_chance";
                actions.push("auto_repost_suggestion", "concierge_outreach_flag");
            }

            if (stage) {
                escalations.push({
                    load_id: load.id,
                    stage,
                    stage_label: stageLabel,
                    actions,
                    broker_id: load.broker_id,
                });
            }
        }

        // Log all escalation events (audit trail)
        if (escalations.length > 0) {
            const logEntries = escalations.map(e => ({
                load_id: e.load_id,
                stage: e.stage,
                stage_label: e.stage_label,
                actions: e.actions,
                broker_id: e.broker_id,
                created_at: new Date().toISOString(),
            }));

            // Upsert into an escalation log — will NOT duplicate if re-run
            await supabase.from("panic_fill_log").upsert(logEntries, {
                onConflict: "load_id,stage",
            });
        }

        return new Response(
            JSON.stringify({
                escalated: escalations.length,
                total_active: activeLoads.length,
                breakdown: {
                    stage_1: escalations.filter(e => e.stage === 1).length,
                    stage_2: escalations.filter(e => e.stage === 2).length,
                    stage_3: escalations.filter(e => e.stage === 3).length,
                    stage_4: escalations.filter(e => e.stage === 4).length,
                },
                escalations,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
