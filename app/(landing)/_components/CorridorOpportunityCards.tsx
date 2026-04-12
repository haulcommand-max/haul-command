"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Flame, TrendingUp, ArrowRight, ChevronRight, Eye,
} from "lucide-react";
import type { CorridorData } from "@/lib/server/data";

interface Props {
    corridors: CorridorData[];
    corridorCount: number;
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
};

function getHeatLevel(score: number) {
    if (score >= 80) return { label: "HOT", color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)" };
    if (score >= 50) return { label: "WARM", color: "#f5b942", bg: "rgba(245,185,66,0.06)", border: "rgba(245,185,66,0.2)" };
    if (score >= 20) return { label: "ACTIVE", color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)" };
    return { label: "COOL", color: "#3b82f6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)" };
}

function estimateRate(heat: number): number {
    if (heat >= 80) return 420;
    if (heat >= 60) return 380;
    if (heat >= 40) return 350;
    if (heat >= 20) return 320;
    return 300;
}

export function CorridorOpportunityCards({ corridors, corridorCount }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    // Auto-scroll animation on mobile
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let raf: number;
        let speed = 0.5; // px per frame
        function step() {
            if (!paused && el) {
                el.scrollLeft += speed;
                // Loop back when reaching end
                if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
                    el.scrollLeft = 0;
                }
            }
            raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [paused]);

    if (!corridors.length) return null;

    return (
        <section className="relative z-10 py-6 sm:py-12">
            <style>{`
                .corridor-scroll {
                    display: flex;
                    gap: 10px;
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    padding-bottom: 4px;
                }
                .corridor-scroll::-webkit-scrollbar { display: none; }
                .corridor-card-mobile {
                    flex: 0 0 200px;
                    scroll-snap-align: start;
                    max-height: 160px;
                }
                .corridor-grid-desktop { display: none; }
                @media (min-width: 768px) {
                    .corridor-scroll { display: none; }
                    .corridor-grid-desktop {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                }
                @media (min-width: 1024px) {
                    .corridor-grid-desktop {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
            `}</style>

            <div className="hc-container max-w-5xl">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={fadeUp}
                    className="flex items-end justify-between mb-4 sm:mb-8"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">
                                Corridor Opportunities
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Where to Run Right Now
                        </h2>
                    </div>
                    <Link aria-label="Navigation Link" href="/corridors" className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.15em] hover:text-[#E0B05C] transition-colors hidden sm:inline-flex items-center gap-1">
                        All {corridorCount} corridors <ArrowRight className="w-3 h-3" />
                    </Link>
                </motion.div>

                {/* MOBILE: Auto-scrolling horizontal cards */}
                <div
                    ref={scrollRef}
                    className="corridor-scroll"
                    onTouchStart={() => setPaused(true)}
                    onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    {corridors.slice(0, 6).map((corridor) => {
                        const heat = getHeatLevel(corridor.heat_score);
                        const rate = estimateRate(corridor.heat_score);
                        return (
                            <Link aria-label="Navigation Link"
                                key={corridor.id}
                                href={`/corridors/${corridor.id}`}
                                className="corridor-card-mobile group rounded-xl border overflow-hidden transition-all"
                                style={{ borderColor: heat.border, background: heat.bg }}
                            >
                                <div className="p-3 flex flex-col h-full">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-black text-white text-[13px] leading-tight line-clamp-2 group-hover:text-[#C6923A] transition-colors">
                                            {corridor.name}
                                        </h3>
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-[0.08em] flex-shrink-0"
                                            style={{ color: heat.color, backgroundColor: `${heat.color}15`, border: `1px solid ${heat.color}30` }}>
                                            {heat.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#8fa3b8] mb-2">
                                        {corridor.loads_7d > 0 && (
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                                                {corridor.loads_7d}/wk
                                            </span>
                                        )}
                                        {corridor.escorts_online > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                                {corridor.escorts_online} on
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-sm font-black text-emerald-400 font-mono">${rate}/d</span>
                                        <span className="text-[9px] font-bold text-[#C6923A] uppercase tracking-wider flex items-center gap-0.5">
                                            Run <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* DESKTOP: Grid cards */}
                <div className="corridor-grid-desktop">
                    {corridors.slice(0, 6).map((corridor, i) => {
                        const heat = getHeatLevel(corridor.heat_score);
                        const rate = estimateRate(corridor.heat_score);
                        return (
                            <div key={corridor.id}
                                className="group relative rounded-2xl border overflow-hidden transition-all hover:translate-y-[-2px]"
                                style={{ borderColor: heat.border, background: heat.bg }}
                            >
                                <div className="absolute top-3 right-3 z-10">
                                    <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-[0.1em]"
                                        style={{ color: heat.color, backgroundColor: `${heat.color}15`, border: `1px solid ${heat.color}30` }}>
                                        {heat.label}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-black text-white text-base mb-1 pr-16 group-hover:text-[#C6923A] transition-colors">
                                        {corridor.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-3 text-[11px] text-[#8fa3b8]">
                                        {corridor.loads_7d > 0 && (
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                                {corridor.loads_7d} loads/7d
                                            </span>
                                        )}
                                        {corridor.escorts_online > 0 && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                {corridor.escorts_online} online
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                        <span className="text-[10px] text-[#5A6577] uppercase tracking-[0.1em]">Est. Rate</span>
                                        <span className="text-base font-black text-emerald-400 font-mono">${rate}/day</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link aria-label="Navigation Link"
                                            href={`/corridors/${corridor.id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white rounded-xl py-2.5 transition-all"
                                            style={{ background: "linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)" }}
                                        >
                                            Run This Corridor <ChevronRight className="w-3 h-3" />
                                        </Link>
                                        <Link aria-label="Navigation Link"
                                            href={`/corridors/${corridor.id}`}
                                            className="flex items-center justify-center w-10 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                                            title="Watch corridor"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-[#8fa3b8]" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-4 sm:hidden">
                    <Link aria-label="Navigation Link" href="/corridors" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#C6923A] uppercase tracking-[0.15em] hover:text-[#E0B05C] transition-colors">
                        View all {corridorCount} corridors <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}