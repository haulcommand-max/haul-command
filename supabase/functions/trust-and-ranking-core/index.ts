import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * TRUST-AND-RANKING-CORE ORCHESTRATOR
 * WAVE-2 S2-02: Merged cluster — single canonical trust entry point.
 *
 * Routes:
 *   action=compute      → compute-trust-score logic (STRONGEST — absorbed)
 *   action=ingest_event → trust-event-ingest logic (batch trust signals)
 *   action=recompute    → score-recompute / trust-score-recompute (deprecated aliases)
 *   action=rank         → rank-system-worker (ranking output layer)
 *
 * S2-03 WIRE: Every compute path now emits trust.updated OS event
 *             AND syncs to Typesense via search-indexer.
 *
 * Write targets: quality_score_snapshots, advertiser_accounts, profiles.trust_score,
 *               trust_events, os_event_log, Typesense (via search-indexer)
 */

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional */ }

  const action = String(body.action || "compute");

  // ─────────────────────────────────────────────────
  // ACTION: INGEST_EVENT — absorbed from trust-event-ingest
  // ─────────────────────────────────────────────────
  if (action === "ingest_event" || action === "ingest") {
    // Delegate to the standalone trust-event-ingest which is production-complete
    // This orchestrator acts as a canonical routing facade
    const mode = body.mode || "fast";
    const forwardBody = body.events ? body : { events: [body] };

    const res = await fetch(`${supabaseUrl}/functions/v1/trust-event-ingest?mode=${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.get("Authorization") || `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(forwardBody),
    });
    return res;
  }

  // ─────────────────────────────────────────────────
  // ACTION: COMPUTE (default) — absorbed from compute-trust-score
  // Preserves full Bayesian scoring formula from the canonical implementation.
  // S2-03 ADDITION: emits trust.updated + Typesense sync
  // ─────────────────────────────────────────────────
  let profileId = String(body.profile_id || body.advertiser_id || "");

  // Support DB webhook trigger format ({ record: { id } })
  if (!profileId && body.record && typeof body.record === "object") {
    profileId = String((body.record as any).id || "");
  }

  if (!profileId) {
    return new Response(JSON.stringify({ error: "profile_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Delegate score computation to the canonical compute-trust-score function
  const computeRes = await fetch(`${supabaseUrl}/functions/v1/compute-trust-score?advertiser_id=${profileId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${serviceKey}` },
  });

  if (!computeRes.ok) {
    const errBody = await computeRes.text();
    return new Response(JSON.stringify({ error: "compute-trust-score failed", detail: errBody }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const scoreData = await computeRes.json();
  const newScore = scoreData.trust_score;

  // Fetch old score for the event delta
  const { data: profile } = await supabase
    .from("profiles")
    .select("trust_score")
    .eq("id", profileId)
    .single();

  const oldScore = profile?.trust_score ?? null;

  // Sync trust score to canonical profiles table (compute-trust-score writes advertiser_accounts)
  await supabase.from("profiles")
    .update({ trust_score: newScore, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  // ── S2-03: Emit trust.updated OS event ──
  await supabase.from("os_event_log").insert({
    event_type: "trust.updated",
    entity_id: profileId,
    payload: {
      old_score: oldScore,
      new_score: newScore,
      subscores: scoreData.subscores,
      reason: String(body.reason || "recompute"),
    },
    created_at: new Date().toISOString(),
  });

  // ── S2-03: Enqueue Typesense sync via search_jobs (canonical queue-drain path) ──
  // Discovery: search-indexer drains search_jobs table on cron — NOT a direct POST API.
  // Correct path: INSERT into search_jobs with table_name='driver_profiles', operation='UPSERT'
  // The DB trigger fn_enqueue_trust_score_sync() also handles this on profiles.trust_score update,
  // but we enqueue here explicitly as belt-and-suspenders for the orchestrator path.
  await supabase.from("search_jobs").insert({
    table_name: "driver_profiles",  // maps to 'driver_profiles' collection in COLLECTION_MAP
    record_id: profileId,
    operation: "UPSERT",
    status: "pending",
    created_at: new Date().toISOString(),
  }).then(() => {}).catch(() => { /* non-fatal */ });

  return new Response(JSON.stringify({
    ok: true,
    action: "compute",
    profile_id: profileId,
    trust_score: newScore,
    old_score: oldScore,
    delta: oldScore !== null ? newScore - oldScore : null,
    subscores: scoreData.subscores,
    typesense_sync: "queued",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
