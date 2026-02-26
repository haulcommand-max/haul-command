"use client";

import React from "react";
import { Users, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

// ══════════════════════════════════════════════════════════════
// CoverageConfidenceMeter — Haul Command (Broker Tool)
//
// Answers the broker's #1 question: "Will this job be covered?"
// with a single visual score, not a list.
//
// Score is 0–100, derived from:
//   • available escort count in corridor
//   • ratio vs. open load count (supply/demand)
//   • time window (weekend, rush, curfew states)
//
// Designed for the broker dashboard / load detail page.
// Data: props-driven. Wire from Supabase RPC or server action.
// ══════════════════════════════════════════════════════════════

type ConfidenceLevel = "high" | "medium" | "low";

interface CoverageConfidenceMeterProps {
    score: number;               // 0–100
    corridor?: string;           // e.g. "I-10 · TX→LA"
    escort_count?: number;       // escorts available in corridor
    backup_depth?: number;       // backups behind primary
    time_window?: string;        // "This weekend" / "Today"
    className?: string;
}

function getLevel(score: number): ConfidenceLevel {
    if (score >= 75) return "high";
    if (score >= 40) return "medium";
    return "low";
}

const LEVEL_CONFIG: Record<ConfidenceLevel, {
    label: string;
    sublabel: string;
    color: string;
    arcColor: string;
    bg: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
}> = {
    high: {
        label: "High Confidence",
        sublabel: "Coverage very likely",
        color: "text-hc-success",
        arcColor: "#22c55e",
        bg: "bg-hc-success/5",
        border: "border-hc-success/20",
        icon: Users,
    },
    medium: {
        label: "Medium Coverage",
        sublabel: "Some escorts available — book soon",
        color: "text-hc-gold-500",
        arcColor: "#F1A91B",
        bg: "bg-hc-gold-500/5",
        border: "border-hc-gold-500/20",
        icon: Users,
    },
    low: {
        label: "Thin Coverage",
        sublabel: "Book now — supply tightening",
        color: "text-hc-danger",
        arcColor: "#ef4444",
        bg: "bg-hc-danger/5",
        border: "border-hc-danger/20",
        icon: AlertTriangle,
    },
};

// SVG arc meter
function ArcMeter({ score, arcColor }: { score: number; arcColor: string }) {
    const clamped = Math.min(100, Math.max(0, score));
    // Arc from 210° to 330° (240° sweep)
    const TOTAL_ARC = 240;
    const START_ANGLE_DEG = 210;
    const R = 52; // radius
    const CX = 64;
    const CY = 68;
    const strokeWidth = 10;

    function polarToXY(angleDeg: number) {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
    }

    function describeArc(startDeg: number, endDeg: number) {
        const s = polarToXY(startDeg);
        const e = polarToXY(endDeg);
        const largeArc = endDeg - startDeg > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    }

    const endAngle = START_ANGLE_DEG + (clamped / 100) * TOTAL_ARC;

    return (
        <svg viewBox="0 0 128 100" className="w-36 h-28" aria-hidden="true">
            {/* Track */}
            <path
                d={describeArc(START_ANGLE_DEG, START_ANGLE_DEG + TOTAL_ARC)}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="text-hc-elevated"
            />
            {/* Fill */}
            {clamped > 0 && (
                <motion.path
                    d={describeArc(START_ANGLE_DEG, endAngle)}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
            )}
            {/* Score text */}
            <text
                x={CX}
                y={CY + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current font-black"
                style={{ fill: arcColor, fontSize: 22, fontWeight: 900, fontFamily: "inherit" }}
            >
                {clamped}
            </text>
            <text
                x={CX}
                y={CY + 20}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fill: "#6b7280", fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit" }}
            >
                COVERAGE
            </text>
        </svg>
    );
}

export function CoverageConfidenceMeter({
    score,
    corridor,
    escort_count = 0,
    backup_depth = 0,
    time_window,
    className,
}: CoverageConfidenceMeterProps) {
    const level = getLevel(score);
    const cfg = LEVEL_CONFIG[level];
    const Icon = cfg.icon;

    return (
        <div className={cn("hc-card p-5 space-y-4", cfg.border, cfg.bg, className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-hc-muted">Coverage Confidence</p>
                    {corridor && (
                        <p className="text-xs font-bold text-hc-muted mt-0.5">{corridor}</p>
                    )}
                </div>
                {time_window && (
                    <span className="text-[10px] font-bold text-hc-subtle bg-hc-elevated border border-hc-border px-2 py-1 rounded-lg uppercase tracking-widest">
                        {time_window}
                    </span>
                )}
            </div>

            {/* Arc meter + labels */}
            <div className="flex items-center gap-5">
                <ArcMeter score={score} arcColor={cfg.arcColor} />

                <div className="flex-1 space-y-3">
                    <div>
                        <p className={cn("text-lg font-black uppercase tracking-tight", cfg.color)}>{cfg.label}</p>
                        <p className="text-xs text-hc-muted mt-0.5">{cfg.sublabel}</p>
                    </div>

                    {/* Escort depth breakdown */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-hc-muted font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-hc-success inline-block" />
                                Primary available
                            </span>
                            <span className={cn("font-black tabular-nums", cfg.color)}>{Math.max(escort_count, 1)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-hc-subtle font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-hc-elevated border border-hc-border inline-block" />
                                Backups in area
                            </span>
                            <span className="font-black tabular-nums text-hc-muted">{backup_depth}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action if low */}
            {level === "low" && (
                <div className="flex items-center gap-2 p-3 bg-hc-danger/5 border border-hc-danger/20 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-hc-danger shrink-0" />
                    <p className="text-xs text-hc-danger font-bold">
                        Only {escort_count} pilot in range. Thin coverage — post now to secure.
                    </p>
                </div>
            )}
        </div>
    );
}

export default CoverageConfidenceMeter;
