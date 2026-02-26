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

        // Parse viewport from query params if needed
        // const url = new URL(req.url);
        // const minLat = parseFloat(url.searchParams.get("minLat") ?? "-90");
        // ...

        // Call the RPC
        const { data, error } = await supabase.rpc("get_live_map_data", {
            viewport_min_lat: -90,
            viewport_min_lng: -180,
            viewport_max_lat: 90,
            viewport_max_lng: 180
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
