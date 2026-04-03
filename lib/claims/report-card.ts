// ════════════════════════════════════════════════════════════════
// lib/claims/report-card.ts
// Public Report Card — migrated from lib/claim-engine.ts (root)
// Provides the public-facing trust surface for any operator listing.
// ════════════════════════════════════════════════════════════════

import { getTrustTier, type TrustTier } from './state-machine';

export interface PublicReportCard {
    trustScore: number | null;
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
