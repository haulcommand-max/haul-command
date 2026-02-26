/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Extract offer_id from URL path: /offer-viewed/{offer_id}
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const offer_id = pathParts[pathParts.length - 1];

    if (!offer_id || offer_id === "offer-viewed") {
        const body = await req.json().catch(() => ({}));
        if (!body?.offer_id) return new Response(JSON.stringify({ error: "Missing offer_id" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const resolvedOfferId = offer_id !== "offer-viewed" ? offer_id :
        (await req.json().catch(() => ({}))).offer_id;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const now = new Date().toISOString();

    // Only set viewed_at if record is in 'offered' status (idempotent: already viewed is OK)
    const { data: offer, error: fetchErr } = await supabase
        .from("match_offers")
        .select("id, status, escort_id, load_id")
        .eq("id", resolvedOfferId)
        .single();

    if (fetchErr || !offer) return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Verify escort owns this offer
    if (offer.escort_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (offer.status === "offered") {
        await supabase
            .from("match_offers")
            .update({ status: "viewed", viewed_at: now })
            .eq("id", resolvedOfferId);
    }
    // If already viewed/accepted/declined — idempotent, return ok

    return new Response(JSON.stringify({ ok: true, offer_id: resolvedOfferId, viewed_at: now }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});
