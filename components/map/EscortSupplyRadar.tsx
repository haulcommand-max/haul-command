/**
 * EscortSupplyRadar — Map overlay layer for real-time escort availability.
 *
 * Renders as an overlay panel (not a full map replacement).
 * Visualizes escort density zones, shortage pulses, and corridor thickness.
 *
 * Data sources:
 *   - geo_supply_pressure     → escort density per geohash zone
 *   - supply_move_recommendations → shortage corridors
 *   - Static corridor data    → corridor thickness fallback
 *
 * Architecture:
 *   This component provides the HC intelligence overlay.
 *   The base map is rendered by HERE (via existing map components).
 *   See: lib/maps/hc-overlays.ts for overlay config.
 *
 * Interaction model (YAML spec):
 *   - Escort cluster tap → MiniOperatorSheet (stub, see below)
 *   - Shortage zone tap  → RecruitmentPrompt
 *   - Corridor line tap  → CorridorIntelligencePanel (CorridorLiquidityHeatmap)
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Radio, AlertTriangle, Users, ChevronRight, X, Flame } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EscortZone {
    id: string;
    label: string;
    state: string;
    lat: number;
    lng: number;
    escortCount: number;
    availableCount: number;
    /** Demand pressure 0–100 */
    demandPressure: number;
    /** Is this zone in shortage? */
    shortage: boolean;
}

interface RadarProps {
    /** Render mode: 'panel' shows as a fixed-position radar panel (default) */
    variant?: "panel" | "inline";
    /** Callback when user taps a corridor shortage zone */
    onShortageZoneTap?: (zone: EscortZone) => void;
    /** Callback when user taps an escort cluster */
    onEscortClusterTap?: (zone: EscortZone) => void;
    className?: string;
}

// ── Static zone data ──────────────────────────────────────────────────────────
// TODO: replace with live Supabase geo_supply_pressure query once postgis is wired.

const STATIC_ZONES: EscortZone[] = [
    { id: "tx-gulf", label: "Gulf Coast, TX", state: "TX", lat: 29.7, lng: -95.4, escortCount: 12, availableCount: 3, demandPressure: 94, shortage: true },
    { id: "la-south", label: "Southern Louisiana", state: "LA", lat: 30.0, lng: -90.8, escortCount: 8, availableCount: 2, demandPressure: 82, shortage: true },
    { id: "ga-savannah", label: "Savannah Corridor, GA", state: "GA", lat: 32.0, lng: -81.1, escortCount: 14, availableCount: 6, demandPressure: 74, shortage: false },
    { id: "tn-central", label: "Central Tennessee", state: "TN", lat: 36.1, lng: -86.8, escortCount: 18, availableCount: 11, demandPressure: 58, shortage: false },
    { id: "tx-permian", label: "Permian Basin, TX", state: "TX", lat: 31.8, lng: -102.4, escortCount: 6, availableCount: 1, demandPressure: 88, shortage: true },
    { id: "ca-la", label: "Los Angeles Basin, CA", state: "CA", lat: 34.0, lng: -118.2, escortCount: 22, availableCount: 9, demandPressure: 66, shortage: false },
    { id: "ok-tulsa", label: "Tulsa Corridor, OK", state: "OK", lat: 36.1, lng: -95.9, escortCount: 7, availableCount: 2, demandPressure: 79, shortage: true },
    { id: "nc-charlotte", label: "Charlotte, NC", state: "NC", lat: 35.2, lng: -80.8, escortCount: 11, availableCount: 5, demandPressure: 55, shortage: false },
];

// ── Density tier → color ───────────────────────────────────────────────────────

function zoneColor(pressure: number, shortage: boolean): { ring: string; dot: string; label: string } {
    if (shortage || pressure >= 80) return { ring: "rgba(239,68,68,0.25)", dot: "#ef4444", label: "Shortage" };
    if (pressure >= 60) return { ring: "rgba(249,115,22,0.20)", dot: "#f97316", label: "Tightening" };
    if (pressure >= 40) return { ring: "rgba(241,169,27,0.18)", dot: "#F1A91B", label: "Moderate" };
    return { ring: "rgba(34,197,94,0.15)", dot: "#22c55e", label: "Healthy" };
}

// ── Shortage pulse ring ────────────────────────────────────────────────────────

function ShortagePulse({ color }: { color: string }) {
    return (
        <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: color, animationDuration: "1.8s" }}
        />
    );
}

// ── Mini Operator Sheet (tap on escort cluster) ───────────────────────────────

function MiniOperatorSheet({ zone, onClose }: { zone: EscortZone; onClose: () => void }) {
    return (
        <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 z-40"
            style={{ background: "rgba(10,10,12,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
            role="dialog"
            aria-label={`Escorts in ${zone.label}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-black text-white">{zone.label}</h3>
                    <p className="text-[10px] mt-0.5" style={{ color: "#5A6577" }}>
                        {zone.availableCount} of {zone.escortCount} escorts available now
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            {/* Availability bar */}
            <div className="mb-4">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${(zone.availableCount / zone.escortCount) * 100}%`,
                            background: zone.shortage ? "#ef4444" : "#22c55e",
                        }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: "#5A6577" }}>Available</span>
                    <span className="text-[9px]" style={{ color: "#5A6577" }}>
                        {Math.round((zone.availableCount / zone.escortCount) * 100)}%
                    </span>
                </div>
            </div>
            <a
                href={`/directory?state=${zone.state}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-black transition-all"
                style={{ background: "#F1A91B" }}
            >
                Find Escorts in {zone.state}
                <ChevronRight className="w-4 h-4" />
            </a>
        </div>
    );
}

// ── Recruitment prompt (tap on shortage zone) ─────────────────────────────────

function RecruitmentPrompt({ zone, onClose }: { zone: EscortZone; onClose: () => void }) {
    return (
        <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 z-40"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.20)", backdropFilter: "blur(20px)" }}
            role="dialog"
            aria-label={`Shortage zone: ${zone.label}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                    <div>
                        <h3 className="text-sm font-black" style={{ color: "#ef4444" }}>Coverage Shortage</h3>
                        <p className="text-[10px]" style={{ color: "rgba(239,68,68,0.7)" }}>{zone.label}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5" aria-label="Close">
                    <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                Only {zone.availableCount} escort{zone.availableCount !== 1 ? "s" : ""} available for {zone.demandPressure > 80 ? "critical" : "high"} demand.
                Operators in this area are booking fast.
            </p>
            <div className="flex gap-2">
                <a
                    href="/onboarding/start?role=escort"
                    className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-black"
                    style={{ background: "#ef4444" }}
                >
                    List Your Service
                </a>
                <a
                    href={`/directory?state=${zone.state}`}
                    className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" }}
                >
                    View Available
                </a>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type SheetMode = "escort" | "shortage" | null;

export default function EscortSupplyRadar({ variant = "panel", onShortageZoneTap, onEscortClusterTap, className = "" }: RadarProps) {
    const [zones, setZones] = useState<EscortZone[]>(STATIC_ZONES);
    const [activeZone, setActiveZone] = useState<EscortZone | null>(null);
    const [sheetMode, setSheetMode] = useState<SheetMode>(null);
    const [lastPing, setLastPing] = useState(new Date());

    // Simulate live radar ping every 30s
    useEffect(() => {
        const interval = setInterval(() => setLastPing(new Date()), 30_000);
        return () => clearInterval(interval);
    }, []);

    const shortageZones = zones.filter(z => z.shortage);
    const healthyZones = zones.filter(z => !z.shortage);
    const totalEscorts = zones.reduce((s, z) => s + z.availableCount, 0);

    const handleZoneTap = useCallback((zone: EscortZone) => {
        setActiveZone(zone);
        if (zone.shortage) {
            setSheetMode("shortage");
            onShortageZoneTap?.(zone);
        } else {
            setSheetMode("escort");
            onEscortClusterTap?.(zone);
        }
    }, [onShortageZoneTap, onEscortClusterTap]);

    const closeSheet = useCallback(() => {
        setSheetMode(null);
        setActiveZone(null);
    }, []);

    return (
        <div
            className={`relative flex flex-col overflow-hidden rounded-2xl ${className}`}
            style={{ background: "rgba(8,8,10,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="relative w-3 h-3 flex-shrink-0">
                        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#ef4444", opacity: 0.5, animationDuration: "2s" }} />
                        <span className="relative w-3 h-3 rounded-full block" style={{ background: "#ef4444" }} />
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Escort Supply Radar</span>
                </div>
                <div className="flex items-center gap-3">
                    {shortageZones.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#ef4444" }}>
                            <AlertTriangle className="w-3 h-3" />
                            {shortageZones.length} shortage{shortageZones.length !== 1 ? "s" : ""}
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "#5A6577" }}>
                        <Radio className="w-3 h-3" />
                        {lastPing.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            </div>

            {/* ── Summary band ───────────────────────────────────────────────── */}
            <div
                className="flex items-center justify-around px-4 py-3 border-b flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}
            >
                {[
                    { label: "Zones Tracked", value: zones.length },
                    { label: "Escorts Available", value: totalEscorts },
                    { label: "Shortage Zones", value: shortageZones.length, warn: shortageZones.length > 0 },
                    { label: "Healthy Zones", value: healthyZones.length },
                ].map(({ label, value, warn }) => (
                    <div key={label} className="text-center">
                        <div className="text-base font-black" style={{ color: warn ? "#ef4444" : "#e2e8f0" }}>{value}</div>
                        <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "#3A4553" }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Zone grid ──────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {[...zones].sort((a, b) => b.demandPressure - a.demandPressure).map(zone => {
                    const colors = zoneColor(zone.demandPressure, zone.shortage);
                    const availPct = Math.round((zone.availableCount / zone.escortCount) * 100);

                    return (
                        <button
                            key={zone.id}
                            onClick={() => handleZoneTap(zone)}
                            className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all group"
                            style={{ background: activeZone?.id === zone.id ? "rgba(255,255,255,0.03)" : "transparent" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = activeZone?.id === zone.id ? "rgba(255,255,255,0.03)" : "transparent"; }}
                            aria-label={`${zone.label}: ${colors.label}, ${zone.availableCount} escorts available`}
                        >
                            {/* Dot with optional pulse */}
                            <div className="relative w-4 h-4 flex-shrink-0 flex items-center justify-center">
                                {zone.shortage && <ShortagePulse color={colors.ring} />}
                                <span className="relative w-2.5 h-2.5 rounded-full block" style={{ background: colors.dot }} />
                            </div>

                            {/* Zone info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-white truncate">{zone.label}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest flex-shrink-0" style={{ color: colors.dot }}>
                                        {colors.label}
                                    </span>
                                </div>
                                {/* Supply bar */}
                                <div className="mt-1.5 h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${availPct}%`, background: colors.dot }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                    <div className="text-xs font-black" style={{ color: colors.dot }}>
                                        {zone.availableCount}<span className="text-[9px] font-normal text-white/20">/{zone.escortCount}</span>
                                    </div>
                                    <div className="text-[9px]" style={{ color: "#3A4553" }}>
                                        <Users className="w-2.5 h-2.5 inline mr-0.5" />
                                        avail
                                    </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 opacity-15 group-hover:opacity-50 transition-opacity" />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Legend ─────────────────────────────────────────────────────── */}
            <div
                className="px-4 py-3 border-t flex items-center gap-4 flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}
            >
                {[
                    { dot: "#ef4444", label: "Escort shortage" },
                    { dot: "#F1A91B", label: "Balanced supply" },
                    { dot: "#22c55e", label: "Healthy coverage" },
                ].map(({ dot, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                        <span className="text-[9px] uppercase tracking-wide" style={{ color: "#3A4553" }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* ── Bottom sheet (tap interaction) ─────────────────────────────── */}
            {sheetMode && activeZone && (
                sheetMode === "shortage"
                    ? <RecruitmentPrompt zone={activeZone} onClose={closeSheet} />
                    : <MiniOperatorSheet zone={activeZone} onClose={closeSheet} />
            )}
        </div>
    );
}
