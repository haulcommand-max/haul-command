/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_REASONS = ["rate", "distance", "schedule", "requirements", "broker_trust", "other"] as const;

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const pathOfferId = pathParts[pathParts.length - 1];
    const body = await req.json().catch(() => ({}));
    const offer_id = (pathOfferId && pathOfferId !== "offer-decline") ? pathOfferId : body?.offer_id;

    if (!offer_id) return new Response(JSON.stringify({ error: "Missing offer_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const decline_reason = body?.reason ?? "other";
    const decline_notes = body?.notes ?? null;

    if (!VALID_REASONS.includes(decline_reason)) {
        return new Response(JSON.stringify({ error: `Invalid reason. Must be: ${VALID_REASONS.join(", ")}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const now = new Date().toISOString();

    const { data: offer } = await supabase
        .from("match_offers")
        .select("id, escort_id, status")
        .eq("id", offer_id)
        .single();

    if (!offer) return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (offer.escort_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    if (!["offered", "viewed"].includes(offer.status)) {
        return new Response(JSON.stringify({ error: "Offer cannot be declined", current_status: offer.status }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    await supabase
        .from("match_offers")
        .update({
            status: "declined",
            responded_at: now,
            decline_reason,
            decline_notes,
        })
        .eq("id", offer_id);

    return new Response(JSON.stringify({ ok: true, offer_id, declined_at: now }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});
