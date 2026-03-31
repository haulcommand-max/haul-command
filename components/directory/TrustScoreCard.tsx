"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    Shield, Zap, FileCheck2, Clock, RefreshCcw,
    ChevronRight, Star, TrendingUp, Camera,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// TrustScoreCard — Above-the-fold profile intelligence surface
// Source: lib/trust/composite-trust-engine.ts
// Spec: HC_DOMINATION_PATCH_V1 Phase 1 — Profile Surface
// Shows: composite score, verified jobs, response speed,
//        evidence count, repeat pair rate
// ══════════════════════════════════════════════════════════════

type SpeedBand = "elite" | "fast" | "normal" | "slow";

interface TrustScoreCardProps {
    compositeScore: number;        // 0-100
    verifiedJobCount: number;
    responseSpeedBand: SpeedBand;
    responseSpeedMinutes?: number;
    evidenceCount: number;
    repeatPairRate: number;        // 0-1 (percentage of repeat broker pairs)
    operatorName?: string;
    className?: string;
}

const SPEED_CONFIG: Record<SpeedBand, { label: string; color: string; icon: typeof Zap; bg: string }> = {
    elite: { label: "Elite", color: "#6366f1", icon: Zap, bg: "rgba(99,102,241,0.12)" },
    fast: { label: "Fast", color: "#10b981", icon: Zap, bg: "rgba(16,185,129,0.12)" },
    normal: { label: "Normal", color: "#f59e0b", icon: Clock, bg: "rgba(245,158,11,0.12)" },
    slow: { label: "Slow", color: "#6b7280", icon: Clock, bg: "rgba(107,114,128,0.12)" },
};

function getScoreTier(score: number): { label: string; color: string; ringColor: string } {
    if (score >= 90) return { label: "Verified Elite", color: "#6366f1", ringColor: "stroke-indigo-500" };
    if (score >= 75) return { label: "Trusted", color: "#10b981", ringColor: "stroke-emerald-500" };
    if (score >= 50) return { label: "Established", color: "#f59e0b", ringColor: "stroke-amber-500" };
    if (score >= 25) return { label: "Building", color: "#8b5cf6", ringColor: "stroke-violet-400" };
    return { label: "New", color: "#6b7280", ringColor: "stroke-gray-500" };
}

export function TrustScoreCard({
    compositeScore,
    verifiedJobCount,
    responseSpeedBand,
    responseSpeedMinutes,
    evidenceCount,
    repeatPairRate,
    operatorName,
    className,
}: TrustScoreCardProps) {
    const tier = getScoreTier(compositeScore);
    const speed = SPEED_CONFIG[responseSpeedBand];
    const circumference = 2 * Math.PI * 42;
    const dashOffset = circumference - (compositeScore / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/[0.06] p-5",
                "bg-gradient-to-br from-[#0d1117] via-[#111827] to-[#0f172a]",
                className
            )}
        >
            {/* Subtle glow */}
            <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: tier.color }}
            />

            <div className="flex items-start gap-5">
                {/* Score Ring */}
                <div className="relative flex-shrink-0">
                    <svg width="100" height="100" className="-rotate-90">
                        {/* Background ring */}
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                        {/* Score ring */}
                        <motion.circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke={tier.color}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: dashOffset }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            style={{ filter: `drop-shadow(0 0 6px ${tier.color}40)` }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white tracking-tight">{compositeScore}</span>
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Trust</span>
                    </div>
                </div>

                {/* Right column */}
                <div className="flex-1 min-w-0">
                    {/* Tier badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4" style={{ color: tier.color }} />
                        <span className="text-sm font-extrabold text-white">{tier.label}</span>
                        <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}25` }}
                        >
                            Verified
                        </span>
                    </div>

                    {/* Metric grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Verified Jobs */}
                        <MetricCell
                            icon={FileCheck2}
                            label="Verified Jobs"
                            value={verifiedJobCount > 0 ? String(verifiedJobCount) : "—"}
                            color="#10b981"
                        />

                        {/* Response Speed */}
                        <MetricCell
                            icon={speed.icon}
                            label="Response"
                            value={responseSpeedMinutes ? `${responseSpeedMinutes}m` : speed.label}
                            color={speed.color}
                            badge={speed.label}
                            badgeBg={speed.bg}
                        />

                        {/* Evidence */}
                        <MetricCell
                            icon={Camera}
                            label="Evidence"
                            value={evidenceCount > 0 ? String(evidenceCount) : "—"}
                            color="#8b5cf6"
                        />

                        {/* Repeat Pair Rate */}
                        <MetricCell
                            icon={RefreshCcw}
                            label="Repeat Hire"
                            value={repeatPairRate > 0 ? `${Math.round(repeatPairRate * 100)}%` : "—"}
                            color="#f59e0b"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom: Verified Job Ledger link */}
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <button aria-label="Interactive Button" className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
                            View Verified Job Ledger
                        </span>
                        {verifiedJobCount > 0 && (
                            <span className="text-[9px] font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                                {verifiedJobCount} entries
                            </span>
                        )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </button>
            </div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════
// MetricCell — Reusable stat box
// ══════════════════════════════════════════════════════════════

function MetricCell({
    icon: Icon,
    label,
    value,
    color,
    badge,
    badgeBg,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    badge?: string;
    badgeBg?: string;
}) {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
            <div className="min-w-0">
                <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-white">{value}</span>
                    {badge && (
                        <span
                            className="text-[8px] font-bold px-1 py-0.5 rounded"
                            style={{ color, background: badgeBg }}
                        >
                            {badge}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
