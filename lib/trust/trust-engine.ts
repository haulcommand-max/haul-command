
/**
 * Module 6: Trust Layer Spec
 * Purpose: The "Google believes it + users believe it" layer. Verification & Scoring.
 */

export type VerificationTier = 'V0' | 'V1' | 'V2' | 'V3' | 'V4';

export const VERIFICATION_TIERS: Record<VerificationTier, { label: string; reqs: string[] }> = {
    'V0': { label: 'Unverified', reqs: ['Basic listing'] },
    'V1': { label: 'Phone Verified', reqs: ['SMS/Voice confirmation'] },
    'V2': { label: 'Document Verified', reqs: ['Insurance', 'Drivers License', 'Permit Service Acct'] },
    'V3': { label: 'Haul Command Verified', reqs: ['Manual Review', 'Video Interview'] },
    'V4': { label: 'Elite Operator', reqs: ['Performance Threshold > 90', '100+ Jobs'] },
};

export type ActivityMetrics = {
    completedJobs: number;
    reviewRating: number; // 0-5
    medianResponseTimeMinutes: number;
    daysSinceLastActive: number;
};

/**
 * Calculates the Provider Activity Score (0-100).
 * This score decays with inactivity.
 */
export function calculateProviderScore(metrics: ActivityMetrics): number {
    // 1. Raw Component Scores (Normalized to 0-100)

    // Jobs: Cap at 50 jobs for max points in this component
    const jobScore = Math.min(metrics.completedJobs * 2, 100);

    // Rating: 5 stars = 100, 4 stars = 80...
    const ratingScore = metrics.reviewRating * 20;

    // Response: < 15 mins = 100, > 24 hours = 0
    // Decay curve: 100 * (1 / (1 + minutes/60))
    const responseScore = Math.max(0, 100 * (15 / Math.max(15, metrics.medianResponseTimeMinutes)));

    // Activity: Recent is better
    const recentScore = metrics.daysSinceLastActive < 7 ? 100 : Math.max(0, 100 - (metrics.daysSinceLastActive * 2));

    // 2. Weighted Sum
    // Score = (Jobs * 0.35) + (Rating * 0.25) + (Response * 0.15) + (Recent * 0.25)
    let totalScore = (jobScore * 0.35) + (ratingScore * 0.25) + (responseScore * 0.15) + (recentScore * 0.25);

    // 3. Inactivity Decay (Hard Penalty)
    if (metrics.daysSinceLastActive > 60) {
        totalScore = totalScore * 0.5; // Halve score if inactive for 2 months
    }

    return Math.round(totalScore);
}

export function getTierBadge(score: number, verifiedLevel: VerificationTier): string {
    if (verifiedLevel === 'V4') return 'Elite Operator';
    if (verifiedLevel === 'V3') return 'HC Verified';
    if (score > 80) return 'Top Rated';
    return '';
}
