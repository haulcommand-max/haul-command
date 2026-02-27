"use client";

import React from "react";
import {
    ChevronsUp,
    ChevronUp,
    Minus,
    ChevronDown,
    ChevronsDown,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// LOAD QUALITY INDICATOR — Up/Down Arrows (Cargo/Carvana-style)
// Surfaces on: load cards, load detail, broker profile,
// escort offer view, mobile load list
// ═══════════════════════════════════════════════════════════

export type LoadQualityLevel = "excellent" | "good" | "neutral" | "weak" | "poor";

interface LoadQualityIndicatorProps {
    /** Quality score 0-100 */
    score: number | null;
    /** Override the auto-detected level */
    level?: LoadQualityLevel;
    /** Show the label text */
    showLabel?: boolean;
    /** Show rate percentile ("Top 15% for this corridor") */
    showPercentile?: boolean;
    percentile?: number;
    /** Show corridor median reference */
    showMedianRef?: boolean;
    corridorMedian?: number;
    actualRate?: number;
    /** Display variant */
    variant?: "badge" | "card" | "inline";
    /** Custom className */
    className?: string;
}

function getLevel(score: number | null): LoadQualityLevel {
    if (score === null) return "neutral";
    if (score >= 85) return "excellent";
    if (score >= 65) return "good";
    if (score >= 45) return "neutral";
    if (score >= 25) return "weak";
    return "poor";
}

const QUALITY_CONFIG: Record<LoadQualityLevel, {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof ChevronsUp;
}> = {
    excellent: {
        label: "High-paying load",
        shortLabel: "Excellent",
        color: "#22c55e",
        bgColor: "rgba(34,197,94,0.10)",
        borderColor: "rgba(34,197,94,0.30)",
        icon: ChevronsUp,
    },
    good: {
        label: "Solid load",
        shortLabel: "Good",
        color: "#3b82f6",
        bgColor: "rgba(59,130,246,0.10)",
        borderColor: "rgba(59,130,246,0.30)",
        icon: ChevronUp,
    },
    neutral: {
        label: "Market rate",
        shortLabel: "Fair",
        color: "#9CA3AF",
        bgColor: "rgba(156,163,175,0.08)",
        borderColor: "rgba(156,163,175,0.20)",
        icon: Minus,
    },
    weak: {
        label: "Below market",
        shortLabel: "Low",
        color: "#F59E0B",
        bgColor: "rgba(245,158,11,0.10)",
        borderColor: "rgba(245,158,11,0.30)",
        icon: ChevronDown,
    },
    poor: {
        label: "Low-paying load",
        shortLabel: "Poor",
        color: "#ef4444",
        bgColor: "rgba(239,68,68,0.10)",
        borderColor: "rgba(239,68,68,0.30)",
        icon: ChevronsDown,
    },
};

export function LoadQualityIndicator({
    score,
    level: overrideLevel,
    showLabel = true,
    showPercentile = false,
    percentile,
    showMedianRef = false,
    corridorMedian,
    actualRate,
    variant = "badge",
    className = "",
}: LoadQualityIndicatorProps) {
    const level = overrideLevel ?? getLevel(score);
    const config = QUALITY_CONFIG[level];
    const Icon = config.icon;

    // ── Inline variant: just icon + optional label ──
    if (variant === "inline") {
        return (
            <span
                className={className}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    color: config.color,
                    fontSize: "12px",
                    fontWeight: 700,
                }}
                title={config.label}
            >
                <Icon style={{ width: 14, height: 14 }} />
                {showLabel && (
                    <span style={{ letterSpacing: "0.04em" }}>
                        {config.shortLabel}
                    </span>
                )}
            </span>
        );
    }

    // ── Badge variant: compact pill ──
    if (variant === "badge") {
        return (
            <div
                className={className}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    borderRadius: "8px",
                    background: config.bgColor,
                    border: `1px solid ${config.borderColor}`,
                    color: config.color,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                }}
                title={config.label}
            >
                <Icon style={{ width: 14, height: 14 }} />
                <span>{showLabel ? config.label : config.shortLabel}</span>
            </div>
        );
    }

    // ── Card variant: full info with percentile + median reference ──
    return (
        <div
            className={className}
            style={{
                padding: "12px 16px",
                borderRadius: "12px",
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
            }}
        >
            {/* Top row: icon + label */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: showPercentile || showMedianRef ? "10px" : 0,
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${config.color}18`,
                    border: `1px solid ${config.borderColor}`,
                }}>
                    <Icon style={{ width: 18, height: 18, color: config.color }} />
                </div>
                <div>
                    <div style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: config.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                    }}>
                        {config.label}
                    </div>
                    {score !== null && (
                        <div style={{ fontSize: "10px", color: "#8fa3b8", fontWeight: 500 }}>
                            Quality score: {score}/100
                        </div>
                    )}
                </div>
            </div>

            {/* Rate percentile */}
            {showPercentile && percentile !== undefined && (
                <div style={{
                    fontSize: "11px",
                    color: "#8fa3b8",
                    fontWeight: 500,
                    padding: "6px 0",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                    📊 Top <span style={{ color: config.color, fontWeight: 700 }}>
                        {percentile}%
                    </span> for this corridor
                </div>
            )}

            {/* Corridor median reference */}
            {showMedianRef && corridorMedian !== undefined && actualRate !== undefined && (
                <div style={{
                    fontSize: "11px",
                    color: "#8fa3b8",
                    fontWeight: 500,
                    padding: "6px 0",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                }}>
                    <span>Corridor median: <strong style={{ color: "#E5E7EB" }}>
                        ${corridorMedian.toLocaleString()}
                    </strong></span>
                    <span>This load: <strong style={{
                        color: actualRate >= corridorMedian ? "#22c55e" : "#ef4444",
                    }}>
                        ${actualRate.toLocaleString()}
                    </strong></span>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SCORE ENGINE — Input factors (for computation reference)
// ═══════════════════════════════════════════════════════════

export const LOAD_QUALITY_FACTORS = [
    { key: "rate_vs_corridor_median", label: "Rate vs. Corridor Median", weight: 0.30 },
    { key: "historical_broker_acceptance", label: "Broker Acceptance History", weight: 0.20 },
    { key: "time_to_fill", label: "Time to Fill", weight: 0.15 },
    { key: "escort_feedback_score", label: "Escort Feedback", weight: 0.20 },
    { key: "cancellation_rate", label: "Cancellation Rate", weight: 0.15 },
] as const;
