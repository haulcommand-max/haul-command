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
                actions.push("auto_repost_suggestion", "vapi_autonomous_outreach", "mark_for_sales_followup");
            }
            if (liquidityScore < 20 && ageMinutes >= 90 && bids === 0 && !stage) {
                stage = 4;
                stageLabel = "last_chance";
                actions.push("auto_repost_suggestion", "vapi_autonomous_outreach");
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


        // ── FIRE REAL PUSH FOR STAGE 2 AND 3 ──
        // Previously these only logged action strings; now they dispatch to operators.
        const stage23 = escalations.filter(e => e.stage === 2 || e.stage === 3);
        for (const esc of stage23) {
            // Find available operators in the same state as the load
            const { data: nearbyOps } = await supabase
                .from("operator_profiles")
                .select("user_id, display_name, home_base_state, trust_score")
                .eq("home_base_state", (activeLoads.find(l => l.id === esc.load_id) as any)?.origin_state ?? "TX")
                .order("trust_score", { ascending: false })
                .limit(esc.stage === 3 ? 10 : 5); // Wider net for Stage 3

            for (const op of nearbyOps || []) {
                const stageLabel = esc.stage === 2 ? "Priority Load Near You" : "🔴 Urgent — Last Operators Needed";
                const stageBody = esc.stage === 2
                    ? "A load in your corridor is filling slowly. Tap to claim before it escalates."
                    : "This load is at last-chance status. Claim immediately to prevent auto-outreach.";

                await supabase.functions.invoke("fcm-push-worker", {
                    body: {
                        table: "operator_profiles",
                        record: { user_id: op.user_id, profile_id: op.user_id },
                        pushTitle: stageLabel,
                        pushBody: stageBody,
                        deepLink: `/load-board?load=${esc.load_id}&utm_source=panic_fill_s${esc.stage}`,
                    },
                }).catch(() => { /* non-fatal */ });
            }
        }

        // ── TRIGGER VAPI VOICE DISPATCHER FOR STAGE 4 ──
        // Smashing redundant flags into an actual autonomous voice execution
        const vapiKey = Deno.env.get("VAPI_API_KEY");
        const assistantId = Deno.env.get("VAPI_DISPATCHER_ASSISTANT_ID"); // e.g., the load dispatcher assistant
        
        for (const esc of escalations) {
            if (esc.stage === 4 && esc.actions.includes("vapi_autonomous_outreach") && vapiKey && assistantId) {
                // Find available operators in the same state as the dead load (CORRECTED FILTER)
                const originState = (activeLoads.find(l => l.id === esc.load_id) as any)?.origin_state;
                let driverQuery = supabase.from('operator_profiles')
                    .select('user_id, display_name, primary_phone')
                    .eq('type', 'operator');
                if (originState) driverQuery = driverQuery.eq('home_base_state', originState);
                const { data: topDrivers } = await driverQuery.order('trust_score', { ascending: false }).limit(2);
                
                for (const driver of topDrivers || []) {
                    if (!driver.primary_phone) continue;
                    try {
                        await fetch("https://api.vapi.ai/call/phone", {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${vapiKey}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                override_assistant_id: assistantId,
                                customer: {
                                    number: driver.primary_phone,
                                    name: driver.name || "Operator"
                                },
                                assistant_overrides: {
                                    firstMessage: `Hey ${driver.name}, this is Haul Command Dispatch. We have a priority load matching your corridor that needs an immediate fill. Are you available?`
                                }
                            })
                        });
                        // Mark successful ping in DB in future iteration
                    } catch (e) {
                        console.error("Vapi trigger failed", e);
                    }
                }
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
