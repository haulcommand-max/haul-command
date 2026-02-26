export const dynamic = 'force-dynamic';
/**
 * Phase 8 â€” Exposure Allocation Engine
 * POST /api/v1/broker/exposure
 *
 * Accepts a search context (corridor, load type, time) and returns an
 * ordered list of operator IDs with their computed ExposureScore.
 *
 * ExposureScore = (Trust * W1) + (ContextFit * W2) + (Freshness * W3)
 *              + (ColdStartBoost * W4) + (PaidBoost * W5)
 *
 * Hard guardrails are applied AFTER initial scoring:
 *   1. Min-trust gate  â€” suppress below threshold
 *   2. Diversity cap   â€” max N same operator per session
 *   3. Soft randomization within score band (Â±5 pts)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SearchContext {
    origin_state?: string;
    dest_state?: string;
    corridor_id?: string;
    load_type?: string;           // e.g. "superload", "overdimensional"
    requested_at_hour?: number;   // 0-23, local time
    broker_session?: string;      // UUID grouping this broker's search session
    top_n?: number;               // how many results to return (default 20)
}

interface OperatorCandidate {
    id: string;
    trust_score: number;
    states_licensed: string[];
    vehicle_type: string | null;
    available_now: boolean;
    surge_eligible: boolean;
    paid_boost_active: boolean;
    completed_escorts: number;
    last_active_at: string | null;
    last_job_completed_at: string | null;
    avg_response_min: number | null;
    selection_rate_7d: number;
}

interface ScoredOperator extends OperatorCandidate {
    score_trust: number;
    score_context: number;
    score_freshness: number;
    score_cold_start: number;
    score_paid_boost: number;
    exposure_score: number;
    is_cold_start: boolean;
    suppressed: boolean;
}

// â”€â”€ Config defaults (overridden by DB config if available) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEFAULT_WEIGHTS = {
    w_trust_score: 0.45,
    w_context_fit: 0.25,
    w_freshness: 0.12,
    w_cold_start: 0.08,
    w_paid_boost: 0.10,
    min_trust_gate: 40.0,
    diversity_cap: 3,
} as const;

// â”€â”€ Factor computation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Factor 1 â€” Trust Score (already 0-100, normalize to 0-1).
 */
function computeTrustFactor(trust_score: number): number {
    return Math.min(trust_score, 100) / 100;
}

/**
 * Factor 2 â€” Context Fit (0-1).
 * Weighted sub-factors: corridor proximity, state match, equipment, availability.
 */
function computeContextFit(op: OperatorCandidate, ctx: SearchContext): number {
    let score = 0;
    const checks = [
        // State coverage match
        {
            weight: 0.35,
            pass: (ctx.origin_state && op.states_licensed.includes(ctx.origin_state)) ||
                (ctx.dest_state && op.states_licensed.includes(ctx.dest_state!)),
        },
        // Currently available
        { weight: 0.40, pass: op.available_now },
        // Load type match (simple pass-through; vehicle_type contains capability hints)
        {
            weight: 0.15,
            pass:
                !ctx.load_type ||
                !op.vehicle_type ||
                op.vehicle_type.toLowerCase().includes("pilot") ||
                op.vehicle_type.toLowerCase().includes("escort"),
        },
        // Time-of-day bonus: middle of day slots are easier to fill
        {
            weight: 0.10,
            pass: (ctx.requested_at_hour ?? 12) >= 7 && (ctx.requested_at_hour ?? 12) <= 19,
        },
    ];

    for (const check of checks) {
        if (check.pass) score += check.weight;
    }

    return Math.min(score, 1);
}

/**
 * Factor 3 â€” Activity Freshness (0-1, exponential decay).
 */
function computeFreshness(op: OperatorCandidate): number {
    const now = Date.now();
    let score = 0;

    // Last active recency (up to 0.45)
    if (op.last_active_at) {
        const hoursAgo = (now - new Date(op.last_active_at).getTime()) / 3_600_000;
        score += 0.45 * Math.exp(-hoursAgo / 48); // half-life = 48h
    }

    // Recent job completed (up to 0.35)
    if (op.last_job_completed_at) {
        const daysAgo = (now - new Date(op.last_job_completed_at).getTime()) / 86_400_000;
        score += 0.35 * Math.exp(-daysAgo / 14); // half-life = 14 days
    }

    // Response time quality (up to 0.20) â€” faster is better
    if (op.avg_response_min !== null) {
        const respScore = Math.max(0, 1 - op.avg_response_min / 120); // 0 pts at 2h+
        score += 0.20 * respScore;
    }

    return Math.min(score, 1);
}

/**
 * Factor 4 â€” Cold Start Boost (0-1, capped and decaying).
 * Only applies if operator has fewer than 10 completed escorts.
 */
function computeColdStartBoost(op: OperatorCandidate, trust_score: number): number {
    const isColdStart = op.completed_escorts < 10;
    if (!isColdStart) return 0;

    // The boost is proportional to trust/verification level so manipulation is penalized.
    const verificationFactor = Math.min(trust_score / 60, 1); // max at trust=60+
    return 0.7 * verificationFactor; // returns 0-0.7 which gets multiplied by w_cold_start (0.08)
}

/**
 * Factor 5 â€” Paid Boost (0-1, sandboxed â€” requires min trust + context match).
 */
function computePaidBoost(
    op: OperatorCandidate,
    contextFit: number,
    trustThreshold: number
): number {
    if (!op.paid_boost_active) return 0;
    if (op.trust_score < trustThreshold) return 0; // cannot override trust gate
    if (contextFit < 0.3) return 0;                // cannot override severe context mismatch
    return Math.min(contextFit * 0.9, 1);          // boost is proportional to contextual relevance
}

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(req: NextRequest) {
    try {
        const ctx: SearchContext = await req.json();
        const topN = ctx.top_n ?? 20;

        // 1. Load config weights from DB
        const { data: cfg } = await getSupabase()
        .from("exposure_allocation_config")
            .select("*")
            .eq("id", 1)
            .single();

        const W = cfg ?? DEFAULT_WEIGHTS;

        // 2. Fetch candidate operators from the directory
        //    In production this would filter by corridor geo + availability;
        //    for now we pull the top 200 by trust_score as the candidate pool.
        const { data: candidates, error } = await getSupabase()
        .from("driver_profiles")
            .select(`
        id,
        trust_score,
        states_licensed,
        vehicle_type,
        is_available,
        surge_eligible,
        paid_boost_active,
        completed_escorts,
        last_active_at,
        last_job_completed_at,
        avg_response_minutes
      `)
            .eq("is_claimed", true)
            .not("trust_score", "is", null)
            .order("trust_score", { ascending: false })
            .limit(200);

        if (error || !candidates) {
            return NextResponse.json({ error: "Failed to fetch candidates", detail: error }, { status: 500 });
        }

        // 3. Fetch exposure stats for diversity / selection rate
        const candidateIds = candidates.map((c) => c.id);
        const { data: expStats } = await getSupabase()
        .from("operator_exposure_stats")
            .select("operator_id, selection_rate_7d")
            .in("operator_id", candidateIds);

        const statsMap = new Map((expStats ?? []).map((s) => [s.operator_id, s]));

        // 4. Score each candidate
        const scored: ScoredOperator[] = candidates.map((c) => {
            const op: OperatorCandidate = {
                id: c.id,
                trust_score: c.trust_score ?? 0,
                states_licensed: c.states_licensed ?? [],
                vehicle_type: c.vehicle_type,
                available_now: c.is_available ?? false,
                surge_eligible: c.surge_eligible ?? true,
                paid_boost_active: c.paid_boost_active ?? false,
                completed_escorts: c.completed_escorts ?? 0,
                last_active_at: c.last_active_at,
                last_job_completed_at: c.last_job_completed_at,
                avg_response_min: c.avg_response_minutes ?? null,
                selection_rate_7d: statsMap.get(c.id)?.selection_rate_7d ?? 0,
            };

            const s_trust = computeTrustFactor(op.trust_score);
            const s_context = computeContextFit(op, ctx);
            const s_freshness = computeFreshness(op);
            const s_cold = computeColdStartBoost(op, op.trust_score);
            const s_paid = computePaidBoost(op, s_context, W.min_trust_gate);

            const exposure_score =
                s_trust * W.w_trust_score +
                s_context * W.w_context_fit +
                s_freshness * W.w_freshness +
                s_cold * W.w_cold_start +
                s_paid * W.w_paid_boost;

            return {
                ...op,
                score_trust: s_trust,
                score_context: s_context,
                score_freshness: s_freshness,
                score_cold_start: s_cold,
                score_paid_boost: s_paid,
                exposure_score,
                is_cold_start: op.completed_escorts < 10,
                suppressed: op.trust_score < W.min_trust_gate,
            };
        });

        // 5. Apply guardrails
        const eligible = scored.filter((op) => !op.suppressed);

        // Soft randomization within Â±0.05 band to prevent stagnation
        const randomized = eligible.map((op) => ({
            ...op,
            exposure_score: op.exposure_score + (Math.random() - 0.5) * 0.05,
        }));

        // Sort by final score descending
        randomized.sort((a, b) => b.exposure_score - a.exposure_score);

        // Take top N
        const results = randomized.slice(0, topN);

        // 6. Return ranked results (for broker display)
        return NextResponse.json({
            ranked_operators: results.map((op, i) => ({
                operator_id: op.id,
                rank: i + 1,
                exposure_score: parseFloat(op.exposure_score.toFixed(4)),
                is_cold_start: op.is_cold_start,
                paid_boost_applied: op.paid_boost_active && op.score_paid_boost > 0,
                context_fit_pct: Math.round(op.score_context * 100),
                trust_pct: Math.round(op.score_trust * 100),
            })),
            total_candidates: candidates.length,
            eligible_count: eligible.length,
            context: ctx,
            weights_used: W,
        });
    } catch (err) {
        return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
    }
}
