
// loadRank.ts — “Unfair” Smart Sort formula (server-side)
// Combines: freshness, load quality, broker trust, lane density, expected fill speed, backhaul probability
// Output: 0..100 (higher ranks first)

export type LoadRankInputs = {
    postedAtISO: string;

    // 0..1 (from your existing loadQualityGrade function / completeness, etc)
    loadQualityScore01: number;

    // 0..1 (from broker_metrics.trust_score)
    brokerTrustScore01: number;

    // 0..1 (from lanes.lane_density_score_30d)
    laneDensityScore01: number;

    // 0..1 (faster fill => higher)
    expectedFillSpeedIndex01: number;

    // 0..1 (higher chance of good return/backhaul => higher)
    backhaulProbability01: number;

    // Optional knobs
    hasUpfrontRate?: boolean;           // true if rate_amount present
    isBrokerVerifiedTier2Plus?: boolean;// boosts trust
    isLoadComplete?: boolean;           // completeness >= threshold
};

function clamp01(x: number): number {
    return Math.max(0, Math.min(1, x));
}

function minutesSince(iso: string): number {
    const t = Date.parse(iso);
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

// Freshness curve: strong early advantage, then decays.
// - 0 min => ~1.0
// - 60 min => ~0.77
// - 6h => ~0.35
// - 24h => ~0.12
function freshnessScore01(postedAtISO: string): number {
    const m = minutesSince(postedAtISO);
    const halfLifeMin = 240; // 4 hours half-life; tune per niche
    return clamp01(Math.exp(-m / halfLifeMin));
}

// Normalize with gentle non-linearities so extremes matter but not too much
function easeOut(x: number): number {
    x = clamp01(x);
    return 1 - Math.pow(1 - x, 2); // boosts high values
}

export function computeLoadRank100(i: LoadRankInputs): number {
    // Base components (all 0..1)
    const F = freshnessScore01(i.postedAtISO);
    const Q = clamp01(i.loadQualityScore01);
    const T = clamp01(i.brokerTrustScore01);
    const L = clamp01(i.laneDensityScore01);
    const S = clamp01(i.expectedFillSpeedIndex01);
    const B = clamp01(i.backhaulProbability01);

    // “Unfair” weighting — tuned for marketplace gravity:
    // - freshness matters a LOT because it drives clicks + conversions
    // - trust + quality prevent garbage from floating to the top
    // - lane density keeps the board feeling liquid
    // - fill speed + backhaul increase dopamine & retention
    const w = {
        freshness: 0.28,
        quality: 0.18,
        trust: 0.18,
        laneDensity: 0.16,
        fillSpeed: 0.12,
        backhaul: 0.08,
    };

    // Shape components:
    const F2 = easeOut(F);
    const Q2 = easeOut(Q);
    const T2 = easeOut(T);
    const L2 = easeOut(L);
    const S2 = easeOut(S);
    const B2 = easeOut(B);

    let score01 =
        F2 * w.freshness +
        Q2 * w.quality +
        T2 * w.trust +
        L2 * w.laneDensity +
        S2 * w.fillSpeed +
        B2 * w.backhaul;

    // Hard penalties (keeps junk from polluting the top)
    // If load is incomplete or low trust, reduce score (not zero, just downrank).
    const completenessPenalty = i.isLoadComplete === false ? 0.12 : 0.0;
    const lowTrustPenalty = T < 0.35 ? 0.10 : 0.0;
    const lowQualityPenalty = Q < 0.35 ? 0.08 : 0.0;

    score01 = clamp01(score01 - completenessPenalty - lowTrustPenalty - lowQualityPenalty);

    // Boosts (subtle; prevents gaming)
    const upfrontRateBoost = i.hasUpfrontRate ? 0.03 : 0.0; // encourages “Upfront Rate” to beat “Contact for rate”
    const verifiedBrokerBoost = i.isBrokerVerifiedTier2Plus ? 0.02 : 0.0;

    score01 = clamp01(score01 + upfrontRateBoost + verifiedBrokerBoost);

    // Convert to 0..100
    const score100 = Math.round(score01 * 1000) / 10; // 1 decimal
    return score100;
}

// wiring example: compute LoadRank with real backhaul probability
import { computeBackhaulProbability01 } from './backhaul-probability';

export function computeLoadRankWithBackhaul(i: {
    postedAtISO: string;
    loadQualityScore01: number;
    brokerTrustScore01: number;
    laneDensityScore01: number;
    expectedFillSpeedIndex01: number;
    backhaulCtx: Parameters<typeof computeBackhaulProbability01>[0];
    hasUpfrontRate?: boolean;
    isBrokerVerifiedTier2Plus?: boolean;
    isLoadComplete?: boolean;
}) {
    const backhaul01 = computeBackhaulProbability01(i.backhaulCtx);

    return computeLoadRank100({
        postedAtISO: i.postedAtISO,
        loadQualityScore01: i.loadQualityScore01,
        brokerTrustScore01: i.brokerTrustScore01,
        laneDensityScore01: i.laneDensityScore01,
        expectedFillSpeedIndex01: i.expectedFillSpeedIndex01,
        backhaulProbability01: backhaul01,
        hasUpfrontRate: i.hasUpfrontRate,
        isBrokerVerifiedTier2Plus: i.isBrokerVerifiedTier2Plus,
        isLoadComplete: i.isLoadComplete,
    });
}
