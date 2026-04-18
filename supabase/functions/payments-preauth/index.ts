import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * payments-preauth — Create a Stripe PaymentIntent with manual capture
 *
 * Body: { job_id, amount_cents, currency?, broker_user_id }
 * Returns: { status, client_secret, payment_intent_id }
 *
 * Idempotency: Uses job_id + broker_user_id as the Stripe idempotency key.
 * If a PaymentIntent already exists for this job, returns the existing one.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getServiceClient();
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const { job_id, amount_cents, currency, broker_user_id } = await req.json();

    if (!job_id || !amount_cents) {
      return new Response(JSON.stringify({ error: "job_id and amount_cents required" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Check if pre-auth already exists for this job (idempotent) ──
    const { data: existingJob } = await supabase
      .from("hc_jobs")
      .select("stripe_payment_intent_id, preauth_status")
      .eq("id", job_id)
      .single();

    if (existingJob?.stripe_payment_intent_id && existingJob.preauth_status === "authorized") {
      return new Response(JSON.stringify({
        status: "already_authorized",
        payment_intent_id: existingJob.stripe_payment_intent_id,
        client_secret: null, // already confirmed
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── Demo mode: no Stripe key configured ──
    if (!stripeSecretKey) {
      console.warn("[payments-preauth] No STRIPE_SECRET_KEY — demo mode");
      await supabase
        .from("hc_jobs")
        .update({
          preauth_status: "authorized",
          preauth_amount_cents: amount_cents,
          preauth_idempotency_key: `preauth_${job_id}_demo`,
        })
        .eq("id", job_id);

      return new Response(JSON.stringify({
        status: "demo_authorized",
        payment_intent_id: null,
        client_secret: null,
        demo_mode: true,
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── Create Stripe PaymentIntent with manual capture ──
    const idempotencyKey = `preauth_${job_id}_${broker_user_id || "system"}`;

    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: new URLSearchParams({
        "amount": String(amount_cents),
        "currency": (currency || "usd").toLowerCase(),
        "capture_method": "manual",
        "metadata[job_id]": job_id,
        "metadata[broker_user_id]": broker_user_id || "",
        "metadata[platform]": "haul_command",
        "description": `Pre-authorization for Haul Command job ${job_id}`,
      }),
    });

    const intent = await stripeRes.json();

    if (intent.error) {
      // Pre-auth failed — record the failure
      await supabase
        .from("hc_jobs")
        .update({ preauth_status: "failed" })
        .eq("id", job_id);

      await supabase.from("trust_events").insert({
        entity_profile_id: broker_user_id,
        event_type: "preauth_failed",
        payload: { job_id, error: intent.error.message },
        occurred_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({
        status: "failed",
        error: intent.error.message,
      }), {
        status: 402,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ── Store the PaymentIntent on the job ──
    await supabase
      .from("hc_jobs")
      .update({
        stripe_payment_intent_id: intent.id,
        preauth_status: "pending",
        preauth_amount_cents: amount_cents,
        preauth_idempotency_key: idempotencyKey,
      })
      .eq("id", job_id);

    await supabase.from("event_log").insert({
      actor_profile_id: broker_user_id,
      actor_role: "broker",
      event_type: "payment.preauth_created",
      entity_type: "hc_jobs",
      entity_id: job_id,
      payload: { payment_intent_id: intent.id, amount_cents, currency: currency || "usd" },
    });

    return new Response(JSON.stringify({
      status: "preauth_created",
      payment_intent_id: intent.id,
      client_secret: intent.client_secret,
    }), { headers: { ...corsHeaders, "content-type": "application/json" } });

  } catch (error: any) {
    console.error("[payments-preauth] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
