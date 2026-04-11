import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * dispute-auto-resolve — 5-Tier Dispute Resolution Ladder
 *
 * Tier 1: Auto-resolve via GPS proof packet (< 4 hours)
 * Tier 2: Manual review queue (4-24 hours)
 * Tier 3: Escalate to senior ops (24-48 hours)
 * Tier 4: Human arbitrator (48-72 hours)
 * Tier 5: External arbitration / legal (72+ hours)
 *
 * This function is called by pg_cron every 15 minutes.
 * It processes all OPENED disputes whose escalate_at has passed.
 */

const TIER_ESCALATION_HOURS: Record<number, number> = {
  1: 4,    // Tier 1 → Tier 2 after 4 hours
  2: 24,   // Tier 2 → Tier 3 after 24 hours
  3: 48,   // Tier 3 → Tier 4 after 48 hours
  4: 72,   // Tier 4 → Tier 5 after 72 hours
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getServiceClient();
  const now = new Date();

  // ── Fetch disputes ready for processing ──
  const { data: disputes, error } = await supabase
    .from("disputes")
    .select("*, jobs:hc_jobs(*)")
    .eq("status", "OPENED")
    .lte("auto_escalate_at", now.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Also process new disputes (no escalate_at set yet = tier 1 first pass)
  const { data: newDisputes } = await supabase
    .from("disputes")
    .select("*, jobs:hc_jobs(*)")
    .eq("status", "OPENED")
    .is("auto_escalate_at", null)
    .eq("dispute_tier", 1);

  const allDisputes = [...(disputes || []), ...(newDisputes || [])];
  const results: any[] = [];

  for (const dispute of allDisputes) {
    const tier = dispute.dispute_tier || 1;

    try {
      if (tier === 1) {
        // ── TIER 1: Auto-resolve via GPS proof ──
        const result = await processTier1(supabase, dispute);
        results.push(result);
      } else if (tier <= 4) {
        // ── TIERS 2-4: Escalate to next tier ──
        const result = await escalateToNextTier(supabase, dispute, tier);
        results.push(result);
      } else {
        // ── TIER 5: External arbitration — just log, no auto action ──
        results.push({ id: dispute.id, action: "tier5_external_pending" });
      }
    } catch (err: any) {
      results.push({ id: dispute.id, error: err.message });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    processed: results.length,
    results,
  }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});

// ─────────────────────────────────────────────────────────────
// TIER 1: GPS Proof-Based Auto-Resolution
// ─────────────────────────────────────────────────────────────
async function processTier1(supabase: any, dispute: any) {
  const job = dispute.jobs;
  if (!job) {
    return escalateToNextTier(supabase, dispute, 1, "No job record linked to dispute");
  }

  // ── Generate or fetch proof packet ──
  // Call the proof generator RPC or inline the logic
  const { data: breadcrumbs } = await supabase
    .from("gps_breadcrumbs")
    .select("lat, lng, accuracy_m, recorded_at")
    .eq("job_id", job.id)
    .order("recorded_at", { ascending: true });

  const crumbs = breadcrumbs || [];

  // Compute coverage
  let durationMinutes = 0;
  if (crumbs.length >= 2) {
    const first = new Date(crumbs[0].recorded_at).getTime();
    const last = new Date(crumbs[crumbs.length - 1].recorded_at).getTime();
    durationMinutes = (last - first) / 60_000;
  }

  let coveragePct = 0;
  if (job.depart_at && job.arrive_at) {
    const expected = (new Date(job.arrive_at).getTime() - new Date(job.depart_at).getTime()) / 60_000;
    coveragePct = expected > 0 ? Math.min(100, (durationMinutes / expected) * 100) : 0;
  } else if (crumbs.length > 0) {
    coveragePct = Math.min(100, crumbs.length * 5);
  }

  // ── Decision logic ──
  if (coveragePct >= 70 && crumbs.length >= 5) {
    // OPERATOR WIN: Strong GPS evidence of presence
    const resolution = `Auto-resolved (Tier 1) in favor of operator. GPS proof: ${crumbs.length} breadcrumbs, ${coveragePct.toFixed(1)}% coverage, ${durationMinutes.toFixed(0)} minutes tracked.`;

    await supabase
      .from("disputes")
      .update({
        status: "RESOLVED",
        auto_resolved: true,
        resolution,
        resolved_at: new Date().toISOString(),
        dispute_tier: 1,
      })
      .eq("id", dispute.id);

    // Notify both parties
    await notifyParties(supabase, dispute, "resolved_operator_favor", resolution);

    return { id: dispute.id, status: "RESOLVED", favor: "operator", tier: 1 };

  } else if (crumbs.length === 0) {
    // BROKER WIN: Zero GPS evidence
    const resolution = `Auto-resolved (Tier 1) in favor of broker. No GPS breadcrumbs recorded for this job.`;

    await supabase
      .from("disputes")
      .update({
        status: "RESOLVED",
        auto_resolved: true,
        resolution,
        resolved_at: new Date().toISOString(),
        dispute_tier: 1,
      })
      .eq("id", dispute.id);

    await notifyParties(supabase, dispute, "resolved_broker_favor", resolution);

    return { id: dispute.id, status: "RESOLVED", favor: "broker", tier: 1 };

  } else {
    // INCONCLUSIVE: Escalate to Tier 2
    return escalateToNextTier(supabase, dispute, 1, `Inconclusive GPS evidence: ${crumbs.length} breadcrumbs, ${coveragePct.toFixed(1)}% coverage`);
  }
}

// ─────────────────────────────────────────────────────────────
// ESCALATION: Move dispute to next tier
// ─────────────────────────────────────────────────────────────
async function escalateToNextTier(supabase: any, dispute: any, currentTier: number, reason?: string) {
  const nextTier = currentTier + 1;
  const escalationHours = TIER_ESCALATION_HOURS[nextTier] || 168; // default 7 days

  const nextEscalateAt = new Date(Date.now() + escalationHours * 3600_000).toISOString();
  const escalationReason = reason || `Auto-escalated from Tier ${currentTier} after timeout`;

  await supabase
    .from("disputes")
    .update({
      dispute_tier: nextTier,
      auto_escalate_at: nextEscalateAt,
      escalation_reason: escalationReason,
    })
    .eq("id", dispute.id);

  // Notify internal ops about the escalation
  await supabase.from("notification_events").insert({
    user_id: null, // system notification → ops team
    type: "DISPUTE_ESCALATED",
    title: `Dispute escalated to Tier ${nextTier}`,
    body: `Dispute ${dispute.id} escalated: ${escalationReason}`,
    data: {
      dispute_id: dispute.id,
      job_id: dispute.job_id,
      from_tier: currentTier,
      to_tier: nextTier,
    },
  });

  return { id: dispute.id, action: `escalated_to_tier_${nextTier}`, reason: escalationReason };
}

// ─────────────────────────────────────────────────────────────
// NOTIFY: Send notifications to both broker and operator
// ─────────────────────────────────────────────────────────────
async function notifyParties(supabase: any, dispute: any, type: string, resolution: string) {
  const parties = [dispute.broker_id, dispute.driver_id].filter(Boolean);

  for (const userId of parties) {
    await supabase.from("notification_events").insert({
      user_id: userId,
      type: "DISPUTE_RESOLVED",
      title: "Dispute Resolved",
      body: resolution.slice(0, 200),
      data: {
        dispute_id: dispute.id,
        resolution_type: type,
        job_id: dispute.job_id,
      },
    });
  }
}
