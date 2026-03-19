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

// Re-export verification tiers from the spec file for backwards compat
export { type VerificationTier, VERIFICATION_TIERS, calculateProviderScore, getTierBadge } from './trust-engine';
