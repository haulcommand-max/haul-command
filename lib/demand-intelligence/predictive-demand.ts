// lib/demand-intelligence/predictive-demand.ts
//
// Predictive Escort Demand Engine
// Scores regions for 30-90 day escort demand probability.
// Powers corridor heatmap, surge detection, and proactive operator positioning.

export interface DemandFeatures {
    industrial_density: number;      // 0-100
    energy_projects: number;         // 0-100
    port_throughput: number;         // 0-100
    permit_trend: number;            // 0-100
    carrier_density: number;         // 0-100
    infrastructure_spend: number;    // 0-100
    wind_installations: number;      // 0-100
    mining_activity: number;         // 0-100
    refinery_turnarounds: number;    // 0-100
    construction_announcements: number; // 0-100
}

export interface DemandPrediction {
    predicted_score: number;         // 0-100
    demand_tier: "S" | "A" | "B" | "C";
    heatmap_color: "red" | "orange" | "yellow" | "green" | "white";
    top_drivers: string[];
    confidence: number;              // 0-1
}

export interface CorridorHeatmapInput {
    permit_volume: number;           // 0-100
    superload_frequency: number;     // 0-100
    industrial_nodes: number;        // 0-100
    port_flow: number;               // 0-100
    energy_projects: number;         // 0-100
}

export interface CorridorHeatmapOutput {
    corridor_score: number;
    heatmap_color: "red" | "orange" | "yellow" | "green" | "white";
    intensity_label: string;
}

// ============================================================
// BASELINE WEIGHTS (heuristic — upgradeable to ML)
// ============================================================

const DEMAND_WEIGHTS = {
    industrial_density: 0.18,
    energy_projects: 0.16,
    port_throughput: 0.14,
    permit_trend: 0.14,
    carrier_density: 0.12,
    infrastructure_spend: 0.10,
    wind_installations: 0.08,
    mining_activity: 0.04,
    refinery_turnarounds: 0.02,
    construction_announcements: 0.02,
} as const;

const CORRIDOR_WEIGHTS = {
    permit_volume: 0.30,
    superload_frequency: 0.25,
    industrial_nodes: 0.20,
    port_flow: 0.15,
    energy_projects: 0.10,
} as const;

// ============================================================
// PREDICT REGIONAL DEMAND
// ============================================================

export function predictRegionalDemand(features: DemandFeatures): DemandPrediction {
    // Weighted score
    let score = 0;
    const contributions: Array<{ feature: string; contribution: number }> = [];

    for (const [key, weight] of Object.entries(DEMAND_WEIGHTS)) {
        const featureValue = features[key as keyof DemandFeatures] ?? 0;
        const contribution = featureValue * weight;
        score += contribution;
        contributions.push({ feature: key, contribution });
    }

    score = Math.round(Math.min(100, Math.max(0, score)));

    // Sort by contribution for top drivers
    contributions.sort((a, b) => b.contribution - a.contribution);
    const topDrivers = contributions
        .slice(0, 3)
        .filter((c) => c.contribution > 0)
        .map((c) => c.feature.replace(/_/g, " "));

    // Tier classification
    let demandTier: "S" | "A" | "B" | "C";
    if (score >= 90) demandTier = "S";
    else if (score >= 75) demandTier = "A";
    else if (score >= 50) demandTier = "B";
    else demandTier = "C";

    // Heatmap color
    let heatmapColor: "red" | "orange" | "yellow" | "green" | "white";
    if (score >= 90) heatmapColor = "red";
    else if (score >= 70) heatmapColor = "orange";
    else if (score >= 50) heatmapColor = "yellow";
    else if (score >= 30) heatmapColor = "green";
    else heatmapColor = "white";

    // Confidence (based on data completeness)
    const nonZeroFeatures = Object.values(features).filter((v) => v > 0).length;
    const confidence = Math.min(1, 0.3 + (nonZeroFeatures / 10) * 0.7);

    return {
        predicted_score: score,
        demand_tier: demandTier,
        heatmap_color: heatmapColor,
        top_drivers: topDrivers,
        confidence: Number(confidence.toFixed(4)),
    };
}

// ============================================================
// CORRIDOR HEATMAP SCORING
// ============================================================

export function scoreCorridorHeatmap(input: CorridorHeatmapInput): CorridorHeatmapOutput {
    let score = 0;
    for (const [key, weight] of Object.entries(CORRIDOR_WEIGHTS)) {
        score += (input[key as keyof CorridorHeatmapInput] ?? 0) * weight;
    }
    score = Math.round(Math.min(100, Math.max(0, score)));

    let heatmapColor: "red" | "orange" | "yellow" | "green" | "white";
    let intensityLabel: string;

    if (score >= 90) { heatmapColor = "red"; intensityLabel = "Critical corridor"; }
    else if (score >= 70) { heatmapColor = "orange"; intensityLabel = "Hot corridor"; }
    else if (score >= 50) { heatmapColor = "yellow"; intensityLabel = "Warm corridor"; }
    else if (score >= 30) { heatmapColor = "green"; intensityLabel = "Emerging"; }
    else { heatmapColor = "white"; intensityLabel = "Cold"; }

    return { corridor_score: score, heatmap_color: heatmapColor, intensity_label: intensityLabel };
}

// ============================================================
// PORT PROXIMITY SCORING
// ============================================================

export function scorePortProximity(distanceMiles: number): number {
    if (distanceMiles < 50) return 100;
    if (distanceMiles < 150) return 70;
    if (distanceMiles < 300) return 40;
    return 10;
}

// ============================================================
// SURGE DETECTION (real-time boosters)
// ============================================================

export interface SurgeEvent {
    type: string;
    region_code: string;
    boost_points: number;
    duration_days: number;
    detected_at: string;
}

const SURGE_BOOSTS: Record<string, number> = {
    wind_farm_announced: 15,
    bridge_replacement: 12,
    refinery_shutdown: 20,
    plant_construction: 18,
    port_expansion: 14,
    pipeline_project: 16,
    data_center_build: 12,
    emergency_utility: 25,
};

export function detectSurge(eventType: string): SurgeEvent | null {
    const boost = SURGE_BOOSTS[eventType];
    if (!boost) return null;

    return {
        type: eventType,
        region_code: "",  // caller fills
        boost_points: boost,
        duration_days: eventType === "emergency_utility" ? 7 : 90,
        detected_at: new Date().toISOString(),
    };
}

export function applyDemandSurge(
    baseScore: number,
    activeSurges: SurgeEvent[]
): { boosted_score: number; surge_active: boolean; surge_sources: string[] } {
    let boost = 0;
    const sources: string[] = [];

    for (const surge of activeSurges) {
        boost += surge.boost_points;
        sources.push(surge.type);
    }

    const boostedScore = Math.min(100, baseScore + boost);

    return {
        boosted_score: boostedScore,
        surge_active: boost > 0,
        surge_sources: sources,
    };
}
