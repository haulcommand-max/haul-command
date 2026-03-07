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

// ════════════════════════════════════════════════════════════
// CLAIM READINESS SCORING — Web-First Seeded Listing Activation
// Determines when a seeded listing has enough proof to trigger outreach
// ════════════════════════════════════════════════════════════

export interface ClaimReadinessInput {
    listingAgeDays: number;          // how long the page has existed
    countryTier: 'gold' | 'blue' | 'silver' | 'slate'; // market priority
    surfaceImportance: number;       // 0-1 (metro=high, rural=low)
    corridorImportance: number;      // 0-1 (major corridor=high)
    keywordOpportunity: number;      // 0-1 (search volume potential)
    internalImpressions: number;     // times shown in directory/search
    internalViews: number;           // actual page visits
    contactQuality: number;          // 0-1 (has phone/email/website?)
    dataQuality: number;             // 0-1 (name/address/category completeness)
    businessConfidence: number;      // 0-1 (real business? verified signals?)
    monetizationPotential: number;   // 0-1 (high-value category/territory?)
    surfaceLinkage: boolean;         // connected to surfaces?
    corridorLinkage: boolean;        // connected to corridors?
    mapInclusion: boolean;           // visible on map?
    searchInclusion: boolean;        // in Typesense index?
    pagePublished: boolean;          // live SEO page?
}

export type OutreachReadiness = 'outreach_now' | 'outreach_normal' | 'passive_only' | 'wait';

export function calculateClaimReadiness(input: ClaimReadinessInput): {
    score: number;
    readiness: OutreachReadiness;
    reasons: string[];
} {
    const reasons: string[] = [];

    // Country tier multiplier
    const tierMultiplier = { gold: 1.0, blue: 0.85, silver: 0.7, slate: 0.55 }[input.countryTier];

    // Base score from data quality and signals
    let score = 0;

    // Infrastructure readiness (30 points max)
    if (input.pagePublished) { score += 8; } else { reasons.push('Page not published'); }
    if (input.searchInclusion) { score += 6; } else { reasons.push('Not in search index'); }
    if (input.mapInclusion) { score += 5; } else { reasons.push('Not on map'); }
    if (input.surfaceLinkage) { score += 6; } else { reasons.push('No surface linkage'); }
    if (input.corridorLinkage) { score += 5; }

    // Data quality (25 points max)
    score += input.dataQuality * 10;
    score += input.contactQuality * 10;
    score += input.businessConfidence * 5;

    // Opportunity (20 points max)
    score += input.surfaceImportance * 7;
    score += input.corridorImportance * 5;
    score += input.keywordOpportunity * 5;
    score += input.monetizationPotential * 3;

    // Activity proof (15 points max — stronger signal)
    score += Math.min(5, input.internalImpressions * 0.5);
    score += Math.min(5, input.internalViews * 1.0);

    // Maturity (10 points max)
    score += Math.min(10, input.listingAgeDays * 0.5);

    // Apply country tier multiplier
    score = Math.round(score * tierMultiplier);

    // Determine readiness
    let readiness: OutreachReadiness;
    if (score >= 65) {
        readiness = 'outreach_now';
    } else if (score >= 45) {
        readiness = 'outreach_normal';
    } else if (score >= 25) {
        readiness = 'passive_only';
    } else {
        readiness = 'wait';
        reasons.push('Insufficient proof for outreach');
    }

    return { score: Math.min(100, score), readiness, reasons };
}

// ── Outreach email sequence position ──
export type OutreachEmailStep =
    | 'ownership_notice'       // Email 1
    | 'proof_of_presence'      // Email 2
    | 'report_card_activation' // Email 3
    | 'competitor_pressure'    // Email 4
    | 'missed_opportunity'     // Email 5
    | 'final_reminder';        // Email 6

export const OUTREACH_SEQUENCE: { step: OutreachEmailStep; delayDays: number }[] = [
    { step: 'ownership_notice', delayDays: 0 },
    { step: 'proof_of_presence', delayDays: 3 },
    { step: 'report_card_activation', delayDays: 7 },
    { step: 'competitor_pressure', delayDays: 14 },
    { step: 'missed_opportunity', delayDays: 21 },
    { step: 'final_reminder', delayDays: 30 },
];

// ── Report Card (public web fields) ──
export interface PublicReportCard {
    trustScore: number | null;       // null = locked
    trustTier: TrustTier | null;
    complianceStatus: 'verified' | 'incomplete' | 'locked';
    reliabilityStatus: 'active' | 'locked';
    profileStrength: 'strong' | 'moderate' | 'low' | 'incomplete';
    freshnessStatus: 'fresh' | 'stale' | 'not_activated';
    dispatchReadiness: 'eligible' | 'nearly' | 'not_eligible';
}

export function buildPublicReportCard(
    claimed: boolean,
    completionPct: number,
    trustScore: number | null,
    verificationPct: number,
    lastActivityDays: number
): PublicReportCard {
    if (!claimed) {
        return {
            trustScore: null,
            trustTier: null,
            complianceStatus: 'locked',
            reliabilityStatus: 'locked',
            profileStrength: 'incomplete',
            freshnessStatus: 'not_activated',
            dispatchReadiness: 'not_eligible',
        };
    }

    return {
        trustScore: completionPct >= 70 ? trustScore : null,
        trustTier: trustScore ? getTrustTier(trustScore, verificationPct) : null,
        complianceStatus: verificationPct >= 40 ? 'verified' : 'incomplete',
        reliabilityStatus: lastActivityDays <= 30 ? 'active' : 'locked',
        profileStrength:
            completionPct >= 70 ? 'strong' :
                completionPct >= 50 ? 'moderate' :
                    completionPct >= 25 ? 'low' : 'incomplete',
        freshnessStatus:
            lastActivityDays <= 7 ? 'fresh' :
                lastActivityDays <= 30 ? 'stale' : 'not_activated',
        dispatchReadiness:
            completionPct >= 70 && verificationPct >= 40 ? 'eligible' :
                completionPct >= 50 ? 'nearly' : 'not_eligible',
    };
}
