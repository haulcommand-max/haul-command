import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();
    const body = await req.json().catch(() => ({}));

    const table = String(body.table ?? "");
    const key = String(body.key ?? "");
    const value = body.value ?? null;

    if (!["app_settings", "feature_flags"].includes(table) || !key) {
        return new Response(JSON.stringify({ ok: false, error: "bad request" }), {
            status: 400,
            headers: { ...corsHeaders, "content-type": "application/json" },
        });
    }

    const payload = table === "app_settings"
        ? { key, value }
        : { key, enabled: Boolean(body.enabled), rules: body.rules ?? {} };

    const { error } = await supabase.from(table).upsert(payload);

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
    });
});
