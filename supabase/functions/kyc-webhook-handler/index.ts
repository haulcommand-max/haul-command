import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * KYC-WEBHOOK-HANDLER — Stripe Identity + Persona webhook target
 * WAVE-8 S8-02: Production KYC webhook processor.
 *
 * Handles:
 *   - Stripe Identity: identity.verification_session.verified / requires_input / cancelled
 *   - Persona: inquiry.completed / inquiry.failed / inquiry.expired
 *
 * On pass: upgrades profiles.kyc_tier, closes kyc_verification_sessions, emits OS event
 * On fail: logs failure, enqueues KYC step-up push notification
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
  const now = new Date().toISOString();

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const eventType = body.type as string;
  const provider = body._provider as string || "stripe_identity"; // injected by caller

  // ── STRIPE IDENTITY WEBHOOK ──────────────────────
  if (provider === "stripe_identity" || eventType?.startsWith("identity.")) {
    const session = (body.data as any)?.object;
    const sessionId = session?.id;
    const status = session?.status; // 'verified', 'requires_input', 'cancelled'

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "No session id in payload" }), { status: 400 });
    }

    // Lookup our internal record by provider_session_id
    const { data: kycSession } = await supabase
      .from("kyc_verification_sessions")
      .select("id, profile_id, tier_requested, status")
      .eq("provider", "stripe_identity")
      .eq("provider_session_id", sessionId)
      .single();

    if (!kycSession) {
      // Unknown session — log and acknowledge
      console.warn("[kyc-webhook] Unknown stripe identity session:", sessionId);
      return new Response(JSON.stringify({ received: true, unknown_session: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "verified") {
      const tierGranted = kycSession.tier_requested;

      // Update KYC session
      await supabase.from("kyc_verification_sessions").update({
        status: "passed",
        tier_granted: tierGranted,
        passed_at: now,
        webhook_payload: body,
        updated_at: now,
      }).eq("id", kycSession.id);

      // Upgrade profile KYC tier
      await supabase.from("profiles").update({
        kyc_tier: tierGranted,
        updated_at: now,
      }).eq("id", kycSession.profile_id);

      // Emit OS event
      await supabase.from("os_event_log").insert({
        event_type: "kyc.verified",
        entity_id: kycSession.profile_id,
        entity_type: "profile",
        payload: { tier_granted: tierGranted, provider: "stripe_identity", session_id: sessionId },
        created_at: now,
      });

      // Push success notification
      await supabase.from("hc_notifications").insert({
        user_id: kycSession.profile_id,
        title: "✅ Identity Verified",
        body: `KYC Level ${tierGranted} approved. You can now access higher-value loads.`,
        data_json: { type: "kyc_passed", deep_link: "haulcommand://settings/verification", tier: tierGranted },
        channel: "push",
        status: "queued",
        created_at: now,
      });

      // Trigger trust recompute (KYC tier is a compliance signal)
      await fetch(`${supabaseUrl}/functions/v1/trust-and-ranking-core`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify({ action: "compute", profile_id: kycSession.profile_id, reason: "kyc_verified" }),
      }).catch(() => {});

    } else if (status === "requires_input" || status === "cancelled") {
      await supabase.from("kyc_verification_sessions").update({
        status: "failed",
        failure_reason: status,
        failed_at: now,
        webhook_payload: body,
        updated_at: now,
      }).eq("id", kycSession.id);

      await supabase.from("os_event_log").insert({
        event_type: "kyc.failed",
        entity_id: kycSession.profile_id,
        entity_type: "profile",
        payload: { reason: status, session_id: sessionId },
        created_at: now,
      });

      await supabase.from("hc_notifications").insert({
        user_id: kycSession.profile_id,
        title: "⚠️ Verification Incomplete",
        body: "Your identity check needs additional information. Tap to retry.",
        data_json: { type: "kyc_failed", deep_link: "haulcommand://settings/verification" },
        channel: "push",
        status: "queued",
        created_at: now,
      });
    }

    return new Response(JSON.stringify({ received: true, event_type: eventType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── PERSONA WEBHOOK ──────────────────────────────
  if (provider === "persona" || eventType?.startsWith("inquiry.")) {
    const inquiry = (body.data as any)?.attributes;
    const inquiryId = (body.data as any)?.id;
    const personaStatus = inquiry?.status; // 'completed', 'failed', 'expired'

    if (!inquiryId) {
      return new Response(JSON.stringify({ error: "No inquiry id" }), { status: 400 });
    }

    const { data: kycSession } = await supabase
      .from("kyc_verification_sessions")
      .select("id, profile_id, tier_requested")
      .eq("provider", "persona")
      .eq("provider_session_id", inquiryId)
      .single();

    if (!kycSession) {
      return new Response(JSON.stringify({ received: true, unknown_inquiry: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passed = personaStatus === "completed";
    await supabase.from("kyc_verification_sessions").update({
      status: passed ? "passed" : "failed",
      tier_granted: passed ? kycSession.tier_requested : null,
      passed_at: passed ? now : null,
      failed_at: !passed ? now : null,
      webhook_payload: body,
      updated_at: now,
    }).eq("id", kycSession.id);

    if (passed) {
      await supabase.from("profiles").update({
        kyc_tier: kycSession.tier_requested,
        updated_at: now,
      }).eq("id", kycSession.profile_id);

      await supabase.from("os_event_log").insert({
        event_type: "kyc.verified",
        entity_id: kycSession.profile_id,
        entity_type: "profile",
        payload: { provider: "persona", inquiry_id: inquiryId },
        created_at: now,
      });
    }

    return new Response(JSON.stringify({ received: true, passed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true, unhandled_event: eventType }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
