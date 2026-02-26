"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Flame, TrendingUp, Zap, AlertTriangle } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// CorridorPulseBanner — Haul Command
// Animated banner that appears when a corridor is heating up.
// Shows the corridor name, load count, available escorts, and
// a pulsing gold heat indicator. Cycles through hot corridors.
// ══════════════════════════════════════════════════════════════

export interface HotCorridor {
    slug: string;          // e.g. "i-10-tx-la"
    label: string;         // e.g. "I-10 · TX → LA"
    openLoads: number;
    availableEscorts: number;
    avgRate: number;
    heat: "building" | "hot" | "critical";
}

interface CorridorPulseBannerProps {
    corridors: HotCorridor[];
    className?: string;
}

const HEAT_CONFIG = {
    building: {
        label: "Building",
        bg: "from-hc-gold-500/[0.06] to-transparent",
        border: "border-hc-gold-500/20",
        dot: "bg-hc-gold-500/60",
        icon: TrendingUp,
        iconColor: "text-hc-gold-500",
        badgeColor: "text-hc-gold-500",
    },
    hot: {
        label: "Hot",
        bg: "from-hc-gold-500/[0.12] to-transparent",
        border: "border-hc-gold-500/40",
        dot: "bg-hc-gold-500",
        icon: Flame,
        iconColor: "text-hc-gold-500",
        badgeColor: "text-hc-gold-500",
    },
    critical: {
        label: "Critical",
        bg: "from-hc-warning/[0.12] to-transparent",
        border: "border-hc-warning/40",
        dot: "bg-hc-warning",
        icon: AlertTriangle,
        iconColor: "text-hc-warning",
        badgeColor: "text-hc-warning",
    },
};

// Demo data when none provided
const DEMO_CORRIDORS: HotCorridor[] = [
    { slug: "i-10", label: "I-10 · TX → LA", openLoads: 14, availableEscorts: 3, avgRate: 1340, heat: "critical" },
    { slug: "i-40", label: "I-40 · AZ → NM", openLoads: 8, availableEscorts: 5, avgRate: 980, heat: "hot" },
    { slug: "gulf", label: "Gulf Coast · MS→AL", openLoads: 6, availableEscorts: 4, avgRate: 870, heat: "building" },
    { slug: "i-75", label: "I-75 · GA → TN", openLoads: 4, availableEscorts: 6, avgRate: 720, heat: "building" },
];

export function CorridorPulseBanner({ corridors, className }: CorridorPulseBannerProps) {
    const feed = corridors.length > 0 ? corridors : DEMO_CORRIDORS;
    const [activeIdx, setActiveIdx] = useState(0);
    const active = feed[activeIdx];
    const cfg = HEAT_CONFIG[active.heat];
    const Icon = cfg.icon;

    // Auto-cycle through corridors every 4 seconds
    useEffect(() => {
        const t = setInterval(() => {
            setActiveIdx(i => (i + 1) % feed.length);
        }, 4000);
        return () => clearInterval(t);
    }, [feed.length]);

    return (
        <div className={cn("relative overflow-hidden rounded-2xl border", cfg.border, className)}>
            {/* Animated gradient background */}
            <div className={cn("absolute inset-0 bg-gradient-to-r", cfg.bg, "pointer-events-none")} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={active.slug}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="relative z-10 flex items-center gap-4 px-5 py-4"
                >
                    {/* Heat pulse dot */}
                    <div className="relative shrink-0">
                        <span className="relative flex h-3 w-3">
                            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", cfg.dot)} />
                            <span className={cn("relative inline-flex rounded-full h-3 w-3", cfg.dot)} />
                        </span>
                    </div>

                    {/* Icon */}
                    <Icon className={cn("w-5 h-5 shrink-0", cfg.iconColor)} />

                    {/* Corridor info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", cfg.badgeColor)}>
                                {cfg.label}
                            </span>
                            <span className="text-sm font-black text-hc-text uppercase tracking-tight">
                                {active.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-hc-muted">
                            <span><strong className="text-hc-text">{active.openLoads}</strong> open loads</span>
                            <span>·</span>
                            <span><strong className="text-hc-text">{active.availableEscorts}</strong> pilots available</span>
                            <span>·</span>
                            <span><strong className="text-hc-gold-500">${active.avgRate.toLocaleString()}</strong> avg</span>
                        </div>
                    </div>

                    {/* Corridor dots indicator */}
                    <div className="flex gap-1.5 shrink-0">
                        {feed.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIdx(i)}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                    i === activeIdx ? cfg.dot + " scale-125" : "bg-hc-border"
                                )}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default CorridorPulseBanner;
