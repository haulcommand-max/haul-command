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
    Briefcase, MapPin, Award, Flame, Shield, Flag,
    Lock, BarChart3, Phone, Eye
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

    /** Equipment flair tags — Reddit-style neon equipment badges */
    equipmentTypes?: string[];  // e.g. ["High Pole", "Steerable", "Route Survey"]

    /** Public trust score — HC Reputation (0-100), shown on every card */
    trustScore?: number;

    /** Social proof line — freshness-priority, caller picks the most recent */
    socialProofLine?: string;   // "Last load completed: 2 hours ago"

    /** Confidence score 0-100 → drives performance strip width */
    confidenceScore?: number;

    /** Whether this listing has been claimed by its owner */
    isClaimed?: boolean;

    /** Contact info — masked when unclaimed (GDPR/PIPEDA/LGPD/POPIA compliance) */
    phone?: string | null;
    email?: string | null;

    /** Demand signal counter — FOMO mechanic */
    demandSignals?: {
        searchesThisWeek?: number;
        viewsThisWeek?: number;
        contactAttempts?: number;
    };

    /** Profile completion percentage (0-100) — LinkedIn psychology */
    profileCompletion?: number;

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

// ── Win #1: Equipment Flair Tags (Reddit pattern) ────────────────────────────
const FLAIR_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
    "high pole": { bg: "rgba(239,68,68,0.10)", fg: "#ef4444", border: "rgba(239,68,68,0.25)" },
    "steerable": { bg: "rgba(59,130,246,0.10)", fg: "#3b82f6", border: "rgba(59,130,246,0.25)" },
    "route survey": { bg: "rgba(168,85,247,0.10)", fg: "#a855f7", border: "rgba(168,85,247,0.25)" },
    "wind": { bg: "rgba(6,182,212,0.10)", fg: "#06b6d4", border: "rgba(6,182,212,0.25)" },
    "superload": { bg: "rgba(245,158,11,0.10)", fg: "#f59e0b", border: "rgba(245,158,11,0.25)" },
    "mobile home": { bg: "rgba(34,197,94,0.10)", fg: "#22c55e", border: "rgba(34,197,94,0.25)" },
    "transformer": { bg: "rgba(244,63,94,0.10)", fg: "#f43f5e", border: "rgba(244,63,94,0.25)" },
    "pilot car": { bg: "rgba(241,169,27,0.10)", fg: "#F1A91B", border: "rgba(241,169,27,0.25)" },
    "lead car": { bg: "rgba(99,102,241,0.10)", fg: "#6366f1", border: "rgba(99,102,241,0.25)" },
    "chase car": { bg: "rgba(139,92,246,0.10)", fg: "#8b5cf6", border: "rgba(139,92,246,0.25)" },
};
const DEFAULT_FLAIR = { bg: "rgba(255,255,255,0.06)", fg: "#9ca3af", border: "rgba(255,255,255,0.10)" };

function EquipmentFlairTags({ tags }: { tags: string[] }) {
    if (!tags.length) return null;
    return (
        <div className="flex flex-wrap gap-1" role="list" aria-label="Equipment types">
            {tags.slice(0, 5).map(tag => {
                const key = tag.toLowerCase();
                const colors = FLAIR_COLORS[key] ?? DEFAULT_FLAIR;
                return (
                    <span
                        key={tag}
                        role="listitem"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{
                            background: colors.bg,
                            color: colors.fg,
                            border: `1px solid ${colors.border}`,
                            letterSpacing: "0.06em",
                        }}
                    >
                        {tag}
                    </span>
                );
            })}
            {tags.length > 5 && (
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#5A6577", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    +{tags.length - 5}
                </span>
            )}
        </div>
    );
}

// ── Win #2: Public Trust Score Badge (Reddit karma pattern) ──────────────────
function TrustScoreBadge({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const tier =
        clamped >= 90 ? { label: "ELITE", color: "#F1A91B", glow: "rgba(241,169,27,0.3)" } :
            clamped >= 70 ? { label: "STRONG", color: "#22c55e", glow: "rgba(34,197,94,0.2)" } :
                clamped >= 40 ? { label: "BUILDING", color: "#3b82f6", glow: "rgba(59,130,246,0.15)" } :
                    { label: "NEW", color: "#6b7280", glow: "rgba(107,114,128,0.1)" };
    return (
        <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
                background: `linear-gradient(135deg, ${tier.glow} 0%, rgba(0,0,0,0) 100%)`,
                border: `1px solid ${tier.color}33`,
            }}
            title={`HC Reputation: ${clamped}/100 — ${tier.label}`}
            aria-label={`Trust score: ${clamped} out of 100`}
        >
            <Flame className="w-3 h-3" style={{ color: tier.color }} />
            <span
                className="text-xs font-black tabular-nums"
                style={{ color: tier.color, fontFamily: "'JetBrains Mono', monospace" }}
            >
                {clamped}
            </span>
        </div>
    );
}

// ── Win #3: Claim This Listing CTA (Yellow Pages pattern) ────────────────────
function ClaimListingBanner({ id }: { id: string }) {
    return (
        <Link aria-label="Navigation Link"
            href={`/claim/${id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all group"
            style={{
                background: "rgba(241,169,27,0.04)",
                border: "1px dashed rgba(241,169,27,0.20)",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(241,169,27,0.08)";
                e.currentTarget.style.borderColor = "rgba(241,169,27,0.35)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(241,169,27,0.04)";
                e.currentTarget.style.borderColor = "rgba(241,169,27,0.20)";
            }}
        >
            <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F1A91B" }} />
            <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold" style={{ color: "rgba(241,169,27,0.9)" }}>
                    Is this your business?
                </span>
                <span className="text-[10px] ml-1" style={{ color: "#5A6577" }}>
                    Claim this listing
                </span>
            </div>
            <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: "rgba(241,169,27,0.12)", color: "#F1A91B" }}
            >
                Free
            </span>
        </Link>
    );
}

// ── Contact Masking (GDPR/PIPEDA/LGPD/POPIA legal compliance) ────────────────
function ContactMaskedBanner() {
    return (
        <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{
                background: "rgba(59,130,246,0.04)",
                border: "1px solid rgba(59,130,246,0.12)",
            }}
        >
            <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#3b82f6" }} />
            <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold" style={{ color: "#94a3b8" }}>
                    📞 Contact info available after listing is claimed
                </span>
            </div>
        </div>
    );
}

// ── Profile Completion Meter (LinkedIn psychology) ───────────────────────────
function ProfileCompletionMeter({ completion }: { completion: number }) {
    const clamped = Math.max(0, Math.min(100, completion));
    const color =
        clamped >= 80 ? "#22c55e" :
            clamped >= 50 ? "#F1A91B" :
                clamped >= 25 ? "#f97316" : "#ef4444";
    const label =
        clamped >= 80 ? "Strong" :
            clamped >= 50 ? "Good" :
                clamped >= 25 ? "Basic" : "Incomplete";
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#5A6577" }}>
                    Profile Strength
                </span>
                <span className="text-[10px] font-bold" style={{ color }}>
                    {clamped}% — {label}
                </span>
            </div>
            <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
            >
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${clamped}%`, background: color }}
                />
            </div>
        </div>
    );
}

// ── Demand Signal Counter (FOMO mechanic / Phantom Demand) ───────────────────
function DemandSignalCounter({ signals }: {
    signals: { searchesThisWeek?: number; viewsThisWeek?: number; contactAttempts?: number }
}) {
    const items: { icon: React.ReactNode; text: string }[] = [];
    if (signals.searchesThisWeek && signals.searchesThisWeek > 0) {
        items.push({
            icon: <BarChart3 className="w-3 h-3" style={{ color: "#F1A91B" }} />,
            text: `${signals.searchesThisWeek} searches in this area this week`,
        });
    }
    if (signals.viewsThisWeek && signals.viewsThisWeek > 0) {
        items.push({
            icon: <Eye className="w-3 h-3" style={{ color: "#3b82f6" }} />,
            text: `${signals.viewsThisWeek} brokers viewed this listing`,
        });
    }
    if (signals.contactAttempts && signals.contactAttempts > 0) {
        items.push({
            icon: <Phone className="w-3 h-3" style={{ color: "#22c55e" }} />,
            text: `${signals.contactAttempts} contact attempts`,
        });
    }
    if (!items.length) return null;
    return (
        <div
            className="flex flex-col gap-1 px-3 py-2 rounded-lg"
            style={{
                background: "rgba(241,169,27,0.03)",
                border: "1px solid rgba(241,169,27,0.08)",
            }}
        >
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-[10px] font-semibold" style={{ color: "#94a3b8" }}>
                        {item.text}
                    </span>
                </div>
            ))}
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
    equipmentTypes = [],
    trustScore,
    socialProofLine,
    confidenceScore,
    isClaimed = true,
    phone,
    email,
    demandSignals,
    profileCompletion,
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
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Win #2: Public Trust Score */}
                            {trustScore !== undefined && <TrustScoreBadge score={trustScore} />}
                            {/* Availability indicator */}
                            <AvailabilityDot status={status} />
                        </div>
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

            {/* ── Zone 3a: Equipment Flair Tags (Win #1) ── */}
            {equipmentTypes.length > 0 && (
                <EquipmentFlairTags tags={equipmentTypes} />
            )}

            {/* ── Zone 3b: Specialization chips ── */}
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

            {/* ── Zone 5b: Profile Completion Meter (LinkedIn psychology) ── */}
            {isClaimed && profileCompletion !== undefined && profileCompletion < 100 && (
                <ProfileCompletionMeter completion={profileCompletion} />
            )}

            {/* ── Zone 5c: Contact Masking (legal compliance) ── */}
            {!isClaimed && <ContactMaskedBanner />}

            {/* ── Zone 5d: Demand Signal Counter (Phantom Demand) ── */}
            {demandSignals && <DemandSignalCounter signals={demandSignals} />}

            {/* ── Zone 6: Dual CTA row ── */}
            <div className="flex gap-2 mt-auto pt-1">
                {isClaimed && onRequestEscort && (
                    <button aria-label="Interactive Button"
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
                <Link aria-label="Navigation Link"
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

            {/* ── Zone 7: Claim This Listing (Win #3 — Yellow Pages pattern) ── */}
            {!isClaimed && (
                <ClaimListingBanner id={id} />
            )}
        </article>
    );
}
