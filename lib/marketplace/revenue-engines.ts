// lib/marketplace/revenue-engines.ts
//
// Haul Command — Revenue Engines
// Spec: Revenue & Compliance Hardening + Marketplace Kill-Shot Layer v1.0.0
//
// 3 engines:
//   1. Urgency Yield — monetize time pressure safely
//   2. Corridor Scarcity — capture value from real coverage gaps
//   3. Scarcity Index — demand/supply pressure signal
//
// Rule: Only activates when market is healthy. Never damages liquidity.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type ScarcityTier = 'normal' | 'tight' | 'constrained' | 'critical';
export type ScarcityBand = 'balanced' | 'tightening' | 'scarce';

export interface UrgencyInput {
    corridor_id: string;
    cls_score: number;
    median_time_to_match_minutes: number;
    baseline_ttm_minutes: number;        // historical average
    demand_backlog_ratio: number;       // demand / supply
    failed_match_rate: number;          // 0-1
    // Safety
    match_rate_pct: number;
    participation_pct: number;
    phantom_supply_flag: boolean;
    country_risk_tier: string;
}

export interface UrgencyResult {
    corridor_id: string;
    urgency_score: number;              // 0-1
    urgency_multiplier: number;         // 1.00-1.65
    enabled: boolean;
    disabled_reasons: string[];
}

export interface ScarcityInput {
    corridor_id: string;
    verified_supply_count: number;
    active_demand_count: number;
    failed_match_attempts: number;
    response_latency_minutes: number;
    // Safety
    corridor_age_days: number;
    manual_price_override: boolean;
    regulatory_risk_high: boolean;
    demand_norm: number;               // from coverage confidence
    supply_norm: number;               // from coverage confidence
}

export interface ScarcityResult {
    corridor_id: string;
    coverage_gap_score: number;         // 0-1
    scarcity_tier: ScarcityTier;
    scarcity_fee_multiplier: number;    // 1.00-1.30
    enabled: boolean;
    disabled_reasons: string[];
    // Kill-shot layer
    scarcity_index: number;             // 0-1
    scarcity_band: ScarcityBand;
}

// ============================================================
// CONSTANTS
// ============================================================

const URGENCY_THRESHOLDS = {
    // Only monetize when liquidity is healthy
    min_match_rate: 45,
    min_participation: 25,
    // CLS-based multiplier ranges
    cls_bands: [
        { min_cls: 0, max_cls: 44, max_mult: 0 },          // Never monetize weak liquidity
        { min_cls: 45, max_cls: 59, factor: 0.15 },
        { min_cls: 60, max_cls: 74, factor: 0.25 },
        { min_cls: 75, max_cls: 100, factor: 0.40 },
    ],
    hard_cap_multiplier: 1.65,
    max_daily_delta_pct: 18,
};

const SCARCITY_THRESHOLDS = {
    min_verified_supply: 25,
    min_corridor_age_days: 21,
    tiers: [
        { tier: 'normal' as ScarcityTier, max_gap: 0.35, multiplier: 1.00 },
        { tier: 'tight' as ScarcityTier, max_gap: 0.60, multiplier: 1.08 },
        { tier: 'constrained' as ScarcityTier, max_gap: 0.80, multiplier: 1.18 },
        { tier: 'critical' as ScarcityTier, max_gap: 1.00, multiplier: 1.30 },
    ],
    scarcity_index_bands: [
        { band: 'balanced' as ScarcityBand, max_index: 0.60 },
        { band: 'tightening' as ScarcityBand, max_index: 0.85 },
        { band: 'scarce' as ScarcityBand, max_index: 1.00 },
    ],
};

// ============================================================
// UTILITY
// ============================================================

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function normalizeMinMax(v: number, min: number, max: number): number {
    if (max <= min) return 0;
    return clamp((v - min) / (max - min), 0, 1);
}

// ============================================================
// URGENCY YIELD ENGINE
// ============================================================

export function computeUrgency(input: UrgencyInput): UrgencyResult {
    const disabled_reasons: string[] = [];

    // ── Safety locks ──
    if (input.match_rate_pct < URGENCY_THRESHOLDS.min_match_rate) {
        disabled_reasons.push(`Match rate ${input.match_rate_pct}% < ${URGENCY_THRESHOLDS.min_match_rate}%`);
    }
    if (input.participation_pct < URGENCY_THRESHOLDS.min_participation) {
        disabled_reasons.push(`Participation ${input.participation_pct}% < ${URGENCY_THRESHOLDS.min_participation}%`);
    }
    if (input.phantom_supply_flag) {
        disabled_reasons.push('Phantom supply detected');
    }
    if (input.country_risk_tier === 'high') {
        disabled_reasons.push('High-risk country');
    }

    if (disabled_reasons.length > 0) {
        return {
            corridor_id: input.corridor_id,
            urgency_score: 0,
            urgency_multiplier: 1.00,
            enabled: false,
            disabled_reasons,
        };
    }

    // ── Urgency Score ──
    // (TTM delta × 0.45) + (demand backlog × 0.35) + (failed match rate × 0.20)
    const ttmDelta = input.baseline_ttm_minutes > 0
        ? normalizeMinMax(
            (input.median_time_to_match_minutes - input.baseline_ttm_minutes) / input.baseline_ttm_minutes,
            0, 2
        )
        : 0;

    const urgencyScore = clamp(
        ttmDelta * 0.45 +
        normalizeMinMax(input.demand_backlog_ratio, 1, 5) * 0.35 +
        input.failed_match_rate * 0.20,
        0, 1
    );

    // ── Multiplier (CLS-gated) ──
    let factor = 0;
    for (const band of URGENCY_THRESHOLDS.cls_bands) {
        if (input.cls_score >= band.min_cls && input.cls_score <= band.max_cls) {
            factor = band.factor || 0;
            break;
        }
    }

    const multiplier = clamp(
        1.00 + (urgencyScore * factor),
        1.00,
        URGENCY_THRESHOLDS.hard_cap_multiplier
    );

    return {
        corridor_id: input.corridor_id,
        urgency_score: Math.round(urgencyScore * 1000) / 1000,
        urgency_multiplier: Math.round(multiplier * 100) / 100,
        enabled: true,
        disabled_reasons: [],
    };
}

// ============================================================
// CORRIDOR SCARCITY ENGINE + SCARCITY INDEX
// ============================================================

export function computeScarcity(input: ScarcityInput): ScarcityResult {
    const disabled_reasons: string[] = [];

    // ── Safety checks ──
    if (input.verified_supply_count < SCARCITY_THRESHOLDS.min_verified_supply) {
        disabled_reasons.push(`Verified supply ${input.verified_supply_count} < ${SCARCITY_THRESHOLDS.min_verified_supply}`);
    }
    if (input.corridor_age_days < SCARCITY_THRESHOLDS.min_corridor_age_days) {
        disabled_reasons.push(`Corridor age ${input.corridor_age_days}d < ${SCARCITY_THRESHOLDS.min_corridor_age_days}d`);
    }
    if (input.manual_price_override) {
        disabled_reasons.push('Manual price override active');
    }
    if (input.regulatory_risk_high) {
        disabled_reasons.push('Regulatory risk: high');
    }

    // ── Coverage Gap Score ──
    // (demand/supply ratio × 0.50) + (failed matches × 0.30) + (response latency × 0.20)
    const dsRatio = input.verified_supply_count > 0
        ? input.active_demand_count / input.verified_supply_count
        : input.active_demand_count > 0 ? 5 : 0;

    const coverageGapScore = clamp(
        normalizeMinMax(dsRatio, 0.5, 5) * 0.50 +
        normalizeMinMax(input.failed_match_attempts, 0, 20) * 0.30 +
        normalizeMinMax(input.response_latency_minutes, 0, 180) * 0.20,
        0, 1
    );

    // ── Scarcity Tier ──
    let tier: ScarcityTier = 'normal';
    let multiplier = 1.00;
    for (const t of SCARCITY_THRESHOLDS.tiers) {
        if (coverageGapScore <= t.max_gap) {
            tier = t.tier;
            multiplier = t.multiplier;
            break;
        }
    }

    // ── Scarcity Index (Kill-Shot layer) ──
    // demand_norm / max(supply_norm, 0.05), clamped to 0-1
    const scarcityRaw = input.supply_norm > 0.05
        ? input.demand_norm / input.supply_norm
        : input.demand_norm > 0 ? 3.0 : 0;
    const scarcityIndex = clamp(scarcityRaw / 3.0, 0, 1);

    // Scarcity band
    let scarcityBand: ScarcityBand = 'balanced';
    for (const b of SCARCITY_THRESHOLDS.scarcity_index_bands) {
        if (scarcityIndex <= b.max_index) {
            scarcityBand = b.band;
            break;
        }
    }

    return {
        corridor_id: input.corridor_id,
        coverage_gap_score: Math.round(coverageGapScore * 1000) / 1000,
        scarcity_tier: tier,
        scarcity_fee_multiplier: disabled_reasons.length > 0 ? 1.00 : multiplier,
        enabled: disabled_reasons.length === 0,
        disabled_reasons,
        scarcity_index: Math.round(scarcityIndex * 1000) / 1000,
        scarcity_band: scarcityBand,
    };
}

// ============================================================
// PREDICTIVE FILL ENGINE
// ============================================================

export interface FillPredictionInput {
    coverage_confidence: number;       // 0-1
    historical_fill_rate: number;      // 0-1
    operator_proximity_score: number;  // 0-1 (nearest operators)
    responsiveness_factor: number;     // 0-1 (avg reply rate)
    base_eta_minutes: number;
}

export type SlaTier = 'high_confidence' | 'moderate' | 'uncertain';

export interface FillPredictionResult {
    fill_probability: number;          // 0-1
    eta_to_fill_minutes: number;
    sla_tier: SlaTier;
}

export function predictFill(input: FillPredictionInput): FillPredictionResult {
    const fillProbability = clamp(
        input.coverage_confidence * 0.45 +
        input.historical_fill_rate * 0.30 +
        input.operator_proximity_score * 0.15 +
        input.responsiveness_factor * 0.10,
        0, 1
    );

    const etaToFill = Math.round(
        input.base_eta_minutes * (1 - fillProbability * 0.6)
    );

    let slaTier: SlaTier = 'uncertain';
    if (fillProbability >= 0.80) slaTier = 'high_confidence';
    else if (fillProbability >= 0.55) slaTier = 'moderate';

    return {
        fill_probability: Math.round(fillProbability * 1000) / 1000,
        eta_to_fill_minutes: Math.max(5, etaToFill),
        sla_tier: slaTier,
    };
}

// ============================================================
// OPERATOR WAKE-UP ENGINE
// ============================================================

export interface WakeUpInput {
    operator_id: string;
    demand_spike: number;              // 0-1 (local demand increase)
    proximity_score: number;           // 0-1 (distance to demand)
    idle_factor: number;               // 0-1 (how long inactive)
    pings_today: number;
    last_ping_hours_ago: number;
    in_quiet_hours: boolean;
}

export interface WakeUpResult {
    operator_id: string;
    wake_score: number;                // 0-1
    trigger: 'none' | 'geo_ping' | 'high_priority_ping';
    blocked: boolean;
    block_reason?: string;
}

export function evaluateWakeUp(input: WakeUpInput): WakeUpResult {
    // Safeguards
    if (input.in_quiet_hours) {
        return { operator_id: input.operator_id, wake_score: 0, trigger: 'none', blocked: true, block_reason: 'quiet_hours' };
    }
    if (input.pings_today >= 3) {
        return { operator_id: input.operator_id, wake_score: 0, trigger: 'none', blocked: true, block_reason: 'max_pings_today' };
    }
    if (input.last_ping_hours_ago < 6) {
        return { operator_id: input.operator_id, wake_score: 0, trigger: 'none', blocked: true, block_reason: 'cooldown_active' };
    }

    const wakeScore = clamp(
        input.demand_spike * 0.40 +
        input.proximity_score * 0.35 +
        input.idle_factor * 0.25,
        0, 1
    );

    let trigger: 'none' | 'geo_ping' | 'high_priority_ping' = 'none';
    if (wakeScore >= 0.80) trigger = 'high_priority_ping';
    else if (wakeScore >= 0.65) trigger = 'geo_ping';

    return {
        operator_id: input.operator_id,
        wake_score: Math.round(wakeScore * 1000) / 1000,
        trigger,
        blocked: false,
    };
}

// ============================================================
// TRUST GRAPH EXPANSION
// ============================================================

export interface TrustGraphInput {
    broker_account_id: string;
    operator_account_id: string;
    completed_jobs: number;
    positive_feedback: number;
    negative_feedback: number;
    response_speed_factor: number;     // 0-1
    repeat_interactions: number;
}

export interface TrustGraphResult {
    broker_account_id: string;
    operator_account_id: string;
    relationship_strength: number;     // 0-1
    is_preferred_pair: boolean;
}

export function computeRelationshipStrength(input: TrustGraphInput): TrustGraphResult {
    const totalFeedback = input.positive_feedback + input.negative_feedback;
    const positiveFactor = totalFeedback > 0 ? input.positive_feedback / totalFeedback : 0.5;

    const strength = clamp(
        Math.min(1, Math.log1p(input.completed_jobs) / Math.log1p(10)) * 0.50 +
        positiveFactor * 0.25 +
        input.response_speed_factor * 0.15 +
        Math.min(1, input.repeat_interactions / 5) * 0.10,
        0, 1
    );

    return {
        broker_account_id: input.broker_account_id,
        operator_account_id: input.operator_account_id,
        relationship_strength: Math.round(strength * 1000) / 1000,
        is_preferred_pair: strength >= 0.70,
    };
}

// ============================================================
// CONFIDENCE MONETIZATION
// ============================================================

export interface MonetizationEligibility {
    boost_eligible: boolean;
    sla_upgrade_eligible: boolean;
    scarcity_priority_eligible: boolean;
}

export function checkMonetizationEligibility(
    coverageConfidence: number,
    trustScore: number,
    verificationLevel: string
): MonetizationEligibility {
    return {
        boost_eligible: coverageConfidence >= 0.55,
        sla_upgrade_eligible: coverageConfidence >= 0.65 && trustScore >= 60,
        scarcity_priority_eligible: verificationLevel === 'verified' || verificationLevel === 'verified_elite',
    };
}

// ============================================================
// PERSISTENCE
// ============================================================

export async function persistUrgencyMetrics(result: UrgencyResult, snapshotDate: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from('corridor_urgency_metrics').upsert({
        corridor_id: result.corridor_id,
        snapshot_date: snapshotDate,
        urgency_score: result.urgency_score,
        urgency_multiplier: result.urgency_multiplier,
    }, { onConflict: 'corridor_id,snapshot_date' });
}

export async function persistScarcityMetrics(result: ScarcityResult, snapshotDate: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from('corridor_scarcity_metrics').upsert({
        corridor_id: result.corridor_id,
        snapshot_date: snapshotDate,
        coverage_gap_score: result.coverage_gap_score,
        scarcity_tier: result.scarcity_tier,
        scarcity_fee_multiplier: result.scarcity_fee_multiplier,
    }, { onConflict: 'corridor_id,snapshot_date' });
}

export async function persistTrustGraphEdge(result: TrustGraphResult, input: TrustGraphInput): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from('trust_graph_edges').upsert({
        broker_account_id: result.broker_account_id,
        operator_account_id: result.operator_account_id,
        completed_jobs: input.completed_jobs,
        positive_feedback: input.positive_feedback,
        negative_feedback: input.negative_feedback,
        total_interactions: input.completed_jobs + input.repeat_interactions,
        relationship_strength: result.relationship_strength,
        is_preferred_pair: result.is_preferred_pair,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'broker_account_id,operator_account_id' });
}
