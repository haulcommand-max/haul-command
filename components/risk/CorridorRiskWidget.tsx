"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    Shield, AlertTriangle, TrendingUp, Activity, Signal,
    ChevronRight, Clock,
} from "lucide-react";
import { RouteRiskBadge, RiskLayerBreakdown, RouteAdvisoryList } from "./RouteRiskDisplay";
import type { RouteRiskGrade } from "@/lib/risk/risk-layer-registry";

// ══════════════════════════════════════════════════════════════
// CorridorRiskWidget — Web directory corridor page component
// Spec: HCOS-MAP-RISK-LAYERS-01 — corridor_page.widgets
// Shows: corridor risk score, top 3 layers, recent incidents,
//        coverage confidence meter
// ══════════════════════════════════════════════════════════════

interface RecentIncident {
    id: string;
    layerId: string;
    layerName: string;
    severity: number;
    description: string;
    reportedAt: string;
    city?: string;
}

interface CorridorRiskWidgetProps {
    corridorName: string;
    country: string;
    riskScore: number;
    grade: RouteRiskGrade;
    topLayers: { layerId: string; layerName: string; contribution: number; severity: "low" | "medium" | "high" | "critical" }[];
    recentIncidents: RecentIncident[];
    coverageConfidence: number; // 0-100
    signalCount: number;
    lastUpdated?: string;
    className?: string;
}

export function CorridorRiskWidget({
    corridorName, country, riskScore, grade,
    topLayers, recentIncidents, coverageConfidence,
    signalCount, lastUpdated, className,
}: CorridorRiskWidgetProps) {
    const confidenceBand = coverageConfidence <= 35 ? "low" : coverageConfidence <= 70 ? "medium" : "high";
    const bandColors = { low: "#ef4444", medium: "#f59e0b", high: "#10b981" };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "rounded-2xl border border-white/[0.06] bg-[#0d1117] overflow-hidden",
                className
            )}
        >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <RouteRiskBadge grade={grade} score={riskScore} variant="compact" />
                    <div>
                        <div className="text-sm font-bold text-white">{corridorName}</div>
                        <div className="text-[10px] text-white/40">
                            {country} • {signalCount} active signals
                        </div>
                    </div>
                </div>
                {lastUpdated && (
                    <div className="text-[9px] text-white/25 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                )}
            </div>

            {/* Top risk layers breakdown */}
            {topLayers.length > 0 && (
                <div className="px-5 pb-3">
                    <RiskLayerBreakdown
                        layers={topLayers}
                        totalRisk={riskScore}
                        maxLayers={3}
                    />
                </div>
            )}

            {/* Coverage confidence meter */}
            <div className="px-5 pb-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <Signal className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                            Coverage Confidence
                        </span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: bandColors[confidenceBand] }}>
                        {coverageConfidence}%
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: bandColors[confidenceBand] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${coverageConfidence}%` }}
                        transition={{ duration: 0.8 }}
                    />
                </div>
                <div className="flex justify-between mt-0.5">
                    <span className="text-[8px] text-white/20">Low</span>
                    <span className="text-[8px] text-white/20">High</span>
                </div>
            </div>

            {/* Recent incidents feed */}
            {recentIncidents.length > 0 && (
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Activity className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                            Recent Incidents
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {recentIncidents.slice(0, 3).map(inc => (
                            <div
                                key={inc.id}
                                className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                            >
                                <AlertTriangle
                                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                                    style={{
                                        color: inc.severity >= 70 ? "#ef4444"
                                            : inc.severity >= 40 ? "#f59e0b"
                                                : "#6b7280"
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-white/70 truncate">
                                        {inc.layerName}
                                        {inc.city && <span className="text-white/30 ml-1">• {inc.city}</span>}
                                    </div>
                                    <div className="text-[9px] text-white/40 truncate">{inc.description}</div>
                                    <div className="text-[8px] text-white/20 mt-0.5">
                                        {new Date(inc.reportedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.04] flex items-center justify-between">
                <span className="text-[9px] text-white/20">
                    Risk data from {signalCount} signals across {topLayers.length} layers
                </span>
                <button aria-label="Interactive Button" className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    Full report <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
}
