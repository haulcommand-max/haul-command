"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, Cloud, Shield, UserX } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// PredictiveRiskBadge — Haul Command v4
// Simple color badges only. No long text, no panic language.
// One badge = one pre-emptive signal. Operators scan and decide.
// ══════════════════════════════════════════════════════════════

export type RiskType =
    | "no_show_risk"     // red — driver likely to no-show based on history
    | "thin_coverage"    // orange — corridor has <3 eligible escorts
    | "permit_timing"    // amber — permit window closing within 6 hours
    | "weather_flag";    // blue — weather advisory on route

interface PredictiveRiskBadgeProps {
    risks: RiskType[];
    size?: "xs" | "sm" | "md";
    className?: string;
}

const RISK_CONFIG: Record<RiskType, {
    label: string;
    short: string;   // 2-4 char abbreviation for xs size
    icon: React.ElementType;
    bg: string;
    text: string;
    border: string;
    dot: string;
}> = {
    no_show_risk: {
        label: "No-Show Risk",
        short: "NSR",
        icon: UserX,
        bg: "bg-hc-danger/10",
        text: "text-hc-danger",
        border: "border-hc-danger/30",
        dot: "bg-hc-danger",
    },
    thin_coverage: {
        label: "Thin Coverage",
        short: "THIN",
        icon: AlertCircle,
        bg: "bg-hc-warning/10",
        text: "text-hc-warning",
        border: "border-hc-warning/30",
        dot: "bg-hc-warning",
    },
    permit_timing: {
        label: "Permit Closing",
        short: "PMT",
        icon: Shield,
        bg: "bg-hc-gold-500/10",
        text: "text-hc-gold-500",
        border: "border-hc-gold-500/30",
        dot: "bg-hc-gold-500",
    },
    weather_flag: {
        label: "Weather Flag",
        short: "WX",
        icon: Cloud,
        bg: "bg-hc-info/10",
        text: "text-hc-info",
        border: "border-hc-info/30",
        dot: "bg-hc-info",
    },
};

export function PredictiveRiskBadge({
    risks,
    size = "sm",
    className,
}: PredictiveRiskBadgeProps) {
    if (!risks.length) return null;

    if (size === "xs") {
        // Dot cluster — minimal footprint, scannable
        return (
            <div className={cn("flex items-center gap-1", className)}>
                {risks.map(risk => {
                    const cfg = RISK_CONFIG[risk];
                    return (
                        <span
                            key={risk}
                            title={cfg.label}
                            className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                cfg.dot,
                            )}
                        />
                    );
                })}
            </div>
        );
    }

    if (size === "sm") {
        // Text pill — abbreviated
        return (
            <div className={cn("flex items-center flex-wrap gap-1", className)}>
                {risks.map(risk => {
                    const cfg = RISK_CONFIG[risk];
                    const Icon = cfg.icon;
                    return (
                        <span
                            key={risk}
                            title={cfg.label}
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide leading-none",
                                cfg.bg, cfg.text, cfg.border,
                            )}
                        >
                            <Icon className="w-2.5 h-2.5" />
                            {cfg.short}
                        </span>
                    );
                })}
            </div>
        );
    }

    // md — full label
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {risks.map(risk => {
                const cfg = RISK_CONFIG[risk];
                const Icon = cfg.icon;
                return (
                    <div
                        key={risk}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl border",
                            cfg.bg, cfg.border,
                        )}
                    >
                        <Icon className={cn("w-4 h-4 shrink-0", cfg.text)} />
                        <span className={cn("text-sm font-semibold", cfg.text)}>
                            {cfg.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default PredictiveRiskBadge;
