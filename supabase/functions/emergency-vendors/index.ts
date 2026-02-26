/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "@supabase/supabase-js";

// =========================================================
// emergency-vendors — rank nearby vendors for Emergency Nearby
// POST { emergency_request_id, lat, lng, incident_type, country?, region1?, corridor_hint? }
// Returns top-7 ranked vendors
// =========================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Incident type → service category mapping
const INCIDENT_TO_SERVICE: Record<string, string[]> = {
    breakdown: ["roadside_repair", "mobile_mechanic", "welding"],
    tire: ["tire_service"],
    tow: ["towing"],
    spill: ["spill_response"],
    parking: ["truck_parking"],
    parts: ["parts"],
    other: [],
};

// Plan tier scoring (higher = better surfacing)
const TIER_SCORE: Record<string, number> = {
    free: 0,
    verified: 15,
    priority: 30,
    command_partner: 45,
    corridor_dominator: 60,
};

// Haversine distance in miles
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8; // Earth radius miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}


Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    let body: {
        emergency_request_id: string;
        lat: number;
        lng: number;
        incident_type: string;
        country?: string;
        region1?: string;
        corridor_hint?: string;
    };

    try {
        body = await req.json();
    } catch {
        return Response.json({ error: "invalid_body" }, { status: 400 });
    }

    const { emergency_request_id, lat, lng, incident_type, country, region1, corridor_hint } = body;

    if (!emergency_request_id || lat == null || lng == null || !incident_type) {
        return Response.json({ error: "missing_required_fields" }, { status: 400 });
    }

    // ── 1. Pull eligible vendor locations (active vendors + active plans) ──
    let locationQuery = supabase
        .from("vendor_locations")
        .select(`
      id,
      vendor_id,
      city,
      region1,
      country,
      dispatch_phone,
      lat,
      lng,
      is_24_7,
      service_radius_miles,
      live_status,
      live_status_updated_at,
      last_seen_at,
      availability_confidence_score,
      vendors!inner (
        id,
        legal_name,
        dba_name,
        vendor_type,
        verified_status,
        status,
        trust_score,
        trust_tier
      ),
      vendor_services (
        service_category,
        service_name,
        is_active
      )
    `)
        .eq("vendors.status", "active");

    if (country) locationQuery = locationQuery.eq("country", country);
    if (region1) locationQuery = locationQuery.eq("region1", region1);

    const { data: locations, error: locErr } = await locationQuery;
    if (locErr) {
        console.error("locations query error:", locErr);
        return Response.json({ error: locErr.message }, { status: 500 });
    }

    // ── 2. Pull active plans ──
    const vendorIds = (locations ?? []).map((l: any) => l.vendor_id);
    const { data: plans } = await supabase
        .from("vendor_plans")
        .select("vendor_id, plan_tier, entitlements_json")
        .eq("plan_status", "active")
        .in("vendor_id", vendorIds);

    const plansByVendor: Record<string, any> = {};
    for (const p of plans ?? []) plansByVendor[p.vendor_id] = p;

    // ── 3. Pull active premium placements (emergency_top, corridor_exclusive) ──
    const now = new Date().toISOString();
    const { data: placements } = await supabase
        .from("premium_placements")
        .select("vendor_id, placement_type, region1, corridor_name, is_exclusive")
        .lte("start_at", now)
        .gte("end_at", now)
        .in("placement_type", ["emergency_top", "corridor_exclusive", "category_top"]);

    const placementScoreByVendor: Record<string, number> = {};
    for (const pl of placements ?? []) {
        if (
            (pl.region1 && region1 && pl.region1 !== region1) &&
            !(pl.corridor_name && corridor_hint && pl.corridor_name.toLowerCase().includes(corridor_hint.toLowerCase()))
        ) continue;
        placementScoreByVendor[pl.vendor_id] = (placementScoreByVendor[pl.vendor_id] ?? 0) + 40;
    }

    // ── 4. Score and rank ──
    const serviceCategories = INCIDENT_TO_SERVICE[incident_type] ?? [];

    const results: any[] = [];
    for (const loc of (locations ?? []) as any[]) {
        if (!loc.lat || !loc.lng) continue;

        const distanceMiles = haversine(lat, lng, Number(loc.lat), Number(loc.lng));

        // Deprioritize if beyond service radius (but don't hard exclude)
        const withinRadius = distanceMiles <= (loc.service_radius_miles ?? 50);

        const plan = plansByVendor[loc.vendor_id];
        const planTier = plan?.plan_tier ?? "free";

        // Service match check
        const vendorServiceCategories = (loc.vendor_services ?? [])
            .filter((s: any) => s.is_active)
            .map((s: any) => s.service_category as string);

        const serviceMatch =
            serviceCategories.length === 0 ||
            serviceCategories.some((c: string) => vendorServiceCategories.includes(c));

        if (!serviceMatch) continue; // hard exclude non-matching services

        const tierScore = TIER_SCORE[planTier] ?? 0;
        const placementScore = placementScoreByVendor[loc.vendor_id] ?? 0;
        const verifiedScore = loc.vendors?.verified_status === "verified" ? 10 : 0;
        const availabilityScore = loc.is_24_7 ? 10 : 0;
        const distanceScore = clamp(100 - distanceMiles * 2, 0, 100);
        const radiusPenalty = withinRadius ? 0 : -20;

        // ── Live status scoring (Competitive Dominance Pack) ──
        const liveStatusScore =
            loc.live_status === "available" ? 25 :
                loc.live_status === "en_route" ? 10 :
                    loc.live_status === "on_job" ? 0 :
          /* off_duty */ -15;

        // Freshness decay: if last_seen > 2h ago, reduce confidence
        const lastSeenMs = loc.last_seen_at ? Date.now() - new Date(loc.last_seen_at).getTime() : Infinity;
        const freshnessDecay = lastSeenMs < 7_200_000 ? 0 : -10; // 2h threshold

        // Trust score (0-1) → 0-20 points (spec §7, search_ranking_weight: 0.65)
        const trustScore = (loc.vendors?.trust_score ?? 0.5) * 20;

        // Availability confidence (0-1) → 0-15 points
        const confidenceScore = (loc.availability_confidence_score ?? 0) * 15;

        const score = distanceScore + tierScore + placementScore + verifiedScore +
            availabilityScore + radiusPenalty +
            liveStatusScore + freshnessDecay + trustScore + confidenceScore;

        // Build surfaced_reason tags
        const surfacedReason: string[] = [];
        if (tierScore > 0) surfacedReason.push(`tier_${planTier}`);
        if (placementScore > 0) surfacedReason.push("placement_boost");
        if (verifiedScore > 0) surfacedReason.push("verified");
        if (loc.is_24_7) surfacedReason.push("24_7");
        if (withinRadius) surfacedReason.push("within_radius");
        if (loc.live_status === "available") surfacedReason.push("online_now");
        if ((loc.vendors?.trust_tier ?? "standard") === "elite") surfacedReason.push("elite_trust");

        results.push({
            _score: score,
            _distance: distanceMiles,
            vendor_id: loc.vendor_id,
            vendor_location_id: loc.id,
            vendor_name: loc.vendors?.dba_name ?? loc.vendors?.legal_name ?? "",
            vendor_type: loc.vendors?.vendor_type ?? "",
            dispatch_phone: loc.dispatch_phone ?? "",
            city: loc.city ?? "",
            region1: loc.region1 ?? "",
            distance_miles: Math.round(distanceMiles * 10) / 10,
            plan_tier: planTier,
            verified_status: loc.vendors?.verified_status ?? "pending",
            is_24_7: loc.is_24_7 ?? false,
            live_status: loc.live_status ?? "off_duty",
            trust_score: loc.vendors?.trust_score ?? 0.5,
            trust_tier: loc.vendors?.trust_tier ?? "standard",
            services_joined: vendorServiceCategories.join(", "),
            surfaced_reason: surfacedReason,
        });
    }

    // Sort: desc score, then asc distance for ties
    results.sort((a, b) => b._score - a._score || a._distance - b._distance);

    const top7 = results.slice(0, 7).map((r, i) => ({
        rank: i + 1,
        vendor_id: r.vendor_id,
        vendor_location_id: r.vendor_location_id,
        vendor_name: r.vendor_name,
        vendor_type: r.vendor_type,
        dispatch_phone: r.dispatch_phone,
        city: r.city,
        region1: r.region1,
        distance_miles: r.distance_miles,
        plan_tier: r.plan_tier,
        verified_status: r.verified_status,
        is_24_7: r.is_24_7,
        services_joined: r.services_joined,
        surfaced_reason: r.surfaced_reason,
    }));

    return Response.json({ results: top7 }, {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
});
