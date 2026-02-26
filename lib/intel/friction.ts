/**
 * Permit Friction Heatmap Engine
 *
 * Computes friction scores from 5 components:
 *   approval_speed + regulatory_complexity + restriction_density
 *   + route_risk_pressure + rework_probability
 *
 * Sparse-data tolerant: uses country priors when region data is thin.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface FrictionInputs {
    countryCode: string;
    regionCode?: string;
    corridorSlug?: string;
    // Component scores (0-2 scale each, higher = more friction)
    approvalSpeed?: number;
    regulatoryComplexity?: number;
    restrictionDensity?: number;
    routeRiskPressure?: number;
    reworkProbability?: number;
    // Confidence inputs
    dataSourcesCount?: number;
    observedEventsCount?: number;
}

export interface FrictionResult {
    frictionScore: number;
    frictionBand: 'low' | 'moderate' | 'high' | 'extreme';
    confidence: number;
    isSparseEstimate: boolean;
    priorSource: string | null;
    components: {
        approvalSpeed: number;
        regulatoryComplexity: number;
        restrictionDensity: number;
        routeRiskPressure: number;
        reworkProbability: number;
    };
    color: string;
}

// ── Country Priors (sparse-data fallback) ──────────────────────────────────

const COUNTRY_PRIORS: Record<string, {
    approvalSpeed: number;
    regulatoryComplexity: number;
    restrictionDensity: number;
    routeRiskPressure: number;
    reworkProbability: number;
}> = {
    US: { approvalSpeed: 0.8, regulatoryComplexity: 1.2, restrictionDensity: 0.9, routeRiskPressure: 0.7, reworkProbability: 0.5 },
    CA: { approvalSpeed: 0.9, regulatoryComplexity: 1.1, restrictionDensity: 0.8, routeRiskPressure: 0.6, reworkProbability: 0.5 },
    AU: { approvalSpeed: 1.0, regulatoryComplexity: 1.0, restrictionDensity: 0.6, routeRiskPressure: 0.8, reworkProbability: 0.4 },
    GB: { approvalSpeed: 1.1, regulatoryComplexity: 1.3, restrictionDensity: 1.2, routeRiskPressure: 0.9, reworkProbability: 0.6 },
    NZ: { approvalSpeed: 0.7, regulatoryComplexity: 0.8, restrictionDensity: 0.7, routeRiskPressure: 0.9, reworkProbability: 0.3 },
    SE: { approvalSpeed: 0.9, regulatoryComplexity: 0.9, restrictionDensity: 0.8, routeRiskPressure: 0.7, reworkProbability: 0.3 },
    NO: { approvalSpeed: 1.0, regulatoryComplexity: 1.0, restrictionDensity: 0.9, routeRiskPressure: 1.0, reworkProbability: 0.4 },
    AE: { approvalSpeed: 0.6, regulatoryComplexity: 0.7, restrictionDensity: 0.5, routeRiskPressure: 0.4, reworkProbability: 0.3 },
    SA: { approvalSpeed: 0.8, regulatoryComplexity: 0.6, restrictionDensity: 0.4, routeRiskPressure: 0.5, reworkProbability: 0.4 },
    DE: { approvalSpeed: 1.3, regulatoryComplexity: 1.5, restrictionDensity: 1.3, routeRiskPressure: 0.8, reworkProbability: 0.7 },
    ZA: { approvalSpeed: 0.7, regulatoryComplexity: 0.5, restrictionDensity: 0.4, routeRiskPressure: 0.9, reworkProbability: 0.5 },
};

const COMPONENT_WEIGHTS = {
    approvalSpeed: 0.25,
    regulatoryComplexity: 0.25,
    restrictionDensity: 0.20,
    routeRiskPressure: 0.15,
    reworkProbability: 0.15,
};

const BAND_THRESHOLDS = {
    low: 0.8,
    moderate: 1.2,
    high: 1.7,
};

const BAND_COLORS: Record<string, string> = {
    low: '#22c55e',
    moderate: '#f59e0b',
    high: '#f97316',
    extreme: '#ef4444',
};

// ── Engine ─────────────────────────────────────────────────────────────────

export function computeFriction(inputs: FrictionInputs): FrictionResult {
    const prior = COUNTRY_PRIORS[inputs.countryCode] || COUNTRY_PRIORS.US;
    const hasObservedData = (inputs.dataSourcesCount || 0) >= 2;

    // Resolve each component: use observed if available, else prior
    const components = {
        approvalSpeed: inputs.approvalSpeed ?? prior.approvalSpeed,
        regulatoryComplexity: inputs.regulatoryComplexity ?? prior.regulatoryComplexity,
        restrictionDensity: inputs.restrictionDensity ?? prior.restrictionDensity,
        routeRiskPressure: inputs.routeRiskPressure ?? prior.routeRiskPressure,
        reworkProbability: inputs.reworkProbability ?? prior.reworkProbability,
    };

    // Bayesian shrinkage for sparse regions: blend observed with prior
    if (!hasObservedData && inputs.regionCode) {
        const shrinkFactor = Math.min((inputs.observedEventsCount || 0) / 50, 1);
        for (const key of Object.keys(components) as (keyof typeof components)[]) {
            const observed = inputs[key] ?? prior[key];
            components[key] = prior[key] * (1 - shrinkFactor) + observed * shrinkFactor;
        }
    }

    // Weighted sum
    const frictionScore =
        components.approvalSpeed * COMPONENT_WEIGHTS.approvalSpeed +
        components.regulatoryComplexity * COMPONENT_WEIGHTS.regulatoryComplexity +
        components.restrictionDensity * COMPONENT_WEIGHTS.restrictionDensity +
        components.routeRiskPressure * COMPONENT_WEIGHTS.routeRiskPressure +
        components.reworkProbability * COMPONENT_WEIGHTS.reworkProbability;

    // Classify band
    const frictionBand = classifyBand(frictionScore);

    // Confidence score
    const confidence = computeConfidence(inputs);

    return {
        frictionScore: Math.round(frictionScore * 1000) / 1000,
        frictionBand,
        confidence,
        isSparseEstimate: !hasObservedData,
        priorSource: hasObservedData ? null : 'country_prior',
        components,
        color: BAND_COLORS[frictionBand],
    };
}

/**
 * Compute friction for all countries using priors (bootstrap mode).
 */
export function bootstrapAllCountries(): Record<string, FrictionResult> {
    const results: Record<string, FrictionResult> = {};
    for (const code of Object.keys(COUNTRY_PRIORS)) {
        results[code] = computeFriction({ countryCode: code });
    }
    return results;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function classifyBand(score: number): 'low' | 'moderate' | 'high' | 'extreme' {
    if (score < BAND_THRESHOLDS.low) return 'low';
    if (score < BAND_THRESHOLDS.moderate) return 'moderate';
    if (score < BAND_THRESHOLDS.high) return 'high';
    return 'extreme';
}

function computeConfidence(inputs: FrictionInputs): number {
    let c = 0.3; // Base confidence from prior
    if ((inputs.dataSourcesCount || 0) >= 1) c += 0.15;
    if ((inputs.dataSourcesCount || 0) >= 3) c += 0.15;
    if ((inputs.observedEventsCount || 0) >= 10) c += 0.15;
    if ((inputs.observedEventsCount || 0) >= 50) c += 0.15;
    if (inputs.approvalSpeed != null) c += 0.05;
    if (inputs.regulatoryComplexity != null) c += 0.05;
    return Math.min(c, 0.95);
}
