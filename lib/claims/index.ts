// ════════════════════════════════════════════════════════════════
// lib/claims/index.ts
// CANONICAL CLAIM ENGINE — Single Public Export Surface
//
// Architecture Decision (Opus, 2026-04-03):
//   lib/claims/claim-engine.ts    = verification mechanics (HOW to verify)
//   lib/claim-engine.ts (root)    = strategic layer (WHAT state to be in)
//   lib/claims/index.ts (this)    = unified export, single import surface
//
// Consumers should import from '@/lib/claims' only.
// lib/claim-engine.ts (root) is DEPRECATED — it re-exports from here.
// ════════════════════════════════════════════════════════════════

// ── Verification Mechanics (HOW to verify) ──────────────────────
// Source: lib/claims/claim-engine.ts
export {
    ClaimEngine,
} from './claim-engine';

export type {
    ClaimStatus,
    VerificationRoute,
    ClaimStepStatus,
    Surface,
    Claim,
    ClaimResult,
    FraudCheckResult,
} from './claim-engine';

// ── Claim State Machine (WHAT STATE the claim is in) ────────────
// Source: migrated from lib/claim-engine.ts (root)
export {
    CLAIM_STATES,
    VERIFICATION_PRIORITY,
    getNextState,
    prequalify,
    calculateCompletion,
    getMilestoneForCompletion,
    getNextMilestone,
    getTrustTier,
    PROFILE_TASK_SCORES,
    MILESTONES,
    NUDGE_SCHEDULES,
} from './state-machine';

export type {
    ClaimState,
    RiskBucket,
    TrustTier,
    MilestoneReward,
    NudgeSchedule,
    PrequalInput,
} from './state-machine';

// ── Monetization Hooks (WHAT it unlocks) ────────────────────────
// Source: migrated from lib/claim-engine.ts (root)
export {
    MONETIZATION_HOOKS,
} from './hooks';

export type {
    MonetizationHook,
} from './hooks';

// ── Claim Readiness Scoring (WHEN to outreach) ──────────────────
// Source: migrated from lib/claim-engine.ts (root)
export {
    calculateClaimReadiness,
    OUTREACH_SEQUENCE,
} from './readiness';

export type {
    ClaimReadinessInput,
    OutreachReadiness,
    OutreachEmailStep,
} from './readiness';

// ── Report Card (PUBLIC SURFACE of claim state) ─────────────────
// Source: migrated from lib/claim-engine.ts (root)
export {
    buildPublicReportCard,
} from './report-card';

export type {
    PublicReportCard,
} from './report-card';

// ── Outreach Engine (AUTOMATED outreach scheduling) ─────────────
// Source: lib/claims/outreach-engine.ts (already here)
export * from './outreach-engine';

// ── Surface Builder (SURFACE to claim mapping) ──────────────────
// Source: lib/claims/surface-builder.ts (already here)
export * from './surface-builder';
