/**
 * OperatorReportCard — full report card panel for escort profile pages
 *
 * Shows composite A+–F grade, sub-score breakdown, key strengths,
 * and improvement signals. Designed for the operator profile page sidebar.
 *
 * Receives data already fetched from operator_report_cards view.
 */

"use client";

import React from "react";
import { OperatorGradeBadge, scoreToGrade } from "@/components/directory/OperatorGradeBadge";
import {
    ShieldCheck, Clock, Map, Star, Zap, Award,
    TrendingUp, AlertTriangle, Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OperatorReportCardData {
    composite_score: number;
    trust_sub: number;
    reliability_sub: number;
    coverage_sub: number;
    pricing_sub: number;
    experience_sub: number;
    market_sub: number;
    review_count: number;
    avg_rating?: number | null;
    complaint_flags?: number;
    loads_completed?: number;
    verified?: boolean;
    twic_verified?: boolean;
    has_high_pole?: boolean;
    states_licensed?: string[];
    service_radius_miles?: number;
    avg_response_seconds?: number;
}

interface SubScore {
    label: string;
    value: number;
    icon: React.ElementType;
    weight: string;
}

function SubScoreBar({ label, value, icon: Icon, weight }: SubScore) {
    const color =
        value >= 80 ? "#F1A91B" :
            value >= 65 ? "#34d399" :
                value >= 50 ? "#60a5fa" :
                    "#f87171";

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                    <span className="text-[10px] font-bold text-white/50">{label}</span>
                    <span className="text-[9px] text-white/20">({weight})</span>
                </div>
                <span className="text-[10px] font-black" style={{ color }}>{value}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, background: color }}
                />
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface OperatorReportCardProps {
    data: OperatorReportCardData;
    compact?: boolean;
}

export function OperatorReportCard({ data, compact = false }: OperatorReportCardProps) {
    const grade = scoreToGrade(data.composite_score);
    const percentile = Math.min(99, Math.max(1, Math.round(data.composite_score)));

    const subScores: SubScore[] = [
        { label: "Trust & Reputation", value: Math.round(data.trust_sub / 25 * 100), icon: ShieldCheck, weight: "25 pts" },
        { label: "Reliability", value: Math.round(data.reliability_sub / 25 * 100), icon: Zap, weight: "25 pts" },
        { label: "Coverage & Speed", value: Math.round(data.coverage_sub / 15 * 100), icon: Map, weight: "15 pts" },
        { label: "Experience & Loads", value: Math.round(data.experience_sub / 15 * 100), icon: Award, weight: "15 pts" },
        { label: "Pricing Position", value: Math.round(data.pricing_sub / 10 * 100), icon: TrendingUp, weight: "10 pts" },
        { label: "Market Performance", value: Math.round(data.market_sub / 10 * 100), icon: Star, weight: "10 pts" },
    ];

    // Derive key strengths (top 3 sub-scores)
    const sorted = [...subScores].sort((a, b) => b.value - a.value);
    const strengths = sorted.filter(s => s.value >= 75).slice(0, 3);
    const flags = sorted.filter(s => s.value < 55).slice(0, 2);

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(4,6,12,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center gap-4 border-b border-white/[0.05]"
                style={{ background: "rgba(241,169,27,0.03)" }}
            >
                <OperatorGradeBadge score={data.composite_score} size="lg" showLabel />
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">
                        Haul Command Operator Grade
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{data.composite_score}</span>
                        <span className="text-xs text-white/30">/ 100</span>
                        <span className="text-[10px] font-bold text-[#F1A91B]/60">
                            Top {100 - percentile + 1}%
                        </span>
                    </div>
                    {data.review_count > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-[#F1A91B]" />
                            <span className="text-xs text-white/40">
                                {data.avg_rating?.toFixed(1)} · {data.review_count} reviews
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-score breakdown */}
            {!compact && (
                <div className="px-5 py-4 border-b border-white/[0.05] space-y-3">
                    <div className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2">
                        Score Breakdown
                    </div>
                    {subScores.map(s => <SubScoreBar key={s.label} {...s} />)}
                </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
                <div className="px-5 py-3 border-b border-white/[0.05]">
                    <div className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" /> Key Strengths
                    </div>
                    <div className="space-y-1">
                        {strengths.map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs text-white/50">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Improvement flags (only show if C or below) */}
            {flags.length > 0 && data.composite_score < 70 && (
                <div className="px-5 py-3 border-b border-white/[0.05]">
                    <div className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-400" /> Improve Grade
                    </div>
                    <div className="space-y-1">
                        {flags.map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-orange-400/60 flex-shrink-0" />
                                <span className="text-xs text-white/40">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer disclaimer */}
            <div className="px-5 py-3">
                <div className="flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-white/20 flex-shrink-0 mt-0.5" />
                    <span className="text-[9px] text-white/20 leading-relaxed">
                        Grade computed from verification status, response speed, equipment certs,
                        coverage area, and customer ratings. Updated in real-time.
                    </span>
                </div>
            </div>
        </div>
    );
}
