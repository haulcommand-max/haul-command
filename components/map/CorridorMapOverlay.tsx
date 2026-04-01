"use client";

import { useEffect, useState, useCallback } from "react";
import { CommandMap } from "@/components/map/CommandMap";

interface CorridorStress {
    corridor_slug: string;
    stress_score: number;
    band: "healthy" | "tightening" | "at_risk" | "critical";
    active_escort_count: number;
    load_count_24h: number;
    region_a?: string;
    region_b?: string;
}

interface CorridorMapOverlayProps {
    className?: string;
}

const BAND_COLORS = {
    healthy: "#10b981", // emerald
    tightening: "#f59e0b", // amber
    at_risk: "#f97316", // orange
    critical: "#ef4444", // red
};

const BAND_LABELS = {
    healthy: "🟢 Healthy",
    tightening: "🟡 Tightening",
    at_risk: "🟠 At Risk",
    critical: "🔴 Critical",
};

// Approximate corridor centerpoints for overlay pins
const CORRIDOR_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
    "i-95-northeast": { lat: 38.5, lng: -76.5, label: "I-95 NE" },
    "i-10-southern": { lat: 30.2, lng: -92.0, label: "I-10 S" },
    "i-75-southeast": { lat: 31.0, lng: -83.5, label: "I-75 SE" },
    "i-80-transcontinental": { lat: 40.8, lng: -98.0, label: "I-80" },
    "i-40-southern-cross": { lat: 35.5, lng: -99.0, label: "I-40" },
    "trans-canada-highway": { lat: 50.0, lng: -96.0, label: "Trans-CA" },
};

export default function CorridorMapOverlay({ className = "" }: CorridorMapOverlayProps) {
    const [corridors, setCorridors] = useState<CorridorStress[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const res = await fetch("/api/corridors/stress");
            if (res.ok) setCorridors(await res.json());
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadData]);

    const selectedCorridor = corridors.find(c => c.corridor_slug === selected);

    return (
        <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${className}`}>
            {/* Live MapLibre map — replaces static SVG placeholder */}
            <div className="relative w-full" style={{ minHeight: 420 }}>
                {/* Base map */}
                <CommandMap className="absolute inset-0" />

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-900/70 px-3 py-1.5 rounded-full">
                            <div className="w-4 h-4 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
                            Loading coverage...
                        </div>
                    </div>
                )}

                {/* Corridor stress pins — HTML overlay using Mercator-approximate % positions.
                    Longitude range -130 to -50 (80°) → 0-100% left.
                    Latitude range 60 to 20 (40°) → 0-100% top. */}
                {corridors.map(c => {
                    const center = CORRIDOR_CENTERS[c.corridor_slug];
                    if (!center) return null;
                    const color = BAND_COLORS[c.band] ?? "#94a3b8";
                    const left = ((center.lng + 130) / 80) * 100;
                    const top = ((60 - center.lat) / 40) * 100;
                    return (
                        <button
                            key={c.corridor_slug}
                            onClick={() => setSelected(selected === c.corridor_slug ? null : c.corridor_slug)}
                            title={`${center.label} — ${BAND_LABELS[c.band]}`}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
                            style={{ left: `${Math.max(5, Math.min(95, left))}%`, top: `${Math.max(5, Math.min(90, top))}%` }}
                        >
                            {c.band === "critical" && (
                                <span
                                    className="absolute inset-0 rounded-full animate-ping opacity-60"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                            <span
                                className="relative flex w-5 h-5 rounded-full border-2 border-slate-900 shadow-lg transition-transform group-hover:scale-125"
                                style={{ backgroundColor: color }}
                            />
                            <span className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {center.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Corridor detail panel */}
            {selectedCorridor && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-2xl z-20">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                {CORRIDOR_CENTERS[selectedCorridor.corridor_slug]?.label ?? selectedCorridor.corridor_slug}
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className="text-sm font-black"
                                    style={{ color: BAND_COLORS[selectedCorridor.band] }}
                                >
                                    {BAND_LABELS[selectedCorridor.band]}
                                </span>
                                <span className="text-xs text-slate-500">Stress {Math.round(selectedCorridor.stress_score)}/100</span>
                            </div>
                        </div>
                        <div className="flex gap-4 text-center">
                            <div>
                                <div className="text-lg font-black text-white">{selectedCorridor.active_escort_count}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wide">Active</div>
                            </div>
                            <div>
                                <div className="text-lg font-black text-white">{selectedCorridor.load_count_24h}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wide">Loads 24h</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            className="text-slate-500 hover:text-white transition-colors text-sm"
                        >✕</button>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="px-4 py-3 border-t border-slate-800 flex flex-wrap items-center gap-4">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Coverage</span>
                {Object.entries(BAND_COLORS).map(([band, color]) => (
                    <span key={band} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {band.replace("_", " ")}
                    </span>
                ))}
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 ml-auto">
                    <span className="w-2 h-2 rounded-full bg-blue-400/50 border border-blue-400/30" />
                    Active Escort
                </span>
            </div>
        </div>
    );
}
