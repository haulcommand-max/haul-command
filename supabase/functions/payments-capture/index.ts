import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * payments-capture — Capture a previously authorized Stripe PaymentIntent
 *
 * Body: { job_id, capture_amount_cents? }
 * Returns: { status, payment_intent_id }
 *
 * Idempotency: Uses a capture-specific idempotency key.
 * If the intent is already captured, Stripe returns the same result (safe).
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getServiceClient();
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  try {
    const { job_id, capture_amount_cents } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Look up the job's PaymentIntent ──
    const { data: job, error: jobErr } = await supabase
      .from("hc_jobs")
      .select("stripe_payment_intent_id, preauth_status, preauth_amount_cents, preauth_idempotency_key")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Already captured — idempotent return ──
    if (job.preauth_status === "captured") {
      return new Response(JSON.stringify({
        status: "already_captured",
        payment_intent_id: job.stripe_payment_intent_id,
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── Demo mode ──
    if (!stripeSecretKey || !job.stripe_payment_intent_id) {
      await supabase
        .from("hc_jobs")
        .update({ preauth_status: "captured" })
        .eq("id", job_id);

      return new Response(JSON.stringify({
        status: "demo_captured",
        payment_intent_id: job.stripe_payment_intent_id,
        demo_mode: true,
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── Capture via Stripe API ──
    const captureIdempotencyKey = `capture_${job_id}_${Date.now()}`;
    const captureParams: Record<string, string> = {};

    // Partial capture: if capture_amount_cents is less than pre-auth amount
    if (capture_amount_cents && capture_amount_cents < (job.preauth_amount_cents || 0)) {
      captureParams["amount_to_capture"] = String(capture_amount_cents);
    }

    const stripeRes = await fetch(
      `https://api.stripe.com/v1/payment_intents/${job.stripe_payment_intent_id}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": captureIdempotencyKey,
        },
        body: new URLSearchParams(captureParams),
      }
    );

    const result = await stripeRes.json();

    if (result.error) {
      await supabase
        .from("hc_jobs")
        .update({ preauth_status: "failed" })
        .eq("id", job_id);

      return new Response(JSON.stringify({
        status: "capture_failed",
        error: result.error.message,
      }), {
        status: 402,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Update job record ──
    await supabase
      .from("hc_jobs")
      .update({ preauth_status: "captured" })
      .eq("id", job_id);

    await supabase.from("event_log").insert({
      actor_profile_id: null,
      actor_role: "system",
      event_type: "payment.captured",
      entity_type: "hc_jobs",
      entity_id: job_id,
      payload: {
        payment_intent_id: job.stripe_payment_intent_id,
        amount_captured: result.amount_received || result.amount,
        currency: result.currency,
      },
    });

    return new Response(JSON.stringify({
      status: "captured",
      payment_intent_id: job.stripe_payment_intent_id,
      amount_captured: result.amount_received || result.amount,
    }), { headers: { ...corsHeaders, "content-type": "application/json" } });

  } catch (error: any) {
    console.error("[payments-capture] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
