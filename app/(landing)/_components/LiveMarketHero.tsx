"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, TrendingUp, Flame, Radio, Shield, Search,
    MapPin, FileCheck, Briefcase, Building2, BarChart3, Eye,
    Repeat, MessageSquare, Package, Wrench, Star, Map,
    ChevronRight, Truck, Compass, Users, BookOpen, Warehouse,
} from "lucide-react";
import { useRole } from "@/lib/role-context";
import { ROLE_LIST, ROLE_CONFIGS, type HCRole } from "@/lib/role-config";

interface LiveMarketHeroProps {
    totalOperators: number;
    corridorCount: number;
    openLoads: number;
    medianFillMin: number;
    hotCorridor?: string;
    hotCorridorDelta?: number;
    avgRate?: number;
    onlineHeartbeat?: number;
}

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
    if (!value) return null;
    return <span>{display.toLocaleString("en-US")}{suffix}</span>;
}

type RouteConfig = { href: string; icon: any; label: string; desc: string; color: string; primary: boolean };

const ROLE_ROUTE_MAP: Record<HCRole, RouteConfig[]> = {
    escort_operator: [
        { href: "/loads", icon: Package, label: "Find Jobs", desc: "Loads near you", color: "#22c55e", primary: true },
        { href: "/onboarding/claim", icon: Shield, label: "Claim Profile", desc: "Get verified", color: "#3b82f6", primary: true },
        { href: "/tools/escort-calculator", icon: Compass, label: "Rate Tools", desc: "What to charge", color: "#a855f7", primary: false },
        { href: "/corridors", icon: Map, label: "Coverage", desc: "Your corridors", color: "#C6923A", primary: false },
    ],
    broker_dispatcher: [
        { href: "/loads/post", icon: MapPin, label: "Post Load", desc: "Get coverage fast", color: "#C6923A", primary: true },
        { href: "/directory", icon: Search, label: "Find Escorts", desc: "Verified operators", color: "#22c55e", primary: true },
        { href: "/corridors", icon: BarChart3, label: "Corridors", desc: "Supply density", color: "#a855f7", primary: false },
        { href: "/loads/rescue", icon: Flame, label: "Rescue Fill", desc: "Hard-fill lanes", color: "#ef4444", primary: false },
    ],
    both: [
        { href: "/loads/post", icon: MapPin, label: "Post Load", desc: "Need coverage", color: "#C6923A", primary: true },
        { href: "/loads", icon: Package, label: "Find Jobs", desc: "Take a load", color: "#22c55e", primary: true },
        { href: "#", icon: Repeat, label: "Switch Mode", desc: "Broker â†” Operator", color: "#3b82f6", primary: false },
        { href: "/messages", icon: MessageSquare, label: "Inbox", desc: "Messages", color: "#a855f7", primary: false },
    ],
    fleet_owner: [
        { href: "/fleet", icon: BarChart3, label: "Fleet Dashboard", desc: "All vehicles", color: "#C6923A", primary: true },
        { href: "/loads", icon: Package, label: "Find Loads", desc: "Jobs for fleet", color: "#22c55e", primary: true },
        { href: "/fleet/compliance", icon: FileCheck, label: "Compliance", desc: "Certs & dates", color: "#3b82f6", primary: false },
        { href: "/corridors", icon: Map, label: "Fleet Routes", desc: "Coverage map", color: "#a855f7", primary: false },
    ],
    support_partner: [
        { href: "/partner/join", icon: Building2, label: "Become Partner", desc: "Join the network", color: "#C6923A", primary: true },
        { href: "/onboarding/claim", icon: MapPin, label: "Claim Location", desc: "Add your spot", color: "#22c55e", primary: true },
        { href: "/partner/services", icon: Wrench, label: "List Services", desc: "What you offer", color: "#3b82f6", primary: false },
        { href: "/map", icon: Map, label: "Market Gaps", desc: "Where you're needed", color: "#a855f7", primary: false },
    ],
    observer_researcher: [
        { href: "/leaderboards", icon: BarChart3, label: "Dashboards", desc: "Market rankings", color: "#C6923A", primary: true },
        { href: "/corridors", icon: Eye, label: "Track Corridors", desc: "Activity trends", color: "#22c55e", primary: true },
        { href: "/intelligence", icon: TrendingUp, label: "Reports", desc: "Analysis & data", color: "#3b82f6", primary: false },
        { href: "/map", icon: Map, label: "Density Map", desc: "Supply heatmap", color: "#a855f7", primary: false },
    ],
};

const ROLE_ICON_MAP: Record<HCRole, any> = {
    escort_operator: Truck,
    broker_dispatcher: Briefcase,
    both: Repeat,
    fleet_owner: Warehouse,
    support_partner: Building2,
    observer_researcher: BookOpen,
};

export function LiveMarketHero({
    totalOperators,
    corridorCount,
    openLoads,
    medianFillMin,
    hotCorridor = "Texas Gulf Coast",
    hotCorridorDelta = 12,
    avgRate = 380,
    onlineHeartbeat = 1843,
}: LiveMarketHeroProps) {
    const { role, setRole, config, clearRole } = useRole();
    const activeRoutes = role ? ROLE_ROUTE_MAP[role] : null;
    const roleLabel = config?.label ?? null;

    return (
        <section className="relative z-10">
            <style>{`
                .hero-metrics {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    justify-content: center;
                    margin: 0 auto 16px;
                }
                .hero-metric { text-align: center; min-width: 70px; flex: 1; max-width: 140px; }
                .hero-metric-third { display: none; }
                .hero-hot-corridor { display: none; }
                .hero-roles {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    max-width: 520px;
                    margin: 0 auto;
                }
                .hero-role-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 12px 6px 10px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-height: 80px;
                    justify-content: center;
                }
                .hero-role-card:hover {
                    background: rgba(198,146,58,0.06);
                    border-color: rgba(198,146,58,0.25);
                }
                .hero-status-line {
                    gap: 8px 12px;
                    font-size: 9px;
                }
                @media (min-width: 768px) {
                    .hero-metrics { gap: 32px; margin-bottom: 24px; flex-wrap: nowrap; }
                    .hero-metric-third { display: block; }
                    .hero-hot-corridor { display: flex; }
                    .hero-roles {
                        grid-template-columns: repeat(6, 1fr);
                        gap: 10px;
                        max-width: 720px;
                    }
                    .hero-role-card { padding: 14px 8px 12px; min-height: 90px; }
                    .hero-status-line { gap: 4px 16px; font-size: 10px; }
                }
            `}</style>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(198,146,58,0.08),transparent_60%)]" />
                {/* Command Center hero visual — behind metrics */}
                <div className="absolute inset-0 overflow-hidden" style={{
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
                }}>
                    <Image
                        src="/hero-command-center.png"
                        alt=""
                        fill
                        className="object-cover object-center"
                        style={{ opacity: 0.18 }}
                        priority={false}
                        sizes="100vw"
                    />
                </div>
            </div>

            <div className="hc-container relative z-10 pb-5 pt-5 sm:pt-10 sm:pb-8">
                {/* LIVE label */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-center gap-2 mb-4"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 800, color: '#22c55e',
                        textTransform: 'uppercase', letterSpacing: '0.2em',
                    }}>Live Escort Market</span>
                </motion.div>

                {/* TOP-LINE METRICS */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="hero-metrics"
                >
                    {totalOperators > 0 && (
                        <div className="hero-metric">
                            <div className="text-lg sm:text-3xl font-black tracking-tight" style={{ color: "#22c55e", fontFamily: "var(--font-mono, monospace)" }}>
                                <Counter value={totalOperators} />
                            </div>
                            <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                                Network Contacts
                            </div>
                        </div>
                    )}
                    {onlineHeartbeat > 0 && (
                        <div className="hero-metric">
                            <div className="text-lg sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2" style={{ color: "#3b82f6", fontFamily: "var(--font-mono, monospace)" }}>
                                <span className="relative flex h-3 w-3 sm:h-4 sm:w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-blue-500" />
                                </span>
                                <Counter value={onlineHeartbeat} />
                            </div>
                            <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                                Online Now
                            </div>
                        </div>
                    )}
                    {corridorCount > 0 && (
                        <div className="hero-metric">
                            <div className="text-lg sm:text-3xl font-black tracking-tight" style={{ color: "#a855f7", fontFamily: "var(--font-mono, monospace)" }}>
                                <Counter value={corridorCount} />
                            </div>
                            <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                                Active Corridors
                            </div>
                        </div>
                    )}
                    {avgRate && avgRate > 0 && (
                        <div className="hero-metric hero-metric-third">
                            <div className="text-lg sm:text-3xl font-black tracking-tight" style={{ color: "#C6923A", fontFamily: "var(--font-mono, monospace)" }}>
                                $<Counter value={avgRate} />
                            </div>
                            <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                                Avg Rate/Day
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* HOTTEST CORRIDOR — hidden on mobile */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="hero-hot-corridor justify-center mb-5"
                >
                    <Link aria-label="Navigation Link" href="/corridors" className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12] transition-all">
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

                {/* ROLE ROUTER — 3Ã—2 grid on mobile, 6-col on desktop */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {!role ? (
                        <>
                            <div className="text-center text-[10px] text-[#8fa3b8] font-semibold uppercase tracking-[0.15em] mb-3">
                                What&apos;s your role?
                            </div>
                            <div className="hero-roles">
                                {ROLE_LIST.map((r) => {
                                    const rc = ROLE_CONFIGS[r];
                                    const RIcon = ROLE_ICON_MAP[r];
                                    return (
                                        <button aria-label="Interactive Button"
                                            key={r}
                                            onClick={() => setRole(r)}
                                            className="hero-role-card group"
                                        >
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5"
                                                style={{ background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.15)' }}>
                                                <RIcon className="w-3.5 h-3.5" style={{ color: '#C6923A' }} />
                                            </div>
                                            <div className="text-[10px] sm:text-xs font-bold text-white group-hover:text-[#C6923A] transition-colors leading-tight">
                                                {rc.shortLabel}
                                            </div>
                                            <div className="text-[8px] text-[#5A6577] mt-0.5 leading-tight hidden sm:block">
                                                {rc.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <span className="text-[10px] text-[#C6923A] font-bold uppercase tracking-[0.15em]">
                                    {roleLabel}
                                </span>
                                <button aria-label="Interactive Button"
                                    onClick={clearRole}
                                    className="text-[9px] text-[#5A6577] hover:text-white transition-colors ml-1 underline cursor-pointer"
                                >
                                    change
                                </button>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-[400px] mx-auto mt-4 px-4 sm:px-0">
                                {activeRoutes!.map(({ href, icon: Icon, label, desc, color, primary }: RouteConfig) => {
                                    if (primary) {
                                        return (
                                            <Link
                                                key={href + label}
                                                href={href}
                                                className="w-full h-14 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-2xl flex items-center justify-between px-5 transition-all duration-200 group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center gap-3 relative z-10">
                                                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-black text-black leading-none">{label}</div>
                                                        <div className="text-[10px] text-black/60 font-semibold mt-0.5">{desc}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-black/40 group-hover:translate-x-1 group-hover:text-black transition-all relative z-10" />
                                            </Link>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={href + label}
                                            href={href}
                                            className="w-full h-12 bg-transparent border border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.04] rounded-2xl flex items-center justify-center gap-2 px-4 transition-all duration-200 group"
                                        >
                                            <Icon className="w-3.5 h-3.5 text-white/50 group-hover:text-amber-400 transition-colors" />
                                            <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </motion.div>

                {/* STATUS LINE */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="hero-status-line flex flex-wrap items-center justify-center mt-4 text-[#5A6577]"
                >
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 text-[#C6923A]" />
                        Escrow payments
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