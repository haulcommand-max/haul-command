/**
 * UrgencyBadge — Broker-side corridor pressure surface.
 *
 * Shows corridor supply health with urgency-tier copy and coloring.
 * Appears on: load post flow, corridor pages, broker dashboard.
 *
 * Urgency buckets:
 *   normal    (0-30)   → "Coverage Healthy"
 *   attention (31-55)  → "Filling Slower"
 *   urgent    (56-75)  → "Limited Escorts Nearby"
 *   critical  (76-100) → "Post Now — Coverage Tight"
 *
 * Psychology copy (per YAML spec):
 *   "Escorts are booking quickly in this corridor."
 *   "Posting now improves your fill time."
 *   "Coverage is tightening — early posting recommended."
 */
"use client";

import React from "react";
import { AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type UrgencyBucket = "normal" | "attention" | "urgent" | "critical";

export interface UrgencyBadgeProps {
    /** Urgency score 0–100 */
    score?: number;
    /** Or provide bucket directly */
    bucket?: UrgencyBucket;
    /** Corridor name for display ("I-10 Gulf South") */
    corridorLabel?: string;
    /** Show full psychology copy block below the badge */
    showCopy?: boolean;
    /** Compact inline pill variant (no copy) */
    inline?: boolean;
    /** Estimated fill time for this corridor, e.g. "47 min" */
    estimatedFillTime?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────
const BUCKET_CONFIG: Record<UrgencyBucket, {
    color: string;
    bg: string;
    border: string;
    label: string;
    icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
    primaryCopy: string;
    urgencyCopy?: string;
    criticalCopy?: string;
}> = {
    normal: {
        color: "#22c55e",
        bg: "rgba(34,197,94,0.07)",
        border: "rgba(34,197,94,0.18)",
        label: "Coverage Healthy",
        icon: CheckCircle,
        primaryCopy: "Good escort coverage available in this corridor.",
    },
    attention: {
        color: "#F1A91B",
        bg: "rgba(241,169,27,0.07)",
        border: "rgba(241,169,27,0.20)",
        label: "Filling Slower",
        icon: Clock,
        primaryCopy: "Escorts are booking quickly in this corridor.",
        urgencyCopy: "Posting now improves your fill time.",
    },
    urgent: {
        color: "#f97316",
        bg: "rgba(249,115,22,0.07)",
        border: "rgba(249,115,22,0.22)",
        label: "Limited Escorts Nearby",
        icon: AlertTriangle,
        primaryCopy: "Escorts are booking quickly in this corridor.",
        urgencyCopy: "Posting now improves your fill time.",
    },
    critical: {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.08)",
        border: "rgba(239,68,68,0.25)",
        label: "Post Now — Coverage Tight",
        icon: Zap,
        primaryCopy: "Coverage is tightening — early posting recommended.",
        urgencyCopy: "Posting now improves your fill time.",
        criticalCopy: "High demand · Limited time window",
    },
};

function scoreToBucket(score: number): UrgencyBucket {
    if (score >= 76) return "critical";
    if (score >= 56) return "urgent";
    if (score >= 31) return "attention";
    return "normal";
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function UrgencyBadge({
    score,
    bucket: propBucket,
    corridorLabel,
    showCopy = false,
    inline = false,
    estimatedFillTime,
}: UrgencyBadgeProps) {
    const bucket: UrgencyBucket =
        propBucket ?? (score !== undefined ? scoreToBucket(score) : "normal");

    const cfg = BUCKET_CONFIG[bucket];
    const Icon = cfg.icon;

    // ── Inline pill ─────────────────────────────────────────────────────────
    if (inline) {
        return (
            <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                title={corridorLabel ? `${corridorLabel}: ${cfg.label}` : cfg.label}
                role="status"
                aria-label={`Supply status: ${cfg.label}`}
            >
                <Icon className="w-3 h-3 flex-shrink-0" />
                {cfg.label}
            </span>
        );
    }

    // ── Full badge (with optional copy) ─────────────────────────────────────
    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            role="status"
            aria-live="polite"
        >
            {/* Badge header */}
            <div className="flex items-center gap-2.5 px-4 py-3">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold" style={{ color: cfg.color }}>
                            {cfg.label}
                        </span>
                        {score !== undefined && (
                            <span className="text-[10px] font-black tabular-nums" style={{ color: `${cfg.color}80` }}>
                                {score}/100
                            </span>
                        )}
                    </div>
                    {corridorLabel && (
                        <span className="text-[11px]" style={{ color: `${cfg.color}70` }}>
                            {corridorLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Copy block */}
            {showCopy && (cfg.primaryCopy || estimatedFillTime) && (
                <div
                    className="px-4 py-3 border-t space-y-1"
                    style={{ borderColor: `${cfg.color}14`, background: "rgba(0,0,0,0.08)" }}
                >
                    {cfg.primaryCopy && (
                        <p className="text-xs font-medium leading-snug" style={{ color: "rgba(255,255,255,0.65)" }}>
                            {cfg.primaryCopy}
                        </p>
                    )}
                    {cfg.urgencyCopy && (
                        <p className="text-xs font-semibold" style={{ color: cfg.color }}>
                            {cfg.urgencyCopy}
                        </p>
                    )}
                    {estimatedFillTime && (
                        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                            Est. fill time: <span className="font-bold text-white">{estimatedFillTime}</span>
                        </p>
                    )}
                    {cfg.criticalCopy && (
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${cfg.color}80` }}>
                            {cfg.criticalCopy}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Corridor health badge strip ───────────────────────────────────────────────
// Use in broker load post flow to show multiple corridors at once.
export function CorridorHealthStrip({
    corridors,
}: {
    corridors: Array<{ label: string; slug: string; score: number }>;
}) {
    return (
        <div className="space-y-2" role="list" aria-label="Corridor supply health">
            {corridors.map(c => (
                <div key={c.slug} role="listitem" className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {c.label}
                    </span>
                    <UrgencyBadge score={c.score} inline />
                </div>
            ))}
        </div>
    );
}
