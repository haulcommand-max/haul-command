import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Parse viewport from request body
        let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
        try {
            const body = await req.json();
            if (body?.viewport) {
                minLat = body.viewport.minLat ?? minLat;
                maxLat = body.viewport.maxLat ?? maxLat;
                minLng = body.viewport.minLng ?? minLng;
                maxLng = body.viewport.maxLng ?? maxLng;
            }
        } catch { /* no body or invalid JSON — use global defaults */ }

        // Call the RPC with viewport bounds
        const { data, error } = await supabase.rpc("get_live_map_data", {
            viewport_min_lat: minLat,
            viewport_min_lng: minLng,
            viewport_max_lat: maxLat,
            viewport_max_lng: maxLng
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60, s-maxage=60", // Cache for 60s
            },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
