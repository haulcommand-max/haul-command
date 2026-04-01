"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Shield, Signal, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// Coverage Confidence Overlay — Map heatband layer
// Source: lib/loadboard/coverage-confidence.ts
// Bands: dead → thin → balanced → strong → dominant
// Spec: HC_DOMINATION_PATCH_V1 Phase 1
// ══════════════════════════════════════════════════════════════

export type CoverageBand = "dead" | "thin" | "balanced" | "strong" | "dominant";

interface CellData {
    cellId: string;
    lat: number;
    lng: number;
    coverageConfidence: number; // 0-1
    band: CoverageBand;
    activeOperators: number;
    activeJobs: number;
    guidance: string;
}

interface CoverageConfidenceOverlayProps {
    cells: CellData[];
    visible?: boolean;
    onCellClick?: (cell: CellData) => void;
    className?: string;
}

const BAND_CONFIG: Record<CoverageBand, {
    color: string; bgOpacity: number; label: string; emoji: string; glow: string;
}> = {
    dead: { color: "#6b7280", bgOpacity: 0.15, label: "Dead Zone", emoji: "⚫", glow: "none" },
    thin: { color: "#ef4444", bgOpacity: 0.25, label: "Thin", emoji: "🔴", glow: "0 0 8px rgba(239,68,68,0.3)" },
    balanced: { color: "#f59e0b", bgOpacity: 0.20, label: "Balanced", emoji: "🟡", glow: "0 0 8px rgba(245,158,11,0.3)" },
    strong: { color: "#10b981", bgOpacity: 0.25, label: "Strong", emoji: "🟢", glow: "0 0 10px rgba(16,185,129,0.4)" },
    dominant: { color: "#6366f1", bgOpacity: 0.30, label: "Dominant", emoji: "🔵", glow: "0 0 14px rgba(99,102,241,0.5)" },
};

export function CoverageConfidenceOverlay({
    cells,
    visible = true,
    onCellClick,
    className,
}: CoverageConfidenceOverlayProps) {
    if (!visible || cells.length === 0) return null;

    const bandCounts = useMemo(() => {
        const counts: Record<CoverageBand, number> = { dead: 0, thin: 0, balanced: 0, strong: 0, dominant: 0 };
        for (const c of cells) counts[c.band]++;
        return counts;
    }, [cells]);

    const avgConfidence = useMemo(
        () => cells.reduce((s, c) => s + c.coverageConfidence, 0) / Math.max(cells.length, 1),
        [cells]
    );

    return (
        <div className={cn("relative", className)}>
            {/* Legend Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 right-3 z-20 bg-[rgba(10,15,25,0.92)] backdrop-blur-xl border border-white/10 rounded-xl p-3 min-w-[200px]"
            >
                <div className="flex items-center gap-2 mb-2">
                    <Signal className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-[0.15em]">
                        Coverage Confidence
                    </span>
                </div>

                <div className="flex items-center gap-1 mb-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden flex">
                        {(Object.keys(BAND_CONFIG) as CoverageBand[]).map(band => (
                            <div
                                key={band}
                                style={{
                                    flex: Math.max(bandCounts[band], 1),
                                    background: BAND_CONFIG[band].color,
                                    transition: "flex 0.5s ease",
                                }}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-white/70 ml-2">
                        {Math.round(avgConfidence * 100)}%
                    </span>
                </div>

                {(Object.entries(BAND_CONFIG) as [CoverageBand, typeof BAND_CONFIG[CoverageBand]][]).map(
                    ([band, config]) => (
                        <div key={band} className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: config.color }} />
                                <span className="text-[10px] text-white/60">{config.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-white/50">{bandCounts[band]}</span>
                        </div>
                    )
                )}
            </motion.div>

            {/* Cell markers (positioned by parent map) */}
            {cells.map(cell => {
                const conf = BAND_CONFIG[cell.band];
                return (
                    <motion.div
                        key={cell.cellId}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.3 }}
                        onClick={() => onCellClick?.(cell)}
                        className="absolute cursor-pointer group"
                        style={{
                            // Parent map component positions these via lat/lng transforms
                            // These are data attributes for the map integration layer
                        }}
                        data-lat={cell.lat}
                        data-lng={cell.lng}
                        title={`${conf.label}: ${Math.round(cell.coverageConfidence * 100)}% | ${cell.activeOperators} operators, ${cell.activeJobs} jobs`}
                    >
                        {/* Pulsing dot */}
                        <div
                            className="w-4 h-4 rounded-full relative"
                            style={{
                                background: conf.color,
                                boxShadow: conf.glow,
                                opacity: 0.4 + cell.coverageConfidence * 0.6,
                            }}
                        >
                            {cell.band === "dominant" && (
                                <div
                                    className="absolute inset-0 rounded-full animate-ping"
                                    style={{ background: conf.color, opacity: 0.3 }}
                                />
                            )}
                        </div>

                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30">
                            <div className="bg-[rgba(10,15,25,0.95)] backdrop-blur-xl border border-white/10 rounded-lg p-2.5 min-w-[160px] shadow-xl">
                                <div className="text-xs font-bold text-white mb-1">
                                    {conf.emoji} {conf.label}
                                </div>
                                <div className="text-[10px] text-white/60 space-y-0.5">
                                    <div>Confidence: <span className="text-white font-bold">{Math.round(cell.coverageConfidence * 100)}%</span></div>
                                    <div>Operators: <span className="text-white font-bold">{cell.activeOperators}</span></div>
                                    <div>Active Jobs: <span className="text-white font-bold">{cell.activeJobs}</span></div>
                                </div>
                                <div className="text-[9px] text-white/40 mt-1.5 italic">{cell.guidance}</div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// Coverage Confidence Toggle Button — for map toolbar
// ══════════════════════════════════════════════════════════════

interface CoverageToggleProps {
    active: boolean;
    onToggle: () => void;
}

export function CoverageConfidenceToggle({ active, onToggle }: CoverageToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border",
                active
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
            )}
        >
            <Signal className="w-3 h-3" />
            Coverage
        </button>
    );
}
