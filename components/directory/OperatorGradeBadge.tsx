/**
 * OperatorGradeBadge — compact letter grade badge for directory cards
 *
 * Shows A+/A/A-/B+/B/B-/C+/C/C-/D/F with color coding.
 * Accepts a composite_score (0–100) and derives the grade locally
 * OR accepts a pre-computed grade string.
 *
 * Usage:
 *   <OperatorGradeBadge score={85} />          → "A" (gold)
 *   <OperatorGradeBadge grade="B+" size="lg" /> → "B+" (blue)
 */

import React from "react";

// ── Grade mapping (mirrors the DB function) ───────────────────────────────────

const GRADE_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
    "A+": { color: "#F1A91B", bg: "rgba(241,169,27,0.12)", glow: "rgba(241,169,27,0.3)" },
    "A": { color: "#F1A91B", bg: "rgba(241,169,27,0.10)", glow: "rgba(241,169,27,0.2)" },
    "B+": { color: "#34d399", bg: "rgba(52,211,153,0.10)", glow: "rgba(52,211,153,0.2)" },
    "B": { color: "#34d399", bg: "rgba(52,211,153,0.08)", glow: "rgba(52,211,153,0.15)" },
    "C": { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", glow: "rgba(96,165,250,0.15)" },
    "D": { color: "#f97316", bg: "rgba(249,115,22,0.06)", glow: "transparent" },
    "F": { color: "#ef4444", bg: "rgba(239,68,68,0.06)", glow: "transparent" },
};

export function scoreToGrade(score: number): string {
    if (score >= 92) return "A+";
    if (score >= 85) return "A";
    if (score >= 78) return "B+";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
}

interface OperatorGradeBadgeProps {
    score?: number;
    grade?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function OperatorGradeBadge({
    score,
    grade: gradeProp,
    size = "md",
    showLabel = false,
}: OperatorGradeBadgeProps) {
    const grade = gradeProp ?? (score != null ? scoreToGrade(score) : null);
    if (!grade) return null;

    const cfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG["C"];

    const sizeClasses = {
        sm: { outer: "w-6 h-6 text-[9px]", font: "font-black" },
        md: { outer: "w-9 h-9 text-xs", font: "font-black" },
        lg: { outer: "w-12 h-12 text-base", font: "font-black" },
    }[size];

    return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
                className={`${sizeClasses.outer} ${sizeClasses.font} rounded-xl flex items-center justify-center flex-shrink-0 transition-all`}
                style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.color}40`,
                    color: cfg.color,
                    boxShadow: `0 0 12px ${cfg.glow}`,
                }}
                title={`Haul Command Grade: ${grade} (${score ?? ""})`}
            >
                {grade}
            </div>
            {showLabel && (
                <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-tight">
                    HC<br />Grade
                </div>
            )}
        </div>
    );
}
