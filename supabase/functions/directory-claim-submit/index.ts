import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();
    const body = await req.json().catch(() => ({}));

    const driverId = String(body.driverId ?? "");
    const submitted = body.submitted_payload ?? {};

    if (!driverId) {
        return new Response(JSON.stringify({ ok: false, error: "driverId required" }), {
            status: 400, headers: { ...corsHeaders, "content-type": "application/json" }
        });
    }

    const { error } = await supabase.from("driver_claims").insert({
        driver_id: driverId,
        submitted_payload: submitted
    });

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500, headers: { ...corsHeaders, "content-type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ ok: true, status: "pending" }), {
        headers: { ...corsHeaders, "content-type": "application/json" }
    });
});
