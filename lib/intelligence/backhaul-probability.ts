
// backhaulProbability.ts — Simple v1 model
// Goal: estimate probability (0..1) that a driver can find a decent return load soon.
// Uses:
// 1) Lane symmetry (A→B vs B→A balance)
// 2) Nearby return density (loads near destination within radius)
// 3) Time window alignment (loads soon vs too far out)
//
// Inputs come from your rollups:
// - lanes table (density + active loads) for lane symmetry
// - geo_feed_rollups or derived counts for nearby density
//
// This is intentionally simple + robust. You can replace later with ML.

export type BackhaulContext = {
    // current load
    originGeoKey: string;     // "us:tx:houston" or metro key
    destGeoKey: string;       // "us:tx:dallas"
    serviceRequired: string;  // "high-pole" etc
    postedAtISO: string;
    loadDateISO?: string;     // optional

    // rollups (you can fetch these from DB)
    // lane symmetry inputs:
    outboundLaneActive30d: number; // A→B active loads (30d)
    returnLaneActive30d: number;   // B→A active loads (30d)
    outboundLaneDensity01: number; // A→B lane_density_score_30d (0..1)
    returnLaneDensity01: number;   // B→A lane_density_score_30d (0..1)

    // nearby return density around destination:
    // counts of active loads originating near destination (regardless of final dest) within a radius and time window
    nearbyOutboundFromDest_24h: number;   // active loads posted last 24h from dest radius
    nearbyOutboundFromDest_72h: number;   // active loads posted last 72h from dest radius

    // optional: how many of those are “return direction-ish” back toward origin region
    nearbyTowardOrigin_72h?: number;      // count of nearby loads whose dest is near origin (or same admin1)
};

function clamp01(x: number): number {
    return Math.max(0, Math.min(1, x));
}

function normLogCount(value: number, low: number, high: number): number {
    // maps raw counts to 0..1 using log scaling
    const v = Math.max(0, value);
    const a = Math.log1p(low);
    const b = Math.log1p(high);
    const n = (Math.log1p(v) - a) / (b - a);
    return clamp01(n);
}

// 1) Lane symmetry: if return lane is strong relative to outbound, backhaul is likely.
function laneSymmetry01(outAtoB: number, outBtoA: number, densA: number, densB: number): number {
    // balance ratio with smoothing to avoid divide by zero
    const ratio = (outBtoA + 3) / (outAtoB + 3); // >1 means return stronger
    const ratioScore =
        ratio >= 1.1 ? 1.0 :
            ratio >= 0.9 ? 0.85 :
                ratio >= 0.7 ? 0.65 :
                    ratio >= 0.5 ? 0.45 : 0.25;

    // density reinforcement (if both lanes are dense, better)
    const densityBlend = clamp01((clamp01(densA) + clamp01(densB)) / 2);

    // lane symmetry is mostly ratio, but density helps
    return clamp01(ratioScore * 0.75 + densityBlend * 0.25);
}

// 2) Nearby return density: are there many loads available near destination?
function nearbyDensity01(near24h: number, near72h: number): number {
    // 24h is more valuable than 72h (freshness/realistic)
    const s24 = normLogCount(near24h, 3, 250);
    const s72 = normLogCount(near72h, 10, 600);
    return clamp01(s24 * 0.65 + s72 * 0.35);
}

// 3) Time-window alignment: loads posted recently are more actionable.
// If you have loadDate, you can weight by how soon it is.
function timeWindow01(postedAtISO: string, loadDateISO?: string): number {
    // basic: boost if posted recently
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(postedAtISO)) / 60000));
    const recent = clamp01(Math.exp(-minutes / 360)); // 6h half-ish
    // if a load date exists far in future, reduce
    if (!loadDateISO) return recent;

    const daysUntil = Math.floor((Date.parse(loadDateISO) - Date.now()) / (24 * 3600 * 1000));
    if (daysUntil <= 0) return clamp01(recent * 1.05);
    if (daysUntil <= 1) return clamp01(recent * 1.0);
    if (daysUntil <= 3) return clamp01(recent * 0.85);
    if (daysUntil <= 7) return clamp01(recent * 0.65);
    return clamp01(recent * 0.45);
}

// Optional: directionality bonus — if nearby loads tend to go back toward origin
function directionality01(nearTowardOrigin72h?: number, near72h?: number): number {
    if (!nearTowardOrigin72h || !near72h || near72h <= 0) return 0.5;
    const frac = nearTowardOrigin72h / near72h; // 0..1
    // cap extremes
    return clamp01(0.35 + frac * 0.65);
}

export function computeBackhaulProbability01(ctx: BackhaulContext): number {
    const sym = laneSymmetry01(
        ctx.outboundLaneActive30d,
        ctx.returnLaneActive30d,
        ctx.outboundLaneDensity01,
        ctx.returnLaneDensity01
    );

    const near = nearbyDensity01(ctx.nearbyOutboundFromDest_24h, ctx.nearbyOutboundFromDest_72h);

    const time = timeWindow01(ctx.postedAtISO, ctx.loadDateISO);

    const dir = directionality01(ctx.nearbyTowardOrigin_72h, ctx.nearbyOutboundFromDest_72h);

    // v1 weights: density + symmetry drive most; time keeps it realistic; direction adds small lift
    const score =
        sym * 0.40 +
        near * 0.40 +
        time * 0.12 +
        dir * 0.08;

    // floor/ceiling to avoid 0/1 extremes in v1
    return clamp01(0.05 + score * 0.90);
}
