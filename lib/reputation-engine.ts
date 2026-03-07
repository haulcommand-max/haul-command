// ════════════════════════════════════════════════════════════════
// HAUL COMMAND REPUTATION ENGINE
// Layer A: Universal Trust Score (8 categories, 100 points)
// Layer B: Role-Specific Capability Modules (5 families, 0-100 each)
// ════════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROLE TAXONOMY — The complete position model
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ROLE_FAMILIES = {
    escort_operations: {
        label: 'Escort Operations',
        subtypes: [
            'lead_escort',
            'chase_escort',
            'dual_role_escort',
            'height_pole_escort',
            'night_advanced_visibility',
            'multi_unit_team',
        ],
    },
    specialized_utility: {
        label: 'Specialized Utility / Line-Lift',
        subtypes: [
            'bucket_truck_escort',
            'line_lift_coordination',
            'overhead_clearance',
            'urban_utility_conflict',
        ],
    },
    route_planning: {
        label: 'Route Planning / Survey',
        subtypes: [
            'route_survey_provider',
            'bridge_clearance_review',
            'multi_state_coordination',
            'engineering_permit_support',
            'route_mapping_obstruction',
        ],
    },
    law_enforcement: {
        label: 'Law Enforcement Coordination',
        subtypes: [
            'police_escort_coordination',
            'state_escort_coordination',
            'municipal_escort_coordination',
            'multi_agency_coordination',
        ],
    },
    support_readiness: {
        label: 'Support / Operational Readiness',
        subtypes: [
            'deadhead_repositioning',
            'layover_multi_day',
            'after_hours_night',
            'weekend_seasonal',
            'high_complexity_urban',
        ],
    },
} as const;

export type RoleFamily = keyof typeof ROLE_FAMILIES;

export type RoleSubtype =
    (typeof ROLE_FAMILIES)[RoleFamily]['subtypes'][number];

// Flat list of all role subtypes for forms/tags
export const ALL_ROLE_SUBTYPES: { family: RoleFamily; subtype: string; label: string }[] = [
    // A. Escort Operations
    { family: 'escort_operations', subtype: 'lead_escort', label: 'Lead Escort / Front PEVO' },
    { family: 'escort_operations', subtype: 'chase_escort', label: 'Chase Escort / Rear PEVO' },
    { family: 'escort_operations', subtype: 'dual_role_escort', label: 'Dual-Role Escort (Lead + Chase)' },
    { family: 'escort_operations', subtype: 'height_pole_escort', label: 'Height Pole Escort' },
    { family: 'escort_operations', subtype: 'night_advanced_visibility', label: 'Night / Advanced Visibility Escort' },
    { family: 'escort_operations', subtype: 'multi_unit_team', label: 'Multi-Unit Escort Team' },
    // B. Specialized Utility
    { family: 'specialized_utility', subtype: 'bucket_truck_escort', label: 'Bucket Truck Escort' },
    { family: 'specialized_utility', subtype: 'line_lift_coordination', label: 'Line Lift / Utility Coordination' },
    { family: 'specialized_utility', subtype: 'overhead_clearance', label: 'Overhead Clearance Support' },
    { family: 'specialized_utility', subtype: 'urban_utility_conflict', label: 'Urban Utility Conflict Support' },
    // C. Route Planning
    { family: 'route_planning', subtype: 'route_survey_provider', label: 'Route Survey Provider' },
    { family: 'route_planning', subtype: 'bridge_clearance_review', label: 'Bridge / Clearance Review' },
    { family: 'route_planning', subtype: 'multi_state_coordination', label: 'Multi-State Route Coordination' },
    { family: 'route_planning', subtype: 'engineering_permit_support', label: 'Engineering / Permit Support' },
    { family: 'route_planning', subtype: 'route_mapping_obstruction', label: 'Route Mapping / Obstruction Planning' },
    // D. Law Enforcement
    { family: 'law_enforcement', subtype: 'police_escort_coordination', label: 'Police Escort Coordination' },
    { family: 'law_enforcement', subtype: 'state_escort_coordination', label: 'State Escort Coordination' },
    { family: 'law_enforcement', subtype: 'municipal_escort_coordination', label: 'Municipal Escort Coordination' },
    { family: 'law_enforcement', subtype: 'multi_agency_coordination', label: 'Multi-Agency Escort Coordination' },
    // E. Support Readiness
    { family: 'support_readiness', subtype: 'deadhead_repositioning', label: 'Deadhead / Repositioning Ready' },
    { family: 'support_readiness', subtype: 'layover_multi_day', label: 'Layover / Multi-Day Ready' },
    { family: 'support_readiness', subtype: 'after_hours_night', label: 'After-Hours / Night Move Ready' },
    { family: 'support_readiness', subtype: 'weekend_seasonal', label: 'Weekend / Seasonal Ready' },
    { family: 'support_readiness', subtype: 'high_complexity_urban', label: 'High-Complexity / Urban Move Ready' },
];

// Required structured fields for every seeded listing
export const REQUIRED_LISTING_FIELDS = [
    'business_type',
    'primary_role_family',
    'secondary_role_family',
    'territory_level',
    'corridor_relevance',
    'support_type',
    'availability_model',
    'complexity_readiness',
    'verification_status',
    'claim_status',
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER A: UNIVERSAL TRUST SCORE — 100 points, 8 categories
// Every profile gets this regardless of role
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const UNIVERSAL_WEIGHTS = {
    identity_ownership: 0.10,       // 10 points
    profile_strength: 0.15,         // 15 points
    verification_compliance: 0.20,  // 20 points
    responsiveness: 0.10,           // 10 points
    reliability: 0.15,              // 15 points
    freshness: 0.10,                // 10 points
    territory_coverage: 0.10,       // 10 points
    dispatch_readiness: 0.10,       // 10 points
} as const;

export type UniversalCategory = keyof typeof UNIVERSAL_WEIGHTS;

export interface UniversalInput {
    // 1. Identity & Ownership (10 pts)
    claimedOwnership: boolean;
    verifiedContactRoute: boolean;
    businessIdentityConfidence: number;  // 0-1
    duplicateResolutionComplete: boolean;

    // 2. Profile Strength (15 pts)
    hasPhoto: boolean;
    hasBio: boolean;
    hasServiceAreas: boolean;
    hasEquipment: boolean;
    hasRoleTags: boolean;
    hasCorridorTags: boolean;
    hasServiceHours: boolean;
    hasSupportingMedia: boolean;

    // 3. Verification & Compliance (20 pts)
    insuranceUploaded: boolean;
    insuranceVerified: boolean;
    licenseUploaded: boolean;
    licenseVerified: boolean;
    vehicleRegistration: boolean;
    specializedCredentials: boolean;  // TWIC, training, etc.
    expiryStatusHealthy: boolean;

    // 4. Responsiveness (10 pts)
    avgResponseTimeMinutes: number;
    missedResponseRate: number;       // 0-1 (lower is better)
    lastActivityDaysAgo: number;

    // 5. Reliability (15 pts)
    completionRate: number;           // 0-1
    cancellationRate: number;         // 0-1 (lower is better)
    disputeRate: number;              // 0-1 (lower is better)
    noShowCount: number;
    acceptedOpportunities: number;
    ignoredOpportunities: number;

    // 6. Freshness (10 pts)
    profileUpdateDaysAgo: number;
    availabilityUpdateDaysAgo: number;
    docRefreshDaysAgo: number;
    lastCheckInDaysAgo: number;

    // 7. Territory Coverage & Fit (10 pts)
    territoriesSelected: number;
    corridorExperienceCount: number;
    surfaceSpecificity: number;       // 0-1 (how precise)
    routeFamiliarityClaimCount: number;

    // 8. Dispatch Readiness (10 pts)
    availabilityStatusSet: boolean;
    readinessSettingsComplete: boolean;
    requiredDocsPresent: boolean;
    roleEquipmentDataComplete: boolean;
    canReceiveOpportunities: boolean;
    currentOperationalStatus: 'active' | 'standby' | 'offline';
}

export interface UniversalScoreResult {
    overallScore: number;              // 0-100
    tier: TrustTier;
    categories: Record<UniversalCategory, {
        score: number;                   // 0-100 for this category
        weightedContribution: number;    // actual points toward overall
        maxContribution: number;         // max possible points
    }>;
    hardGatePassed: boolean;
    hardGateFailures: string[];
}

export type TrustTier = 'elite' | 'strong' | 'verified' | 'basic' | 'unverified';

// ── Hard gate rules ──
// Nobody can be Elite or Strong without meeting these minimums
const HARD_GATES = {
    elite: {
        minIdentity: 80,
        minCompliance: 75,
        minReliability: 70,
    },
    strong: {
        minIdentity: 60,
        minCompliance: 50,
        minReliability: 50,
    },
};

export function computeUniversalScore(input: UniversalInput): UniversalScoreResult {
    const cats: Record<UniversalCategory, number> = {
        identity_ownership: 0,
        profile_strength: 0,
        verification_compliance: 0,
        responsiveness: 0,
        reliability: 0,
        freshness: 0,
        territory_coverage: 0,
        dispatch_readiness: 0,
    };

    // ── 1. Identity & Ownership (raw 0-100) ──
    let identity = 0;
    if (input.claimedOwnership) identity += 30;
    if (input.verifiedContactRoute) identity += 25;
    identity += input.businessIdentityConfidence * 25;
    if (input.duplicateResolutionComplete) identity += 20;
    cats.identity_ownership = Math.min(100, identity);

    // ── 2. Profile Strength (raw 0-100) ──
    const profileChecks = [
        input.hasPhoto, input.hasBio, input.hasServiceAreas,
        input.hasEquipment, input.hasRoleTags, input.hasCorridorTags,
        input.hasServiceHours, input.hasSupportingMedia,
    ];
    cats.profile_strength = Math.min(100, (profileChecks.filter(Boolean).length / profileChecks.length) * 100);

    // ── 3. Verification & Compliance (raw 0-100) ──
    let compliance = 0;
    if (input.insuranceUploaded) compliance += 15;
    if (input.insuranceVerified) compliance += 10;
    if (input.licenseUploaded) compliance += 15;
    if (input.licenseVerified) compliance += 10;
    if (input.vehicleRegistration) compliance += 15;
    if (input.specializedCredentials) compliance += 15;
    if (input.expiryStatusHealthy) compliance += 20;
    cats.verification_compliance = Math.min(100, compliance);

    // ── 4. Responsiveness (raw 0-100) ──
    let responsiveness = 0;
    // Response time scoring (lower is better)
    if (input.avgResponseTimeMinutes <= 5) responsiveness += 40;
    else if (input.avgResponseTimeMinutes <= 15) responsiveness += 30;
    else if (input.avgResponseTimeMinutes <= 60) responsiveness += 15;
    // Missed rate (lower is better)
    responsiveness += Math.max(0, (1 - input.missedResponseRate) * 35);
    // Recency
    if (input.lastActivityDaysAgo <= 1) responsiveness += 25;
    else if (input.lastActivityDaysAgo <= 7) responsiveness += 18;
    else if (input.lastActivityDaysAgo <= 30) responsiveness += 8;
    cats.responsiveness = Math.min(100, responsiveness);

    // ── 5. Reliability (raw 0-100) ──
    let reliability = 0;
    reliability += input.completionRate * 35;
    reliability += Math.max(0, (1 - input.cancellationRate * 3)) * 25;
    reliability += Math.max(0, (1 - input.disputeRate * 5)) * 20;
    reliability += Math.max(0, (1 - Math.min(input.noShowCount, 5) / 5)) * 10;
    const acceptPct = input.acceptedOpportunities + input.ignoredOpportunities > 0
        ? input.acceptedOpportunities / (input.acceptedOpportunities + input.ignoredOpportunities)
        : 0.5;
    reliability += acceptPct * 10;
    cats.reliability = Math.min(100, Math.max(0, reliability));

    // ── 6. Freshness (raw 0-100) ──
    let freshness = 0;
    freshness += decayScore(input.profileUpdateDaysAgo, 7, 30, 90) * 25;
    freshness += decayScore(input.availabilityUpdateDaysAgo, 1, 7, 30) * 30;
    freshness += decayScore(input.docRefreshDaysAgo, 30, 90, 365) * 25;
    freshness += decayScore(input.lastCheckInDaysAgo, 1, 7, 30) * 20;
    cats.freshness = Math.min(100, freshness);

    // ── 7. Territory Coverage & Fit (raw 0-100) ──
    let territory = 0;
    territory += Math.min(30, input.territoriesSelected * 5);
    territory += Math.min(25, input.corridorExperienceCount * 8);
    territory += input.surfaceSpecificity * 25;
    territory += Math.min(20, input.routeFamiliarityClaimCount * 5);
    cats.territory_coverage = Math.min(100, territory);

    // ── 8. Dispatch Readiness (raw 0-100) ──
    let dispatch = 0;
    if (input.availabilityStatusSet) dispatch += 20;
    if (input.readinessSettingsComplete) dispatch += 15;
    if (input.requiredDocsPresent) dispatch += 20;
    if (input.roleEquipmentDataComplete) dispatch += 15;
    if (input.canReceiveOpportunities) dispatch += 15;
    if (input.currentOperationalStatus === 'active') dispatch += 15;
    else if (input.currentOperationalStatus === 'standby') dispatch += 8;
    cats.dispatch_readiness = Math.min(100, dispatch);

    // ── Weighted overall ──
    const categories = {} as UniversalScoreResult['categories'];
    let overallScore = 0;

    for (const [key, weight] of Object.entries(UNIVERSAL_WEIGHTS)) {
        const cat = key as UniversalCategory;
        const rawScore = cats[cat];
        const weightedContribution = Math.round(rawScore * weight);
        const maxContribution = Math.round(100 * weight);
        categories[cat] = { score: Math.round(rawScore), weightedContribution, maxContribution };
        overallScore += weightedContribution;
    }

    overallScore = Math.min(100, Math.round(overallScore));

    // ── Tier determination ──
    let tier: TrustTier;
    const hardGateFailures: string[] = [];

    if (overallScore >= 90) {
        tier = 'elite';
        // Hard gate check
        if (cats.identity_ownership < HARD_GATES.elite.minIdentity) {
            hardGateFailures.push(`Identity below ${HARD_GATES.elite.minIdentity} for Elite`);
            tier = 'strong';
        }
        if (cats.verification_compliance < HARD_GATES.elite.minCompliance) {
            hardGateFailures.push(`Compliance below ${HARD_GATES.elite.minCompliance} for Elite`);
            tier = 'strong';
        }
        if (cats.reliability < HARD_GATES.elite.minReliability) {
            hardGateFailures.push(`Reliability below ${HARD_GATES.elite.minReliability} for Elite`);
            tier = 'strong';
        }
    } else if (overallScore >= 75) {
        tier = 'strong';
    } else if (overallScore >= 50) {
        tier = 'verified';
    } else if (overallScore >= 25) {
        tier = 'basic';
    } else {
        tier = 'unverified';
    }

    // Apply Strong hard gate
    if (tier === 'strong') {
        if (cats.identity_ownership < HARD_GATES.strong.minIdentity) {
            hardGateFailures.push(`Identity below ${HARD_GATES.strong.minIdentity} for Strong`);
            tier = 'verified';
        }
        if (cats.verification_compliance < HARD_GATES.strong.minCompliance) {
            hardGateFailures.push(`Compliance below ${HARD_GATES.strong.minCompliance} for Strong`);
            tier = 'verified';
        }
        if (cats.reliability < HARD_GATES.strong.minReliability) {
            hardGateFailures.push(`Reliability below ${HARD_GATES.strong.minReliability} for Strong`);
            tier = 'verified';
        }
    }

    return {
        overallScore,
        tier,
        categories,
        hardGatePassed: hardGateFailures.length === 0,
        hardGateFailures,
    };
}

// Decay helper: full score at fresh, linear decay, 0 at stale
function decayScore(daysAgo: number, fresh: number, mid: number, stale: number): number {
    if (daysAgo <= fresh) return 1;
    if (daysAgo >= stale) return 0;
    if (daysAgo <= mid) return 1 - ((daysAgo - fresh) / (mid - fresh)) * 0.5;
    return 0.5 - ((daysAgo - mid) / (stale - mid)) * 0.5;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER B: ROLE-SPECIFIC CAPABILITY MODULES — 0-100 each
// Only scored for roles the operator actually claims
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CapabilityModule =
    | 'pevo_readiness'
    | 'specialized_escort_readiness'
    | 'utility_support_readiness'
    | 'route_survey_readiness'
    | 'escort_coordination_readiness';

export const CAPABILITY_LABELS: Record<CapabilityModule, string> = {
    pevo_readiness: 'PEVO Readiness',
    specialized_escort_readiness: 'Specialized Escort Readiness',
    utility_support_readiness: 'Utility Support Readiness',
    route_survey_readiness: 'Route Survey Readiness',
    escort_coordination_readiness: 'Escort Coordination Readiness',
};

// Map role families to capability modules
export const FAMILY_TO_CAPABILITY: Record<RoleFamily, CapabilityModule | null> = {
    escort_operations: 'pevo_readiness',
    specialized_utility: 'utility_support_readiness',
    route_planning: 'route_survey_readiness',
    law_enforcement: 'escort_coordination_readiness',
    support_readiness: null,  // Support roles enhance other scores, no standalone module
};

// ── A. PEVO Readiness ──
export interface PEVOInput {
    vehicleEquipmentReady: number;       // 0-1
    signageVisibilityReady: number;      // 0-1
    routeFamiliarity: number;            // 0-1
    escortRoleExperience: number;        // 0-1
    safetySetupQuality: number;          // 0-1
    operatingWindowFlexibility: number;  // 0-1
    deadheadRepositioningReady: number;  // 0-1
}

const PEVO_WEIGHTS = {
    vehicleEquipmentReady: 0.30,
    routeFamiliarity: 0.20,
    escortRoleExperience: 0.20,
    safetySetupQuality: 0.15,
    operatingWindowFlexibility: 0.10,
    deadheadRepositioningReady: 0.05,
};

export function computePEVOScore(input: PEVOInput): number {
    return clampScore(
        input.vehicleEquipmentReady * PEVO_WEIGHTS.vehicleEquipmentReady * 100
        + input.routeFamiliarity * PEVO_WEIGHTS.routeFamiliarity * 100
        + input.escortRoleExperience * PEVO_WEIGHTS.escortRoleExperience * 100
        + input.safetySetupQuality * PEVO_WEIGHTS.safetySetupQuality * 100
        + input.operatingWindowFlexibility * PEVO_WEIGHTS.operatingWindowFlexibility * 100
        + input.deadheadRepositioningReady * PEVO_WEIGHTS.deadheadRepositioningReady * 100
    );
}

// ── B. Specialized Escort Readiness ──
export interface SpecializedEscortInput {
    heightPoleCapabilityConfirmed: boolean;
    utilityHeavyRouteExperience: number;    // 0-1
    specializedEscortDocumentation: number; // 0-1
    complexCorridorReadiness: number;       // 0-1
    advancedSafetyCompleteness: number;     // 0-1
    difficultRouteHistory: number;          // 0-1
}

export function computeSpecializedEscortScore(input: SpecializedEscortInput): number {
    let score = 0;
    if (input.heightPoleCapabilityConfirmed) score += 25;
    score += input.utilityHeavyRouteExperience * 20;
    score += input.specializedEscortDocumentation * 15;
    score += input.complexCorridorReadiness * 15;
    score += input.advancedSafetyCompleteness * 15;
    score += input.difficultRouteHistory * 10;
    return clampScore(score);
}

// ── C. Utility Support Readiness ──
export interface UtilitySupportInput {
    bucketTruckCapability: boolean;
    utilityCoordinationReadiness: number;  // 0-1
    clearanceSupportReadiness: number;     // 0-1
    engineeringSupportHistory: number;     // 0-1
    urbanConflictManagement: number;       // 0-1
    complexHazardSetupQuality: number;     // 0-1
}

export function computeUtilitySupportScore(input: UtilitySupportInput): number {
    let score = 0;
    if (input.bucketTruckCapability) score += 25;
    score += input.utilityCoordinationReadiness * 20;
    score += input.clearanceSupportReadiness * 15;
    score += input.engineeringSupportHistory * 15;
    score += input.urbanConflictManagement * 15;
    score += input.complexHazardSetupQuality * 10;
    return clampScore(score);
}

// ── D. Route Survey Readiness ──
export interface RouteSurveyInput {
    surveyDocumentationReadiness: number;    // 0-1
    planningCoordinationCapability: number;  // 0-1
    complexityHandlingEvidence: number;      // 0-1
    corridorFamiliarity: number;             // 0-1
    freshnessReadiness: number;              // 0-1
}

export function computeRouteSurveyScore(input: RouteSurveyInput): number {
    return clampScore(
        input.surveyDocumentationReadiness * 25
        + input.planningCoordinationCapability * 25
        + input.complexityHandlingEvidence * 20
        + input.corridorFamiliarity * 15
        + input.freshnessReadiness * 15
    );
}

// ── E. Escort Coordination Readiness ──
export interface EscortCoordinationInput {
    coordinationResponsiveness: number;    // 0-1
    agencyCoverageBreadth: number;         // 0-1
    complexMoveHistory: number;            // 0-1
    processsFamiliarity: number;           // 0-1
    multiAgencyReadiness: number;          // 0-1
}

export function computeEscortCoordinationScore(input: EscortCoordinationInput): number {
    return clampScore(
        input.coordinationResponsiveness * 25
        + input.agencyCoverageBreadth * 25
        + input.complexMoveHistory * 20
        + input.processsFamiliarity * 15
        + input.multiAgencyReadiness * 15
    );
}

function clampScore(raw: number): number {
    return Math.min(100, Math.max(0, Math.round(raw)));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMBINED REPUTATION PROFILE — What gets stored and displayed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ReputationProfile {
    entityId: string;
    // Layer A
    universal: UniversalScoreResult;
    // Layer B — only modules the operator claims
    capabilities: Partial<Record<CapabilityModule, number>>;
    // Badges
    badges: Badge[];
    // Metadata
    primaryRoleFamily: RoleFamily;
    secondaryRoleFamilies: RoleFamily[];
    roleSubtypes: string[];
    lastComputed: string;
}

// ── Badge System ──
export type BadgeType =
    | 'verified_identity'
    | 'insurance_current'
    | 'license_verified'
    | 'twic_certified'
    | 'elite_operator'
    | 'strong_operator'
    | 'height_pole_certified'
    | 'bucket_truck_certified'
    | 'route_survey_certified'
    | 'police_escort_coordinator'
    | 'multi_state_coverage'
    | 'fast_responder'
    | 'night_move_ready'
    | 'high_reliability'
    | 'corridor_veteran';

export interface Badge {
    type: BadgeType;
    label: string;
    earnedAt: string;
    expiresAt?: string;
}

export const BADGE_RULES: Record<BadgeType, { label: string; requirement: string }> = {
    verified_identity: { label: 'Verified Identity', requirement: 'Identity score ≥ 80' },
    insurance_current: { label: 'Insurance Current', requirement: 'Insurance uploaded, verified, not expiring within 30 days' },
    license_verified: { label: 'License Verified', requirement: 'License uploaded and verified' },
    twic_certified: { label: 'TWIC Certified', requirement: 'TWIC credential uploaded and verified' },
    elite_operator: { label: 'Elite Operator', requirement: 'Overall trust ≥ 90, all hard gates passed' },
    strong_operator: { label: 'Strong Operator', requirement: 'Overall trust ≥ 75, all hard gates passed' },
    height_pole_certified: { label: 'Height Pole Certified', requirement: 'Height pole capability confirmed + score ≥ 70' },
    bucket_truck_certified: { label: 'Bucket Truck Certified', requirement: 'Bucket truck capability + utility score ≥ 70' },
    route_survey_certified: { label: 'Route Survey Certified', requirement: 'Route survey score ≥ 70' },
    police_escort_coordinator: { label: 'Police Escort Coordinator', requirement: 'Coordination score ≥ 70' },
    multi_state_coverage: { label: 'Multi-State Coverage', requirement: '3+ states/provinces in territory' },
    fast_responder: { label: 'Fast Responder', requirement: 'Average response time < 10 min' },
    night_move_ready: { label: 'Night Move Ready', requirement: 'Night/advanced visibility role claimed + equipment confirmed' },
    high_reliability: { label: 'High Reliability', requirement: 'Reliability score ≥ 85, 0 no-shows' },
    corridor_veteran: { label: 'Corridor Veteran', requirement: '5+ corridor experience tags' },
};

// ── Score Improvement Suggestions ──
export interface ScoreImprovement {
    action: string;
    category: UniversalCategory | CapabilityModule;
    pointsGained: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

export function getTopImprovements(profile: ReputationProfile, limit: number = 5): ScoreImprovement[] {
    const suggestions: ScoreImprovement[] = [];
    const cats = profile.universal.categories;

    // Identity & Ownership
    if (cats.identity_ownership.score < 100) {
        if (cats.identity_ownership.score < 55) {
            suggestions.push({ action: 'Claim and verify ownership', category: 'identity_ownership', pointsGained: 3, difficulty: 'easy' });
        }
        if (cats.identity_ownership.score < 80) {
            suggestions.push({ action: 'Complete identity verification', category: 'identity_ownership', pointsGained: 2, difficulty: 'easy' });
        }
    }

    // Profile Strength
    if (cats.profile_strength.score < 100) {
        suggestions.push({ action: 'Add photo/logo to your profile', category: 'profile_strength', pointsGained: 2, difficulty: 'easy' });
        suggestions.push({ action: 'Add equipment details', category: 'profile_strength', pointsGained: 2, difficulty: 'easy' });
        suggestions.push({ action: 'Write a business description', category: 'profile_strength', pointsGained: 2, difficulty: 'easy' });
    }

    // Verification — highest weight, biggest impact
    if (cats.verification_compliance.score < 100) {
        if (cats.verification_compliance.score < 40) {
            suggestions.push({ action: 'Upload insurance certificate', category: 'verification_compliance', pointsGained: 7, difficulty: 'medium' });
        }
        if (cats.verification_compliance.score < 70) {
            suggestions.push({ action: 'Upload license/certification', category: 'verification_compliance', pointsGained: 5, difficulty: 'medium' });
        }
    }

    // Freshness
    if (cats.freshness.score < 70) {
        suggestions.push({ action: 'Update your availability status', category: 'freshness', pointsGained: 3, difficulty: 'easy' });
    }

    // Territory
    if (cats.territory_coverage.score < 60) {
        suggestions.push({ action: 'Add corridor experience tags', category: 'territory_coverage', pointsGained: 4, difficulty: 'easy' });
    }

    // Dispatch Readiness
    if (cats.dispatch_readiness.score < 70) {
        suggestions.push({ action: 'Set availability to Active', category: 'dispatch_readiness', pointsGained: 3, difficulty: 'easy' });
    }

    // Capability-specific
    for (const [module, score] of Object.entries(profile.capabilities)) {
        if (score != null && score < 70) {
            const label = CAPABILITY_LABELS[module as CapabilityModule];
            suggestions.push({ action: `Improve ${label} — add role-specific equipment/docs`, category: module as CapabilityModule, pointsGained: 6, difficulty: 'medium' });
        }
    }

    // Sort by points gained (best ROI first), then by difficulty
    return suggestions
        .sort((a, b) => {
            if (b.pointsGained !== a.pointsGained) return b.pointsGained - a.pointsGained;
            const diffOrder = { easy: 0, medium: 1, hard: 2 };
            return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        })
        .slice(0, limit);
}

// ── Typesense Index Payload ──
// These fields should be indexed for search ranking
export interface ReputationSearchPayload {
    trust_score: number;
    trust_tier: TrustTier;
    identity_score: number;
    compliance_score: number;
    reliability_score: number;
    freshness_score: number;
    dispatch_readiness_score: number;
    pevo_readiness?: number;
    specialized_escort_readiness?: number;
    utility_support_readiness?: number;
    route_survey_readiness?: number;
    escort_coordination_readiness?: number;
    role_families: RoleFamily[];
    role_subtypes: string[];
    badge_count: number;
    badge_types: BadgeType[];
    hard_gate_passed: boolean;
}

export function toSearchPayload(profile: ReputationProfile): ReputationSearchPayload {
    return {
        trust_score: profile.universal.overallScore,
        trust_tier: profile.universal.tier,
        identity_score: profile.universal.categories.identity_ownership.score,
        compliance_score: profile.universal.categories.verification_compliance.score,
        reliability_score: profile.universal.categories.reliability.score,
        freshness_score: profile.universal.categories.freshness.score,
        dispatch_readiness_score: profile.universal.categories.dispatch_readiness.score,
        pevo_readiness: profile.capabilities.pevo_readiness,
        specialized_escort_readiness: profile.capabilities.specialized_escort_readiness,
        utility_support_readiness: profile.capabilities.utility_support_readiness,
        route_survey_readiness: profile.capabilities.route_survey_readiness,
        escort_coordination_readiness: profile.capabilities.escort_coordination_readiness,
        role_families: [profile.primaryRoleFamily, ...profile.secondaryRoleFamilies],
        role_subtypes: profile.roleSubtypes,
        badge_count: profile.badges.length,
        badge_types: profile.badges.map(b => b.type),
        hard_gate_passed: profile.universal.hardGatePassed,
    };
}
