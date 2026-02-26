/**
 * TrustChips — Reusable trust signal chips for directory cards,
 * leaderboard rows, and profile headers.
 *
 * USAGE:
 *   <TrustChips verified responseMinutes={12} onTimeRate={96} jobsCompleted={84} lastActive="Today" />
 *
 * Chips only render when their value prop is provided (truthy).
 * Never shows "NO DATA" — absent fields simply omit the chip.
 */

import React from "react";
import { ShieldCheck, Clock, TrendingUp, CheckCircle, Activity } from "lucide-react";

export interface TrustChipsProps {
    /** Show the green Verified shield */
    verified?: boolean;
    /** Average response time in minutes */
    responseMinutes?: number | null;
    /** On-time rate 0–100 */
    onTimeRate?: number | null;
    /** Total jobs completed */
    jobsCompleted?: number | null;
    /** Human-readable last-active string, e.g. "Today", "3d ago" */
    lastActive?: string | null;
    /** Extra CSS classes on the wrapper */
    className?: string;
    /** Compact mode — smaller text + tighter padding */
    compact?: boolean;
}

const BASE =
    "inline-flex items-center gap-1 rounded-md font-semibold tracking-wide uppercase leading-none whitespace-nowrap border";

function chipSize(compact: boolean) {
    return compact
        ? "px-1.5 py-[3px] text-[9px]"
        : "px-2 py-1 text-[10px]";
}

export function TrustChips({
    verified,
    responseMinutes,
    onTimeRate,
    jobsCompleted,
    lastActive,
    className = "",
    compact = false,
}: TrustChipsProps) {
    const chips: React.ReactNode[] = [];
    const sz = chipSize(compact);

    if (verified) {
        chips.push(
            <span
                key="verified"
                className={`${BASE} ${sz}`}
                style={{
                    background: "rgba(34,197,94,0.08)",
                    borderColor: "rgba(34,197,94,0.22)",
                    color: "var(--hc-success, #22c55e)",
                }}
            >
                <ShieldCheck className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                Verified
            </span>
        );
    }

    if (responseMinutes != null && responseMinutes > 0) {
        chips.push(
            <span
                key="response"
                className={`${BASE} ${sz}`}
                style={{
                    background: "rgba(241,169,27,0.07)",
                    borderColor: "rgba(241,169,27,0.2)",
                    color: "var(--hc-gold-400, #E0B05C)",
                }}
            >
                <Clock className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                {responseMinutes}m
            </span>
        );
    }

    if (onTimeRate != null && onTimeRate > 0) {
        const color =
            onTimeRate >= 90 ? "var(--hc-success)" :
                onTimeRate >= 70 ? "var(--hc-warning)" :
                    "var(--hc-danger)";
        const bg =
            onTimeRate >= 90 ? "rgba(34,197,94,0.07)" :
                onTimeRate >= 70 ? "rgba(245,158,11,0.07)" :
                    "rgba(239,68,68,0.07)";
        const border =
            onTimeRate >= 90 ? "rgba(34,197,94,0.18)" :
                onTimeRate >= 70 ? "rgba(245,158,11,0.18)" :
                    "rgba(239,68,68,0.18)";
        chips.push(
            <span
                key="ontime"
                className={`${BASE} ${sz}`}
                style={{ background: bg, borderColor: border, color }}
            >
                <TrendingUp className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                {Math.round(onTimeRate)}%
            </span>
        );
    }

    if (jobsCompleted != null && jobsCompleted > 0) {
        chips.push(
            <span
                key="jobs"
                className={`${BASE} ${sz}`}
                style={{
                    background: "rgba(59,164,255,0.07)",
                    borderColor: "rgba(59,164,255,0.18)",
                    color: "var(--hc-info, #3b82f6)",
                }}
            >
                <CheckCircle className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                {jobsCompleted} jobs
            </span>
        );
    }

    if (lastActive && lastActive !== "Unknown") {
        chips.push(
            <span
                key="active"
                className={`${BASE} ${sz}`}
                style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "var(--hc-subtle, #5A6577)",
                }}
            >
                <Activity className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
                {lastActive}
            </span>
        );
    }

    if (chips.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {chips}
        </div>
    );
}

export default TrustChips;
