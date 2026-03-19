"use client";

import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// MARKET TERMINAL RIBBON
// RULE: Never show "Initializing", "—", or empty values publicly.
//       If data isn't ready, hide the chip entirely.
// ═══════════════════════════════════════════════════════════════

interface GlobalStats {
    loads_60m?: number;
    operators_verified?: number;
    rate_index_7d?: number;
    hot_corridor?: string;
    avg_match_time_sec?: number;
    total_surfaces?: number;
    corridors_live?: number;
}

function formatCompact(n?: number): string | null {
    if (n === undefined || n === null || n === 0) return null;
    return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatPct(v?: number): string | null {
    if (v === undefined || v === null) return null;
    const sign = v > 0 ? "+" : "";
    return `${sign}${(v * 100).toFixed(1)}%`;
}

function formatTime(sec?: number): string | null {
    if (!sec) return null;
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
    const [loaded, setLoaded] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch("/api/stats/global", { cache: "no-store" });
                const json = await res.json();
                if (alive) { setStats(json); setLoaded(true); }
            } catch {
                if (alive) setLoaded(true);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Build chips — only include those with real data
    const allChips: { key: string; label: string; value: string; trend?: number; color?: string }[] = [];

    const loadsVal = formatCompact(stats.loads_60m);
    if (loadsVal) allChips.push({ key: "loads", label: "Loads (60m)", value: loadsVal, color: "#22c55e" });

    const verifiedVal = formatCompact(stats.operators_verified);
    if (verifiedVal) allChips.push({ key: "verified", label: "Verified", value: verifiedVal, color: "#C6923A" });

    const rateVal = formatPct(stats.rate_index_7d);
    if (rateVal) allChips.push({
        key: "rate", label: "Rate Index", value: rateVal, trend: stats.rate_index_7d,
        color: stats.rate_index_7d! > 0 ? "#22c55e" : stats.rate_index_7d! < 0 ? "#f87171" : "#6b7280",
    });

    if (stats.hot_corridor) allChips.push({ key: "corridor", label: "Hottest", value: stats.hot_corridor, color: "#f5b942" });

    const matchVal = formatTime(stats.avg_match_time_sec);
    if (matchVal) allChips.push({ key: "match", label: "Avg Match", value: matchVal });

    // If no data at all yet, show minimal static chip
    if (!loaded) {
        return (
            <div className="hc-terminal" role="marquee" aria-label="Live market metrics">
                <div className="hc-terminal-track" ref={trackRef}>
                    <div className="hc-terminal-live">
                        <span className="hc-terminal-live-dot" />
                        <span className="hc-terminal-live-label">LIVE</span>
                    </div>
                    <div className="hc-chip">
                        <span className="hc-k">Market</span>
                        <span className="hc-v" style={{ color: "#22c55e" }}>Online</span>
                    </div>
                </div>
            </div>
        );
    }

    // If loaded but zero real chips, show "Market Active"
    if (allChips.length === 0) {
        allChips.push({ key: "status", label: "Status", value: "Active", color: "#22c55e" });
    }

    return (
        <div className="hc-terminal" role="marquee" aria-label="Live market metrics">
            <div className="hc-terminal-track" ref={trackRef}>
                <div className="hc-terminal-live">
                    <span className="hc-terminal-live-dot" />
                    <span className="hc-terminal-live-label">LIVE</span>
                </div>

                {allChips.map((chip) => (
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
