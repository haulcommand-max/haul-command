/**
 * Quality Gating Engine
 *
 * Determines what can be published where, based on confidence,
 * observation density, provider count, and market-specific overrides.
 *
 * Publish Levels:
 *   0 = blocked (internal only)
 *   1 = band + confidence + basis only (no numbers)
 *   2 = limited numbers (coarse ranges + disclaimers)
 *   3 = full publish (numbers + forecasts + drilldowns)
 *
 * Never lies. Never over-claims. The API consumer decides how to
 * render based on the publish_level + allowed_fields.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PublishLevel = 0 | 1 | 2 | 3;
export type Basis = 'priors' | 'mixed' | 'observed';
export type Feature =
    | 'permit_friction_heatmap'
    | 'scarcity_predictor'
    | 'route_risk_overlays'
    | 'regulation_resolution';

export interface GateInputs {
    countryCode: string;
    regionCode?: string;
    corridorSlug?: string;
    feature: Feature;
    confidence: number;
    observationsCount: number;
    providerCount?: number;
    contentQualityScore?: number;
    sourcesUsed?: string[];
}

export interface GateResult {
    publishLevel: PublishLevel;
    publishLevelLabel: string;
    noindex: boolean;
    uiBanner: string | null;
    allowedFields: string[];
    strippedFields: string[];
    basis: Basis;
    marketOverride: string | null;
}

// ── Global Thresholds ──────────────────────────────────────────────────────

function determineBasis(confidence: number, observations: number): Basis {
    if (observations >= 250 && confidence >= 0.70) return 'observed';
    if (observations >= 25 && confidence >= 0.35) return 'mixed';
    return 'priors';
}

function determinePublishLevel(confidence: number, observations: number): PublishLevel {
    if (confidence < 0.20 || observations < 10) return 0;
    if (confidence < 0.45) return 1;
    if (confidence < 0.70) return 2;
    if (observations >= 250) return 3;
    return 2;
}

const LEVEL_LABELS: Record<PublishLevel, string> = {
    0: 'blocked',
    1: 'band_only',
    2: 'limited_numbers',
    3: 'full_publish',
};

// ── Always-Allowed Fields (every level) ────────────────────────────────────

const ALWAYS_ALLOWED = ['score', 'band', 'confidence', 'basis', 'observations_count', 'sources_used', 'color'];

const LEVEL_FIELDS: Record<PublishLevel, string[]> = {
    0: [], // internal only — just ALWAYS_ALLOWED
    1: [], // band + confidence + basis only
    2: ['recommended_range', 'approval_time_range_days', 'fill_probability_range_pct', 'restriction_windows', 'components'],
    3: ['recommended_range', 'approval_time_days', 'fill_probability_pct', 'supply_demand_gap', 'forecast_24h', 'forecast_72h', 'rework_probability_pct', 'rejection_rate', 'restriction_windows', 'components', 'drilldowns'],
};

// ── UI Banners ─────────────────────────────────────────────────────────────

function getUiBanner(basis: Basis, confidence: number, level: PublishLevel): string | null {
    if (level === 0) return null; // blocked — not shown at all
    if (confidence < 0.35) return 'Estimate (low confidence) — improves as reports + fills accumulate.';
    if (basis === 'priors') return 'Baseline estimate — derived from rules + country priors.';
    if (basis === 'mixed') return 'Improving estimate — blending priors with observed signals.';
    if (basis === 'observed') return 'Observed intelligence — driven by real outcomes and verified reports.';
    return null;
}

// ── SEO Indexability ───────────────────────────────────────────────────────

function determineNoindex(
    confidence: number,
    observations: number,
    providerCount: number,
    contentQualityScore: number,
    countryCode: string,
): boolean {
    // Market-specific overrides
    const override = MARKET_OVERRIDES[countryCode];
    if (override?.seoOverrides?.noindexConfidenceLt && confidence < override.seoOverrides.noindexConfidenceLt) return true;
    if (override?.seoOverrides?.noindexProviderCountLt && providerCount < override.seoOverrides.noindexProviderCountLt) return true;

    // Global rules
    if (confidence < 0.35) return true;
    if (observations < 25) return true;
    if (providerCount < 5) return true;
    if (contentQualityScore < 0.60) return true;

    return false;
}

// ── Market-Specific Overrides ──────────────────────────────────────────────

interface MarketOverride {
    risk: string;
    extraSourcesRequired?: number;
    disallowExactTimesUntilObservations?: number;
    disallowFullPublishUntilConfidence?: number;
    forbidExactIncidentLocationsPublicly?: boolean;
    publicAggregationMinRadiusKm?: number;
    requireSmoothingWindowDays?: number;
    seoOverrides?: {
        noindexConfidenceLt?: number;
        noindexProviderCountLt?: number;
    };
}

const MARKET_OVERRIDES: Record<string, MarketOverride> = {
    AU: {
        risk: 'seasonal flood volatility + remote corridors',
        disallowExactTimesUntilObservations: 350,
    },
    GB: {
        risk: 'high sensitivity to inaccuracies + low bridge density',
        extraSourcesRequired: 3,
        seoOverrides: { noindexProviderCountLt: 10 },
    },
    NZ: {
        risk: 'small sample sizes; volatility',
        requireSmoothingWindowDays: 14,
        disallowExactTimesUntilObservations: 400,
    },
    SE: {
        risk: 'winter restrictions dominate',
    },
    NO: {
        risk: 'terrain chokepoints; tunnels/bridges',
    },
    AE: {
        risk: 'emirate variance',
        extraSourcesRequired: 2,
    },
    SA: {
        risk: 'trust curve + sparse observations',
        disallowExactTimesUntilObservations: 500,
        seoOverrides: { noindexConfidenceLt: 0.45 },
    },
    DE: {
        risk: 'strict compliance expectations',
        extraSourcesRequired: 3,
        disallowFullPublishUntilConfidence: 0.75,
    },
    ZA: {
        risk: 'safety + sensitivity',
        forbidExactIncidentLocationsPublicly: true,
        publicAggregationMinRadiusKm: 25,
    },
};

// ── Main Gate Evaluator ────────────────────────────────────────────────────

export function evaluateGate(inputs: GateInputs): GateResult {
    const {
        countryCode,
        feature,
        confidence,
        observationsCount,
        providerCount = 0,
        contentQualityScore = 0.5,
        sourcesUsed = [],
    } = inputs;

    const basis = determineBasis(confidence, observationsCount);
    let level = determinePublishLevel(confidence, observationsCount);
    const override = MARKET_OVERRIDES[countryCode] || null;
    let marketOverrideNote: string | null = null;

    // Apply market-specific overrides
    if (override) {
        // Source count gate
        if (override.extraSourcesRequired && sourcesUsed.length < override.extraSourcesRequired) {
            if (level >= 3) {
                level = 2;
                marketOverrideNote = `${countryCode} requires ${override.extraSourcesRequired}+ sources for full publish`;
            }
        }

        // Exact-time gate
        if (override.disallowExactTimesUntilObservations && observationsCount < override.disallowExactTimesUntilObservations) {
            if (level >= 3 && (feature === 'permit_friction_heatmap' || feature === 'scarcity_predictor')) {
                level = 2;
                marketOverrideNote = `${countryCode}: exact times blocked until ${override.disallowExactTimesUntilObservations} observations`;
            }
        }

        // Confidence gate
        if (override.disallowFullPublishUntilConfidence && confidence < override.disallowFullPublishUntilConfidence) {
            if (level >= 3) {
                level = 2;
                marketOverrideNote = `${countryCode}: full publish blocked until confidence ≥ ${override.disallowFullPublishUntilConfidence}`;
            }
        }
    }

    // Build allowed fields
    const allowed = [...ALWAYS_ALLOWED, ...LEVEL_FIELDS[level]];

    // Build stripped fields (what got removed)
    const allPossible = [...ALWAYS_ALLOWED, ...LEVEL_FIELDS[3]];
    const stripped = allPossible.filter((f) => !allowed.includes(f));

    // noindex
    const noindex = determineNoindex(confidence, observationsCount, providerCount, contentQualityScore, countryCode);

    // Banner
    const uiBanner = getUiBanner(basis, confidence, level);

    return {
        publishLevel: level,
        publishLevelLabel: LEVEL_LABELS[level],
        noindex,
        uiBanner,
        allowedFields: [...new Set(allowed)],
        strippedFields: [...new Set(stripped)],
        basis,
        marketOverride: marketOverrideNote,
    };
}

// ── Response Scrubber ──────────────────────────────────────────────────────

/**
 * Strip fields from an API response that aren't allowed at the current publish level.
 * Attaches truth controls (basis, confidence, banner) to the response.
 */
export function scrubResponse<T extends Record<string, unknown>>(
    data: T,
    gate: GateResult,
): T & { _truth: { basis: Basis; publishLevel: PublishLevel; uiBanner: string | null; marketOverride: string | null } } {
    const scrubbed = { ...data } as T & { _truth: { basis: Basis; publishLevel: PublishLevel; uiBanner: string | null; marketOverride: string | null } };

    // Strip disallowed fields
    for (const field of gate.strippedFields) {
        if (field in scrubbed) {
            delete (scrubbed as Record<string, unknown>)[field];
        }
    }

    // Attach truth controls
    scrubbed._truth = {
        basis: gate.basis,
        publishLevel: gate.publishLevel,
        uiBanner: gate.uiBanner,
        marketOverride: gate.marketOverride,
    };

    return scrubbed;
}

/**
 * Quick helper: is this country safe to show exact numbers for a feature?
 */
export function canShowExactNumbers(countryCode: string, feature: Feature, confidence: number, observations: number): boolean {
    const gate = evaluateGate({ countryCode, feature, confidence, observationsCount: observations });
    return gate.publishLevel >= 3;
}

/**
 * Quick helper: should this page be noindexed?
 */
export function shouldNoindex(countryCode: string, confidence: number, observations: number, providerCount: number, contentQualityScore: number): boolean {
    return determineNoindex(confidence, observations, providerCount, contentQualityScore, countryCode);
}
