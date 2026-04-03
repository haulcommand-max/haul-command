'use client';
/**
 * OperatorEarningsCard — Earnings visibility for escort operators.
 *
 * Shows weekly/monthly earnings, per-job breakdown, and trend data.
 * Data: fetches from jobs table (completed, assigned to current user).
 *
 * Psychology: "See your money working. Track every dollar."
 */
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Minus, Calendar, ChevronRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EarningsPeriod {
    total: number;
    jobCount: number;
    avgPerJob: number;
    currency: string;
}

interface EarningsData {
    thisWeek: EarningsPeriod;
    lastWeek: EarningsPeriod;
    thisMonth: EarningsPeriod;
    lastMonth: EarningsPeriod;
    recentJobs: { job_id: string; agreed_rate_total: number; currency: string; completed_at: string }[];
}

interface Props {
    userId: string;
    className?: string;
}

const supabase = createClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekStart(weeksAgo: number = 0): string {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() - weeksAgo * 7);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function monthStart(monthsAgo: number = 0): string {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo, 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function trendIcon(current: number, previous: number) {
    if (current > previous * 1.05) return <TrendingUp className="w-3 h-3" style={{ color: "#22c55e" }} />;
    if (current < previous * 0.95) return <TrendingDown className="w-3 h-3" style={{ color: "#ef4444" }} />;
    return <Minus className="w-3 h-3" style={{ color: "#5A6577" }} />;
}

function trendPct(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "—";
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function trendColor(current: number, previous: number): string {
    if (current > previous * 1.05) return "#22c55e";
    if (current < previous * 0.95) return "#ef4444";
    return "#5A6577";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OperatorEarningsCard({ userId, className = "" }: Props) {
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"week" | "month">("week");

    useEffect(() => {
        async function fetchEarnings() {
            try {
                const thisWeekStart = weekStart(0);
                const lastWeekStart = weekStart(1);
                const thisMonthStart = monthStart(0);
                const lastMonthStart = monthStart(1);

                const [twRes, lwRes, tmRes, lmRes, recentRes] = await Promise.all([
                    supabase
                        .from("jobs")
                        .select("job_id, agreed_rate_total, currency")
                        .contains("assigned_escort_ids", [userId])
                        .eq("status", "completed")
                        .gte("completed_at", thisWeekStart),
                    supabase
                        .from("jobs")
                        .select("job_id, agreed_rate_total, currency")
                        .contains("assigned_escort_ids", [userId])
                        .eq("status", "completed")
                        .gte("completed_at", lastWeekStart)
                        .lt("completed_at", thisWeekStart),
                    supabase
                        .from("jobs")
                        .select("job_id, agreed_rate_total, currency")
                        .contains("assigned_escort_ids", [userId])
                        .eq("status", "completed")
                        .gte("completed_at", thisMonthStart),
                    supabase
                        .from("jobs")
                        .select("job_id, agreed_rate_total, currency")
                        .contains("assigned_escort_ids", [userId])
                        .eq("status", "completed")
                        .gte("completed_at", lastMonthStart)
                        .lt("completed_at", thisMonthStart),
                    supabase
                        .from("jobs")
                        .select("job_id, agreed_rate_total, currency, completed_at")
                        .contains("assigned_escort_ids", [userId])
                        .eq("status", "completed")
                        .order("completed_at", { ascending: false })
                        .limit(5),
                ]);

                const toPeriod = (rows: any[]): EarningsPeriod => {
                    const total = rows.reduce((s, r) => s + Number(r.agreed_rate_total ?? 0), 0);
                    return {
                        total,
                        jobCount: rows.length,
                        avgPerJob: rows.length > 0 ? Math.round(total / rows.length) : 0,
                        currency: rows[0]?.currency ?? "USD",
                    };
                };

                setData({
                    thisWeek: toPeriod(twRes.data ?? []),
                    lastWeek: toPeriod(lwRes.data ?? []),
                    thisMonth: toPeriod(tmRes.data ?? []),
                    lastMonth: toPeriod(lmRes.data ?? []),
                    recentJobs: (recentRes.data ?? []) as any[],
                });
            } catch (err) {
                console.error("[earnings] fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchEarnings();
    }, [userId]);

    if (loading) {
        return (
            <div className={`rounded-2xl p-5 animate-pulse ${className}`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-5 w-32 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-10 w-24 rounded mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-3 w-48 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
        );
    }

    if (!data) return null;

    const current = view === "week" ? data.thisWeek : data.thisMonth;
    const previous = view === "week" ? data.lastWeek : data.lastMonth;
    const periodLabel = view === "week" ? "This Week" : "This Month";
    const prevLabel = view === "week" ? "Last Week" : "Last Month";

    return (
        <div
            className={`rounded-2xl overflow-hidden ${className}`}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
                <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                    <h3 className="text-sm font-black text-white leading-none">Earnings</h3>
                </div>
                {/* Week/Month toggle */}
                <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    {(["week", "month"] as const).map(v => (
                        <button aria-label="Interactive Button"
                            key={v}
                            onClick={() => setView(v)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                            style={{
                                background: view === v ? "rgba(34,197,94,0.12)" : "transparent",
                                color: view === v ? "#22c55e" : "#5A6577",
                            }}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main stat */}
            <div className="px-5 py-5">
                <div className="flex items-end gap-3 mb-1">
                    <span className="text-3xl font-black tabular-nums" style={{ color: "#e2e8f0" }}>
                        {formatCurrency(current.total, current.currency)}
                    </span>
                    <div className="flex items-center gap-1 pb-1">
                        {trendIcon(current.total, previous.total)}
                        <span className="text-xs font-bold" style={{ color: trendColor(current.total, previous.total) }}>
                            {trendPct(current.total, previous.total)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px]" style={{ color: "#5A6577" }}>
                    <span>{current.jobCount} job{current.jobCount !== 1 ? "s" : ""} · {periodLabel.toLowerCase()}</span>
                    <span>{formatCurrency(current.avgPerJob, current.currency)} avg per job</span>
                </div>
            </div>

            {/* Comparison bar */}
            <div
                className="mx-5 mb-4 rounded-xl p-3.5 flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
                <div>
                    <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#3A4553" }}>{prevLabel}</div>
                    <div className="text-sm font-black mt-0.5" style={{ color: "#5A6577" }}>
                        {formatCurrency(previous.total, previous.currency)}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#3A4553" }}>Jobs</div>
                    <div className="text-sm font-black mt-0.5" style={{ color: "#5A6577" }}>
                        {previous.jobCount}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#3A4553" }}>Avg</div>
                    <div className="text-sm font-black mt-0.5" style={{ color: "#5A6577" }}>
                        {formatCurrency(previous.avgPerJob, previous.currency)}
                    </div>
                </div>
            </div>

            {/* Recent jobs */}
            {data.recentJobs.length > 0 && (
                <>
                    <div className="px-5 py-2">
                        <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#3A4553" }}>
                            Recent Jobs
                        </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {data.recentJobs.map(job => (
                            <div
                                key={job.job_id}
                                className="flex items-center justify-between px-5 py-3"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: "#3A4553" }} />
                                    <span className="text-xs" style={{ color: "#5A6577" }}>
                                        {new Date(job.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                </div>
                                <span className="text-sm font-black tabular-nums" style={{ color: "#22c55e" }}>
                                    {formatCurrency(job.agreed_rate_total, job.currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Footer */}
            <div
                className="px-5 py-3.5 border-t flex items-center justify-end"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}
            >
                <a
                    href="/profile/earnings"
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors"
                    style={{ color: "rgba(34,197,94,0.7)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#22c55e"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(34,197,94,0.7)"; }}
                >
                    Full Earnings History
                    <ChevronRight className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
}
