// ══════════════════════════════════════════════════════════════
// ROUTE INTELLIGENCE ENGINE
// 10x Move #1: "Google Maps for Oversize Loads"
//
// Given: origin + destination + load dimensions
// Returns: states/countries crossed, escorts per segment,
//          permit requirements, travel windows, bridge/tunnel
//          restrictions, estimated cost, coverage confidence
//
// WHY 10x: Every route = an indexable page. Thousands of
//          city-pair combinations = massive long-tail SEO.
//          Captures the highest-intent query: "I need to
//          move THIS load from HERE to THERE"
// ══════════════════════════════════════════════════════════════

export interface LoadDimensions {
    widthM: number;
    heightM: number;
    lengthM: number;
    weightT: number;
    description?: string;
    loadType?: string; // "wind_turbine_blade", "transformer", etc.
}

export interface RouteSegment {
    segmentId: string;
    jurisdiction: string; // state code or country code
    jurisdictionName: string;
    entryPoint: string;
    exitPoint: string;
    distanceKm: number;
    estimatedHours: number;
    /** Escort requirements for THIS segment given load dimensions */
    escortRequirement: SegmentEscortRequirement;
    /** Permit needed for this segment */
    permitRequired: boolean;
    permitAuthority: string;
    permitEstimatedCost?: number;
    /** Travel restrictions */
    travelRestrictions: TravelRestriction[];
    /** Known hazards */
    hazards: RouteHazard[];
    /** Escort coverage confidence in this segment */
    coverageConfidence: number; // 0-100
}

export interface SegmentEscortRequirement {
    escortsNeeded: number;
    escortType: "civil" | "police" | "both" | "none";
    reason: string; // e.g. "Width 4.2m exceeds 12ft threshold"
    positioning: string; // e.g. "One front on 2-lane, one rear on 4-lane"
}

export interface TravelRestriction {
    type: "time_window" | "day_restriction" | "seasonal" | "speed_limit" | "bridge_weight" | "tunnel_height" | "road_closure";
    description: string;
    severity: "blocking" | "significant" | "minor";
}

export interface RouteHazard {
    type: "low_bridge" | "narrow_road" | "weight_restricted_bridge" | "tunnel" | "railroad_crossing" | "school_zone" | "urban_congestion" | "mountain_pass" | "construction_zone";
    location: string;
    clearanceM?: number;
    weightLimitT?: number;
    description: string;
}

export interface RouteIntelligenceResult {
    routeId: string;
    origin: string;
    destination: string;
    loadDimensions: LoadDimensions;
    totalDistanceKm: number;
    totalEstimatedHours: number;
    segments: RouteSegment[];

    /** Aggregate results */
    totalEscortsNeeded: number; // max across all segments
    totalPermitsRequired: number;
    estimatedTotalPermitCost: number;
    estimatedTotalEscortCost: number;
    overallCoverageConfidence: number; // 0-100

    /** Risk summary */
    riskGrade: "A" | "B" | "C" | "D" | "F";
    criticalWarnings: string[];
    recommendations: string[];

    /** SEO metadata for this route page */
    seoMeta: RouteSeoMeta;
}

export interface RouteSeoMeta {
    url: string;
    title: string;
    metaDescription: string;
    h1: string;
    voiceAnswer: string;
}

// ── US State Escort Thresholds (simplified for calculation) ──

interface StateThreshold {
    state: string;
    /** Width (m) that triggers first escort */
    escort1WidthM: number;
    /** Width (m) that triggers second escort */
    escort2WidthM: number;
    /** Height (m) threshold */
    heightThresholdM: number;
    /** Length (m) threshold */
    lengthThresholdM: number;
    /** Estimated permit cost (single trip) */
    permitCostEstimate: number;
    /** Police escort threshold width (m) */
    policeEscortWidthM?: number;
}

const US_STATE_THRESHOLDS: StateThreshold[] = [
    { state: "AL", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.42, lengthThresholdM: 25.91, permitCostEstimate: 30 },
    { state: "AK", escort1WidthM: 3.05, escort2WidthM: 4.88, heightThresholdM: 4.57, lengthThresholdM: 32.00, permitCostEstimate: 75 },
    { state: "AZ", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 15 },
    { state: "AR", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.57, lengthThresholdM: 27.43, permitCostEstimate: 25 },
    { state: "CA", escort1WidthM: 3.35, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 16, policeEscortWidthM: 4.88 },
    { state: "CO", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 15 },
    { state: "CT", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 35 },
    { state: "DE", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 25 },
    { state: "FL", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 20 },
    { state: "GA", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 10 },
    { state: "HI", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.27, lengthThresholdM: 19.81, permitCostEstimate: 50 },
    { state: "ID", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 32.00, permitCostEstimate: 35 },
    { state: "IL", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 20 },
    { state: "IN", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 20 },
    { state: "IA", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 10 },
    { state: "KS", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 20 },
    { state: "KY", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.57, lengthThresholdM: 30.48, permitCostEstimate: 30 },
    { state: "LA", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 20 },
    { state: "ME", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 14 },
    { state: "MD", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 25 },
    { state: "MA", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.27, lengthThresholdM: 21.34, permitCostEstimate: 40 },
    { state: "MI", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 15 },
    { state: "MN", escort1WidthM: 3.05, escort2WidthM: 4.57, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 15 },
    { state: "MS", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 10 },
    { state: "MO", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.57, lengthThresholdM: 24.38, permitCostEstimate: 15 },
    { state: "MT", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 20 },
    { state: "NE", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.57, lengthThresholdM: 30.48, permitCostEstimate: 10 },
    { state: "NV", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 12 },
    { state: "NH", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 35 },
    { state: "NJ", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 50 },
    { state: "NM", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 33.53, permitCostEstimate: 25 },
    { state: "NY", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 60, policeEscortWidthM: 4.88 },
    { state: "NC", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.11, lengthThresholdM: 24.38, permitCostEstimate: 10 },
    { state: "ND", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 20 },
    { state: "OH", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 25 },
    { state: "OK", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 50 },
    { state: "OR", escort1WidthM: 3.05, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 32.00, permitCostEstimate: 50 },
    { state: "PA", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 30, policeEscortWidthM: 5.18 },
    { state: "RI", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 35 },
    { state: "SC", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 10 },
    { state: "SD", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 20 },
    { state: "TN", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 30 },
    { state: "TX", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.88, lengthThresholdM: 38.10, permitCostEstimate: 60 },
    { state: "UT", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 30 },
    { state: "VT", escort1WidthM: 3.66, escort2WidthM: 4.57, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 25 },
    { state: "VA", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.27, lengthThresholdM: 24.38, permitCostEstimate: 20 },
    { state: "WA", escort1WidthM: 3.05, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 32.00, permitCostEstimate: 50 },
    { state: "WV", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 20 },
    { state: "WI", escort1WidthM: 3.66, escort2WidthM: 4.27, heightThresholdM: 4.42, lengthThresholdM: 24.38, permitCostEstimate: 20 },
    { state: "WY", escort1WidthM: 3.66, escort2WidthM: 4.88, heightThresholdM: 4.42, lengthThresholdM: 30.48, permitCostEstimate: 15 },
];

// ── Route Analysis Engine ──

export function analyzeRoute(
    origin: string,
    destination: string,
    statesCrossed: string[],
    load: LoadDimensions,
    segmentDistances?: number[]
): RouteIntelligenceResult {
    const segments: RouteSegment[] = statesCrossed.map((state, i) => {
        const threshold = US_STATE_THRESHOLDS.find(s => s.state === state);
        const dist = segmentDistances?.[i] ?? 200; // default 200km

        let escortsNeeded = 0;
        let escortType: SegmentEscortRequirement["escortType"] = "none";
        let reason = "Load within standard limits";
        let positioning = "No escort required";

        if (threshold) {
            if (load.widthM >= threshold.escort2WidthM) {
                escortsNeeded = 2;
                escortType = threshold.policeEscortWidthM && load.widthM >= threshold.policeEscortWidthM ? "both" : "civil";
                reason = `Width ${load.widthM}m exceeds ${threshold.escort2WidthM}m two-escort threshold`;
                positioning = "One front, one rear";
            } else if (load.widthM >= threshold.escort1WidthM || load.heightM >= threshold.heightThresholdM || load.lengthM >= threshold.lengthThresholdM) {
                escortsNeeded = 1;
                escortType = "civil";
                const triggers = [];
                if (load.widthM >= threshold.escort1WidthM) triggers.push(`width ${load.widthM}m ≥ ${threshold.escort1WidthM}m`);
                if (load.heightM >= threshold.heightThresholdM) triggers.push(`height ${load.heightM}m ≥ ${threshold.heightThresholdM}m`);
                if (load.lengthM >= threshold.lengthThresholdM) triggers.push(`length ${load.lengthM}m ≥ ${threshold.lengthThresholdM}m`);
                reason = `Exceeds: ${triggers.join(", ")}`;
                positioning = "Front on 2-lane highways, rear on 4-lane";
            }
        }

        return {
            segmentId: `${origin}-${destination}-${state}`,
            jurisdiction: state,
            jurisdictionName: state, // would map to full name
            entryPoint: i === 0 ? origin : `${statesCrossed[i - 1]}/${state} border`,
            exitPoint: i === statesCrossed.length - 1 ? destination : `${state}/${statesCrossed[i + 1]} border`,
            distanceKm: dist,
            estimatedHours: dist / 80,
            escortRequirement: { escortsNeeded, escortType, reason, positioning },
            permitRequired: escortsNeeded > 0,
            permitAuthority: `${state} DOT`,
            permitEstimatedCost: threshold?.permitCostEstimate ?? 25,
            travelRestrictions: buildTravelRestrictions(state, load),
            hazards: [],
            coverageConfidence: 65, // would be computed from nearest-resolver
        };
    });

    const totalDist = segments.reduce((s, seg) => s + seg.distanceKm, 0);
    const totalHours = segments.reduce((s, seg) => s + seg.estimatedHours, 0);
    const maxEscorts = Math.max(...segments.map(s => s.escortRequirement.escortsNeeded), 0);
    const permitsNeeded = segments.filter(s => s.permitRequired).length;
    const permitCost = segments.reduce((s, seg) => s + (seg.permitEstimatedCost ?? 0), 0);
    const escortCostPerDay = maxEscorts * 500;
    const escortDays = Math.ceil(totalHours / 10); // 10h driving day
    const escortCost = escortCostPerDay * escortDays;
    const avgCoverage = segments.reduce((s, seg) => s + seg.coverageConfidence, 0) / segments.length;

    const criticalWarnings: string[] = [];
    if (maxEscorts >= 2) criticalWarnings.push("⚠️ Two escorts required on some segments");
    if (segments.some(s => s.escortRequirement.escortType === "both")) criticalWarnings.push("🚔 Police escort required on some segments");
    if (avgCoverage < 50) criticalWarnings.push("🔴 Low escort coverage on this route");
    segments.forEach(s => s.travelRestrictions.filter(r => r.severity === "blocking").forEach(r => criticalWarnings.push(`🚫 ${s.jurisdiction}: ${r.description}`)));

    const riskGrade: RouteIntelligenceResult["riskGrade"] =
        criticalWarnings.length === 0 ? "A" :
            criticalWarnings.length <= 1 ? "B" :
                criticalWarnings.length <= 3 ? "C" :
                    criticalWarnings.length <= 5 ? "D" : "F";

    const originSlug = origin.toLowerCase().replace(/[\s,]+/g, "-");
    const destSlug = destination.toLowerCase().replace(/[\s,]+/g, "-");

    return {
        routeId: `${originSlug}-to-${destSlug}`,
        origin,
        destination,
        loadDimensions: load,
        totalDistanceKm: Math.round(totalDist),
        totalEstimatedHours: Math.round(totalHours * 10) / 10,
        segments,
        totalEscortsNeeded: maxEscorts,
        totalPermitsRequired: permitsNeeded,
        estimatedTotalPermitCost: permitCost,
        estimatedTotalEscortCost: escortCost,
        overallCoverageConfidence: Math.round(avgCoverage),
        riskGrade,
        criticalWarnings,
        recommendations: buildRecommendations(segments, load),
        seoMeta: {
            url: `/route/${originSlug}-to-${destSlug}`,
            title: `Oversize Load: ${origin} to ${destination} — Escort & Permit Guide | Haul Command`,
            metaDescription: `Plan your oversize load from ${origin} to ${destination}. ${permitsNeeded} permits, ${maxEscorts} escort(s) needed. Estimated cost: $${permitCost + escortCost}. Check coverage now.`,
            h1: `${origin} to ${destination} — Oversize Route Intelligence`,
            voiceAnswer: `Moving an oversize load from ${origin} to ${destination} crosses ${statesCrossed.length} states. You need ${permitsNeeded} permits and up to ${maxEscorts} escort vehicles. Estimated total permit cost is $${permitCost}. Escort costs run about $${escortCost} for this route.`,
        },
    };
}

function buildTravelRestrictions(state: string, load: LoadDimensions): TravelRestriction[] {
    const restrictions: TravelRestriction[] = [];
    // Common restrictions
    if (load.widthM > 4.27) {
        restrictions.push({ type: "time_window", description: "Daylight hours only (30 min after sunrise to 30 min before sunset)", severity: "significant" });
    }
    if (["NY", "NJ", "CT", "MA", "PA"].includes(state)) {
        restrictions.push({ type: "day_restriction", description: "No oversize moves on holidays or holiday weekends", severity: "significant" });
    }
    if (load.heightM > 4.42) {
        restrictions.push({ type: "tunnel_height", description: "Route must avoid low-clearance tunnels and bridges", severity: "blocking" });
    }
    return restrictions;
}

function buildRecommendations(segments: RouteSegment[], load: LoadDimensions): string[] {
    const recs: string[] = [];
    const highEscortStates = segments.filter(s => s.escortRequirement.escortsNeeded >= 2);
    if (highEscortStates.length > 0) {
        recs.push(`Book escorts early for ${highEscortStates.map(s => s.jurisdiction).join(", ")} — two required`);
    }
    recs.push("Apply for all state permits at least 5 business days before departure");
    if (load.heightM > 4.27) recs.push("Request bridge clearance data from each state DOT");
    if (load.widthM > 4.27) recs.push("Confirm travel windows — most states restrict to daylight hours for loads this wide");
    recs.push("Use Haul Command to verify escort availability along each segment before dispatch");
    return recs;
}

// ── Programmatic Route Page Generator ──

export function generateTopRoutePages(
    cities: string[],
    maxPages: number = 500
): RouteSeoMeta[] {
    const pages: RouteSeoMeta[] = [];
    for (let i = 0; i < cities.length && pages.length < maxPages; i++) {
        for (let j = 0; j < cities.length && pages.length < maxPages; j++) {
            if (i !== j) {
                const origin = cities[i];
                const dest = cities[j];
                const oSlug = origin.toLowerCase().replace(/[\s,]+/g, "-");
                const dSlug = dest.toLowerCase().replace(/[\s,]+/g, "-");
                pages.push({
                    url: `/route/${oSlug}-to-${dSlug}`,
                    title: `Oversize Load: ${origin} to ${dest} — Permit & Escort Guide | Haul Command`,
                    metaDescription: `Plan oversize transport from ${origin} to ${dest}. Get permit costs, escort requirements, and coverage confidence for your route.`,
                    h1: `${origin} to ${dest} — Oversize Route Intelligence`,
                    voiceAnswer: `To move an oversize load from ${origin} to ${dest}, you'll need permits and typically one or two escort vehicles. Use Haul Command for exact costs and escort availability.`,
                });
            }
        }
    }
    return pages;
}
