import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

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

  // Fetch current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("kyc_level, fraud_score")
    .eq("id", driver_id)
    .single();

  if (!profile || profile.kyc_level >= 2) {
    // Already KYC L2+ or profile not found — no action needed
    return new Response(JSON.stringify({ ok: true, stepUpTriggered: false, reason: "already_l2_or_missing" }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  // ── Signal 1: High-value job (>$500) ──
  if (rate_cents > 50000) {
    stepUpReasons.push("high_value_job");
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

