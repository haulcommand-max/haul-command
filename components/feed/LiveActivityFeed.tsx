"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Zap, MapPin, ShieldCheck, AlertTriangle, DollarSign } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// LiveActivityFeed — Haul Command
// Real-time scrolling ticker of platform events.
// Supabase Realtime subscription. NO WebSockets to manage.
// Events: escort online, load posted, match completed, rate alert.
// ══════════════════════════════════════════════════════════════

export type ActivityEventType =
    | "escort_online"
    | "load_posted"
    | "match_completed"
    | "rate_surge"
    | "corridor_hot"
    | "escort_verified";

export interface ActivityEvent {
    id: string;
    type: ActivityEventType;
    label: string;
    sublabel?: string;
    region?: string;
    ts: number; // unix ms
}

// ── Event type → color mapping (matches YAML event_color_coding) ──
const EVENT_CONFIG: Record<ActivityEventType, {
    icon: React.ElementType;
    iconClass: string;
    barColor: string;       // left status bar color
    glowColor: string;      // highlight glow
    bgHighlight: string;    // row bg when highlighted
}> = {
    load_posted: { icon: Zap, iconClass: "text-[#38BDF8]", barColor: "bg-[#38BDF8]", glowColor: "shadow-[0_0_12px_rgba(56,189,248,0.18)]", bgHighlight: "bg-[#38BDF8]/[0.04]" },
    escort_online: { icon: ShieldCheck, iconClass: "text-hc-success", barColor: "bg-hc-success", glowColor: "shadow-[0_0_12px_rgba(34,197,94,0.18)]", bgHighlight: "bg-hc-success/[0.04]" },
    match_completed: { icon: ShieldCheck, iconClass: "text-hc-gold-500", barColor: "bg-hc-gold-500", glowColor: "shadow-[0_0_12px_rgba(198,146,58,0.22)]", bgHighlight: "bg-hc-gold-500/[0.05]" },
    rate_surge: { icon: DollarSign, iconClass: "text-hc-warning", barColor: "bg-hc-warning", glowColor: "shadow-[0_0_12px_rgba(245,158,11,0.18)]", bgHighlight: "bg-hc-warning/[0.04]" },
    corridor_hot: { icon: AlertTriangle, iconClass: "text-hc-warning", barColor: "bg-hc-warning", glowColor: "shadow-[0_0_12px_rgba(245,158,11,0.18)]", bgHighlight: "bg-hc-warning/[0.04]" },
    escort_verified: { icon: ShieldCheck, iconClass: "text-hc-success", barColor: "bg-hc-success", glowColor: "shadow-[0_0_12px_rgba(34,197,94,0.18)]", bgHighlight: "bg-hc-success/[0.04]" },
};

function timeAgo(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

interface LiveActivityFeedProps {
    /** Supabase-driven events — pass [] to use demo mode */
    events?: ActivityEvent[];
    maxVisible?: number;
    className?: string;
    compact?: boolean;
}

// Demo seed events to use when no real Supabase data is wired up
const DEMO_EVENTS: ActivityEvent[] = [
    { id: "d1", type: "load_posted", label: "New load posted — Houston TX → El Paso TX", sublabel: "$1,450 · 3-car escort", region: "TX", ts: Date.now() - 12000 },
    { id: "d2", type: "escort_online", label: "Wildcat Escort Services went available", sublabel: "I-10 Corridor", region: "LA", ts: Date.now() - 45000 },
    { id: "d3", type: "match_completed", label: "Match confirmed — Seminole Heavy Haul", sublabel: "Fill time: 4 min", region: "FL", ts: Date.now() - 90000 },
    { id: "d4", type: "corridor_hot", label: "I-40 corridor is heating up", sublabel: "12 open loads · 3 pilots", region: "NM", ts: Date.now() - 150000 },
    { id: "d5", type: "rate_surge", label: "Rate surge detected — Gulf Coast", sublabel: "+22% vs. avg", region: "MS", ts: Date.now() - 240000 },
    { id: "d6", type: "escort_verified", label: "Iron Horse Pilot Cars got verified", sublabel: "Document compliance ✓", region: "OK", ts: Date.now() - 310000 },
    { id: "d7", type: "load_posted", label: "New load posted — Atlanta GA → Nashville TN", sublabel: "$980 · 2-car escort", region: "GA", ts: Date.now() - 480000 },
    { id: "d8", type: "escort_online", label: "Delta Oversize Escorts went available", sublabel: "Southeast Corridor", region: "AL", ts: Date.now() - 600000 },
];

// ── Priority levels per event type ──
type EventPriority = "critical" | "high" | "medium" | "low";

const EVENT_PRIORITY: Record<ActivityEventType, EventPriority> = {
    load_posted: "high",
    escort_online: "medium",
    match_completed: "high",
    rate_surge: "high",
    corridor_hot: "high",
    escort_verified: "medium",
};

const PRIORITY_CHIP: Record<EventPriority, { label: string; className: string }> = {
    critical: { label: "CRITICAL", className: "bg-hc-danger/15 text-hc-danger border-hc-danger/30" },
    high: { label: "HIGH", className: "bg-hc-warning/15 text-hc-warning border-hc-warning/30" },
    medium: { label: "MED", className: "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20" },
    low: { label: "LOW", className: "bg-hc-elevated text-hc-subtle border-hc-border" },
};

export function LiveActivityFeed({
    events,
    maxVisible = 6,
    className,
    compact = false,
}: LiveActivityFeedProps) {
    const feed = (events && events.length > 0 ? events : DEMO_EVENTS).slice(0, maxVisible);
    const [highlighted, setHighlighted] = useState<string | null>(null);

    // 16s hold — highlight stays long enough for user to read
    useEffect(() => {
        if (events && events.length > 0) return;
        let i = 0;
        const interval = setInterval(() => {
            setHighlighted(DEMO_EVENTS[i % DEMO_EVENTS.length].id);
            i++;
        }, 16000);
        // Kick off immediately on mount
        setHighlighted(DEMO_EVENTS[0].id);
        return () => clearInterval(interval);
    }, [events]);

    return (
        <div className={cn("flex flex-col gap-0", className)}>
            {/* PULSE Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hc-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-hc-success" />
                    </span>
                    <div>
                        <span className="text-[10px] font-black text-hc-text uppercase tracking-[0.25em]">Pulse</span>
                        <span className="text-[10px] text-hc-subtle ml-2 font-medium normal-case tracking-normal">live market activity</span>
                    </div>
                </div>
                <span className="text-[10px] text-hc-subtle font-semibold">{feed.length} events</span>
            </div>

            {/* Feed — heartbeat mode, zebra rows, priority chips */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-hc-border">
                <AnimatePresence>
                    {feed.map((event, i) => {
                        const cfg = EVENT_CONFIG[event.type];
                        const Icon = cfg.icon;
                        const isNew = highlighted === event.id;
                        const priority = EVENT_PRIORITY[event.type];
                        const chip = PRIORITY_CHIP[priority];
                        // Zebra: even rows layer_a (#111214 = hc-surface), odd rows layer_b (#16181B = hc-elevated)
                        const zebraBg = i % 2 === 0 ? "bg-hc-surface" : "bg-hc-elevated";

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ delay: i * 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                className={cn(
                                    "relative flex items-center gap-3 pl-0 pr-4 py-3.5 transition-all duration-500 border-b border-hc-border-bare last:border-b-0",
                                    isNew ? cn(cfg.bgHighlight, cfg.glowColor) : zebraBg,
                                )}
                            >
                                {/* Left color bar — event type indicator */}
                                <div className={cn("w-[4px] self-stretch shrink-0 rounded-r-full", cfg.barColor)} />

                                {/* Icon chip */}
                                <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                    "bg-hc-elevated border border-hc-border"
                                )}>
                                    <Icon className={cn("w-3.5 h-3.5", cfg.iconClass)} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                        {/* Priority chip */}
                                        {priority !== "low" && (
                                            <span className={cn(
                                                "inline-flex items-center px-1.5 py-0 rounded text-[9px] font-black uppercase tracking-widest border",
                                                chip.className
                                            )}>
                                                {chip.label}
                                            </span>
                                        )}
                                        <p className="text-xs font-semibold text-hc-text truncate">
                                            {event.label}
                                        </p>
                                    </div>
                                    {!compact && event.sublabel && (
                                        <p className="text-[10px] text-hc-subtle truncate">
                                            {event.sublabel}
                                        </p>
                                    )}
                                </div>

                                {/* Region + time */}
                                <div className="flex flex-col items-end shrink-0 gap-0.5">
                                    {event.region && (
                                        <span className="text-[10px] font-black text-hc-gold-500 tracking-widest">{event.region}</span>
                                    )}
                                    <span className="text-[10px] text-hc-subtle tabular-nums">{timeAgo(event.ts)}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default LiveActivityFeed;

