/**
 * FreshnessBadge — shows Online / Active / Stale based on last_seen_at.
 * 
 * Thresholds (configurable):
 *   Online  < 5 min   → green pulse
 *   Active  < 60 min  → blue
 *   Stale   ≥ 60 min  → gray
 *
 * PRIVACY: shows label only, never the precise timestamp.
 */

import React from "react";

export const FRESHNESS_THRESHOLDS = {
    ONLINE_MINUTES: 5,
    ACTIVE_MINUTES: 60,
} as const;

export type FreshnessStatus = "online" | "active" | "stale" | "unknown";

export function getFreshnessStatus(lastSeenAt: string | null | undefined): FreshnessStatus {
    if (!lastSeenAt) return "unknown";
    const diffMs = Date.now() - new Date(lastSeenAt).getTime();
    const diffMin = diffMs / 60_000;
    if (diffMin < FRESHNESS_THRESHOLDS.ONLINE_MINUTES) return "online";
    if (diffMin < FRESHNESS_THRESHOLDS.ACTIVE_MINUTES) return "active";
    return "stale";
}

const STATUS_CONFIG: Record<FreshnessStatus, {
    label: string;
    color: string;
    bg: string;
    border: string;
    pulse: boolean;
}> = {
    online: { label: "Online", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", pulse: true },
    active: { label: "Active", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)", pulse: false },
    stale: { label: "Stale", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", pulse: false },
    unknown: { label: "—", color: "#374151", bg: "rgba(55,65,81,0.1)", border: "rgba(55,65,81,0.15)", pulse: false },
};

interface Props {
    lastSeenAt: string | null | undefined;
    className?: string;
}

export function FreshnessBadge({ lastSeenAt, className = "" }: Props) {
    const status = getFreshnessStatus(lastSeenAt);
    const cfg = STATUS_CONFIG[status];
    if (status === "unknown") return null;

    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0",
                className,
            ].join(" ")}
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
            title="Freshness signal — time since last activity"
        >
            <span
                className={["w-1.5 h-1.5 rounded-full", cfg.pulse ? "animate-pulse" : ""].join(" ")}
                style={{ background: cfg.color }}
            />
            {cfg.label}
        </span>
    );
}
