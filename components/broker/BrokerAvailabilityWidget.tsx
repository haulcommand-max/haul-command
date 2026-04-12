"use client";

/**
 * BrokerAvailabilityWidget — SONNET-02
 *
 * Real-time operator supply intelligence for broker-facing pages.
 * Consumes /functions/v1/broker-availability-feed.
 *
 * Shows:
 *  - Liquidity score + tier color
 *  - Estimated fill time
 *  - Confirmed available operator count
 *  - Top 5 operators with trust score + certifications
 *  - Shortage alerts if present
 *  - "Post a Load" CTA that deep-links to the load board with corridor pre-filled
 *
 * Truth-first: all data is live from Supabase. No hardcoded counts or fake scores.
 */

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, TrendingUp, AlertTriangle, Zap, RefreshCw, ChevronRight } from "lucide-react";

interface AvailabilityData {
    ok: boolean;
    geo: { country: string; state: string | null };
    availability: {
        confirmed_operator_count: number;
        liquidity_score: number;
        liquidity_label: string;
        liquidity_color: "green" | "yellow" | "orange" | "red";
        estimated_fill_minutes: number | null;
        shortage_signals: number;
    };
    top_operators: {
        user_id: string;
        display_name: string;
        trust_score: number;
        state: string;
        certifications: string[];
        avatar_url: string | null;
        service_types: string[];
    }[];
    shortage_alerts: {
        type: string;
        geo: string;
        detail: Record<string, unknown>;
    }[];
    generated_at: string;
}

const LIQUIDITY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    green:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#22c55e", dot: "#22c55e" },
    yellow: { bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.22)", text: "#eab308", dot: "#eab308" },
    orange: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", text: "#f97316", dot: "#f97316" },
    red:    { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  text: "#ef4444", dot: "#ef4444" },
};

interface BrokerAvailabilityWidgetProps {
    state?: string;
    country?: string;
    serviceType?: string;
    compact?: boolean;
    className?: string;
}

export function BrokerAvailabilityWidget({
    state,
    country = "US",
    serviceType,
    compact = false,
    className = "",
}: BrokerAvailabilityWidgetProps) {
    const [data, setData] = useState<AvailabilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ country });
            if (state) params.set("state", state);
            if (serviceType) params.set("service_type", serviceType);

            const res = await window.fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/broker-availability-feed?${params}`,
                {
                    headers: {
                        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
                    },
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
            setLastRefreshed(new Date());
        } catch (e: any) {
            setError(e.message ?? "Failed to load availability data");
        } finally {
            setLoading(false);
        }
    }, [state, country, serviceType]);

    // Initial load
    useEffect(() => { fetch(); }, [fetch]);

    // Auto-refresh every 90 seconds
    useEffect(() => {
        const t = setInterval(fetch, 90_000);
        return () => clearInterval(t);
    }, [fetch]);

    const avail = data?.availability;
    const colors = LIQUIDITY_COLORS[avail?.liquidity_color ?? "green"];
    const geoLabel = state ? `${state}, ${country}` : country;
    const postLoadUrl = `/loads/new${state ? `?state=${state}` : ""}${serviceType ? `&service_type=${serviceType}` : ""}`;

    if (loading && !data) {
        return (
            <div className={className} style={{
                background: "rgba(11,15,25,0.9)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
                padding: "24px", minHeight: compact ? 80 : 200, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <RefreshCw size={18} color="#4b5563" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ color: "#4b5563", fontSize: 13, marginLeft: 10 }}>Loading availability…</span>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className={className} style={{
                background: "rgba(11,15,25,0.9)", borderRadius: 16, border: "1px solid rgba(239,68,68,0.15)",
                padding: "20px 24px",
            }}>
                <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>
                    Could not load live availability. <button onClick={fetch} style={{ color: "#C6923A", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Retry</button>
                </p>
            </div>
        );
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
                background: "rgba(11,15,25,0.92)",
                borderRadius: 18,
                border: `1px solid ${colors.border}`,
                overflow: "hidden",
                backdropFilter: "blur(20px)",
                boxShadow: `0 0 40px ${colors.bg}, 0 4px 20px rgba(0,0,0,0.4)`,
            }}
        >
            {/* ── Header row ── */}
            <div style={{
                padding: compact ? "14px 18px" : "18px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: colors.dot,
                        boxShadow: `0 0 8px ${colors.dot}80`,
                        animation: avail?.liquidity_color === "green" ? "livePulse 2s ease-in-out infinite" : "none",
                    }} />
                    <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                        LIVE CAPACITY — {geoLabel}
                    </span>
                </div>
                <button
                    onClick={fetch}
                    disabled={loading}
                    style={{
                        background: "none", border: "none", cursor: "pointer", color: "#4b5563", padding: 4,
                        transition: "color 0.15s",
                    }}
                    title="Refresh"
                    aria-label="Refresh availability"
                >
                    <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
                </button>
            </div>

            {/* ── Liquidity stats row ── */}
            <div style={{
                padding: compact ? "12px 18px" : "16px 22px",
                display: "grid",
                gridTemplateColumns: compact ? "1fr 1fr" : "1fr 1fr 1fr",
                gap: 12,
            }}>
                {/* Confirmed operators */}
                <div style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px",
                    border: "1px solid rgba(255,255,255,0.05)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Users size={13} color="#4b5563" />
                        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Available
                        </span>
                    </div>
                    <div style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                        {avail?.confirmed_operator_count ?? 0}
                    </div>
                    <div style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>confirmed operators</div>
                </div>

                {/* Liquidity score */}
                <div style={{
                    background: colors.bg, borderRadius: 12, padding: "12px 14px",
                    border: `1px solid ${colors.border}`,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <TrendingUp size={13} color={colors.text} />
                        <span style={{ color: colors.text, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Liquidity
                        </span>
                    </div>
                    <div style={{ color: colors.text, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                        {avail?.liquidity_score ?? "—"}
                    </div>
                    <div style={{ color: colors.text, fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                        {avail?.liquidity_label}
                    </div>
                </div>

                {/* Fill ETA */}
                {!compact && (
                    <div style={{
                        background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px",
                        border: "1px solid rgba(255,255,255,0.05)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Clock size={13} color="#4b5563" />
                            <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Est. Fill
                            </span>
                        </div>
                        <div style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                            {avail?.estimated_fill_minutes != null ? `${avail.estimated_fill_minutes}m` : "—"}
                        </div>
                        <div style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>to match</div>
                    </div>
                )}
            </div>

            {/* ── Shortage alerts ── */}
            <AnimatePresence>
                {(data?.shortage_alerts?.length ?? 0) > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            margin: "0 16px 12px",
                            background: "rgba(239,68,68,0.07)",
                            border: "1px solid rgba(239,68,68,0.18)",
                            borderRadius: 10, padding: "10px 14px",
                            display: "flex", alignItems: "flex-start", gap: 10,
                        }}
                    >
                        <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <div style={{ color: "#f87171", fontSize: 12, fontWeight: 700 }}>
                                {data!.shortage_alerts.length} shortage signal{data!.shortage_alerts.length > 1 ? "s" : ""} active in {geoLabel}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>
                                Fill times likely extended. Consider expanding corridor radius.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Top operators list ── */}
            {!compact && (data?.top_operators?.length ?? 0) > 0 && (
                <div style={{ padding: "0 16px 12px" }}>
                    <div style={{ color: "#4b5563", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                        Top Available
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {data!.top_operators.slice(0, 5).map((op) => (
                            <div key={op.user_id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: "rgba(255,255,255,0.025)", borderRadius: 10,
                                padding: "8px 12px", border: "1px solid rgba(255,255,255,0.04)",
                            }}>
                                {/* Avatar fallback */}
                                <div style={{
                                    width: 30, height: 30, borderRadius: "50%",
                                    background: op.avatar_url ? `url(${op.avatar_url}) center/cover` : "rgba(198,146,58,0.15)",
                                    border: "1.5px solid rgba(198,146,58,0.3)",
                                    flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {!op.avatar_url && (
                                        <span style={{ color: "#C6923A", fontSize: 11, fontWeight: 800 }}>
                                            {op.display_name?.[0] ?? "?"}
                                        </span>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {op.display_name}
                                    </div>
                                    <div style={{ color: "#4b5563", fontSize: 11 }}>
                                        {op.state} {op.certifications.length > 0 ? `· ${op.certifications.slice(0, 2).join(", ")}` : ""}
                                    </div>
                                </div>

                                {/* Trust score */}
                                <div style={{
                                    background: op.trust_score >= 80 ? "rgba(34,197,94,0.1)" : "rgba(198,146,58,0.1)",
                                    border: `1px solid ${op.trust_score >= 80 ? "rgba(34,197,94,0.2)" : "rgba(198,146,58,0.2)"}`,
                                    borderRadius: 6, padding: "3px 8px",
                                    color: op.trust_score >= 80 ? "#22c55e" : "#C6923A",
                                    fontSize: 12, fontWeight: 800,
                                }}>
                                    {op.trust_score}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── CTA ── */}
            <div style={{ padding: "12px 16px 16px" }}>
                <a
                    href={postLoadUrl}
                    id="broker-availability-post-load-cta"
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        background: "linear-gradient(135deg, #C6923A 0%, #E8B460 100%)",
                        color: "#080c18", textDecoration: "none",
                        borderRadius: 10, padding: "12px 20px",
                        fontSize: 14, fontWeight: 800, letterSpacing: "0.03em",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        boxShadow: "0 4px 16px rgba(198,146,58,0.35)",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(198,146,58,0.5)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.transform = "";
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(198,146,58,0.35)";
                    }}
                >
                    <Zap size={15} />
                    Post a Load — {geoLabel}
                    <ChevronRight size={14} />
                </a>

                {lastRefreshed && (
                    <div style={{ color: "#374151", fontSize: 10, textAlign: "center", marginTop: 8 }}>
                        Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes livePulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 8px #22c55e80; }
                    50% { opacity: 0.5; box-shadow: 0 0 3px #22c55e40; }
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
}
