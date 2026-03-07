// lib/marketplace/flywheel-controller.ts
//
// Haul Command — Liquidity Flywheel Controller + Market Seeding Autopilot
// Spec: Liquidity Flywheel Controller v1.0.0 + Market Seeding Autopilot v1.0.0
//
// Autonomous control system:
//   1. Classifies liquidity phase per region
//   2. Chooses interventions
//   3. Gates monetization
//   4. Filters ghost supply / stale demand
//   5. Scores markets for seeding priority
//   6. Sequences geographic expansion

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type LiquidityPhase = 'cold_start' | 'fragile' | 'balanced' | 'high_performance' | 'overheating';
export type SeedingBand = 'immediate_seed' | 'guided_seed' | 'passive_watch' | 'hold';
export type AttractivenessGrade = 'prime' | 'strong' | 'watch' | 'defer';

export interface FlywheelInput {
    // Core signals
    coverage_confidence: number;       // 0-1
    scarcity_index: number;            // 0-1
    fill_probability: number;          // 0-1
    demand_velocity_7d: number;        // normalized
    supply_velocity_7d: number;        // normalized
    operator_idle_ratio: number;       // 0-1
    contact_attempt_rate: number;      // 0-1
    successful_fill_rate: number;      // 0-1
    volatility_score: number;          // 0-1

    // Supporting
    new_operator_signups: number;
    broker_post_rate: number;
    repeat_pair_rate: number;          // 0-1
    geo_density_score: number;         // 0-1
    wake_success_rate: number;         // 0-1
}

export interface FlywheelResult {
    phase: LiquidityPhase;
    interventions: string[];
    monetization_allowed: boolean;
    monetization_block_reasons: string[];
    match_quality_adjustments: MatchQualityResult;
}

export interface MatchQualityResult {
    ghost_supply_filtered: boolean;
    low_responsiveness_penalized: boolean;
    stale_demand_suppressed: boolean;
    adjusted_coverage_confidence: number;
    adjusted_fill_probability: number;
}

export interface MarketSeedInput {
    // Attractiveness signals
    demand_velocity_30d: number;       // 0-1
    geo_density_score: number;         // 0-1
    industrial_activity_index: number; // 0-1
    port_proximity_score: number;      // 0-1
    highway_freight_index: number;     // 0-1
    repeat_pair_rate: number;          // 0-1

    // Current state
    coverage_confidence: number;
    scarcity_index: number;
}

export interface MarketSeedResult {
    attractiveness_score: number;      // 0-1
    attractiveness_grade: AttractivenessGrade;
    liquidity_gap: number;             // 0-1
    seeding_priority: number;          // 0-1
    seeding_band: SeedingBand;
    recommended_actions: string[];
}

// ============================================================
// UTILITY
// ============================================================

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

// ============================================================
// 1. LIQUIDITY PHASE CLASSIFIER
// ============================================================

export function classifyLiquidityPhase(input: FlywheelInput): LiquidityPhase {
    // Overheating takes priority
    if (input.scarcity_index >= 0.90 && input.demand_velocity_7d > 0.80) {
        return 'overheating';
    }

    // High performance
    if (input.coverage_confidence >= 0.75 && input.fill_probability >= 0.75) {
        return 'high_performance';
    }

    // Balanced
    if (input.coverage_confidence >= 0.55 && input.fill_probability >= 0.60) {
        return 'balanced';
    }

    // Fragile
    if (input.coverage_confidence >= 0.35 && input.volatility_score > 0.60) {
        return 'fragile';
    }

    // Cold start
    return 'cold_start';
}

// ============================================================
// 2. INTERVENTION ENGINE
// ============================================================

const PHASE_INTERVENTIONS: Record<LiquidityPhase, string[]> = {
    cold_start: [
        'suppress_paid_boosts',
        'increase_operator_wake_radius',
        'trigger_supply_referrals',
        'enable_low_density_badge',
        'prioritize_new_operator_visibility',
    ],
    fragile: [
        'moderate_operator_wake',
        'enable_soft_broker_prompts',
        'reduce_ranking_penalties',
        'increase_match_exploration',
        'monitor_volatility',
    ],
    balanced: [
        'allow_standard_paid_products',
        'maintain_normal_wake',
        'optimize_best_match',
        'enable_fill_probability_ui',
    ],
    high_performance: [
        'enable_full_monetization',
        'enable_sla_upgrades',
        'enable_scarcity_priority',
        'tighten_quality_filters',
        'boost_trust_graph_weight',
    ],
    overheating: [
        'emergency_operator_wake',
        'expand_search_radius',
        'temporary_quality_relaxation',
        'surge_visibility_for_verified',
        'suppress_low_quality_demand',
    ],
};

// ============================================================
// 3. MONETIZATION GOVERNOR
// ============================================================

function evaluateMonetization(input: FlywheelInput, phase: LiquidityPhase): {
    allowed: boolean;
    reasons: string[];
} {
    const reasons: string[] = [];

    // Hard blocks
    if (input.coverage_confidence < 0.45) {
        reasons.push(`Coverage confidence ${(input.coverage_confidence * 100).toFixed(0)}% < 45% threshold`);
    }
    if (input.operator_idle_ratio > 0.70) {
        reasons.push(`Operator idle ratio ${(input.operator_idle_ratio * 100).toFixed(0)}% too high`);
    }
    if (input.volatility_score > 0.75) {
        reasons.push(`Volatility ${(input.volatility_score * 100).toFixed(0)}% too high`);
    }

    // Minimum conditions for paid
    if (input.coverage_confidence < 0.55) {
        reasons.push(`Coverage confidence < 55% for paid products`);
    }
    if (input.fill_probability < 0.60) {
        reasons.push(`Fill probability < 60% for paid products`);
    }
    if (input.successful_fill_rate < 0.50) {
        reasons.push(`Fill rate < 50% for paid products`);
    }

    // Phase-based gate
    if (phase === 'cold_start' || phase === 'fragile') {
        reasons.push(`Phase '${phase}' prohibits monetization`);
    }

    return {
        allowed: reasons.length === 0,
        reasons,
    };
}

// ============================================================
// 4. MATCH QUALITY GUARD
// ============================================================

function applyMatchQualityGuard(input: FlywheelInput): MatchQualityResult {
    let adjustedCC = input.coverage_confidence;
    let adjustedFP = input.fill_probability;

    const ghostFiltered = input.operator_idle_ratio > 0.60;
    const lowResponsiveness = input.contact_attempt_rate < 0.30;
    const staleDemand = input.demand_velocity_7d < 0.10 && input.broker_post_rate < 0.05;

    // Ghost supply penalty
    if (ghostFiltered) {
        adjustedCC *= 0.80;
        adjustedFP *= 0.85;
    }

    // Low responsiveness penalty
    if (lowResponsiveness) {
        adjustedFP *= 0.90;
    }

    // Stale demand suppression
    if (staleDemand) {
        adjustedCC *= 0.90;
    }

    return {
        ghost_supply_filtered: ghostFiltered,
        low_responsiveness_penalized: lowResponsiveness,
        stale_demand_suppressed: staleDemand,
        adjusted_coverage_confidence: Math.round(clamp(adjustedCC, 0, 1) * 1000) / 1000,
        adjusted_fill_probability: Math.round(clamp(adjustedFP, 0, 1) * 1000) / 1000,
    };
}

// ============================================================
// 5. MAIN FLYWHEEL EVALUATION
// ============================================================

export function evaluateFlywheel(input: FlywheelInput): FlywheelResult {
    const phase = classifyLiquidityPhase(input);
    const interventions = PHASE_INTERVENTIONS[phase];
    const monetization = evaluateMonetization(input, phase);
    const matchQuality = applyMatchQualityGuard(input);

    return {
        phase,
        interventions,
        monetization_allowed: monetization.allowed,
        monetization_block_reasons: monetization.reasons,
        match_quality_adjustments: matchQuality,
    };
}

// ============================================================
// 6. MARKET ATTRACTIVENESS MODEL
// ============================================================

export function scoreMarketAttractiveness(input: MarketSeedInput): MarketSeedResult {
    const attractiveness = clamp(
        input.demand_velocity_30d * 0.30 +
        input.geo_density_score * 0.20 +
        input.industrial_activity_index * 0.15 +
        input.port_proximity_score * 0.10 +
        input.highway_freight_index * 0.10 +
        input.repeat_pair_rate * 0.15,
        0, 1
    );

    let grade: AttractivenessGrade = 'defer';
    if (attractiveness >= 0.75) grade = 'prime';
    else if (attractiveness >= 0.55) grade = 'strong';
    else if (attractiveness >= 0.35) grade = 'watch';

    // Liquidity gap
    const liquidityGap = clamp(
        input.scarcity_index * (1 - input.coverage_confidence),
        0, 1
    );

    // Seeding priority
    const seedingPriority = clamp(
        attractiveness * 0.60 + liquidityGap * 0.40,
        0, 1
    );

    let seedingBand: SeedingBand = 'hold';
    let actions: string[] = [];

    if (seedingPriority >= 0.75) {
        seedingBand = 'immediate_seed';
        actions = ['aggressive_operator_acquisition', 'referral_boost', 'wake_radius_expansion'];
    } else if (seedingPriority >= 0.55) {
        seedingBand = 'guided_seed';
        actions = ['moderate_operator_acquisition', 'targeted_outreach', 'monitor_liquidity'];
    } else if (seedingPriority >= 0.35) {
        seedingBand = 'passive_watch';
        actions = ['organic_growth_only', 'no_paid_push'];
    } else {
        actions = ['no_intervention'];
    }

    return {
        attractiveness_score: Math.round(attractiveness * 1000) / 1000,
        attractiveness_grade: grade,
        liquidity_gap: Math.round(liquidityGap * 1000) / 1000,
        seeding_priority: Math.round(seedingPriority * 1000) / 1000,
        seeding_band: seedingBand,
        recommended_actions: actions,
    };
}

// ============================================================
// 7. CORRIDOR SEEDING SCORE
// ============================================================

export interface CorridorSeedInput {
    corridor_job_flow: number;         // 0-1
    operator_pass_through_rate: number; // 0-1
    port_linkage_strength: number;     // 0-1
    historical_fill_rate: number;      // 0-1
}

export function scoreCorridorForSeeding(input: CorridorSeedInput): {
    corridor_score: number;
    action: 'corridor_domination' | 'corridor_build' | 'corridor_watch';
    actions: string[];
} {
    const score = clamp(
        input.corridor_job_flow * 0.35 +
        input.operator_pass_through_rate * 0.25 +
        input.port_linkage_strength * 0.20 +
        input.historical_fill_rate * 0.20,
        0, 1
    );

    if (score >= 0.75) {
        return {
            corridor_score: Math.round(score * 1000) / 1000,
            action: 'corridor_domination',
            actions: ['prioritize_corridor_cells', 'boost_nearby_operator_visibility', 'enable_corridor_badging'],
        };
    }
    if (score >= 0.50) {
        return {
            corridor_score: Math.round(score * 1000) / 1000,
            action: 'corridor_build',
            actions: ['targeted_operator_wake', 'referral_prompts'],
        };
    }

    return {
        corridor_score: Math.round(score * 1000) / 1000,
        action: 'corridor_watch',
        actions: ['organic_only'],
    };
}

// ============================================================
// 8. EARLY LIQUIDITY PROTECTION
// ============================================================

export interface EarlyProtectionFlags {
    suppress_monetization: boolean;
    expand_match_radius: boolean;
    boost_new_operator: boolean;
    protect_first_10_jobs: boolean;
}

export function evaluateEarlyProtection(
    coverageConfidence: number,
    fillProbability: number,
    operatorAgeDays: number,
    completedJobs: number
): EarlyProtectionFlags {
    return {
        suppress_monetization: coverageConfidence < 0.55,
        expand_match_radius: fillProbability < 0.50,
        boost_new_operator: operatorAgeDays < 14,
        protect_first_10_jobs: completedJobs < 10,
    };
}
