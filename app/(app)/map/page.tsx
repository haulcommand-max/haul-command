"use client";

import { MapMobileGate } from '@/components/mobile/gates/MapMobileGate';

/**
 * /map â€” Command Center Map Page
 *
 * Layout guarantees for MapLibre:
 *  - Root is `position:fixed; inset:0` â†’ full viewport
 *  - ActivityTicker is position:relative (in-flow) â€” h-9 = 36px when visible
 *  - View toggle is `position:absolute` overlay â€” doesn't affect layout
 *  - Map container uses explicit style={{ height: "..." }} so MapLibre always
 *    has a concrete pixel height regardless of flex/ticker state
 *
 *  FEATURES (JBH-inspired):
 *  - Small States Sidebar: vertical rail for dense NE states (avoids pin overlap)
 *  - Grid View: sortable, filterable table/card load view (hybrid mapâ†”grid)
 *  - Live count badge + freshness timestamp
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { safeUUID } from "@/lib/identity/uid";
import { ActivityTicker } from "@/components/liquidity/ActivityTicker";
import { LiquidityPromptCard } from "@/components/liquidity/LiquidityPromptCard";
import { JurisdictionDrawer } from "@/components/map/JurisdictionDrawer";
import { MapMicroHint } from "@/components/map/MapMicroHint";
import { CorridorLiquidityHeatmap } from "@/components/map/CorridorLiquidityHeatmap";
import { MapIntelRail } from "@/components/map/MapIntelRail";
import { SmallStatesSidebar } from "@/components/map/SmallStatesSidebar";
import { useMapAnalytics } from "@/hooks/useMapAnalytics";
import { WorldMapView } from "@/components/map/WorldMapView";

// â”€â”€ Dynamic imports (browser-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CommandMap = dynamic(
    () => import("@/components/map/CommandMap").then((m) => m.CommandMap),
    { ssr: false, loading: () => <MapSkeleton /> }
);

// NorthAmericaMap â€” clickable SVG map (US states + CA provinces â†’ router.push)
const NorthAmericaMap = dynamic(
    () => import("@/components/maps/NorthAmericaMap").then((m) => m.NorthAmericaMap),
    { ssr: false, loading: () => <MapSkeleton /> }
);

// LoadGridView â€” sortable/filterable table (JBH grid navigation equivalent)
const LoadGridView = dynamic(
    () => import("@/components/map/LoadGridView").then((m) => m.LoadGridView),
    { ssr: false, loading: () => <MapSkeleton /> }
);

// â”€â”€ Skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MapSkeleton() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500/60 border-t-transparent animate-spin" />
                <p className="text-gray-600 text-sm font-medium tracking-wide">Initialising mapâ€¦</p>
            </div>
        </div>
    );
}

// â”€â”€ Legend (operations view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type MapView = "operations" | "jurisdictions" | "corridors" | "grid" | "global";

// â”€â”€ Country counts hook (global 52-country rail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useCountryCounts(): Record<string, number> {
    const [counts, setCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        async function fetchCounts() {
            try {
                const res = await fetch("/api/map/loads?limit=1000");
                if (!res.ok) return;
                const fc = await res.json();
                const features = fc.features ?? [];

                // Aggregate by country â€” currently loads are US-dominant;
                // once loads table has country_code column, use that directly.
                const result: Record<string, number> = {};
                for (const f of features) {
                    const state = f.properties?.state;
                    // Infer country from state code pattern
                    // US states are 2-letter alpha, CA provinces are also 2-letter
                    // For now: all loads default to "US" unless we get country_code
                    const country = f.properties?.country_code ?? "US";
                    result[country] = (result[country] ?? 0) + 1;
                }
                setCounts(result);
            } catch { }
        }
        fetchCounts();
        const interval = setInterval(fetchCounts, 60_000);
        return () => clearInterval(interval);
    }, []);

    return counts;
}

// â”€â”€ Grid view data hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useGridLoads() {
    const [loads, setLoads] = useState<any[]>([]);

    useEffect(() => {
        async function fetchLoads() {
            try {
                const res = await fetch("/api/map/loads?limit=500");
                if (!res.ok) return;
                const fc = await res.json();
                const items = (fc.features ?? []).map((f: any) => ({
                    id: f.properties?.id ?? safeUUID(),
                    title: f.properties?.title ?? "Escort Load",
                    origin_city: f.properties?.city ?? "",
                    origin_state: f.properties?.state ?? "",
                    urgency: f.properties?.urgency ?? 0,
                    status: f.properties?.status ?? "open",
                    equipment_type: "Pilot Car",
                    posted_at: new Date().toISOString(),
                }));
                setLoads(items);
            } catch { }
        }
        fetchLoads();
        const interval = setInterval(fetchLoads, 30_000);
        return () => clearInterval(interval);
    }, []);

    return loads;
}

export default function MapPage() {
    const router = useRouter();
    const [view, setView] = useState<MapView>("global");
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string>("");
    const [tickerHeight, setTickerHeight] = useState(0);
    const [gridStateFilter, setGridStateFilter] = useState<string | null>(null);
    const tickerRef = useRef<HTMLDivElement>(null);
    const analytics = useMapAnalytics();
    const countryCounts = useCountryCounts();
    const gridLoads = useGridLoads();

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
        <MapMobileGate>
        <div className="bg-gray-950 flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 56px)" }}>

            {/* â”€â”€ In-flow ticker â€” measured by ResizeObserver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div ref={tickerRef}>
                <ActivityTicker />
            </div>

            {/* â”€â”€ View toggle â€” absolute, doesn't affect layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div
                data-testid="map-view-toggle"
                className="absolute left-1/2 -translate-x-1/2 z-30 flex bg-gray-900/90 backdrop-blur-sm border border-gray-700/60 rounded-full p-0.5 shadow-2xl"
                style={{ top: tickerHeight + 8 }}
            >
                {(["operations", "jurisdictions", "corridors", "grid", "global"] as MapView[]).map((v) => (
                    <button aria-label="Interactive Button"
                        key={v}
                        data-testid={`map-toggle-${v}`}
                        onClick={() => { setView(v); if (v !== "jurisdictions") setSelectedCode(null); }}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all capitalize ${view === v
                            ? v === "operations"
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                : v === "jurisdictions"
                                    ? "bg-amber-500 text-white"
                                    : v === "grid"
                                        ? "bg-blue-500 text-white"
                                        : v === "global"
                                            ? "bg-purple-500 text-white"
                                            : "bg-emerald-500 text-white"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        {v === "grid" ? "Grid" : v === "global" ? "ðŸŒ Global" : v}
                    </button>
                ))}
            </div>

            {/* â”€â”€ Main content â€” explicit pixel height â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex" style={{ height: mapAreaHeight }}>

                {/* Left Intel Rail â€” Operations view only, desktop only */}
                {view === "operations" && (
                    <div className="hidden md:flex h-full" style={{ zIndex: 10 }}>
                        <MapIntelRail className="h-full" />
                    </div>
                )}

                {/* Map / content region */}
                <div className="relative flex-1 overflow-hidden">

                    {/* â”€â”€ Operations: live MapLibre map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {view === "operations" && (
                        <>
                            {/* CommandMap fills container absolutely */}
                            <CommandMap className="absolute inset-0" />

                            {/* Global Country Rail â€” 52-country sidebar */}
                            <SmallStatesSidebar
                                countryCounts={countryCounts}
                                onCountrySelect={(iso2) => {
                                    setGridStateFilter(iso2);
                                    setView("grid");
                                    analytics.trackJurisdictionSelected(iso2);
                                }}
                            />

                            <MapLegend />

                            {/* "Go to Grid" link â€” JBH-style */}
                            <button aria-label="Interactive Button"
                                onClick={() => { setGridStateFilter(null); setView("grid"); }}
                                className="absolute top-3 right-[88px] z-20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:-translate-y-0.5"
                                style={{
                                    background: "rgba(4,6,12,0.85)",
                                    color: "#F1A91B",
                                    border: "1px solid rgba(241,169,27,0.25)",
                                    backdropFilter: "blur(12px)",
                                }}
                            >
                                Go to Grid Navigation â†’
                            </button>

                            {/* Mobile liquidity prompt â€” bottom of screen */}
                            <div className="absolute bottom-6 left-4 right-4 md:hidden z-10 pointer-events-none">
                                <LiquidityPromptCard className="pointer-events-auto" />
                            </div>
                        </>
                    )}

                    {/* â”€â”€ Corridors: Intelligence Heatmap panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {view === "corridors" && (
                        <div className="absolute inset-0 overflow-auto bg-gray-950">
                            <CorridorLiquidityHeatmap className="h-full min-h-full" />
                        </div>
                    )}

                    {/* â”€â”€ Jurisdictions: interactive SVG shape-map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {view === "jurisdictions" && (
                        <div className="flex-1 overflow-y-auto bg-gray-950">
                            <div className="max-w-5xl mx-auto px-6 py-6">
                                {/* Clickable SVG map â€” each state/province routes to /directory/{country}/{code} */}
                                <NorthAmericaMap />
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ Grid: sortable/filterable load table (JBH-inspired) â”€ */}
                    {view === "grid" && (
                        <div className="absolute inset-0 overflow-hidden">
                            <LoadGridView
                                loads={gridLoads}
                                stateFilter={gridStateFilter}
                                onSwitchToMap={() => { setGridStateFilter(null); setView("operations"); }}
                                onLoadSelect={(id) => {
                                    router.push(`/app/loads/${id}`);
                                }}
                            />
                        </div>
                    )}

                    {/* â”€â”€ Global: 57-country world map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {view === "global" && (
                        <div className="absolute inset-0 overflow-hidden">
                            <WorldMapView />
                        </div>
                    )}
                </div>
            </div>

            {/* â”€â”€ Jurisdiction Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {selectedCode && (
                <JurisdictionDrawer
                    jurisdictionCode={selectedCode}
                    jurisdictionName={selectedName}
                    onClose={() => setSelectedCode(null)}
                />
            )}
        </div>
        </MapMobileGate>
    );
}