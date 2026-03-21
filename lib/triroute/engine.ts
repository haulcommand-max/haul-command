/**
 * TriRoute Engine — Core logic for anti-deadhead routing
 *
 * This module contains the scoring and matching logic used by the TriRoute API.
 * It's extracted here so it can be used by both the API route and the
 * Supabase edge function for pre-computing matches.
 *
 * Architecture:
 *   v1: Spatial proximity query + scoring (current)
 *   v2: VROOM VRP solver integration for true multi-stop optimization
 */

import { calculateDeadheadProfit } from '@/core/calculators/deadhead';

// ── Types ──

export interface TriRouteMatch {
    loadId: string;
    origin: string;
    destination: string;
    corridor: string;
    serviceType: string;
    deadheadMiles: number;
    quotedAmount: number | null;
    ratePerMile: number | null;
    observedDate: string;
    matchScore: number;
    badge: TriRouteBadge;
    profitEstimate: DeadheadProfitEstimate;
}

export type TriRouteBadge = 'PRIME_TRIROUTE' | 'STRONG_MATCH' | 'VIABLE_RETURN';

export interface DeadheadProfitEstimate {
    grossRevenue: number;
    totalExpense: number;
    netProfit: number;
    realRatePerMile: number;
    isProfitable: boolean;
}

export interface TriRouteSummary {
    totalMatches: number;
    avgDeadheadMiles: number | null;
    bestDeadheadMiles: number | null;
    primeMatches: number;
    estimatedSavingsMiles: number;
}

// ── Badge Assignment ──

export function assignTriRouteBadge(deadheadMiles: number): TriRouteBadge {
    if (deadheadMiles < 25) return 'PRIME_TRIROUTE';
    if (deadheadMiles < 50) return 'STRONG_MATCH';
    return 'VIABLE_RETURN';
}

// ── Profit Estimation ──

export function estimateTriRouteProfit(
    deadheadMiles: number,
    quotedAmount: number | null,
    ratePerMile: number | null,
    estimatedCorrMiles: number = 300,
): DeadheadProfitEstimate {
    const paidRate = ratePerMile || (quotedAmount ? quotedAmount / estimatedCorrMiles : 1.75);
    const result = calculateDeadheadProfit({
        paidRate,
        paidMiles: estimatedCorrMiles,
        deadheadMiles,
        mpg: 12,
        fuelCost: 3.50,
        dailyOpCost: 150,
    });

    return {
        grossRevenue: result.grossRevenue,
        totalExpense: result.totalExpense,
        netProfit: result.netProfit,
        realRatePerMile: result.realRatePerMile,
        isProfitable: result.isProfitable,
    };
}

// ── Match Scoring ──

export function scoreTriRouteMatch(
    deadheadMiles: number,
    maxRadiusMiles: number,
    observedDate: string,
    hasQuote: boolean,
): number {
    // Component 1: Proximity (50% weight) — closer = better
    const proximityScore = 1.0 - Math.min(1.0, deadheadMiles / maxRadiusMiles);

    // Component 2: Recency (30% weight)
    const daysSinceObserved = Math.floor(
        (Date.now() - new Date(observedDate).getTime()) / 86400000,
    );
    const recencyScore = daysSinceObserved <= 2 ? 1.0
        : daysSinceObserved <= 7 ? 0.5
        : 0.15;

    // Component 3: Data quality (20% weight)
    const qualityScore = hasQuote ? 1.0 : 0.25;

    return Math.round(
        (proximityScore * 0.50 + recencyScore * 0.30 + qualityScore * 0.20) * 1000,
    ) / 1000;
}

// ── Summary Computation ──

export function computeTriRouteSummary(
    matches: TriRouteMatch[],
    maxRadius: number,
): TriRouteSummary {
    if (matches.length === 0) {
        return {
            totalMatches: 0,
            avgDeadheadMiles: null,
            bestDeadheadMiles: null,
            primeMatches: 0,
            estimatedSavingsMiles: 0,
        };
    }

    return {
        totalMatches: matches.length,
        avgDeadheadMiles: Math.round(
            matches.reduce((s, m) => s + m.deadheadMiles, 0) / matches.length,
        ),
        bestDeadheadMiles: Math.min(...matches.map(m => m.deadheadMiles)),
        primeMatches: matches.filter(m => m.badge === 'PRIME_TRIROUTE').length,
        estimatedSavingsMiles: matches.reduce(
            (s, m) => s + Math.max(0, maxRadius - m.deadheadMiles),
            0,
        ),
    };
}

// ── Configuration ──

export const TRIROUTE_CONFIG = {
    DEFAULT_RADIUS_MILES: 75,
    MAX_RADIUS_MILES: 200,
    DEFAULT_DAYS_AHEAD: 5,
    MAX_DAYS_AHEAD: 14,
    DEFAULT_LIMIT: 5,
    MAX_LIMIT: 20,
    MIN_PARSE_CONFIDENCE: 0.4,
    PRIME_THRESHOLD_MILES: 25,
    STRONG_THRESHOLD_MILES: 50,
} as const;
