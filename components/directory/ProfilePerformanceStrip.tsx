"use client";

import React from "react";
import { CheckCircle2, Clock, Zap, Map, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// ProfilePerformanceStrip — Section 2 Live Strip
// Displays: Completed Escorts, On-Time Reliability, Median Response, 
// Corridors Served, Last Active.
// ══════════════════════════════════════════════════════════════

interface ProfilePerformanceStripProps {
    completedEscorts?: number;
    reliabilityScore?: number;
    medianResponseTimeStr?: string; // e.g. "14m"
    corridorsServed?: number;
    lastActiveStr?: string; // e.g. "2h ago"
    className?: string;
}

export function ProfilePerformanceStrip({
    completedEscorts = 0,
    reliabilityScore = 0,
    medianResponseTimeStr = "N/A",
    corridorsServed = 0,
    lastActiveStr = "Unknown",
    className,
}: ProfilePerformanceStripProps) {

    const metrics = [
        {
            icon: CheckCircle2,
            label: "Completed",
            value: completedEscorts > 0 ? completedEscorts : "-",
            textClass: "text-hc-success",
        },
        {
            icon: Clock,
            label: "On-Time",
            value: reliabilityScore > 0 ? `${reliabilityScore}%` : "-",
            textClass: reliabilityScore >= 90 ? "text-emerald-500" : "text-hc-text",
        },
        {
            icon: Zap,
            label: "Response",
            value: medianResponseTimeStr,
            textClass: "text-hc-gold-500",
        },
        {
            icon: Map,
            label: "Corridors",
            value: corridorsServed > 0 ? corridorsServed : "-",
            textClass: "text-hc-text",
        },
        {
            icon: Activity,
            label: "Last Active",
            value: lastActiveStr,
            textClass: "text-hc-subtle",
        }
    ];

    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-3", className)}>
            {metrics.map((m, i) => (
                <div
                    key={m.label}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-hc-elevated to-transparent border border-hc-border-bare hover:border-hc-border transition-colors duration-200"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <m.icon className="w-3.5 h-3.5 text-hc-subtle" />
                        <span className="text-[10px] font-bold text-hc-subtle uppercase tracking-widest">{m.label}</span>
                    </div>
                    <div className={cn("text-2xl font-black tracking-tight", m.textClass)}>
                        {m.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
