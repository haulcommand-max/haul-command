import React from "react";
import { cn } from "@/lib/utils/cn";
import { Zap, Shield, TrendingUp } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// LoadConfidenceChip — Haul Command v4
// Industry painkiller: fill probability + urgency + coverage
// Single compact badge. No guessing. One glance = decision.
// ══════════════════════════════════════════════════════════════

interface LoadConfidenceChipProps {
    fillProbability: number;   // 0–100
    urgency: "low" | "medium" | "high" | "critical";
    coverageStrength: "thin" | "moderate" | "strong";
    className?: string;
    size?: "sm" | "md";
}

const URGENCY_CONFIG = {
    low: { dot: "bg-hc-success", label: "Warm", glow: "" },
    medium: { dot: "bg-hc-warning", label: "Urgent", glow: "" },
    high: { dot: "bg-hc-danger", label: "Hot", glow: "shadow-[0_0_8px_rgba(197,48,48,0.4)]" },
    critical: { dot: "bg-hc-danger", label: "Critical", glow: "shadow-[0_0_12px_rgba(197,48,48,0.6)] animate-pulse-gold" },
};

const COVERAGE_CONFIG = {
    thin: { icon: "▂", label: "Thin", color: "text-hc-danger" },
    moderate: { icon: "▄", label: "Moderate", color: "text-hc-warning" },
    strong: { icon: "▆", label: "Strong", color: "text-hc-success" },
};

function getProbabilityColor(p: number): string {
    if (p >= 75) return "text-hc-success";
    if (p >= 45) return "text-hc-warning";
    return "text-hc-danger";
}

export function LoadConfidenceChip({
    fillProbability,
    urgency,
    coverageStrength,
    className,
    size = "sm",
}: LoadConfidenceChipProps) {
    const urg = URGENCY_CONFIG[urgency];
    const cov = COVERAGE_CONFIG[coverageStrength];
    const probColor = getProbabilityColor(fillProbability);
    const isCompact = size === "sm";

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 rounded-full border border-hc-border bg-hc-surface/80 backdrop-blur-sm",
                isCompact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
                urg.glow,
                className,
            )}
        >
            {/* Urgency dot */}
            <span className="relative flex shrink-0">
                {(urgency === "high" || urgency === "critical") && (
                    <span className={cn(
                        "absolute inset-0 rounded-full animate-ping opacity-60",
                        urg.dot,
                    )} style={{ width: "8px", height: "8px" }} />
                )}
                <span className={cn("w-2 h-2 rounded-full", urg.dot)} />
            </span>

            {/* Fill probability */}
            <span className={cn("font-black tabular-nums", probColor)}>
                {fillProbability}%
            </span>

            {/* Divider */}
            <span className="text-hc-border-bare">·</span>

            {/* Coverage */}
            <span className={cn("font-bold", cov.color)} title={`Coverage: ${cov.label}`}>
                {cov.icon}
            </span>

            {/* Urgency label */}
            {!isCompact && (
                <>
                    <span className="text-hc-border-bare">·</span>
                    <span className="font-semibold text-hc-muted uppercase tracking-wider text-[10px]">
                        {urg.label}
                    </span>
                </>
            )}
        </div>
    );
}

// ── Confidence Bar (alternative full-width display) ──────────
export function ConfidenceBar({ fillProbability }: { fillProbability: number }) {
    const color = fillProbability >= 75 ? "bg-hc-success"
        : fillProbability >= 45 ? "bg-hc-warning"
            : "bg-hc-danger";

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-hc-muted uppercase tracking-widest">Fill Probability</span>
                <span className={cn("text-sm font-black tabular-nums", getProbabilityColor(fillProbability))}>
                    {fillProbability}%
                </span>
            </div>
            <div className="w-full h-1.5 bg-hc-elevated rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", color)}
                    style={{ width: `${Math.min(100, fillProbability)}%` }}
                />
            </div>
        </div>
    );
}

export default LoadConfidenceChip;
