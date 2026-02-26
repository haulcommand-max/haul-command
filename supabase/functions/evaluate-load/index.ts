
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase-client.ts";

/**
 * evaluate-load
 * 
 * Dispatch Brain orchestration:
 * 1. Fetches regulations for origin/dest
 * 2. Compares load dims to thresholds
 * 3. Calls DB calculate_load_difficulty
 * 4. Determines System Phase (Launch/Signal/Intelligence)
 */

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = getSupabaseClient();
        const { load, route } = await req.json();

        // 1. Fetch State Rules
        const { data: rules } = await supabase
            .from("state_regulations")
            .select("*")
            .in("state_code", [route.origin_region, route.dest_region]);

        const originRules = rules?.find(r => r.state_code === route.origin_region);

        // 2. Simple Boolean Extraction (Phase 1)
        const escort_required = load.width > (parseFloat(originRules?.escort_required_width) || 12.0);
        const height_pole_required = load.height > (parseFloat(originRules?.escort_required_height) || 14.5);
        const special_permit_required = load.width > 14.0 || load.height > 15.5;

        // 3. Call Master DB Function
        const { data: scoring, error: scoreErr } = await supabase
            .rpc("calculate_load_difficulty", {
                p_width: load.width,
                p_height: load.height,
                p_length: load.length || 65,
                p_weight: load.weight || 80000,
                p_escort_required: escort_required,
                p_height_pole_required: height_pole_required,
                p_special_permit_required: special_permit_required,
                p_is_urban: route.is_urban || false
            });

        if (scoreErr) throw scoreErr;

        // 4. Fetch System Phase
        const { data: metrics } = await supabase.from("system_metrics").select("*").single();
        let phase = "LAUNCH";
        if (metrics.user_count >= 75000 && metrics.days_live >= 90) phase = "INTELLIGENCE";
        else if (metrics.user_count >= 25000 && metrics.days_live >= 60) phase = "SIGNAL";

        return new Response(
            JSON.stringify({
                ...scoring,
                system_phase: phase,
                logic_version: "10X-v1",
                verified_at: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
