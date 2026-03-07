// lib/leaderboard/leaderboard-scoring-v4.ts
//
// Leaderboard Scoring Engine v4 — Anti-Gaming Hardened
// Spec: HCOS-100X-GROWTH-WARPLAN-01
//
// Key changes from v3:
// - fraud_penalty as explicit negative weight (-0.20)
// - velocity anomaly detection (review spikes, job bursts, endorsement loops)
// - probation multiplier for new accounts
// - unverified rank ceiling
// - Bayesian weighted review rating
// - exponential decay for recency and response speed
// - rank tiers: Elite/Pro/Verified/Developing/New

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface LeaderboardV4Input {
    user_id: string;
    // Verified outcomes
    completed_jobs_90d: number;
    total_completed_jobs: number;
    on_time_jobs_90d: number;
    total_jobs_90d: number;
    // Response speed
    avg_reply_minutes: number;
    // Reviews
    review_count: number;
    avg_review_score: number;           // 0-5
    review_score_prior: number;         // Bayesian prior (global avg, ~3.5)
    review_count_prior: number;         // Bayesian prior weight (~10)
    // Coverage
    fulfilled_requests: number;
    accepted_requests: number;
    // Recency
    days_since_last_active: number;
    // Profile
    profile_completed_fields: number;
    profile_total_fields: number;
    // Peer endorsements
    verified_endorsements: number;
    // Trust / verification
    verification_tier: number;          // 0-4
    account_age_days: number;
    // Anomaly signals (pre-computed)
    review_spike_detected: boolean;
    job_burst_detected: boolean;
    endorsement_loop_detected: boolean;
    manually_flagged: boolean;
}

export interface LeaderboardV4Output {
    user_id: string;
    raw_score: number;
    final_score: number;                // 0-1000
    rank_tier: 'elite' | 'pro' | 'verified' | 'developing' | 'new';
    breakdown: LeaderboardV4Breakdown;
    fraud_flags: string[];
    fraud_penalty_applied: number;      // 0 to -200
}

export interface LeaderboardV4Breakdown {
    verified_job_completions: number;
    on_time_performance: number;
    response_speed: number;
    review_quality: number;
    coverage_reliability: number;
    recent_activity: number;
    profile_completeness: number;
    peer_endorsements: number;
}

// ============================================================
// WEIGHTS (sum to 1.0 before fraud_penalty)
// ============================================================

const WEIGHTS = {
    verified_job_completions: 0.28,
    on_time_performance: 0.18,
    response_speed: 0.14,
    review_quality: 0.14,
    coverage_reliability: 0.08,
    recent_activity: 0.08,
    profile_completeness: 0.05,
    peer_endorsements: 0.03,
} as const;

const FRAUD_PENALTY_MAX_WEIGHT = 0.20; // up to -200 points

// ============================================================
// TIER CUTOFFS (out of 1000)
// ============================================================

const TIER_CUTOFFS = {
    elite: 850,
    pro: 700,
    verified: 550,
    developing: 350,
} as const;

// Unverified accounts capped at this score
const UNVERIFIED_CAP = 549; // can never reach 'verified' tier without verification

// New account probation (<30 days)
const PROBATION_DAYS = 30;
const PROBATION_MULTIPLIER = 0.65;

// ============================================================
// NORMALIZED METRICS
// ============================================================

function normJobCompletions(completed90d: number): number {
    // log(1 + x) normalized, cap at ~50 jobs → 1.0
    return Math.min(1, Math.log(1 + completed90d) / Math.log(51));
}

function normOnTimePerformance(onTime: number, total: number): number {
    if (total === 0) return 0;
    return onTime / total;
}

function normResponseSpeed(avgMinutes: number): number {
    // Exponential decay: 0 min → 1.0, 60 min → ~0.37, 240 min → ~0.02
    if (avgMinutes <= 0) return 1;
    return Math.exp(-avgMinutes / 60);
}

function normReviewQuality(
    count: number, avg: number,
    priorCount: number, priorAvg: number
): number {
    // Bayesian weighted rating: (priorCount*priorAvg + count*avg) / (priorCount + count)
    // Then normalize 0-5 → 0-1
    if (count === 0 && priorCount === 0) return 0;
    const bayesian = (priorCount * priorAvg + count * avg) / (priorCount + count);
    return bayesian / 5;
}

function normCoverageReliability(fulfilled: number, accepted: number): number {
    if (accepted === 0) return 0;
    return fulfilled / accepted;
}

function normRecentActivity(daysSince: number): number {
    // Exponential decay: 0 days → 1.0, 30 days → ~0.37, 90 days → ~0.05
    return Math.exp(-daysSince / 30);
}

function normProfileCompleteness(completed: number, total: number): number {
    if (total === 0) return 0;
    return completed / total;
}

function normPeerEndorsements(endorsements: number): number {
    // log(1 + x) normalized, cap at ~20 endorsements → 1.0
    return Math.min(1, Math.log(1 + endorsements) / Math.log(21));
}

// ============================================================
// FRAUD / ANOMALY DETECTION
// ============================================================

function computeFraudPenalty(input: LeaderboardV4Input): { penalty: number; flags: string[] } {
    const flags: string[] = [];
    let severity = 0; // 0-1 scale

    if (input.review_spike_detected) {
        flags.push('review_velocity_spike');
        severity += 0.25; // soft flag
    }

    if (input.job_burst_detected) {
        flags.push('job_completion_burst');
        severity += 0.25;
    }

    if (input.endorsement_loop_detected) {
        flags.push('endorsement_loop');
        severity += 0.30;
    }

    if (input.manually_flagged) {
        flags.push('manually_flagged');
        severity += 0.50; // hard flag
    }

    // Overlapping flags compound
    severity = Math.min(1, severity);

    // Map severity to multiplier
    // 0.0 → no penalty
    // 0.25 → soft_flag (0.75x)
    // 0.50 → hard_flag (0.40x)
    // 1.0 → fraud (0.10x)
    let multiplier = 1.0;
    if (severity >= 0.75) {
        multiplier = 0.10; // fraud
        flags.push('fraud_level:critical');
    } else if (severity >= 0.50) {
        multiplier = 0.40; // hard flag
        flags.push('fraud_level:hard');
    } else if (severity > 0) {
        multiplier = 0.75; // soft flag
        flags.push('fraud_level:soft');
    }

    // Penalty is negative score contribution (up to -200 points)
    const penalty = -(1 - multiplier) * 1000 * FRAUD_PENALTY_MAX_WEIGHT;

    return { penalty, flags };
}

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

export function computeLeaderboardScoreV4(input: LeaderboardV4Input): LeaderboardV4Output {
    // 1) Compute normalized metrics
    const breakdown: LeaderboardV4Breakdown = {
        verified_job_completions: normJobCompletions(input.completed_jobs_90d),
        on_time_performance: normOnTimePerformance(input.on_time_jobs_90d, input.total_jobs_90d),
        response_speed: normResponseSpeed(input.avg_reply_minutes),
        review_quality: normReviewQuality(
            input.review_count, input.avg_review_score,
            input.review_count_prior, input.review_score_prior
        ),
        coverage_reliability: normCoverageReliability(input.fulfilled_requests, input.accepted_requests),
        recent_activity: normRecentActivity(input.days_since_last_active),
        profile_completeness: normProfileCompleteness(input.profile_completed_fields, input.profile_total_fields),
        peer_endorsements: normPeerEndorsements(input.verified_endorsements),
    };

    // 2) Weighted sum (0-1 range)
    const rawNormalized =
        breakdown.verified_job_completions * WEIGHTS.verified_job_completions +
        breakdown.on_time_performance * WEIGHTS.on_time_performance +
        breakdown.response_speed * WEIGHTS.response_speed +
        breakdown.review_quality * WEIGHTS.review_quality +
        breakdown.coverage_reliability * WEIGHTS.coverage_reliability +
        breakdown.recent_activity * WEIGHTS.recent_activity +
        breakdown.profile_completeness * WEIGHTS.profile_completeness +
        breakdown.peer_endorsements * WEIGHTS.peer_endorsements;

    // 3) Scale to 0-1000
    let rawScore = rawNormalized * 1000;

    // 4) Apply fraud penalty
    const { penalty, flags } = computeFraudPenalty(input);
    let finalScore = rawScore + penalty;

    // 5) Apply probation multiplier for new accounts
    if (input.account_age_days < PROBATION_DAYS) {
        finalScore *= PROBATION_MULTIPLIER;
        flags.push('probation_active');
    }

    // 6) Apply unverified cap
    if (input.verification_tier === 0) {
        finalScore = Math.min(finalScore, UNVERIFIED_CAP);
        if (rawScore > UNVERIFIED_CAP) flags.push('unverified_cap_applied');
    }

    // 7) Clamp to 0-1000
    finalScore = Math.max(0, Math.min(1000, Math.round(finalScore)));

    // 8) Determine tier
    let rankTier: LeaderboardV4Output['rank_tier'];
    if (finalScore >= TIER_CUTOFFS.elite) rankTier = 'elite';
    else if (finalScore >= TIER_CUTOFFS.pro) rankTier = 'pro';
    else if (finalScore >= TIER_CUTOFFS.verified) rankTier = 'verified';
    else if (finalScore >= TIER_CUTOFFS.developing) rankTier = 'developing';
    else rankTier = 'new';

    return {
        user_id: input.user_id,
        raw_score: Math.round(rawScore),
        final_score: finalScore,
        rank_tier: rankTier,
        breakdown,
        fraud_flags: flags,
        fraud_penalty_applied: Math.round(penalty),
    };
}

// ============================================================
// VELOCITY ANOMALY DETECTORS (pre-compute for input)
// ============================================================

/**
 * Detect review velocity spikes.
 * Flag if reviews in last 7d > 3x the 30d average rate.
 */
export async function detectReviewSpike(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [r7, r30] = await Promise.all([
        supabase.from('reviews').select('id', { count: 'exact', head: true })
            .eq('target_user_id', userId).gte('created_at', d7),
        supabase.from('reviews').select('id', { count: 'exact', head: true })
            .eq('target_user_id', userId).gte('created_at', d30),
    ]);

    const count7d = r7.count || 0;
    const count30d = r30.count || 0;
    const avgPer7d = (count30d / 30) * 7;

    return count7d > 3 && count7d > avgPer7d * 3;
}

/**
 * Detect job completion bursts.
 * Flag if completions in last 3d > 4x the 14d average rate.
 */
export async function detectJobBurst(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const d3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [r3, r14] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true })
            .eq('operator_id', userId).eq('status', 'completed').gte('completed_at', d3),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
            .eq('operator_id', userId).eq('status', 'completed').gte('completed_at', d14),
    ]);

    const count3d = r3.count || 0;
    const count14d = r14.count || 0;
    const avgPer3d = (count14d / 14) * 3;

    return count3d > 2 && count3d > avgPer3d * 4;
}

/**
 * Detect endorsement loops (A endorses B, B endorses A).
 */
export async function detectEndorsementLoop(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    // Get users this person endorsed
    const { data: given } = await supabase
        .from('endorsements')
        .select('target_user_id')
        .eq('user_id', userId);

    if (!given?.length) return false;

    const targetIds = given.map(e => e.target_user_id);

    // Check if any of them endorsed back
    const { count } = await supabase
        .from('endorsements')
        .select('id', { count: 'exact', head: true })
        .in('user_id', targetIds)
        .eq('target_user_id', userId);

    // Flag if >50% are reciprocal
    return (count || 0) > targetIds.length * 0.5;
}

// ============================================================
// TIER LABEL HELPERS
// ============================================================

export function tierLabel(tier: LeaderboardV4Output['rank_tier']): string {
    const labels = {
        elite: '🏆 Elite',
        pro: '⭐ Pro',
        verified: '✅ Verified',
        developing: '📈 Developing',
        new: '🆕 New',
    };
    return labels[tier] || tier;
}

export function tierColor(tier: LeaderboardV4Output['rank_tier']): string {
    const colors = {
        elite: '#FFD700',
        pro: '#C0C0C0',
        verified: '#4ADE80',
        developing: '#60A5FA',
        new: '#94A3B8',
    };
    return colors[tier] || '#94A3B8';
}
