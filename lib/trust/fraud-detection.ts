/**
 * Review Fraud Detection Engine (Rule-Based v1)
 *
 * Scores fraud probability 0-1 per review.
 * Integrates with Trust Score: fraudulent reviews excluded.
 *
 * Actions:
 *  >= 0.85 → auto-hold for moderation
 *  >= 0.65 → shadow weight reduce
 *  >= 0.45 → flag for review
 */

export type FraudSignals = {
    // Behavioral
    reviewerReviewsToday: number;
    reviewerTotalReviews: number;
    reviewerAccountAgeDays: number;
    reviewerTrustScore: number;        // 0-1000

    // Linguistic
    textSimilarityToOtherReviews: number;  // 0-1 (1 = identical)
    sentimentExtreme: boolean;             // all-5s or all-1s
    repeatedPhraseScore: number;           // 0-1

    // Network
    sharedIpWithProvider: boolean;
    sameDeviceFingerprint: boolean;
    reviewerProviderGraphDensity: number;  // 0-1 (many mutual connections = suspicious)

    // Temporal
    burstPatternDetected: boolean;         // many reviews in short window
    offHoursAnomaly: boolean;              // review posted at 3am local
};

export type FraudResult = {
    fraudScore: number;             // 0-1
    action: 'auto_hold' | 'shadow_reduce' | 'flag' | 'pass';
    signals: string[];
};

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

export function detectReviewFraud(s: FraudSignals): FraudResult {
    const signals: string[] = [];

    // 1) Velocity spike (0-1)
    let velocitySpike = 0;
    if (s.reviewerReviewsToday >= 5) {
        velocitySpike = 1.0;
        signals.push(`${s.reviewerReviewsToday} reviews today — extreme velocity.`);
    } else if (s.reviewerReviewsToday >= 3) {
        velocitySpike = 0.7;
        signals.push(`${s.reviewerReviewsToday} reviews today — elevated velocity.`);
    } else if (s.reviewerReviewsToday >= 2) {
        velocitySpike = 0.3;
    }

    // 2) Account newness (0-1)
    let accountNewness = 0;
    if (s.reviewerAccountAgeDays < 3) {
        accountNewness = 1.0;
        signals.push('Account less than 3 days old.');
    } else if (s.reviewerAccountAgeDays < 14) {
        accountNewness = 0.6;
        signals.push('Account less than 2 weeks old.');
    } else if (s.reviewerAccountAgeDays < 30) {
        accountNewness = 0.3;
    }

    // Low trust amplifier
    if (s.reviewerTrustScore < 100) {
        accountNewness = clamp(accountNewness + 0.2);
        signals.push('Very low trust score.');
    }

    // 3) Text similarity cluster (0-1)
    const textSimilarity = s.textSimilarityToOtherReviews;
    if (textSimilarity > 0.8) signals.push('Text highly similar to other reviews.');

    // Sentiment extreme adds to text signal
    let textCluster = textSimilarity;
    if (s.sentimentExtreme) {
        textCluster = clamp(textCluster + 0.2);
        signals.push('Sentiment extreme (all max or all min).');
    }
    if (s.repeatedPhraseScore > 0.5) {
        textCluster = clamp(textCluster + 0.15);
        signals.push('Repeated phrases detected.');
    }

    // 4) Network overlap (0-1)
    let networkOverlap = s.reviewerProviderGraphDensity;
    if (s.sharedIpWithProvider) {
        networkOverlap = clamp(networkOverlap + 0.4);
        signals.push('Shared IP with reviewed provider.');
    }
    if (s.sameDeviceFingerprint) {
        networkOverlap = clamp(networkOverlap + 0.3);
        signals.push('Same device fingerprint.');
    }

    // 5) Burst pattern (0-1)
    let burstPattern = 0;
    if (s.burstPatternDetected) {
        burstPattern = 0.8;
        signals.push('Burst pattern detected.');
    }
    if (s.offHoursAnomaly) {
        burstPattern = clamp(burstPattern + 0.2);
        signals.push('Off-hours anomaly.');
    }

    // Weighted formula
    const fraudScore = clamp(
        (velocitySpike * 0.20) +
        (accountNewness * 0.15) +
        (textCluster * 0.20) +
        (networkOverlap * 0.25) +
        (burstPattern * 0.20),
    );

    // Action
    let action: FraudResult['action'] = 'pass';
    if (fraudScore >= 0.85) action = 'auto_hold';
    else if (fraudScore >= 0.65) action = 'shadow_reduce';
    else if (fraudScore >= 0.45) action = 'flag';

    return {
        fraudScore: Math.round(fraudScore * 100) / 100,
        action,
        signals,
    };
}
