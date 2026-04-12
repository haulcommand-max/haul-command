import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * CLAIM-GROWTH-CORE ORCHESTRATOR
 * WAVE-5 S5-01: Single entry point for all claim + growth lifecycle actions.
 *
 * Actions:
 *   action=claim_pressure    → Identify unclaimed profiles + emit FOMO push/OS event
 *   action=claim_initiate    → Start a claim workflow for a profile
 *   action=claim_verify      → Process claim verification token
 *   action=onboard_nudge     → Push next-step completion prompts to partially onboarded users
 *   action=reactivate        → Identify dormant operators (30d inactive) and push reactivation
 *
 * Write targets: claimed_profiles, os_event_log, hc_notifications, profiles.is_claimed
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
  try { body = await req.json(); } catch { /* optional */ }
  const action = String(body.action || "claim_pressure");

  // ─────────────────────────────────────────────────
  // CLAIM_PRESSURE — run nightly to identify unclaimed value
  // ─────────────────────────────────────────────────
  if (action === "claim_pressure") {
    const countryIso = body.country_iso as string | undefined;

    let query = supabase
      .from("profiles")
      .select("id, display_name, city_slug, region_code, country_iso, trust_score")
      .eq("is_claimed", false)
      .eq("is_seeded", true)
      .gte("trust_score", 30) // only seed profiles with meaningful trust
      .limit(100);

    if (countryIso) query = query.eq("country_iso", countryIso);

    const { data: unclaimed } = await query;
    if (!unclaimed || unclaimed.length === 0) {
      return new Response(JSON.stringify({ ok: true, action, pressure_sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log claim pressure OS event with counts per region
    const byRegion: Record<string, number> = {};
    for (const p of unclaimed) {
      const key = `${p.country_iso}:${p.region_code || "unknown"}`;
      byRegion[key] = (byRegion[key] || 0) + 1;
    }

    await supabase.from("os_event_log").insert({
      event_type: "growth.claim_pressure_identified",
      payload: { total_unclaimed: unclaimed.length, by_region: byRegion },
      created_at: now,
    });

    // Insert into claim_pressure_queue for the UI FOMO banner
    await supabase.from("claim_pressure_queue").upsert(
      unclaimed.map((p: any) => ({
        profile_id: p.id,
        country_iso: p.country_iso,
        region_code: p.region_code,
        last_pressure_at: now,
        trust_score: p.trust_score,
      })),
      { onConflict: "profile_id" }
    ).catch(() => {});

    return new Response(JSON.stringify({
      ok: true, action, pressure_identified: unclaimed.length, by_region: byRegion,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ─────────────────────────────────────────────────
  // ONBOARD_NUDGE — push completion prompts to partial profiles
  // ─────────────────────────────────────────────────
  if (action === "onboard_nudge") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    // Find profiles: claimed but incomplete (missing insurance, TWIC, or push_token)
    const { data: partials } = await supabase
      .from("profiles")
      .select("id, display_name, insurance_status, kyc_tier, push_token")
      .eq("is_claimed", true)
      .lt("created_at", sevenDaysAgo) // at least 7 days old
      .or("insurance_status.eq.unverified,kyc_tier.eq.0,push_token.is.null")
      .limit(100);

    if (!partials || partials.length === 0) {
      return new Response(JSON.stringify({ ok: true, action, nudges_sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nudges = partials.map((p: any) => {
      let title = "⚡ Complete Your Haul Command Profile";
      let nudgeBody = "Operators with complete profiles get 3x more load matches.";

      if (p.insurance_status !== "verified") {
        nudgeBody = "Add your insurance certificate to unlock more load opportunities.";
      } else if (p.kyc_tier < 1) {
        nudgeBody = "Verify your identity (KYC Level 1) to bid on loads over $500.";
      } else if (!p.push_token) {
        nudgeBody = "Enable push notifications so you never miss a nearby load match.";
      }

      return {
        user_id: p.id,
        title,
        body: nudgeBody,
        data_json: { type: "onboard_nudge", deep_link: "haulcommand://settings/profile" },
        channel: "push",
        status: "queued",
        created_at: now,
      };
    });

    await supabase.from("hc_notifications").insert(nudges);

    // Flush FCM
    await fetch(`${supabaseUrl}/functions/v1/fcm-push-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ trigger: "onboard_nudge_flush" }),
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, action, nudges_sent: nudges.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // REACTIVATE — 30-day dormant operator re-engagement
  // ─────────────────────────────────────────────────
  if (action === "reactivate") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const { data: dormant } = await supabase
      .from("profiles")
      .select("id, display_name, city_slug, country_iso")
      .eq("is_claimed", true)
      .neq("availability_status", "offline")
      .lt("updated_at", thirtyDaysAgo)
      .limit(100);

    if (!dormant || dormant.length === 0) {
      return new Response(JSON.stringify({ ok: true, action, reactivated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reactivationPushes = dormant.map((p: any) => ({
      user_id: p.id,
      title: "🚛 Loads Are Waiting Near You",
      body: "You haven't been active in 30 days. New loads are matching in your area now.",
      data_json: {
        type: "reactivation",
        deep_link: "haulcommand://dashboard/loads",
      },
      channel: "push",
      status: "queued",
      created_at: now,
    }));

    await supabase.from("hc_notifications").insert(reactivationPushes);

    await fetch(`${supabaseUrl}/functions/v1/fcm-push-worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ trigger: "reactivation_flush" }),
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true, action, reactivated: dormant.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // CLAIM_INITIATE — begin a claim workflow
  // ─────────────────────────────────────────────────
  if (action === "claim_initiate") {
    const profileId = body.profile_id as string;
    const userId = body.user_id as string;
    const verificationMethod = String(body.method || "email");

    if (!profileId || !userId) {
      return new Response(JSON.stringify({ error: "profile_id and user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check profile is unclaimed
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_claimed, display_name")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }
    if (profile.is_claimed) {
      return new Response(JSON.stringify({ error: "Profile already claimed" }), { status: 409 });
    }

    // Create claim record
    const token = crypto.randomUUID();
    const { data: claim, error: claimErr } = await supabase
      .from("claimed_profiles")
      .insert({
        profile_id: profileId,
        claimed_by: userId,
        verification_method: verificationMethod,
        verification_token: token,
        status: "pending",
        created_at: now,
      })
      .select()
      .single();

    if (claimErr) {
      return new Response(JSON.stringify({ error: claimErr.message }), { status: 500 });
    }

    await supabase.from("os_event_log").insert({
      event_type: "growth.claim_initiated",
      entity_id: profileId,
      entity_type: "profile",
      payload: { user_id: userId, method: verificationMethod },
      created_at: now,
    });

    return new Response(JSON.stringify({
      ok: true, action: "claim_initiate",
      claim_id: claim.id,
      verification_token: token,
      next_step: `Verify via ${verificationMethod} to complete claim`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
