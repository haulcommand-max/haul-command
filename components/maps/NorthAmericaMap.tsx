"use client";

/**
 * NorthAmericaMap — clickable SVG map of US states + Canadian provinces.
 *
 * react-simple-maps@3 | us-atlas@3 | world-atlas@2
 *
 * Projection tuned to show full North America (continental US + Canada)
 * on first paint — no manual zoom required. Mobile-responsive height.
 */

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ComposableMap,
    Geographies,
    Geography,
    Line,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

// ── TopoJSON sources ──────────────────────────────────────────────────────────
const WORLD_GEO = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const US_GEO = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// ── FIPS → US state code ──────────────────────────────────────────────────────
const FIPS: Record<string, string> = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
    "10": "DE", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
    "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA",
    "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV",
    "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN",
    "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY",
};

const US_NAMES: Record<string, string> = {
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

const CA_PROVINCES = [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland & Labrador" },
    { code: "NS", name: "Nova Scotia" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NU", name: "Nunavut" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "YT", name: "Yukon" },
];

// ── Demand heat ───────────────────────────────────────────────────────────────
const HOT = new Set(["TX", "LA", "FL", "CA", "GA", "TN", "AL", "AZ", "NC", "OK", "OR", "WA"]);
const MOD = new Set(["AR", "MS", "SC", "CO", "VA", "OH", "IL", "IN", "MT", "ID", "NV", "NM", "KS", "ON", "BC", "AB"]);
type Heat = "hot" | "moderate" | "low";
function getHeat(code: string): Heat {
    return HOT.has(code) ? "hot" : MOD.has(code) ? "moderate" : "low";
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    hot: "#7A5010",
    moderate: "#252318",
    low: "#161C28",
    hover: "#C4882A",
    selected: "#F1A91B",
    border: "#2A3040",
    canada: "#1A2820",
    caHover: "#243830",
    caBorder: "#304838",
    world: "#0E1218",
    ocean: "#080C14",
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
interface TT { code: string; name: string; country: "us" | "ca"; heat?: Heat; x: number; y: number; }

function Tooltip({ tt }: { tt: TT }) {
    const heatColor = tt.heat === "hot" ? "#F1A91B" : tt.heat === "moderate" ? "#D4A845" : "#4b5563";
    const heatLabel = tt.heat === "hot" ? "🔥 High Demand" : tt.heat === "moderate" ? "⚡ Building" : "· Light";
    return (
        <motion.div
            key={tt.code}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.08 }}
            className="absolute z-50 pointer-events-none"
            style={{ left: Math.min(tt.x + 12, 720), top: Math.max(tt.y - 80, 4) }}
        >
            <div style={{
                background: "rgba(10,12,22,0.97)",
                border: "1px solid rgba(241,169,27,0.22)",
                backdropFilter: "blur(14px)",
                borderRadius: 14,
                padding: "10px 14px",
                minWidth: 148,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[13px] font-black text-white leading-tight">{tt.name}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                        {tt.code}
                    </span>
                </div>
                {tt.heat && (
                    <div className="text-[10px] font-semibold mb-2" style={{ color: heatColor }}>{heatLabel}</div>
                )}
                <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#F1A91B" }}>
                    Browse Directory →
                </div>
            </div>
        </motion.div>
    );
}

// ── useResponsiveProjection — reusable hook, prevents this class of bug ───────
/**
 * Returns a memoized projectionConfig that fits all of North America
 * into the ComposableMap viewport on first paint.
 *
 * Strategy: fixed scale tuned empirically for the 900×540 SVG viewport;
 * CSS scales the SVG down on smaller screens so it always fits.
 *
 * North America bounding box: lon [-140, -52], lat [24, 84]
 * Mercator center target: ~[-96, 60] to balance Canada (large) and US
 *
 * scale=155 at 900×540 frames the full continent with ~5% margin.
 */
function useResponsiveProjection() {
    return useMemo(() => ({
        // scale=138 frames full North America (24°N–84°N, 140°W–52°W)
        // in the 900×540 SVG viewport with ~5% margin on all sides.
        scale: 138,
        // Center at 54°N balances Canada (large) + US (south edge) on Mercator.
        // Mercator distorts northern latitudes heavily — 54°N not 60°N needed.
        center: [-96, 54] as [number, number],
    }), []);
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface NorthAmericaMapProps {
    className?: string;
    onRegionClick?: (country: "us" | "ca", code: string, name: string) => void;
}

export function NorthAmericaMap({ className = "", onRegionClick }: NorthAmericaMapProps) {
    const router = useRouter();
    const [hovered, setHovered] = useState<TT | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const projConfig = useResponsiveProjection();

    function getPos(e: React.MouseEvent<Element>) {
        const svg = (e.currentTarget as Element).closest("svg");
        if (!svg) return { x: 0, y: 0 };
        const r = svg.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    const handleClick = useCallback((country: "us" | "ca", code: string, name: string) => {
        setSelected(code);
        if (onRegionClick) {
            onRegionClick(country, code, name);
        } else {
            router.push(`/directory/${country}/${code.toLowerCase()}`);
        }
    }, [onRegionClick, router]);

    return (
        <div
            className={`relative select-none ${className}`}
            role="region"
            aria-label="Interactive North America map — click a state or province to browse the directory"
        >
            {/* ── Legend ──────────────────────────────────────────────────── */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-3 px-1">
                <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Corridor Demand
                </span>
                {([
                    { color: C.hot, label: "High" },
                    { color: C.moderate, label: "Building" },
                    { color: C.low, label: "Light" },
                ] as const).map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color, border: "1px solid rgba(255,255,255,0.08)" }} />
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                    </div>
                ))}
                <a href="/map" className="ml-auto text-[9px] font-black uppercase tracking-widest hidden sm:block"
                    style={{ color: "rgba(241,169,27,0.5)" }}>
                    Full Map →
                </a>
            </div>

            {/* ── SVG Map container (responsive height) ───────────────────── */}
            {/*
                ComposableMap is a fixed SVG viewport (900×540).
                CSS scales it to 100% width; height follows aspect ratio.
                Mobile: the SVG naturally shrinks — continent stays fully visible.
            */}
            <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{ border: "1px solid rgba(255,255,255,0.06)", background: C.ocean }}
            >
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={projConfig}
                    width={900}
                    height={540}
                    style={{ width: "100%", height: "auto", display: "block" }}
                >
                    {/* Ocean background */}
                    <rect x={0} y={0} width={900} height={540} fill={C.ocean} />

                    {/* ── World backdrop (Canada, Mexico, others) ─────────── */}
                    <Geographies geography={WORLD_GEO}>
                        {({ geographies }) => geographies.map(geo => {
                            const id = String(geo.id ?? "");
                            if (id === "840") return null; // US drawn in next layer
                            const isCA = id === "124";
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={isCA ? C.canada : id === "484" ? "#12160E" : C.world}
                                    stroke={isCA ? C.caBorder : "rgba(255,255,255,0.03)"}
                                    strokeWidth={0.4}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            );
                        })}
                    </Geographies>

                    {/* ── US States ──────────────────────────────────────── */}
                    <Geographies geography={US_GEO}>
                        {({ geographies }) => geographies.map(geo => {
                            const fips = (geo.id?.toString() ?? "").padStart(2, "0");
                            const code = FIPS[fips];
                            if (!code) return null;
                            const heat = getHeat(code);
                            const isHov = hovered?.code === code && hovered?.country === "us";
                            const isSel = selected === code;
                            const fill = isSel ? C.selected : isHov ? C.hover
                                : heat === "hot" ? C.hot : heat === "moderate" ? C.moderate : C.low;
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${US_NAMES[code] ?? code}`}
                                    fill={fill}
                                    stroke={C.border}
                                    strokeWidth={isHov || isSel ? 1 : 0.4}
                                    style={{
                                        default: { outline: "none", cursor: "pointer", transition: "fill 0.12s" },
                                        hover: { outline: "none", cursor: "pointer" },
                                        pressed: { outline: "none" },
                                    }}
                                    onMouseEnter={e => setHovered({ code, name: US_NAMES[code] ?? code, country: "us", heat, ...getPos(e as any) })}
                                    onMouseMove={e => setHovered(h => h ? { ...h, ...getPos(e as any) } : null)}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={() => handleClick("us", code, US_NAMES[code] ?? code)}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick("us", code, US_NAMES[code] ?? code); } }}
                                />
                            );
                        })}
                    </Geographies>

                    {/* ── Corridor overlays ──────────────────────────────── */}
                    {/* I-10: Jacksonville → LA → El Paso → Los Angeles */}
                    <Line from={[-81.7, 30.3]} to={[-118.2, 34.0]}
                        stroke="rgba(241,169,27,0.45)" strokeWidth={1.4} strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 3px rgba(241,169,27,0.3))", pointerEvents: "none" }}
                    />
                    {/* I-35: Laredo → Kansas City */}
                    <Line from={[-99.5, 27.5]} to={[-94.6, 39.1]}
                        stroke="rgba(241,169,27,0.4)" strokeWidth={1.2} strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 3px rgba(241,169,27,0.25))", pointerEvents: "none" }}
                    />
                    {/* I-95: Miami → Boston */}
                    <Line from={[-80.2, 25.8]} to={[-71.1, 42.4]}
                        stroke="rgba(241,169,27,0.28)" strokeWidth={1} strokeLinecap="round"
                        strokeDasharray="3,3" style={{ pointerEvents: "none" }}
                    />
                    {/* Trans-Canada Highway */}
                    <Line from={[-123.1, 49.3]} to={[-52.7, 47.6]}
                        stroke="rgba(241,169,27,0.18)" strokeWidth={0.9} strokeLinecap="round"
                        strokeDasharray="5,4" style={{ pointerEvents: "none" }}
                    />
                </ComposableMap>

                {/* Hover tooltip */}
                <AnimatePresence>
                    {hovered && <Tooltip tt={hovered} />}
                </AnimatePresence>

                {/* Bottom-left hint */}
                <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
                    <span style={{
                        background: "rgba(8,10,18,0.82)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.25)",
                        borderRadius: 8,
                        padding: "3px 8px",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        backdropFilter: "blur(8px)",
                    }}>
                        Click any state → directory
                    </span>
                </div>
            </div>

            {/* ── Canadian Provinces grid ─────────────────────────────────── */}
            <div className="mt-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2"
                    style={{ color: "rgba(255,255,255,0.18)" }}>
                    🇨🇦 Canadian Provinces
                </p>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))" }}>
                    {CA_PROVINCES.map(({ code, name }) => (
                        <button
                            key={code}
                            onClick={() => handleClick("ca", code, name)}
                            title={name}
                            aria-label={`${name} — browse Canadian directory`}
                            className="flex items-center justify-center h-9 rounded-xl text-[10px] font-black uppercase transition-all duration-150 hover:scale-105 focus-visible:outline-none"
                            style={{
                                background: selected === code ? "#F1A91B" : "rgba(255,255,255,0.04)",
                                border: selected === code ? "1px solid #F1A91B" : "1px solid rgba(255,255,255,0.08)",
                                color: selected === code ? "#000" : "rgba(255,255,255,0.45)",
                            }}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Mobile US state grid (sm and below — SVG still usable but grids help) */}
            <details className="mt-3 sm:hidden">
                <summary className="text-[9px] font-black uppercase tracking-[0.18em] cursor-pointer"
                    style={{ color: "rgba(255,255,255,0.18)" }}>
                    🇺🇸 US States quick-access
                </summary>
                <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))" }}>
                    {Object.entries(US_NAMES).map(([code, name]) => {
                        const heat = getHeat(code);
                        return (
                            <button key={code}
                                onClick={() => handleClick("us", code, name)}
                                title={name}
                                aria-label={name}
                                className="flex items-center justify-center h-8 rounded-lg text-[9px] font-black uppercase transition-all"
                                style={{
                                    background: selected === code ? "#F1A91B"
                                        : heat === "hot" ? "rgba(241,169,27,0.1)" : "rgba(255,255,255,0.03)",
                                    border: selected === code ? "1px solid #F1A91B"
                                        : heat === "hot" ? "1px solid rgba(241,169,27,0.25)" : "1px solid rgba(255,255,255,0.06)",
                                    color: selected === code ? "#000"
                                        : heat === "hot" ? "#F1A91B" : "rgba(255,255,255,0.38)",
                                }}
                            >
                                {code}
                            </button>
                        );
                    })}
                </div>
            </details>
        </div>
    );
}

export default NorthAmericaMap;
