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

                setCommandData({
                    role: "escort",
                    userId: user.id,
                    availabilityStatus: (profile.availability_status as "available" | "busy" | "offline") ?? "offline",
                    openLoadsNearby: nearbyLoads ?? 0,
                    hasActiveJob: profile.availability_status === "busy",
                    corridorHeat: "building",       // TODO: pull from corridor_heat view
                    momentum: {
                        role: "escort",
                        jobsThisWeek: 0,           // TODO: from operator_momentum RPC
                        jobsLastWeek: 0,
                        onTimeStreak: 0,
                        reliabilityPct: profile.on_time_rate ?? 100,
                        reliabilityTrend: "flat",
                        earningsTrend: "flat",
                    },
                    complianceRisks: profile.compliance_status === "expiring" ? ["permit_timing"] : [],
                });
            } else {
                const atRisk = loads.filter(
                    l => l.fill_probability_60m !== null && l.fill_probability_60m < 0.4
                ).length;

                setCommandData({
                    role: "broker",
                    userId: user.id,
                    atRiskLoads: atRisk,
                    unfilledLoads: loads.length,
                    avgFillMinutes: 45,              // TODO: from broker_performance RPC
                    momentum: {
                        role: "broker",
                        dispatchStreak: 0,
                        avgFillMinutes: 45,
                        avgFillTrend: "flat",
                        riskScore: atRisk > 2 ? "high" : atRisk > 0 ? "medium" : "low",
                        riskTrend: "flat",
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
                <Link
                    href="/login"
                    className="w-full max-w-xs flex items-center justify-center px-6 py-4 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-dispatch"
                >
                    Sign In
                </Link>
                <Link
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
