// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Req = {
    actor_profile_id: string;
    actor_role:        "driver" | "broker" | "system";
    event_type:        string;   // e.g. "leaderboard.view" | "load.unlock" | "cta.click"
    entity_type?:      string;
    entity_id?:        string;
    region_country?:   string;
    region_admin1?:    string;
    region_city?:      string;
    payload?:          Record<string, unknown>;
};

type Res = { ok: true; event_type: string } | { ok: false; error: string };

// Allowlist of event types accepted from clients
const ALLOWED_EVENT_TYPES = new Set([
    "leaderboard.view",
    "leaderboard.filter",
    "load.view",
    "load.unlock",
    "cta.click",
    "provider.view",
    "directory.search",
    "compliance.check",
    "invoice.download",
    "high_pole.view",
    "share.click",
    "session.start",
]);

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();

    let body: Req;
    try {
        body = await req.json();
    } catch {
        const res: Res = { ok: false, error: "invalid json" };
        return new Response(JSON.stringify(res), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // Validate event type (prevent abuse of the event spine)
    if (!ALLOWED_EVENT_TYPES.has(body.event_type)) {
        const res: Res = { ok: false, error: `event_type not allowed: ${body.event_type}` };
        return new Response(JSON.stringify(res), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const { error } = await supabase.from("event_log").insert({
        actor_profile_id: body.actor_profile_id ?? null,
        actor_role:       body.actor_role,
        event_type:       body.event_type,
        entity_type:      body.entity_type ?? null,
        entity_id:        body.entity_id   ?? null,
        region_country:   body.region_country ?? null,
        region_admin1:    body.region_admin1  ?? null,
        region_city:      body.region_city    ?? null,
        payload:          body.payload ?? {},
    });

    if (error) {
        const res: Res = { ok: false, error: error.message };
        return new Response(JSON.stringify(res), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const res: Res = { ok: true, event_type: body.event_type };
    return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
