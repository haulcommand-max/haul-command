// lib/trust/composite-trust-engine.ts
//
// 3-Layer Composite Trust Score Engine
// Layer 1: Crowd Signals (stars) → visibility
// Layer 2: Verified Activity (jobs/payments) → credibility
// Layer 3: Evidence-Backed Disputes (proofs) → defensibility
//
// Separates EXPERIENCE from TRUST as two visible dimensions.
// Cold-start protection, confidence bands, anti-gaming.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface TrustScoreResult {
    user_id: string;
    // Composite
    composite_score: number;               // 0-100, the master number
    // Two visible dimensions
    experience_score: number;              // stars, communication, professionalism
    trust_score: number;                   // verified jobs, payments, disputes
    // Layer breakdowns
    layers: {
        crowd_signal: LayerScore;
        verified_activity: LayerScore;
        evidence_defensibility: LayerScore;
    };
    // Confidence
    confidence: ConfidenceLevel;
    data_points: number;
    is_emerging: boolean;
    probation_active: boolean;
    // Anti-gaming
    gaming_flags: string[];
}

export interface LayerScore {
    raw: number;                           // 0-100
    weighted: number;                      // after weight applied
    weight: number;
    inputs: Record<string, number>;
}

export type ConfidenceLevel = "low" | "medium" | "high" | "very_high";

// ============================================================
// LAYER WEIGHTS
// ============================================================

const LAYER_WEIGHTS = {
    crowd_signal: 0.25,                    // stars matter but aren't everything
    verified_activity: 0.50,               // this is the moat — actual work done
    evidence_defensibility: 0.25,          // dispute record + evidence quality
} as const;

// ============================================================
// CONFIDENCE THRESHOLDS
// ============================================================

const CONFIDENCE_THRESHOLDS = {
    low: 0,           // 0-4 data points
    medium: 5,        // 5-14 data points
    high: 15,         // 15-49 data points
    very_high: 50,    // 50+ data points
} as const;

const EMERGING_THRESHOLD = 5;            // less than 5 verified activities = emerging
const PROBATION_THRESHOLD = 2;           // less than 2 completed jobs = probation eligible

// ============================================================
// COMPUTE LAYER 1: CROWD SIGNALS
// ============================================================

async function computeCrowdSignalScore(
    supabase: any,
    userId: string
): Promise<LayerScore> {
    const { data: ratings } = await supabase
        .from("trust_ratings")
        .select("overall_score,communication_score,professionalism_score,responsiveness_score,reliability_score,payment_reliability_score,safety_compliance_score,verified_job,weight,flagged")
        .eq("rated_user_id", userId)
        .eq("flagged", false);

    const allRatings = (ratings ?? []) as any[];

    if (allRatings.length === 0) {
        return {
            raw: 50,   // neutral baseline for new users (not penalized)
            weighted: 50 * LAYER_WEIGHTS.crowd_signal,
            weight: LAYER_WEIGHTS.crowd_signal,
            inputs: { total_ratings: 0, avg_overall: 0, verified_ratio: 0 },
        };
    }

    // Weighted average (verified job reviews count more)
    let weightedSum = 0;
    let totalWeight = 0;
    let verifiedCount = 0;

    // Sub-scores
    let commSum = 0, profSum = 0, respSum = 0, relSum = 0, commCount = 0;

    for (const r of allRatings) {
        const w = r.verified_job ? (r.weight ?? 1.0) * 1.5 : (r.weight ?? 1.0);
        weightedSum += (r.overall_score ?? 3) * w;
        totalWeight += w;
        if (r.verified_job) verifiedCount++;

        if (r.communication_score) { commSum += r.communication_score; commCount++; }
        if (r.professionalism_score) { profSum += r.professionalism_score; commCount++; }
        if (r.responsiveness_score) { respSum += r.responsiveness_score; }
        if (r.reliability_score) { relSum += r.reliability_score; }
    }

    const avgOverall = totalWeight > 0 ? weightedSum / totalWeight : 3;
    const rawScore = Math.round((avgOverall / 5) * 100);
    const verifiedRatio = allRatings.length > 0 ? verifiedCount / allRatings.length : 0;

    return {
        raw: rawScore,
        weighted: rawScore * LAYER_WEIGHTS.crowd_signal,
        weight: LAYER_WEIGHTS.crowd_signal,
        inputs: {
            total_ratings: allRatings.length,
            avg_overall: Math.round(avgOverall * 100) / 100,
            verified_ratio: Math.round(verifiedRatio * 100) / 100,
            avg_communication: commCount > 0 ? Math.round((commSum / commCount) * 100) / 100 : 0,
            avg_professionalism: commCount > 0 ? Math.round((profSum / commCount) * 100) / 100 : 0,
        },
    };
}

// ============================================================
// COMPUTE LAYER 2: VERIFIED ACTIVITY
// ============================================================

async function computeVerifiedActivityScore(
    supabase: any,
    userId: string
): Promise<LayerScore> {
    // Get or create summary
    let { data: summary } = await supabase
        .from("verified_activity_summary")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (!summary) {
        // Compute from events
        const { data: events } = await supabase
            .from("verified_activity_events")
            .select("event_type,event_weight,amount_cents,verified")
            .eq("user_id", userId)
            .eq("verified", true);

        const allEvents = (events ?? []) as any[];
        const jobs = allEvents.filter((e) => e.event_type === "job_completed");
        const payments = allEvents.filter((e) => e.event_type === "payment_received" || e.event_type === "payment_sent");
        const gps = allEvents.filter((e) => e.event_type === "gps_session");
        const loads = allEvents.filter((e) => e.event_type === "load_moved");
        const broker = allEvents.filter((e) => e.event_type === "broker_interaction");
        const totalPayments = payments.reduce((sum: number, p: any) => sum + (p.amount_cents ?? 0), 0);

        summary = {
            total_verified_jobs: jobs.length,
            total_verified_payments: payments.length,
            total_gps_sessions: gps.length,
            total_loads_moved: loads.length,
            total_broker_interactions: broker.length,
            total_payment_volume_cents: totalPayments,
        };

        // Persist summary
        await supabase.from("verified_activity_summary").upsert(
            { user_id: userId, ...summary, computed_at: new Date().toISOString() },
            { onConflict: "user_id" }
        );
    }

    const s = summary as any;

    // Score components (each 0-100, then weighted)
    const jobScore = Math.min(s.total_verified_jobs / 25, 1) * 100;       // 25 jobs = max
    const paymentScore = Math.min(s.total_verified_payments / 20, 1) * 100; // 20 payments = max
    const gpsScore = Math.min(s.total_gps_sessions / 15, 1) * 100;
    const volumeScore = Math.min(s.total_payment_volume_cents / 5000000, 1) * 100; // $50k = max
    const brokerScore = Math.min(s.total_broker_interactions / 10, 1) * 100;

    // Internal weights
    const rawScore = Math.round(
        jobScore * 0.35 +
        paymentScore * 0.25 +
        gpsScore * 0.15 +
        volumeScore * 0.15 +
        brokerScore * 0.10
    );

    return {
        raw: rawScore,
        weighted: rawScore * LAYER_WEIGHTS.verified_activity,
        weight: LAYER_WEIGHTS.verified_activity,
        inputs: {
            verified_jobs: s.total_verified_jobs,
            verified_payments: s.total_verified_payments,
            gps_sessions: s.total_gps_sessions,
            payment_volume_cents: s.total_payment_volume_cents,
            broker_interactions: s.total_broker_interactions,
        },
    };
}

// ============================================================
// COMPUTE LAYER 3: EVIDENCE-BACKED DISPUTES
// ============================================================

async function computeEvidenceDefensibilityScore(
    supabase: any,
    userId: string
): Promise<LayerScore> {
    // Disputes filed AGAINST this user
    const { data: disputesAgainst } = await supabase
        .from("disputes")
        .select("id,status,resolution,severity")
        .eq("respondent_id", userId);

    const against = (disputesAgainst ?? []) as any[];

    // Trust impacts
    const { data: impacts } = await supabase
        .from("dispute_trust_impacts")
        .select("trust_score_delta,impact_type")
        .eq("user_id", userId);

    const allImpacts = (impacts ?? []) as any[];

    // Start at 100 (clean record), subtract for negative outcomes
    let score = 100;

    // Resolved disputes
    const resolvedAgainst = against.filter((d) => d.status === "resolved");
    const foundGuilty = resolvedAgainst.filter((d) => d.resolution === "found_for_complainant");
    const dismissed = resolvedAgainst.filter((d) => d.resolution === "dismissed" || d.resolution === "found_for_respondent");

    // Penalties
    for (const d of foundGuilty) {
        const severityPenalty = d.severity === "critical" ? 25 : d.severity === "high" ? 15 : d.severity === "medium" ? 8 : 3;
        score -= severityPenalty;
    }

    // Slight boost for dismissed disputes (survived challenge)
    score += dismissed.length * 2;

    // Trust impact deltas
    const totalDelta = allImpacts.reduce((sum: number, i: any) => sum + (i.trust_score_delta ?? 0), 0);
    score += totalDelta;

    // Open disputes create uncertainty (small temporary penalty)
    const openDisputes = against.filter((d) => d.status === "open" || d.status === "evidence_phase" || d.status === "under_review");
    score -= openDisputes.length * 3;

    score = Math.max(0, Math.min(100, score));

    return {
        raw: score,
        weighted: score * LAYER_WEIGHTS.evidence_defensibility,
        weight: LAYER_WEIGHTS.evidence_defensibility,
        inputs: {
            disputes_against: against.length,
            resolved_guilty: foundGuilty.length,
            resolved_dismissed: dismissed.length,
            open_disputes: openDisputes.length,
            total_trust_delta: totalDelta,
        },
    };
}

// ============================================================
// COMPOSITE SCORE + CONFIDENCE
// ============================================================

export async function computeCompositeTrustScore(userId: string): Promise<TrustScoreResult> {
    const supabase = getSupabaseAdmin();
    const flags: string[] = [];

    // Compute all layers in parallel
    const [crowd, activity, evidence] = await Promise.all([
        computeCrowdSignalScore(supabase, userId),
        computeVerifiedActivityScore(supabase, userId),
        computeEvidenceDefensibilityScore(supabase, userId),
    ]);

    // Composite
    const compositeRaw = crowd.weighted + activity.weighted + evidence.weighted;
    const compositeScore = Math.round(Math.max(0, Math.min(100, compositeRaw)));

    // Experience dimension (crowd-heavy)
    const experienceScore = Math.round(crowd.raw * 0.7 + activity.raw * 0.3);

    // Trust dimension (activity + evidence heavy)
    const trustDimScore = Math.round(activity.raw * 0.5 + evidence.raw * 0.35 + crowd.raw * 0.15);

    // Data points
    const totalRatings = (crowd.inputs.total_ratings ?? 0) as number;
    const totalVerified = (activity.inputs.verified_jobs ?? 0) as number;
    const totalDisputes = (evidence.inputs.disputes_against ?? 0) as number;
    const dataPoints = totalRatings + totalVerified + totalDisputes;

    // Confidence level
    let confidence: ConfidenceLevel;
    if (dataPoints >= CONFIDENCE_THRESHOLDS.very_high) confidence = "very_high";
    else if (dataPoints >= CONFIDENCE_THRESHOLDS.high) confidence = "high";
    else if (dataPoints >= CONFIDENCE_THRESHOLDS.medium) confidence = "medium";
    else confidence = "low";

    // Cold start
    const isEmerging = totalVerified < EMERGING_THRESHOLD;
    const probationActive = totalVerified < PROBATION_THRESHOLD && totalRatings < 2;

    // Anti-gaming checks
    if (totalRatings > 10 && crowd.inputs.verified_ratio < 0.2) {
        flags.push("low_verified_rating_ratio");
    }
    if (totalRatings > 0 && (crowd.inputs.avg_overall as number) === 5.0 && totalRatings < 5) {
        flags.push("suspiciously_perfect_early_ratings");
    }

    const result: TrustScoreResult = {
        user_id: userId,
        composite_score: compositeScore,
        experience_score: experienceScore,
        trust_score: trustDimScore,
        layers: {
            crowd_signal: crowd,
            verified_activity: activity,
            evidence_defensibility: evidence,
        },
        confidence,
        data_points: dataPoints,
        is_emerging: isEmerging,
        probation_active: probationActive,
        gaming_flags: flags,
    };

    // Persist
    await supabase.from("composite_trust_scores").upsert(
        {
            user_id: userId,
            crowd_signal_score: crowd.raw,
            verified_activity_score: activity.raw,
            evidence_defensibility_score: evidence.raw,
            composite_score: compositeScore,
            experience_score: experienceScore,
            trust_score: trustDimScore,
            confidence_level: confidence,
            data_points: dataPoints,
            is_emerging: isEmerging,
            probation_active: probationActive,
            gaming_flags: flags,
            computed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
    );

    return result;
}

// ============================================================
// RECORD VERIFIED ACTIVITY EVENT
// ============================================================

export async function recordVerifiedActivity(
    userId: string,
    eventType: string,
    opts: {
        jobId?: string;
        counterpartyId?: string;
        amountCents?: number;
        evidenceType?: string;
        evidenceRef?: string;
    } = {}
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const weightMap: Record<string, number> = {
        job_completed: 3.0,
        payment_received: 2.5,
        payment_sent: 2.5,
        gps_session: 2.0,
        load_moved: 2.0,
        broker_interaction: 1.0,
    };

    await supabase.from("verified_activity_events").insert({
        user_id: userId,
        event_type: eventType,
        event_weight: weightMap[eventType] ?? 1.0,
        job_id: opts.jobId ?? null,
        counterparty_id: opts.counterpartyId ?? null,
        amount_cents: opts.amountCents ?? null,
        evidence_type: opts.evidenceType ?? null,
        evidence_ref: opts.evidenceRef ?? null,
        verified: true,
    });

    // Invalidate summary so next trust computation recalculates
    await supabase
        .from("verified_activity_summary")
        .delete()
        .eq("user_id", userId);
}

// ============================================================
// SUBMIT RATING
// ============================================================

export async function submitRating(
    ratedUserId: string,
    raterUserId: string,
    raterRole: "broker" | "operator",
    scores: {
        overall: number;
        communication?: number;
        professionalism?: number;
        responsiveness?: number;
        reliability?: number;
        payment_reliability?: number;
        safety_compliance?: number;
        review_text?: string;
    },
    jobId?: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Verify job exists if provided
    let verifiedJob = false;
    if (jobId) {
        const { data: job } = await supabase
            .from("jobs")
            .select("id,status")
            .eq("id", jobId)
            .maybeSingle();
        verifiedJob = (job as any)?.status === "completed";
    }

    await supabase.from("trust_ratings").upsert(
        {
            rated_user_id: ratedUserId,
            rater_user_id: raterUserId,
            rater_role: raterRole,
            job_id: jobId ?? null,
            overall_score: scores.overall,
            communication_score: scores.communication ?? null,
            professionalism_score: scores.professionalism ?? null,
            responsiveness_score: scores.responsiveness ?? null,
            reliability_score: scores.reliability ?? null,
            payment_reliability_score: scores.payment_reliability ?? null,
            safety_compliance_score: scores.safety_compliance ?? null,
            review_text: scores.review_text ?? null,
            verified_job: verifiedJob,
            weight: verifiedJob ? 1.5 : 1.0,
        },
        { onConflict: "rated_user_id,rater_user_id,job_id" }
    );
}
