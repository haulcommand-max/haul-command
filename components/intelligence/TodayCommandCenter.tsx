"use client";

import React, { useEffect, useState, Suspense } from "react";
import { cn } from "@/lib/utils/cn";
import { NextBestAction } from "@/components/intelligence/NextBestAction";
import { DailyMomentumBar, DailyMomentumBarSkeleton, type MomentumData } from "@/components/engagement/DailyMomentumBar";
import { WhereToGoNext } from "@/components/intelligence/WhereToGoNext";
import CorridorRiskWidget from "@/components/intelligence/CorridorRiskWidget";
import { PredictiveRiskBadge, type RiskType } from "@/components/intelligence/PredictiveRiskBadge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { AlertTriangle, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { CorridorPulseBanner } from "@/components/feed/CorridorPulseBanner";
import { LiveActivityFeed } from "@/components/feed/LiveActivityFeed";

// ══════════════════════════════════════════════════════════════
// TodayCommandCenter — Haul Command v4 (Phase 3 Core)
// Above-fold intelligent dashboard. Role-aware. ≤ 1s to first paint.
// Static shell renders instantly → data hydrates async.
// ══════════════════════════════════════════════════════════════

type Role = "escort" | "broker";

// ── Escort ────────────────────────────────────────────────────
interface EscortCommandData {
    role: "escort";
    userId: string;
    availabilityStatus: "available" | "busy" | "offline";
    openLoadsNearby: number;
    hasActiveJob: boolean;
    corridorHeat: "low" | "building" | "hot";
    momentum: MomentumData | null;
    complianceRisks: RiskType[];
    // WhereToGoNext props — city + state only (no lat/lng)
    suggestedCity?: string;
    suggestedState?: string;
    demandSignal?: "low" | "building" | "hot" | "critical";
    deadheadMiles?: number;
}

// ── Broker ────────────────────────────────────────────────────
interface BrokerCommandData {
    role: "broker";
    userId: string;
    atRiskLoads: number;
    unfilledLoads: number;
    avgFillMinutes: number;
    momentum: MomentumData | null;
    portfolioRisks: RiskType[];
}

export type CommandData = EscortCommandData | BrokerCommandData;

interface TodayCommandCenterProps {
    data: CommandData | null;  // null = loading state
    className?: string;
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("space-y-2", className)}>
            {title && (
                <div className="flex items-center gap-2 px-0.5">
                    <span className="text-[10px] font-black text-hc-subtle uppercase tracking-[0.2em]">{title}</span>
                    <div className="flex-1 h-px bg-hc-border-bare" />
                </div>
            )}
            {children}
        </div>
    );
}

// ── At-Risk Load Alert (broker only) ───────────────────────────
function AtRiskAlert({ count }: { count: number }) {
    if (!count) return null;
    return (
        <Link href="/loads?filter=at_risk">
            <div className="flex items-center gap-3 px-4 py-3 hc-card border-hc-danger/40 bg-hc-danger/5 hover:border-hc-danger/60 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-hc-danger/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-hc-danger" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-hc-text leading-tight">
                        {count} Load{count !== 1 ? "s" : ""} Need Attention
                    </p>
                    <p className="text-xs text-hc-muted">Fill probability dropped — tap to fix</p>
                </div>
                <Zap className="w-4 h-4 text-hc-danger shrink-0" />
            </div>
        </Link>
    );
}

// ── Reposition Hint (escort only) ─────────────────────────────
function CorridorHeatBanner({ heat, region }: { heat: "low" | "building" | "hot"; region?: string }) {
    if (heat === "low" || !region) return null;
    const label = heat === "hot"
        ? `${region} corridor is 🔥 hot — loads waiting`
        : `${region} heating up — position now`;
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hc-gold-500/8 border border-hc-gold-500/20">
            <MapPin className="w-3.5 h-3.5 text-hc-gold-500 shrink-0" />
            <p className="text-xs font-semibold text-hc-gold-400">{label}</p>
        </div>
    );
}

// ── Escort Command Center ─────────────────────────────────────
function EscortCommandCenter({ data }: { data: EscortCommandData }) {
    return (
        <div className="space-y-4">
            {/* ① NBA — primary action */}
            <Section>
                <NextBestAction
                    role="escort"
                    availabilityStatus={data.availabilityStatus}
                    openLoadsNearby={data.openLoadsNearby}
                    hasActiveJob={data.hasActiveJob}
                    corridorHeat={data.corridorHeat}
                />
            </Section>

            {/* ② Corridor heat hint */}
            <CorridorHeatBanner heat={data.corridorHeat} region={data.suggestedCity} />

            {/* ③ Daily momentum */}
            {data.momentum && (
                <Section title="Your Week">
                    <DailyMomentumBar data={data.momentum} />
                </Section>
            )}

            {/* ④ Compliance risks */}
            {data.complianceRisks.length > 0 && (
                <Section title="Alerts">
                    <PredictiveRiskBadge risks={data.complianceRisks} size="md" />
                </Section>
            )}

            {/* ⑤ Where to go next (reposition) */}
            {data.suggestedCity && data.suggestedState && data.demandSignal && (
                <Section title="Best Move">
                    <WhereToGoNext
                        suggestedCity={data.suggestedCity}
                        suggestedState={data.suggestedState}
                        demandSignal={data.demandSignal}
                        deadheadMiles={data.deadheadMiles}
                    />
                </Section>
            )}
        </div>
    );
}

// ── Broker Command Center ─────────────────────────────────────
function BrokerCommandCenter({ data }: { data: BrokerCommandData }) {
    return (
        <div className="space-y-4">
            {/* ① At-risk alert (before NBA to create urgency context) */}
            <AtRiskAlert count={data.atRiskLoads} />

            {/* ② NBA — primary action */}
            <Section>
                <NextBestAction
                    role="broker"
                    atRiskLoads={data.atRiskLoads}
                    unfilledLoads={data.unfilledLoads}
                    avgFillMinutes={data.avgFillMinutes}
                />
            </Section>

            {/* ③ Daily momentum */}
            {data.momentum && (
                <Section title="Performance">
                    <DailyMomentumBar data={data.momentum} />
                </Section>
            )}

            {/* ④ Portfolio risk badges */}
            {data.portfolioRisks.length > 0 && (
                <Section title="Risk Alerts">
                    <PredictiveRiskBadge risks={data.portfolioRisks} size="md" />
                </Section>
            )}

            {/* ⑤ Corridor pulse banner — animated, cycles hot corridors every 4s */}
            <CorridorPulseBanner corridors={[]} />

            {/* ⑥ Corridor risk widget (existing component) */}
            <Section title="Corridor Intelligence">
                <Suspense fallback={<SkeletonCard />}>
                    <CorridorRiskWidget corridorSlug="" />
                </Suspense>
            </Section>

            {/* ⑦ Live network activity — social proof loop / addiction mechanic */}
            <Section title="Network Activity">
                <LiveActivityFeed events={[]} maxVisible={5} compact />
            </Section>
        </div>
    );
}

// ── Loading State ─────────────────────────────────────────────
function CommandCenterSkeleton() {
    return (
        <div className="space-y-4">
            {/* NBA skeleton */}
            <SkeletonCard />
            {/* Momentum bar */}
            <DailyMomentumBarSkeleton />
            {/* Sections */}
            <div className="space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <SkeletonCard />
            </div>
        </div>
    );
}

// ── Main Export ───────────────────────────────────────────────
export function TodayCommandCenter({ data, className }: TodayCommandCenterProps) {
    return (
        <div className={cn("w-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-black text-hc-muted uppercase tracking-[0.25em]">
                    Today's Command
                </h2>
                <span className="text-[10px] text-hc-subtle">
                    {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
            </div>

            {data === null
                ? <CommandCenterSkeleton />
                : data.role === "escort"
                    ? <EscortCommandCenter data={data} />
                    : <BrokerCommandCenter data={data} />
            }
        </div>
    );
}

export default TodayCommandCenter;
