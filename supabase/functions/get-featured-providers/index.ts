
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient, corsHeaders } from "../_shared/supabase-client.ts";

/**
 * get-featured-providers
 * 
 * Retrieves verified partners (sponsors) based on region and category targeting.
 * This powers the 'Verified Partner' model in the 10X Dispatch Engine.
 */
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = getSupabaseClient();
        const { region, category, limit = 5 } = await req.json();

        if (!region || !category) {
            return new Response(
                JSON.stringify({ error: "Missing region or category" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        const { data, error } = await supabase
            .from("sponsor_placements")
            .select(`
        *,
        sponsors (*)
      `)
            .eq("is_active", true)
            .eq("region_code", region)
            .eq("category", category)
            .order("priority_score", { ascending: false })
            .limit(limit);

        if (error) throw error;

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
