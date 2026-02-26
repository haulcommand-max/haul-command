"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// RecentlyFilledStrip — Haul Command (v2 — live data)
//
// Fetches from /api/recently-filled (60s cache).
// Falls back to demo data while loading or if API fails.
// Auto-scrolling ticker proves demand + liquidity.
// ══════════════════════════════════════════════════════════════

interface FilledItem {
    job_id: string;
    origin_city: string;
    origin_region: string;
    dest_city: string;
    dest_region: string;
    escort_type: string;
    fill_minutes: number;
    filled_ago_label: string;
}

const DEMO_ITEMS: FilledItem[] = [
    { job_id: "d1", origin_city: "Houston", origin_region: "TX", dest_city: "Baton Rouge", dest_region: "LA", escort_type: "Pilot Car", fill_minutes: 3, filled_ago_label: "4m ago" },
    { job_id: "d2", origin_city: "Atlanta", origin_region: "GA", dest_city: "Columbia", dest_region: "SC", escort_type: "High Pole", fill_minutes: 7, filled_ago_label: "12m ago" },
    { job_id: "d3", origin_city: "Dallas", origin_region: "TX", dest_city: "OKC", dest_region: "OK", escort_type: "Pilot Car", fill_minutes: 2, filled_ago_label: "18m ago" },
    { job_id: "d4", origin_city: "Knoxville", origin_region: "TN", dest_city: "Roanoke", dest_region: "VA", escort_type: "Escort", fill_minutes: 11, filled_ago_label: "31m ago" },
    { job_id: "d5", origin_city: "Phoenix", origin_region: "AZ", dest_city: "Albuquerque", dest_region: "NM", escort_type: "Pilot Car", fill_minutes: 5, filled_ago_label: "44m ago" },
    { job_id: "d6", origin_city: "Memphis", origin_region: "TN", dest_city: "Little Rock", dest_region: "AR", escort_type: "Steersman", fill_minutes: 19, filled_ago_label: "1h ago" },
];

function fillSpeedColor(minutes: number): string {
    if (minutes <= 5) return "text-hc-success";
    if (minutes <= 15) return "text-hc-gold-500";
    return "text-hc-muted";
}

interface RecentlyFilledStripProps {
    className?: string;
}

export function RecentlyFilledStrip({ className }: RecentlyFilledStripProps) {
    const [items, setItems] = useState<FilledItem[]>(DEMO_ITEMS);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Manual fetch with 60s refresh — avoids needing SWR as a dependency
    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const res = await fetch("/api/recently-filled", { cache: "no-store" });
                if (!res.ok) return;
                const json = await res.json();
                if (active && Array.isArray(json.items) && json.items.length > 0) {
                    setItems(json.items);
                }
            } catch {
                // keep demo data on error — strip always shows
            }
        }

        load();
        const interval = setInterval(load, 60_000);
        return () => { active = false; clearInterval(interval); };
    }, []);

    // Auto-scroll ticker
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let frame: number;
        let paused = false;

        function tick() {
            if (!paused && el) {
                el.scrollLeft += 0.4;
                if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
            }
            frame = requestAnimationFrame(tick);
        }

        frame = requestAnimationFrame(tick);
        const pause = () => { paused = true; };
        const resume = () => { paused = false; };
        el.addEventListener("mouseenter", pause);
        el.addEventListener("mouseleave", resume);
        el.addEventListener("touchstart", pause, { passive: true });
        el.addEventListener("touchend", resume);
        return () => {
            cancelAnimationFrame(frame);
            el.removeEventListener("mouseenter", pause);
            el.removeEventListener("mouseleave", resume);
        };
    }, [items]);

    return (
        <div className={cn("w-full space-y-2", className)}>
            {/* Label */}
            <div className="flex items-center gap-2 px-1">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hc-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-hc-success" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-hc-muted">
                    Recently Filled
                </span>
                <span className="text-[10px] text-hc-subtle">— proof the market is moving</span>
            </div>

            {/* Scrolling strip */}
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-none pb-1 cursor-grab active:cursor-grabbing select-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {/* Double the array for seamless loop */}
                {[...items, ...items].map((item, i) => {
                    // Data mapping for job types
                    const typeMap: Record<string, string> = {
                        pevo_lead_chase: "Lead Chase",
                        pevo_pilot: "Pilot Car",
                        pevo_high_pole: "High Pole",
                        pevo_steersman: "Steersman",
                        pevo_route_survey: "Route Survey",
                        pevo_superload: "Superload",
                        escort: "Escort",
                        pilot_car: "Pilot Car",
                        high_pole: "High Pole",
                        steersman: "Steersman"
                    };
                    const displayType = typeMap[item.escort_type] || item.escort_type;

                    return (
                        <div
                            key={`${item.job_id}-${i}`}
                            className="flex-none flex items-start gap-3 px-4 py-2.5 bg-hc-surface border border-hc-border rounded-xl text-xs hover:border-hc-border-high transition-colors"
                            style={{ minHeight: "68px" }}
                        >
                            {/* Route */}
                            <div className="flex flex-col gap-1 items-start min-w-0 pr-4">
                                <span className="font-black text-hc-text leading-[1.5]">
                                    {item.origin_city}, {item.origin_region}
                                    <span className="text-hc-subtle mx-1">→</span>
                                    {item.dest_city}, {item.dest_region}
                                </span>
                                <div className="flex items-center gap-2.5 mt-0.5 leading-[1.45]">
                                    {/* Type */}
                                    <span className="px-1.5 py-0.5 bg-hc-elevated border border-hc-border-bare rounded text-[10px] text-hc-muted font-semibold uppercase tracking-wide">
                                        {displayType}
                                    </span>
                                    {/* When */}
                                    <span className="flex items-center gap-1 text-hc-subtle font-medium">
                                        <Clock className="w-3 h-3" />
                                        {item.filled_ago_label}
                                    </span>
                                </div>
                            </div>

                            {/* Fill speed — the psychological hook */}
                            <div className="shrink-0 pt-0.5 border-l border-hc-border-bare pl-4 ml-auto self-start">
                                <span className={cn("flex flex-col gap-1 font-black", fillSpeedColor(item.fill_minutes))}>
                                    <div className="flex items-center gap-1">
                                        {item.fill_minutes <= 5 ? <Zap className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                        <span className="leading-none">{item.fill_minutes}m</span>
                                    </div>
                                    <span className="text-[9px] text-hc-muted uppercase tracking-wider font-semibold">T-to-fill</span>
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default RecentlyFilledStrip;
