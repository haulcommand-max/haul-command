"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { TodayCommandCenter, type CommandData } from "@/components/intelligence/TodayCommandCenter";
import Link from "next/link";

// ══════════════════════════════════════════════════════════════
// /app — Today Panel (Mobile App Home)
// Canonical mobile shell entrypoint. Loads instantly with
// skeleton, then hydrates with live session + momentum data.
// ══════════════════════════════════════════════════════════════

const supabase = createClient();

export default function AppHomePage() {
    const [commandData, setCommandData] = useState<CommandData | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        async function loadDashboard() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setAuthChecked(true);
                return;
            }

            // Fetch profile + basic stats in parallel
            const [profileRes, loadsRes] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("role, availability_status, trust_score, on_time_rate, compliance_status")
                    .eq("id", user.id)
                    .single(),
                supabase
                    .from("loads")
                    .select("id, status, fill_probability_60m")
                    .eq("broker_id", user.id)
                    .in("status", ["open", "matching"])
                    .limit(20),
            ]);

            const profile = profileRes.data;
            if (!profile) {
                setAuthChecked(true);
                return;
            }

            const role = profile.role as "escort" | "broker";
            const loads = loadsRes.data ?? [];

            if (role === "escort") {
                // Count nearby open loads
                const { count: nearbyLoads } = await supabase
                    .from("loads")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "open")
                    .limit(50);

                // Fetch live corridor heat
                const { data: supplySnap } = await supabase
                    .from("corridor_supply_snapshot")
                    .select("demand_pressure")
                    .order("timestamp_bucket", { ascending: false })
                    .limit(5);
                const avgPressure = supplySnap?.length
                    ? supplySnap.reduce((s: number, r: any) => s + (r.demand_pressure ?? 0), 0) / supplySnap.length
                    : 0;
                const corridorHeat: "low" | "building" | "hot" =
                    avgPressure >= 0.7 ? "hot" : avgPressure >= 0.4 ? "building" : "low";

                // Fetch jobs this week for momentum
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

                const [thisWeekRes, lastWeekRes] = await Promise.all([
                    supabase
                        .from("jobs")
                        .select("job_id", { count: "exact", head: true })
                        .contains("assigned_escort_ids", [user.id])
                        .eq("status", "completed")
                        .gte("completed_at", weekAgo),
                    supabase
                        .from("jobs")
                        .select("job_id", { count: "exact", head: true })
                        .contains("assigned_escort_ids", [user.id])
                        .eq("status", "completed")
                        .gte("completed_at", lastWeekStart)
                        .lt("completed_at", weekAgo),
                ]);

                const jobsThisWeek = thisWeekRes.count ?? 0;
                const jobsLastWeek = lastWeekRes.count ?? 0;

                // Compute on-time streak from recent completed jobs
                let onTimeStreak = 0;
                const { data: recentJobs } = await supabase
                    .from("jobs")
                    .select("on_time")
                    .contains("assigned_escort_ids", [user.id])
                    .eq("status", "completed")
                    .not("on_time", "is", null)
                    .order("completed_at", { ascending: false })
                    .limit(50);
                if (recentJobs?.length) {
                    for (const j of recentJobs) {
                        if ((j as any).on_time === true) onTimeStreak++;
                        else break;
                    }
                }

                setCommandData({
                    role: "escort",
                    userId: user.id,
                    availabilityStatus: (profile.availability_status as "available" | "busy" | "offline") ?? "offline",
                    openLoadsNearby: nearbyLoads ?? 0,
                    hasActiveJob: profile.availability_status === "busy",
                    corridorHeat,
                    momentum: {
                        role: "escort",
                        jobsThisWeek,
                        jobsLastWeek,
                        onTimeStreak,
                        reliabilityPct: profile.on_time_rate ?? 100,
                        reliabilityTrend: jobsThisWeek > jobsLastWeek ? "up" : jobsThisWeek < jobsLastWeek ? "down" : "flat",
                        earningsTrend: jobsThisWeek > jobsLastWeek ? "up" : "flat",
                    },
                    complianceRisks: profile.compliance_status === "expiring" ? ["permit_timing"] : [],
                });
            } else {
                const atRisk = loads.filter(
                    l => l.fill_probability_60m !== null && l.fill_probability_60m < 0.4
                ).length;

                // Fetch avg fill time from recent matched loads
                const { data: recentFilled } = await supabase
                    .from("loads")
                    .select("created_at, matched_at")
                    .eq("broker_id", user.id)
                    .eq("status", "matched")
                    .not("matched_at", "is", null)
                    .order("matched_at", { ascending: false })
                    .limit(20);

                let avgFillMinutes = 45;
                let avgFillMinutesPrior = 45;
                if (recentFilled?.length) {
                    const fillTimes = recentFilled
                        .filter((l: any) => l.created_at && l.matched_at)
                        .map((l: any) => (new Date(l.matched_at).getTime() - new Date(l.created_at).getTime()) / 60000);
                    if (fillTimes.length > 0) {
                        avgFillMinutes = Math.round(fillTimes.reduce((s: number, t: number) => s + t, 0) / fillTimes.length);
                    }
                }

                // Fetch prior week's fill times for trend comparison
                const priorWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
                const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: priorFilled } = await supabase
                    .from("loads")
                    .select("created_at, matched_at")
                    .eq("broker_id", user.id)
                    .eq("status", "matched")
                    .not("matched_at", "is", null)
                    .gte("matched_at", priorWeekStart)
                    .lt("matched_at", thisWeekStart)
                    .limit(20);
                if (priorFilled?.length) {
                    const priorTimes = priorFilled
                        .filter((l: any) => l.created_at && l.matched_at)
                        .map((l: any) => (new Date(l.matched_at).getTime() - new Date(l.created_at).getTime()) / 60000);
                    if (priorTimes.length > 0) {
                        avgFillMinutesPrior = Math.round(priorTimes.reduce((s: number, t: number) => s + t, 0) / priorTimes.length);
                    }
                }
                const avgFillTrend: "up" | "down" | "flat" =
                    avgFillMinutes < avgFillMinutesPrior * 0.9 ? "up" : // faster = improving
                    avgFillMinutes > avgFillMinutesPrior * 1.1 ? "down" : "flat";

                // Dispatch streak: consecutive days with at least 1 matched load
                let dispatchStreak = 0;
                const { data: dispatchDays } = await supabase
                    .from("loads")
                    .select("matched_at")
                    .eq("broker_id", user.id)
                    .eq("status", "matched")
                    .not("matched_at", "is", null)
                    .order("matched_at", { ascending: false })
                    .limit(60);
                if (dispatchDays?.length) {
                    const seenDays = new Set<string>();
                    for (const l of dispatchDays) {
                        seenDays.add(new Date((l as any).matched_at).toISOString().slice(0, 10));
                    }
                    const today = new Date();
                    for (let i = 0; i < 60; i++) {
                        const d = new Date(today);
                        d.setDate(d.getDate() - i);
                        if (seenDays.has(d.toISOString().slice(0, 10))) dispatchStreak++;
                        else break;
                    }
                }

                // Risk trend: compare at-risk count vs snapshot from prior fetch (heuristic: compare to last week)
                const { count: priorAtRiskCount } = await supabase
                    .from("loads")
                    .select("id", { count: "exact", head: true })
                    .eq("broker_id", user.id)
                    .in("status", ["open", "matching"])
                    .lt("fill_probability_60m", 0.4)
                    .lt("created_at", thisWeekStart);
                const priorAtRisk = priorAtRiskCount ?? 0;
                const riskTrend: "up" | "down" | "flat" =
                    atRisk > priorAtRisk ? "up" : atRisk < priorAtRisk ? "down" : "flat";

                setCommandData({
                    role: "broker",
                    userId: user.id,
                    atRiskLoads: atRisk,
                    unfilledLoads: loads.length,
                    avgFillMinutes,
                    momentum: {
                        role: "broker",
                        dispatchStreak,
                        avgFillMinutes,
                        avgFillTrend,
                        riskScore: atRisk > 2 ? "high" : atRisk > 0 ? "medium" : "low",
                        riskTrend,
                    },
                    portfolioRisks: atRisk > 0 ? ["thin_coverage"] : [],
                });
            }

            setAuthChecked(true);
        }

        loadDashboard();
    }, []);

    // ── Unauthenticated state ───────────────────────────────────
    if (authChecked && !commandData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
                <div className="w-16 h-16 bg-hc-gold-500/10 rounded-2xl flex items-center justify-center mb-6 border border-hc-gold-500/20">
                    <span className="text-2xl font-black text-hc-gold-500">HC</span>
                </div>
                <h1 className="text-2xl font-black text-hc-text tracking-tight mb-2 uppercase">
                    Haul Command
                </h1>
                <p className="text-hc-muted mb-8 text-sm leading-relaxed">
                    The operating system for heavy haul. Sign in to access your Today Panel.
                </p>
                <Link aria-label="Navigation Link"
                    href="/login"
                    className="w-full max-w-xs flex items-center justify-center px-6 py-4 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-dispatch"
                >
                    Sign In
                </Link>
                <Link aria-label="Navigation Link"
                    href="/directory"
                    className="mt-4 text-xs text-hc-muted hover:text-hc-text transition-colors uppercase tracking-widest font-semibold"
                >
                    Browse Directory →
                </Link>
            </div>
        );
    }

    return (
        <div className="px-4 pt-6 pb-4">
            {/* App header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-lg font-black text-hc-text uppercase tracking-tight">
                        Haul Command
                    </h1>
                    <p className="text-[10px] text-hc-subtle uppercase tracking-widest font-semibold">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long", month: "short", day: "numeric"
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hc-elevated border border-hc-border-bare">
                    <span className="w-1.5 h-1.5 rounded-full bg-hc-success animate-pulse" />
                    <span className="text-[10px] font-bold text-hc-success uppercase tracking-widest">Live</span>
                </div>
            </div>

            {/* Today Command Center — above the fold */}
            <TodayCommandCenter data={commandData} />
        </div>
    );
}
