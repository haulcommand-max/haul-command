"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
    ComposableMap,
    Geographies,
    Geography,
    Line,
    Annotation,
} from "react-simple-maps";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

// ══════════════════════════════════════════════════════════════
// CorridorMap v8 — Haul Command
// Dual-geography approach:
//   Layer 1 — world-atlas@2 countries (Canada, Mexico etc) via jsdelivr
//   Layer 2 — us-atlas@3 states (all 50 US states)  via jsdelivr
// Both are real @npm packages reliably hosted on cdn.jsdelivr.net
// Projection: geoAlbersUsa doesn't include Canada, so we use
//   geoMercator centered on North America for both layers.
// ══════════════════════════════════════════════════════════════

// ── TopoJSON URLs (reliable npm CDN) ─────────────────────────
const WORLD_GEO = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_GEO = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// ── Country numeric codes (ISO 3166-1 numeric) ───────────────
const CANADA_ID = "124";
const MEXICO_ID = "484";

// ── Region heat ───────────────────────────────────────────────
export type RegionHeat = "low" | "moderate" | "hot" | "unknown";
export interface RegionData {
    code: string;
    heat: RegionHeat;
    escortCount?: number;
    openLoads?: number;
}

interface CorridorMapProps {
    regionData?: RegionData[];
    className?: string;
    onStateClick?: (code: string) => void;
}

// ── State name / abbreviation lookups ────────────────────────
const STATE_NAMES: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
    MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
    NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

// FIPS code → state abbreviation (us-atlas@3 uses numeric FIPS)
const FIPS: Record<string, string> = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
    "10": "DE", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
    "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA",
    "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV",
    "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN",
    "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
    "56": "WY",
};

// ── Default demand data ───────────────────────────────────────
const HOT_STATES = new Set(["TX", "LA", "FL", "CA", "GA", "TN", "AL", "AZ", "NC", "OK", "OR", "WA"]);
const MOD_STATES = new Set(["AR", "MS", "SC", "CO", "VA", "OH", "IL", "IN", "MT", "ID", "NV", "NM", "KS"]);

// ── Heat → fill color ────────────────────────────────────────
function stateFill(heat: RegionHeat, hovered: boolean): string {
    if (hovered) return "#C6923A";
    switch (heat) {
        case "hot": return "#8B6020";
        case "moderate": return "#3D3015";
        case "low": return "#1E2530";
        default: return "#1A1F28";
    }
}

// ── Tooltip ────────────────────────────────────────────────────
function MapTooltip({ code, name, data, x, y }: {
    code: string; name: string; data?: RegionData; x: number; y: number;
}) {
    const heat = data?.heat ?? "unknown";
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 pointer-events-none bg-[#1A1F28] border border-[#374151] rounded-xl shadow-xl px-4 py-3 min-w-[156px]"
            style={{ left: Math.min(x + 14, 620), top: Math.max(y - 90, 8) }}
        >
            <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-black text-white truncate">{name}</span>
                <span className="text-[9px] font-black text-gray-400 bg-[#252D3A] px-1.5 py-0.5 rounded uppercase tracking-widest">
                    {code}
                </span>
            </div>
            <div className="space-y-0.5 mt-1">
                <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Demand</span>
                    <span className="font-bold text-white">
                        {heat === "hot" ? "🔥 High" : heat === "moderate" ? "⚡ Building" : heat === "low" ? "Low" : "—"}
                    </span>
                </div>
                {(data?.escortCount ?? 0) > 0 && (
                    <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Pilots</span>
                        <span className="font-bold text-amber-400">{data?.escortCount}</span>
                    </div>
                )}
                {(data?.openLoads ?? 0) > 0 && (
                    <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Open Loads</span>
                        <span className="font-bold text-red-400">{data?.openLoads}</span>
                    </div>
                )}
            </div>
            <div className="mt-2 pt-1.5 border-t border-[#374151]">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                    Click → Browse Pilots
                </span>
            </div>
        </motion.div>
    );
}

// ── Main component ─────────────────────────────────────────────
export function CorridorMap({ regionData = [], className, onStateClick }: CorridorMapProps) {
    const [hoveredCode, setHoveredCode] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [showCorridors, setShowCorridors] = useState(true);

    const dataMap = new Map<string, RegionData>(regionData.map(r => [r.code, r]));

    const getHeat = useCallback((code: string): RegionHeat => {
        if (dataMap.has(code)) return dataMap.get(code)!.heat;
        if (HOT_STATES.has(code)) return "hot";
        if (MOD_STATES.has(code)) return "moderate";
        return "low";
    }, [dataMap]);

    function handleMove(e: React.MouseEvent<SVGPathElement>, code: string) {
        const svgEl = (e.currentTarget as Element).closest("svg");
        if (!svgEl) return;
        const r = svgEl.getBoundingClientRect();
        setTooltipPos({ x: e.clientX - r.left, y: e.clientY - r.top });
        setHoveredCode(code);
    }

    // Mercator projection centered on North America
    const projectionConfig = { scale: 340, center: [-97, 56] as [number, number] };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Legend + toggle */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                    {[
                        { c: "#8B6020", l: "High Demand" },
                        { c: "#3D3015", l: "Building" },
                        { c: "#1E2530", l: "Light" },
                    ].map(({ c, l }) => (
                        <div key={l} className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm border border-white/10" style={{ background: c }} />
                            <span className="text-[10px] text-gray-400 font-semibold">{l}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setShowCorridors(v => !v)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all",
                        showCorridors
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-[#1E2530] border-[#374151] text-gray-500"
                    )}
                >
                    <span className={cn("inline-block w-4 h-[2px] rounded", showCorridors ? "bg-amber-400" : "bg-gray-500")} />
                    Corridors
                </button>
            </div>

            {/* Map */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#374151] bg-[#0F1318]">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={projectionConfig}
                    width={800}
                    height={480}
                    style={{ width: "100%", height: "auto", display: "block" }}
                >
                    {/* Ocean background */}
                    <rect x={0} y={0} width={800} height={480} fill="#0D1117" />

                    {/* ── Layer 1: World countries (Canada = amber glow, Mexico = grey) ── */}
                    <Geographies geography={WORLD_GEO}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const id = String(geo.id ?? geo.properties?.id ?? "");
                                if (id === CANADA_ID) {
                                    const hov = hoveredCode === "CA_COUNTRY";
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={hov ? "#C6923A" : "#2A2010"}
                                            stroke="#374151"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none", cursor: "pointer", transition: "fill 0.12s" },
                                                hover: { outline: "none", cursor: "pointer", fill: "#C6923A" },
                                                pressed: { outline: "none" },
                                            }}
                                            onMouseEnter={e => {
                                                const svgEl = (e.currentTarget as Element).closest("svg");
                                                if (svgEl) {
                                                    const r = svgEl.getBoundingClientRect();
                                                    setTooltipPos({ x: e.clientX - r.left, y: e.clientY - r.top });
                                                }
                                                setHoveredCode("CA_COUNTRY");
                                            }}
                                            onMouseMove={e => {
                                                const svgEl = (e.currentTarget as Element).closest("svg");
                                                if (svgEl) {
                                                    const r = svgEl.getBoundingClientRect();
                                                    setTooltipPos({ x: e.clientX - r.left, y: e.clientY - r.top });
                                                }
                                            }}
                                            onMouseLeave={() => setHoveredCode(null)}
                                            onClick={() => onStateClick?.("CA")}
                                        />
                                    );
                                }
                                if (id === MEXICO_ID) {
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="#161B22"
                                            stroke="#374151"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { outline: "none" },
                                                pressed: { outline: "none" },
                                            }}
                                        />
                                    );
                                }
                                // All other countries — very dark
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#10151C"
                                        stroke="#1E2530"
                                        strokeWidth={0.3}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* ── Layer 2: US States (us-atlas FIPS → abbreviation) ── */}
                    <Geographies geography={US_GEO}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const fips = geo.id?.toString().padStart(2, "0") ?? "";
                                const code = FIPS[fips];
                                if (!code) return null;

                                const heat = getHeat(code);
                                const hov = hoveredCode === code;
                                const fill = stateFill(heat, hov);

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={fill}
                                        stroke="#374151"
                                        strokeWidth={hov ? 1.5 : 0.6}
                                        style={{
                                            default: { outline: "none", cursor: "pointer", transition: "fill 0.12s" },
                                            hover: { outline: "none", cursor: "pointer", fill: "#C6923A" },
                                            pressed: { outline: "none" },
                                        }}
                                        onMouseEnter={e => handleMove(e, code)}
                                        onMouseMove={e => handleMove(e, code)}
                                        onMouseLeave={() => setHoveredCode(null)}
                                        onClick={() => {
                                            onStateClick?.(code);
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* ── Corridor overlays ── */}
                    {showCorridors && (<>
                        {/* I-10  Santa Monica CA → Jacksonville FL */}
                        <Line from={[-118.2, 34.1]} to={[-81.7, 30.3]}
                            stroke="rgba(198,146,58,0.7)" strokeWidth={2} strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 0 5px rgba(198,146,58,0.5))" }}
                        />
                        {/* I-35  Laredo TX → Duluth MN */}
                        <Line from={[-99.5, 27.5]} to={[-92.1, 46.8]}
                            stroke="rgba(198,146,58,0.7)" strokeWidth={2} strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 0 5px rgba(198,146,58,0.5))" }}
                        />
                        {/* I-40  Barstow CA → Wilmington NC */}
                        <Line from={[-117.0, 34.9]} to={[-77.9, 34.2]}
                            stroke="rgba(198,146,58,0.55)" strokeWidth={1.5} strokeLinecap="round"
                        />
                        {/* I-75  Miami FL → Sault Ste Marie MI */}
                        <Line from={[-80.2, 25.8]} to={[-84.3, 46.5]}
                            stroke="rgba(198,146,58,0.45)" strokeWidth={1.5} strokeLinecap="round"
                            strokeDasharray="5,3"
                        />
                        {/* I-95  Miami FL → Houlton ME */}
                        <Line from={[-80.2, 25.8]} to={[-67.8, 46.1]}
                            stroke="rgba(198,146,58,0.45)" strokeWidth={1.5} strokeLinecap="round"
                            strokeDasharray="5,3"
                        />
                        {/* Trans-Canada */}
                        <Line from={[-123.1, 49.3]} to={[-52.7, 47.5]}
                            stroke="rgba(198,146,58,0.25)" strokeWidth={1.5} strokeLinecap="round"
                            strokeDasharray="7,5"
                        />
                        {/* Labels */}
                        <Annotation subject={[-101.5, 31]} dx={0} dy={0} connectorProps={{}}>
                            <text fontSize={7} fontWeight={800} fill="rgba(198,146,58,0.7)"
                                fontFamily="system-ui,sans-serif" style={{ userSelect: "none" }}>I-35</text>
                        </Annotation>
                        <Annotation subject={[-90.5, 36.5]} dx={0} dy={0} connectorProps={{}}>
                            <text fontSize={7} fontWeight={800} fill="rgba(198,146,58,0.7)"
                                fontFamily="system-ui,sans-serif" style={{ userSelect: "none" }}>I-40</text>
                        </Annotation>
                        <Annotation subject={[-100, 33]} dx={0} dy={14} connectorProps={{}}>
                            <text fontSize={7} fontWeight={800} fill="rgba(198,146,58,0.7)"
                                fontFamily="system-ui,sans-serif" style={{ userSelect: "none" }}>I-10</text>
                        </Annotation>
                    </>)}
                </ComposableMap>

                {/* Canada label overlay */}
                <div className="absolute top-4 right-4 pointer-events-none">
                    <span className="text-[8px] font-black text-amber-500/40 uppercase tracking-[0.2em]">
                        🍁 Canada
                    </span>
                </div>

                {/* Tooltip */}
                <AnimatePresence>
                    {hoveredCode && hoveredCode !== "CA_COUNTRY" && (
                        <MapTooltip
                            code={hoveredCode}
                            name={STATE_NAMES[hoveredCode] ?? hoveredCode}
                            data={dataMap.get(hoveredCode)}
                            x={tooltipPos.x}
                            y={tooltipPos.y}
                        />
                    )}
                    {hoveredCode === "CA_COUNTRY" && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="absolute z-50 pointer-events-none bg-[#1A1F28] border border-[#374151] rounded-xl shadow-xl px-4 py-3"
                            style={{ left: Math.min(tooltipPos.x + 14, 580), top: Math.max(tooltipPos.y - 70, 8) }}
                        >
                            <div className="text-sm font-black text-white mb-1">🍁 Canada</div>
                            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                Browse Canadian Pilots →
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile grid — US states */}
            <div className="sm:hidden">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Browse by State</p>
                <div className="grid grid-cols-5 gap-1">
                    {Object.entries(STATE_NAMES).map(([code, _name]) => {
                        const heat = getHeat(code);
                        return (
                            <Link
                                key={code}
                                href={`/directory/us/${code.toLowerCase()}`}
                                className={cn(
                                    "flex items-center justify-center h-9 rounded-lg border text-[9px] font-black uppercase transition-all",
                                    heat === "hot" && "bg-amber-500/15 border-amber-500/40 text-amber-400",
                                    heat === "moderate" && "bg-amber-500/6  border-amber-500/15 text-amber-300",
                                    heat === "low" && "bg-[#1E2530] border-[#2D3748] text-gray-500",
                                )}
                            >
                                {code}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export { CorridorMap as USCanadaHubMap };
export default CorridorMap;
