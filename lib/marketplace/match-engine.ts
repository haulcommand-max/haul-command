// lib/marketplace/match-engine.ts
//
// Escort Marketplace Auto-Match Engine v1
// 4-stage pipeline: Candidate Generation → Scoring → Offer Strategy → Booking
// Geo-isolated, explainable, auditable, cost-tight.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { calculatePriceBand, type PriceInputs } from "@/lib/pricing/engine";

// ============================================================
// TYPES
// ============================================================

export interface LoadRequest {
    request_id: string;
    country_code: string;
    admin1_code: string | null;
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    pickup_time_window: { start: string; end: string };
    load_type_tags: string[];
    dimensions?: { length?: number; width?: number; height?: number; weight?: number };
    required_escort_count: number;
    special_requirements: string[];
    broker_id?: string;
    carrier_id?: string;
    budget_range?: { min: number; max: number; currency: string };
    cross_border_flag: boolean;
}

export interface OperatorCandidate {
    operator_id: string;
    country_code: string;
    admin1_coverage: string[];
    home_lat: number | null;
    home_lon: number | null;
    last_known_lat: number | null;
    last_known_lon: number | null;
    availability_status: string;
    service_tags: string[];
    equipment_tags: string[];
    compliance_flags: Record<string, boolean>;
    trust_score: number;
    acceptance_rate_30d: number;
    response_time_p50_seconds: number | null;
    cancellation_rate_90d: number;
    active_job_count: number;
    last_active_at: string | null;
}

export interface ScoredCandidate {
    operator_id: string;
    match_score: number;
    rank: number;
    breakdown: ScoreBreakdown;
    acceptance_probability: number;
}

export interface ScoreBreakdown {
    geo_fit: number;
    availability_fit: number;
    compliance_fit: number;
    trust_fit: number;
    acceptance_fit: number;
    experience_fit: number;
    price_fit: number;
}

export interface OfferPlan {
    strategy: "instant_ranked" | "smart_broadcast" | "cascade_fallback";
    targets: string[];
    n_initial: number;
    timeout_seconds: number;
    max_rounds: number;
    cascade_round: number;
}

export interface MatchResult {
    match_run_id?: string;
    request_id: string;
    candidates_generated: number;
    scored_candidates: ScoredCandidate[];
    offer_plan: OfferPlan;
    explainability: Record<string, any>;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_RADIUS_KM = 250;
const EARTH_RADIUS_KM = 6371;
const SCORE_WEIGHTS = {
    geo_fit: 0.22,
    availability_fit: 0.16,
    compliance_fit: 0.18,
    trust_fit: 0.14,
    acceptance_fit: 0.12,
    experience_fit: 0.10,
    price_fit: 0.08,
} as const;

// ============================================================
// GEO UTILITIES
// ============================================================

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeDistance(distKm: number, maxKm: number): number {
    return Math.max(0, 1 - distKm / maxKm);
}

// ============================================================
// STAGE 1: CANDIDATE GENERATION
// ============================================================

export async function generateCandidates(
    load: LoadRequest,
    radiusKm: number = DEFAULT_RADIUS_KM
): Promise<OperatorCandidate[]> {
    const supabase = getSupabaseAdmin();

    // Query operators in same country with available status
    let query = supabase
        .from("operator_availability")
        .select("*")
        .eq("country_code", load.country_code)
        .eq("availability_status", "available")
        .limit(200);

    const { data: operators, error } = await query;
    if (error) throw new Error(`Candidate generation failed: ${error.message}`);
    if (!operators?.length) return [];

    // Filter by admin1 overlap OR radius
    const candidates = (operators as any[]).filter((op) => {
        // Admin1 overlap check
        const opAdmin1 = (op.admin1_coverage ?? []) as string[];
        if (load.admin1_code && opAdmin1.includes(load.admin1_code)) return true;

        // Distance check from operator position to load origin
        const opLat = op.last_known_lat ?? op.home_lat;
        const opLon = op.last_known_lon ?? op.home_lon;
        if (opLat == null || opLon == null) return false;

        const dist = haversineKm(opLat, opLon, load.origin_lat, load.origin_lon);
        return dist <= radiusKm;
    });

    // Filter by service tag satisfaction
    const loadTags = new Set(load.load_type_tags);
    const filteredByService = candidates.filter((op) => {
        if (loadTags.size === 0) return true;
        const opTags = new Set((op.service_tags ?? []) as string[]);
        // At least one overlap
        for (const tag of loadTags) {
            if (opTags.has(tag)) return true;
        }
        return false;
    });

    // Filter by compliance (hard gates)
    const filteredByCompliance = filteredByService.filter((op) => {
        const flags = (op.compliance_flags ?? {}) as Record<string, boolean>;
        // If load has special requirements that map to compliance, check them
        for (const req of load.special_requirements) {
            if (req === "police") continue; // not an operator compliance flag
            if (req === "night_move") continue;
            // For things like route_survey, height_pole — check service_tags instead
        }
        // Hard gate: operator must not be flagged for fraud
        if (flags.fraud_flagged) return false;
        if (flags.safety_suspended) return false;
        return true;
    });

    return filteredByCompliance as OperatorCandidate[];
}

// ============================================================
// STAGE 2: SCORING & RANKING
// ============================================================

export function scoreCandidate(
    op: OperatorCandidate,
    load: LoadRequest,
    relationshipWeight: number = 0,
    corridorFamiliarity: number = 0,
    surgeMultiplier: number = 1.0
): ScoredCandidate {
    // --- Geo Fit ---
    const opLat = op.last_known_lat ?? op.home_lat ?? 0;
    const opLon = op.last_known_lon ?? op.home_lon ?? 0;
    const distKm = haversineKm(opLat, opLon, load.origin_lat, load.origin_lon);
    const geoFit = normalizeDistance(distKm, DEFAULT_RADIUS_KM);

    // --- Availability Fit ---
    // Base: status is available (already filtered). Boost if recently active.
    let availabilityFit = op.availability_status === "available" ? 0.8 : 0;
    if (op.last_active_at) {
        const minutesAgo = (Date.now() - new Date(op.last_active_at).getTime()) / 60000;
        if (minutesAgo < 15) availabilityFit = 1.0;
        else if (minutesAgo < 60) availabilityFit = 0.9;
        else if (minutesAgo < 360) availabilityFit = 0.7;
    }
    // Penalize operators with high active job count
    if (op.active_job_count >= 2) availabilityFit *= 0.5;
    else if (op.active_job_count === 1) availabilityFit *= 0.75;

    // --- Compliance Fit ---
    const flags = op.compliance_flags ?? {};
    let complianceScore = 0;
    const complianceChecks = ["license_verified", "insurance_verified", "background_checked"];
    let complianceHits = 0;
    for (const check of complianceChecks) {
        if ((flags as any)[check] === true) complianceHits++;
    }
    complianceScore = complianceChecks.length > 0 ? complianceHits / complianceChecks.length : 0.5;

    // --- Trust Fit ---
    const trustFit = Math.min(1, (op.trust_score ?? 0) / 100);

    // --- Acceptance Fit ---
    const acceptRate = op.acceptance_rate_30d ?? 0;
    const responseSpeed = op.response_time_p50_seconds
        ? Math.max(0, 1 - op.response_time_p50_seconds / 300) // normalize to 5min max
        : 0.5;
    const acceptanceFit = acceptRate * 0.7 + responseSpeed * 0.3;

    // --- Experience Fit ---
    const loadTypeTags = new Set(load.load_type_tags);
    const opServiceTags = new Set(op.service_tags ?? []);
    let tagOverlap = 0;
    for (const t of loadTypeTags) {
        if (opServiceTags.has(t)) tagOverlap++;
    }
    const tagScore = loadTypeTags.size > 0 ? tagOverlap / loadTypeTags.size : 0.5;
    const experienceFit = tagScore * 0.6 + corridorFamiliarity * 0.4;

    // --- Price Fit ---
    let priceFit = 0.5; // neutral default
    if (load.budget_range && surgeMultiplier <= 1.5) {
        priceFit = 0.8; // within budget and fair surge
    } else if (surgeMultiplier > 2.0) {
        priceFit = 0.2; // high surge, poor price fit
    }

    // --- Composite Score ---
    const breakdown: ScoreBreakdown = {
        geo_fit: Number(geoFit.toFixed(4)),
        availability_fit: Number(availabilityFit.toFixed(4)),
        compliance_fit: Number(complianceScore.toFixed(4)),
        trust_fit: Number(trustFit.toFixed(4)),
        acceptance_fit: Number(acceptanceFit.toFixed(4)),
        experience_fit: Number(experienceFit.toFixed(4)),
        price_fit: Number(priceFit.toFixed(4)),
    };

    const matchScore =
        geoFit * SCORE_WEIGHTS.geo_fit +
        availabilityFit * SCORE_WEIGHTS.availability_fit +
        complianceScore * SCORE_WEIGHTS.compliance_fit +
        trustFit * SCORE_WEIGHTS.trust_fit +
        acceptanceFit * SCORE_WEIGHTS.acceptance_fit +
        experienceFit * SCORE_WEIGHTS.experience_fit +
        priceFit * SCORE_WEIGHTS.price_fit;

    // --- Acceptance Probability (10× model, simplified) ---
    // Approximate local hour from operator's coverage state (US timezone offsets)
    const stateUtcOffsets: Record<string, number> = {
        FL: -5, GA: -5, SC: -5, NC: -5, VA: -5, MD: -5, DE: -5, NJ: -5, NY: -5,
        CT: -5, MA: -5, RI: -5, NH: -5, VT: -5, ME: -5, PA: -5, OH: -5, MI: -5,
        IN: -5, WV: -5, TN: -5, KY: -5, AL: -6, MS: -6, LA: -6, AR: -6, MO: -6,
        IL: -6, WI: -6, MN: -6, IA: -6, ND: -6, SD: -6, NE: -6, KS: -6, OK: -6,
        TX: -6, MT: -7, WY: -7, CO: -7, NM: -7, AZ: -7, UT: -7, ID: -7,
        WA: -8, OR: -8, CA: -8, NV: -8, AK: -9, HI: -10,
    };
    const opState = op.admin1_coverage?.[0] ?? load.admin1_code ?? '';
    const utcOffset = stateUtcOffsets[opState] ?? -5;
    const hourLocal = (new Date().getUTCHours() + utcOffset + 24) % 24;
    const timeOfDayBoost = hourLocal >= 6 && hourLocal <= 20 ? 1.0 : 0.7;
    const distancePenalty = Math.max(0.3, 1 - distKm / 500);
    const acceptanceProbability = Math.min(
        1,
        acceptRate *
        timeOfDayBoost *
        distancePenalty *
        (1 + relationshipWeight * 0.2) *
        (surgeMultiplier > 1.3 ? 1.1 : 1.0) // higher surge = slightly more likely to accept
    );

    // Fold acceptance probability into final score (20% weight as spec)
    const finalScore = matchScore * 0.80 + acceptanceProbability * 0.20;

    return {
        operator_id: op.operator_id,
        match_score: Number((finalScore * 100).toFixed(2)),
        rank: 0, // assigned after sorting
        breakdown,
        acceptance_probability: Number(acceptanceProbability.toFixed(4)),
    };
}

export function rankCandidates(
    candidates: OperatorCandidate[],
    load: LoadRequest,
    relationshipMap: Map<string, number> = new Map(),
    corridorMap: Map<string, number> = new Map(),
    surgeMultiplier: number = 1.0
): ScoredCandidate[] {
    const scored = candidates.map((op) =>
        scoreCandidate(
            op,
            load,
            relationshipMap.get(op.operator_id) ?? 0,
            corridorMap.get(op.operator_id) ?? 0,
            surgeMultiplier
        )
    );

    // Sort descending by match_score
    scored.sort((a, b) => b.match_score - a.match_score);

    // Assign ranks
    scored.forEach((c, i) => (c.rank = i + 1));

    return scored;
}

// ============================================================
// STAGE 3: OFFER STRATEGY
// ============================================================

export function determineOfferStrategy(
    load: LoadRequest,
    scored: ScoredCandidate[],
    escortScarcityIndex: number = 1.0
): OfferPlan {
    // Smart broadcast when high escort count or high scarcity
    if (load.required_escort_count >= 2 || escortScarcityIndex >= 1.8) {
        return {
            strategy: "smart_broadcast",
            targets: scored.slice(0, 20).map((c) => c.operator_id),
            n_initial: Math.min(20, scored.length),
            timeout_seconds: 120,
            max_rounds: 3,
            cascade_round: 0,
        };
    }

    // Default: instant ranked offers
    return {
        strategy: "instant_ranked",
        targets: scored.slice(0, 8).map((c) => c.operator_id),
        n_initial: Math.min(8, scored.length),
        timeout_seconds: 75,
        max_rounds: 4,
        cascade_round: 0,
    };
}

// ============================================================
// CASCADE FALLBACK
// ============================================================

const CASCADE_STEPS = [
    { add_radius_km: 75, relax: ["price_fit"] },
    { add_radius_km: 125, relax: ["experience_fit"] },
    { add_radius_km: 200, relax: ["trust_fit"] },
];

export async function cascadeFallback(
    load: LoadRequest,
    currentRound: number,
    previousCandidateIds: Set<string>
): Promise<{ newCandidates: OperatorCandidate[]; newRadius: number } | null> {
    if (currentRound >= CASCADE_STEPS.length) return null;

    const step = CASCADE_STEPS[currentRound];
    const newRadius = DEFAULT_RADIUS_KM + step.add_radius_km;

    const allCandidates = await generateCandidates(load, newRadius);

    // Exclude already-offered operators
    const newCandidates = allCandidates.filter(
        (op) => !previousCandidateIds.has(op.operator_id)
    );

    return { newCandidates, newRadius };
}

// ============================================================
// STAGE 4: BOOKING & ASSIGNMENT
// ============================================================

export async function createBooking(
    load: LoadRequest,
    acceptedOfferIds: string[]
): Promise<{ job_id: string; assigned_escorts: string[] }> {
    const supabase = getSupabaseAdmin();

    // Fetch accepted offers
    const { data: offers, error: offErr } = await supabase
        .from("offers")
        .select("offer_id,operator_id,rate_offered,currency")
        .in("offer_id", acceptedOfferIds)
        .eq("status", "accepted");

    if (offErr) throw new Error(`Booking fetch failed: ${offErr.message}`);
    if (!offers?.length) throw new Error("No accepted offers found");

    const escorts = offers.map((o: any) => o.operator_id);
    const totalRate = offers.reduce((s: number, o: any) => s + Number(o.rate_offered ?? 0), 0);

    // Freeze compliance state for each escort
    const { data: complianceRows } = await supabase
        .from("operator_availability")
        .select("operator_id,compliance_flags,trust_score")
        .in("operator_id", escorts);

    const complianceSnapshot: Record<string, any> = {};
    for (const row of (complianceRows ?? []) as any[]) {
        complianceSnapshot[row.operator_id] = {
            compliance_flags: row.compliance_flags,
            trust_score: row.trust_score,
            verified_at: new Date().toISOString(),
        };
    }

    // Create the job
    const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .insert({
            request_id: load.request_id,
            broker_id: load.broker_id ?? null,
            carrier_id: load.carrier_id ?? null,
            assigned_escort_ids: escorts,
            agreed_rate_total: totalRate,
            currency: (offers[0] as any)?.currency ?? "USD",
            compliance_snapshot: complianceSnapshot,
            audit_trail: [
                {
                    action: "job_created",
                    ts: new Date().toISOString(),
                    actor: "match_engine",
                    details: { accepted_offers: acceptedOfferIds, escorts },
                },
            ],
            status: "confirmed",
        })
        .select("job_id")
        .single();

    if (jobErr) throw new Error(`Job creation failed: ${jobErr.message}`);

    // Update load request status
    await supabase
        .from("load_requests")
        .update({ status: "matched", updated_at: new Date().toISOString() })
        .eq("request_id", load.request_id);

    // Mark operators as busy + atomically increment active_job_count
    await supabase
        .from("operator_availability")
        .update({
            availability_status: "busy",
            updated_at: new Date().toISOString(),
        })
        .in("operator_id", escorts);

    await supabase.rpc("increment_active_job_count", {
        operator_ids: escorts,
    });

    return {
        job_id: (job as any).job_id,
        assigned_escorts: escorts,
    };
}

// ============================================================
// FULL PIPELINE ORCHESTRATOR
// ============================================================

export async function runMatchPipeline(load: LoadRequest): Promise<MatchResult> {
    const supabase = getSupabaseAdmin();

    // --- Load relationship graph for this broker ---
    let relationshipMap = new Map<string, number>();
    if (load.broker_id) {
        const { data: edges } = await supabase
            .from("broker_escort_edges")
            .select("operator_id,relationship_weight")
            .eq("broker_id", load.broker_id);

        for (const e of (edges ?? []) as any[]) {
            relationshipMap.set(e.operator_id, Number(e.relationship_weight ?? 0));
        }
    }

    // --- Stage 1: Candidate Generation ---
    const candidates = await generateCandidates(load);

    // --- Stage 2: Scoring & Ranking ---
    const scored = rankCandidates(candidates, load, relationshipMap);

    // --- Stage 3: Offer Strategy ---
    // Pull escortScarcityIndex from corridor scarcity metrics (fallback to heuristic)
    let escortScarcityIndex = candidates.length < 5 ? 2.0 : candidates.length < 15 ? 1.5 : 1.0;
    if (load.admin1_code) {
        try {
            const { data: scarcityRow } = await supabase
                .from('corridor_scarcity_metrics')
                .select('scarcity_tier')
                .eq('corridor_id', `${load.country_code}-${load.admin1_code}`)
                .order('snapshot_date', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (scarcityRow?.scarcity_tier) {
                const tierToIndex: Record<string, number> = {
                    normal: 1.0, tight: 1.5, constrained: 1.8, critical: 2.5,
                };
                escortScarcityIndex = tierToIndex[scarcityRow.scarcity_tier] ?? escortScarcityIndex;
            }
        } catch { /* non-blocking */ }
    }
    const offerPlan = determineOfferStrategy(load, scored, escortScarcityIndex);

    // --- Persist match run ---
    const explainability: Record<string, any> = {};
    for (const c of scored.slice(0, 20)) {
        explainability[c.operator_id] = {
            rank: c.rank,
            score: c.match_score,
            breakdown: c.breakdown,
            acceptance_probability: c.acceptance_probability,
        };
    }

    const { data: matchRun } = await supabase
        .from("match_runs")
        .insert({
            request_id: load.request_id,
            stage: "full_pipeline",
            candidate_count: candidates.length,
            top_candidates: scored.slice(0, 20).map((c) => ({
                operator_id: c.operator_id,
                score: c.match_score,
                rank: c.rank,
            })),
            explainability,
            offer_plan: offerPlan,
            cascade_round: 0,
        })
        .select("match_run_id")
        .single();

    // --- Compute rate from pricing engine ---
    const loadMiles = haversineKm(load.origin_lat, load.origin_lon, load.destination_lat, load.destination_lon) * 0.621371;
    const regionLookup: Record<string, string> = {
        FL: 'southeast', GA: 'southeast', AL: 'southeast', SC: 'southeast', NC: 'southeast',
        TN: 'southeast', TX: 'southwest', AZ: 'southwest', CA: 'west_coast', OR: 'west_coast',
        WA: 'west_coast', NY: 'northeast', NJ: 'northeast', PA: 'northeast', OH: 'midwest',
        MI: 'midwest', IL: 'midwest', CO: 'southwest',
    };
    const regionKey = load.admin1_code ? (regionLookup[load.admin1_code] ?? 'southeast') : 'southeast';

    // Look up corridor demand pressure to derive heat band
    let corridorHeatBand: 'cold' | 'balanced' | 'warm' | 'hot' | 'critical' = 'balanced';
    if (load.admin1_code) {
        try {
            const { data: supplySnap } = await supabase
                .from('corridor_supply_snapshot')
                .select('demand_pressure')
                .ilike('corridor_slug', `%${load.admin1_code.toLowerCase()}%`)
                .order('timestamp_bucket', { ascending: false })
                .limit(3);
            if (supplySnap?.length) {
                const avgPressure = supplySnap.reduce((s: number, r: any) => s + (r.demand_pressure ?? 0), 0) / supplySnap.length;
                corridorHeatBand = avgPressure >= 0.8 ? 'critical' : avgPressure >= 0.6 ? 'hot' : avgPressure >= 0.4 ? 'warm' : avgPressure >= 0.2 ? 'balanced' : 'cold';
            }
        } catch { /* non-blocking — fall back to balanced */ }
    }

    const pricingInputs: PriceInputs = {
        countryCode: load.country_code,
        regionKey: loadMiles < 50 ? 'national' : regionKey,
        rateType: loadMiles < 50 ? 'day_rate' : 'pevo',
        corridorHeatBand,
        complexityModifiers: load.special_requirements.filter(r =>
            ['night_move', 'superload', 'urban_heavy', 'multi_day', 'police_required'].includes(r)
        ),
    };
    const priceBand = calculatePriceBand(pricingInputs);
    const computedRate = priceBand
        ? (priceBand.unit === 'per_mile'
            ? Math.round(((priceBand.recommendedLow + priceBand.recommendedHigh) / 2) * Math.max(loadMiles, 1))
            : Math.round((priceBand.recommendedLow + priceBand.recommendedHigh) / 2))
        : null;

    // --- Create offers ---
    const offerInserts = offerPlan.targets.map((operatorId) => {
        const candidate = scored.find((c) => c.operator_id === operatorId);
        return {
            request_id: load.request_id,
            match_run_id: (matchRun as any)?.match_run_id ?? null,
            operator_id: operatorId,
            rate_offered: computedRate,
            currency: priceBand?.currency ?? 'USD',
            status: "sent",
            cascade_round: 0,
            accept_deadline_at: new Date(
                Date.now() + offerPlan.timeout_seconds * 1000
            ).toISOString(),
        };
    });

    if (offerInserts.length) {
        await supabase.from("offers").insert(offerInserts);
    }

    // Update load request status
    await supabase
        .from("load_requests")
        .update({ status: "matching", updated_at: new Date().toISOString() })
        .eq("request_id", load.request_id);

    return {
        match_run_id: (matchRun as any)?.match_run_id,
        request_id: load.request_id,
        candidates_generated: candidates.length,
        scored_candidates: scored.slice(0, 20),
        offer_plan: offerPlan,
        explainability,
    };
}
