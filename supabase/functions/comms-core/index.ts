import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * COMMS-CORE ORCHESTRATOR
 * WAVE-8 S8-01: Canonical communications orchestrator.
 *
 * Absorbs: fcm-push-worker, email-worker, email-send, push-send, push-admin
 * Routes by channel: push > email > sms (cost-ordered per Master Prompt)
 *
 * Actions:
 *   action=push              → FCM push via hc_notifications queue
 *   action=email             → Email via Resend
 *   action=flush             → Drain hc_notifications queued items → FCM
 *   action=preference_check  → Respect per-user quiet hours + dedupe
 *
 * Hard rule: SMS only when explicitly action=sms AND reason is provided.
 */

const QUIET_HOURS_START = 22; // 10pm local
const QUIET_HOURS_END = 7;    // 7am local
const DEDUP_WINDOW_MINUTES = 30;

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
  try { body = await req.json(); } catch { /* optional */ }
  const action = String(body.action || "flush");

  // ─────────────────────────────────────────────────
  // FLUSH — drain hc_notifications → FCM (existing canonical worker path)
  // ─────────────────────────────────────────────────
  if (action === "flush" || action === "push_flush") {
    const res = await fetch(`${supabaseUrl}/functions/v1/fcm-push-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ trigger: body.trigger || "comms_core_flush" }),
    });
    const result = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: res.ok, action: "flush", ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // PUSH — queue a targeted push notification (with dedup check)
  // ─────────────────────────────────────────────────
  if (action === "push") {
    const userId = body.user_id as string;
    const title = body.title as string;
    const pushBody = body.body as string;
    const dataJson = body.data as Record<string, unknown> | undefined;
    const urgency = String(body.urgency || "normal"); // 'urgent' overrides quiet hours

    if (!userId || !title || !pushBody) {
      return new Response(JSON.stringify({ error: "user_id, title, body required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedup check: same user + same title in last DEDUP_WINDOW_MINUTES
    if (urgency !== "urgent") {
      const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("hc_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("title", title)
        .gte("created_at", dedupCutoff);

      if ((count ?? 0) > 0) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: "dedup_window" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check user push preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("push_enabled, quiet_hours_enabled, timezone")
      .eq("user_id", userId)
      .single();

    if (prefs?.push_enabled === false && urgency !== "urgent") {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "push_disabled_by_user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Quiet hours check
    if (urgency !== "urgent" && prefs?.quiet_hours_enabled) {
      const tz = prefs.timezone || "UTC";
      const localHour = new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false });
      const hour = parseInt(localHour);
      const inQuietHours = hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;

      if (inQuietHours) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: "quiet_hours" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Queue notification
    const { error } = await supabase.from("hc_notifications").insert({
      user_id: userId,
      title,
      body: pushBody,
      data_json: { ...dataJson, urgency },
      channel: "push",
      status: "queued",
      created_at: now,
    });

    if (!error && urgency === "urgent") {
      // Urgent: flush immediately
      await fetch(`${supabaseUrl}/functions/v1/fcm-push-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
        body: JSON.stringify({ trigger: "urgent_flush", user_id: userId }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: !error, action: "push", queued: !error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // EMAIL — send transactional email via Resend
  // ─────────────────────────────────────────────────
  if (action === "email") {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("[comms-core] RESEND_API_KEY not set — email skipped");
      return new Response(JSON.stringify({ ok: false, skipped: true, reason: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const to = body.to as string;
    const subject = body.subject as string;
    const html = body.html as string;
    const fromName = String(body.from_name || "Haul Command");

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "to, subject, html required" }), { status: 400 });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <noreply@haulcommand.com>`,
        to: [to],
        subject,
        html,
      }),
    });

    const emailResult = await emailRes.json().catch(() => ({}));

    await supabase.from("os_event_log").insert({
      event_type: "comms.email_sent",
      payload: { to, subject, status: emailRes.status },
      created_at: now,
    });

    return new Response(JSON.stringify({ ok: emailRes.ok, action: "email", result: emailResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // SMS — transactional SMS text routing 
  // Primary: Telnyx (30% cheaper)
  // Fallback: Twilio
  // ─────────────────────────────────────────────────
  if (action === "sms") {
    const to = body.to as string;
    const smsBody = body.body as string;
    const reason = body.reason as string;

    if (!to || !smsBody || !reason) {
      return new Response(JSON.stringify({ error: "to, body, reason required for SMS" }), { status: 400 });
    }

    const telnyxKey = Deno.env.get("TELNYX_API_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("SMS_FROM_NUMBER") || "+18005550199";

    let ok = false;
    let provider = "none";
    let providerResp = null;

    // Phase 1: Telnyx First (Cheaper)
    if (telnyxKey) {
      provider = "telnyx";
      try {
        const res = await fetch("https://api.telnyx.com/v2/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${telnyxKey}`
          },
          body: JSON.stringify({
            from: fromNumber,
            to: to,
            text: smsBody
          })
        });
        ok = res.ok;
        providerResp = await res.json().catch(() => ({}));
      } catch (e) {
        ok = false;
      }
    }

    // Phase 2: Twilio Fallback
    if (!ok && twilioSid && twilioAuth) {
      provider = "twilio_fallback";
      try {
        const params = new URLSearchParams();
        params.append("To", to);
        params.append("From", fromNumber);
        params.append("Body", smsBody);

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(`${twilioSid}:${twilioAuth}`)
          },
          body: params.toString()
        });
        ok = res.ok;
        providerResp = await res.json().catch(() => ({}));
      } catch (e) {
        ok = false;
      }
    }

    await supabase.from("os_event_log").insert({
      event_type: "comms.sms_sent",
      payload: { to, reason, provider, success: ok },
      created_at: now,
    });

    return new Response(JSON.stringify({ ok, action: "sms", provider, payload: providerResp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: `Unknown action: ${action}. Valid: flush, push, email, sms` }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
