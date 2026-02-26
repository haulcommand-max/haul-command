
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase-client.ts";

/**
 * eval-load-intelligence
 * 
 * Logic to determine risk and drive map coloring/alerts based on load vs. state regulations.
 * Implements the core calculation layer for the 10X Dispatch Engine.
 */
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = getSupabaseClient();
        const { width, height, length, weight, regions } = await req.json();

        if (!regions || !Array.isArray(regions)) {
            return new Response(
                JSON.stringify({ error: "Missing or invalid regions array" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch regulations for all requested regions
        const { data: rules, error } = await supabase
            .from("state_regulations")
            .select("*")
            .in("state_code", regions);

        if (error) throw error;

        const evaluation = regions.map(code => {
            const stateRules = rules.find(r => r.state_code === code);
            if (!stateRules) {
                return { region: code, status: "unknown", risk_level: "gray" };
            }

            const results = {
                region: code,
                escort_required: false,
                height_pole_required: false,
                risk_level: "green",
                alerts: [] as string[]
            };

            // Evaluation Logic (per Strategic Call)
            const w = parseFloat(width);
            const h = parseFloat(height);

            const escortWidthTrigger = parseFloat(stateRules.escort_required_width || "12");
            const heightPoleTrigger = parseFloat(stateRules.height_pole_threshold || "14.5");
            const maxWidthNoPermit = parseFloat(stateRules.max_width_no_permit || "8.5");
            const maxHeightAbsolute = parseFloat(stateRules.max_height_absolute || "16");

            if (w > escortWidthTrigger) {
                results.escort_required = true;
                results.alerts.push("Escort Required (Width)");
            }

            if (h > heightPoleTrigger) {
                results.height_pole_required = true;
                results.alerts.push("Height Pole Required");
            }

            if (w > maxWidthNoPermit) {
                results.risk_level = "yellow";
            }

            // 10X Risk Escalation
            if (h > maxHeightAbsolute || w > 16) {
                results.risk_level = "red";
            }

            // Blackout logic (Placeholder for future complexity)
            if (w > 18 || h > 18) {
                results.risk_level = "black";
                results.alerts.push("Permit Likely Denied - Superload/Height Restriction");
            }

            return results;
        });

        return new Response(
            JSON.stringify(evaluation),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
