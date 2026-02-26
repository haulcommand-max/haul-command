/**
 * Trust Score v2 — Weighted Reputation Engine
 *
 * Range: 0–1000
 * Update: event-driven + nightly recalculation
 *
 * Components:
 *  - Verification (0-200)
 *  - Review quality (0-300)
 *  - Activity freshness (0-150)
 *  - Intel accuracy (0-150)
 *  - Response SLA (0-100)
 *  - Complaint penalty (0 to -200)
 *
 * Tiers: Elite (850+), Strong (650+), Developing (400+), Unproven (<400)
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type TrustInputs = {
    // Verification
    identityVerified: boolean;
    insuranceVerified: boolean;
    equipmentVerified: boolean;
    twicVerified: boolean;

    // Reviews (weighted by reviewer trust)
    reviews: Array<{
        score: number;           // 1-5 overall rating
        reviewerTrustWeight: number;  // 0-1 (higher = more trusted reviewer)
        createdAt: Date;
    }>;

    // Activity
    lastActivityAt: Date | null;
    lastPostAt: Date | null;
    lastRunAt: Date | null;
    now: Date;

    // Intel accuracy
    confirmedReports: number;
    totalReports: number;

    // Response SLA (last 30d)
    responseMinutesLast30d: number[];  // array of response times in minutes

    // Complaints
    upheldComplaintsLast180d: number;
};

export type TrustResult = {
    total: number;               // 0-1000
    tier: 'elite' | 'strong' | 'developing' | 'unproven';
    breakdown: {
        verification: number;
        reviewQuality: number;
        activityFreshness: number;
        intelAccuracy: number;
        responseSla: number;
        complaintPenalty: number;
    };
};

// ── Helpers ────────────────────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Exponential decay: half-life in days */
function expDecay(daysSince: number, halfLifeDays: number): number {
    return Math.pow(0.5, daysSince / halfLifeDays);
}

/** Recency factor for reviews: 1.0 for today, decays over 90 days */
function recencyFactor(reviewDate: Date, now: Date): number {
    const days = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 7) return 1.0;
    if (days <= 30) return 0.95;
    if (days <= 90) return 0.85;
    if (days <= 180) return 0.70;
    return 0.50;
}

/** Log scale for volume boost */
function logScale(value: number, base = 10): number {
    if (value <= 0) return 0;
    return Math.log(value + 1) / Math.log(base);
}

/** Inverse log scale: lower is better (for response time) */
function inverseLogScale(minutes: number, target = 15): number {
    if (minutes <= target) return 1.0;
    return clamp(target / minutes, 0, 1);
}

function median(arr: number[]): number {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Scorer ─────────────────────────────────────────────────────────────────

export function calculateTrustScore(x: TrustInputs): TrustResult {
    // 1) Verification (0-200)
    let verification = 0;
    if (x.identityVerified) verification += 50;
    if (x.insuranceVerified) verification += 60;
    if (x.equipmentVerified) verification += 40;
    if (x.twicVerified) verification += 50;
    verification = clamp(verification, 0, 200);

    // 2) Review Quality (0-300)
    let reviewQuality = 0;
    if (x.reviews.length > 0) {
        let weightedSum = 0;
        let weightSum = 0;
        for (const r of x.reviews) {
            const recency = recencyFactor(r.createdAt, x.now);
            const weight = r.reviewerTrustWeight * recency;
            weightedSum += r.score * weight;
            weightSum += weight;
        }
        const weightedAvg = weightSum > 0 ? weightedSum / weightSum : 0;

        // Most recent review recency boost
        const sortedReviews = [...x.reviews].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        const mostRecentRecency = recencyFactor(sortedReviews[0].createdAt, x.now);

        // Scale: 5.0 rating * 60 * 1.0 recency = 300
        reviewQuality = clamp(weightedAvg * 60 * mostRecentRecency, 0, 300);
    }

    // 3) Activity Freshness (0-150)
    let activityFreshness = 0;
    const lastActive = x.lastActivityAt || x.lastPostAt || x.lastRunAt;
    if (lastActive) {
        const daysSince = (x.now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        activityFreshness = clamp(150 * expDecay(daysSince, 30), 0, 150);
    }

    // 4) Intel Accuracy (0-150)
    let intelAccuracy = 0;
    if (x.totalReports > 0) {
        const accuracyRatio = x.confirmedReports / x.totalReports;
        const volumeBoost = logScale(x.totalReports, 10);
        intelAccuracy = clamp(accuracyRatio * volumeBoost * 150, 0, 150);
    }

    // 5) Response SLA (0-100)
    let responseSla = 0;
    if (x.responseMinutesLast30d.length > 0) {
        const avgMinutes = median(x.responseMinutesLast30d);
        responseSla = clamp(inverseLogScale(avgMinutes, 15) * 100, 0, 100);
    }

    // 6) Complaint Penalty (0 to -200)
    const complaintPenalty = clamp(-(x.upheldComplaintsLast180d * 40), -200, 0);

    // Total
    const total = clamp(
        Math.round(
            verification + reviewQuality + activityFreshness +
            intelAccuracy + responseSla + complaintPenalty,
        ),
        0, 1000,
    );

    // Tier
    let tier: TrustResult['tier'] = 'unproven';
    if (total >= 850) tier = 'elite';
    else if (total >= 650) tier = 'strong';
    else if (total >= 400) tier = 'developing';

    return {
        total,
        tier,
        breakdown: {
            verification,
            reviewQuality: Math.round(reviewQuality),
            activityFreshness: Math.round(activityFreshness),
            intelAccuracy: Math.round(intelAccuracy),
            responseSla: Math.round(responseSla),
            complaintPenalty,
        },
    };
}

// ── Tier Labels ────────────────────────────────────────────────────────────

export const TRUST_TIERS = {
    elite: { label: 'Elite', minScore: 850, color: '#FFD700' },
    strong: { label: 'Strong', minScore: 650, color: '#22C55E' },
    developing: { label: 'Developing', minScore: 400, color: '#3B82F6' },
    unproven: { label: 'Unproven', minScore: 0, color: '#6B7280' },
} as const;
