"use client";

/**
 * /map — Command Center Map Page
 *
 * Layout guarantees for MapLibre:
 *  - Root is `position:fixed; inset:0` → full viewport
 *  - ActivityTicker is position:relative (in-flow) — h-9 = 36px when visible
 *  - View toggle is `position:absolute` overlay — doesn't affect layout
 *  - Map container uses explicit style={{ height: "..." }} so MapLibre always
 *    has a concrete pixel height regardless of flex/ticker state
 */

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ActivityTicker } from "@/components/liquidity/ActivityTicker";
import { LiquidityPromptCard } from "@/components/liquidity/LiquidityPromptCard";
import { JurisdictionDrawer } from "@/components/map/JurisdictionDrawer";
import { MapMicroHint } from "@/components/map/MapMicroHint";
import { CorridorLiquidityHeatmap } from "@/components/map/CorridorLiquidityHeatmap";
import { MapIntelRail } from "@/components/map/MapIntelRail";
import { useMapAnalytics } from "@/hooks/useMapAnalytics";

// ── Dynamic imports (browser-only) ────────────────────────────────────────────

const CommandMap = dynamic(
    () => import("@/components/map/CommandMap").then((m) => m.CommandMap),
    { ssr: false, loading: () => <MapSkeleton /> }
);

// NorthAmericaMap — clickable SVG map (US states + CA provinces → router.push)
const NorthAmericaMap = dynamic(
    () => import("@/components/maps/NorthAmericaMap").then((m) => m.NorthAmericaMap),
    { ssr: false, loading: () => <MapSkeleton /> }
);

// ── Skeleton ─────────────────────────────────────────────────────────────────

function MapSkeleton() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500/60 border-t-transparent animate-spin" />
                <p className="text-gray-600 text-sm font-medium tracking-wide">Initialising map…</p>
            </div>
        </div>
    );
}

// ── Legend (operations view) ──────────────────────────────────────────────────

function MapLegend() {
    return (
        <div
            className="absolute bottom-10 right-4 z-10 hidden md:block"
            style={{
                background: "rgba(4,6,12,0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: "12px 16px",
            }}
        >
            <p className="font-black text-white/40 text-[9px] uppercase tracking-[0.2em] mb-2.5">Legend</p>
            <div className="space-y-2 text-[11px]">
                {[
                    { color: "#f97316", label: "Active Load" },
                    { color: "#ef4444", label: "Urgent Load" },
                    { color: "#3b82f6", label: "Escort Online" },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                        <span className="text-white/50">{label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2">
                    <span className="w-4 h-px flex-shrink-0 rounded-full"
                        style={{ background: "#f97316", opacity: 0.7 }} />
                    <span className="text-white/50">Corridor</span>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type MapView = "operations" | "jurisdictions" | "corridors";

export default function MapPage() {
    const [view, setView] = useState<MapView>("jurisdictions");
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string>("");
    const [tickerHeight, setTickerHeight] = useState(0);
    const tickerRef = useRef<HTMLDivElement>(null);
    const analytics = useMapAnalytics();

    useEffect(() => {
        analytics.trackMapOpened();
    }, []);

    // Measure actual ticker height so map container always fills the remainder
    useEffect(() => {
        if (!tickerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            setTickerHeight(entries[0]?.contentRect.height ?? 0);
        });
        ro.observe(tickerRef.current);
        return () => ro.disconnect();
    }, []);

    // Still used for operations-view drawer only
    const handleJurisdictionSelect = (code: string, name: string) => {
        const jurisdictionCode = code.length === 2
            ? (code.match(/^[A-Z]{2}$/) ? `US-${code}` : code)
            : code;
        setSelectedCode(jurisdictionCode);
        setSelectedName(name);
        analytics.trackJurisdictionSelected(jurisdictionCode);
    };

    // Map area height = 100vh minus whatever the ticker actually occupies
    const mapAreaHeight = `calc(100dvh - ${tickerHeight}px)`;

    return (
        <div className="bg-gray-950 flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 56px)" }}>

            {/* ── In-flow ticker — measured by ResizeObserver ─────────────── */}
            <div ref={tickerRef}>
                <ActivityTicker />
            </div>

            {/* ── View toggle — absolute, doesn't affect layout ────────────── */}
            <div
                data-testid="map-view-toggle"
                className="absolute left-1/2 -translate-x-1/2 z-30 flex bg-gray-900/90 backdrop-blur-sm border border-gray-700/60 rounded-full p-0.5 shadow-2xl"
                style={{ top: tickerHeight + 8 }}
            >
                {(["operations", "jurisdictions", "corridors"] as MapView[]).map((v) => (
                    <button
                        key={v}
                        data-testid={`map-toggle-${v}`}
                        onClick={() => { setView(v); if (v !== "jurisdictions") setSelectedCode(null); }}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all capitalize ${view === v
                            ? v === "operations"
                                ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
                                : v === "jurisdictions"
                                    ? "bg-amber-500 text-black"
                                    : "bg-emerald-500 text-black"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        {v}
                    </button>
                ))}
            </div>

            {/* ── Main content — explicit pixel height ─────────────────────── */}
            <div className="flex" style={{ height: mapAreaHeight }}>

                {/* Left Intel Rail — Operations view only, desktop only */}
                {view === "operations" && (
                    <div className="hidden md:flex h-full" style={{ zIndex: 10 }}>
                        <MapIntelRail className="h-full" />
                    </div>
                )}

                {/* Map / content region */}
                <div className="relative flex-1 overflow-hidden">

                    {/* ── Operations: live MapLibre map ───────────────────── */}
                    {view === "operations" && (
                        <>
                            {/* CommandMap fills container absolutely */}
                            <CommandMap className="absolute inset-0" />

                            <MapLegend />

                            {/* Mobile liquidity prompt — bottom of screen */}
                            <div className="absolute bottom-6 left-4 right-4 md:hidden z-10 pointer-events-none">
                                <LiquidityPromptCard className="pointer-events-auto" />
                            </div>
                        </>
                    )}

                    {/* ── Corridors: Intelligence Heatmap panel ───────────── */}
                    {view === "corridors" && (
                        <div className="absolute inset-0 overflow-auto bg-gray-950">
                            <CorridorLiquidityHeatmap className="h-full min-h-full" />
                        </div>
                    )}

                    {/* ── Jurisdictions: interactive SVG shape-map ──────────── */}
                    {view === "jurisdictions" && (
                        <div className="flex-1 overflow-y-auto bg-gray-950">
                            <div className="max-w-5xl mx-auto px-6 py-6">
                                {/* Clickable SVG map — each state/province routes to /directory/{country}/{code} */}
                                <NorthAmericaMap />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Jurisdiction Drawer ───────────────────────────────────── */}
            {selectedCode && (
                <JurisdictionDrawer
                    jurisdictionCode={selectedCode}
                    jurisdictionName={selectedName}
                    onClose={() => setSelectedCode(null)}
                />
            )}
        </div>
    );
}
