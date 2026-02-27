"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Radio, TrendingUp, AlertTriangle } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// GLOBAL ESCORT SUPPLY RADAR + STATE LIQUIDITY SCORE SYSTEM
// Phase 1: country dots, corridor glow, canvas heat, state tinting,
// liquidity tooltips, trend arrows, shortage detection.
// ═══════════════════════════════════════════════════════════════

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

// ── State liquidity data ──
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

// ── Liquidity Score formula ──
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
        case "up": return { symbol: "▲", color: "#22c55e", label: "Improving" };
        case "down": return { symbol: "▼", color: "#f87171", label: "Tightening" };
        default: return { symbol: "→", color: "#6b7280", label: "Stable" };
    }
}

// ── US state positions (relative % inside US zone on world map) ──
// These map to positions within the US region (roughly cx 10-30, cy 32-50)
const US_STATES: StateNode[] = [
    { abbr: "TX", name: "Texas", cx: 18, cy: 47, activeEscorts: 182, openLoads: 28, medianMatchMin: 11, fillRate: 0.87, trend: "up", href: "/directory/us/tx" },
    { abbr: "CA", name: "California", cx: 11, cy: 42, activeEscorts: 124, openLoads: 15, medianMatchMin: 14, fillRate: 0.82, trend: "stable", href: "/directory/us/ca" },
    { abbr: "FL", name: "Florida", cx: 27, cy: 48, activeEscorts: 89, openLoads: 12, medianMatchMin: 13, fillRate: 0.79, trend: "up", href: "/directory/us/fl" },
    { abbr: "OH", name: "Ohio", cx: 25, cy: 39, activeEscorts: 68, openLoads: 10, medianMatchMin: 16, fillRate: 0.74, trend: "stable", href: "/directory/us/oh" },
    { abbr: "PA", name: "Pennsylvania", cx: 27, cy: 38, activeEscorts: 55, openLoads: 8, medianMatchMin: 18, fillRate: 0.71, trend: "stable", href: "/directory/us/pa" },
    { abbr: "LA", name: "Louisiana", cx: 22, cy: 48, activeEscorts: 62, openLoads: 14, medianMatchMin: 12, fillRate: 0.84, trend: "up", href: "/directory/us/la" },
    { abbr: "OK", name: "Oklahoma", cx: 19, cy: 44, activeEscorts: 45, openLoads: 9, medianMatchMin: 15, fillRate: 0.76, trend: "stable", href: "/directory/us/ok" },
    { abbr: "GA", name: "Georgia", cx: 26, cy: 46, activeEscorts: 48, openLoads: 7, medianMatchMin: 17, fillRate: 0.72, trend: "down", href: "/directory/us/ga" },
    { abbr: "IL", name: "Illinois", cx: 22, cy: 39, activeEscorts: 52, openLoads: 11, medianMatchMin: 14, fillRate: 0.78, trend: "stable", href: "/directory/us/il" },
    { abbr: "NC", name: "North Carolina", cx: 27, cy: 43, activeEscorts: 38, openLoads: 6, medianMatchMin: 19, fillRate: 0.69, trend: "down", href: "/directory/us/nc" },
    { abbr: "WA", name: "Washington", cx: 12, cy: 34, activeEscorts: 32, openLoads: 5, medianMatchMin: 20, fillRate: 0.68, trend: "stable", href: "/directory/us/wa" },
    { abbr: "AZ", name: "Arizona", cx: 13, cy: 45, activeEscorts: 28, openLoads: 6, medianMatchMin: 22, fillRate: 0.65, trend: "down", href: "/directory/us/az" },
    { abbr: "IN", name: "Indiana", cx: 24, cy: 39, activeEscorts: 41, openLoads: 8, medianMatchMin: 16, fillRate: 0.73, trend: "stable", href: "/directory/us/in" },
    { abbr: "MO", name: "Missouri", cx: 21, cy: 42, activeEscorts: 35, openLoads: 7, medianMatchMin: 18, fillRate: 0.71, trend: "stable", href: "/directory/us/mo" },
    { abbr: "CO", name: "Colorado", cx: 16, cy: 41, activeEscorts: 22, openLoads: 4, medianMatchMin: 24, fillRate: 0.62, trend: "up", href: "/directory/us/co" },
];

const COUNTRY_NODES: CountryNode[] = [
    { iso2: "US", name: "United States", wave: 1, cx: 22, cy: 42, escortCount: 896, demandLevel: "high", href: "/directory/us" },
    { iso2: "CA", name: "Canada", wave: 1, cx: 22, cy: 28, escortCount: 42, demandLevel: "medium", href: "/directory/ca" },
    { iso2: "AU", name: "Australia", wave: 1, cx: 82, cy: 72, escortCount: 18, demandLevel: "low", href: "/directory/au" },
    { iso2: "GB", name: "United Kingdom", wave: 2, cx: 47, cy: 28, demandLevel: "low" },
    { iso2: "NZ", name: "New Zealand", wave: 2, cx: 90, cy: 80, demandLevel: "none" },
    { iso2: "DE", name: "Germany", wave: 2, cx: 51, cy: 30, demandLevel: "low" },
    { iso2: "SE", name: "Sweden", wave: 3, cx: 53, cy: 22, demandLevel: "none" },
    { iso2: "NO", name: "Norway", wave: 3, cx: 50, cy: 20, demandLevel: "none" },
    { iso2: "NL", name: "Netherlands", wave: 3, cx: 49, cy: 30, demandLevel: "none" },
    { iso2: "IE", name: "Ireland", wave: 3, cx: 45, cy: 28, demandLevel: "none" },
    { iso2: "DK", name: "Denmark", wave: 3, cx: 51, cy: 25, demandLevel: "none" },
    { iso2: "FI", name: "Finland", wave: 3, cx: 56, cy: 20, demandLevel: "none" },
    { iso2: "AE", name: "UAE", wave: 4, cx: 62, cy: 45, demandLevel: "none" },
    { iso2: "SA", name: "Saudi Arabia", wave: 4, cx: 60, cy: 43, demandLevel: "none" },
    { iso2: "ZA", name: "South Africa", wave: 4, cx: 55, cy: 78, demandLevel: "none" },
    { iso2: "PL", name: "Poland", wave: 4, cx: 54, cy: 29, demandLevel: "none" },
    { iso2: "BE", name: "Belgium", wave: 4, cx: 49, cy: 31, demandLevel: "none" },
    { iso2: "MX", name: "Mexico", wave: 5, cx: 18, cy: 50, demandLevel: "none" },
    { iso2: "BR", name: "Brazil", wave: 5, cx: 32, cy: 68, demandLevel: "none" },
    { iso2: "CL", name: "Chile", wave: 5, cx: 28, cy: 78, demandLevel: "none" },
    { iso2: "ES", name: "Spain", wave: 5, cx: 46, cy: 36, demandLevel: "none" },
    { iso2: "CH", name: "Switzerland", wave: 5, cx: 50, cy: 32, demandLevel: "none" },
    { iso2: "AT", name: "Austria", wave: 5, cx: 52, cy: 32, demandLevel: "none" },
];

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

function getWaveStyle(wave: WaveLevel) {
    switch (wave) {
        case 1: return { opacity: 1, glow: true, pulse: false, interactive: true, dotColor: "#22c55e", label: "LIVE" };
        case 2: return { opacity: 0.7, glow: false, pulse: true, interactive: true, dotColor: "#3b82f6", label: "EXPANDING" };
        case 3: return { opacity: 0.5, glow: false, pulse: true, interactive: true, dotColor: "#3b82f6", label: "EXPANDING" };
        case 4: return { opacity: 0.3, glow: false, pulse: false, interactive: false, dotColor: "#6b7280", label: "PLANNED" };
        case 5: return { opacity: 0.25, glow: false, pulse: false, interactive: false, dotColor: "#4b5563", label: "PLANNED" };
    }
}

// ── Tooltip union type ──
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

    // Pre-compute liquidity scores
    const stateLiquidity = useMemo(() =>
        US_STATES.map((s) => ({ ...s, liquidity: computeLiquidity(s) }))
        , []);

    // Shortage states (< 40 liquidity + demand rising or stable-high loads)
    const shortageStates = useMemo(() =>
        stateLiquidity.filter((s) => s.liquidity < 40)
        , [stateLiquidity]);

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
                const r = Math.max(18, Math.min(45, s.activeEscorts * 0.2)) * dpr;

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
                const r = (node.escortCount >= 500 ? 60 : node.escortCount >= 100 ? 40 : node.escortCount >= 20 ? 25 : 15) * dpr;
                const alpha = node.escortCount >= 500 ? 0.4 : node.escortCount >= 100 ? 0.25 : 0.1;
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
    }, [stateLiquidity]);

    // Liquidity pulses: fire from random active states
    useEffect(() => {
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
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;

        // Check states first (higher priority, tighter threshold)
        let closestState: (StateNode & { liquidity: number }) | null = null;
        let minStateDist = 3;
        stateLiquidity.forEach((s) => {
            const d = Math.sqrt((mx - s.cx) ** 2 + (my - s.cy) ** 2);
            if (d < minStateDist) { minStateDist = d; closestState = s; }
        });

        if (closestState) {
            setTooltip({
                visible: true,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                content: { type: "state", data: closestState, liquidity: (closestState as any).liquidity },
            });
            return;
        }

        // Check countries
        let closestCountry: CountryNode | null = null;
        let minDist = 4;
        COUNTRY_NODES.forEach((node) => {
            const d = Math.sqrt((mx - node.cx) ** 2 + (my - node.cy) ** 2);
            if (d < minDist) { minDist = d; closestCountry = node; }
        });

        if (closestCountry) {
            setTooltip({
                visible: true,
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                content: { type: "country", data: closestCountry },
            });
        } else {
            setTooltip((prev) => prev.visible ? { ...prev, visible: false } : prev);
        }
    }, [stateLiquidity]);

    return (
        <section className="relative z-10 py-12">
            <div className="hc-container">
                {/* ── Section header ── */}
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
                        Live escort density, corridor pressure, and market liquidity across 25+ countries.
                    </p>
                </motion.div>

                {/* ── Map container ── */}
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
                            minHeight: "clamp(260px, 40vw, 520px)",
                            borderRadius: "20px",
                            overflow: "hidden",
                            background: "linear-gradient(180deg, rgba(11,15,25,0.95) 0%, rgba(8,12,20,0.98) 100%)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: "0 0 80px rgba(198,146,58,0.04), inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.3)",
                        }}
                    >
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
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: tier.textColor,
                                        border: `1.5px solid ${tier.textColor}80`,
                                        boxShadow: `0 0 8px ${tier.textColor}40`,
                                        position: "relative",
                                    }} />
                                    <span style={{
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
                            const size = node.wave === 1 ? 12 : node.wave <= 3 ? 9 : 6;
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
                                        <span style={{
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

                        {/* ── Tooltip ── */}
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
                                    // ── State liquidity tooltip ──
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
                                    // ── Country tooltip ──
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

                        {/* ── Floating legend ── */}
                        <div style={{
                            position: "absolute", bottom: 16, right: 16,
                            background: "rgba(12,15,24,0.88)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "12px",
                            padding: "10px 14px",
                            fontSize: "10px", color: "#8fa3b8",
                            backdropFilter: "blur(12px)",
                            zIndex: 20,
                            display: "flex", flexDirection: "column" as const, gap: "5px",
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

                        {/* ── Live indicator ── */}
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

                        {/* ── Stats overlay (top right) ── */}
                        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: "8px", zIndex: 20 }}>
                            {[
                                { icon: Globe, value: "25+", label: "Countries", color: "#3b82f6" },
                                { icon: Radio, value: "3", label: "Live Markets", color: "#22c55e" },
                                { icon: TrendingUp, value: "15", label: "States Tracked", color: "#C6923A" },
                            ].map(({ icon: Icon, value, label, color }) => (
                                <div key={label} style={{
                                    background: "rgba(12,15,24,0.88)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "10px", padding: "6px 12px",
                                    backdropFilter: "blur(12px)", textAlign: "center" as const,
                                }}>
                                    <div style={{ fontSize: "14px", fontWeight: 900, color, fontFamily: "var(--font-display)" }}>{value}</div>
                                    <div style={{ fontSize: "8px", fontWeight: 700, color: "#8fa3b8", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{label}</div>
                                </div>
                            ))}
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
