/**
 * POST /api/loads/urgency-score
 *
 * Phase 14 — Broker Urgency Signals Layer
 *
 * Computes a 0-100 Urgency Score from 5 signals:
 *   1. Time Pressure       (weight: high)
 *   2. Coverage Risk       (weight: high)
 *   3. Broker Behavior     (weight: medium)
 *   4. Economic Pressure   (weight: medium)
 *   5. Predictive Failure  (weight: high)
 *
 * Can score a single load or a batch (POST { load_ids: [...] }).
 * Recomputed every 60s by a background job — this endpoint is
 * the on-demand trigger for fresh scoring.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ── Urgency band classification ───────────────────────────────────────────────

export type UrgencyBand = "fresh" | "warming" | "urgent" | "critical";

export function classifyUrgency(score: number): {
    band: UrgencyBand;
    label: string;
    color: string;
    action_hint: string;
} {
    if (score >= 80) return {
        band: "critical", label: "Critical", color: "#ef4444",
        action_hint: "Coverage needed immediately — act now",
    };
    if (score >= 60) return {
        band: "urgent", label: "Urgent", color: "#f97316",
        action_hint: "Escorts needed in next 30 min",
    };
    if (score >= 40) return {
        band: "warming", label: "Heating", color: "#F1A91B",
        action_hint: "Coverage tightening — check availability",
    };
    return {
        band: "fresh", label: "Fresh", color: "#22c55e",
        action_hint: "High response expected",
    };
}

// ── Signal 1: Time Pressure (0-1) ────────────────────────────────────────────

function computeTimePressure(params: {
    posted_at: string;
    required_at: string | null;
    corridor_median_fill_min: number;
    last_broker_action_at: string | null;
}): number {
    const now = Date.now();
    const minutesSincePost = (now - new Date(params.posted_at).getTime()) / 60_000;
    const medianFill = Math.max(params.corridor_median_fill_min, 30);

    // Age relative to median fill time
    const ageFactor = Math.min(minutesSincePost / medianFill, 1); // maxes at 1x fill time

    // Deadline pressure
    let deadlineFactor = 0;
    if (params.required_at) {
        const minsUntilRequired = (new Date(params.required_at).getTime() - now) / 60_000;
        deadlineFactor = minsUntilRequired < 120
            ? Math.min((120 - minsUntilRequired) / 120, 1)
            : 0;
    }

    // Broker inaction — no action for a long time amplifies pressure
    let inactionFactor = 0;
    if (params.last_broker_action_at) {
        const minsInactive = (now - new Date(params.last_broker_action_at).getTime()) / 60_000;
        inactionFactor = Math.min(minsInactive / 60, 1); // max at 1h inaction
    }

    return Math.min(ageFactor * 0.45 + deadlineFactor * 0.35 + inactionFactor * 0.20, 1);
}

// ── Signal 2: Coverage Risk (0-1) ────────────────────────────────────────────

function computeCoverageRisk(params: {
    escorts_in_radius: number;
    escorts_recently_active: number;
    corridor_stress_index: number;
    historical_failure_rate: number;
}): number {
    const supplyScore = Math.max(0, 1 - params.escorts_in_radius / 10); // 0 escorts = full risk
    const activityScore = Math.max(0, 1 - params.escorts_recently_active / 5);
    const stressScore = params.corridor_stress_index / 100;
    const failureScore = Math.min(params.historical_failure_rate, 1);

    return supplyScore * 0.35 + activityScore * 0.25 + stressScore * 0.25 + failureScore * 0.15;
}

// ── Signal 3: Broker Behavior (0-1) ──────────────────────────────────────────

function computeBrokerBehavior(params: {
    broker_avg_fill_minutes: number | null;
    broker_repost_rate: number;
    broker_cancellation_rate: number;
}): number {
    // Brokers who struggle historically add urgency pressure
    const fillStress = params.broker_avg_fill_minutes
        ? Math.min(params.broker_avg_fill_minutes / 120, 1) : 0.5;
    const repostStress = Math.min(params.broker_repost_rate * 2, 1);
    const cancelStress = Math.min(params.broker_cancellation_rate * 2, 1);
    return fillStress * 0.50 + repostStress * 0.30 + cancelStress * 0.20;
}

// ── Signal 4: Economic Pressure (0-1) ────────────────────────────────────────

function computeEconomicPressure(params: {
    quick_pay: boolean;
    rate_visible: boolean;
    rate_vs_corridor_norm: number; // negative = below market, positive = above
    recent_acceptance_rate: number;
}): number {
    const quickPayBoost = params.quick_pay ? 0.3 : 0;
    const rateBoost = params.rate_visible && params.rate_vs_corridor_norm > 0
        ? Math.min(params.rate_vs_corridor_norm / 1.5, 0.4) : 0;
    const acceptancePressure = Math.max(0, 1 - params.recent_acceptance_rate);

    return Math.min(quickPayBoost + rateBoost + acceptancePressure * 0.30, 1);
}

// ── Signal 5: Predictive Failure Risk (0-1) ───────────────────────────────────

function computePredictiveRisk(params: {
    corridor_shortage_p30m: number;  // 0-1 from surge brain
    time_pressure: number;
    coverage_risk: number;
    escort_availability_trend: "rising" | "falling" | "stable";
}): number {
    const trendMultiplier = params.escort_availability_trend === "falling" ? 1.25
        : params.escort_availability_trend === "rising" ? 0.75 : 1.0;

    const base = (params.corridor_shortage_p30m * 0.50 +
        params.time_pressure * 0.25 +
        params.coverage_risk * 0.25) * trendMultiplier;

    return Math.min(base, 1);
}

// ── Composite Urgency Score ───────────────────────────────────────────────────

const SIGNAL_WEIGHTS = {
    time_pressure: 0.28,
    coverage_risk: 0.25,
    broker_behavior: 0.15,
    economic_pressure: 0.12,
    predictive_failure: 0.20,
} as const;

interface LoadUrgencyInput {
    load_id: string;
    posted_at: string;
    required_at?: string | null;
    origin_state?: string;
    corridor_id?: string;
    broker_id?: string;
    quick_pay?: boolean;
    rate_per_mile?: number | null;
}

interface UrgencyResult {
    load_id: string;
    urgency_score: number;
    band: UrgencyBand;
    label: string;
    color: string;
    action_hint: string;
    signals: {
        time_pressure: number;
        coverage_risk: number;
        broker_behavior: number;
        economic_pressure: number;
        predictive_failure: number;
    };
    computed_at: string;
}

async function scoreLoad(load: LoadUrgencyInput): Promise<UrgencyResult> {
    // Fetch corridor stress for supply/demand signals
    const { data: stressSnap } = await getSupabase()
        .from("corridor_stress_log")
        .select("stress_index, available_escort_count, open_load_count")
        .eq("corridor_id", load.corridor_id ?? `I-10_${load.origin_state ?? "TX"}_LA`)
        .order("computed_at", { ascending: false })
        .limit(1)
        .single();

    // Fetch shortage prediction
    const { data: prediction } = await getSupabase()
        .from("corridor_shortage_predictions")
        .select("shortage_probability")
        .eq("corridor_id", load.corridor_id ?? "")
        .eq("prediction_horizon", "30m")
        .order("predicted_at", { ascending: false })
        .limit(1)
        .single();

    const s1 = computeTimePressure({
        posted_at: load.posted_at,
        required_at: load.required_at ?? null,
        corridor_median_fill_min: 45,
        last_broker_action_at: null,
    });

    const s2 = computeCoverageRisk({
        escorts_in_radius: stressSnap?.available_escort_count ?? 5,
        escorts_recently_active: Math.max(0, (stressSnap?.available_escort_count ?? 5) - 2),
        corridor_stress_index: stressSnap?.stress_index ?? 40,
        historical_failure_rate: 0.15,
    });

    const s3 = computeBrokerBehavior({
        broker_avg_fill_minutes: null,
        broker_repost_rate: 0.2,
        broker_cancellation_rate: 0.1,
    });

    const s4 = computeEconomicPressure({
        quick_pay: load.quick_pay ?? false,
        rate_visible: load.rate_per_mile != null,
        rate_vs_corridor_norm: 0,
        recent_acceptance_rate: 0.65,
    });

    const s5 = computePredictiveRisk({
        corridor_shortage_p30m: prediction?.shortage_probability ?? s2 * 0.8,
        time_pressure: s1,
        coverage_risk: s2,
        escort_availability_trend: "stable",
    });

    const rawScore =
        s1 * SIGNAL_WEIGHTS.time_pressure +
        s2 * SIGNAL_WEIGHTS.coverage_risk +
        s3 * SIGNAL_WEIGHTS.broker_behavior +
        s4 * SIGNAL_WEIGHTS.economic_pressure +
        s5 * SIGNAL_WEIGHTS.predictive_failure;

    const urgency_score = Math.round(Math.min(rawScore, 1) * 100);
    const classification = classifyUrgency(urgency_score);

    return {
        load_id: load.load_id,
        urgency_score,
        ...classification,
        signals: {
            time_pressure: parseFloat((s1 * 100).toFixed(1)),
            coverage_risk: parseFloat((s2 * 100).toFixed(1)),
            broker_behavior: parseFloat((s3 * 100).toFixed(1)),
            economic_pressure: parseFloat((s4 * 100).toFixed(1)),
            predictive_failure: parseFloat((s5 * 100).toFixed(1)),
        },
        computed_at: new Date().toISOString(),
    };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Batch mode
        if (Array.isArray(body.loads)) {
            const results = await Promise.all(
                (body.loads as LoadUrgencyInput[]).map(scoreLoad)
            );
            return NextResponse.json({ urgency_scores: results });
        }

        // Single load mode
        const result = await scoreLoad(body as LoadUrgencyInput);
        return NextResponse.json(result);

    } catch (err) {
        return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
    }
}
