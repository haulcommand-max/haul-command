/**
 * Surge & Scarcity Engine
 *
 * Detects escort shortages per corridor/zone + computes surge multiplier.
 * Compute grain: corridor_id + time_bucket (hourly)
 *
 * Scarcity Index: 0-100
 * Surge Multiplier: 1.0x – 3.5x
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ScarcityInputs = {
    supplyActiveEscorts: number;
    demandOpenLoads: number;
    avgResponseLatencyMinutes: number;
    historicalFillRate: number;       // 0-1 (1 = all loads filled)
    seasonalBaseline: number;         // 0-1 (1 = peak season)
    weatherRiskFactor: number;        // 0-1 (1 = severe weather)
    eventSpikeFactor: number;         // 0-1 (1 = major event)
};

export type ScarcityResult = {
    scarcityIndex: number;            // 0-100
    surgeMultiplier: number;          // 1.0-3.5
    alertLevel: 'normal' | 'elevated' | 'high' | 'critical';
    breakdown: {
        supplyDemandPressure: number;
        latencyPressure: number;
        fillPressure: number;
        weatherPressure: number;
        eventPressure: number;
    };
};

// ── Helpers ────────────────────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function normalizePressure(value: number, target: number): number {
    if (value <= target) return 0;
    return clamp((value - target) / target, 0, 1);
}

function inversePressure(rate: number): number {
    return clamp(1 - rate, 0, 1);
}

// ── Scorer ─────────────────────────────────────────────────────────────────

const THRESHOLDS = {
    highAlert: 70,
    critical: 85,
} as const;

export function calculateScarcity(x: ScarcityInputs): ScarcityResult {
    // Supply/demand ratio
    const supply = Math.max(x.supplyActiveEscorts, 1);
    const supplyDemandRatio = x.demandOpenLoads / supply;
    const supplyDemandPressure = clamp(supplyDemandRatio * 40, 0, 40);

    // Response latency (target 15 min)
    const latencyPressure = clamp(normalizePressure(x.avgResponseLatencyMinutes, 15) * 20, 0, 20);

    // Fill rate (lower = more pressure)
    const fillPressure = clamp(inversePressure(x.historicalFillRate) * 20, 0, 20);

    // Weather
    const weatherPressure = clamp(x.weatherRiskFactor * 10, 0, 10);

    // Event spike
    const eventPressure = clamp(x.eventSpikeFactor * 10, 0, 10);

    // Raw scarcity
    const raw = supplyDemandPressure + latencyPressure + fillPressure + weatherPressure + eventPressure;
    const scarcityIndex = clamp(Math.round(raw), 0, 100);

    // Surge multiplier
    let surgeMultiplier: number;
    if (scarcityIndex < 30) surgeMultiplier = 1.0;
    else if (scarcityIndex < 50) surgeMultiplier = 1.15;
    else if (scarcityIndex < 70) surgeMultiplier = 1.35;
    else if (scarcityIndex < 85) surgeMultiplier = 1.75;
    else if (scarcityIndex < 95) surgeMultiplier = 2.25;
    else surgeMultiplier = 3.5;

    // Alert level
    let alertLevel: ScarcityResult['alertLevel'] = 'normal';
    if (scarcityIndex >= THRESHOLDS.critical) alertLevel = 'critical';
    else if (scarcityIndex >= THRESHOLDS.highAlert) alertLevel = 'high';
    else if (scarcityIndex >= 50) alertLevel = 'elevated';

    return {
        scarcityIndex,
        surgeMultiplier,
        alertLevel,
        breakdown: {
            supplyDemandPressure: Math.round(supplyDemandPressure),
            latencyPressure: Math.round(latencyPressure),
            fillPressure: Math.round(fillPressure),
            weatherPressure: Math.round(weatherPressure),
            eventPressure: Math.round(eventPressure),
        },
    };
}

// ── Corridor Scarcity Snapshot (for DB storage) ────────────────────────────

export type CorridorScarcitySnapshot = {
    corridorId: string;
    bucketHour: string;        // ISO timestamp truncated to hour
    scarcityIndex: number;
    surgeMultiplier: number;
    alertLevel: string;
    supplyActiveEscorts: number;
    demandOpenLoads: number;
};
