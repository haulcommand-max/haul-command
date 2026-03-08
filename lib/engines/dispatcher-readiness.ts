/**
 * Dispatcher Readiness Engine
 * 
 * Determines when a market can support automated dispatch.
 * Mode: build_now_simulation_first — NEVER live without thresholds.
 * 
 * Scans: supply count, demand count, fit confidence, freshness,
 * completion history, legal readiness, dispute rate.
 */

import { type FeatureState, getFeatureState } from './country-gate';

export interface MarketSnapshot {
    market_id: string; // e.g. "US-GA-ATL" or "corridor-I95-FL-GA"
    country_code: string;
    // Supply
    active_operators: number;
    verified_operators: number;
    dispatch_ready_operators: number;
    avg_freshness_score: number;
    avg_response_rate: number;
    // Demand
    active_loads_7d: number;
    avg_loads_per_day: number;
    avg_fill_time_hours: number;
    // Quality
    avg_fit_confidence: number; // 0-1
    completion_rate_30d: number; // 0-1
    dispute_rate_30d: number; // 0-1
    avg_trust_score: number;
    // History
    total_completions_90d: number;
}

export interface ReadinessResult {
    market_id: string;
    readiness_score: number; // 0-100
    mode: 'off' | 'simulation' | 'assisted' | 'live';
    blockers: string[];
    recommendations: string[];
    factors: Record<string, { score: number; weight: number; detail: string }>;
    computed_at: string;
}

// Thresholds for activation
const THRESHOLDS = {
    simulation: {
        min_operators: 5,
        min_verified: 3,
        min_freshness: 40,
        min_completions_90d: 5,
    },
    assisted: {
        min_operators: 15,
        min_verified: 8,
        min_dispatch_ready: 5,
        min_freshness: 55,
        min_completion_rate: 0.7,
        max_dispute_rate: 0.08,
        min_completions_90d: 20,
        min_avg_fit_confidence: 0.6,
    },
    live: {
        min_operators: 30,
        min_verified: 15,
        min_dispatch_ready: 10,
        min_freshness: 65,
        min_completion_rate: 0.85,
        max_dispute_rate: 0.03,
        min_completions_90d: 50,
        min_avg_fit_confidence: 0.75,
        min_avg_response_rate: 0.7,
    },
};

export function assessMarketReadiness(snapshot: MarketSnapshot): ReadinessResult {
    const factors: ReadinessResult['factors'] = {};
    const blockers: string[] = [];
    const recommendations: string[] = [];

    // 1. Supply depth (25%)
    const supplyScore = Math.min(100,
        (snapshot.active_operators * 2) +
        (snapshot.verified_operators * 4) +
        (snapshot.dispatch_ready_operators * 6)
    );
    factors.supply = {
        score: supplyScore,
        weight: 0.25,
        detail: `${snapshot.active_operators} active, ${snapshot.verified_operators} verified, ${snapshot.dispatch_ready_operators} dispatch-ready`,
    };

    // 2. Demand presence (15%)
    const demandScore = Math.min(100,
        (snapshot.active_loads_7d * 3) +
        (snapshot.avg_loads_per_day * 10)
    );
    factors.demand = {
        score: demandScore,
        weight: 0.15,
        detail: `${snapshot.active_loads_7d} loads/7d, ${snapshot.avg_loads_per_day.toFixed(1)} avg/day`,
    };

    // 3. Quality & reliability (25%)
    const qualityScore = Math.min(100,
        (snapshot.completion_rate_30d * 50) +
        (Math.max(0, (1 - snapshot.dispute_rate_30d * 10)) * 30) +
        (snapshot.avg_trust_score / 2)
    );
    factors.quality = {
        score: qualityScore,
        weight: 0.25,
        detail: `${Math.round(snapshot.completion_rate_30d * 100)}% completion, ${(snapshot.dispute_rate_30d * 100).toFixed(1)}% disputes`,
    };

    // 4. Freshness (15%)
    factors.freshness = {
        score: snapshot.avg_freshness_score,
        weight: 0.15,
        detail: `Avg freshness: ${snapshot.avg_freshness_score}`,
    };

    // 5. Fit confidence (20%)
    factors.fit = {
        score: snapshot.avg_fit_confidence * 100,
        weight: 0.20,
        detail: `Avg fit confidence: ${(snapshot.avg_fit_confidence * 100).toFixed(0)}%`,
    };

    // Weighted score
    let readiness_score = 0;
    for (const f of Object.values(factors)) {
        readiness_score += f.score * f.weight;
    }
    readiness_score = Math.round(readiness_score);

    // Check country gate
    const dispatchGate = getFeatureState(snapshot.country_code, 'automated_dispatch');
    if (dispatchGate.state === 'off') {
        blockers.push(`Automated dispatch is OFF for ${snapshot.country_code}`);
    }

    // Determine mode
    let mode: ReadinessResult['mode'] = 'off';

    // Check live thresholds
    const live = THRESHOLDS.live;
    if (
        dispatchGate.state === 'on' &&
        snapshot.active_operators >= live.min_operators &&
        snapshot.verified_operators >= live.min_verified &&
        snapshot.dispatch_ready_operators >= live.min_dispatch_ready &&
        snapshot.avg_freshness_score >= live.min_freshness &&
        snapshot.completion_rate_30d >= live.min_completion_rate &&
        snapshot.dispute_rate_30d <= live.max_dispute_rate &&
        snapshot.total_completions_90d >= live.min_completions_90d &&
        snapshot.avg_fit_confidence >= live.min_avg_fit_confidence &&
        snapshot.avg_response_rate >= live.min_avg_response_rate
    ) {
        mode = 'live';
    }
    // Check assisted thresholds
    else if (
        (dispatchGate.state === 'on' || dispatchGate.state === 'assisted') &&
        snapshot.active_operators >= THRESHOLDS.assisted.min_operators &&
        snapshot.verified_operators >= THRESHOLDS.assisted.min_verified
    ) {
        mode = 'assisted';
        if (snapshot.completion_rate_30d < THRESHOLDS.assisted.min_completion_rate) {
            blockers.push(`Completion rate ${Math.round(snapshot.completion_rate_30d * 100)}% < ${THRESHOLDS.assisted.min_completion_rate * 100}% threshold`);
        }
        if (snapshot.dispute_rate_30d > THRESHOLDS.assisted.max_dispute_rate) {
            blockers.push(`Dispute rate ${(snapshot.dispute_rate_30d * 100).toFixed(1)}% > ${THRESHOLDS.assisted.max_dispute_rate * 100}% threshold`);
        }
    }
    // Check simulation thresholds
    else if (
        (dispatchGate.state !== 'off') &&
        snapshot.active_operators >= THRESHOLDS.simulation.min_operators
    ) {
        mode = 'simulation';
    }

    // Generate recommendations
    if (mode === 'off' || mode === 'simulation') {
        if (snapshot.active_operators < THRESHOLDS.assisted.min_operators) {
            recommendations.push(`Need ${THRESHOLDS.assisted.min_operators - snapshot.active_operators} more active operators for assisted mode`);
        }
        if (snapshot.verified_operators < THRESHOLDS.assisted.min_verified) {
            recommendations.push(`Need ${THRESHOLDS.assisted.min_verified - snapshot.verified_operators} more verified operators`);
        }
        if (snapshot.total_completions_90d < THRESHOLDS.assisted.min_completions_90d) {
            recommendations.push(`Need ${THRESHOLDS.assisted.min_completions_90d - snapshot.total_completions_90d} more completions for trust baseline`);
        }
    }

    return {
        market_id: snapshot.market_id,
        readiness_score,
        mode,
        blockers,
        recommendations,
        factors,
        computed_at: new Date().toISOString(),
    };
}
