// lib/trust/trust-score-v3.ts
//
// Haul Command — Trust Score v3 + Leaderboard Score
// Spec: Map-First Load Board v1.1.0 (Trust & Leaderboard Integration)
//
// 7-component trust score (0-100) with per-country normalization.
// Leaderboard score (0-1000) with anti-gaming caps and penalties.
// Feeds into: coverage_confidence, map overlays, operator profiles.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type TrustTier = 'unverified' | 'emerging' | 'verified' | 'verified_elite';

export interface TrustInput {
    account_id: string;
    country_iso2: string;
    admin1?: string;

    // Identity signals
    phone_verified: boolean;
    govt_id_verified: boolean;
    business_verified: boolean;

    // Profile signals
    profile_fields_complete_ratio: number;  // 0-1
    service_area_defined: boolean;
    escort_types_defined: boolean;

    // Responsiveness signals
    median_reply_minutes: number;
    reply_rate_24h: number;              // 0-1

    // Completion signals
    verified_completions_30d: number;
    verified_completions_180d: number;
    cancellation_rate: number;           // 0-1

    // Ledger signals
    ledger_reliability_score: number;    // 0-1 (from verified job ledger)
    paid_attestations_ratio: number;     // 0-1
    dispute_rate: number;                // 0-1

    // Community signals
    peer_endorsements_weighted: number;  // 0-1 (weighted by endorser trust)
    report_rate: number;                 // 0-1

    // Anti-gaming signals
    sybil_risk: number;                  // 0-1
    anomaly_score: number;               // 0-1
}

export interface TrustResult {
    account_id: string;
    trust_score: number;          // 0-100
    trust_tier: TrustTier;

    // Component breakdown
    identity_verification: number;
    profile_completeness: number;
    responsiveness: number;
    completion_quality: number;
    ledger_reliability: number;
    community_signal: number;
    anti_gaming_health: number;
}

export interface LeaderboardInput {
    account_id: string;
    trust_score: number;
    verified_completions_30d: number;
    reply_rate_24h: number;
    profile_completeness: number;    // 0-1
    volatility: number;             // 0-1

    // Penalty inputs
    sybil_risk: number;
    ledger_reliability_score: number;
    report_rate: number;
    dispute_rate: number;
}

export interface LeaderboardResult {
    account_id: string;
    leaderboard_score: number;    // 0-1000
    rank?: number;

    // Components
    trust_component: number;
    velocity_component: number;
    responsiveness_component: number;
    profile_component: number;
    stability_component: number;

    // Penalties
    penalties_total: number;
    capped: boolean;
    cap_reason?: string;
}

// ============================================================
// COMPONENT WEIGHTS (from spec)
// ============================================================

const TRUST_WEIGHTS = {
    identity_verification: 0.12,
    profile_completeness: 0.08,
    responsiveness: 0.18,
    completion_quality: 0.20,
    ledger_reliability: 0.22,
    community_signal: 0.10,
    anti_gaming_health: 0.10,
};

const TIER_THRESHOLDS: { tier: TrustTier; min: number; max: number }[] = [
    { tier: 'unverified', min: 0, max: 34 },
    { tier: 'emerging', min: 35, max: 59 },
    { tier: 'verified', min: 60, max: 84 },
    { tier: 'verified_elite', min: 85, max: 100 },
];

// ============================================================
// UTILITY
// ============================================================

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function normalize(v: number, min: number, max: number): number {
    if (max <= min) return 0;
    return clamp((v - min) / (max - min), 0, 1);
}

// ============================================================
// TRUST SCORE COMPUTATION
// ============================================================

export function computeTrustScore(input: TrustInput): TrustResult {
    // ── Identity Verification (0-1) ──
    const identitySignals: number[] = [];
    if (input.phone_verified) identitySignals.push(0.5);
    if (input.govt_id_verified) identitySignals.push(0.3);
    if (input.business_verified) identitySignals.push(0.2);
    const identityScore = identitySignals.reduce((s, v) => s + v, 0);

    // ── Profile Completeness (0-1) ──
    let profileScore = input.profile_fields_complete_ratio * 0.60;
    if (input.service_area_defined) profileScore += 0.20;
    if (input.escort_types_defined) profileScore += 0.20;
    profileScore = clamp(profileScore, 0, 1);

    // ── Responsiveness (0-1) ──
    // Lower median reply = better. Cap excellent at <15min, terrible at >240min
    const replySpeed = 1 - normalize(input.median_reply_minutes, 0, 240);
    const responsivenessScore = clamp(
        replySpeed * 0.60 + input.reply_rate_24h * 0.40,
        0, 1
    );

    // ── Completion Quality (0-1) ──
    // Log-scaled completions + cancellation penalty
    const completions30d = Math.min(1, Math.log1p(input.verified_completions_30d) / Math.log1p(20));
    const completions180d = Math.min(1, Math.log1p(input.verified_completions_180d) / Math.log1p(100));
    const cancelPenalty = input.cancellation_rate * 0.40;
    const completionScore = clamp(
        completions30d * 0.50 + completions180d * 0.30 + (1 - cancelPenalty) * 0.20,
        0, 1
    );

    // ── Ledger Reliability (0-1) ──
    const ledgerScore = clamp(
        input.ledger_reliability_score * 0.60 +
        input.paid_attestations_ratio * 0.25 +
        (1 - input.dispute_rate) * 0.15,
        0, 1
    );

    // ── Community Signal (0-1) ──
    const communityScore = clamp(
        input.peer_endorsements_weighted * 0.70 +
        (1 - input.report_rate) * 0.30,
        0, 1
    );

    // ── Anti-Gaming Health (0-1) ──
    const antiGamingScore = clamp(
        (1 - input.sybil_risk) * 0.60 +
        (1 - input.anomaly_score) * 0.40,
        0, 1
    );

    // ── Weighted sum ──
    const rawScore =
        identityScore * TRUST_WEIGHTS.identity_verification +
        profileScore * TRUST_WEIGHTS.profile_completeness +
        responsivenessScore * TRUST_WEIGHTS.responsiveness +
        completionScore * TRUST_WEIGHTS.completion_quality +
        ledgerScore * TRUST_WEIGHTS.ledger_reliability +
        communityScore * TRUST_WEIGHTS.community_signal +
        antiGamingScore * TRUST_WEIGHTS.anti_gaming_health;

    const trustScore = Math.round(clamp(rawScore * 100, 0, 100) * 100) / 100;

    // ── Tier classification ──
    const trustTier = classifyTier(trustScore);

    return {
        account_id: input.account_id,
        trust_score: trustScore,
        trust_tier: trustTier,
        identity_verification: Math.round(identityScore * 1000) / 1000,
        profile_completeness: Math.round(profileScore * 1000) / 1000,
        responsiveness: Math.round(responsivenessScore * 1000) / 1000,
        completion_quality: Math.round(completionScore * 1000) / 1000,
        ledger_reliability: Math.round(ledgerScore * 1000) / 1000,
        community_signal: Math.round(communityScore * 1000) / 1000,
        anti_gaming_health: Math.round(antiGamingScore * 1000) / 1000,
    };
}

function classifyTier(score: number): TrustTier {
    for (const t of TIER_THRESHOLDS) {
        if (score >= t.min && score <= t.max) return t.tier;
    }
    return 'unverified';
}

// ============================================================
// LEADERBOARD SCORE COMPUTATION
// ============================================================

export function computeLeaderboardScore(input: LeaderboardInput): LeaderboardResult {
    // ── Trust component (0-600) ──
    const trustComponent = input.trust_score * 6.0;

    // ── Verified job velocity (0-250) ──
    const velocityComponent = Math.min(250, 50 * Math.sqrt(input.verified_completions_30d));

    // ── Responsiveness bonus (0-150) ──
    const responsivenessComponent = Math.min(150, 150 * input.reply_rate_24h);

    // ── Profile strength (0-50) ──
    const profileComponent = Math.min(50, 50 * input.profile_completeness);

    // ── Stability bonus (0-100) ──
    const stabilityComponent = Math.min(100, 100 * (1 - input.volatility));

    // ── Raw score ──
    let rawScore = trustComponent + velocityComponent + responsivenessComponent +
        profileComponent + stabilityComponent;

    // ── Penalties ──
    let penalties = 0;
    let capped = false;
    let capReason: string | undefined;

    // Report penalty
    const reportPenalty = 200 * input.report_rate;
    penalties += reportPenalty;

    // Dispute penalty
    const disputePenalty = 250 * input.dispute_rate;
    penalties += disputePenalty;

    rawScore -= penalties;

    // ── Anti-gaming caps ──
    if (input.sybil_risk > 0.6) {
        rawScore = Math.min(rawScore, 350);
        capped = true;
        capReason = 'sybil_cap: sybil_risk > 0.6';
    }

    if (input.ledger_reliability_score < 0.35) {
        rawScore = Math.min(rawScore, 500);
        if (!capped) {
            capped = true;
            capReason = 'low_evidence_cap: ledger_reliability < 0.35';
        }
    }

    const finalScore = Math.round(clamp(rawScore, 0, 1000) * 100) / 100;

    return {
        account_id: input.account_id,
        leaderboard_score: finalScore,
        trust_component: Math.round(trustComponent * 100) / 100,
        velocity_component: Math.round(velocityComponent * 100) / 100,
        responsiveness_component: Math.round(responsivenessComponent * 100) / 100,
        profile_component: Math.round(profileComponent * 100) / 100,
        stability_component: Math.round(stabilityComponent * 100) / 100,
        penalties_total: Math.round(penalties * 100) / 100,
        capped,
        cap_reason: capReason,
    };
}

// ============================================================
// INACTIVITY DECAY
// ============================================================

/**
 * Apply logarithmic decay after 45 days of inactivity.
 * Score degrades slowly, preserving earned trust but penalizing abandonment.
 */
export function applyInactivityDecay(
    currentScore: number,
    daysInactive: number,
    triggerDays: number = 45
): number {
    if (daysInactive <= triggerDays) return currentScore;

    const overdue = daysInactive - triggerDays;
    // Logarithmic decay: score * (1 / (1 + log1p(overdue / 30)))
    const decayFactor = 1 / (1 + Math.log1p(overdue / 30));
    return Math.round(currentScore * decayFactor * 100) / 100;
}

// ============================================================
// PERSISTENCE
// ============================================================

export async function persistTrustScore(result: TrustResult, countryIso2: string, admin1?: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from('trust_score_snapshots').insert({
        account_id: result.account_id,
        trust_score: result.trust_score,
        trust_tier: result.trust_tier,
        identity_verification: result.identity_verification,
        profile_completeness: result.profile_completeness,
        responsiveness: result.responsiveness,
        completion_quality: result.completion_quality,
        ledger_reliability: result.ledger_reliability,
        community_signal: result.community_signal,
        anti_gaming_health: result.anti_gaming_health,
        country_iso2: countryIso2,
        admin1,
    });
}

export async function persistLeaderboardSnapshot(
    result: LeaderboardResult,
    scopeType: string,
    scopeKey: string,
    rank: number
): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from('leaderboard_snapshots').insert({
        scope_type: scopeType,
        scope_key: scopeKey,
        account_id: result.account_id,
        leaderboard_score: result.leaderboard_score,
        rank,
        trust_component: result.trust_component,
        velocity_component: result.velocity_component,
        responsiveness_component: result.responsiveness_component,
        profile_component: result.profile_component,
        stability_component: result.stability_component,
        penalties_total: result.penalties_total,
        capped: result.capped,
        cap_reason: result.cap_reason,
    });
}
