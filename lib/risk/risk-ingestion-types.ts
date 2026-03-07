// ══════════════════════════════════════════════════════════════
// RISK INGESTION TYPES + REPORT SCHEMA
// Spec: HCOS-MAP-RISK-LAYERS-01 — ingestion section
// Purpose: Type-safe schemas for risk reports, normalized signals,
//          corridor deltas, and vehicle profiles
// Used by: API endpoints + edge functions + mobile app
// ══════════════════════════════════════════════════════════════

import type { SignalSource, RiskCategory } from "./risk-layer-registry";

// ── Risk Report (user-submitted) ──

export interface RiskReportRaw {
    reportId: string;
    reporterUserId: string;
    createdAt: string;
    country: string;
    location: { lat: number; lon: number };
    routeContext?: {
        corridorId: string | null;
        segmentId: string | null;
    };
    layerId: string;
    severity: number;
    description: string;
    evidence?: {
        photos: string[] | null;
        video: string | null;
        doc: string | null;
    };
    tags: string[];
    reporterContext: {
        role: "operator" | "broker" | "dispatcher" | "public";
        trustTier: "T0" | "T1" | "T2" | "T3" | "T4";
        device: "web" | "ios" | "android";
    };
}

// ── Normalized signal (canonical, used for scoring + tiles) ──

export type ModerationDecision = "none" | "approved" | "rejected" | "shadow_suppressed";

export interface RiskSignalNormalized {
    signalId: string;
    reportIds: string[];
    country: string;
    geom: {
        type: "point" | "line" | "polygon";
        payload: Record<string, unknown>;
    };
    layerId: string;
    severity: number;
    confidence: number;
    status: "pending" | "active" | "suppressed" | "expired";
    source: SignalSource;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    dedupeKey: string;
    moderation: {
        decision: ModerationDecision;
        reason: string | null;
    };
}

// ── Corridor risk delta event ──

export interface CorridorRiskDelta {
    corridorId: string;
    country: string;
    layerId: string;
    deltaRiskPoints: number;
    newCorridorRiskScore: number;
    computedAt: string;
}

// ── Route risk response ──

export interface RouteRiskResponse {
    routeId: string;
    origin: { lat: number; lon: number; label?: string };
    destination: { lat: number; lon: number; label?: string };
    vehicleProfileId?: string;
    countrySet: string[];
    riskTotal: number;
    riskByLayer: Record<string, number>;
    segments: {
        segmentId: string;
        totalRiskPoints: number;
        riskByLayer: Record<string, number>;
    }[];
    advisories: {
        layerId: string;
        severity: "info" | "warning" | "critical";
        message: string;
        actionable: string[];
        segmentId?: string;
    }[];
    computedAt: string;
}

// ── Vehicle Profile (for clearance + weight checks) ──

export interface VehicleProfile {
    vehicleProfileId: string;
    widthM: number;
    heightM: number;
    lengthM: number;
    weightT: number;
    hasPoleCar: boolean;
    hasChase: boolean;
    hazmat: boolean;
    notes?: string;
}

// ── Event topic payloads ──

export interface RiskTileRebuildRequest {
    layerId: string;
    country: string;
    zoomLevels: number[];
    reason: "new_signal" | "signal_expired" | "profile_updated";
    requestedAt: string;
}

// ── Anomaly detection (anti-gaming) ──

export type AnomalyType =
    | "impossible_cluster"
    | "severity_spike"
    | "trust_velocity"
    | "geo_impossibility";

export interface AnomalyFlag {
    type: AnomalyType;
    signalId: string;
    reporterUserId: string;
    details: string;
    action: "flag" | "shadow_suppress" | "quarantine";
    createdAt: string;
}

// ── Report friction rules ──

export const EVIDENCE_REQUIRED_LAYERS = ["low_bridge_clearance", "security_cargo_theft"];
export const MIN_DESCRIPTION_CHARS = 20;
export const LAW_WARNING_LAYERS = ["security_cargo_theft"];

export function validateReport(report: RiskReportRaw): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (report.severity < 0 || report.severity > 100) {
        errors.push("Severity must be 0-100");
    }

    if (report.description.length < MIN_DESCRIPTION_CHARS) {
        errors.push(`Description must be at least ${MIN_DESCRIPTION_CHARS} characters`);
    }

    if (EVIDENCE_REQUIRED_LAYERS.includes(report.layerId)) {
        const hasEvidence = report.evidence?.photos?.length ||
            report.evidence?.video || report.evidence?.doc;
        if (!hasEvidence) {
            errors.push(`Evidence required for ${report.layerId} reports`);
        }
    }

    if (!report.location?.lat || !report.location?.lon) {
        errors.push("Location required");
    }

    return { valid: errors.length === 0, errors };
}

// ── Rate limiting config ──

export const REPORT_RATE_LIMITS = {
    perUser: { count: 30, windowMinutes: 60 },
    perDevice: { count: 50, windowMinutes: 60 },
    globalBurst: { count: 1000, windowMinutes: 10 },
};

// ── Moderation queue priorities ──

export type ModerationQueue = "pending_high_impact" | "security_sensitive" | "regulatory_sensitive";

export function getModerationQueue(report: RiskReportRaw): ModerationQueue | null {
    if (report.layerId === "security_cargo_theft") return "security_sensitive";
    if (["escort_rule_variability", "seasonal_weight_restrictions", "urban_restriction_zones"].includes(report.layerId)) {
        return "regulatory_sensitive";
    }
    if (report.severity >= 80) return "pending_high_impact";
    return null;
}
