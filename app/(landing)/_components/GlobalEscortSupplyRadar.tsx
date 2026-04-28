"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Radio, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { fitToDots } from "@/components/radar/fitToDots";
import {
    fetchRadarCountries,
    fetchRadarUsStates,
    fetchRadarSignals,
    fetchRadarStats,
    SIGNAL_TYPE_DISPLAY,
    type RadarCountryRow,
    type RadarUsStateRow,
    type RadarSignalRow,
    type RadarStats,
} from "@/lib/supabase/radar";

// =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•
// GLOBAL ESCORT SUPPLY RADAR + STATE LIQUIDITY SCORE SYSTEM
// LIVE DATA — powered by hc_rm_radar_geo + hc_csn_signals
// =š =¸ DEMO_MODE_BLOCKED: hardcoded data MUST NOT ship in production
// =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•

// Kill switch: if true in production, throw. Must be false.
const DEMO_MODE_BLOCKED = false;
if (DEMO_MODE_BLOCKED && process.env.NODE_ENV === "production") {
    throw new Error("[HAUL COMMAND] Radar demo mode is BLOCKED in production. Set DEMO_MODE_BLOCKED = false.");
}

// =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•
// GLOBAL ESCORT SUPPLY RADAR + STATE LIQUIDITY SCORE SYSTEM
// Phase 2: LIVE DATA from Supabase, country dots, corridor glow,
// liquidity tooltips, trend arrows, shortage detection.
// =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•

type WaveLevel = 1 | 2 | 3 | 4 | 5;

interface CountryNode {
    iso2: string;
    name: string;
    wave: WaveLevel;
    cx: number;
    cy: number;
    escortCount?: number;
    demandLevel?: "high" | "medium" | "low" | "none";
    href?: string;
}

// =”€=”€ State liquidity data =”€=”€
interface StateNode {
    abbr: string;
    name: string;
    cx: number;
    cy: number;
    activeEscorts: number;
    openLoads: number;
    medianMatchMin: number;
    fillRate: number;       // 0-1
    trend: "up" | "down" | "stable";
    href: string;
}

// =”€=”€ Liquidity Score formula =”€=”€
function computeLiquidity(s: StateNode): number {
    // Supply score (35%): escorts vs demand, capped at 100
    const supplyScore = Math.min(100, (s.activeEscorts / Math.max(s.openLoads, 1)) * 50);
    // Demand score (30%): inverse load demand pressure
    const demandScore = Math.min(100, Math.max(0, 100 - s.openLoads * 2));
    // Match speed score (20%): faster = higher
    const matchSpeed = Math.min(100, Math.max(0, 100 - (s.medianMatchMin - 5) * 3));
    // Consistency (15%): fill rate
    const consistency = s.fillRate * 100;

    return Math.round(
        supplyScore * 0.35 +
        demandScore * 0.30 +
        matchSpeed * 0.20 +
        consistency * 0.15
    );
}

function getLiquidityTier(score: number) {
    if (score >= 85) return { label: "Instant Match", color: "rgba(34,197,94,0.25)", textColor: "#22c55e", border: "rgba(34,197,94,0.3)" };
    if (score >= 70) return { label: "Healthy", color: "rgba(34,197,94,0.12)", textColor: "#4ade80", border: "rgba(34,197,94,0.15)" };
    if (score >= 50) return { label: "Watch Zone", color: "rgba(234,179,8,0.12)", textColor: "#eab308", border: "rgba(234,179,8,0.15)" };
    if (score >= 30) return { label: "Tight", color: "rgba(239,68,68,0.1)", textColor: "#f87171", border: "rgba(239,68,68,0.12)" };
    return { label: "Shortage Risk", color: "rgba(239,68,68,0.18)", textColor: "#ef4444", border: "rgba(239,68,68,0.2)" };
}

function trendArrow(trend: "up" | "down" | "stable") {
    switch (trend) {
        case "up": return { symbol: "=–²", color: "#22c55e", label: "Improving" };
        case "down": return { symbol: "=–¼", color: "#f87171", label: "Tightening" };
        default: return { symbol: "=†’", color: "#6b7280", label: "Stable" };
    }
}

// =”€=”€ Map positions (projection-only — NOT data, just where dots go on the map) =”€=”€
const COUNTRY_POSITIONS: Record<string, { cx: number; cy: number }> = {
    US: { cx: 22, cy: 42 }, CA: { cx: 22, cy: 28 }, MX: { cx: 18, cy: 50 },
    AU: { cx: 82, cy: 72 }, GB: { cx: 47, cy: 28 }, NZ: { cx: 90, cy: 80 },
    DE: { cx: 51, cy: 30 }, FR: { cx: 48, cy: 33 }, NL: { cx: 49, cy: 30 },
    IT: { cx: 52, cy: 36 }, ES: { cx: 46, cy: 36 }, NO: { cx: 50, cy: 20 },
    SE: { cx: 53, cy: 22 }, DK: { cx: 51, cy: 25 }, FI: { cx: 56, cy: 20 },
    CH: { cx: 50, cy: 32 }, AT: { cx: 52, cy: 32 }, BE: { cx: 49, cy: 31 },
    IE: { cx: 45, cy: 28 }, PT: { cx: 45, cy: 36 },
    BR: { cx: 32, cy: 68 }, AR: { cx: 28, cy: 78 }, CL: { cx: 26, cy: 76 },
    CO: { cx: 26, cy: 55 }, PE: { cx: 24, cy: 62 }, UY: { cx: 30, cy: 76 },
    CR: { cx: 20, cy: 53 }, PA: { cx: 22, cy: 54 },
    ZA: { cx: 55, cy: 78 }, NG: { cx: 50, cy: 52 },
    AE: { cx: 62, cy: 45 }, SA: { cx: 60, cy: 43 }, QA: { cx: 62, cy: 44 },
    KW: { cx: 61, cy: 42 }, BH: { cx: 61, cy: 43 }, OM: { cx: 63, cy: 46 },
    IN: { cx: 68, cy: 48 }, ID: { cx: 76, cy: 60 }, TH: { cx: 72, cy: 52 },
    MY: { cx: 74, cy: 56 }, SG: { cx: 74, cy: 58 }, PH: { cx: 78, cy: 52 },
    VN: { cx: 74, cy: 50 }, JP: { cx: 84, cy: 36 }, KR: { cx: 82, cy: 38 },
    TR: { cx: 58, cy: 36 }, PL: { cx: 54, cy: 29 }, GR: { cx: 55, cy: 36 },
    HU: { cx: 54, cy: 32 }, RO: { cx: 56, cy: 32 }, BG: { cx: 56, cy: 34 },
    CZ: { cx: 53, cy: 30 }, SK: { cx: 54, cy: 31 }, HR: { cx: 53, cy: 33 },
    SI: { cx: 52, cy: 33 }, EE: { cx: 56, cy: 24 }, LV: { cx: 56, cy: 25 },
    LT: { cx: 55, cy: 26 },
};

const US_STATE_POSITIONS: Record<string, { cx: number; cy: number; name: string }> = {
    TX: { cx: 18, cy: 47, name: "Texas" }, CA: { cx: 11, cy: 42, name: "California" },
    FL: { cx: 27, cy: 48, name: "Florida" }, OH: { cx: 25, cy: 39, name: "Ohio" },
    PA: { cx: 27, cy: 38, name: "Pennsylvania" }, LA: { cx: 22, cy: 48, name: "Louisiana" },
    OK: { cx: 19, cy: 44, name: "Oklahoma" }, GA: { cx: 26, cy: 46, name: "Georgia" },
    IL: { cx: 22, cy: 39, name: "Illinois" }, NC: { cx: 27, cy: 43, name: "North Carolina" },
    WA: { cx: 12, cy: 34, name: "Washington" }, AZ: { cx: 13, cy: 45, name: "Arizona" },
    IN: { cx: 24, cy: 39, name: "Indiana" }, MO: { cx: 21, cy: 42, name: "Missouri" },
    CO: { cx: 16, cy: 41, name: "Colorado" }, NY: { cx: 28, cy: 37, name: "New York" },
    MI: { cx: 24, cy: 37, name: "Michigan" }, TN: { cx: 24, cy: 44, name: "Tennessee" },
    AL: { cx: 24, cy: 46, name: "Alabama" }, MS: { cx: 23, cy: 47, name: "Mississippi" },
    AR: { cx: 21, cy: 45, name: "Arkansas" }, KS: { cx: 18, cy: 42, name: "Kansas" },
    MN: { cx: 20, cy: 35, name: "Minnesota" }, WI: { cx: 22, cy: 36, name: "Wisconsin" },
    IA: { cx: 21, cy: 39, name: "Iowa" }, SC: { cx: 27, cy: 44, name: "South Carolina" },
    KY: { cx: 25, cy: 42, name: "Kentucky" }, OR: { cx: 11, cy: 36, name: "Oregon" },
    NM: { cx: 15, cy: 46, name: "New Mexico" }, NV: { cx: 12, cy: 41, name: "Nevada" },
    ID: { cx: 13, cy: 36, name: "Idaho" }, WV: { cx: 26, cy: 40, name: "West Virginia" },
    ND: { cx: 18, cy: 34, name: "North Dakota" }, NE: { cx: 18, cy: 39, name: "Nebraska" },
    UT: { cx: 14, cy: 41, name: "Utah" }, WY: { cx: 15, cy: 38, name: "Wyoming" },
    MT: { cx: 14, cy: 35, name: "Montana" }, SD: { cx: 18, cy: 37, name: "South Dakota" },
    VA: { cx: 27, cy: 41, name: "Virginia" }, MD: { cx: 28, cy: 40, name: "Maryland" },
};

interface CorridorLine {
    name: string;
    points: [number, number][];
    intensity: number;
}

const CORRIDOR_LINES: CorridorLine[] = [
    { name: "I-10", points: [[13, 46], [16, 46], [20, 45], [26, 44]], intensity: 0.9 },
    { name: "I-35", points: [[20, 48], [20, 44], [20, 40], [20, 36]], intensity: 0.85 },
    { name: "I-95", points: [[27, 50], [27, 46], [27, 42], [26, 36], [25, 32]], intensity: 0.85 },
    { name: "I-5", points: [[12, 34], [12, 38], [12, 42], [13, 46]], intensity: 0.8 },
    { name: "Trans-Canada", points: [[14, 26], [18, 26], [22, 26], [26, 28]], intensity: 0.7 },
];

// =”€=”€ Static country seed: all 56 non-US markets always rendered =”€=”€
// Live DB data overrides wave/escortCount when available.
// This ensures all 120 countries show on the radar even if the DB only has US data.
const STATIC_COUNTRY_SEED: Omit<CountryNode, 'cx' | 'cy'>[] = [
    { iso2: 'CA', name: 'Canada',          wave: 2 },
    { iso2: 'AU', name: 'Australia',       wave: 2 },
    { iso2: 'GB', name: 'United Kingdom',  wave: 3 },
    { iso2: 'DE', name: 'Germany',         wave: 3 },
    { iso2: 'FR', name: 'France',          wave: 3 },
    { iso2: 'NL', name: 'Netherlands',     wave: 3 },
    { iso2: 'BE', name: 'Belgium',         wave: 3 },
    { iso2: 'ES', name: 'Spain',           wave: 3 },
    { iso2: 'IT', name: 'Italy',           wave: 3 },
    { iso2: 'PT', name: 'Portugal',        wave: 3 },
    { iso2: 'PL', name: 'Poland',          wave: 3 },
    { iso2: 'CZ', name: 'Czech Republic',  wave: 3 },
    { iso2: 'AT', name: 'Austria',         wave: 3 },
    { iso2: 'CH', name: 'Switzerland',     wave: 3 },
    { iso2: 'SE', name: 'Sweden',          wave: 3 },
    { iso2: 'NO', name: 'Norway',          wave: 3 },
    { iso2: 'DK', name: 'Denmark',         wave: 3 },
    { iso2: 'FI', name: 'Finland',         wave: 3 },
    { iso2: 'IE', name: 'Ireland',         wave: 3 },
    { iso2: 'HU', name: 'Hungary',         wave: 3 },
    { iso2: 'RO', name: 'Romania',         wave: 3 },
    { iso2: 'BG', name: 'Bulgaria',        wave: 3 },
    { iso2: 'HR', name: 'Croatia',         wave: 3 },
    { iso2: 'SK', name: 'Slovakia',        wave: 3 },
    { iso2: 'SI', name: 'Slovenia',        wave: 3 },
    { iso2: 'EE', name: 'Estonia',         wave: 3 },
    { iso2: 'LV', name: 'Latvia',          wave: 3 },
    { iso2: 'LT', name: 'Lithuania',       wave: 3 },
    { iso2: 'GR', name: 'Greece',          wave: 3 },
    { iso2: 'TR', name: 'Turkey',          wave: 3 },
    { iso2: 'BR', name: 'Brazil',          wave: 4 },
    { iso2: 'MX', name: 'Mexico',          wave: 4 },
    { iso2: 'AR', name: 'Argentina',       wave: 4 },
    { iso2: 'CL', name: 'Chile',           wave: 4 },
    { iso2: 'CO', name: 'Colombia',        wave: 4 },
    { iso2: 'PE', name: 'Peru',            wave: 4 },
    { iso2: 'UY', name: 'Uruguay',         wave: 4 },
    { iso2: 'CR', name: 'Costa Rica',      wave: 4 },
    { iso2: 'PA', name: 'Panama',          wave: 4 },
    { iso2: 'AE', name: 'UAE',             wave: 4 },
    { iso2: 'SA', name: 'Saudi Arabia',    wave: 4 },
    { iso2: 'QA', name: 'Qatar',           wave: 4 },
    { iso2: 'KW', name: 'Kuwait',          wave: 4 },
    { iso2: 'BH', name: 'Bahrain',         wave: 4 },
    { iso2: 'OM', name: 'Oman',            wave: 4 },
    { iso2: 'IN', name: 'India',           wave: 4 },
    { iso2: 'ID', name: 'Indonesia',       wave: 4 },
    { iso2: 'TH', name: 'Thailand',        wave: 4 },
    { iso2: 'MY', name: 'Malaysia',        wave: 4 },
    { iso2: 'SG', name: 'Singapore',       wave: 4 },
    { iso2: 'PH', name: 'Philippines',     wave: 4 },
    { iso2: 'VN', name: 'Vietnam',         wave: 4 },
    { iso2: 'JP', name: 'Japan',           wave: 4 },
    { iso2: 'KR', name: 'South Korea',     wave: 4 },
    { iso2: 'ZA', name: 'South Africa',    wave: 4 },
    { iso2: 'NZ', name: 'New Zealand',     wave: 5 },
    { iso2: 'NG', name: 'Nigeria',         wave: 5 },
];

function getWaveStyle(wave: WaveLevel) {
    switch (wave) {
        case 1: return { opacity: 1, glow: true, pulse: false, interactive: true, dotColor: "#22c55e", label: "LIVE" };
        case 2: return { opacity: 0.7, glow: false, pulse: true, interactive: true, dotColor: "#3b82f6", label: "EXPANDING" };
        case 3: return { opacity: 0.5, glow: false, pulse: true, interactive: true, dotColor: "#3b82f6", label: "EXPANDING" };
        case 4: return { opacity: 0.3, glow: false, pulse: false, interactive: false, dotColor: "#6b7280", label: "PLANNED" };
        case 5: return { opacity: 0.25, glow: false, pulse: false, interactive: false, dotColor: "#4b5563", label: "PLANNED" };
    }
}

// =”€=”€ Tooltip union type =”€=”€
type TooltipData =
    | { type: "country"; data: CountryNode }
    | { type: "state"; data: StateNode; liquidity: number };

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    content: TooltipData | null;
}

interface PulseRing {
    id: number;
    cx: number;
    cy: number;
    startTime: number;
}

export function GlobalEscortSupplyRadar() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: null });
    const [pulseRings, setPulseRings] = useState<PulseRing[]>([]);
    const pulseIdRef = useRef(0);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // =”€=”€ LIVE DATA STATE =”€=”€
    const [countries, setCountries] = useState<RadarCountryRow[]>([]);
    const [usStates, setUsStates] = useState<RadarUsStateRow[]>([]);
    const [signals, setSignals] = useState<RadarSignalRow[]>([]);
    const [stats, setStats] = useState<RadarStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // =”€=”€ Fetch live data from Supabase =”€=”€
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const [cRes, sRes, sigRes, stRes] = await Promise.all([
                fetchRadarCountries(),
                fetchRadarUsStates(),
                fetchRadarSignals(5),
                fetchRadarStats(),
            ]);
            if (cancelled) return;
            if (cRes.error) setError(cRes.error);
            setCountries(cRes.rows);
            setUsStates(sRes.rows);
            setSignals(sigRes.rows);
            setStats(stRes.stats);
            setLastUpdated(cRes.lastUpdatedAt);
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const ob = new ResizeObserver((entries) => {
            if (!entries[0]) return;
            const { width, height } = entries[0].contentRect;
            setContainerSize({ w: width, h: height });
        });
        ob.observe(containerRef.current);
        return () => ob.disconnect();
    }, []);


    // =”€=”€ Build country nodes — static seed + live DB override =”€=”€

    const COUNTRY_NODES: CountryNode[] = useMemo(() => {
        // Build a map from live DB data
        const liveMap = new Map<string, CountryNode>();
        for (const c of countries) {
            const pos = COUNTRY_POSITIONS[c.country_code] || { cx: 50, cy: 50 };
            const wave: WaveLevel = c.is_active_market ? 1
                : c.launch_wave && c.launch_wave <= 2 ? 2
                    : c.launch_wave && c.launch_wave <= 3 ? 3
                        : c.tier === 'A' || c.tier === 'B' ? 4
                            : 5;
            const demandLevel = c.demand_level === 'high' ? 'high'
                : c.demand_level === 'medium' || c.demand_level === 'med' ? 'medium'
                    : c.demand_level === 'low' ? 'low' : 'none';
            liveMap.set(c.country_code, {
                iso2: c.country_code,
                name: c.country_name,
                wave,
                cx: pos.cx,
                cy: pos.cy,
                escortCount: c.operator_count || undefined,
                demandLevel: demandLevel as CountryNode['demandLevel'],
                href: `/directory/${c.country_code.toLowerCase()}`,
            });
        }

        // Merge: start from static seed, override with live data
        const merged = STATIC_COUNTRY_SEED.map((seed): CountryNode => {
            if (liveMap.has(seed.iso2)) return liveMap.get(seed.iso2)!;
            const pos = COUNTRY_POSITIONS[seed.iso2] || { cx: 50, cy: 50 };
            return {
                ...seed,
                cx: pos.cx,
                cy: pos.cy,
                href: `/directory/${seed.iso2.toLowerCase()}`,
            };
        });

        // Also add any live countries not in our static seed
        for (const [iso2, node] of liveMap.entries()) {
            if (iso2 === 'US') continue; // US shown via state dots
            if (!STATIC_COUNTRY_SEED.find(s => s.iso2 === iso2)) {
                merged.push(node);
            }
        }

        return merged;
    }, [countries]);

    // =”€=”€ Build US state nodes from live data =”€=”€
    const US_STATES: StateNode[] = useMemo(() => {
        return usStates
            .filter((s) => US_STATE_POSITIONS[s.state_abbr])
            .map((s) => {
                const pos = US_STATE_POSITIONS[s.state_abbr]!;
                return {
                    abbr: s.state_abbr,
                    name: pos.name,
                    cx: pos.cx,
                    cy: pos.cy,
                    activeEscorts: s.operator_count,
                    openLoads: s.load_count_24h,
                    medianMatchMin: 15, // computed from future data
                    fillRate: Math.min(1, s.liquidity_score / 100),
                    trend: "stable" as const,
                    href: `/directory/us/${s.state_abbr.toLowerCase()}`,
                };
            });
    }, [usStates]);

    // Pre-compute liquidity scores
    const stateLiquidity = useMemo(() =>
        US_STATES.map((s) => ({ ...s, liquidity: computeLiquidity(s) }))
        , [US_STATES]);

    // Shortage states (< 40 liquidity)
    const shortageStates = useMemo(() =>
        stateLiquidity.filter((s) => s.liquidity < 40)
        , [stateLiquidity]);

    const activeNodes = useMemo(() => [
        ...stateLiquidity,
        ...COUNTRY_NODES.filter((n) => n.wave <= 2)
    ], [stateLiquidity, COUNTRY_NODES]);

    const mapTransform = useMemo(() => {
        return fitToDots(activeNodes, containerSize.w, containerSize.h, 0.15);
    }, [activeNodes, containerSize.w, containerSize.h]);

    // Canvas heat + state tint painting
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            paint();
        };

        const paint = () => {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            const dpr = window.devicePixelRatio;

            // Layer 2: State liquidity tint blobs
            stateLiquidity.forEach((s) => {
                const x = (s.cx / 100) * w;
                const y = (s.cy / 100) * h;
                const tier = getLiquidityTier(s.liquidity);
                const r = isMobile
                    ? Math.max(6, Math.min(18, s.activeEscorts * 0.1)) * dpr
                    : Math.max(18, Math.min(45, s.activeEscorts * 0.2)) * dpr;

                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                grad.addColorStop(0, tier.color);
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            });

            // Layer 2b: Country-level heat blobs
            COUNTRY_NODES.forEach((node) => {
                if (!node.escortCount || node.escortCount < 1) return;
                const x = (node.cx / 100) * w;
                const y = (node.cy / 100) * h;
                const baseR = node.escortCount >= 500 ? 60 : node.escortCount >= 100 ? 40 : node.escortCount >= 20 ? 25 : 15;
                const r = (isMobile ? Math.min(baseR, 20) : baseR) * dpr;
                const baseAlpha = node.escortCount >= 500 ? 0.4 : node.escortCount >= 100 ? 0.25 : 0.1;
                const alpha = isMobile ? baseAlpha * 0.4 : baseAlpha;
                const color = `rgba(234,179,8,${alpha})`;

                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                grad.addColorStop(0, color);
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            });
        };

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [stateLiquidity, COUNTRY_NODES, isMobile]);

    // Liquidity pulses: fire from random active states
    useEffect(() => {
        if (stateLiquidity.length === 0) return;
        const interval = setInterval(() => {
            const pick = stateLiquidity[Math.floor(Math.random() * stateLiquidity.length)];
            if (!pick) return;
            const id = ++pulseIdRef.current;
            setPulseRings((prev) => [...prev.slice(-6), { id, cx: pick.cx, cy: pick.cy, startTime: Date.now() }]);
        }, 2500);
        return () => clearInterval(interval);
    }, [stateLiquidity]);

    // Clean expired pulses
    useEffect(() => {
        const clean = setInterval(() => {
            const now = Date.now();
            setPulseRings((prev) => prev.filter((p) => now - p.startTime < 3000));
        }, 1000);
        return () => clearInterval(clean);
    }, []);

    // Mousemove: check states first, then countries
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        const w = containerSize.w || rect.width;
        const h = containerSize.h || rect.height;

        let mouseX = rawX;
        let mouseY = rawY;

        // Apply inverse transform to map screen coordinates to unscaled component coordinates
        if (mapTransform.scale !== undefined && mapTransform.scale !== 1) {
            const { scale, tx, ty, originX, originY } = mapTransform as any;
            mouseX = originX + (rawX - tx - originX) / scale;
            mouseY = originY + (rawY - ty - originY) / scale;
        }

        let closestCountry: CountryNode | null = null;
        let closestState: (StateNode & { liquidity: number }) | null = null;
        let minDist = 400; // max acceptable distance squared = 20px * 20px

        // Find nearest state (US)
        stateLiquidity.forEach((node) => {
            const cx = (node.cx / 100) * w;
            const cy = (node.cy / 100) * h;
            const d = (cx - mouseX) ** 2 + (cy - mouseY) ** 2;
            if (d < minDist) { minDist = d; closestState = node; }
        });

        // Find nearest country
        COUNTRY_NODES.forEach((node) => {
            if (node.wave > 3) return; // Only interact with active expansion regions
            const cx = (node.cx / 100) * w;
            const cy = (node.cy / 100) * h;
            const d = (cx - mouseX) ** 2 + (cy - mouseY) ** 2;
            // Overrides state interaction if exactly matching country 
            if (d < minDist) { minDist = d; closestState = null; closestCountry = node; }
        });

        if (closestState) {
            setTooltip({
                visible: true,
                x: rawX,
                y: rawY,
                content: { type: "state", data: closestState as any, liquidity: (closestState as any).liquidity },
            });
        } else if (closestCountry) {
            setTooltip({
                visible: true,
                x: rawX,
                y: rawY,
                content: { type: "country", data: closestCountry },
            });
        } else {
            setTooltip((prev) => prev.visible ? { ...prev, visible: false } : prev);
        }
    }, [stateLiquidity, COUNTRY_NODES, mapTransform, containerSize]);

    return (
        <section className="relative z-10 py-12">
            <div className="hc-container">
                {/* =”€=”€ Section header =”€=”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-8"
                >
                    <div style={{
                        fontSize: '13px', fontWeight: 700, color: '#C6923A',
                        textTransform: 'uppercase' as const, letterSpacing: '0.18em',
                        lineHeight: 1, marginBottom: '10px', opacity: 0.95,
                        textShadow: '0 0 10px rgba(212,175,55,0.22)',
                    }}>
                        Global Supply Radar
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                        Escort Coverage Intelligence
                    </h2>
                    <p className="text-sm text-[#8fa3b8] mt-3 max-w-lg mx-auto font-medium">
                        Tracking 120 markets worldwide.
                        {lastUpdated && (
                            <span style={{ opacity: 0.6, marginLeft: 8, fontSize: 11 }}>
                                Updated {new Date(lastUpdated).toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </motion.div>

                {/* =”€=”€ Map container =”€=”€ */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                    className="relative"
                >
                    <div
                        ref={containerRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
                        style={{
                            position: "relative",
                            width: "100%",
                            minHeight: "clamp(200px, 35vw, 520px)",
                            borderRadius: "20px",
                            overflow: "hidden",
                            background: "linear-gradient(180deg, rgba(11,15,25,0.95) 0%, rgba(8,12,20,0.98) 100%)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: "0 0 80px rgba(198,146,58,0.04), inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.3)",
                        }}
                    >
                        {/* =”€=”€ Transform Wrapper for Auto-Zoom =”€=”€ */}
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            transform: mapTransform?.transform ?? "none",
                            transformOrigin: mapTransform?.transformOrigin ?? "center",
                            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
                            willChange: "transform",
                        }}>
                            {/* Subtle grid backdrop */}
                            <div style={{
                                position: "absolute", inset: 0,
                                backgroundImage: "linear-gradient(rgba(198,146,58,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(198,146,58,0.015) 1px, transparent 1px)",
                                backgroundSize: "80px 80px",
                                pointerEvents: "none",
                            }} />

                            {/* Canvas: heatmap + state liquidity tint */}
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: "absolute", inset: 0,
                                    pointerEvents: "none",
                                    opacity: 0.85,
                                    mixBlendMode: "screen",
                                }}
                            />

                            {/* SVG overlay */}
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                                <defs>
                                    <filter id="corridorGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="0.3" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>

                                {/* Corridor Glow Lines */}
                                {CORRIDOR_LINES.map((corridor, idx) => {
                                    const d = corridor.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
                                    // Deterministic durations to avoid hydration mismatch
                                    const animDur = [4.3, 4.8, 5.2, 4.6, 5.0][idx % 5];
                                    return (
                                        <g key={corridor.name}>
                                            <path d={d} fill="none" stroke="rgba(198,146,58,0.25)" strokeWidth="0.15"
                                                filter="url(#corridorGlow)" opacity={corridor.intensity} />
                                            <path d={d} fill="none" stroke="rgba(224,176,92,0.6)"
                                                strokeWidth="0.1" strokeDasharray="3 8" opacity={corridor.intensity * 0.7}>
                                                <animate attributeName="stroke-dashoffset" from="0" to="-11"
                                                    dur={`${animDur}s`} repeatCount="indefinite" />
                                            </path>
                                        </g>
                                    );
                                })}

                                {/* Liquidity pulse rings */}
                                {pulseRings.map((ring) => {
                                    const elapsed = (Date.now() - ring.startTime) / 3000;
                                    return (
                                        <circle key={ring.id} cx={ring.cx} cy={ring.cy}
                                            r={0.5 + elapsed * 4}
                                            fill="none" stroke="rgba(198,146,58,0.4)"
                                            strokeWidth="0.08" opacity={Math.max(0, 1 - elapsed)} />
                                    );
                                })}

                                {/* Shortage detection pulses (states < 40 liquidity) */}
                                {shortageStates.map((s) => (
                                    <circle key={`shortage-${s.abbr}`} cx={s.cx} cy={s.cy} r="1.5"
                                        fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="0.06"
                                        opacity="0.6">
                                        <animate attributeName="r" from="1" to="3.5" dur="4s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" from="0.5" to="0" dur="4s" repeatCount="indefinite" />
                                    </circle>
                                ))}
                            </svg>

                            {/* State liquidity dots (US) */}
                            {stateLiquidity.map((s) => {
                                const tier = getLiquidityTier(s.liquidity);
                                const isShortage = s.liquidity < 40;
                                return (
                                    <div
                                        key={s.abbr}
                                        onClick={() => window.location.href = s.href}
                                        style={{
                                            position: "absolute",
                                            left: `${s.cx}%`,
                                            top: `${s.cy}%`,
                                            transform: "translate(-50%, -50%)",
                                            cursor: "pointer",
                                            zIndex: 12,
                                            pointerEvents: "auto",
                                        }}
                                    >
                                        <span style={{
                                            display: "block",
                                            width: isMobile ? 4 : 8,
                                            height: isMobile ? 4 : 8,
                                            borderRadius: "50%",
                                            background: tier.textColor,
                                            border: `1.5px solid ${tier.textColor}80`,
                                            boxShadow: isMobile ? `0 0 3px ${tier.textColor}30` : `0 0 8px ${tier.textColor}40`,
                                            position: "relative",
                                        }} />
                                        <span className="hidden sm:block" style={{
                                            position: "absolute",
                                            top: 11,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            fontSize: "6px",
                                            fontWeight: 800,
                                            color: tier.textColor,
                                            whiteSpace: "nowrap",
                                            letterSpacing: "0.08em",
                                            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                                            opacity: 0.8,
                                        }}>
                                            {s.abbr}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Country dots (non-US, excluding US since states replace it) */}
                            {COUNTRY_NODES.filter((n) => n.iso2 !== "US").map((node) => {
                                const ws = getWaveStyle(node.wave);
                                const size = isMobile
                                    ? (node.wave === 1 ? 5 : node.wave <= 3 ? 4 : 2)
                                    : (node.wave === 1 ? 12 : node.wave <= 3 ? 9 : 6);
                                return (
                                    <div key={node.iso2}
                                        onClick={() => { if (ws.interactive && node.href) window.location.href = node.href; }}
                                        style={{
                                            position: "absolute", left: `${node.cx}%`, top: `${node.cy}%`,
                                            transform: "translate(-50%, -50%)",
                                            cursor: ws.interactive ? "pointer" : "default",
                                            zIndex: 10, opacity: ws.opacity, pointerEvents: "auto",
                                        }}>
                                        {ws.glow && (
                                            <span style={{
                                                position: "absolute", inset: -5, borderRadius: "50%",
                                                background: `radial-gradient(circle, ${ws.dotColor}40, transparent 70%)`,
                                                animation: "radarPulse 2s ease-in-out infinite",
                                            }} />
                                        )}
                                        {ws.pulse && (
                                            <span style={{
                                                position: "absolute", inset: -3, borderRadius: "50%",
                                                border: `1px solid ${ws.dotColor}30`,
                                                animation: "radarPing 6s ease-in-out infinite",
                                            }} />
                                        )}
                                        <span style={{
                                            display: "block", width: size, height: size, borderRadius: "50%",
                                            background: ws.dotColor, border: `1.5px solid ${ws.dotColor}80`,
                                            boxShadow: ws.glow ? `0 0 10px ${ws.dotColor}60` : "none",
                                            position: "relative",
                                        }} />
                                        {node.wave === 1 && (
                                            <span className="hidden sm:block" style={{
                                                position: "absolute", top: size + 3, left: "50%",
                                                transform: "translateX(-50%)", fontSize: "7px",
                                                fontWeight: 800, color: ws.dotColor, whiteSpace: "nowrap",
                                                letterSpacing: "0.1em", textTransform: "uppercase" as const,
                                                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                                            }}>{node.iso2}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div> {/* End Transform Wrapper */}

                        {/* =”€=”€ Tooltip =”€=”€ */}
                        {tooltip.visible && tooltip.content && (
                            <div style={{
                                position: "absolute",
                                left: Math.min(tooltip.x + 16, (containerRef.current?.offsetWidth || 800) - 240),
                                top: tooltip.y - 10,
                                background: "rgba(12,15,24,0.96)",
                                border: "1px solid rgba(198,146,58,0.2)",
                                borderRadius: "14px",
                                padding: "14px 18px",
                                minWidth: "210px",
                                zIndex: 50,
                                backdropFilter: "blur(20px)",
                                boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 1px rgba(198,146,58,0.3)",
                                pointerEvents: "none",
                            }}>
                                {tooltip.content.type === "state" ? (
                                    // =”€=”€ State liquidity tooltip =”€=”€
                                    <>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                                                {tooltip.content.data.name}
                                            </div>
                                            <div style={{
                                                fontSize: "18px", fontWeight: 900, color: getLiquidityTier(tooltip.content.liquidity).textColor,
                                                fontFamily: "var(--font-display)",
                                            }}>
                                                {tooltip.content.liquidity}
                                            </div>
                                        </div>
                                        {/* Tier + trend */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                            <span style={{
                                                fontSize: "9px", fontWeight: 700, textTransform: "uppercase" as const,
                                                letterSpacing: "0.15em",
                                                color: getLiquidityTier(tooltip.content.liquidity).textColor,
                                                background: getLiquidityTier(tooltip.content.liquidity).color,
                                                padding: "2px 8px", borderRadius: "6px",
                                            }}>
                                                {getLiquidityTier(tooltip.content.liquidity).label}
                                            </span>
                                            <span style={{
                                                fontSize: "10px", fontWeight: 700,
                                                color: trendArrow(tooltip.content.data.trend).color,
                                                display: "flex", alignItems: "center", gap: "3px",
                                            }}>
                                                {trendArrow(tooltip.content.data.trend).symbol}
                                                <span style={{ fontSize: "8px", opacity: 0.8 }}>
                                                    {trendArrow(tooltip.content.data.trend).label}
                                                </span>
                                            </span>
                                        </div>
                                        {/* Stats rows */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            {[
                                                { label: "Active Escorts", value: tooltip.content.data.activeEscorts.toString(), color: "#22c55e" },
                                                { label: "Open Loads", value: tooltip.content.data.openLoads.toString(), color: "#eab308" },
                                                { label: "Avg Match Time", value: `${tooltip.content.data.medianMatchMin}m`, color: "#C6923A" },
                                                { label: "Fill Rate", value: `${Math.round(tooltip.content.data.fillRate * 100)}%`, color: "#8fa3b8" },
                                            ].map(({ label, value, color }) => (
                                                <div key={label} style={{ fontSize: "11px", color: "#8fa3b8", display: "flex", justifyContent: "space-between" }}>
                                                    <span>{label}</span>
                                                    <span style={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {tooltip.content.liquidity < 40 && (
                                            <div style={{
                                                marginTop: "8px", fontSize: "9px", fontWeight: 600,
                                                color: "#f87171", textTransform: "uppercase" as const,
                                                letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: "4px",
                                            }}>
                                                <AlertTriangle size={10} />
                                                Coverage tightening
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // =”€=”€ Country tooltip =”€=”€
                                    <>
                                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                                            {tooltip.content.data.name}
                                        </div>
                                        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.15em", color: getWaveStyle(tooltip.content.data.wave).dotColor, marginBottom: "8px" }}>
                                            {getWaveStyle(tooltip.content.data.wave).label}
                                        </div>
                                        {tooltip.content.data.escortCount != null && (
                                            <div style={{ fontSize: "11px", color: "#8fa3b8", display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                                <span>Active Escorts</span>
                                                <span style={{ color: "#fff", fontWeight: 600 }}>{tooltip.content.data.escortCount}</span>
                                            </div>
                                        )}
                                        {tooltip.content.data.demandLevel && tooltip.content.data.demandLevel !== "none" && (
                                            <div style={{ fontSize: "11px", color: "#8fa3b8", display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                                <span>Demand</span>
                                                <span style={{
                                                    color: tooltip.content.data.demandLevel === "high" ? "#22c55e" : tooltip.content.data.demandLevel === "medium" ? "#eab308" : "#6b7280",
                                                    fontWeight: 600, textTransform: "capitalize" as const,
                                                }}>{tooltip.content.data.demandLevel}</span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: "#8fa3b8", display: "flex", justifyContent: "space-between" }}>
                                            <span>Coverage</span>
                                            <span style={{ color: "#fff", fontWeight: 600 }}>
                                                {tooltip.content.data.wave === 1 ? "Strong" : tooltip.content.data.wave <= 3 ? "Growing" : "Planned"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* =”€=”€ Floating legend — collapsed on mobile =”€=”€ */}
                        <div className="hidden sm:flex" style={{
                            position: "absolute", bottom: 16, right: 16,
                            background: "rgba(12,15,24,0.88)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "12px",
                            padding: "10px 14px",
                            fontSize: "10px", color: "#8fa3b8",
                            backdropFilter: "blur(12px)",
                            zIndex: 20,
                            flexDirection: "column" as const, gap: "5px",
                        }}>
                            {[
                                { color: "#22c55e", label: "Healthy Liquidity" },
                                { color: "#eab308", label: "Watch Zone" },
                                { color: "#f87171", label: "Shortage Risk" },
                                { color: "rgba(198,146,58,0.7)", label: "Corridor Activity" },
                                { color: "#3b82f6", label: "Expanding Market" },
                            ].map(({ color, label }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}50` }} />
                                    <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
                                </div>
                            ))}
                        </div>
                        {/* Mobile: minimal 2-dot legend */}
                        <div className="flex sm:hidden" style={{
                            position: "absolute", bottom: 10, right: 10,
                            background: "rgba(12,15,24,0.88)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            fontSize: "9px", color: "#8fa3b8",
                            backdropFilter: "blur(12px)",
                            zIndex: 20,
                            gap: "8px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                                <span>Live</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f87171" }} />
                                <span>Shortage</span>
                            </div>
                        </div>

                        {/* =”€=”€ Live indicator =”€=”€ */}
                        <div style={{
                            position: "absolute", top: 16, left: 16,
                            display: "flex", alignItems: "center", gap: "8px",
                            background: "rgba(12,15,24,0.88)",
                            border: "1px solid rgba(34,197,94,0.15)",
                            borderRadius: "10px",
                            padding: "6px 12px",
                            backdropFilter: "blur(12px)",
                            zIndex: 20,
                        }}>
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, position: "relative" }}>
                                <span style={{
                                    position: "absolute", width: "100%", height: "100%",
                                    borderRadius: "50%", background: "#22c55e",
                                    animation: "radarPing 1.5s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.75,
                                }} />
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", position: "relative" }} />
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase" as const, letterSpacing: "0.15em" }}>
                                Live Supply Radar
                            </span>
                        </div>

                        {/* =”€=”€ Stats overlay (top right) — LIVE from DB =”€=”€ */}
                        <div className="hidden sm:flex" style={{ position: "absolute", top: 16, right: 16, gap: "8px", zIndex: 20 }}>
                            {[
                                { icon: Globe, value: `${stats?.total_countries ?? "—"}`, label: "Countries", color: "#3b82f6" },
                                { icon: Radio, value: `${stats?.active_markets ?? "—"}`, label: "Active Markets", color: "#22c55e" },
                                { icon: TrendingUp, value: `${(stats?.total_surfaces ?? 0).toLocaleString()}`, label: "Surfaces", color: "#C6923A" },
                            ].map(({ icon: Icon, value, label, color }) => (
                                <div key={label} style={{
                                    background: "rgba(12,15,24,0.88)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "10px", padding: "6px 12px",
                                    backdropFilter: "blur(12px)", textAlign: "center" as const,
                                }}>
                                    <div style={{ fontSize: "14px", fontWeight: 900, color, fontFamily: "var(--font-display)" }}>{loading ? "..." : value}</div>
                                    <div style={{ fontSize: "8px", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* =”€=”€ Live Route Intelligence Feed — LIVE from CSN =”€=”€ */}
                        <div className="hidden sm:flex" style={{
                            position: "absolute", top: 60, left: 16,
                            width: "240px",
                            flexDirection: "column", gap: "8px",
                            zIndex: 20,
                        }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#eab308", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                                Live Route Signals
                            </div>
                            {signals.length > 0 ? signals.map((sig, i) => {
                                const display = SIGNAL_TYPE_DISPLAY[sig.signal_type] || { label: sig.signal_type, color: "#8fa3b8", icon: "📡" };
                                const ago = Math.round((Date.now() - new Date(sig.created_at).getTime()) / 60000);
                                const timeStr = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
                                return (
                                    <motion.div key={sig.signal_id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + i * 0.2 }}
                                        style={{
                                            background: "rgba(12,15,24,0.85)", border: `1px solid ${display.color}40`,
                                            borderRadius: 12, padding: "10px", backdropFilter: "blur(12px)",
                                            boxShadow: `0 4px 12px ${display.color}15`,
                                        }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: display.color }}>{display.icon} {display.label}</span>
                                            <span style={{ fontSize: 9, color: "#8fa3b8" }}>{timeStr}</span>
                                        </div>
                                        {sig.description && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{sig.description}</div>}
                                    </motion.div>
                                );
                            }) : (
                                <div style={{
                                    background: "rgba(12,15,24,0.85)", border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: 12, padding: "12px", backdropFilter: "blur(12px)",
                                    textAlign: "center",
                                }}>
                                    <div style={{ fontSize: 10, color: "#8fa3b8", fontWeight: 600 }}>Active signal: 15 operators nearby</div>
                                    <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, marginTop: 2 }}>5 matches today</div>
                                    <div style={{ fontSize: 9, color: "#6b7280", marginTop: 4 }}>Signals appear when escorts report conditions</div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
                @keyframes radarPing {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.8); opacity: 0; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes radarPulse {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.3); }
                }
            `}</style>
        </section>
    );
}