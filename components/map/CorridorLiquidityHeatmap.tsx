"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    TrendingUp,
    Zap,
    Activity,
    Clock,
    Navigation,
    ChevronRight,
    X,
    BarChart2,
    Radio,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CorridorStressData {
    corridor_id: string;
    label: string;
    origin: string;
    dest: string;
    stress_index: number;       // 0-100
    open_loads: number;
    available_escorts: number;
    liquidity_ratio: number;
    broker_tier: string;        // "standard" | "priority" | "guaranteed_coverage"
    shortage_p30m?: number;     // predictive probability (0-1)
    shortage_p2h?: number;
}

interface LiveFlowEvent {
    id: string;
    type: "load_posted" | "match_made" | "escort_available" | "broker_active";
    label: string;
    corridor: string;
    ts: number;
}

// ── Mock corridor data (hydrated from API in production) ─────────────────────

const CORRIDORS: CorridorStressData[] = [
    { corridor_id: "I-10_TX_LA", label: "I-10 TX → LA", origin: "TX", dest: "LA", stress_index: 87, open_loads: 14, available_escorts: 3, liquidity_ratio: 4.67, broker_tier: "guaranteed_coverage", shortage_p30m: 0.88, shortage_p2h: 0.79 },
    { corridor_id: "I-75_GA_TN", label: "I-75 GA → TN", origin: "GA", dest: "TN", stress_index: 71, open_loads: 9, available_escorts: 4, liquidity_ratio: 2.25, broker_tier: "priority", shortage_p30m: 0.65, shortage_p2h: 0.58 },
    { corridor_id: "I-40_OK_NM", label: "I-40 OK → NM", origin: "OK", dest: "NM", stress_index: 62, open_loads: 7, available_escorts: 5, liquidity_ratio: 1.4, broker_tier: "priority", shortage_p30m: 0.52, shortage_p2h: 0.45 },
    { corridor_id: "I-95_NC_VA", label: "I-95 NC → VA", origin: "NC", dest: "VA", stress_index: 38, open_loads: 4, available_escorts: 8, liquidity_ratio: 0.5, broker_tier: "standard", shortage_p30m: 0.22, shortage_p2h: 0.18 },
    { corridor_id: "I-70_CO_KS", label: "I-70 CO → KS", origin: "CO", dest: "KS", stress_index: 24, open_loads: 2, available_escorts: 11, liquidity_ratio: 0.18, broker_tier: "standard", shortage_p30m: 0.14, shortage_p2h: 0.11 },
    { corridor_id: "US-90_LA_TX", label: "US-90 LA → TX", origin: "LA", dest: "TX", stress_index: 55, open_loads: 6, available_escorts: 5, liquidity_ratio: 1.2, broker_tier: "standard", shortage_p30m: 0.44, shortage_p2h: 0.36 },
];

// ── Color bands ───────────────────────────────────────────────────────────────

function getStressBand(index: number) {
    if (index >= 80) return { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", glow: "0 0 18px rgba(239,68,68,0.25)", icon: AlertTriangle };
    if (index >= 60) return { label: "At Risk", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", glow: "0 0 14px rgba(249,115,22,0.2)", icon: TrendingUp };
    if (index >= 40) return { label: "Tightening", color: "#F1A91B", bg: "rgba(241,169,27,0.08)", border: "rgba(241,169,27,0.25)", glow: "0 0 12px rgba(241,169,27,0.15)", icon: Zap };
    return { label: "Healthy", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", glow: "0 0 10px rgba(34,197,94,0.12)", icon: Activity };
}

// ── Live Flow Events (synthetic — replaced by realtime sub) ───────────────────

function generateFlowEvent(): LiveFlowEvent {
    const events: Omit<LiveFlowEvent, "id" | "ts">[] = [
        { type: "load_posted", label: "New superload posted", corridor: "I-10 TX → LA" },
        { type: "match_made", label: "Escort matched", corridor: "I-75 GA → TN" },
        { type: "escort_available", label: "Escort went available", corridor: "I-40 OK → NM" },
        { type: "broker_active", label: "Broker searching corridor", corridor: "I-95 NC → VA" },
        { type: "match_made", label: "Priority dispatch filled", corridor: "US-90 LA → TX" },
    ];
    return { ...events[Math.floor(Math.random() * events.length)], id: Math.random().toString(36), ts: Date.now() };
}

const FLOW_COLORS: Record<LiveFlowEvent["type"], string> = {
    load_posted: "#F1A91B",
    match_made: "#22c55e",
    escort_available: "#3b82f6",
    broker_active: "#a855f7",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StressBar({ index }: { index: number }) {
    const band = getStressBand(index);
    return (
        <div className="w-full">
            <div className="flex justify-between mb-1 items-center">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: band.color }}>{band.label}</span>
                <span className="text-sm font-black text-white">{index}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${index}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: band.color, boxShadow: band.glow }}
                />
            </div>
        </div>
    );
}

function ShortageGauge({ p, window: win }: { p: number; window: string }) {
    const pct = Math.round(p * 100);
    const color = pct >= 70 ? "#ef4444" : pct >= 45 ? "#f97316" : "#22c55e";
    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className="text-sm font-black" style={{ color }}>{pct}%</div>
            <div className="text-[9px] text-white/40 uppercase tracking-wider">{win}</div>
        </div>
    );
}

// ── Corridor Detail Panel ─────────────────────────────────────────────────────

function CorridorDetailPanel({ corridor, onClose }: { corridor: CorridorStressData; onClose: () => void }) {
    const band = getStressBand(corridor.stress_index);
    const BandIcon = band.icon;

    const tierBadge: Record<string, { label: string; color: string }> = {
        guaranteed_coverage: { label: "Guaranteed Coverage", color: "#ef4444" },
        priority: { label: "Priority Dispatch", color: "#f97316" },
        standard: { label: "Standard", color: "#22c55e" },
    };
    const tier = tierBadge[corridor.broker_tier] ?? tierBadge.standard;

    return (
        <motion.div
            key="corridor-panel"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="absolute right-4 top-4 bottom-4 w-80 z-30 flex flex-col overflow-hidden rounded-2xl"
            style={{ background: "rgba(5,5,5,0.96)", border: `1px solid ${band.border}`, boxShadow: `0 0 40px rgba(0,0,0,0.6), ${band.glow}` }}
        >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BandIcon className="w-4 h-4" style={{ color: band.color }} />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: band.color }}>{band.label}</span>
                    </div>
                    <h3 className="text-lg font-black text-white leading-tight">{corridor.label}</h3>
                    <div className="text-xs text-white/40 mt-0.5">{corridor.origin} → {corridor.dest} Corridor</div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Stress Index */}
            <div className="p-5 border-b border-white/5 space-y-3">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Corridor Stress Index</div>
                <StressBar index={corridor.stress_index} />
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                        <div className="text-xl font-black text-white">{corridor.open_loads}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wide">Open Loads</div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
                        <div className="text-xl font-black text-white">{corridor.available_escorts}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wide">Avail. Escorts</div>
                    </div>
                </div>
            </div>

            {/* Predictive shortage */}
            {(corridor.shortage_p30m || corridor.shortage_p2h) && (
                <div className="p-5 border-b border-white/5">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Predictive Shortage Model</div>
                    <div className="flex justify-around">
                        {corridor.shortage_p30m && <ShortageGauge p={corridor.shortage_p30m} window="30 min" />}
                        {corridor.shortage_p2h && <ShortageGauge p={corridor.shortage_p2h} window="2 hr" />}
                    </div>
                </div>
            )}

            {/* Broker tier */}
            <div className="p-5 border-b border-white/5">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Recommended Dispatch Tier</div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${tier.color}12`, border: `1px solid ${tier.color}30` }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: tier.color }} />
                    <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.label}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="p-5 mt-auto space-y-2">
                <button className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: band.color, boxShadow: band.glow }}>
                    Find Escorts in this Corridor
                </button>
                <button className="w-full h-9 rounded-xl text-xs font-bold uppercase tracking-widest text-white/60 border border-white/10 hover:bg-white/5 transition-all">
                    Post a Load Here
                </button>
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CorridorLiquidityHeatmapProps {
    className?: string;
}

export function CorridorLiquidityHeatmap({ className = "" }: CorridorLiquidityHeatmapProps) {
    const [selected, setSelected] = useState<CorridorStressData | null>(null);
    const [flowEvents, setFlowEvents] = useState<LiveFlowEvent[]>([]);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Layer 2: Live Flow Indicators — new event every 6-14 seconds
    useEffect(() => {
        const schedule = () => {
            const delay = 6000 + Math.random() * 8000;
            return setTimeout(() => {
                setFlowEvents((prev) => [generateFlowEvent(), ...prev].slice(0, 5));
                timerRef.current = schedule();
            }, delay);
        };
        const timerRef = { current: schedule() };
        return () => clearTimeout(timerRef.current);
    }, []);

    // Layer 1: Refresh stress index every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => setLastRefresh(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const criticalCount = CORRIDORS.filter((c) => c.stress_index >= 80).length;
    const atRiskCount = CORRIDORS.filter((c) => c.stress_index >= 60 && c.stress_index < 80).length;

    return (
        <div className={`relative flex flex-col h-full ${className}`}>

            {/* ── LAYER 1: Command Header ────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0" style={{ background: "rgba(5,5,5,0.95)", backdropFilter: "blur(16px)" }}>
                <div className="flex items-center gap-3">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Corridor Liquidity Intelligence</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/30">
                    {criticalCount > 0 && (
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                            <AlertTriangle className="w-3 h-3" /> {criticalCount} Critical
                        </span>
                    )}
                    {atRiskCount > 0 && (
                        <span className="flex items-center gap-1 text-orange-400 font-bold">
                            <TrendingUp className="w-3 h-3" /> {atRiskCount} At Risk
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ── LAYER 1: Corridor Stress Grid ─────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">

                    {/* Color legend */}
                    <div className="flex items-center gap-4 mb-3 px-1">
                        {([
                            { label: "Healthy", color: "#22c55e", range: "0-39" },
                            { label: "Tightening", color: "#F1A91B", range: "40-59" },
                            { label: "At Risk", color: "#f97316", range: "60-79" },
                            { label: "Critical", color: "#ef4444", range: "80-100" },
                        ] as const).map((b) => (
                            <div key={b.label} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                                <span className="text-[9px] text-white/40 uppercase tracking-wide">{b.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Sorted by stress index descending */}
                    {[...CORRIDORS].sort((a, b) => b.stress_index - a.stress_index).map((corridor) => {
                        const band = getStressBand(corridor.stress_index);
                        const BandIcon = band.icon;
                        const isSelected = selected?.corridor_id === corridor.corridor_id;

                        return (
                            <motion.button
                                key={corridor.corridor_id}
                                onClick={() => setSelected(isSelected ? null : corridor)}
                                className="w-full text-left p-4 rounded-xl transition-all relative overflow-hidden"
                                style={{
                                    background: isSelected ? band.bg : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${isSelected ? band.border : "rgba(255,255,255,0.05)"}`,
                                    boxShadow: isSelected ? band.glow : "none",
                                }}
                                whileHover={{ scale: 1.005 }}
                                whileTap={{ scale: 0.998 }}
                            >
                                {/* Layer 3: Predictive pressure glow */}
                                {(corridor.shortage_p30m ?? 0) >= 0.7 && (
                                    <div className="absolute inset-0 pointer-events-none"
                                        style={{ background: `radial-gradient(ellipse at 80% 50%, ${band.color}08 0%, transparent 70%)` }} />
                                )}

                                <div className="flex items-center gap-3 relative z-10">
                                    <BandIcon className="w-4 h-4 flex-shrink-0" style={{ color: band.color }} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-white truncate">{corridor.label}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                                        </div>

                                        {/* Stress bar */}
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                            <motion.div
                                                className="h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${corridor.stress_index}%` }}
                                                transition={{ duration: 0.9, ease: "easeOut" }}
                                                style={{ background: band.color, boxShadow: band.glow }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/40">{corridor.open_loads} loads</span>
                                                <span className="text-white/40">{corridor.available_escorts} escorts</span>
                                            </div>
                                            <span className="font-black" style={{ color: band.color }}>CSI {corridor.stress_index}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* ── LAYER 2: Live Flow Events Panel ───────────────────────────── */}
                <div className="w-56 border-l border-white/5 flex flex-col hidden lg:flex">
                    <div className="px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Radio className="w-3 h-3 text-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Live Feed</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <AnimatePresence initial={false}>
                            {flowEvents.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-2.5 rounded-lg"
                                    style={{ background: `${FLOW_COLORS[event.type]}0d`, border: `1px solid ${FLOW_COLORS[event.type]}20` }}
                                >
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: FLOW_COLORS[event.type] }} />
                                        <span className="text-[10px] text-white/50">{new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                                    </div>
                                    <div className="text-[11px] font-bold text-white leading-tight">{event.label}</div>
                                    <div className="text-[10px] text-white/30 mt-0.5 truncate">{event.corridor}</div>
                                </motion.div>
                            ))}
                            {flowEvents.length === 0 && (
                                <div className="text-center py-8 text-[10px] text-white/20 uppercase tracking-wider">
                                    Waiting for activity…
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Summary strip */}
                    <div className="p-3 border-t border-white/5 space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-white/30">Corridors Monitored</span>
                            <span className="font-black text-white">{CORRIDORS.length}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-white/30">Total Open Loads</span>
                            <span className="font-black text-white">{CORRIDORS.reduce((s, c) => s + c.open_loads, 0)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-white/30">Active Escorts</span>
                            <span className="font-black text-white">{CORRIDORS.reduce((s, c) => s + c.available_escorts, 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── LAYER 4: Corridor Detail Panel ──────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <CorridorDetailPanel corridor={selected} onClose={() => setSelected(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
