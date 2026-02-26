"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, AlertTriangle, Navigation, ArrowRight } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// WhereToGoNext — Haul Command v4
// Industry painkiller for escort mobile dashboard.
// Tells an escort EXACTLY where to position next.
// One card. One decision. ≤1 tap to act.
// ══════════════════════════════════════════════════════════════

interface WhereToGoNextProps {
    suggestedCity: string;
    suggestedState: string;
    demandSignal: "low" | "building" | "hot" | "critical";
    deadheadMiles?: number;
    deadheadRisk?: "safe" | "moderate" | "risky";
    reasonText?: string;
    className?: string;
}

const DEMAND_CONFIG = {
    low: { label: "Low Demand", bar: "w-1/4", color: "text-hc-muted", bg: "bg-hc-muted" },
    building: { label: "Building", bar: "w-1/2", color: "text-hc-warning", bg: "bg-hc-warning" },
    hot: { label: "High Demand", bar: "w-3/4", color: "text-hc-gold-500", bg: "bg-hc-gold-500" },
    critical: { label: "Critical Need", bar: "w-full", color: "text-hc-danger", bg: "bg-hc-danger" },
};

const DEADHEAD_CONFIG = {
    safe: { label: "Safe Run", color: "text-hc-success", icon: null },
    moderate: { label: "Watch Cost", color: "text-hc-warning", icon: AlertTriangle },
    risky: { label: "High DH Risk", color: "text-hc-danger", icon: AlertTriangle },
};

export function WhereToGoNext({
    suggestedCity,
    suggestedState,
    demandSignal,
    deadheadMiles,
    deadheadRisk = "safe",
    reasonText,
    className,
}: WhereToGoNextProps) {
    const demand = DEMAND_CONFIG[demandSignal];
    const deadhead = DEADHEAD_CONFIG[deadheadRisk];
    const DeadheadIcon = deadhead.icon;
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${suggestedCity}, ${suggestedState}`)}`;

    return (
        <div className={cn(
            "hc-card p-5 space-y-4 relative overflow-hidden",
            demandSignal === "critical" && "border-hc-danger/40 shadow-[0_0_20px_rgba(197,48,48,0.1)]",
            className,
        )}>
            {/* Gold glow for hot/critical demand */}
            {(demandSignal === "hot" || demandSignal === "critical") && (
                <div className="absolute inset-0 bg-radial-gold-glow opacity-30 pointer-events-none" />
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-hc-gold-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-hc-muted">
                            Where to Go Next
                        </span>
                    </div>
                    <span className={cn("text-xs font-black uppercase tracking-wide", demand.color)}>
                        {demand.label}
                    </span>
                </div>

                {/* Destination — the main hero element */}
                <div className="mb-4">
                    <div className="text-3xl font-black text-hc-text tracking-tight">
                        {suggestedCity}
                    </div>
                    <div className="text-sm font-bold text-hc-gold-500 uppercase tracking-widest">
                        {suggestedState}
                    </div>
                </div>

                {/* Demand heat bar */}
                <div className="mb-4">
                    <div className="text-[10px] font-bold text-hc-muted uppercase tracking-widest mb-1.5">
                        Demand Signal
                    </div>
                    <div className="w-full h-2 bg-hc-elevated rounded-full overflow-hidden">
                        <div className={cn(
                            "h-full rounded-full transition-all duration-700",
                            demand.bg,
                            demand.bar,
                            demandSignal === "critical" && "animate-pulse",
                        )} />
                    </div>
                </div>

                {/* Deadhead warning */}
                {deadheadMiles !== undefined && (
                    <div className={cn(
                        "flex items-center gap-2 text-sm font-semibold mb-4",
                        deadhead.color,
                    )}>
                        {DeadheadIcon && <DeadheadIcon className="w-4 h-4 shrink-0" />}
                        <span>{deadheadMiles} mi deadhead</span>
                        <span className="text-hc-subtle">·</span>
                        <span>{deadhead.label}</span>
                    </div>
                )}

                {/* Reason text */}
                {reasonText && (
                    <p className="text-sm text-hc-muted mb-4 leading-relaxed">
                        {reasonText}
                    </p>
                )}

                {/* CTA — one tap to navigate */}
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center justify-center gap-2 w-full",
                        "bg-hc-gold-500 hover:bg-hc-gold-400",
                        "text-hc-bg font-black text-sm uppercase tracking-wide",
                        "rounded-xl min-h-[52px]",
                        "transition-all duration-200 hover:shadow-dispatch",
                    )}
                >
                    <Navigation className="w-4 h-4" />
                    Navigate to {suggestedCity}
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}

export default WhereToGoNext;
