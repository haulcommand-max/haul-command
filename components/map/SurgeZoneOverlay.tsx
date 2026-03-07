"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Flame, AlertTriangle, TrendingUp } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// Surge Zone Overlay — Pulsing scarcity polygons on the map
// Source: lib/loadboard/surge-scarcity.ts
// Spec: HC_DOMINATION_PATCH_V1 Phase 1
// ══════════════════════════════════════════════════════════════

export type ScarcityLevel = "normal" | "tightening" | "scarce" | "critical";

interface SurgeZone {
    zoneId: string;
    lat: number;
    lng: number;
    radiusKm: number;
    scarcityIndex: number; // 0-1 where 1 = no supply
    level: ScarcityLevel;
    surgeMultiplier: number; // e.g. 1.3x
    tightnessScore: number;
    activeLoads: number;
    availableEscorts: number;
    marketLabel: string; // e.g. "Houston Metro"
}

interface SurgeZoneOverlayProps {
    zones: SurgeZone[];
    visible?: boolean;
    showBrokerTooltip?: boolean;
    onZoneClick?: (zone: SurgeZone) => void;
    className?: string;
}

const LEVEL_CONFIG: Record<ScarcityLevel, {
    color: string; pulseSpeed: number; label: string; emoji: string;
}> = {
    normal: { color: "#10b981", pulseSpeed: 0, label: "Normal Supply", emoji: "✅" },
    tightening: { color: "#f59e0b", pulseSpeed: 2.5, label: "Tightening", emoji: "⚠️" },
    scarce: { color: "#f97316", pulseSpeed: 1.8, label: "Scarce", emoji: "🟠" },
    critical: { color: "#ef4444", pulseSpeed: 1.2, label: "Critical", emoji: "🔴" },
};

export function SurgeZoneOverlay({
    zones,
    visible = true,
    showBrokerTooltip = true,
    onZoneClick,
    className,
}: SurgeZoneOverlayProps) {
    if (!visible || zones.length === 0) return null;

    const surgeZones = zones.filter(z => z.level !== "normal");
    const avgMultiplier = surgeZones.length > 0
        ? surgeZones.reduce((s, z) => s + z.surgeMultiplier, 0) / surgeZones.length
        : 1;

    return (
        <div className={cn("relative", className)}>
            {/* Summary bar */}
            <AnimatePresence>
                {surgeZones.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-3 left-3 z-20 bg-[rgba(10,15,25,0.92)] backdrop-blur-xl border border-orange-500/20 rounded-xl p-3 min-w-[200px]"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-[10px] font-extrabold text-orange-300 uppercase tracking-[0.15em]">
                                Surge Zones Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="text-center">
                                <div className="text-lg font-black text-orange-400">{surgeZones.length}</div>
                                <div className="text-[9px] text-white/40">Active Zones</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-white">
                                    {avgMultiplier.toFixed(1)}x
                                </div>
                                <div className="text-[9px] text-white/40">Avg Surge</div>
                            </div>
                        </div>

                        {/* Top surge zones */}
                        {surgeZones
                            .sort((a, b) => b.surgeMultiplier - a.surgeMultiplier)
                            .slice(0, 3)
                            .map(zone => (
                                <div
                                    key={zone.zoneId}
                                    className="flex items-center justify-between py-1 border-t border-white/5 first:border-0"
                                >
                                    <span className="text-[10px] text-white/60 truncate max-w-[100px]">
                                        {zone.marketLabel}
                                    </span>
                                    <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                        style={{
                                            color: LEVEL_CONFIG[zone.level].color,
                                            background: `${LEVEL_CONFIG[zone.level].color}15`,
                                        }}
                                    >
                                        {zone.surgeMultiplier.toFixed(1)}x
                                    </span>
                                </div>
                            ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Zone visualizations */}
            {zones.map(zone => {
                const conf = LEVEL_CONFIG[zone.level];
                if (zone.level === "normal") return null;

                return (
                    <motion.div
                        key={zone.zoneId}
                        className="absolute cursor-pointer group"
                        data-lat={zone.lat}
                        data-lng={zone.lng}
                        onClick={() => onZoneClick?.(zone)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Pulsing polygon (circle approximation) */}
                        <div className="relative">
                            {/* Outer pulse ring */}
                            <motion.div
                                className="absolute rounded-full"
                                style={{
                                    width: zone.radiusKm * 4,
                                    height: zone.radiusKm * 4,
                                    background: `radial-gradient(circle, ${conf.color}20 0%, ${conf.color}05 70%, transparent 100%)`,
                                    border: `1px solid ${conf.color}30`,
                                    transform: "translate(-50%, -50%)",
                                }}
                                animate={conf.pulseSpeed > 0 ? {
                                    scale: [1, 1.15, 1],
                                    opacity: [0.6, 0.3, 0.6],
                                } : {}}
                                transition={{
                                    duration: conf.pulseSpeed,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />

                            {/* Center dot */}
                            <div
                                className="w-3 h-3 rounded-full absolute"
                                style={{
                                    background: conf.color,
                                    boxShadow: `0 0 12px ${conf.color}60`,
                                    transform: "translate(-50%, -50%)",
                                }}
                            />
                        </div>

                        {/* Broker tooltip */}
                        {showBrokerTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-30">
                                <div className="bg-[rgba(10,15,25,0.96)] backdrop-blur-xl border border-white/10 rounded-xl p-3 min-w-[180px] shadow-2xl">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <span>{conf.emoji}</span>
                                        <span className="text-xs font-bold text-white">{zone.marketLabel}</span>
                                    </div>

                                    <div className="space-y-1">
                                        <TooltipRow label="Surge" value={`${zone.surgeMultiplier.toFixed(1)}x`} highlight />
                                        <TooltipRow label="Tightness" value={`${Math.round(zone.tightnessScore * 100)}%`} />
                                        <TooltipRow label="Active Loads" value={String(zone.activeLoads)} />
                                        <TooltipRow label="Available" value={String(zone.availableEscorts)} />
                                    </div>

                                    {zone.level === "critical" && (
                                        <div className="mt-2 flex items-center gap-1 text-[9px] text-red-400 bg-red-500/10 rounded px-1.5 py-1">
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            High demand — premium rates likely
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}

function TooltipRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50">{label}</span>
            <span className={cn(
                "text-[10px] font-bold",
                highlight ? "text-orange-400" : "text-white/80"
            )}>{value}</span>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// Surge Toggle
// ══════════════════════════════════════════════════════════════

export function SurgeZoneToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border",
                active
                    ? "bg-orange-500/20 border-orange-500/40 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
            )}
        >
            <Flame className="w-3 h-3" />
            Surge
        </button>
    );
}
