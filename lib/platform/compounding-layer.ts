// ══════════════════════════════════════════════════════════════
// COMPOUNDING LAYER — Self-Healing Marketplace Systems
// Answer Freshness · Currency Guard · Payment Optimizer ·
// Regional Heatmap · All tier-aware
// ══════════════════════════════════════════════════════════════

import { type Tier, TIER_CONFIGS, getCountryTier } from "../config/country-registry";

// ═══════════════════════════════════════════════════════════
// 1. ANSWER FRESHNESS DECAY SYSTEM
// ═══════════════════════════════════════════════════════════

export interface AnswerPage {
    pageId: string;
    countryCode: string;
    url: string;
    lastUpdated: Date;
    sourceCitation?: string;
    changeLogVisible: boolean;
    reviewerBadge?: string;
}

export interface FreshnessResult {
    pageId: string;
    freshnessScore: number; // 0-1
    status: "fresh" | "aging" | "stale" | "expired";
    action: "none" | "schedule_review" | "needs_update" | "reduce_ranking_weight";
    daysSinceUpdate: number;
}

export function computeFreshness(page: AnswerPage): FreshnessResult {
    const tier = getCountryTier(page.countryCode) as Tier;
    const halfLife = TIER_CONFIGS[tier].freshnessHalfLifeDays;
    const ageDays = (Date.now() - page.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const score = Math.exp(-ageDays / halfLife);

    let status: FreshnessResult["status"];
    let action: FreshnessResult["action"];

    if (score >= 0.7) { status = "fresh"; action = "none"; }
    else if (score >= 0.5) { status = "aging"; action = "schedule_review"; }
    else if (score >= 0.35) { status = "stale"; action = "needs_update"; }
    else { status = "expired"; action = "reduce_ranking_weight"; }

    return { pageId: page.pageId, freshnessScore: Math.round(score * 100) / 100, status, action, daysSinceUpdate: Math.round(ageDays) };
}

export function getRefreshSchedule(tier: Tier): { days: number; label: string } {
    const days = TIER_CONFIGS[tier].refreshScheduleDays;
    return { days, label: `Every ${days} days` };
}

export interface FreshnessBatchResult {
    totalPages: number;
    fresh: number;
    aging: number;
    stale: number;
    expired: number;
    immediateActionRequired: string[];
}

export function batchFreshnessAudit(pages: AnswerPage[]): FreshnessBatchResult {
    const results = pages.map(computeFreshness);
    return {
        totalPages: results.length,
        fresh: results.filter(r => r.status === "fresh").length,
        aging: results.filter(r => r.status === "aging").length,
        stale: results.filter(r => r.status === "stale").length,
        expired: results.filter(r => r.status === "expired").length,
        immediateActionRequired: results
            .filter(r => r.status === "expired" || r.status === "stale")
            .map(r => r.pageId),
    };
}

// ═══════════════════════════════════════════════════════════
// 2. CURRENCY VOLATILITY GUARD
// ═══════════════════════════════════════════════════════════

export interface FXRate {
    currency: string;
    currentRate: number;
    ma7: number;  // 7-day moving average
    ma30: number; // 30-day moving average
    lastUpdated: Date;
}

export interface VolatilityAssessment {
    currency: string;
    volatilityLevel: "low" | "medium" | "high";
    deviationPercent: number;
    action: "no_change" | "soft_reprice" | "emergency_reprice";
    smoothingWindowDays: number;
    notifyFinance: boolean;
}

export function assessCurrencyVolatility(rate: FXRate): VolatilityAssessment {
    const deviation = Math.abs((rate.currentRate - rate.ma30) / rate.ma30) * 100;

    if (deviation < 2) {
        return { currency: rate.currency, volatilityLevel: "low", deviationPercent: deviation, action: "no_change", smoothingWindowDays: 0, notifyFinance: false };
    }
    if (deviation < 5) {
        return { currency: rate.currency, volatilityLevel: "medium", deviationPercent: deviation, action: "soft_reprice", smoothingWindowDays: 7, notifyFinance: false };
    }
    return { currency: rate.currency, volatilityLevel: "high", deviationPercent: deviation, action: "emergency_reprice", smoothingWindowDays: 3, notifyFinance: true };
}

export const CURRENCY_GUARDRAILS = {
    maxPriceChangePerDayPercent: 3,
    maxPriceChangePerMonthPercent: 12,
    psychologicalRoundingPreserved: true,
} as const;

export function applyGuardrail(currentPriceLocal: number, newPriceLocal: number): number {
    const changePercent = Math.abs((newPriceLocal - currentPriceLocal) / currentPriceLocal) * 100;
    if (changePercent > CURRENCY_GUARDRAILS.maxPriceChangePerDayPercent) {
        // Clamp to max daily change
        const direction = newPriceLocal > currentPriceLocal ? 1 : -1;
        return currentPriceLocal * (1 + direction * CURRENCY_GUARDRAILS.maxPriceChangePerDayPercent / 100);
    }
    return newPriceLocal;
}

// ═══════════════════════════════════════════════════════════
// 3. PAYMENT SUCCESS RATE OPTIMIZER
// ═══════════════════════════════════════════════════════════

export interface PaymentAttempt {
    countryCode: string;
    method: string;
    success: boolean;
    failureReason?: "soft_decline" | "insufficient_funds" | "invalid_card" | "network_error" | "fraud_block" | "unknown";
    deviceType: "mobile" | "desktop" | "tablet";
    timestamp: Date;
}

export interface PaymentHealthReport {
    countryCode: string;
    tier: Tier;
    successRate: number;
    belowFloor: boolean;
    floor: number;
    topFailureReason: string;
    recommendedActions: string[];
    methodBreakdown: Record<string, { attempts: number; successRate: number }>;
}

export function analyzePaymentHealth(
    countryCode: string,
    attempts: PaymentAttempt[]
): PaymentHealthReport {
    const tier = getCountryTier(countryCode) as Tier;
    const floor = TIER_CONFIGS[tier].paymentSuccessFloor;
    const countryAttempts = attempts.filter(a => a.countryCode === countryCode);
    const successes = countryAttempts.filter(a => a.success);
    const successRate = countryAttempts.length > 0 ? successes.length / countryAttempts.length : 0;

    // Method breakdown
    const methods = [...new Set(countryAttempts.map(a => a.method))];
    const methodBreakdown: Record<string, { attempts: number; successRate: number }> = {};
    for (const method of methods) {
        const ma = countryAttempts.filter(a => a.method === method);
        const ms = ma.filter(a => a.success);
        methodBreakdown[method] = { attempts: ma.length, successRate: ma.length > 0 ? ms.length / ma.length : 0 };
    }

    // Top failure reason
    const failures = countryAttempts.filter(a => !a.success && a.failureReason);
    const reasonCounts: Record<string, number> = {};
    for (const f of failures) {
        reasonCounts[f.failureReason!] = (reasonCounts[f.failureReason!] || 0) + 1;
    }
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

    // Recommended actions
    const actions: string[] = [];
    if (successRate < floor) {
        actions.push("Enable smart retries for soft declines");
        actions.push("Surface alternate payment method on failure");
    }
    if (topReason === "insufficient_funds") {
        actions.push("Offer installment/split payment option");
    }
    if (topReason === "network_error") {
        actions.push("Switch to local payment processor");
    }

    // Method reordering recommendation
    const bestMethod = Object.entries(methodBreakdown).sort((a, b) => b[1].successRate - a[1].successRate)[0];
    if (bestMethod && bestMethod[0] !== methods[0]) {
        actions.push(`Reorder: show ${bestMethod[0]} first (${(bestMethod[1].successRate * 100).toFixed(0)}% success)`);
    }

    return {
        countryCode, tier, successRate, belowFloor: successRate < floor, floor,
        topFailureReason: topReason, recommendedActions: actions, methodBreakdown,
    };
}

export const SMART_RETRY_CONFIG = {
    maxRetries: 2,
    retryTimingMinutes: [10, 1440], // 10 min, then 24 hours
    eligibleReasons: ["soft_decline", "insufficient_funds", "network_error"] as const,
} as const;

// ═══════════════════════════════════════════════════════════
// 4. REGIONAL CONVERSION HEATMAP
// ═══════════════════════════════════════════════════════════

export interface RegionMetrics {
    regionId: string; // country code, state, or metro
    level: "country" | "state" | "metro" | "corridor";
    // Acquisition
    visits: number;
    signups: number;
    claimStarts: number;
    // Activation
    profileCompletionRate: number;
    firstContactSent: number;
    firstJobPosted: number;
    // Monetization
    paidConversionRate: number;
    arpuLocal: number;
    paymentSuccessRate: number;
    // Liquidity
    escortsActive30d: number;
    brokersActive30d: number;
    jobsPosted30d: number;
}

export interface HeatmapResult {
    regionId: string;
    healthScore: number; // 0-1
    zone: "green" | "yellow" | "red";
    recommendation: string;
}

export function computeRegionHealth(metrics: RegionMetrics): HeatmapResult {
    // Normalize counts to 0-1 range (using reasonable global benchmarks)
    const escortNorm = Math.min(1, metrics.escortsActive30d / 50);
    const brokerNorm = Math.min(1, metrics.brokersActive30d / 25);

    const score = (
        0.25 * metrics.paidConversionRate +
        0.20 * metrics.paymentSuccessRate +
        0.20 * escortNorm +
        0.20 * brokerNorm +
        0.15 * metrics.profileCompletionRate
    );

    let zone: HeatmapResult["zone"];
    let recommendation: string;

    if (score >= 0.75) {
        zone = "green";
        recommendation = "Region healthy — consider corridor expansion";
    } else if (score >= 0.45) {
        zone = "yellow";
        recommendation = "Moderate activity — focus on activation and supply growth";
    } else {
        zone = "red";
        recommendation = "Low activity — run local diagnostics, consider marketing push";
    }

    return { regionId: metrics.regionId, healthScore: Math.round(score * 100) / 100, zone, recommendation };
}

export interface HeatmapSnapshot {
    timestamp: Date;
    regions: HeatmapResult[];
    greenCount: number;
    yellowCount: number;
    redCount: number;
    expansionCandidates: string[];
    diagnosticNeeded: string[];
}

export function generateHeatmapSnapshot(allMetrics: RegionMetrics[]): HeatmapSnapshot {
    const regions = allMetrics.map(computeRegionHealth);
    return {
        timestamp: new Date(),
        regions,
        greenCount: regions.filter(r => r.zone === "green").length,
        yellowCount: regions.filter(r => r.zone === "yellow").length,
        redCount: regions.filter(r => r.zone === "red").length,
        expansionCandidates: regions.filter(r => r.zone === "green").map(r => r.regionId),
        diagnosticNeeded: regions.filter(r => r.zone === "red").map(r => r.regionId),
    };
}

// ═══════════════════════════════════════════════════════════
// 5. GLOBAL TRUST GRAPH (Tier-aware)
// ═══════════════════════════════════════════════════════════

export interface TrustNode {
    entityId: string;
    entityType: "escort" | "broker" | "company";
    countryCode: string;
    performanceScore: number;    // 0-1
    reliabilityScore: number;    // 0-1
    reviewQualityScore: number;  // 0-1
    longevityScore: number;      // 0-1
    fraudPenalty: number;        // 0-1 (higher = more fraud signals)
}

export interface TrustScoreResult {
    entityId: string;
    compositeScore: number; // 0-100
    grade: "S" | "A" | "B" | "C" | "D" | "F";
    normalizedForCountry: boolean;
}

export function computeTrustScore(node: TrustNode): TrustScoreResult {
    const raw = (
        0.30 * node.performanceScore +
        0.25 * node.reliabilityScore +
        0.20 * node.reviewQualityScore +
        0.15 * node.longevityScore -
        0.30 * node.fraudPenalty
    );

    const clamped = Math.max(0, Math.min(1, raw));
    const score = Math.round(clamped * 100);

    let grade: TrustScoreResult["grade"];
    if (score >= 95) grade = "S";
    else if (score >= 80) grade = "A";
    else if (score >= 65) grade = "B";
    else if (score >= 50) grade = "C";
    else if (score >= 35) grade = "D";
    else grade = "F";

    return { entityId: node.entityId, compositeScore: score, grade, normalizedForCountry: true };
}

// Fraud detection: velocity check
export interface VelocityCheck {
    entityId: string;
    reviewsLast24h: number;
    bidsLast1h: number;
    accountsFromDeviceLast7d: number;
}

export function checkVelocityAnomaly(check: VelocityCheck): { flagged: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (check.reviewsLast24h > 5) reasons.push("Review burst: >5 reviews in 24h");
    if (check.bidsLast1h > 10) reasons.push("Bid spam: >10 bids in 1h");
    if (check.accountsFromDeviceLast7d > 3) reasons.push("Shared device cluster: >3 accounts in 7d");
    return { flagged: reasons.length > 0, reasons };
}
