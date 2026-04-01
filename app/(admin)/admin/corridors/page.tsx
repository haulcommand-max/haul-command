"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCw, Bell, TrendingUp, Users, Package } from "lucide-react";

interface CorridorRow {
    corridor_slug: string;
    band: "healthy" | "tightening" | "at_risk" | "critical";
    stress_score: number;
    active_escort_count: number;
    load_count_24h: number;
    computed_at: string;
}

const BAND_STYLES = {
    healthy: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400", label: "Healthy" },
    tightening: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400", label: "Tightening" },
    at_risk: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400", label: "At Risk" },
    critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-400 animate-pulse", label: "Critical" },
};

export default function AdminCorridorsPage() {
    const [rows, setRows] = useState<CorridorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [nudging, setNudging] = useState<string | null>(null);
    const [nudgeResult, setNudgeResult] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/corridors/stress");
        if (res.ok) setRows(await res.json());
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleNudge = async (slug: string) => {
        setNudging(slug);
        try {
            const res = await fetch("/api/admin/corridors/nudge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ corridor_slug: slug }),
            });
            const data = await res.json();
            setNudgeResult(prev => ({ ...prev, [slug]: res.ok ? `✓ ${data.notified ?? 0} escorts notified` : `✗ ${data.error ?? "error"}` }));
        } finally {
            setNudging(null);
        }
    };

    const critical = rows.filter(r => r.band === "critical");
    const atRisk = rows.filter(r => r.band === "at_risk");

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-amber-400" />
                            Escort Supply Radar
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Corridor stress scores — updated every 6 hours</p>
                    </div>
                    <button onClick={load} disabled={loading}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>

                {/* Alert strip */}
                {(critical.length > 0 || atRisk.length > 0) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-400 font-bold text-sm">Coverage Alert</p>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {critical.length > 0 && `${critical.length} critical corridor${critical.length > 1 ? "s" : ""} — immediate action needed. `}
                                {atRisk.length > 0 && `${atRisk.length} corridor${atRisk.length > 1 ? "s" : ""} at risk.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {Object.entries(BAND_STYLES).map(([band, style]) => (
                        <div key={band} className={`${style.bg} ${style.border} border rounded-xl p-4 text-center`}>
                            <div className={`text-3xl font-black ${style.text}`}>
                                {rows.filter(r => r.band === band).length}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{style.label}</div>
                        </div>
                    ))}
                </div>

                {/* Corridor table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold text-white">All Corridors</h2>
                        <span className="text-xs text-slate-500">{rows.length} monitored</span>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {loading && (
                            <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
                        )}

                        {!loading && rows.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No corridor data yet — run the stress refresh edge function.
                            </div>
                        )}

                        {rows.map(row => {
                            const style = BAND_STYLES[row.band] ?? BAND_STYLES.healthy;
                            const timeAgo = row.computed_at
                                ? Math.round((Date.now() - new Date(row.computed_at).getTime()) / 60000) + "m ago"
                                : "—";
                            const pressureRatio = row.active_escort_count > 0
                                ? (row.load_count_24h / row.active_escort_count).toFixed(1)
                                : "—";

                            return (
                                <div key={row.corridor_slug} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                                        <div>
                                            <p className="font-semibold text-white text-sm">{row.corridor_slug}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Updated {timeAgo}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 sm:gap-8 flex-wrap ml-6 sm:ml-0">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-slate-300 text-sm font-bold">
                                                <Users className="w-3.5 h-3.5 text-blue-400" />
                                                {row.active_escort_count}
                                            </div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Active</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-slate-300 text-sm font-bold">
                                                <Package className="w-3.5 h-3.5 text-amber-400" />
                                                {row.load_count_24h}
                                            </div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Loads 24h</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-slate-300">{pressureRatio}×</div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Pressure</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-sm font-black ${style.text}`}>{Math.round(row.stress_score)}</div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Stress</div>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${style.bg} ${style.border} ${style.text}`}>
                                            {style.label}
                                        </span>

                                        {(row.band === "critical" || row.band === "at_risk") && (
                                            <div className="flex flex-col items-end gap-1">
                                                <button
                                                    onClick={() => handleNudge(row.corridor_slug)}
                                                    disabled={nudging === row.corridor_slug}
                                                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Bell className="w-3 h-3" />
                                                    {nudging === row.corridor_slug ? "Sending..." : "Nudge Escorts"}
                                                </button>
                                                {nudgeResult[row.corridor_slug] && (
                                                    <span className="text-[10px] text-emerald-400">{nudgeResult[row.corridor_slug]}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
