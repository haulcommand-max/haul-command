/**
 * SupplyPressureBadge
 *
 * Renders the Coverage Action Level (CAL) badge for directory tiles and region pages.
 * Powered by market_pressure_snapshots. Falls back gracefully when no data.
 *
 * Input: cal_label ("CRITICAL" | "TIGHT" | "WATCH" | "NORMAL" | "STRONG")
 *        + optional pf24 (PF24 score for "Surge Risk" detection)
 *        + optional low_data_flag
 *        + optional demand_trend
 */

import React from "react";
import { AlertTriangle, TrendingUp, Shield, Activity, CheckCircle } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const CAL_CONFIG = {
    CRITICAL: {
        label: "Critical Shortage",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.12)",
        border: "rgba(239,68,68,0.35)",
        glow: "rgba(239,68,68,0.25)",
        icon: AlertTriangle,
        pulse: true,
    },
    TIGHT: {
        label: "Tight Coverage",
        color: "#f97316",
        bg: "rgba(249,115,22,0.10)",
        border: "rgba(249,115,22,0.30)",
        glow: "rgba(249,115,22,0.20)",
        icon: AlertTriangle,
        pulse: false,
    },
    WATCH: {
        label: "Coverage Watch",
        color: "#eab308",
        bg: "rgba(234,179,8,0.10)",
        border: "rgba(234,179,8,0.25)",
        glow: "transparent",
        icon: Activity,
        pulse: false,
    },
    NORMAL: {
        label: "Normal Coverage",
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.08)",
        border: "rgba(96,165,250,0.20)",
        glow: "transparent",
        icon: Shield,
        pulse: false,
    },
    STRONG: {
        label: "Strong Coverage",
        color: "#34d399",
        bg: "rgba(52,211,153,0.08)",
        border: "rgba(52,211,153,0.20)",
        glow: "transparent",
        icon: CheckCircle,
        pulse: false,
    },
} as const;

type CalLabel = keyof typeof CAL_CONFIG;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SupplyPressureBadgeProps {
    calLabel?: string | null;
    pressureNow?: number | null;    // PN (0–100)
    pressure24h?: number | null;    // PF24 (0–100)
    demandTrend?: number | null;    // >1.35 = spike
    lowDataFlag?: boolean;
    premiumLow?: number | null;    // e.g. 12
    premiumHigh?: number | null;    // e.g. 20
    size?: "sm" | "md" | "lg";
    showPremium?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SupplyPressureBadge({
    calLabel,
    pressureNow,
    pressure24h,
    demandTrend,
    lowDataFlag = false,
    premiumLow,
    premiumHigh,
    size = "sm",
    showPremium = false,
}: SupplyPressureBadgeProps) {

    // Low data → show neutral badge, not shortage
    if (lowDataFlag) {
        return (
            <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}
            >
                Low Data
            </div>
        );
    }

    // Derive CAL label from score if string not provided
    const resolvedLabel = ((): CalLabel => {
        if (calLabel && calLabel in CAL_CONFIG) return calLabel as CalLabel;
        const cal = pressureNow ?? 0;
        if (cal >= 85) return "CRITICAL";
        if (cal >= 70) return "TIGHT";
        if (cal >= 55) return "WATCH";
        if (cal >= 40) return "NORMAL";
        return "STRONG";
    })();

    const cfg = CAL_CONFIG[resolvedLabel];
    const Icon = cfg.icon;

    // Secondary badge: "Surge Risk" when PF24 > PN by 10+ points
    const showSurgeRisk = (pressure24h ?? 0) >= 70
        && (pressure24h ?? 0) > (pressureNow ?? 0) + 10;

    // Secondary badge: "Demand Spike" when demand_trend >= 1.35
    const showDemandSpike = (demandTrend ?? 1) >= 1.35;

    const sizeClasses = {
        sm: "px-2 py-0.5 text-[9px] gap-1",
        md: "px-2.5 py-1 text-[10px] gap-1.5",
        lg: "px-3 py-1.5 text-xs gap-2",
    }[size];

    const iconSize = { sm: "w-2.5 h-2.5", md: "w-3 h-3", lg: "w-3.5 h-3.5" }[size];

    return (
        <div className="flex flex-wrap items-center gap-1">
            {/* Main CAL badge */}
            <div
                className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${sizeClasses} ${cfg.pulse ? "animate-pulse" : ""}`}
                style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    color: cfg.color,
                    boxShadow: `0 0 10px ${cfg.glow}`,
                }}
            >
                <Icon className={iconSize} />
                {cfg.label}
            </div>

            {/* Surge Risk secondary badge */}
            {showSurgeRisk && (
                <div
                    className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${sizeClasses}`}
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316" }}
                >
                    <TrendingUp className={iconSize} />
                    Surge Risk
                </div>
            )}

            {/* Demand spike secondary badge */}
            {showDemandSpike && resolvedLabel !== "CRITICAL" && (
                <div
                    className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${sizeClasses}`}
                    style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.20)", color: "#eab308" }}
                >
                    <TrendingUp className={iconSize} />
                    Demand Spike
                </div>
            )}

            {/* Premium advisory (opt-in) */}
            {showPremium && premiumLow != null && premiumHigh != null && resolvedLabel !== "NORMAL" && resolvedLabel !== "STRONG" && (
                <div
                    className={`inline-flex items-center rounded-full font-bold flex-shrink-0 ${sizeClasses}`}
                    style={{ background: "rgba(241,169,27,0.08)", border: "1px solid rgba(241,169,27,0.20)", color: "#F1A91B" }}
                >
                    +{premiumLow}–{premiumHigh}%
                </div>
            )}
        </div>
    );
}

// ── Utility: compute CAL label from raw score ─────────────────────────────────
export function calLabelFromScore(cal: number): CalLabel {
    if (cal >= 85) return "CRITICAL";
    if (cal >= 70) return "TIGHT";
    if (cal >= 55) return "WATCH";
    if (cal >= 40) return "NORMAL";
    return "STRONG";
}

// ── Utility: compute premium range from CAL ───────────────────────────────────
export function premiumRangeFromCal(cal: number): [number, number] {
    if (cal >= 85) return [20, 35];
    if (cal >= 70) return [12, 20];
    if (cal >= 55) return [6, 12];
    if (cal >= 40) return [0, 6];
    return [0, 0];
}
