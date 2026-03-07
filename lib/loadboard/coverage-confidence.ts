// lib/loadboard/coverage-confidence.ts
//
// Haul Command — Coverage Confidence Math Model
// Spec: Map-First Load Board v1.0.0
//
// Computes coverage_confidence (0..1) and coverage_band per cell.
// Anti-gaming hardened, freshness-weighted, variance-guarded.
//
// Formula components:
//   demand_norm (35%) + supply_norm (35%) + balance (15%)
//   + matchability_boost (10%) + reliability_boost (15%)
//   - stability_penalty (10%)

// ============================================================
// TYPES
// ============================================================

export interface JobSignal {
    job_id: string;
    created_at: string;
    updated_at: string;
    verification_level: VerificationLevel;
    payout_mid: number;            // (payout_min + payout_max) / 2
    poster_reputation: number;     // 0-1
    escort_type: EscortType;
}

export interface OperatorSignal {
    operator_id: string;
    last_active_at: string;
    verification_level: VerificationLevel;
    responsiveness_score: number;  // 0-1
    completion_score: number;      // 0-1
    escort_types_supported: EscortType[];
    service_radius_miles: number;
}

export type VerificationLevel = 'unverified' | 'basic' | 'verified' | 'verified_elite';
export type EscortType = 'chase_only' | 'lead' | 'rear' | 'both' | 'police_coordination' | 'route_scout';
export type CoverageBand = 'dead' | 'thin' | 'emerging' | 'strong' | 'dominant';

export interface CellInput {
    cell_id: string;
    jobs: JobSignal[];
    operators: OperatorSignal[];
    trailing_7d_volume: number;
    trailing_30d_volume: number;
    // Optional matchability context
    dominant_escort_type?: EscortType;
    historical_fill_probability?: number;
}

export interface CoverageCellResult {
    cell_id: string;
    // Raw counts
    active_jobs_raw: number;
    active_operators_raw: number;
    // Effective (weighted)
    active_jobs_effective: number;
    active_operators_effective: number;
    // Confidence
    coverage_confidence: number;   // 0-1
    coverage_band: CoverageBand;
    // Component breakdown (for tooltip)
    demand_norm: number;
    supply_norm: number;
    balance_score: number;
    matchability_score: number;
    reliability_score: number;
    volatility_penalty: number;
    // Trailing
    trailing_7d_volume: number;
    trailing_30d_volume: number;
}

// ============================================================
// CONSTANTS (from spec)
// ============================================================

const FRESHNESS = {
    job_half_life_hours: 48,
    operator_half_life_hours: 72,
    payout_ref: 250,
};

const VERIFICATION_MULTIPLIERS: Record<VerificationLevel, number> = {
    unverified: 0.65,
    basic: 0.85,
    verified: 1.00,
    verified_elite: 1.10,
};

const OPERATOR_VERIFICATION_MULTIPLIERS: Record<VerificationLevel, number> = {
    unverified: 0.70,
    basic: 0.90,
    verified: 1.00,
    verified_elite: 1.10,
};

const CONFIDENCE = {
    demand_ref: 60,
    supply_ref: 40,
    // Weights
    w_demand: 0.35,
    w_supply: 0.35,
    w_balance: 0.15,
    w_matchability: 0.10,
    w_reliability: 0.15,
    w_stability: 0.10,
    // Stability thresholds
    dominant_min_trailing_30d: 20,
    volatility_max: 0.50,
};

const BAND_THRESHOLDS: { band: CoverageBand; min: number; max: number; guidance: string }[] = [
    { band: 'dead', min: 0.00, max: 0.15, guidance: 'Try widening radius, changing dates, or nearby metros.' },
    { band: 'thin', min: 0.15, max: 0.35, guidance: 'Limited coverage; expect longer response times.' },
    { band: 'emerging', min: 0.35, max: 0.60, guidance: 'Good odds; verify availability.' },
    { band: 'strong', min: 0.60, max: 0.80, guidance: 'Strong coverage; fast responses likely.' },
    { band: 'dominant', min: 0.80, max: 1.00, guidance: 'High-density zone; best fill rates.' },
];

// ============================================================
// UTILITY
// ============================================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function hoursAgo(isoDate: string): number {
    return Math.max(0, (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60));
}

// ============================================================
// FRESHNESS WEIGHTING — JOBS
// ============================================================

/**
 * Effective weight for a single job:
 *   freshness_decay × verification_multiplier × payout_multiplier × poster_multiplier
 */
export function computeJobEffectiveWeight(job: JobSignal): number {
    const ageHours = hoursAgo(job.updated_at);

    // Freshness decay: exp(-age / half_life)
    const freshnessDecay = Math.exp(-ageHours / FRESHNESS.job_half_life_hours);

    // Verification multiplier
    const verificationMult = VERIFICATION_MULTIPLIERS[job.verification_level] || 0.65;

    // Payout multiplier: clamp(log1p(payout_mid / ref), 0.85, 1.20)
    const payoutMult = clamp(
        Math.log1p(job.payout_mid / FRESHNESS.payout_ref),
        0.85,
        1.20
    );

    // Poster multiplier: clamp(reputation, 0.80, 1.15)
    const posterMult = clamp(job.poster_reputation, 0.80, 1.15);

    return freshnessDecay * verificationMult * payoutMult * posterMult;
}

// ============================================================
// FRESHNESS WEIGHTING — OPERATORS
// ============================================================

/**
 * Effective weight for a single operator:
 *   activity_decay × verification_multiplier × responsiveness_multiplier × completion_multiplier
 */
export function computeOperatorEffectiveWeight(op: OperatorSignal): number {
    const inactiveHours = hoursAgo(op.last_active_at);

    // Activity decay: exp(-hours / half_life)
    const activityDecay = Math.exp(-inactiveHours / FRESHNESS.operator_half_life_hours);

    // Verification multiplier
    const verificationMult = OPERATOR_VERIFICATION_MULTIPLIERS[op.verification_level] || 0.70;

    // Responsiveness: clamp(0.6 + 0.4 * score, 0.75, 1.15)
    const responsivenessMult = clamp(0.6 + 0.4 * op.responsiveness_score, 0.75, 1.15);

    // Completion: clamp(0.6 + 0.4 * score, 0.80, 1.15)
    const completionMult = clamp(0.6 + 0.4 * op.completion_score, 0.80, 1.15);

    return activityDecay * verificationMult * responsivenessMult * completionMult;
}

// ============================================================
// MATCHABILITY SCORE
// ============================================================

/**
 * How well supply matches demand in this cell.
 * Factors: escort type overlap, radius fit, time overlap, historical fill.
 */
function computeMatchability(
    jobs: JobSignal[],
    operators: OperatorSignal[],
    historicalFillProb: number = 0.5
): number {
    if (jobs.length === 0 || operators.length === 0) return 0;

    // Escort type overlap: what % of job types are covered by available operators
    const jobTypes = new Set(jobs.map(j => j.escort_type));
    const opTypes = new Set(operators.flatMap(o => o.escort_types_supported));
    const overlap = [...jobTypes].filter(t => opTypes.has(t)).length;
    const typeOverlap = jobTypes.size > 0 ? overlap / jobTypes.size : 0;

    // Historical fill probability (0-1)
    const fillProb = clamp(historicalFillProb, 0, 1);

    // Combined: 60% type overlap + 40% historical fill
    return clamp(typeOverlap * 0.60 + fillProb * 0.40, 0, 1);
}

// ============================================================
// RELIABILITY SCORE
// ============================================================

/**
 * Anti-gaming + trust aggregate.
 * Factors: verification distribution, responsiveness, completion.
 */
function computeReliability(operators: OperatorSignal[]): number {
    if (operators.length === 0) return 0;

    // Verification distribution: % that are verified or elite
    const verified = operators.filter(o =>
        o.verification_level === 'verified' || o.verification_level === 'verified_elite'
    ).length;
    const verifiedPct = verified / operators.length;

    // Average responsiveness
    const avgResponsiveness = operators.reduce((s, o) => s + o.responsiveness_score, 0) / operators.length;

    // Average completion
    const avgCompletion = operators.reduce((s, o) => s + o.completion_score, 0) / operators.length;

    // Combined: 40% verification + 30% responsiveness + 30% completion
    return clamp(
        verifiedPct * 0.40 + avgResponsiveness * 0.30 + avgCompletion * 0.30,
        0,
        1
    );
}

// ============================================================
// VOLATILITY PENALTY
// ============================================================

/**
 * Prevent one spike from labeling a cell "dominant".
 * Uses trailing volume ratio as stability gauge.
 */
function computeVolatilityPenalty(
    currentEffective: number,
    trailing7d: number,
    trailing30d: number
): number {
    if (trailing30d < 3) return 0.15; // Too little history → small penalty

    // Ratio of current to trailing averages
    const avg7d = trailing7d / 7;
    const avg30d = trailing30d / 30;

    if (avg30d <= 0) return 0.10;

    // Spike detection: how much current exceeds 30d average
    const spikeRatio = currentEffective / avg30d;

    if (spikeRatio > 5) return 0.40;    // Extreme spike
    if (spikeRatio > 3) return 0.25;    // Significant spike
    if (spikeRatio > 2) return 0.15;    // Moderate spike

    // Variance between 7d and 30d
    const variance = avg7d > 0 ? Math.abs(avg7d - avg30d) / avg30d : 0;
    return clamp(variance * 0.30, 0, 0.20);
}

// ============================================================
// MAIN: COMPUTE COVERAGE CONFIDENCE
// ============================================================

export function computeCoverageConfidence(input: CellInput): CoverageCellResult {
    const { jobs, operators, trailing_7d_volume, trailing_30d_volume } = input;

    // ── Effective weights ──
    const jobWeights = jobs.map(computeJobEffectiveWeight);
    const opWeights = operators.map(computeOperatorEffectiveWeight);

    const activeJobsEffective = jobWeights.reduce((s, w) => s + w, 0);
    const activeOperatorsEffective = opWeights.reduce((s, w) => s + w, 0);

    // ── Anti-gaming: trust floor ──
    // Unverified operators capped at 0.7× raw
    const unverifiedOps = operators.filter(o => o.verification_level === 'unverified').length;
    const cappedOperatorsEffective = Math.min(
        activeOperatorsEffective,
        operators.length > 0 ? operators.length - unverifiedOps * 0.3 : 0
    );

    // ── Signal components ──

    // Demand norm: log1p(effective) / log1p(ref)
    const demandNorm = clamp(
        Math.log1p(activeJobsEffective) / Math.log1p(CONFIDENCE.demand_ref),
        0, 1
    );

    // Supply norm: log1p(effective) / log1p(ref)
    const supplyNorm = clamp(
        Math.log1p(cappedOperatorsEffective) / Math.log1p(CONFIDENCE.supply_ref),
        0, 1
    );

    // Balance: 1 - |demand - supply|
    const balance = 1 - Math.abs(demandNorm - supplyNorm);

    // Base: weighted sum
    const base = CONFIDENCE.w_demand * demandNorm +
        CONFIDENCE.w_supply * supplyNorm +
        CONFIDENCE.w_balance * balance;

    // Matchability boost
    const matchabilityScore = computeMatchability(
        jobs, operators, input.historical_fill_probability
    );
    const matchabilityBoost = CONFIDENCE.w_matchability * matchabilityScore;

    // Reliability boost
    const reliabilityScore = computeReliability(operators);
    const reliabilityBoost = CONFIDENCE.w_reliability * reliabilityScore;

    // Stability penalty
    const volatilityPenalty = computeVolatilityPenalty(
        activeJobsEffective, trailing_7d_volume, trailing_30d_volume
    );
    const stabilityPenalty = CONFIDENCE.w_stability * volatilityPenalty;

    // ── Final confidence ──
    let confidence = clamp(
        base + matchabilityBoost + reliabilityBoost - stabilityPenalty,
        0, 1
    );

    // Variance guard: "dominant" requires trailing_30d >= threshold AND low volatility
    if (confidence >= 0.80 && (
        trailing_30d_volume < CONFIDENCE.dominant_min_trailing_30d ||
        volatilityPenalty > CONFIDENCE.volatility_max
    )) {
        confidence = 0.79; // Force down to "strong" max
    }

    // ── Band classification ──
    const band = classifyBand(confidence);

    return {
        cell_id: input.cell_id,
        active_jobs_raw: jobs.length,
        active_operators_raw: operators.length,
        active_jobs_effective: round3(activeJobsEffective),
        active_operators_effective: round3(cappedOperatorsEffective),
        coverage_confidence: round3(confidence),
        coverage_band: band,
        demand_norm: round3(demandNorm),
        supply_norm: round3(supplyNorm),
        balance_score: round3(balance),
        matchability_score: round3(matchabilityScore),
        reliability_score: round3(reliabilityScore),
        volatility_penalty: round3(volatilityPenalty),
        trailing_7d_volume,
        trailing_30d_volume,
    };
}

// ============================================================
// BAND CLASSIFICATION
// ============================================================

export function classifyBand(confidence: number): CoverageBand {
    for (const t of BAND_THRESHOLDS) {
        if (confidence >= t.min && confidence < t.max) return t.band;
    }
    if (confidence >= 1.0) return 'dominant';
    return 'dead';
}

export function getBandGuidance(band: CoverageBand): string {
    return BAND_THRESHOLDS.find(t => t.band === band)?.guidance || '';
}

// ============================================================
// BEST MATCH SORTING
// ============================================================

export interface JobSortInput {
    freshness_weight: number;    // from computeJobEffectiveWeight
    verification_level: VerificationLevel;
    payout_mid: number;
    distance_miles: number;      // from user's origin
    poster_reputation: number;
}

/**
 * Best Match score for sort ordering:
 *   freshness (30%) + verification (20%) + payout (20%)
 *   + distance_fit (15%) + poster_reputation (15%)
 */
export function computeBestMatchScore(input: JobSortInput): number {
    // Freshness component (already 0-1 range from decay)
    const freshnessScore = clamp(input.freshness_weight, 0, 1);

    // Verification component
    const verificationScore: Record<VerificationLevel, number> = {
        unverified: 0.2,
        basic: 0.5,
        verified: 0.85,
        verified_elite: 1.0,
    };
    const verifyScore = verificationScore[input.verification_level] || 0.2;

    // Payout component: normalize against reasonable range
    const payoutScore = clamp(input.payout_mid / 1000, 0, 1);

    // Distance fit: closer = better, decay over 500 miles
    const distanceScore = Math.exp(-input.distance_miles / 500);

    // Poster reputation: direct 0-1
    const repScore = clamp(input.poster_reputation, 0, 1);

    return (
        freshnessScore * 0.30 +
        verifyScore * 0.20 +
        payoutScore * 0.20 +
        distanceScore * 0.15 +
        repScore * 0.15
    );
}

// ============================================================
// HELPERS
// ============================================================

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}
