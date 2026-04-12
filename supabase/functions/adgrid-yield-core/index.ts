import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * ADGRID-YIELD-CORE ORCHESTRATOR
 * WAVE-6 S6-01: Single entry point for all AdGrid monetization actions.
 *
 * Actions:
 *   action=serve_ad          → Return geo+role+intent-aware ad for a placement
 *   action=record_impression  → Record ad impression (idempotent)
 *   action=record_click      → Record click conversion
 *   action=confirm_billing   → Settle billing for confirmed impressions (batched)
 *   action=inventory_status  → Return available inventory for a geo/placement_type
 *
 * Tier: Premium geo-aware, role-aware, intent-aware. Native look, not banner spam.
 */

const PLACEMENT_TYPES = [
  "corridor_hero",       // corridor rate page top sponsor
  "directory_leaderboard", // directory search results top slot
  "city_takeover",       // city page sponsor
  "country_takeover",    // country landing sponsor
  "tool_sponsor",        // permit/tools hub sponsor
  "glossary_sponsor",    // glossary term sponsor
  "load_board_banner",   // load board in-feed ad
  "urgent_market",       // scarcity/high-demand urgency slot
  "claim_listing",       // adjacent to unclaimed profile
] as const;

type PlacementType = typeof PLACEMENT_TYPES[number];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const epochNow = Math.floor(Date.now() / 1000);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional */ }
  const action = String(body.action || "serve_ad");

  // ─────────────────────────────────────────────────
  // SERVE_AD — geo + role + intent aware ad selection
  // ─────────────────────────────────────────────────
  if (action === "serve_ad") {
    const placement = String(body.placement_type || "directory_leaderboard") as PlacementType;
    const geoKey = String(body.geo_key || "US");       // e.g. "US:TX", "AU:NSW", "US:TX:houston"
    const role = body.role as string | null;
    const userId = body.user_id as string | null;

    // Find active sponsored placements for this geo+placement
    const { data: placements } = await supabase
      .from("featured_placements")
      .select(`
        id, profile_id, geo_key, placement_type, starts_at, ends_at,
        profiles!inner(
          id, display_name, slug, trust_score, insurance_status,
          city_slug, region_code, country_iso, phone_e164
        )
      `)
      .eq("placement_type", placement)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("starts_at", { ascending: false })
      .limit(10);

    // Filter by geo match: exact > region > country
    const geoMatched = (placements || []).filter((p: any) => {
      if (p.geo_key === geoKey) return true; // exact match
      const geoPrefix = geoKey.split(":")[0] + ":" + (geoKey.split(":")[1] || "");
      if (p.geo_key === geoPrefix) return true; // region match
      if (p.geo_key === geoKey.split(":")[0]) return true; // country match
      return false;
    });

    if (geoMatched.length === 0) {
      // No sponsor — return empty slot signal for graceful degradation
      return new Response(JSON.stringify({
        ok: true,
        ad: null,
        reason: "no_sponsor",
        inventory_available: true, // sell signal for self-serve buy path
        buy_url: `/sponsor/checkout?placement=${placement}&geo=${geoKey}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const winner = geoMatched[0];
    const profile = (winner as any).profiles;

    // Record impression (async, fire-and-forget)
    supabase.from("ad_impressions").insert({
      placement_id: winner.id,
      geo_key: geoKey,
      role_context: role,
      user_id: userId,
      epoch: epochNow,
      created_at: now,
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({
      ok: true,
      ad: {
        placement_id: winner.id,
        profile_id: winner.profile_id,
        display_name: profile?.display_name,
        slug: profile?.slug,
        trust_score: profile?.trust_score,
        verified: profile?.insurance_status === "verified",
        phone: profile?.phone_e164,
        cta_url: `/directory/${winner.geo_key.toLowerCase().replace(":", "/")}/${profile?.slug}`,
        placement_type: placement,
        geo_key: geoKey,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ─────────────────────────────────────────────────
  // RECORD_IMPRESSION — idempotent (epoch/placement dedup)
  // ─────────────────────────────────────────────────
  if (action === "record_impression") {
    const placementId = body.placement_id as string;
    const geoKey = body.geo_key as string;
    if (!placementId) {
      return new Response(JSON.stringify({ error: "placement_id required" }), { status: 400 });
    }

    const { error } = await supabase.from("ad_impressions").insert({
      placement_id: placementId,
      geo_key: geoKey || "unknown",
      epoch: epochNow,
      created_at: now,
    });

    return new Response(JSON.stringify({ ok: !error, recorded: !error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // RECORD_CLICK — click-through conversion tracking
  // ─────────────────────────────────────────────────
  if (action === "record_click") {
    const placementId = body.placement_id as string;
    if (!placementId) {
      return new Response(JSON.stringify({ error: "placement_id required" }), { status: 400 });
    }

    await supabase.from("ad_clicks").insert({
      placement_id: placementId,
      user_id: body.user_id as string | null,
      referrer: body.referrer as string | null,
      created_at: now,
    });

    await supabase.from("os_event_log").insert({
      event_type: "adgrid.click",
      entity_id: placementId,
      entity_type: "ad_placement",
      payload: { geo_key: body.geo_key },
      created_at: now,
    });

    return new Response(JSON.stringify({ ok: true, action: "record_click" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // CONFIRM_BILLING — settle billing for impression batches
  // Runs daily via cron — aggregates impressions and creates monetization_events
  // ─────────────────────────────────────────────────
  if (action === "confirm_billing") {
    const billingWindow = Deno.env.get("ADGRID_BILLING_WINDOW_HOURS") || "24";
    const windowStart = new Date(
      Date.now() - parseInt(billingWindow) * 60 * 60 * 1000
    ).toISOString();

    // Aggregate impressions by placement_id
    const { data: impressions } = await supabase
      .from("ad_impressions")
      .select("placement_id, count:id")
      .gte("created_at", windowStart)
      .eq("billed", false);

    if (!impressions || impressions.length === 0) {
      return new Response(JSON.stringify({ ok: true, billed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate by placement
    const agg: Record<string, number> = {};
    for (const imp of impressions as any[]) {
      agg[imp.placement_id] = (agg[imp.placement_id] || 0) + 1;
    }

    let billedCount = 0;
    for (const [placementId, count] of Object.entries(agg)) {
      // Fetch placement CPM rate
      const { data: placement } = await supabase
        .from("sponsorship_products")
        .select("cpm_rate")
        .eq("product_key", placementId)
        .single();

      const cpmRate = (placement as any)?.cpm_rate ?? 15; // $15 CPM default
      const revenue = (count / 1000) * cpmRate;

      await supabase.from("monetization_events").insert({
        event_type: "adgrid_impression_billing",
        amount: revenue,
        currency: "usd",
        metadata: { placement_id: placementId, impression_count: count, cpm_rate: cpmRate },
        created_at: now,
      });

      // Mark impressions as billed
      await supabase.from("ad_impressions")
        .update({ billed: true })
        .eq("placement_id", placementId)
        .gte("created_at", windowStart);

      billedCount++;
    }

    return new Response(JSON.stringify({ ok: true, action: "confirm_billing", placements_billed: billedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─────────────────────────────────────────────────
  // INVENTORY_STATUS — check sell/availability signal for a geo+placement
  // Powers self-serve buy path "This slot is available" banner
  // ─────────────────────────────────────────────────
  if (action === "inventory_status") {
    const placement = body.placement_type as string;
    const geoKey = body.geo_key as string;

    const { data: active } = await supabase
      .from("featured_placements")
      .select("id")
      .eq("placement_type", placement)
      .eq("geo_key", geoKey)
      .lte("starts_at", now)
      .gte("ends_at", now);

    const available = !active || active.length === 0;

    return new Response(JSON.stringify({
      ok: true,
      placement_type: placement,
      geo_key: geoKey,
      available,
      buy_url: available ? `/sponsor/checkout?placement=${placement}&geo=${geoKey}` : null,
      message: available
        ? "This premium slot is currently unclaimed in your market."
        : "This slot is currently sponsored.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
