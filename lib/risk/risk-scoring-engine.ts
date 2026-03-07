// ══════════════════════════════════════════════════════════════
// RISK SCORING ENGINE
// Spec: HCOS-MAP-RISK-LAYERS-01 — scoring section
// Computes: segment risk points, corridor risk score,
//           route risk grade, coverage confidence
// Anti-gaming: trust tier weighting, decay, confidence filtering
// ══════════════════════════════════════════════════════════════

import {
    RISK_LAYER_CATALOG, COUNTRY_RISK_MULTIPLIERS, TTL_OVERRIDES,
    ROUTE_RISK_GRADES, getRouteRiskGrade,
    type RiskLayerDef, type RouteRiskGrade, type DecayModel,
    type SignalSource,
} from "./risk-layer-registry";

// ── Signal types ──

export interface RiskSignal {
    signalId: string;
    layerId: string;
    country: string;
    severity: number;    // 0-100
    confidence: number;  // 0-1
    source: SignalSource;
    createdAt: string;
    expiresAt: string;
    reporterTrustTier?: "T0" | "T1" | "T2" | "T3" | "T4";
    segmentId?: string;
    corridorId?: string;
    geom?: { type: string; lat?: number; lng?: number };
}

export interface SegmentRiskResult {
    segmentId: string;
    totalRiskPoints: number;
    riskByLayer: Record<string, number>;
    activeSignals: number;
}

export interface CorridorRiskResult {
    corridorId: string;
    country: string;
    riskScore: number;      // 0-100
    grade: RouteRiskGrade;
    topLayers: { layerId: string; contribution: number }[];
    signalCount: number;
}

export interface RouteRiskResult {
    routeId: string;
    totalRisk: number;
    grade: RouteRiskGrade;
    riskByLayer: Record<string, number>;
    segments: SegmentRiskResult[];
    advisories: RouteAdvisory[];
}

export interface RouteAdvisory {
    layerId: string;
    severity: "info" | "warning" | "critical";
    message: string;
    actionable: string[];
    segmentId?: string;
}

// ── Trust tier weights for anti-gaming ──

const TRUST_TIER_WEIGHTS: Record<string, number> = {
    T0: 0.40,
    T1: 0.60,
    T2: 0.80,
    T3: 1.00,
    T4: 1.15,
};

// ── Decay models ──

function computeFreshnessFactor(
    decayModel: DecayModel,
    createdAt: string,
    expiresAt: string,
    now: Date = new Date()
): number {
    const created = new Date(createdAt).getTime();
    const expires = new Date(expiresAt).getTime();
    const current = now.getTime();

    if (current >= expires) return 0;

    const totalTtl = expires - created;
    const remaining = expires - current;

    switch (decayModel) {
        case "linear":
            return Math.max(0, Math.min(1, remaining / totalTtl));
        case "exponential": {
            const ageMinutes = (current - created) / 60000;
            const k = 0.001; // decay rate
            return Math.max(0, Math.min(1, Math.exp(-k * ageMinutes)));
        }
        case "step":
            return current < expires ? 1 : 0;
        default:
            return 1;
    }
}

// ── Core scoring ──

/**
 * Compute risk points for a single signal
 * Formula: weight(L,country) × severity_norm(L) × confidence(L) × freshness_factor(L)
 */
export function computeSignalRiskPoints(
    signal: RiskSignal,
    layer: RiskLayerDef,
    now: Date = new Date()
): number {
    const countryMultipliers = COUNTRY_RISK_MULTIPLIERS[signal.country] || {};
    const countryWeight = countryMultipliers[signal.layerId] ?? 1.0;
    const totalWeight = layer.defaultWeight * countryWeight;

    const severityNorm = Math.max(0, Math.min(1, signal.severity / 100));
    const confidence = Math.max(0, Math.min(1, signal.confidence));

    // Apply trust tier weighting for user reports
    let trustWeight = 1.0;
    if (signal.source === "user_report" && signal.reporterTrustTier) {
        trustWeight = TRUST_TIER_WEIGHTS[signal.reporterTrustTier] ?? 0.60;
    }

    // Get TTL override if exists
    const ttlOverrides = TTL_OVERRIDES[signal.country];
    // Freshness uses actual expiry from signal (already computed with TTL override)
    const freshness = computeFreshnessFactor(layer.decayModel, signal.createdAt, signal.expiresAt, now);

    return totalWeight * severityNorm * confidence * trustWeight * freshness;
}

/**
 * Compute aggregate risk points for a segment (sum of all active signals)
 */
export function computeSegmentRisk(
    segmentId: string,
    signals: RiskSignal[],
    now: Date = new Date()
): SegmentRiskResult {
    const riskByLayer: Record<string, number> = {};
    let totalRiskPoints = 0;
    let activeCount = 0;

    for (const signal of signals) {
        if (signal.segmentId !== segmentId) continue;
        if (new Date(signal.expiresAt) <= now) continue;

        const layer = RISK_LAYER_CATALOG.find(l => l.layerId === signal.layerId);
        if (!layer) continue;

        const points = computeSignalRiskPoints(signal, layer, now);
        riskByLayer[signal.layerId] = (riskByLayer[signal.layerId] || 0) + points;
        totalRiskPoints += points;
        activeCount++;
    }

    return { segmentId, totalRiskPoints, riskByLayer, activeSignals: activeCount };
}

/**
 * Compute corridor-level risk score (0-100)
 * Formula: clamp(100 × (1 − exp(−avg_segment_risk_points / corridor_scale)), 0, 100)
 */
export function computeCorridorRisk(
    corridorId: string,
    country: string,
    segmentResults: SegmentRiskResult[],
): CorridorRiskResult {
    const CORRIDOR_SCALE = 2.5;

    if (segmentResults.length === 0) {
        return { corridorId, country, riskScore: 0, grade: "A", topLayers: [], signalCount: 0 };
    }

    const avgRisk = segmentResults.reduce((s, r) => s + r.totalRiskPoints, 0) / segmentResults.length;
    const riskScore = Math.min(100, Math.max(0,
        100 * (1 - Math.exp(-avgRisk / CORRIDOR_SCALE))
    ));

    // Aggregate layer contributions
    const layerTotals: Record<string, number> = {};
    let totalSignals = 0;
    for (const seg of segmentResults) {
        for (const [layerId, points] of Object.entries(seg.riskByLayer)) {
            layerTotals[layerId] = (layerTotals[layerId] || 0) + points;
        }
        totalSignals += seg.activeSignals;
    }

    const topLayers = Object.entries(layerTotals)
        .map(([layerId, contribution]) => ({ layerId, contribution }))
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 5);

    return {
        corridorId,
        country,
        riskScore: Math.round(riskScore * 10) / 10,
        grade: getRouteRiskGrade(riskScore),
        topLayers,
        signalCount: totalSignals,
    };
}

/**
 * Compute full route risk from multiple segments
 */
export function computeRouteRisk(
    routeId: string,
    segmentResults: SegmentRiskResult[],
    signals: RiskSignal[],
): RouteRiskResult {
    const riskByLayer: Record<string, number> = {};
    let totalRisk = 0;

    for (const seg of segmentResults) {
        totalRisk += seg.totalRiskPoints;
        for (const [layerId, points] of Object.entries(seg.riskByLayer)) {
            riskByLayer[layerId] = (riskByLayer[layerId] || 0) + points;
        }
    }

    const grade = getRouteRiskGrade(totalRisk);
    const advisories = generateAdvisories(segmentResults, signals);

    return { routeId, totalRisk, grade, riskByLayer, segments: segmentResults, advisories };
}

/**
 * Generate route advisories from risk data
 */
function generateAdvisories(
    segments: SegmentRiskResult[],
    signals: RiskSignal[],
): RouteAdvisory[] {
    const advisories: RouteAdvisory[] = [];

    // Check for high-severity layers across segments
    const layerMaxSeverity: Record<string, { severity: number; segmentId?: string }> = {};

    for (const signal of signals) {
        const current = layerMaxSeverity[signal.layerId];
        if (!current || signal.severity > current.severity) {
            layerMaxSeverity[signal.layerId] = { severity: signal.severity, segmentId: signal.segmentId };
        }
    }

    for (const [layerId, data] of Object.entries(layerMaxSeverity)) {
        const layer = RISK_LAYER_CATALOG.find(l => l.layerId === layerId);
        if (!layer) continue;

        if (data.severity >= 80) {
            advisories.push({
                layerId,
                severity: "critical",
                message: `Critical: ${layer.name} — severity ${data.severity}/100`,
                actionable: layer.ui.actionable,
                segmentId: data.segmentId,
            });
        } else if (data.severity >= 50) {
            advisories.push({
                layerId,
                severity: "warning",
                message: `Warning: ${layer.name} — severity ${data.severity}/100`,
                actionable: layer.ui.actionable,
                segmentId: data.segmentId,
            });
        } else if (data.severity >= 25) {
            advisories.push({
                layerId,
                severity: "info",
                message: `Info: ${layer.name} detected on route`,
                actionable: layer.ui.actionable.slice(0, 1),
                segmentId: data.segmentId,
            });
        }
    }

    return advisories.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
    });
}

// ══════════════════════════════════════════════════════════════
// COVERAGE CONFIDENCE (extends existing engine)
// Formula:
//   0.30 × operator_density +
//   0.20 × reports_density +
//   0.20 × partner_feed_presence +
//   0.15 × map_match_quality +
//   0.15 × recency
// ══════════════════════════════════════════════════════════════

export interface CoverageConfidenceInputs {
    verifiedOperatorDensity: number; // 0-1
    liveReportsDensity: number;      // 0-1
    partnerFeedPresence: number;     // 0-1
    mapMatchQuality: number;         // 0-1
    recencyOfUpdates: number;        // 0-1
}

export function computeCoverageConfidence(inputs: CoverageConfidenceInputs): number {
    const score =
        0.30 * inputs.verifiedOperatorDensity +
        0.20 * inputs.liveReportsDensity +
        0.20 * inputs.partnerFeedPresence +
        0.15 * inputs.mapMatchQuality +
        0.15 * inputs.recencyOfUpdates;

    return Math.round(Math.max(0, Math.min(100, score * 100)));
}

export function getCoverageConfidenceBand(score: number): "low" | "medium" | "high" {
    if (score <= 35) return "low";
    if (score <= 70) return "medium";
    return "high";
}

// ══════════════════════════════════════════════════════════════
// DEDUPE — prevents gaming via duplicate reports
// Key: hash(layer_id + geohash_7 + time_bucket_30m + severity_band)
// ══════════════════════════════════════════════════════════════

export function generateDedupeKey(
    layerId: string,
    lat: number,
    lng: number,
    severity: number,
    timestamp: Date = new Date()
): string {
    // Simple geohash approximation (7-digit precision ≈ ±76m)
    const geoKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    // 30-minute time bucket
    const timeBucket = Math.floor(timestamp.getTime() / (30 * 60 * 1000));
    // Severity band (0-25, 25-50, 50-75, 75-100)
    const severityBand = Math.floor(severity / 25);

    return `${layerId}:${geoKey}:${timeBucket}:${severityBand}`;
}

const MERGE_WINDOW_MS = 180 * 60 * 1000; // 3 hours

export function shouldMerge(
    existingKey: string,
    existingTimestamp: Date,
    newKey: string,
    newTimestamp: Date
): boolean {
    if (existingKey !== newKey) return false;
    const delta = Math.abs(newTimestamp.getTime() - existingTimestamp.getTime());
    return delta <= MERGE_WINDOW_MS;
}
