"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3 } from "lucide-react";

// ── Types ──
export interface MarketInsight {
    id: string;
    label: string;
    status: "hot" | "warm" | "balanced" | "cool";
    deltaPct?: number;
    detail?: string;
    href?: string;
}

interface Props {
    className?: string;
    insights?: MarketInsight[];
    heatmap?: React.ReactNode;
    ctaLabel?: string;
    ctaHref?: string;
}

const STATUS_CFG: Record<string, {
    color: string; bg: string; border: string; badge: string; Icon: typeof TrendingUp;
}> = {
    hot: { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.20)", badge: "HOT", Icon: TrendingUp },
    warm: { color: "#f5b942", bg: "rgba(245,185,66,0.08)", border: "rgba(245,185,66,0.20)", badge: "WARM", Icon: TrendingUp },
    balanced: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.20)", badge: "BALANCED", Icon: Minus },
    cool: { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.20)", badge: "COOL", Icon: TrendingDown },
};

function formatDelta(d?: number) {
    if (d === undefined || d === null || Number.isNaN(d)) return "";
    return `${d > 0 ? "+" : ""}${d.toFixed(0)}%`;
}

const DEFAULT_INSIGHTS: MarketInsight[] = [
    { id: "tx-gulf", label: "Texas Gulf Coast", status: "hot", deltaPct: 12, detail: "Escort shortage — refinery & wind corridor demand spike", href: "/rates" },
    { id: "fl-i75", label: "Florida I-75", status: "balanced", deltaPct: 0, detail: "Balanced supply, stable conditions across corridor", href: "/rates" },
    { id: "ca-cntrl", label: "Central California", status: "cool", deltaPct: -3, detail: "Slight oversupply — solar farm projects winding down", href: "/rates" },
    { id: "ok-wind", label: "Oklahoma Wind Belt", status: "hot", deltaPct: 18, detail: "Turbine blade moves — escort demand surging", href: "/rates" },
    { id: "ga-port", label: "Georgia Ports", status: "warm", deltaPct: 5, detail: "Transformer imports picking up — escort demand rising", href: "/rates" },
];

export default function MarketConditionsPanel({
    className,
    insights = DEFAULT_INSIGHTS,
    heatmap,
    ctaLabel = "View Market Rates",
    ctaHref = "/rates",
}: Props) {
    return (
        <section className={className}>
            <div style={{
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "var(--hc-surface, rgba(255,255,255,0.02))",
                padding: "24px 16px",
                overflow: "hidden",
                boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
            }}>
                <style>{`
                    @media (min-width: 640px) {
                        .mcp-container { padding: 28px 24px !important; }
                    }
                `}</style>
                {/* Header */}
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 16,
                    marginBottom: 24,
                }}>
                    <div>
                        <div style={{
                            fontSize: 10, fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.25em",
                            color: "#C6923A", marginBottom: 8,
                        }}>
                            Market Intelligence
                        </div>
                        <h2 style={{
                            margin: 0,
                            fontSize: "clamp(20px, 3vw, 28px)",
                            fontWeight: 900,
                            color: "#fff",
                            letterSpacing: "-0.02em",
                            fontFamily: "var(--font-display)",
                        }}>
                            Escort Market Conditions
                        </h2>
                        <p style={{
                            margin: "6px 0 0",
                            fontSize: 13,
                            color: "rgba(255,255,255,0.45)",
                            fontWeight: 500,
                        }}>
                            Spot escort rate changes over the last 7 days
                        </p>
                    </div>
                    <Link aria-label="Navigation Link" href={ctaHref} style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 20px",
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)",
                        color: "#0a0f16",
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        textDecoration: "none",
                        boxShadow: "0 4px 16px rgba(198,146,58,0.25)",
                        transition: "all 0.2s",
                        flexShrink: 0,
                    }}>
                        {ctaLabel}
                        <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                </div>

                {/* Content grid */}
                <style>{`
                    .mcp-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                    @media (min-width: 768px) { .mcp-grid { grid-template-columns: 7fr 5fr; } }
                `}</style>
                <div className="mcp-grid">
                    {/* Left: Heatmap or placeholder */}
                    <div style={{
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.015)",
                        overflow: "hidden",
                        minHeight: 280,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        {heatmap ? (
                            heatmap
                        ) : (
                            <div style={{ padding: "20px 24px", width: "100%" }}>
                                <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.2em", color: "rgba(198,146,58,0.6)", marginBottom: 16 }}>
                                    Rate Intensity by Corridor
                                </div>
                                {/* Corridor rate bars */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {[
                                        { name: "Texas Gulf", pct: 92, color: "#f87171", rate: "$420+/day" },
                                        { name: "OK Wind Belt", pct: 85, color: "#f5b942", rate: "$380+/day" },
                                        { name: "Florida I-75", pct: 62, color: "#22c55e", rate: "$350+/day" },
                                        { name: "Georgia Ports", pct: 55, color: "#22c55e", rate: "$340+/day" },
                                        { name: "Central CA", pct: 38, color: "#3b82f6", rate: "$310+/day" },
                                    ].map(bar => (
                                        <div key={bar.name}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{bar.name} <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 10, marginLeft: 4 }}>Avg Escort Rate</span></span>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: bar.color, fontFamily: "var(--font-mono, monospace)" }}>{bar.rate}</span>
                                            </div>
                                            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                                                <div style={{ width: `${bar.pct}%`, height: "100%", borderRadius: 3, background: bar.color, transition: "width 0.8s ease", boxShadow: `0 0 8px ${bar.color}30` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Legend */}
                                <div style={{ marginTop: 18 }}>
                                    <div style={{
                                        height: 4, borderRadius: 2,
                                        background: "linear-gradient(90deg, #3b82f6, #22c55e, #f5b942, #f87171)",
                                        marginBottom: 6,
                                    }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                                        <span style={{ color: "#3b82f6" }}>COOL</span>
                                        <span style={{ color: "#22c55e" }}>BALANCED</span>
                                        <span style={{ color: "#f5b942" }}>WARM</span>
                                        <span style={{ color: "#f87171" }}>HOT</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Insight cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {insights.slice(0, 5).map(insight => {
                            const cfg = STATUS_CFG[insight.status] ?? STATUS_CFG.balanced;
                            const StatusIcon = cfg.Icon;
                            return (
                                <Link aria-label="Navigation Link"
                                    key={insight.id}
                                    href={insight.href ?? "/rates"}
                                    style={{
                                        display: "block",
                                        textDecoration: "none",
                                        borderRadius: 12,
                                        border: `1px solid ${cfg.border}`,
                                        background: cfg.bg,
                                        padding: "12px 14px",
                                        transition: "all 0.18s",
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                                        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${cfg.color}15`;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.transform = "";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "";
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 13, fontWeight: 700, color: "#fff",
                                                marginBottom: 3,
                                            }}>
                                                {insight.label}
                                            </div>
                                            <div style={{
                                                fontSize: 11, color: "rgba(255,255,255,0.50)",
                                                lineHeight: 1.4,
                                            }}>
                                                {insight.detail}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 900,
                                                letterSpacing: "0.1em",
                                                color: cfg.color,
                                                textTransform: "uppercase",
                                            }}>
                                                {cfg.badge}
                                            </span>
                                            {insight.deltaPct !== undefined && insight.deltaPct !== 0 && (
                                                <div style={{
                                                    display: "flex", alignItems: "center", gap: 3,
                                                    fontSize: 12, fontWeight: 800, color: cfg.color,
                                                }}>
                                                    <StatusIcon style={{ width: 12, height: 12 }} />
                                                    {formatDelta(insight.deltaPct)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
