"use client";

import React from "react";
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

// ═══════════════════════════════════════════════════════════
// TRUST SCORE BADGE — Global Report Card
// Surfaces on: profile headers, search cards, leaderboard,
// load match screen, broker view, mobile profiles
// ═══════════════════════════════════════════════════════════

export type TrustTier = "elite" | "strong" | "watch" | "risk" | "unrated";

interface TrustScoreBadgeProps {
    score: number | null;
    /** Compact: just the badge. Full: badge + label + breakdown hint */
    variant?: "compact" | "full" | "inline";
    /** Entity type for contextual labeling */
    entityType?: "broker" | "escort" | "carrier" | "provider";
    /** Show the numeric score */
    showScore?: boolean;
    /** Custom className */
    className?: string;
}

function getTier(score: number | null): TrustTier {
    if (score === null || score < 0) return "unrated";
    if (score >= 90) return "elite";
    if (score >= 75) return "strong";
    if (score >= 60) return "watch";
    return "risk";
}

const TIER_CONFIG: Record<TrustTier, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    icon: typeof Shield;
}> = {
    elite: {
        label: "Elite",
        color: "#22c55e",
        bgColor: "rgba(34,197,94,0.08)",
        borderColor: "rgba(34,197,94,0.25)",
        glowColor: "rgba(34,197,94,0.15)",
        icon: ShieldCheck,
    },
    strong: {
        label: "Strong",
        color: "#3b82f6",
        bgColor: "rgba(59,130,246,0.08)",
        borderColor: "rgba(59,130,246,0.25)",
        glowColor: "rgba(59,130,246,0.15)",
        icon: ShieldCheck,
    },
    watch: {
        label: "Watch",
        color: "#F59E0B",
        bgColor: "rgba(245,158,11,0.08)",
        borderColor: "rgba(245,158,11,0.25)",
        glowColor: "rgba(245,158,11,0.10)",
        icon: ShieldAlert,
    },
    risk: {
        label: "Risk",
        color: "#ef4444",
        bgColor: "rgba(239,68,68,0.08)",
        borderColor: "rgba(239,68,68,0.25)",
        glowColor: "rgba(239,68,68,0.10)",
        icon: AlertTriangle,
    },
    unrated: {
        label: "Unrated",
        color: "#6b7280",
        bgColor: "rgba(107,114,128,0.08)",
        borderColor: "rgba(107,114,128,0.20)",
        glowColor: "transparent",
        icon: Shield,
    },
};

export function TrustScoreBadge({
    score,
    variant = "compact",
    entityType = "escort",
    showScore = true,
    className = "",
}: TrustScoreBadgeProps) {
    const tier = getTier(score);
    const config = TIER_CONFIG[tier];
    const Icon = config.icon;

    if (variant === "inline") {
        return (
            <span
                className={className}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: config.color,
                }}
                title={`Trust Score: ${score ?? "N/A"} — ${config.label}`}
            >
                <Icon style={{ width: 12, height: 12 }} />
                {showScore && score !== null ? score : config.label}
            </span>
        );
    }

    if (variant === "compact") {
        return (
            <div
                className={className}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: config.bgColor,
                    border: `1px solid ${config.borderColor}`,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: config.color,
                    letterSpacing: "0.04em",
                }}
                title={`Trust Score: ${score ?? "N/A"} — ${config.label}`}
            >
                <Icon style={{ width: 14, height: 14 }} />
                {showScore && score !== null && (
                    <span>{score}</span>
                )}
                <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {config.label}
                </span>
            </div>
        );
    }

    // variant === "full"
    return (
        <div
            className={className}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 16px",
                borderRadius: "12px",
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                boxShadow: `0 0 20px ${config.glowColor}`,
            }}
        >
            {/* Score circle */}
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${config.bgColor}, transparent)`,
                    border: `2px solid ${config.borderColor}`,
                    fontSize: "16px",
                    fontWeight: 900,
                    color: config.color,
                    fontFamily: "var(--font-display)",
                }}
            >
                {score !== null ? score : "—"}
            </div>
            <div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                }}>
                    <Icon style={{ width: 14, height: 14, color: config.color }} />
                    <span style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: config.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                    }}>
                        {config.label} {entityType}
                    </span>
                </div>
                <div style={{ fontSize: "11px", color: "#8fa3b8", fontWeight: 500 }}>
                    {tier === "elite" && "Top-tier marketplace reputation"}
                    {tier === "strong" && "Reliable marketplace participant"}
                    {tier === "watch" && "Building track record"}
                    {tier === "risk" && "Review recommended before engagement"}
                    {tier === "unrated" && "Not enough activity to rate"}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// TRUST SCORE FACTORS — For profile breakdown display
// ═══════════════════════════════════════════════════════════

export const BROKER_TRUST_FACTORS = [
    { key: "payment_speed", label: "Payment Speed", weight: 0.25, icon: "💳" },
    { key: "rate_competitiveness", label: "Rate Competitiveness", weight: 0.20, icon: "📊" },
    { key: "cancellation_rate", label: "Cancellation Rate", weight: 0.15, icon: "❌" },
    { key: "escort_feedback", label: "Escort Feedback", weight: 0.20, icon: "⭐" },
    { key: "dispute_history", label: "Dispute History", weight: 0.10, icon: "⚖️" },
    { key: "fill_efficiency", label: "Fill Efficiency", weight: 0.10, icon: "⚡" },
] as const;

export const ESCORT_TRUST_FACTORS = [
    { key: "on_time_rate", label: "On-Time Rate", weight: 0.25, icon: "⏱️" },
    { key: "acceptance_rate", label: "Acceptance Rate", weight: 0.15, icon: "✅" },
    { key: "incident_rate", label: "Safety Record", weight: 0.20, icon: "🛡️" },
    { key: "broker_feedback", label: "Broker Feedback", weight: 0.20, icon: "⭐" },
    { key: "corridor_reliability", label: "Corridor Reliability", weight: 0.10, icon: "🛣️" },
    { key: "activity_consistency", label: "Activity Consistency", weight: 0.10, icon: "📈" },
] as const;
