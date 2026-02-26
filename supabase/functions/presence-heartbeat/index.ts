/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve calling user from JWT
    const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* optional body */ }

    const escort_id = user.id;
    const now = new Date().toISOString();

    // Build upsert payload — only include provided fields
    const payload: Record<string, unknown> = {
        escort_id,
        last_heartbeat_at: now,
        updated_at: now,
    };

    if (body.lat !== undefined && body.lng !== undefined) {
        payload.last_lat = Number(body.lat);
        payload.last_lng = Number(body.lng);
    }
    if (body.speed_mph !== undefined) payload.last_speed_mph = Number(body.speed_mph);
    if (body.heading !== undefined) payload.last_heading = Number(body.heading);
    if (body.accuracy_m !== undefined) payload.location_accuracy_m = Number(body.accuracy_m);
    if (body.battery_pct !== undefined) {
        const pct = Math.min(100, Math.max(0, Number(body.battery_pct)));
        payload.battery_pct = pct;
    }
    if (body.network_quality !== undefined) {
        const nq = String(body.network_quality);
        if (["unknown", "poor", "ok", "good"].includes(nq)) payload.network_quality = nq;
    }
    if (body.status !== undefined) {
        const s = String(body.status);
        if (["offline", "online", "available", "busy", "resting", "do_not_disturb"].includes(s)) {
            payload.status = s;
        }
    }
    if (body.push_token !== undefined) payload.push_token = String(body.push_token);
    if (body.device_platform !== undefined) {
        const dp = String(body.device_platform);
        if (["ios", "android", "web"].includes(dp)) payload.device_platform = dp;
    }

    const { error: upsertErr } = await supabase
        .from("escort_presence")
        .upsert(payload, { onConflict: "escort_id" });

    if (upsertErr) {
        return new Response(JSON.stringify({ error: upsertErr.message, code: upsertErr.code }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ── BLOCKER #2 FIX: Wire escort_heartbeat into availability truth system ──
    const statusForAvail = (body.status as string) ?? 'available';
    const availStatus = ['available', 'busy', 'offline', 'online'].includes(statusForAvail)
        ? (statusForAvail === 'online' ? 'available' : statusForAvail)
        : 'available';

    await supabase.rpc('escort_heartbeat', {
        p_escort_id: escort_id,
        p_status: availStatus,
    }).catch(() => { /* non-fatal */ });

    // ── Wire data spine: ingest heartbeat event ──
    await supabase.rpc('ingest_event', {
        p_event_type: 'escort_heartbeat',
        p_actor_id: escort_id,
        p_payload: {
            status: availStatus,
            lat: payload.last_lat ?? null,
            lng: payload.last_lng ?? null,
            battery_pct: payload.battery_pct ?? null,
        },
        p_corridor_id: null,
    }).catch(() => { /* non-fatal */ });

    return new Response(JSON.stringify({ ok: true, heartbeat_at: now, escort_id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});
