"use client";

import React from "react";
import { Zap, Clock, Users, Activity, Lock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

// ══════════════════════════════════════════════════════════════
// PredictedFillIntelligence — Profile Section 5
// Data monetization wedge displaying operational probabilities.
// ══════════════════════════════════════════════════════════════

interface PredictedFillIntelligenceProps {
    fillProbabilityPct?: number; // e.g., 88
    estimatedResponseMins?: string; // e.g., "5-15"
    marketTightness?: "Loose" | "Moderate" | "Tight" | "Extreme";
    isProTier?: boolean; // Controls gating of premium intelligence
    className?: string;
}

export function PredictedFillIntelligence({
    fillProbabilityPct = 82,
    estimatedResponseMins = "10-25",
    marketTightness = "Tight",
    isProTier = false,
    className,
}: PredictedFillIntelligenceProps) {
    return (
        <div className={cn("bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] rounded-[2rem] p-6 lg:p-8 relative overflow-hidden", className)}>
            {/* Background flourish */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Predicted Fill Intelligence</h2>
                    <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Haul Command Data Network</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* 1. Fill Probability */}
                <div className="flex flex-col gap-2 p-5 bg-[#141414] border border-[#222] rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#888] uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-[#555]" />
                            Fill Probability
                        </span>
                        {isProTier && <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Pro</span>}
                    </div>

                    {!isProTier ? (
                        <div className="flex flex-col items-start gap-2 h-full justify-center">
                            <Lock className="w-6 h-6 text-[#444] mb-1" />
                            <div className="text-xs font-bold text-[#888]">Unlock Pro for insights</div>
                        </div>
                    ) : (
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black text-white tracking-tighter leading-none">{fillProbabilityPct}<span className="text-2xl text-[#666]">%</span></span>
                            <span className="text-xs text-emerald-500 font-bold mb-1 pb-1 border-b border-emerald-500/20">High Match</span>
                        </div>
                    )}
                </div>

                {/* 2. Estimated Response */}
                <div className="flex flex-col gap-2 p-5 bg-[#141414] border border-[#222] rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F1A91B]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#888] uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#555]" />
                            Est. Response
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter leading-none">{estimatedResponseMins}</span>
                        <span className="text-sm font-bold text-[#666] mb-1">mins</span>
                    </div>
                </div>

                {/* 3. Market Tightness */}
                <div className="flex flex-col gap-2 p-5 bg-[#141414] border border-[#222] rounded-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-[#888] uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#555]" />
                            Market Tightness
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "px-3 py-1.5 rounded-lg border text-sm font-black uppercase tracking-widest",
                            marketTightness === "Tight" || marketTightness === "Extreme" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                marketTightness === "Moderate" ? "bg-[#F1A91B]/10 text-[#F1A91B] border-[#F1A91B]/20" :
                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                            {marketTightness}
                        </div>
                    </div>
                    <p className="text-[10px] text-[#555] mt-auto uppercase tracking-wide">Capacity is constrained</p>
                </div>
            </div>

            {/* Suggested Backups Teaser - another monetization hook */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#111] border border-[#222] rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#111] flex items-center justify-center">
                                <span className="text-[10px] text-[#444] font-bold">?</span>
                            </div>
                        ))}
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider">Suggested Backups</div>
                        <div className="text-[10px] text-[#666]">3 alternative operators active on this corridor</div>
                    </div>
                </div>
                {!isProTier && (
                    <button className="text-[10px] font-bold text-[#F1A91B] uppercase tracking-widest px-4 py-2 bg-[#F1A91B]/10 hover:bg-[#F1A91B]/20 rounded-lg transition-colors whitespace-nowrap">
                        Unlock Network View
                    </button>
                )}
            </div>
        </div>
    );
}
