"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
    TrendingUp, TrendingDown, Minus,
    Flame, CheckCircle2, Clock, Zap,
    BarChart2, ShieldCheck,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// DailyMomentumBar — Haul Command v4
// Operator dopamine loop. Subtle performance strip, tied to
// real earnings/reliability data. NO gamification language.
// NO XP. NO levels. Just: jobs, streak, trend.
// ══════════════════════════════════════════════════════════════

type TrendDir = "up" | "down" | "flat";
type Role = "escort" | "broker";

export interface EscortMomentum {
    role: "escort";
    jobsThisWeek: number;
    jobsLastWeek: number;
    onTimeStreak: number;    // consecutive on-time jobs
    reliabilityPct: number;    // 0–100
    reliabilityTrend: TrendDir;
    earningsTrend: TrendDir;  // vs 7-day avg
}

export interface BrokerMomentum {
    role: "broker";
    dispatchStreak: number;    // consecutive successful dispatches
    avgFillMinutes: number;
    avgFillTrend: TrendDir;  // "up" = slower (bad), "down" = faster (good)
    riskScore: "low" | "medium" | "high";
    riskTrend: TrendDir;
}

export type MomentumData = EscortMomentum | BrokerMomentum;

// ── Trend indicator ──────────────────────────────────────────
function TrendIcon({ dir, positiveDir = "up" }: { dir: TrendDir; positiveDir?: "up" | "down" }) {
    const isGood = dir === positiveDir;
    const isFlat = dir === "flat";
    const IconEl = isFlat ? Minus : isGood ? TrendingUp : TrendingDown;
    return (
        <IconEl className={cn("w-3 h-3", {
            "text-hc-success": isGood,
            "text-hc-danger": !isGood && !isFlat,
            "text-hc-muted": isFlat,
        })} />
    );
}

// ── Single metric pill ───────────────────────────────────────
function MomentumPill({
    icon: Icon,
    label,
    value,
    trend,
    positiveDir = "up" as "up" | "down",
    highlight = false,
    className,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    trend?: TrendDir;
    positiveDir?: "up" | "down";
    highlight?: boolean;
    className?: string;
}) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl bg-hc-elevated border border-hc-border-bare",
            highlight && "border-hc-gold-500/30 bg-hc-gold-500/5",
            className,
        )}>
            <Icon className={cn("w-3.5 h-3.5 shrink-0", highlight ? "text-hc-gold-500" : "text-hc-muted")} />
            <div className="min-w-0">
                <div className="text-[10px] text-hc-subtle uppercase tracking-widest font-semibold leading-none mb-0.5 truncate">
                    {label}
                </div>
                <div className="flex items-center gap-1">
                    <span className={cn(
                        "text-sm font-black tabular-nums leading-none",
                        highlight ? "text-hc-gold-500" : "text-hc-text",
                    )}>
                        {value}
                    </span>
                    {trend && <TrendIcon dir={trend} positiveDir={positiveDir} />}
                </div>
            </div>
        </div>
    );
}

// ── Escort view ──────────────────────────────────────────────
function EscortMomentumView({ data }: { data: EscortMomentum }) {
    const jobTrend: TrendDir = data.jobsThisWeek > data.jobsLastWeek ? "up"
        : data.jobsThisWeek < data.jobsLastWeek ? "down" : "flat";

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {/* Jobs this week */}
            <MomentumPill
                icon={Zap}
                label="This Week"
                value={`${data.jobsThisWeek} job${data.jobsThisWeek !== 1 ? "s" : ""}`}
                trend={jobTrend}
                highlight={jobTrend === "up"}
            />

            {/* On-time streak */}
            {data.onTimeStreak > 0 && (
                <MomentumPill
                    icon={data.onTimeStreak >= 5 ? Flame : CheckCircle2}
                    label="On-Time Streak"
                    value={`${data.onTimeStreak} in a row`}
                    highlight={data.onTimeStreak >= 5}
                />
            )}

            {/* Reliability */}
            <MomentumPill
                icon={ShieldCheck}
                label="Reliability"
                value={`${data.reliabilityPct}%`}
                trend={data.reliabilityTrend}
                highlight={data.reliabilityPct >= 90}
            />

            {/* Earnings trend */}
            <MomentumPill
                icon={TrendingUp}
                label="Earnings"
                value={data.earningsTrend === "up" ? "Above avg" : data.earningsTrend === "down" ? "Below avg" : "On track"}
                trend={data.earningsTrend}
                highlight={data.earningsTrend === "up"}
            />
        </div>
    );
}

// ── Broker view ──────────────────────────────────────────────
function BrokerMomentumView({ data }: { data: BrokerMomentum }) {
    const riskColor: Record<string, string> = {
        low: "text-hc-success",
        medium: "text-hc-warning",
        high: "text-hc-danger",
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {/* Dispatch streak */}
            {data.dispatchStreak > 0 && (
                <MomentumPill
                    icon={data.dispatchStreak >= 5 ? Flame : CheckCircle2}
                    label="Dispatch Streak"
                    value={`${data.dispatchStreak} clean`}
                    highlight={data.dispatchStreak >= 5}
                />
            )}

            {/* Avg fill speed */}
            <MomentumPill
                icon={Clock}
                label="Avg Fill"
                value={`${data.avgFillMinutes}min`}
                // "down" is good for fill time (faster)
                trend={data.avgFillTrend}
                positiveDir="down"
                highlight={data.avgFillMinutes < 30}
            />

            {/* Risk score */}
            <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl bg-hc-elevated border border-hc-border-bare",
            )}>
                <BarChart2 className="w-3.5 h-3.5 shrink-0 text-hc-muted" />
                <div>
                    <div className="text-[10px] text-hc-subtle uppercase tracking-widest font-semibold leading-none mb-0.5">
                        Portfolio Risk
                    </div>
                    <div className={cn("text-sm font-black leading-none", riskColor[data.riskScore])}>
                        {data.riskScore.charAt(0).toUpperCase() + data.riskScore.slice(1)}
                        {" "}
                        <TrendIcon dir={data.riskTrend} positiveDir="down" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export function DailyMomentumBar({
    data,
    className,
}: {
    data: MomentumData;
    className?: string;
}) {
    return (
        <div className={cn("w-full", className)}>
            {data.role === "escort"
                ? <EscortMomentumView data={data} />
                : <BrokerMomentumView data={data} />}
        </div>
    );
}

// ── Skeleton ────────────────────────────────────────────────
export function DailyMomentumBarSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {[100, 140, 110, 120].map((w, i) => (
                <div key={i} className="skeleton h-11 rounded-xl shrink-0" style={{ width: w }} />
            ))}
        </div>
    );
}

export default DailyMomentumBar;
