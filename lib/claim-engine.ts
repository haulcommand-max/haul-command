// ============================================================
// Claim State Machine — Core claim flow conversion engine
// States: unclaimed → claim_started → otp_verified → ownership_granted
//         → profile_50 → profile_70 → dispatch_eligible → premium
// ============================================================

export const CLAIM_STATES = [
    'unclaimed',
    'claim_started',
    'otp_verified',
    'ownership_granted',
    'profile_started',
    'profile_50',
    'profile_70',
    'verification_pending',
    'partially_verified',
    'dispatch_eligible',
    'premium_trial',
    'premium_paid',
    'reactivation_needed',
    'fraud_review',
    'rejected',
] as const;

export type ClaimState = (typeof CLAIM_STATES)[number];

// ── Verification Routes (priority order) ──
export type VerificationRoute =
    | 'phone_otp'
    | 'email_magic_link'
    | 'website_token'
    | 'document_upload'
    | 'manual_review';

export const VERIFICATION_PRIORITY: VerificationRoute[] = [
    'phone_otp',
    'email_magic_link',
    'website_token',
    'document_upload',
    'manual_review',
];

// ── Risk Buckets ──
export type RiskBucket = 'low' | 'medium' | 'high';

// ── Profile Completion Scoring ──
export const PROFILE_TASK_SCORES: Record<string, number> = {
    verify_phone: 10,
    add_photo: 10,
    set_service_areas: 15,
    upload_insurance: 15,
    upload_license: 10,
    add_equipment: 10,
    write_bio: 5,
    set_availability: 10,
    add_corridor_experience: 5,
    get_first_review: 10,
};

// ── Milestone Definitions ──
export interface MilestoneReward {
    milestone: number;
    rewards: string[];
    unlocks: string[];
}

export const MILESTONES: MilestoneReward[] = [
    {
        milestone: 25,
        rewards: ['Ranking preview'],
        unlocks: ['Profile performance teaser'],
    },
    {
        milestone: 50,
        rewards: ['Stronger search visibility', 'First lead preview'],
        unlocks: ['Search visibility upgrade', 'Lead preview access'],
    },
    {
        milestone: 70,
        rewards: ['Map visibility', 'Dispatch eligibility', 'Trust score activation'],
        unlocks: ['Map placement', 'Dispatch waves', 'Trust badge'],
    },
    {
        milestone: 90,
        rewards: ['Leaderboard priority', 'Premium upsell with proof'],
        unlocks: ['Leaderboard eligibility', 'Full marketplace access'],
    },
];

// ── State Transition Logic ──
export function getNextState(current: ClaimState, event: string): ClaimState | null {
    const transitions: Record<string, Record<string, ClaimState>> = {
        unclaimed: {
            claim_clicked: 'claim_started',
        },
        claim_started: {
            otp_verified: 'otp_verified',
            fraud_detected: 'fraud_review',
        },
        otp_verified: {
            ownership_granted: 'ownership_granted',
            duplicate_conflict: 'fraud_review',
        },
        ownership_granted: {
            profile_started: 'profile_started',
        },
        profile_started: {
            reached_50: 'profile_50',
        },
        profile_50: {
            reached_70: 'profile_70',
        },
        profile_70: {
            verification_submitted: 'verification_pending',
            dispatch_eligible: 'dispatch_eligible',
        },
        verification_pending: {
            partially_verified: 'partially_verified',
            fully_verified: 'dispatch_eligible',
        },
        partially_verified: {
            fully_verified: 'dispatch_eligible',
        },
        dispatch_eligible: {
            trial_started: 'premium_trial',
        },
        premium_trial: {
            converted: 'premium_paid',
            expired: 'dispatch_eligible',
        },
        fraud_review: {
            cleared: 'otp_verified',
            rejected: 'rejected',
        },
        reactivation_needed: {
            reactivated: 'profile_started',
        },
    };

    return transitions[current]?.[event] ?? null;
}

// ── Prequalification (Step 0) ──
export interface PrequalInput {
    surfaceQuality: number; // 0-1
    publicSignals: number; // count of verified public signals
    ipRisk: number; // 0-1 (0=safe, 1=dangerous)
    deviceFingerprint: string;
    rateLimitHits: number;
    referralQuality: number; // 0-1
}

export function prequalify(input: PrequalInput): { path: 'fast' | 'guided' | 'review_heavy'; riskBucket: RiskBucket } {
    const riskScore =
        input.ipRisk * 0.35 +
        (input.rateLimitHits > 3 ? 0.3 : input.rateLimitHits * 0.1) +
        (1 - input.surfaceQuality) * 0.15 +
        (1 - input.referralQuality) * 0.2;

    if (riskScore > 0.6) {
        return { path: 'review_heavy', riskBucket: 'high' };
    }
    if (riskScore > 0.3) {
        return { path: 'guided', riskBucket: 'medium' };
    }
    return { path: 'fast', riskBucket: 'low' };
}

// ── Completion Calculator ──
export function calculateCompletion(completedTasks: string[]): number {
    const maxScore = Object.values(PROFILE_TASK_SCORES).reduce((a, b) => a + b, 0);
    const currentScore = completedTasks.reduce(
        (sum, task) => sum + (PROFILE_TASK_SCORES[task] || 0),
        0
    );
    return Math.min(100, Math.round((currentScore / maxScore) * 100));
}

export function getMilestoneForCompletion(pct: number): MilestoneReward | null {
    return MILESTONES.filter(m => pct >= m.milestone).pop() ?? null;
}

export function getNextMilestone(pct: number): MilestoneReward | null {
    return MILESTONES.find(m => m.milestone > pct) ?? null;
}

// ── Trust Tier Calculation ──
export type TrustTier = 'elite' | 'strong' | 'verified' | 'basic' | 'unverified';

export function getTrustTier(score: number, verificationPct: number): TrustTier {
    if (score >= 90 && verificationPct >= 80) return 'elite';
    if (score >= 75 && verificationPct >= 60) return 'strong';
    if (score >= 50 && verificationPct >= 40) return 'verified';
    if (score >= 25) return 'basic';
    return 'unverified';
}

// ── Nudge Schedule ──
export interface NudgeSchedule {
    situation: string;
    delays: string[];
    channel: ('email' | 'push' | 'sms' | 'voice')[];
}

export const NUDGE_SCHEDULES: NudgeSchedule[] = [
    {
        situation: 'claim_started_no_otp',
        delays: ['15m', '6h', '24h'],
        channel: ['email', 'push'],
    },
    {
        situation: 'ownership_no_profile',
        delays: ['2h', '24h', '72h'],
        channel: ['email', 'push'],
    },
    {
        situation: 'at_50_no_docs',
        delays: ['24h', '72h'],
        channel: ['email', 'push'],
    },
    {
        situation: 'before_doc_expiry',
        delays: ['30d', '7d', '3d', '0d'],
        channel: ['email', 'push', 'voice'],
    },
];

// ── Monetization Hook Definitions ──
export interface MonetizationHook {
    trigger: string;
    offer: string;
    channel: string;
}

export const MONETIZATION_HOOKS: MonetizationHook[] = [
    { trigger: 'otp_verified', offer: '14-day Commander trial', channel: 'in-app' },
    { trigger: 'profile_50', offer: 'Upgrade for more load exposure', channel: 'in-app' },
    { trigger: 'profile_70', offer: 'Start premium trial — dispatch eligible', channel: 'in-app' },
    { trigger: 'first_search_impression', offer: 'See who viewed you with Commander', channel: 'in-app' },
    { trigger: 'first_compare', offer: 'Stand out with priority dispatch', channel: 'in-app' },
    { trigger: 'document_verified', offer: 'Premium trust advantages', channel: 'in-app' },
    { trigger: 'insurance_expiring', offer: 'Partner insurance quote', channel: 'email' },
];
