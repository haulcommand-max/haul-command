"use client";

/**
 * MapIntelRail — Left Intelligence Rail for the Command Center Map
 *
 * Purpose: make /map feel operational, not decorative.
 * Shows live corridor stress, escort counts, market status, and key KPIs.
 * Collapsible on mobile. Semi-translucent on desktop.
 *
 * NO data pipeline changes — reads the same corridor stress data.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Clock,
    TrendingUp,
    Truck,
    Zap,
    Radio,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CorridorBand {
    label: string;
    color: string;
    bg: string;
    count: number;
}

interface MarketSignal {
    label: string;
    value: string | number;
    unit?: string;
    color: string;
    icon: React.ElementType;
    pulse?: boolean;
}

// ── Mock live data — replaced by real API hook in prod ────────────────────────

function useLiveMarketSignals() {
    const [signals, setSignals] = useState({
        escorts_online: 47,
        loads_in_motion: 23,
        fill_time_median_min: 38,
        corridors_heating: 3,
        coverage_status: "Active" as "Active" | "Degraded" | "Surge",
        last_match_ago_min: 2,
    });

    // Simulate small fluctuations every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            setSignals((prev) => ({
                ...prev,
                escorts_online: Math.max(30, prev.escorts_online + Math.floor((Math.random() - 0.4) * 3)),
                loads_in_motion: Math.max(10, prev.loads_in_motion + Math.floor((Math.random() - 0.4) * 2)),
                fill_time_median_min: Math.max(15, prev.fill_time_median_min + Math.floor((Math.random() - 0.5) * 4)),
                last_match_ago_min: Math.max(0, Math.floor(Math.random() * 5)),
            }));
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    return signals;
}

const CORRIDOR_BANDS: CorridorBand[] = [
    { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.1)", count: 2 },
    { label: "At Risk", color: "#f97316", bg: "rgba(249,115,22,0.1)", count: 3 },
    { label: "Tightening", color: "#F1A91B", bg: "rgba(241,169,27,0.1)", count: 4 },
    { label: "Healthy", color: "#22c55e", bg: "rgba(34,197,94,0.1)", count: 8 },
];

const COVERAGE_STATUS_CONFIG = {
    Active: { color: "#22c55e", label: "All Systems Active", pulse: true },
    Degraded: { color: "#f97316", label: "Partial Coverage", pulse: false },
    Surge: { color: "#ef4444", label: "Surge Conditions", pulse: true },
} as const;

// ── Main Component ────────────────────────────────────────────────────────────

interface MapIntelRailProps {
    className?: string;
}

export function MapIntelRail({ className = "" }: MapIntelRailProps) {
    const [collapsed, setCollapsed] = useState(false);
    const signals = useLiveMarketSignals();
    const coverage = COVERAGE_STATUS_CONFIG[signals.coverage_status];

    const liveSignals: MarketSignal[] = [
        {
            label: "Escorts Online",
            value: signals.escorts_online,
            color: "#22c55e",
            icon: Truck,
            pulse: true,
        },
        {
            label: "Loads in Motion",
            value: signals.loads_in_motion,
            color: "#F1A91B",
            icon: Activity,
        },
        {
            label: "Median Fill Time",
            value: signals.fill_time_median_min,
            unit: "min",
            color: signals.fill_time_median_min > 60 ? "#ef4444" : signals.fill_time_median_min > 30 ? "#f97316" : "#22c55e",
            icon: Clock,
        },
        {
            label: "Corridors Heating",
            value: signals.corridors_heating,
            color: "#ef4444",
            icon: TrendingUp,
        },
    ];

    return (
        <div className={`relative flex ${className}`} style={{ zIndex: 15 }}>

            {/* ── Collapsed toggle ──────────────────────────────────────────────── */}
            <button
                onClick={() => setCollapsed((c) => !c)}
                className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-16 flex items-center justify-center rounded-r-xl transition-colors"
                style={{
                    background: "rgba(5,5,10,0.85)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderLeft: "none",
                    backdropFilter: "blur(12px)",
                }}
            >
                {collapsed
                    ? <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                    : <ChevronLeft className="w-3.5 h-3.5 text-white/50" />
                }
            </button>

            {/* ── Rail body ────────────────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="rail"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 272, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden flex-shrink-0"
                    >
                        <div
                            className="w-[272px] h-full flex flex-col overflow-y-auto"
                            style={{
                                background: "rgba(4,6,12,0.88)",
                                backdropFilter: "blur(20px)",
                                borderRight: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Radio className="w-3.5 h-3.5 text-[#F1A91B] animate-pulse" />
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                                        Market Intelligence
                                    </span>
                                </div>

                                {/* Coverage status badge */}
                                <div
                                    className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl"
                                    style={{ background: `${coverage.color}0f`, border: `1px solid ${coverage.color}25` }}
                                >
                                    {coverage.pulse && (
                                        <span className="relative flex h-2 w-2 flex-shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: coverage.color }} />
                                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: coverage.color }} />
                                        </span>
                                    )}
                                    <span className="text-xs font-bold" style={{ color: coverage.color }}>{coverage.label}</span>
                                </div>
                            </div>

                            {/* Live KPI signals */}
                            <div className="px-4 py-3 border-b border-white/5 space-y-3">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Live Signals</div>
                                {liveSignals.map((sig) => {
                                    const Icon = sig.icon;
                                    return (
                                        <div key={sig.label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sig.color }} />
                                                <span className="text-xs text-white/50">{sig.label}</span>
                                            </div>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-sm font-black text-white">{sig.value}</span>
                                                {sig.unit && <span className="text-[10px] text-white/30">{sig.unit}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Corridor Stress Legend */}
                            <div className="px-4 py-3 border-b border-white/5">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2.5">
                                    Corridor Stress
                                </div>
                                <div className="space-y-2">
                                    {CORRIDOR_BANDS.map((band) => (
                                        <div key={band.label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{ background: band.color, boxShadow: `0 0 6px ${band.color}80` }}
                                                />
                                                <span className="text-xs text-white/50">{band.label}</span>
                                            </div>
                                            <span className="text-xs font-bold" style={{ color: band.color }}>
                                                {band.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Compact pressure bar */}
                                <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden flex">
                                    {CORRIDOR_BANDS.map((band) => (
                                        <div
                                            key={band.label}
                                            style={{
                                                width: `${(band.count / CORRIDOR_BANDS.reduce((s, b) => s + b.count, 0)) * 100}%`,
                                                background: band.color,
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between text-[9px] text-white/20 mt-1">
                                    <span>Critical</span>
                                    <span>Healthy</span>
                                </div>
                            </div>

                            {/* Last match & market pulse */}
                            <div className="px-4 py-3 border-b border-white/5">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2.5">
                                    Market Pulse
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">Last Match</span>
                                        <span className="text-xs font-bold text-emerald-400">
                                            {signals.last_match_ago_min === 0 ? "Just now" : `${signals.last_match_ago_min}m ago`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/40">Network Activity</span>
                                        <span className="text-xs font-bold text-[#F1A91B]">High ↑</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="p-4 mt-auto">
                                <button
                                    className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-wider text-black transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                                    style={{
                                        background: "#F1A91B",
                                        boxShadow: "0 0 14px rgba(241,169,27,0.25)",
                                    }}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5" />
                                        Post a Load
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
