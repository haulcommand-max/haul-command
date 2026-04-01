"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Flame, TrendingUp, Activity, Zap, BarChart3, Route, Brain, Loader2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────────
const T = {
    bg: "#060b12",
    surface: "rgba(255,255,255,0.03)",
    surfaceHigh: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.14)",
    gold: "#F1A91B",
    green: "#22c55e",
    blue: "#3ba4ff",
    red: "#f87171",
    orange: "#fb923c",
    textPrimary: "#ffffff",
    textBody: "#cfd8e3",
    textMuted: "#8fa3b8",
    textSubtle: "#5A6577",
} as const;

// ── Types ─────────────────────────────────────────────────────────────
interface CtAlert { id: string; alert_type: string; severity: string; geo_key?: string; corridor_slug?: string; message: string; details?: Record<string, unknown>; created_at: string; }
interface ScarcityRow { geo_key: string; geo_type: string; forecast_band: string; shortage_probability: number; future_shortage_score: number; computed_at: string; }
interface CorridorRow { corridor_slug: string; shortage_risk_level: string; next_7d_pressure: number; next_14d_pressure: number; computed_at: string; }
interface UxRow { page_url: string; page_type: string; clarity_score: number; needs_fix: boolean; checked_at: string; }
interface MatchRow { id: string; status: string; candidate_count: number; created_at: string; }

// ── Severity badge ────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
    const cfg: Record<string, { color: string; bg: string }> = {
        critical: { color: T.red, bg: "rgba(248,113,113,0.12)" },
        warning: { color: T.orange, bg: "rgba(251,146,60,0.12)" },
        info: { color: T.blue, bg: "rgba(59,164,255,0.12)" },
    };
    const c = cfg[severity] ?? cfg.info;
    return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider" style={{ color: c.color, background: c.bg }}>
            {severity}
        </span>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ElementType }) {
    return (
        <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: T.textSubtle }}>{label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: T.textPrimary }}>{value}</div>
            {sub && <div className="text-[10px]" style={{ color: T.textMuted }}>{sub}</div>}
        </div>
    );
}

// ── Tab button ────────────────────────────────────────────────────────
function Tab({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: React.ElementType }) {
    return (
        <button onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            style={{
                background: active ? `${T.gold}18` : "transparent",
                border: active ? `1px solid ${T.gold}28` : "1px solid transparent",
                color: active ? T.gold : T.textSubtle,
            }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function ControlTowerPage() {
    const supabase = createClient();
    const [tab, setTab] = useState<"seo" | "market" | "dispatch">("seo");
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Data
    const [ctAlerts, setCtAlerts] = useState<CtAlert[]>([]);
    const [scarcityRows, setScarcityRows] = useState<ScarcityRow[]>([]);
    const [corridorRows, setCorridorRows] = useState<CorridorRow[]>([]);
    const [uxRows, setUxRows] = useState<UxRow[]>([]);
    const [matchRows, setMatchRows] = useState<MatchRow[]>([]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        const [alertsRes, scarcityRes, corridorRes, uxRes, matchRes] = await Promise.all([
            supabase.from("ct_alerts").select("*").order("created_at", { ascending: false }).limit(50),
            supabase.from("scarcity_forecast").select("geo_key, geo_type, forecast_band, shortage_probability, future_shortage_score, computed_at")
                .in("forecast_band", ["tightening", "shortage", "critical"]).order("future_shortage_score", { ascending: false }).limit(20),
            supabase.from("corridor_forecasts").select("corridor_slug, shortage_risk_level, next_7d_pressure, next_14d_pressure, computed_at")
                .in("shortage_risk_level", ["elevated", "high", "critical"]).order("next_14d_pressure", { ascending: false }).limit(20),
            supabase.from("ux_clarity_scores").select("page_url, page_type, clarity_score, needs_fix, checked_at")
                .order("clarity_score", { ascending: true }).limit(20),
            supabase.from("match_requests").select("id, status, candidate_count, created_at").order("created_at", { ascending: false }).limit(20),
        ]);
        setCtAlerts((alertsRes.data as CtAlert[]) ?? []);
        setScarcityRows((scarcityRes.data as ScarcityRow[]) ?? []);
        setCorridorRows((corridorRes.data as CorridorRow[]) ?? []);
        setUxRows((uxRes.data as UxRow[]) ?? []);
        setMatchRows((matchRes.data as MatchRow[]) ?? []);
        setLastRefresh(new Date());
        setLoading(false);
    }, [supabase]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const criticalAlerts = ctAlerts.filter(a => a.severity === "critical");
    const warningAlerts = ctAlerts.filter(a => a.severity === "warning");
    const criticalZones = scarcityRows.filter(r => r.forecast_band === "critical");
    const needsFixPages = uxRows.filter(r => r.needs_fix);

    return (
        <div className="min-h-screen text-white" style={{ background: T.bg }}>
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_-10%,rgba(241,169,27,0.06),transparent_70%)]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Control Tower</h1>
                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                            Last refresh: {lastRefresh.toLocaleTimeString()}
                        </p>
                    </div>
                    <button onClick={loadAll} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: T.surfaceHigh, border: `1px solid ${T.borderStrong}`, color: T.textBody }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {/* Stat bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Critical Alerts" value={criticalAlerts.length} color={T.red} icon={AlertTriangle} sub="need immediate action" />
                    <StatCard label="Warning Alerts" value={warningAlerts.length} color={T.orange} icon={Flame} sub="monitor closely" />
                    <StatCard label="Critical Zones" value={criticalZones.length} color={T.red} icon={TrendingUp} sub="estate shortage" />
                    <StatCard label="UX Pages Need Fix" value={needsFixPages.length} color={T.orange} icon={Activity} sub="below clarity threshold" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b pb-4" style={{ borderColor: T.border }}>
                    <Tab label="SEO + Market" active={tab === "seo"} onClick={() => setTab("seo")} icon={BarChart3} />
                    <Tab label="Corridors" active={tab === "market"} onClick={() => setTab("market")} icon={Route} />
                    <Tab label="Dispatch" active={tab === "dispatch"} onClick={() => setTab("dispatch")} icon={Brain} />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.gold }} />
                    </div>
                )}

                {/* ── SEO + Market Tab ──────────────────────────────────── */}
                {!loading && tab === "seo" && (
                    <div className="space-y-6">

                        {/* CT Alerts */}
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.textSubtle }}>Recent CT Alerts</h2>
                            <div className="space-y-2">
                                {ctAlerts.length === 0 && (
                                    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>No alerts</div>
                                )}
                                {ctAlerts.slice(0, 15).map(alert => (
                                    <div key={alert.id} className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                        <SeverityBadge severity={alert.severity} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: T.textBody }}>{alert.message}</p>
                                            <p className="text-[10px] mt-0.5" style={{ color: T.textSubtle }}>
                                                {alert.alert_type} · {new Date(alert.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Scarcity forecast */}
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.textSubtle }}>Active Scarcity Zones</h2>
                            {scarcityRows.length === 0 && (
                                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                    No active shortages — market is balanced
                                </div>
                            )}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {scarcityRows.map(row => {
                                    const bandColor = row.forecast_band === "critical" ? T.red : row.forecast_band === "shortage" ? T.orange : T.gold;
                                    return (
                                        <div key={row.geo_key + row.geo_type} className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold" style={{ color: T.textBody }}>{row.geo_key}</span>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ color: bandColor, background: `${bandColor}18` }}>{row.forecast_band}</span>
                                            </div>
                                            <div className="text-[10px]" style={{ color: T.textMuted }}>{row.geo_type} · prob {Math.round(row.shortage_probability * 100)}%</div>
                                            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                <div className="h-full rounded-full" style={{ width: `${row.future_shortage_score}%`, background: bandColor, transition: "width 0.6s" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* UX clarity */}
                        <section>
                            <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.textSubtle }}>UX Clarity (lowest scoring pages)</h2>
                            {uxRows.length === 0 && (
                                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>No UX data yet — run clarity scorer</div>
                            )}
                            {uxRows.slice(0, 10).map(row => (
                                <div key={row.page_url} className="rounded-xl px-4 py-3 flex items-center gap-3 mb-2" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    {row.needs_fix
                                        ? <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: T.orange }} />
                                        : <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: T.green }} />
                                    }
                                    <span className="text-sm font-medium flex-1 truncate" style={{ color: T.textBody }}>{row.page_url}</span>
                                    <span className="text-xs font-black tabular-nums" style={{ color: row.clarity_score < 0.55 ? T.red : row.clarity_score < 0.70 ? T.orange : T.green }}>
                                        {Math.round(row.clarity_score * 100)}/100
                                    </span>
                                </div>
                            ))}
                        </section>
                    </div>
                )}

                {/* ── Corridors Tab ─────────────────────────────────────── */}
                {!loading && tab === "market" && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.textSubtle }}>Corridor Pressure Forecast</h2>
                        {corridorRows.length === 0 && (
                            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                No elevated corridors — all routes normal
                            </div>
                        )}
                        {corridorRows.map(row => {
                            const riskColor = row.shortage_risk_level === "critical" ? T.red : row.shortage_risk_level === "high" ? T.orange : T.gold;
                            return (
                                <div key={row.corridor_slug} className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold" style={{ color: T.textBody }}>{row.corridor_slug}</h3>
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block" style={{ color: riskColor, background: `${riskColor}18` }}>
                                                {row.shortage_risk_level}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs" style={{ color: T.textMuted }}>7-day: <strong style={{ color: T.textBody }}>{Math.round(row.next_7d_pressure)}</strong></div>
                                            <div className="text-xs" style={{ color: T.textMuted }}>14-day: <strong style={{ color: T.textBody }}>{Math.round(row.next_14d_pressure)}</strong></div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                        <div className="h-full rounded-full" style={{ width: `${row.next_14d_pressure}%`, background: riskColor, transition: "width 0.6s" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Dispatch Brain Tab ────────────────────────────────── */}
                {!loading && tab === "dispatch" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: T.textSubtle }}>Recent Match Requests</h2>
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(241,169,27,0.12)", color: T.gold }}>
                                dispatch_brain_enabled = OFF (use feature_flags)
                            </span>
                        </div>
                        {matchRows.length === 0 && (
                            <div className="rounded-xl px-4 py-6 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <Brain className="w-8 h-8 mx-auto mb-3" style={{ color: T.textSubtle }} />
                                <p className="text-sm" style={{ color: T.textMuted }}>No dispatch requests yet.</p>
                                <p className="text-xs mt-1" style={{ color: T.textSubtle }}>POST to /functions/v1/dispatch-brain to trigger a match</p>
                            </div>
                        )}
                        {matchRows.map(row => {
                            const statusColor = row.status === "scored" ? T.green : row.status === "failed" ? T.red : row.status === "evaluating" ? T.orange : T.textMuted;
                            return (
                                <div key={row.id} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                    <Zap className="w-4 h-4 flex-shrink-0" style={{ color: statusColor }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono truncate" style={{ color: T.textBody }}>{row.id}</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: T.textSubtle }}>
                                            {row.candidate_count ?? 0} candidates · {new Date(row.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ color: statusColor, background: `${statusColor}18` }}>
                                        {row.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
