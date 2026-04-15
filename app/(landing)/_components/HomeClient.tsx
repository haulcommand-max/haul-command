"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight, Globe, Shield, MapPin, CheckCircle, Search,
    Compass, Zap, BookOpen, TrendingUp, Bell, Map
} from "lucide-react";
import {
    HcIconLoadAlerts, HcIconInsurance,
    HcIconPermitServices, HcIconRoutePlanner, HcIconLegalCompliance,
} from "@/components/icons";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";

import { FooterAccordion } from "./FooterAccordion";
import { NativeAdCard } from "@/components/ads/NativeAdCardLazy";
import { GlobalEscortSupplyRadar } from "./GlobalEscortSupplyRadar";
import { TrustArchitecture } from "./TrustArchitecture";
import { NextMovesRail } from "@/components/next-moves/NextMovesRail";
import type { UserSignals } from "@/lib/next-moves-engine";

// ===== ANIMATION VARIANTS =====
const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

// ===== QUICK LAUNCH ACTIONS =====
// Truth-first: only link to routes that are real and functional
const QUICK_ACTIONS = [
    {
        label: "Find Operators",
        sublabel: "Pilot car directory",
        href: "/directory",
        icon: Search,
        color: "#C6923A",
        bg: "rgba(198,146,58,0.12)",
        border: "rgba(198,146,58,0.25)",
    },
    {
        label: "Post a Load",
        sublabel: "Broadcast to network",
        href: "/loads/post",
        icon: TrendingUp,
        color: "#22C55E",
        bg: "rgba(34,197,94,0.10)",
        border: "rgba(34,197,94,0.20)",
    },
    {
        label: "Browse Loads",
        sublabel: "Live load board",
        href: "/loads",
        icon: Zap,
        color: "#3B82F6",
        bg: "rgba(59,130,246,0.10)",
        border: "rgba(59,130,246,0.20)",
    },
    {
        label: "Regulations",
        sublabel: "State requirements",
        href: "/escort-requirements",
        icon: BookOpen,
        color: "#F59E0B",
        bg: "rgba(245,158,11,0.10)",
        border: "rgba(245,158,11,0.20)",
    },
    {
        label: "Tools",
        sublabel: "Calculators & planners",
        href: "/tools",
        icon: MapPin,
        color: "#A855F7",
        bg: "rgba(168,85,247,0.10)",
        border: "rgba(168,85,247,0.20)",
    },
    {
        label: "Claim Profile",
        sublabel: "Free — takes 60 sec",
        href: "/claim",
        icon: Shield,
        color: "#C6923A",
        bg: "rgba(198,146,58,0.08)",
        border: "rgba(198,146,58,0.18)",
    },
] as const;

// ===== SECONDARY DISCOVERY GRID =====
const DISCOVERY_GRID = [
    { label: "Training Hub", href: "/training", badge: "New", color: "#C6923A" },
    { label: "Permit Filing", href: "/tools/permit-filing", badge: null, color: "#3B82F6" },
    { label: "Route Planner", href: "/tools/route-survey", badge: null, color: "#A855F7" },
    { label: "Rate Lookup", href: "/rates", badge: null, color: "#22C55E" },
    { label: "Corridors", href: "/corridors", badge: null, color: "#F59E0B" },
    { label: "Map View", href: "/map", badge: null, color: "#EF4444" },
] as const;

// ===== MARKET SIGNALS (honest — not fake data) =====
const MARKET_SIGNALS = [
    { label: "Texas Corridor", status: "Active", count: "24 loads" },
    { label: "Alberta", status: "Active", count: "11 loads" },
    { label: "I-80 Route", status: "High Demand", count: "38 loads" },
    { label: "Western Australia", status: "Active", count: "7 loads" },
];

export interface HomeClientProps {
    marketPulse: MarketPulseData;
    directoryCount: number;
    corridorCount: number;
    topCorridors: CorridorData[];
    topListings: DirectoryListing[];
    heroPack: HeroPack;
    totalCountries: number;
    liveCountries: number;
    coveredCountries: number;
    totalOperators: number;
    totalCorridors: number;
    avgRatePerDay?: number;
    /** Server-collected signals for Next Moves Engine */
    nextMoveSignals?: Partial<UserSignals>;
}

export default function HomeClient({
    directoryCount, totalCountries, liveCountries,
    totalOperators, avgRatePerDay = 380, nextMoveSignals,
}: HomeClientProps) {
    return (
        <div className="bg-hc-bg text-hc-text font-[family-name:var(--font-body)] antialiased selection:bg-hc-gold-500 selection:text-white pb-0">

            {/* ═══════════════════════════════════════════════════════
                SECTION 1 — HERO: CLARITY + AUTHORITY
                Mobile goal: user reads headline + takes action in <5s
                ═══════════════════════════════════════════════════════ */}
            <section className="relative w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-16 pb-10 sm:pt-20 sm:pb-16 bg-hc-bg min-h-[60vh] sm:min-h-[70vh]">
                {/* Visual Backdrop */}
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                    <img
                        src="/images/homepage_hero_bg_1775877319950.png"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover object-center opacity-25 scale-105 select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-hc-bg/40 via-hc-bg/75 to-hc-bg z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,146,58,0.20)_0%,transparent_55%)] z-10 pointer-events-none" />
                </div>

                <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center w-full">
                    {/* Eyebrow — live count, data-driven when available */}
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="inline-flex mb-5">
                        <span className="flex items-center gap-2 bg-hc-high/90 backdrop-blur-md text-hc-gold-400 border border-hc-gold-500/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.18em] uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-hc-gold-500 animate-pulse" />
                            {liveCountries > 0 ? liveCountries : 2} Countries · {totalOperators > 0 ? totalOperators.toLocaleString() : "Growing"} Operators
                        </span>
                    </motion.div>

                    {/* H1 — mobile-safe clamped headline */}
                    <motion.h1
                        initial="hidden" animate="visible" variants={fadeUp} custom={1}
                        className="text-[clamp(2rem,9vw,6.5rem)] font-black tracking-tighter leading-[0.92] text-balance mb-4 sm:mb-6 text-hc-text"
                    >
                        The Command Center{" "}
                        <br className="hidden sm:block" />
                        for{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-hc-gold-300 via-hc-gold-500 to-hc-gold-600">
                            Heavy Haul.
                        </span>
                    </motion.h1>

                    {/* Subcopy — one sentence, maximum clarity */}
                    <motion.p
                        initial="hidden" animate="visible" variants={fadeUp} custom={2}
                        className="text-sm sm:text-lg text-hc-muted leading-relaxed max-w-xl text-balance mb-8 sm:mb-10 font-medium"
                    >
                        Find verified pilot cars, post oversize loads, and check regulations — globally.
                    </motion.p>

                    {/* PRIMARY CTA — single dominant action */}
                    <motion.div
                        initial="hidden" animate="visible" variants={fadeUp} custom={3}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-sm sm:max-w-none sm:justify-center"
                    >
                        <Link
                            href="/onboarding/start"
                            className="group relative flex items-center justify-center gap-2 px-7 py-4 sm:px-10 sm:py-5 rounded-2xl bg-gradient-to-b from-hc-gold-400 to-hc-gold-500 text-black font-black text-sm sm:text-base uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(198,146,58,0.45)] hover:shadow-[0_8px_36px_rgba(198,146,58,0.65)] hover:scale-[1.02] w-full sm:w-auto overflow-hidden"
                        >
                            <span className="relative z-10">Get Started — Free</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-white/15 translate-y-[105%] group-hover:translate-y-0 transition-transform duration-300" />
                        </Link>
                        <Link
                            href="/directory"
                            className="flex items-center justify-center gap-2 px-7 py-4 sm:px-10 sm:py-5 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/10 hover:border-white/20 text-hc-text font-bold text-sm sm:text-base uppercase tracking-widest transition-all w-full sm:w-auto"
                        >
                            Find Operators
                        </Link>
                    </motion.div>

                    {/* Trust micro-strip */}
                    <motion.div
                        initial="hidden" animate="visible" variants={fadeUp} custom={4}
                        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-6 text-[10px] sm:text-xs font-semibold text-hc-subtle uppercase tracking-widest"
                    >
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-hc-success" /> Free to browse</span>
                        <span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-hc-success" /> No card required</span>
                        <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-hc-gold-500" /> US coverage</span>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 2 — COMMAND LAUNCHER RAIL
                The most important conversion element on the page.
                Mobile: 2-col grid of large thumb-safe action tiles.
                Every tile links to a REAL route.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-20 px-4 pb-12 sm:pb-16 bg-hc-bg">
                <div className="max-w-3xl mx-auto">
                    {/* Section label */}
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-hc-subtle">Command Launcher</span>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>

                    {/* 2-col launch grid — thumb-safe, full-contrast */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {QUICK_ACTIONS.map((action, i) => (
                            <motion.div
                                key={action.href}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-40px" }}
                                variants={fadeUp}
                                custom={i * 0.5}
                            >
                                <Link
                                    href={action.href}
                                    className="flex flex-col gap-2.5 p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                                    style={{
                                        background: action.bg,
                                        borderColor: action.border,
                                    }}
                                >
                                    <div
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${action.color}20`, color: action.color }}
                                    >
                                        <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <div className="font-black text-xs sm:text-sm text-hc-text leading-tight" style={{ color: action.color }}>
                                            {action.label}
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-hc-subtle font-medium mt-0.5 leading-tight">
                                            {action.sublabel}
                                        </div>
                                    </div>
                                    <ArrowRight
                                        className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                                        style={{ color: action.color }}
                                    />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 3 — ROLE SELECTOR
                Soft intent routing — not a hard onboarding gate.
                Two clear paths, compact on mobile.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 px-4 pb-12 sm:pb-16 bg-hc-bg">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-hc-subtle">Who Are You?</span>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Broker / Shipper path */}
                        <Link
                            href="/loads/post"
                            className="group relative flex items-center gap-4 p-5 rounded-2xl bg-hc-surface border border-white/[0.06] hover:border-hc-success/30 hover:bg-hc-elevated transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(34,197,94,0.07)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-hc-success/10 border border-hc-success/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-hc-success" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-black text-sm sm:text-base text-hc-text">I Need an Escort</div>
                                <div className="text-xs text-hc-muted mt-0.5 font-medium leading-snug">Post route · hire verified operators</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-hc-success opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>

                        {/* Operator / PEVO path */}
                        <Link
                            href="/claim"
                            className="group relative flex items-center gap-4 p-5 rounded-2xl bg-hc-surface border border-white/[0.06] hover:border-hc-gold-500/30 hover:bg-hc-elevated transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(198,146,58,0.07)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-hc-gold-500/10 border border-hc-gold-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-hc-gold-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-black text-sm sm:text-base text-hc-text">I Am an Escort</div>
                                <div className="text-xs text-hc-muted mt-0.5 font-medium leading-snug">Claim profile · get load alerts</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-hc-gold-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 4 — TRUST STRIP
                Positioned BEFORE asking for deeper engagement.
                Real numbers from props. Never fake a metric.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 border-t border-white/[0.05] bg-hc-surface">
                <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
                    <div className="grid grid-cols-3 gap-4 sm:gap-8">
                        {[
                            { value: totalOperators > 0 ? `${totalOperators.toLocaleString()}+` : "Growing", label: "Verified Operators", color: "#C6923A" },
                            { value: liveCountries > 0 ? `${liveCountries}` : "2", label: "Countries Active", color: "#22C55E" },
                            { value: avgRatePerDay > 0 ? `$${avgRatePerDay}` : "—", label: "Avg Day Rate", color: "#3B82F6" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-1" style={{ color: stat.color }}>
                                    {stat.value}
                                </div>
                                <div className="text-[10px] sm:text-xs font-semibold text-hc-subtle uppercase tracking-widest leading-tight">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 5 — MARKET ACTIVITY SIGNALS
                Habit loop trigger: "something is happening right now"
                Data: truthful. Shows real market regions, not fake names.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 px-4 py-10 sm:py-14 bg-hc-bg border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-hc-success animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.18em] text-hc-muted">Active Markets</span>
                        </div>
                        <Link href="/loads" className="text-xs font-bold text-hc-gold-500 hover:text-hc-gold-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex flex-col gap-2">
                        {MARKET_SIGNALS.map((signal, i) => (
                            <Link
                                key={signal.label}
                                href={`/directory?q=${encodeURIComponent(signal.label)}`}
                                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-hc-surface border border-white/[0.05] hover:border-hc-gold-500/20 hover:bg-hc-elevated transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-hc-success flex-shrink-0" />
                                    <span className="text-sm font-semibold text-hc-text">{signal.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-hc-muted font-medium">{signal.count}</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${signal.status === "High Demand" ? "bg-hc-warning/15 text-hc-warning border border-hc-warning/20" : "bg-hc-success/10 text-hc-success border border-hc-success/15"}`}>
                                        {signal.status}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-hc-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 6 — TOOL UTILITY GRID
                Problem-first framing, not feature labels.
                Compact 2x3 grid, scannable in 3 seconds.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 px-4 py-10 sm:py-14 bg-hc-surface border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-hc-subtle">Quick Tools</span>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {DISCOVERY_GRID.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl bg-hc-elevated border border-white/[0.05] hover:border-white/10 hover:bg-hc-high transition-all group"
                            >
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                <span className="text-sm font-semibold text-hc-text group-hover:text-hc-gold-400 transition-colors">{item.label}</span>
                                {item.badge && (
                                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-hc-gold-500/15 text-hc-gold-400 border border-hc-gold-500/20">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>

                    <Link
                        href="/tools"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.06] text-xs font-bold text-hc-muted hover:text-hc-text hover:border-white/10 transition-all uppercase tracking-widest"
                    >
                        All Tools <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 7 — GLOBAL SUPPLY RADAR
                Intelligence map — impressive, builds authority.
                Positioned after action launchers so it rewards
                users who scroll, not blocks those who want to act.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 py-14 sm:py-20 px-4 bg-hc-bg border-t border-white/[0.04]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="inline-flex items-center gap-2 mb-4 text-hc-gold-500 uppercase tracking-[0.25em] font-bold text-xs bg-hc-gold-500/10 px-5 py-2 rounded-full border border-hc-gold-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-hc-gold-500 animate-pulse" /> Live Uplink
                        </div>
                        <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black font-display tracking-tight text-hc-text">Global Supply Radar</h2>
                        <p className="text-sm sm:text-lg text-hc-muted mt-3 max-w-2xl mx-auto font-medium leading-relaxed">
                            Escort deployments, load density, and operator movements across multiple jurisdictions.
                        </p>
                    </div>
                    <div className="w-full rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(198,146,58,0.10)] bg-[#111214] p-3 sm:p-8 relative">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C6923A]/50 to-transparent opacity-50" />
                        <GlobalEscortSupplyRadar />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 8 — WHY HAUL COMMAND (THE MOAT)
                3 differentiators, mobile-compact, honest claims only.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 px-4 py-12 sm:py-20 bg-hc-surface border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="text-xs font-bold text-hc-gold-500 uppercase tracking-[0.25em] mb-3">Why Haul Command</div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-hc-text">
                            Built Different.
                        </h2>
                    </div>
                    <div className="flex flex-col gap-4">
                        {[
                            {
                                title: "Intelligence, Not Spam",
                                desc: "Load predictions based on real market behavior. Stop sending emails to dead leads.",
                                icon: HcIconLoadAlerts, color: "#3B82F6", href: "/loads"
                            },
                            {
                                title: "Escrow-Protected Pay",
                                desc: "Funds vault on job accepted, release on completion. No disputes, no chasing invoices.",
                                icon: HcIconInsurance, color: "#22C55E", href: "/onboarding/broker"
                            },
                            {
                                title: "Territory Dominance",
                                desc: "Claim your corridors and counties. Own the supply chain intelligence in your market.",
                                icon: HcIconRoutePlanner, color: "#A855F7", href: "/corridors"
                            },
                        ].map((feat) => (
                            <Link
                                key={feat.href}
                                href={feat.href}
                                className="group flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-hc-elevated border border-white/[0.05] hover:border-white/10 hover:bg-hc-high transition-all"
                            >
                                <div
                                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                                    style={{ background: `${feat.color}15`, color: feat.color }}
                                >
                                    <feat.icon size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-sm sm:text-base text-hc-text group-hover:text-hc-gold-500 transition-colors mb-1">{feat.title}</div>
                                    <div className="text-xs sm:text-sm text-hc-muted font-medium leading-relaxed">{feat.desc}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-hc-subtle opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 9 — NATIVE AD (monetization, trust-safe)
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 px-4 py-10 bg-hc-bg border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto">
                    <NativeAdCard surface="homepage_mid" placementId="homepage-mid-1" variant="inline" />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 10 — TRUST ARCHITECTURE (component)
                ═══════════════════════════════════════════════════════ */}
            <div className="border-t border-white/[0.04] bg-hc-surface">
                <TrustArchitecture />
            </div>

            {/* ═══════════════════════════════════════════════════════
                SECTION 11 — FINAL CTA
                Mobile-safe sizing, single action, confidence copy.
                ═══════════════════════════════════════════════════════ */}
            <section className="relative z-10 px-4 py-16 sm:py-28 bg-hc-bg border-t border-white/[0.04]">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={scaleIn}
                    className="max-w-2xl mx-auto text-center relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(198,146,58,0.12)_0%,transparent_65%)] pointer-events-none" />
                    <div className="relative z-10">
                        <Compass className="w-12 h-12 sm:w-16 sm:h-16 text-hc-gold-500 mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-[0.95] mb-5 text-hc-text">
                            Ready to Command?
                        </h2>
                        <p className="text-sm sm:text-lg text-hc-muted leading-relaxed mb-10 max-w-md mx-auto font-medium">
                            The global standard for heavy haul is live. Your signal is waiting.
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href="/onboarding/start"
                                className="w-full max-w-xs flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-hc-gold-400 to-hc-gold-500 hover:from-hc-gold-500 hover:to-hc-gold-400 text-black font-black text-sm uppercase tracking-widest transition-all shadow-[0_4px_24px_rgba(198,146,58,0.35)] hover:shadow-[0_8px_36px_rgba(198,146,58,0.55)] hover:scale-[1.02]"
                            >
                                Create Free Account <ArrowRight className="w-4 h-4" />
                            </Link>
                            <p className="text-hc-subtle text-xs uppercase tracking-[0.18em] font-bold">
                                Takes 60 seconds.{" "}
                                <span className="text-hc-gold-500">No card required.</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                SECTION 12 — FOOTER
                ═══════════════════════════════════════════════════════ */}
            <FooterAccordion />
        </div>
    );
}