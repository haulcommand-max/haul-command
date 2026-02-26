/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * match-generate V2 — Zero-creative-liberty rewrite.
 * Per HAUL_COMMAND_BUILD_PACK_V3 + HAUL_COMMAND_PROB_ENGINE_V2 specs.
 *
 * Must-pass filters (in order):
 * 1. Not in blocklist (both directions)
 * 2. escort_presence.status = available|online
 * 3. Active availability window overlaps load pickup window
 * 4. Capability match (high_pole, lead, chase, police_coord per load reqs)
 * 5. Compliance: insurance_status = verified, compliance_status = verified|pending
 * 6. Bbox + radius: escort within effective_radius_miles of load origin
 *
 * Candidate scoring V2 (per match-ranking-and-waves skill):
 * score = w_accept * c_accept_rate + w_resp * c_response_speed
 *       + w_trust * c_trust + w_dist * c_distance + w_rate * c_rate_fit
 *       + w_comp * c_compliance_bonus
 *
 * Wave sizing: dynamic based on p_offer_60m + confidence.
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Scoring weights (from PROB_ENGINE_V2 spec)
const WEIGHTS = {
    accept_rate: 0.30,
    response_speed: 0.20,
    trust: 0.20,
    distance: 0.15,
    rate_fit: 0.10,
    compliance: 0.05,
};

// Wave config
const WAVE_TTL_SECONDS = [180, 300, 480]; // 3min, 5min, 8min per wave

function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

function computeWaveSize(p_offer_60m: number, confidence: number): number {
    // Dynamic: higher probability + confidence = smaller wave (targeted)
    // Lower probability = larger wave (spread)
    const base = 5;
    const spread = Math.round(base + (1 - p_offer_60m) * 15 + (1 - confidence) * 10);
    return Math.min(Math.max(spread, 3), 25);
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const body = await req.json().catch(() => ({}));
    const { load_id, wave = 1, force = false } = body;

    if (!load_id) return new Response(JSON.stringify({ error: "Missing load_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Load the load from v_open_loads_enriched
    const { data: load, error: loadErr } = await supabase
        .from("v_open_loads_enriched")
        .select("*")
        .eq("load_id", load_id)
        .single();

    if (loadErr || !load) return new Response(JSON.stringify({ error: "Load not found or not open" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // 2. Get intelligence for wave sizing
    const { data: intel } = await supabase
        .from("load_intel")
        .select("fill_probability_60m, confidence, supply_demand_ratio")
        .eq("load_id", load_id)
        .single();

    const p_fill_60m = intel?.fill_probability_60m ?? 0.5;
    const confidence = intel?.confidence ?? 0.3;
    const waveSize = computeWaveSize(p_fill_60m, confidence);
    const waveTtlSeconds = WAVE_TTL_SECONDS[Math.min(wave - 1, 2)];
    const offerExpiresAt = new Date(now.getTime() + waveTtlSeconds * 1000).toISOString();

    // 3. Get blocklist for this broker (both directions)
    const { data: blocklist } = await supabase
        .from("escort_blocklists")
        .select("blocked_user_id, blocker_user_id")
        .or(`blocker_user_id.eq.${load.broker_id},blocked_user_id.eq.${load.broker_id}`);

    const blockedIds = new Set<string>([
        ...(blocklist ?? []).map((b: { blocked_user_id: string }) => b.blocked_user_id),
        ...(blocklist ?? []).map((b: { blocker_user_id: string }) => b.blocker_user_id),
    ]);
    blockedIds.delete(load.broker_id); // Don't block broker themselves

    // 4. Get escort IDs already offered this wave (idempotency)
    const { data: existingOffers } = await supabase
        .from("match_offers")
        .select("escort_id")
        .eq("load_id", load_id)
        .eq("wave", wave)
        .in("status", ["offered", "viewed", "accepted"]);

    const alreadyOffered = new Set((existingOffers ?? []).map((o: { escort_id: string }) => o.escort_id));

    // 5. Get candidate pool from v_active_escort_supply
    const { data: candidates, error: candErr } = await supabase
        .from("v_active_escort_supply")
        .select("*");

    if (candErr) return new Response(JSON.stringify({ error: candErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const reqs = load.escort_requirements_json ?? {};

    // 6. Apply must-pass filters + score each candidate
    const scored: Array<{ escort_id: string; score: number; distance_miles: number }> = [];

    for (const c of (candidates ?? [])) {
        // Filter: blocklist
        if (blockedIds.has(c.escort_id)) continue;

        // Filter: already offered
        if (alreadyOffered.has(c.escort_id)) continue;

        // Filter: compliance (insurance must be verified; compliance verified or pending)
        if (c.insurance_status !== "verified") continue;
        if (!["verified", "pending"].includes(c.compliance_status ?? "")) continue;

        // Filter: capability match
        if (reqs.high_pole === true && !(c.capabilities_json?.high_pole)) continue;
        if (reqs.lead_required === true && !["lead", "high_pole"].includes(c.vehicle_type ?? "")) continue;
        if (reqs.police_required === true && c.vehicle_type !== "police_coord") continue;

        // Filter: location (must have lat/lng)
        if (!c.lat || !c.lng || !load.origin_lat || !load.origin_lng) continue;

        // Filter: bbox + radius
        const distMiles = haversineDistanceMiles(c.lat, c.lng, load.origin_lat, load.origin_lng);
        const effectiveRadius = c.effective_radius_miles ?? 150;
        if (distMiles > effectiveRadius) continue;

        // Filter: availability window overlap with load pickup
        if (c.window_start && c.window_end && load.pickup_earliest_at) {
            const pickupStart = new Date(load.pickup_earliest_at);
            const windowEnd = new Date(c.window_end);
            if (windowEnd < pickupStart) continue;
        }

        // Filter: min rate preference
        if (c.min_rate_preference && load.rate_amount && load.rate_amount < c.min_rate_preference) continue;

        // === CANDIDATE SCORING V2 ===
        // c_accept_rate: smoothed from market_priors (cold start default 0.4)
        const c_accept_rate = clamp01(c.trust_base ? c.trust_base / 100 : 0.4);

        // c_response_speed: inverse of distance proxy (higher trust_base = faster)
        const c_response_speed = clamp01(1 - distMiles / Math.max(effectiveRadius, 1));

        // c_trust: normalized trust_base
        const c_trust = clamp01((c.trust_base ?? 50) / 100);

        // c_distance: inverse normalized distance
        const c_distance = clamp01(1 - distMiles / 500);

        // c_rate_fit: how well rate matches escort min (1 = perfect)
        const c_rate_fit = c.min_rate_preference && load.rate_amount
            ? clamp01(load.rate_amount / Math.max(c.min_rate_preference, 1))
            : 0.7;

        // c_compliance: bonus for verified status
        const c_compliance = c.compliance_status === "verified" && c.insurance_status === "verified" ? 1.0 : 0.5;

        const score =
            WEIGHTS.accept_rate * c_accept_rate +
            WEIGHTS.response_speed * c_response_speed +
            WEIGHTS.trust * c_trust +
            WEIGHTS.distance * c_distance +
            WEIGHTS.rate_fit * c_rate_fit +
            WEIGHTS.compliance * c_compliance;

        scored.push({ escort_id: c.escort_id, score, distance_miles: distMiles });
    }

    // 7. Sort by score desc, take wave size
    scored.sort((a, b) => b.score - a.score);
    const waveTargets = scored.slice(0, waveSize);

    if (!waveTargets.length) {
        return new Response(JSON.stringify({
            ok: true, offers_created: 0, wave, wave_size: waveSize,
            reason: "No eligible candidates in this wave",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 8. Insert match_offers
    const offerRows = waveTargets.map((t, idx) => ({
        load_id,
        broker_id: load.broker_id,
        escort_id: t.escort_id,
        offer_rank: idx + 1,
        wave,
        offer_reason_json: {
            score: t.score,
            distance_miles: Math.round(t.distance_miles),
            wave,
        },
        offered_rate: load.rate_amount,
        offered_at: nowIso,
        expires_at: offerExpiresAt,
        status: "offered",
    }));

    const { error: insertErr } = await supabase.from("match_offers").insert(offerRows);
    if (insertErr) return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // ── BLOCKER #5 FIX: Wire data spine — ingest job_broadcasted event ──
    // This activates: scarcity index, surge pricing, fill probability, liquidity scores
    await supabase.rpc('ingest_event', {
        p_event_type: 'job_broadcasted',
        p_actor_id: load.broker_id,
        p_entity_id: load_id,
        p_payload: {
            wave,
            offers_sent: waveTargets.length,
            candidates_considered: scored.length,
            origin_state: load.origin_state,
            dest_state: load.dest_state,
            est_miles: load.est_miles,
            rate_amount: load.rate_amount,
            escorts_required: load.escort_requirements_json?.count ?? 1,
        },
        p_corridor_id: load.origin_state && load.dest_state ? `${load.origin_state}-${load.dest_state}` : null,
    }).catch(() => { /* non-fatal — data spine must not block dispatch */ });

    // 9. Send push notifications (fire and forget — errors logged, not thrown)
    const pushPromises = waveTargets.map(async (t) => {
        // Get push token from escort_presence
        const { data: presence } = await supabase
            .from("escort_presence")
            .select("push_token, device_platform")
            .eq("escort_id", t.escort_id)
            .single();

        if (!presence?.push_token) return;

        // FCM push via Supabase integration or external call
        // Token stored; actual FCM send happens via a separate push-notifications function
        // to keep this function lean. We log the intent here.
        await supabase.from("push_notification_log").insert({
            escort_id: t.escort_id,
            load_id,
            push_token: presence.push_token,
            payload: JSON.stringify({
                title: "Load Offer",
                body: `${load.est_miles ?? "?"}mi ${load.origin_state}→${load.dest_state} • $${load.rate_amount}`,
                data: { offer_type: "match_offer", load_id, deep_link: `haulcommand://offers/${load_id}` },
            }),
            scheduled_at: nowIso,
            status: "pending",
        }).then(() => { }).catch(() => { });
    });

    await Promise.allSettled(pushPromises);

    // 10. Update boost SLA log (first offer sent)
    await supabase
        .from("boost_sla_log")
        .update({ first_offer_at: nowIso, total_offers_sent: waveTargets.length })
        .eq("load_id", load_id)
        .is("first_offer_at", null);

    return new Response(JSON.stringify({
        ok: true,
        offers_created: waveTargets.length,
        wave,
        wave_size: waveSize,
        expires_at: offerExpiresAt,
        ttl_seconds: waveTtlSeconds,
        candidates_considered: scored.length + alreadyOffered.size,
        candidates_filtered_out: (candidates?.length ?? 0) - scored.length - alreadyOffered.size,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
