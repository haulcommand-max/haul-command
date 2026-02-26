/**
 * Intel Confidence Model — Waze-style Truth Engine
 *
 * Scores reliability of live corridor/port/zone reports.
 * Range: 0-100
 * Update: real-time on every confirmation/denial + time decay
 *
 * Inputs: reporter accuracy, trust score, votes, age
 * Decay: half-life 90 minutes, auto-expire at 24 hours
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type IntelConfidenceInputs = {
    reporterAccuracyScore: number;  // 0-100
    reporterTrustScore: number;     // 0-1000

    confirmations: Array<{
        voterAccuracyScore: number;
        voterTrustScore: number;
    }>;
    denials: Array<{
        voterAccuracyScore: number;
        voterTrustScore: number;
    }>;

    reportAgeMinutes: number;
};

export type IntelConfidenceResult = {
    confidence: number;           // 0-100
    status: 'active' | 'decaying' | 'expired';
    shouldPing: boolean;          // "still there?" trigger
    autoExpire: boolean;
    reasons: string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function normalize(value: number, min: number, max: number): number {
    if (max <= min) return 0;
    return clamp(((value - min) / (max - min)) * 100, 0, 100) / 100;
}

/** Time decay: half-life in minutes */
function timeDecay(ageMinutes: number, halfLifeMinutes = 90): number {
    return Math.pow(0.5, ageMinutes / halfLifeMinutes);
}

/** Weighted vote score */
function weightedVoteScore(
    voters: Array<{ voterAccuracyScore: number; voterTrustScore: number }>,
): number {
    if (!voters.length) return 0;
    return voters.reduce((sum, v) => {
        const accuracyWeight = normalize(v.voterAccuracyScore, 0, 100);
        const trustWeight = normalize(v.voterTrustScore, 0, 1000);
        return sum + (0.6 * accuracyWeight + 0.4 * trustWeight);
    }, 0);
}

// ── Scorer ─────────────────────────────────────────────────────────────────

const BASE_SCORE = 50;
const HALF_LIFE_MINUTES = 90;
const PING_THRESHOLD_MINUTES = 45;
const AGGRESSIVE_DECAY_HOURS = 6;
const AUTO_EXPIRE_HOURS = 24;

export function calculateIntelConfidence(x: IntelConfidenceInputs): IntelConfidenceResult {
    const reasons: string[] = [];

    // Auto-expire
    if (x.reportAgeMinutes >= AUTO_EXPIRE_HOURS * 60) {
        return {
            confidence: 0,
            status: 'expired',
            shouldPing: false,
            autoExpire: true,
            reasons: ['Report older than 24 hours — auto-expired.'],
        };
    }

    // Reporter bias: higher accuracy/trust = higher starting confidence
    const reporterBias = normalize(x.reporterAccuracyScore, 0, 100) * 15;
    const trustBias = normalize(x.reporterTrustScore, 0, 1000) * 10;

    // Weighted votes
    const confirmWeight = weightedVoteScore(x.confirmations);
    const denyWeight = weightedVoteScore(x.denials);
    const voteDelta = (confirmWeight * 8) - (denyWeight * 10);

    // Time decay
    let halfLife = HALF_LIFE_MINUTES;

    // High-trust reporters decay slower
    if (x.reporterTrustScore >= 650) {
        halfLife = HALF_LIFE_MINUTES * 1.5; // 135 min
        reasons.push('High-trust reporter: slower decay.');
    }

    // After 6 hours, aggressive decay
    if (x.reportAgeMinutes >= AGGRESSIVE_DECAY_HOURS * 60) {
        halfLife = halfLife * 0.5;
        reasons.push('Report >6h old: aggressive decay.');
    }

    const ageDecay = timeDecay(x.reportAgeMinutes, halfLife);

    // Raw score
    const rawScore = BASE_SCORE + reporterBias + trustBias + voteDelta;

    // Apply decay
    const confidence = clamp(Math.round(rawScore * ageDecay));

    // Status
    let status: IntelConfidenceResult['status'] = 'active';
    if (x.reportAgeMinutes >= AGGRESSIVE_DECAY_HOURS * 60) {
        status = 'decaying';
    }

    // "Still there?" ping
    const shouldPing = x.reportAgeMinutes >= PING_THRESHOLD_MINUTES && x.confirmations.length === 0;

    if (shouldPing) reasons.push('No confirmations after 45min — trigger "still there?" ping.');
    if (x.confirmations.length > 0) reasons.push(`${x.confirmations.length} confirmation(s).`);
    if (x.denials.length > 0) reasons.push(`${x.denials.length} denial(s).`);

    return {
        confidence,
        status,
        shouldPing,
        autoExpire: false,
        reasons,
    };
}

// ── Reporter Accuracy Update ───────────────────────────────────────────────

/**
 * Update reporter accuracy after a report outcome is determined.
 * Uses exponential moving average.
 */
export function updateReporterAccuracy(
    currentAccuracy: number,
    wasConfirmed: boolean,
    totalReports: number,
): number {
    const alpha = Math.min(0.3, 2 / (totalReports + 1)); // EMA smoothing
    const outcome = wasConfirmed ? 100 : 0;
    return clamp(Math.round(currentAccuracy * (1 - alpha) + outcome * alpha));
}
