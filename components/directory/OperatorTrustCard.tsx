/**
 * OperatorTrustCard v2
 *
 * A high-conversion decision unit for directory listings.
 * Turns a passive profile into a trust-dense, action-oriented card.
 *
 * Layout zones (top → bottom):
 *   1. Header identity    — avatar, name, verification badges, availability dot
 *   2. Trust metrics row  — 4-col grid: jobs, on-time %, response, years active
 *   3. Specialization chips — corridor/service tags, max 4 + overflow
 *   4. Performance strip  — thin confidence bar (reliability visual)
 *   5. Social proof line  — freshness-first context ("Last load: 2h ago")
 *   6. Dual CTA row       — "Request Escort" (gold) + "View Profile" (ghost)
 *   7. Monetization badges — Fast Response (paid), Featured (paid), Top 10% (earned)
 *
 * All data is optional — if not provided, that section is omitted cleanly.
 * No "N/A" or "0" fallbacks ever rendered.
 */
"use client";

import React from "react";
import Link from "next/link";
import {
    CheckCircle, Zap, TrendingUp, Clock, Star,
    Briefcase, MapPin, Award
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type AvailabilityStatus = "available" | "busy" | "offline";

export interface OperatorTrustCardProps {
    /** Core identity */
    id: string;
    name: string;
    profileHref?: string;
    location?: string; // "Houston, TX"

    /** Availability */
    status?: AvailabilityStatus;

    /** Trust metrics — omit any to hide that metric */
    jobsCompleted?: number;
    onTimeRatePct?: number;     // 0-100
    medianResponseMin?: number; // minutes
    yearsActive?: number;

    /** Verification / badge system */
    isVerified?: boolean;
    isFastResponse?: boolean;   // paid badge (median < 15 min)
    isTopPercent?: boolean;     // earned — top 10% leaderboard
    isFeatured?: boolean;       // paid — featured in corridor

    /** Specialization chips */
    specializations?: string[]; // e.g. ["I-75 Specialist", "Superload Certified"]

    /** Social proof line — freshness-priority, caller picks the most recent */
    socialProofLine?: string;   // "Last load completed: 2 hours ago"

    /** Confidence score 0-100 → drives performance strip width */
    confidenceScore?: number;

    /** Request escort action — omit for View-only mode */
    onRequestEscort?: () => void;

    /** Compact variant — for dense list views */
    compact?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarCircle({ name, size = 56 }: { name: string; size?: number }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? "")
        .join("");
    return (
        <div
            className="flex-shrink-0 rounded-full flex items-center justify-center font-black select-none"
            style={{
                width: size,
                height: size,
                background: "linear-gradient(135deg, rgba(241,169,27,0.18) 0%, rgba(241,169,27,0.08) 100%)",
                border: "1.5px solid rgba(241,169,27,0.25)",
                fontSize: size * 0.3,
                color: "#F1A91B",
                letterSpacing: "-0.02em",
            }}
            aria-label={name}
        >
            {initials}
        </div>
    );
}

function AvailabilityDot({ status }: { status: AvailabilityStatus }) {
    const config = {
        available: { color: "#22c55e", label: "Available", pulse: true },
        busy: { color: "#F1A91B", label: "Busy", pulse: false },
        offline: { color: "#4b5563", label: "Offline", pulse: false },
    }[status];

    return (
        <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: config.color }}
            aria-label={config.label}
        >
            <span className="relative flex h-2 w-2 flex-shrink-0">
                {config.pulse && (
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                        style={{ background: config.color }}
                    />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: config.color }} />
            </span>
            {config.label}
        </span>
    );
}

function MetricCell({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-black text-white tabular-nums leading-none">
                {value.toLocaleString()}{suffix}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#5A6577" }}>
                {label}
            </span>
        </div>
    );
}

function SpecializationChips({ chips }: { chips: string[] }) {
    const visible = chips.slice(0, 4);
    const overflow = chips.length - 4;
    return (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Specializations">
            {visible.map(chip => (
                <span
                    key={chip}
                    role="listitem"
                    className="trust-chip"
                    style={{
                        background: "rgba(241,169,27,0.07)",
                        color: "rgba(241,169,27,0.85)",
                        border: "1px solid rgba(241,169,27,0.18)",
                    }}
                >
                    {chip}
                </span>
            ))}
            {overflow > 0 && (
                <span
                    className="trust-chip"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#5A6577", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                    +{overflow} more
                </span>
            )}
        </div>
    );
}

function PerformanceStrip({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const color =
        clamped >= 80 ? "#22c55e" :
            clamped >= 55 ? "#F1A91B" :
                clamped >= 30 ? "#f97316" : "#ef4444";
    return (
        <div title={`Confidence score: ${clamped}/100`}>
            <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 5, background: "rgba(255,255,255,0.06)" }}
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${clamped}%`, background: color }}
                />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#3A4553" }}>
                    Reliability
                </span>
                <span className="text-[9px] font-bold" style={{ color }}>
                    {clamped}%
                </span>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OperatorTrustCard({
    id,
    name,
    profileHref,
    location,
    status = "offline",
    jobsCompleted,
    onTimeRatePct,
    medianResponseMin,
    yearsActive,
    isVerified,
    isFastResponse,
    isTopPercent,
    isFeatured,
    specializations = [],
    socialProofLine,
    confidenceScore,
    onRequestEscort,
    compact = false,
}: OperatorTrustCardProps) {
    const href = profileHref ?? `/directory/operator/${id}`;
    const pad = compact ? "p-4" : "p-5";

    // Build metrics — only show if value > 0
    const metrics: Array<{ label: string; value: number; suffix: string }> = [
        ...(jobsCompleted ? [{ label: "Jobs", value: jobsCompleted, suffix: "" }] : []),
        ...(onTimeRatePct ? [{ label: "On-Time", value: onTimeRatePct, suffix: "%" }] : []),
        ...(medianResponseMin ? [{ label: "Response", value: medianResponseMin, suffix: "m" }] : []),
        ...(yearsActive ? [{ label: "Yrs Active", value: yearsActive, suffix: "" }] : []),
    ];

    return (
        <article
            className={`hc-card ${pad} flex flex-col gap-4 hover:-translate-y-0.5 hover:border-[rgba(241,169,27,0.2)] transition-all duration-150`}
            style={{ maxWidth: 420 }}
            aria-label={`Operator: ${name}`}
        >
            {/* ── Zone 1: Header identity ── */}
            <div className="flex items-start gap-3">
                <AvatarCircle name={name} size={compact ? 44 : 56} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3
                                className="font-bold text-white leading-tight truncate"
                                style={{ fontSize: compact ? 14 : 15 }}
                            >
                                {name}
                            </h3>
                            {location && (
                                <p className="flex items-center gap-1 mt-0.5" style={{ color: "#5A6577" }}>
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="text-xs truncate">{location}</span>
                                </p>
                            )}
                        </div>
                        {/* Availability indicator */}
                        <AvailabilityDot status={status} />
                    </div>

                    {/* Verification badges */}
                    {(isVerified || isFastResponse || isTopPercent || isFeatured) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {isVerified && (
                                <span className="trust-chip" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                                </span>
                            )}
                            {isFastResponse && (
                                <span className="trust-chip" style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
                                    <Zap className="w-2.5 h-2.5" /> Fast Response
                                </span>
                            )}
                            {isTopPercent && (
                                <span className="trust-chip" style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
                                    <TrendingUp className="w-2.5 h-2.5" /> Top 10%
                                </span>
                            )}
                            {isFeatured && (
                                <span className="trust-chip" style={{ background: "rgba(241,169,27,0.10)", color: "#F1A91B", border: "1px solid rgba(241,169,27,0.28)" }}>
                                    <Star className="w-2.5 h-2.5" /> Featured
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Zone 2: Trust metrics row ── */}
            {metrics.length > 0 && (
                <div
                    className="grid rounded-xl py-3 px-2"
                    style={{
                        gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        gap: "1px",
                    }}
                >
                    {metrics.map((m, i) => (
                        <React.Fragment key={m.label}>
                            <MetricCell label={m.label} value={m.value} suffix={m.suffix} />
                            {i < metrics.length - 1 && (
                                <div style={{ position: "absolute", display: "none" }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* ── Zone 3: Specialization chips ── */}
            {specializations.length > 0 && (
                <SpecializationChips chips={specializations} />
            )}

            {/* ── Zone 4: Performance strip ── */}
            {confidenceScore !== undefined && (
                <PerformanceStrip score={confidenceScore} />
            )}

            {/* ── Zone 5: Social proof line ── */}
            {socialProofLine && (
                <p
                    className="text-xs font-medium leading-snug"
                    style={{ color: "#5A6577" }}
                    aria-label="Recent activity"
                >
                    <Clock className="w-3 h-3 inline-block mr-1 -mt-px" style={{ color: "#3A4553" }} />
                    {socialProofLine}
                </p>
            )}

            {/* ── Zone 6: Dual CTA row ── */}
            <div className="flex gap-2 mt-auto pt-1">
                {onRequestEscort && (
                    <button
                        onClick={onRequestEscort}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all press-scale"
                        style={{
                            background: "#F1A91B",
                            color: "#000",
                            boxShadow: "0 0 20px rgba(241,169,27,0.15)",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#E0A318"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#F1A91B"; }}
                        aria-label={`Request escort from ${name}`}
                    >
                        <Briefcase className="w-3.5 h-3.5" />
                        Request Escort
                    </button>
                )}
                <Link
                    href={href}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.7)",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    }}
                    aria-label={`View profile of ${name}`}
                >
                    View Profile
                </Link>
            </div>
        </article>
    );
}
