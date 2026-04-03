// lib/trust/index.ts — BARREL EXPORT
// ══════════════════════════════════════════════════════════════
// CANONICAL TRUST ENGINE: trust-score-v3.ts
//
// This barrel re-exports the strongest version (V3).
// All other trust files in this directory are deprecated:
//   - trust-engine.ts → V0 spec (types only, no computation)
//   - trust-score.ts → V2 (0-1000 scale, less components)
//   - composite-trust-engine.ts → predecessor, merged into V3
//
// Usage:
//   import { computeTrustScore, computeLeaderboardScore } from "@/lib/trust";
// ══════════════════════════════════════════════════════════════

export {
    // Types
    type TrustTier,
    type TrustInput,
    type TrustResult,
    type LeaderboardInput,
    type LeaderboardResult,

    // Computation
    computeTrustScore,
    computeLeaderboardScore,
    applyInactivityDecay,

    // Persistence
    persistTrustScore,
    persistLeaderboardSnapshot,
} from './trust-score-v3';

// ── Verification Tiers (inlined from trust-engine.ts — now killed) ──

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
    reviewRating: number;
    medianResponseTimeMinutes: number;
    daysSinceLastActive: number;
};

export function calculateProviderScore(metrics: ActivityMetrics): number {
    const jobScore = Math.min(metrics.completedJobs * 2, 100);
    const ratingScore = metrics.reviewRating * 20;
    const responseScore = Math.max(0, 100 * (15 / Math.max(15, metrics.medianResponseTimeMinutes)));
    const recentScore = metrics.daysSinceLastActive < 7 ? 100 : Math.max(0, 100 - (metrics.daysSinceLastActive * 2));
    let totalScore = (jobScore * 0.35) + (ratingScore * 0.25) + (responseScore * 0.15) + (recentScore * 0.25);
    if (metrics.daysSinceLastActive > 60) totalScore = totalScore * 0.5;
    return Math.round(totalScore);
}

export function getTierBadge(score: number, verifiedLevel: VerificationTier): string {
    if (verifiedLevel === 'V4') return 'Elite Operator';
    if (verifiedLevel === 'V3') return 'HC Verified';
    if (score > 80) return 'Top Rated';
    return '';
}
