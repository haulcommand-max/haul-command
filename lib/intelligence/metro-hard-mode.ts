
/**
 * metroHardMode.ts
 * Auto-activate "Hard Mode" based on your own internal signals (no manual city list needed).
 */

export type MetroSignals = {
    serpCompetitionProxy: number;     // 0..1
    adsDensityProxy: number;          // 0..1
    loadVolume30d: number;            // raw
    uniqueBrokers30d: number;         // raw
    uniqueProviders30d: number;       // raw
    laneOutCount: number;             // raw
    laneInCount: number;              // raw
    corridorIntersections: number;    // raw
    bridgeDensityProxy: number;       // 0..1
    curfewComplexityProxy: number;    // 0..1
    portPresence: boolean;
    internalSearchDemandProxy: number;// 0..1
    alertSubsCount: number;           // raw
};

export function metroPriorityScore(s: MetroSignals): number {
    const competitionIntensity = clamp01((s.serpCompetitionProxy + s.adsDensityProxy) / 2);

    const freightGravity = clamp01(normLog(s.loadVolume30d, 50, 5000) * 0.5 +
        normLog(s.uniqueBrokers30d, 5, 800) * 0.25 +
        normLog(s.uniqueProviders30d, 5, 2000) * 0.25);

    const laneDensity = clamp01(normLog(s.laneOutCount + s.laneInCount, 10, 4000) * 0.7 +
        normLog(s.corridorIntersections, 1, 80) * 0.3);

    const geoComplexity = clamp01((s.bridgeDensityProxy * 0.45) +
        (s.curfewComplexityProxy * 0.35) +
        (s.portPresence ? 0.20 : 0.0));

    const userDemand = clamp01(s.internalSearchDemandProxy * 0.7 + normLog(s.alertSubsCount, 10, 20000) * 0.3);

    const score =
        competitionIntensity * 0.25 +
        freightGravity * 0.25 +
        laneDensity * 0.25 +
        geoComplexity * 0.15 +
        userDemand * 0.10;

    return round3(score);
}

export function hardModeTier(score: number): "hard" | "enhanced" | "normal" {
    if (score >= 0.72) return "hard";
    if (score >= 0.55) return "enhanced";
    return "normal";
}

// -------- helpers ----------
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function round3(x: number): number { return Math.round(x * 1000) / 1000; }

// log-normalize raw counts into 0..1
function normLog(value: number, low: number, high: number): number {
    const v = Math.max(0, value);
    const a = Math.log1p(low);
    const b = Math.log1p(high);
    const n = (Math.log1p(v) - a) / (b - a);
    return clamp01(n);
}
