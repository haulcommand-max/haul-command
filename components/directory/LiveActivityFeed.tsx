"use client";

// LiveActivityFeed — upgraded to pull real data from /api/feed
// Falls back to empty-state if no events yet.
// Event types: completed_escort | gate_success | new_review_received
//              | photo_uploaded | milestone_unlocked

import React, { useEffect, useState, useRef } from "react";
import { Activity, Truck, DoorOpen, Star, Camera, Award, Route } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface FeedEvent {
    id: string;
    operator_id: string;
    operator_name: string | null;
    operator_state: string | null;
    event_type: string;
    region_code: string | null;
    corridor_key: string | null;
    title: string;
    description: string | null;
    occurred_at: string;
}

interface LiveActivityFeedProps {
    /** Filter by region (e.g. "TX"). If omitted, shows all regions. */
    region?: string;
    /** Filter by corridor key (e.g. "i-10"). Optional. */
    corridor?: string;
    limit?: number;
    /** Poll for new events every N ms (0 = no polling). Default: 60000. */
    pollIntervalMs?: number;
    className?: string;
}

const EVENT_CONFIG: Record<string, {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    defaultTitle: string;
}> = {
    completed_escort: {
        icon: Truck,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        defaultTitle: "Escort completed",
    },
    gate_success: {
        icon: DoorOpen,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        defaultTitle: "Gate access confirmed",
    },
    new_review_received: {
        icon: Star,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        defaultTitle: "New review received",
    },
    photo_uploaded: {
        icon: Camera,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        defaultTitle: "Equipment photo added",
    },
    milestone_unlocked: {
        icon: Award,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        defaultTitle: "Milestone reached",
    },
    // legacy compat
    escort_completed: { icon: Truck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", defaultTitle: "Escort completed" },
    corridor_active: { icon: Route, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", defaultTitle: "Active on corridor" },
    verified: { icon: Star, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", defaultTitle: "Operator verified" },
    review_received: { icon: Star, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", defaultTitle: "Review received" },
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export function LiveActivityFeed({
    region,
    corridor,
    limit = 10,
    pollIntervalMs = 60000,
    className,
}: LiveActivityFeedProps) {
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    async function fetchFeed() {
        try {
            const params = new URLSearchParams({ limit: String(limit) });
            if (region) params.set("region", region);
            if (corridor) params.set("corridor", corridor);
            const res = await fetch(`/api/feed?${params}`);
            if (res.ok) {
                const { events: data } = await res.json();
                setEvents(data ?? []);
            }
        } catch {
            // silently fail — don't crash feed on network error
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFeed();
        if (pollIntervalMs > 0) {
            pollerRef.current = setInterval(fetchFeed, pollIntervalMs);
        }
        return () => {
            if (pollerRef.current) clearInterval(pollerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [region, corridor, limit]);

    if (loading) {
        return (
            <div className={cn("space-y-3", className)}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse" />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className={cn("p-6 text-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl", className)}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#111] mx-auto mb-4 border border-[#222]">
                    <Activity className="w-5 h-5 text-[#555]" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2 tracking-wide uppercase">Activity Building</h4>
                <p className="text-xs text-[#555] max-w-[250px] mx-auto leading-relaxed">
                    Live pulse events will appear here once escorts are matched on the Haul Command network.
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            <AnimatePresence initial={false}>
                {events.map((event, i) => {
                    const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.completed_escort;
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                                "bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#2a2a2a]"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center shrink-0 w-9 h-9 rounded-full border",
                                config.bg, config.border
                            )}>
                                <Icon className={cn("w-4 h-4", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0 mt-0.5">
                                <div className="flex items-start justify-between gap-3 mb-0.5">
                                    <h4 className="text-sm font-bold text-white leading-snug">
                                        {event.title}
                                    </h4>
                                    <span className="text-[10px] uppercase font-bold text-white/25 tracking-widest whitespace-nowrap flex-shrink-0">
                                        {timeAgo(event.occurred_at)}
                                    </span>
                                </div>
                                {event.description && (
                                    <p className="text-[11px] text-[#888] leading-snug">{event.description}</p>
                                )}
                                {(event.operator_name || event.region_code) && (
                                    <p className="text-[10px] text-white/25 mt-1">
                                        {[event.operator_name, event.region_code].filter(Boolean).join(" · ")}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
