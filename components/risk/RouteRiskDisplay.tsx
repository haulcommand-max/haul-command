"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    Shield, AlertTriangle, ChevronRight, Zap, Layers,
    Droplets, Wind, Flame, Snowflake, MapPin, Scale,
    Construction, Clock, EyeOff, Mountain, ThermometerSun,
} from "lucide-react";
import type { RouteRiskGrade } from "@/lib/risk/risk-layer-registry";

// ══════════════════════════════════════════════════════════════
// RouteRiskBadge — Grade badge (A–F) for routes and corridors
// Spec: HCOS-MAP-RISK-LAYERS-01 — route_planner.features
// Used on: corridor pages (web), route planner (mobile)
// ══════════════════════════════════════════════════════════════

const GRADE_CONFIG: Record<RouteRiskGrade, {
    bg: string; text: string; border: string; glow: string; label: string;
}> = {
    A: { bg: "from-emerald-500/15 to-emerald-600/5", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/10", label: "Very Low Risk" },
    B: { bg: "from-green-500/15 to-green-600/5", text: "text-green-400", border: "border-green-500/30", glow: "shadow-green-500/10", label: "Low Risk" },
    C: { bg: "from-amber-500/15 to-amber-600/5", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/10", label: "Moderate Risk" },
    D: { bg: "from-orange-500/15 to-orange-600/5", text: "text-orange-400", border: "border-orange-500/30", glow: "shadow-orange-500/10", label: "High Risk" },
    F: { bg: "from-red-500/15 to-red-600/5", text: "text-red-400", border: "border-red-500/30", glow: "shadow-red-500/10", label: "Severe Risk" },
};

interface RouteRiskBadgeProps {
    grade: RouteRiskGrade;
    score?: number;
    variant?: "compact" | "full";
    className?: string;
}

export function RouteRiskBadge({ grade, score, variant = "compact", className }: RouteRiskBadgeProps) {
    const conf = GRADE_CONFIG[grade];

    if (variant === "compact") {
        return (
            <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
                `bg-gradient-to-r ${conf.bg} ${conf.border}`,
                className
            )}>
                <span className={cn("text-sm font-black", conf.text)}>{grade}</span>
                {score !== undefined && (
                    <span className="text-[9px] font-bold text-white/40">{Math.round(score)}</span>
                )}
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl border",
            `bg-gradient-to-r ${conf.bg} ${conf.border} shadow-lg ${conf.glow}`,
            className
        )}>
            <div className={cn("text-2xl font-black", conf.text)}>{grade}</div>
            <div>
                <div className={cn("text-xs font-bold", conf.text)}>{conf.label}</div>
                {score !== undefined && (
                    <div className="text-[10px] text-white/40">Risk score: {Math.round(score)}/100</div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// RiskLayerBreakdown — Per-layer risk contribution display
// Shows which risk layers are active on a route/corridor
// ══════════════════════════════════════════════════════════════

const LAYER_ICONS: Record<string, React.ElementType> = {
    low_bridge_clearance: AlertTriangle,
    landslide_mudslide: Mountain,
    flood_flash_flood: Droplets,
    extreme_wind: Wind,
    extreme_heat: ThermometerSun,
    wildfire_smoke: Flame,
    winter_ice_snow: Snowflake,
    seasonal_weight_restrictions: Scale,
    road_quality_pothole: Construction,
    security_cargo_theft: Shield,
    escort_rule_variability: Zap,
    urban_restriction_zones: MapPin,
    movable_bridge_timing: Clock,
    sandstorm_visibility: EyeOff,
};

interface LayerContribution {
    layerId: string;
    layerName: string;
    contribution: number;
    severity: "low" | "medium" | "high" | "critical";
}

interface RiskLayerBreakdownProps {
    layers: LayerContribution[];
    totalRisk: number;
    maxLayers?: number;
    className?: string;
}

export function RiskLayerBreakdown({
    layers, totalRisk, maxLayers = 5, className,
}: RiskLayerBreakdownProps) {
    const sorted = [...layers].sort((a, b) => b.contribution - a.contribution).slice(0, maxLayers);

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Risk Breakdown
                </span>
            </div>

            {sorted.map((layer, i) => {
                const Icon = LAYER_ICONS[layer.layerId] || AlertTriangle;
                const pct = totalRisk > 0 ? (layer.contribution / totalRisk) * 100 : 0;
                const sevColor = layer.severity === "critical" ? "#ef4444"
                    : layer.severity === "high" ? "#f97316"
                        : layer.severity === "medium" ? "#f59e0b"
                            : "#10b981";

                return (
                    <motion.div
                        key={layer.layerId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2"
                    >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sevColor }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/60 truncate">{layer.layerName}</span>
                                <span className="text-[10px] font-bold" style={{ color: sevColor }}>
                                    {Math.round(pct)}%
                                </span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 mt-0.5 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: sevColor }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// RouteAdvisoryList — Actionable risk advisories
// ══════════════════════════════════════════════════════════════

interface AdvisoryItem {
    layerId: string;
    severity: "info" | "warning" | "critical";
    message: string;
    actionable: string[];
}

interface RouteAdvisoryListProps {
    advisories: AdvisoryItem[];
    className?: string;
}

const SEV_STYLES = {
    critical: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: AlertTriangle },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: AlertTriangle },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: Shield },
};

export function RouteAdvisoryList({ advisories, className }: RouteAdvisoryListProps) {
    if (advisories.length === 0) return null;

    return (
        <div className={cn("space-y-2", className)}>
            {advisories.map((adv, i) => {
                const style = SEV_STYLES[adv.severity];
                const Icon = style.icon;
                return (
                    <motion.div
                        key={`${adv.layerId}-${i}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn("rounded-xl border p-3", style.bg, style.border)}
                    >
                        <div className="flex items-start gap-2">
                            <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", style.text)} />
                            <div className="flex-1 min-w-0">
                                <div className={cn("text-xs font-bold", style.text)}>{adv.message}</div>
                                {adv.actionable.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {adv.actionable.map(action => (
                                            <span
                                                key={action}
                                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/[0.06]"
                                            >
                                                {action.replace(/_/g, " ")}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
