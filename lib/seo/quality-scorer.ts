/**
 * SEO Page Quality Scoring Engine
 *
 * Determines index/noindex/preview per page variant using:
 *  - Template-specific thresholds (city/corridor/port/category)
 *  - Content depth + unique local facts + internal links
 *  - Marketplace proof signals (28d)
 *  - GSC engagement (28d)
 *  - Language obviousness (mixed-language guard)
 *  - Duplicate/cannibalization risk
 *
 * Demotion engine: demotes indexed pages that become stale, duplicate, or language-drifted.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type TemplateKey = 'city' | 'corridor' | 'port' | 'category';

export type QualityInputs = {
    template: TemplateKey;

    // Content evidence
    wordCount: number;
    uniqueLocalFactsCount: number;
    internalLinksCount: number;
    hasStructuredData: boolean;
    hasOriginalMedia: boolean;

    // Marketplace signals (28d)
    loadsPosted28d: number;
    escortsAvailable28d: number;
    matchesAccepted28d: number;
    jobsCompleted28d: number;
    reviewCount28d: number;
    avgReviewRating28d: number | null;

    // GSC signals (28d)
    gscImpressions28d: number | null;
    gscClicks28d: number | null;
    gscCtr28d: number | null;

    // Health
    languageObviousnessScore: number;
    duplicateRiskScore: number;
    cannibalizationScore: number;
};

export type QualityResult = {
    overall: number;
    helpfulness: number;
    authority: number;
    thinRisk: number;
    recommendedIndexing: 'index' | 'noindex' | 'preview';
    reasons: string[];
};

// ── Template Thresholds ────────────────────────────────────────────────────

type ThresholdConfig = {
    previewThreshold: number;
    indexThreshold: number;
    maxThinRiskToIndex: number;
    minUniqueFactsToIndex: number;
    minInternalLinksToIndex: number;
    minWordCountToIndex: number;
    minMarketProofToIndex?: {
        jobsCompleted28d?: number;
        matchesAccepted28d?: number;
        reviewCount28d?: number;
    };
};

export const THRESHOLDS: Record<TemplateKey, ThresholdConfig> = {
    city: {
        previewThreshold: 38,
        indexThreshold: 68,
        maxThinRiskToIndex: 32,
        minUniqueFactsToIndex: 6,
        minInternalLinksToIndex: 12,
        minWordCountToIndex: 650,
        minMarketProofToIndex: { reviewCount28d: 1 },
    },
    corridor: {
        previewThreshold: 35,
        indexThreshold: 62,
        maxThinRiskToIndex: 35,
        minUniqueFactsToIndex: 4,
        minInternalLinksToIndex: 10,
        minWordCountToIndex: 500,
        minMarketProofToIndex: { matchesAccepted28d: 3 },
    },
    port: {
        previewThreshold: 40,
        indexThreshold: 72,
        maxThinRiskToIndex: 30,
        minUniqueFactsToIndex: 8,
        minInternalLinksToIndex: 14,
        minWordCountToIndex: 750,
        minMarketProofToIndex: { reviewCount28d: 1 },
    },
    category: {
        previewThreshold: 36,
        indexThreshold: 66,
        maxThinRiskToIndex: 34,
        minUniqueFactsToIndex: 5,
        minInternalLinksToIndex: 14,
        minWordCountToIndex: 700,
    },
};

// ── Helpers ────────────────────────────────────────────────────────────────

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// ── Quality Scorer ─────────────────────────────────────────────────────────

export function scorePageQuality(x: QualityInputs): QualityResult {
    const cfg = THRESHOLDS[x.template];
    const reasons: string[] = [];

    // Hard gate: language obviousness
    if (x.languageObviousnessScore < 75) {
        return {
            overall: 0,
            thinRisk: 100,
            helpfulness: 0,
            authority: 0,
            recommendedIndexing: 'noindex',
            reasons: ['Language obviousness too low (<75). Block index until fixed.'],
        };
    }

    // 1) Helpfulness: content depth + locality + structure
    const helpfulness = clamp(
        clamp((x.wordCount / 1200) * 35) +
        clamp((x.uniqueLocalFactsCount / 10) * 35) +
        clamp((x.internalLinksCount / 20) * 15) +
        (x.hasStructuredData ? 10 : 0) +
        (x.hasOriginalMedia ? 5 : 0),
    );

    // 2) Authority: marketplace proof + reviews + GSC
    const marketProof =
        clamp((x.jobsCompleted28d / 10) * 25) +
        clamp((x.matchesAccepted28d / 25) * 20) +
        clamp((x.loadsPosted28d / 50) * 10) +
        clamp((x.escortsAvailable28d / 50) * 10) +
        clamp((x.reviewCount28d / 10) * 15);

    const ratingBoost =
        x.avgReviewRating28d == null
            ? 0
            : clamp(((x.avgReviewRating28d - 3.5) / 1.5) * 10);

    const searchCred =
        (x.gscImpressions28d == null ? 0 : clamp((Math.log10(x.gscImpressions28d + 1) / 4) * 10)) +
        (x.gscCtr28d == null ? 0 : clamp((x.gscCtr28d / 0.06) * 8));

    const authority = clamp(marketProof + ratingBoost + searchCred);

    // 3) Thin risk
    let thinRisk = 0;

    if (x.wordCount < cfg.minWordCountToIndex) {
        thinRisk += 12;
        reasons.push(`Word count below template min (${cfg.minWordCountToIndex}).`);
    }
    if (x.uniqueLocalFactsCount < cfg.minUniqueFactsToIndex) {
        thinRisk += 18;
        reasons.push(`Unique facts below template min (${cfg.minUniqueFactsToIndex}).`);
    }
    if (x.internalLinksCount < cfg.minInternalLinksToIndex) {
        thinRisk += 8;
        reasons.push(`Internal links below template min (${cfg.minInternalLinksToIndex}).`);
    }
    if (!x.hasStructuredData) {
        thinRisk += 8;
        reasons.push('Missing structured data.');
    }

    // Duplicate + cannibalization penalties
    thinRisk += clamp(x.duplicateRiskScore * 0.25);
    thinRisk += clamp(x.cannibalizationScore * 0.20);

    // Language drift
    if (x.languageObviousnessScore < 85) {
        thinRisk += 12;
        reasons.push('Language drift risk (<85).');
    }

    thinRisk = clamp(thinRisk);

    // 4) Overall
    const overall = clamp(
        helpfulness * 0.55 + authority * 0.35 + (100 - thinRisk) * 0.10,
    );

    // 5) Market proof minimums
    const proof = cfg.minMarketProofToIndex ?? {};
    const proofFail =
        (proof.jobsCompleted28d != null && x.jobsCompleted28d < proof.jobsCompleted28d) ||
        (proof.matchesAccepted28d != null && x.matchesAccepted28d < proof.matchesAccepted28d) ||
        (proof.reviewCount28d != null && x.reviewCount28d < proof.reviewCount28d);

    if (proofFail) reasons.push('Template market-proof minimum not met.');

    // 6) Index decision
    let recommendedIndexing: QualityResult['recommendedIndexing'] = 'preview';
    if (overall >= cfg.indexThreshold && thinRisk <= cfg.maxThinRiskToIndex && !proofFail) {
        recommendedIndexing = 'index';
    } else if (overall >= cfg.previewThreshold) {
        recommendedIndexing = 'noindex';
    }

    // Positive signals for ops
    if (x.uniqueLocalFactsCount >= 10) reasons.push('Strong local evidence (10+ facts).');
    if (x.internalLinksCount >= 20) reasons.push('Strong internal linking (20+).');
    if (x.jobsCompleted28d >= 10) reasons.push('Strong market proof (10+ jobs completed).');

    return { overall, helpfulness, authority, thinRisk, recommendedIndexing, reasons };
}

// ── Demotion Engine ────────────────────────────────────────────────────────

export type DemotionInputs = {
    template: TemplateKey;
    currentlyIndexed: boolean;

    lastBuiltAt: Date;
    lastMaterialContentChangeAt: Date;
    now: Date;

    gscImpressions28d: number | null;
    gscClicks28d: number | null;
    gscCtr28d: number | null;
    avgPosition28d: number | null;

    jobsCompleted28d: number;
    matchesAccepted28d: number;
    reviewCount28d: number;

    thinRiskScore: number;
    languageObviousnessScore: number;
    duplicateRiskScore: number;
    cannibalizationScore: number;
};

export type DemotionDecision = {
    shouldDemote: boolean;
    newIndexingMode: 'index' | 'noindex';
    reasons: string[];
};

const STALE_WINDOWS: Record<TemplateKey, number> = {
    city: 45,
    corridor: 30,
    port: 45,
    category: 30,
};

export function evaluateDemotion(x: DemotionInputs): DemotionDecision {
    if (!x.currentlyIndexed) return { shouldDemote: false, newIndexingMode: 'noindex', reasons: [] };

    const cfg = THRESHOLDS[x.template];
    const reasons: string[] = [];

    const daysSinceChange =
        (x.now.getTime() - x.lastMaterialContentChangeAt.getTime()) / (1000 * 60 * 60 * 24);

    const lowDemand =
        (x.gscImpressions28d != null && x.gscImpressions28d < 50) ||
        (x.gscImpressions28d == null && (x.matchesAccepted28d + x.jobsCompleted28d + x.reviewCount28d) === 0);

    // A) Staleness + low demand
    if (daysSinceChange > STALE_WINDOWS[x.template] && lowDemand) {
        reasons.push(`Stale (${Math.round(daysSinceChange)}d since material change) + low demand.`);
    }

    // B) Thin risk drift
    if (x.thinRiskScore > cfg.maxThinRiskToIndex + 10) {
        reasons.push(`Thin risk drifted high (${x.thinRiskScore} > ${cfg.maxThinRiskToIndex + 10}).`);
    }

    // C) Language drift
    if (x.languageObviousnessScore < 85) {
        reasons.push(`Language drift (obviousness ${x.languageObviousnessScore} < 85).`);
    }

    // D) Duplicate / cannibalization
    if (x.duplicateRiskScore >= 70) reasons.push(`High duplicate risk (${x.duplicateRiskScore}).`);
    if (x.cannibalizationScore >= 70) reasons.push(`High cannibalization (${x.cannibalizationScore}).`);

    const shouldDemote = reasons.length > 0;
    return { shouldDemote, newIndexingMode: shouldDemote ? 'noindex' : 'index', reasons };
}

// ── Robots Meta ────────────────────────────────────────────────────────────

export function robotsMeta(indexingMode: 'index' | 'noindex' | 'preview'): string {
    return indexingMode === 'index' ? 'index,follow' : 'noindex,follow';
}
