"use client";

import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// MARKET TERMINAL RIBBON
// Sticky ribbon under header — live market terminal feel.
// Mobile: 3 chips visible, swipe for more.
// Desktop: all chips visible.
// ═══════════════════════════════════════════════════════════════

interface GlobalStats {
    loads_60m?: number;
    operators_verified?: number;
    rate_index_7d?: number; // e.g. 0.12 = +12%
    hot_corridor?: string;
    avg_match_time_sec?: number;
    total_surfaces?: number;
    corridors_live?: number;
}

function formatCompact(n?: number): string {
    if (n === undefined || n === null) return "—";
    if (n === 0) return "0";
    return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatPct(v?: number): string {
    if (v === undefined || v === null) return "Initializing";
    const sign = v > 0 ? "+" : "";
    return `${sign}${(v * 100).toFixed(1)}%`;
}

function formatTime(sec?: number): string {
    if (!sec) return "—";
    if (sec < 60) return `${sec}s`;
    const m = Math.round(sec / 60);
    return `${m}m`;
}

function TrendIcon({ value }: { value?: number }) {
    if (value === undefined || value === null) return null;
    const size = 10;
    if (value > 0) return <TrendingUp style={{ width: size, height: size, color: "#22c55e" }} />;
    if (value < 0) return <TrendingDown style={{ width: size, height: size, color: "#f87171" }} />;
    return <Minus style={{ width: size, height: size, color: "#6b7280" }} />;
}

export function MarketTerminalRibbon() {
    const [stats, setStats] = useState<GlobalStats>({});
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/stats/global", { cache: "no-store" });
                const json = await res.json();
                if (alive) setStats(json);
            } catch {
                // keep fallbacks — UI shows "—" / "Initializing"
            }
        })();
        return () => { alive = false; };
    }, []);

    const chips: { key: string; label: string; value: string; trend?: number; color?: string }[] = [
        {
            key: "loads",
            label: "Loads (60m)",
            value: formatCompact(stats.loads_60m),
            color: stats.loads_60m && stats.loads_60m > 0 ? "#22c55e" : undefined,
        },
        {
            key: "verified",
            label: "Verified",
            value: formatCompact(stats.operators_verified),
            color: "#C6923A",
        },
        {
            key: "rate",
            label: "Rate Index",
            value: formatPct(stats.rate_index_7d),
            trend: stats.rate_index_7d,
            color: stats.rate_index_7d !== undefined
                ? stats.rate_index_7d > 0 ? "#22c55e" : stats.rate_index_7d < 0 ? "#f87171" : "#6b7280"
                : undefined,
        },
        {
            key: "corridor",
            label: "Hottest",
            value: stats.hot_corridor ?? "Initializing",
            color: "#f5b942",
        },
        {
            key: "match",
            label: "Avg Match",
            value: formatTime(stats.avg_match_time_sec),
        },
    ];

    return (
        <div className="hc-terminal" role="marquee" aria-label="Live market metrics">
            <div className="hc-terminal-track" ref={trackRef}>
                {/* Live pulse dot */}
                <div className="hc-terminal-live">
                    <span className="hc-terminal-live-dot" />
                    <span className="hc-terminal-live-label">LIVE</span>
                </div>

                {chips.map((chip) => (
                    <div key={chip.key} className="hc-chip">
                        <span className="hc-k">{chip.label}</span>
                        <span className="hc-v" style={{ color: chip.color }}>
                            {chip.trend !== undefined && <TrendIcon value={chip.trend} />}
                            {chip.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
