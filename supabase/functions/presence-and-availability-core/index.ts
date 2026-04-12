import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * PRESENCE-AND-AVAILABILITY-CORE ORCHESTRATOR
 * WAVE-2 S2-01: Merged cluster — single entry point for all presence operations.
 *
 * Routes:
 *   action=heartbeat  → presence-heartbeat logic (STRONGEST — absorbed)
 *   action=toggle     → availability-toggle logic
 *   action=ping       → lightweight availability-ping
 *   action=timeout    → presence-timeout-offline (cron path)
 *
 * Emits OS event: presence.online / presence.offline
 * Write targets: escort_presence, profiles.availability_status, OS event log
 */

const VALID_STATUSES = ["offline", "online", "available", "busy", "resting", "do_not_disturb"] as const;
type PresenceStatus = typeof VALID_STATUSES[number];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();

  // Resolve calling user from JWT
  const { createClient } = await import("npm:@supabase/supabase-js@2");
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
  try { body = await req.json(); } catch { /* optional */ }

  const action = String(body.action || "heartbeat");
  const profileId = user.id;
  const now = new Date().toISOString();

  // ─────────────────────────────────────────────────
  // ACTION: TIMEOUT (cron path — offline sweep)
  // Replaces: presence-timeout-offline + availability-truth-tick
  // ─────────────────────────────────────────────────
  if (action === "timeout") {
    const cutoffMinutes = Number(body.cutoff_minutes || 5);
    const cutoff = new Date(Date.now() - cutoffMinutes * 60 * 1000).toISOString();

    const { data: stale, error } = await supabase
      .from("escort_presence")
      .update({ status: "offline", updated_at: now })
      .lt("last_heartbeat_at", cutoff)
      .neq("status", "offline")
      .select("escort_id");

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Emit presence.offline for each timed-out user
    const offlineIds = (stale || []).map((r: any) => r.escort_id);
    if (offlineIds.length > 0) {
      await supabase.from("os_event_log").insert(
        offlineIds.map((id: string) => ({
          event_type: "presence.offline",
          entity_id: id,
          payload: { reason: "timeout", cutoff_minutes: cutoffMinutes },
          created_at: now,
        }))
      );
    }

    return new Response(JSON.stringify({ ok: true, action: "timeout", swept: offlineIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // ACTION: TOGGLE — explicit availability change
  // Replaces: availability-toggle
  // ─────────────────────────────────────────────────
  if (action === "toggle") {
    const newStatus = String(body.status || "available") as PresenceStatus;
    if (!VALID_STATUSES.includes(newStatus)) {
      return new Response(JSON.stringify({ error: `Invalid status: ${newStatus}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("escort_presence")
      .upsert({ escort_id: profileId, status: newStatus, updated_at: now }, { onConflict: "escort_id" });

    await supabase.from("profiles")
      .update({ availability_status: newStatus, updated_at: now })
      .eq("id", profileId);

    // Emit OS event
    const osEvent = newStatus === "offline" ? "presence.offline" : "presence.online";
    await supabase.from("os_event_log").insert({
      event_type: osEvent,
      entity_id: profileId,
      payload: { status: newStatus, source: "toggle" },
      created_at: now,
    });

    return new Response(JSON.stringify({ ok: true, action: "toggle", status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // ACTION: PING — lightweight poll (replaces availability-ping)
  // ─────────────────────────────────────────────────
  if (action === "ping") {
    const { data: presence } = await supabase
      .from("escort_presence")
      .select("status, last_heartbeat_at, last_lat, last_lng")
      .eq("escort_id", profileId)
      .single();

    return new Response(JSON.stringify({ ok: true, action: "ping", presence }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // ACTION: HEARTBEAT (default) — absorbed from presence-heartbeat
  // STRONGEST implementation — retained verbatim with OS event addition
  // ─────────────────────────────────────────────────
  const payload: Record<string, unknown> = {
    escort_id: profileId,
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
    payload.battery_pct = Math.min(100, Math.max(0, Number(body.battery_pct)));
  }
  if (body.network_quality !== undefined) {
    const nq = String(body.network_quality);
    if (["unknown", "poor", "ok", "good"].includes(nq)) payload.network_quality = nq;
  }
  if (body.status !== undefined) {
    const s = String(body.status);
    if (VALID_STATUSES.includes(s as PresenceStatus)) payload.status = s;
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
    return new Response(JSON.stringify({ error: upsertErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Wire into availability truth system (from original presence-heartbeat)
  const statusForAvail = (body.status as string) ?? "available";
  const availStatus = ["available", "busy", "offline", "online"].includes(statusForAvail)
    ? (statusForAvail === "online" ? "available" : statusForAvail)
    : "available";

  await supabase.rpc("escort_heartbeat", {
    p_escort_id: profileId,
    p_status: availStatus,
  }).catch(() => { /* non-fatal */ });

  await supabase.rpc("ingest_event", {
    p_event_type: "escort_heartbeat",
    p_actor_id: profileId,
    p_payload: {
      status: availStatus,
      lat: payload.last_lat ?? null,
      lng: payload.last_lng ?? null,
      battery_pct: payload.battery_pct ?? null,
    },
    p_corridor_id: null,
  }).catch(() => { /* non-fatal */ });

  // S2-01 ADDITION: Emit presence.online OS event for route-matcher-agent consumption
  await supabase.from("os_event_log").insert({
    event_type: "presence.online",
    entity_id: profileId,
    payload: {
      lat: payload.last_lat ?? null,
      lng: payload.last_lng ?? null,
      status: availStatus,
    },
    created_at: now,
  }).catch(() => { /* non-fatal — don't break heartbeat on event log failure */ });

  return new Response(JSON.stringify({ ok: true, action: "heartbeat", heartbeat_at: now, escort_id: profileId }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
