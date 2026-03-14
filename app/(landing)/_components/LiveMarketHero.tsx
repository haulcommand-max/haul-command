"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight, TrendingUp, Flame, Radio, Shield, Search,
    MapPin, FileCheck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   LIVE MARKET HERO — Command-Center Surface
   Replaces the old marketing hero with a live market panel
   that immediately shows useful state + role router.
   ═══════════════════════════════════════════════════════════════ */

interface LiveMarketHeroProps {
    totalOperators: number;
    corridorCount: number;
    openLoads: number;
    medianFillMin: number;
    hotCorridor?: string;
    hotCorridorDelta?: number;
    avgRate?: number;
}

// ── Animated counter ──
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!value) return;
        let s = 0;
        const dur = 1000;
        const step = Math.max(1, Math.ceil(dur / value));
        const timer = setInterval(() => {
            s += Math.max(1, Math.ceil(value / 30));
            if (s >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(s);
        }, step);
        return () => clearInterval(timer);
    }, [value]);
    if (!value) return <span className="text-[#3A4553]">—</span>;
    return <span>{display.toLocaleString("en-US")}{suffix}</span>;
}

export function LiveMarketHero({
    totalOperators,
    corridorCount,
    openLoads,
    medianFillMin,
    hotCorridor = "Texas Gulf Coast",
    hotCorridorDelta = 12,
    avgRate = 380,
}: LiveMarketHeroProps) {
    return (
        <section className="relative z-10">
            {/* Subtle background radial */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(198,146,58,0.08),transparent_60%)]" />
            </div>

            <div className="hc-container relative z-10 pb-6 pt-6 sm:pt-10 sm:pb-8">
                {/* ── LIVE MARKET LABEL ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-center gap-2 mb-5"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 800, color: '#22c55e',
                        textTransform: 'uppercase', letterSpacing: '0.2em',
                    }}>Live Escort Market</span>
                </motion.div>

                {/* ── TOP-LINE METRICS — Three big numbers ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto mb-6"
                >
                    {[
                        { value: totalOperators, label: "Verified Escorts", color: "#22c55e" },
                        { value: corridorCount, label: "Active Corridors", color: "#a855f7" },
                        { value: avgRate, label: "Avg Rate/Day", color: "#C6923A", prefix: "$" },
                    ].map(({ value, label, color, prefix }) => (
                        <div key={label} className="text-center">
                            <div className="text-xl sm:text-3xl font-black tracking-tight" style={{ color, fontFamily: "var(--font-mono, monospace)" }}>
                                {prefix || ""}<Counter value={value} />
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-1">
                                {label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* ── HOTTEST CORRIDOR CHIP ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="flex justify-center mb-6"
                >
                    <Link href="/corridors" className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12] transition-all">
                        <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-red-400 uppercase tracking-[0.15em]">Hottest Corridor</div>
                            <div className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                                {hotCorridor}
                                <span className="text-red-400 ml-2 text-xs font-mono">+{hotCorridorDelta}%</span>
                            </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-red-400/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </Link>
                </motion.div>

                {/* ── ROLE ROUTER — "What are you here to do?" ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    <div className="text-center text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.15em] mb-3">
                        What do you need?
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
                        {[
                            {
                                href: "/loads/post",
                                icon: MapPin,
                                label: "Post a Load",
                                desc: "Find escorts fast",
                                color: "#C6923A",
                                primary: true,
                            },
                            {
                                href: "/loads",
                                icon: Search,
                                label: "Find Loads",
                                desc: "Escort jobs near you",
                                color: "#22c55e",
                                primary: true,
                            },
                            {
                                href: "/onboarding/claim",
                                icon: Shield,
                                label: "Claim Profile",
                                desc: "Get verified",
                                color: "#3b82f6",
                                primary: false,
                            },
                            {
                                href: "/escort-requirements",
                                icon: FileCheck,
                                label: "Requirements",
                                desc: "Check your state",
                                color: "#a855f7",
                                primary: false,
                            },
                        ].map(({ href, icon: Icon, label, desc, color, primary }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group relative flex flex-col items-center text-center rounded-2xl border transition-all
                                    ${primary
                                        ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
                                        : 'border-white/[0.06] bg-transparent hover:bg-white/[0.03]'
                                    }`}
                                style={{ padding: '14px 8px 12px' }}
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors"
                                    style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <div className="text-xs font-bold text-white group-hover:text-[#C6923A] transition-colors">{label}</div>
                                <div className="text-[10px] text-[#5A6577] mt-0.5">{desc}</div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* ── TRUTHFUL STATUS LINE ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-5 text-[10px] text-[#5A6577]"
                >
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live in selected corridors
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Network expanding
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 text-[#C6923A]" />
                        Escrow-protected payments
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-blue-400" />
                        Free for escorts
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
