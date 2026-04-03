// ════════════════════════════════════════════════════════════════
// lib/claims/readiness.ts
// Claim Readiness Scoring + Outreach Sequence
// Migrated from lib/claim-engine.ts (root)
// ════════════════════════════════════════════════════════════════

// ── Readiness Input ──
export interface ClaimReadinessInput {
    listingAgeDays: number;          // how long the page has existed
    countryTier: 'gold' | 'blue' | 'silver' | 'slate';
    surfaceImportance: number;       // 0-1 (metro=high, rural=low)
    corridorImportance: number;      // 0-1 (major corridor=high)
    keywordOpportunity: number;      // 0-1 (search volume potential)
    internalImpressions: number;     // times shown in directory/search
    internalViews: number;           // actual page visits
    contactQuality: number;          // 0-1 (has phone/email/website?)
    dataQuality: number;             // 0-1 (name/address/category completeness)
    businessConfidence: number;      // 0-1 (real business? verified signals?)
    monetizationPotential: number;   // 0-1 (high-value category/territory?)
    surfaceLinkage: boolean;
    corridorLinkage: boolean;
    mapInclusion: boolean;
    searchInclusion: boolean;
    pagePublished: boolean;
}

export type OutreachReadiness = 'outreach_now' | 'outreach_normal' | 'passive_only' | 'wait';

export function calculateClaimReadiness(input: ClaimReadinessInput): {
    score: number;
    readiness: OutreachReadiness;
    reasons: string[];
} {
    const reasons: string[] = [];
    const tierMultiplier = { gold: 1.0, blue: 0.85, silver: 0.7, slate: 0.55 }[input.countryTier];
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

    // Activity proof (15 points max)
    score += Math.min(5, input.internalImpressions * 0.5);
    score += Math.min(5, input.internalViews * 1.0);

    // Maturity (10 points max)
    score += Math.min(10, input.listingAgeDays * 0.5);

    score = Math.round(score * tierMultiplier);

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

// ── Outreach Sequence ──
export type OutreachEmailStep =
    | 'ownership_notice'
    | 'proof_of_presence'
    | 'report_card_activation'
    | 'competitor_pressure'
    | 'missed_opportunity'
    | 'final_reminder';

export const OUTREACH_SEQUENCE: { step: OutreachEmailStep; delayDays: number }[] = [
    { step: 'ownership_notice', delayDays: 0 },
    { step: 'proof_of_presence', delayDays: 3 },
    { step: 'report_card_activation', delayDays: 7 },
    { step: 'competitor_pressure', delayDays: 14 },
    { step: 'missed_opportunity', delayDays: 21 },
    { step: 'final_reminder', delayDays: 30 },
];
