import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

// Canonical KYC tier thresholds per Opus OPUS-02 guardrails
export const KYC_TIER_THRESHOLDS = {
  TIER_0_BROWSE:     { min_tier: 0, label: 'Browse Only' },
  TIER_1_TRANSACT:   { min_tier: 1, label: 'Bid on Loads',   lifetime_usd: 500 },
  TIER_2_ESCROW:     { min_tier: 2, label: 'Post Loads',     lifetime_usd: 5_000 },
  TIER_3_ENTERPRISE: { min_tier: 3, label: 'Instant Payouts', lifetime_usd: 50_000 },
};

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: string; // job id
    driver_id: string;
    broker_id: string;
    rate_cents: number;
    status: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();
  const payload: WebhookPayload = await req.json().catch(() => null);

  if (!payload || !payload.record) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 400
    });
  }

  const { driver_id, rate_cents } = payload.record;
  const stepUpReasons: string[] = [];

  // Fetch current profile — use kyc_tier (canonical) with kyc_level as fallback
  const { data: profile } = await supabase
    .from("profiles")
    .select("kyc_tier, kyc_level, fraud_score, lifetime_volume_usd")
    .eq("id", driver_id)
    .single();

  // Resolve canonical tier: prefer kyc_tier, fall back to kyc_level
  const currentTier = profile?.kyc_tier ?? profile?.kyc_level ?? 0;

  if (!profile || currentTier >= 2) {
    // Already KYC Tier 2+ or profile not found — no action needed
    return new Response(JSON.stringify({ ok: true, stepUpTriggered: false, reason: "already_tier2_or_missing" }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  // Auto-upgrade tier based on lifetime volume
  const lifetimeUsd = profile.lifetime_volume_usd ?? 0;
  let requiredTier = 0;
  if (lifetimeUsd >= KYC_TIER_THRESHOLDS.TIER_3_ENTERPRISE.lifetime_usd!) requiredTier = 3;
  else if (lifetimeUsd >= KYC_TIER_THRESHOLDS.TIER_2_ESCROW.lifetime_usd!) requiredTier = 2;
  else if (lifetimeUsd >= KYC_TIER_THRESHOLDS.TIER_1_TRANSACT.lifetime_usd!) requiredTier = 1;

  if (requiredTier > currentTier) {
    await supabase.from('profiles').update({ kyc_tier: requiredTier }).eq('id', driver_id);
  }

  // ── Signal 1: High-value job tier thresholds (Opus OPUS-02) ──
  if (rate_cents > 5_000_00) {          // > $5,000 → requires Tier 2
    stepUpReasons.push("high_value_job_tier2");
  } else if (rate_cents > 50_000) {    // > $500 → requires Tier 1
    stepUpReasons.push("high_value_job_tier1");
  }

  // ── Signal 2: Elevated fraud score (>=50) ──
  if ((profile.fraud_score ?? 0) >= 50) {
    stepUpReasons.push("elevated_fraud_score");
  }

  // ── Signal 3: Repeated payment failures (>=3 in 30 days) ──
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { count: paymentFailures } = await supabase
    .from("trust_events")
    .select("id", { count: "exact", head: true })
    .eq("entity_profile_id", driver_id)
    .in("event_type", ["payment_decline", "preauth_failed", "payout_failed"])
    .gte("occurred_at", thirtyDaysAgo);

  if ((paymentFailures ?? 0) >= 3) {
    stepUpReasons.push("repeated_payment_failures");
  }

  // If any signal triggered, dispatch step-up notification
  if (stepUpReasons.length > 0) {
    await supabase.from("notification_events").insert({
      user_id: driver_id,
      type: "KYC_STEP_UP_REQUIRED",
      title: "KYC Verification Upgrade Required",
      body: stepUpReasons.includes("high_value_job")
        ? "This job's value requires KYC Level 2. Please upload additional documentation."
        : stepUpReasons.includes("elevated_fraud_score")
        ? "Your account requires additional verification. Please complete KYC Level 2."
        : "Multiple payment issues detected. Please verify your identity to continue.",
      data: {
        job_id: payload.record.id,
        required_level: 2,
        reasons: stepUpReasons,
      }
    });
    
    return new Response(JSON.stringify({ ok: true, stepUpTriggered: true, reasons: stepUpReasons }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, stepUpTriggered: false }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});

