"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    Activity, Shield, Zap, Map, TrendingUp, Users,
    ChevronRight, Star, CheckCircle, ArrowRight, Truck,
    Clock, BarChart3, Radio, Globe, Navigation
} from "lucide-react";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import { LOGO_MARK_SRC, BRAND_NAME_UPPER, ALT_TEXT } from "@/lib/config/brand";

// ===== ANIMATION VARIANTS =====
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
    visible: { transition: { staggerChildren: 0.08 } },
};

// ===== LIVE COUNTER =====
function AnimatedNumber({ value, suffix = "" }: { value: number | null; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === null || value === 0) return;
        let start = 0;
        const end = value;
        const duration = 1200;
        const step = Math.max(1, Math.ceil(duration / end));
        const timer = setInterval(() => {
            start += Math.max(1, Math.ceil(end / 40));
            if (start >= end) { setDisplay(end); clearInterval(timer); }
            else setDisplay(start);
        }, step);
        return () => clearInterval(timer);
    }, [value]);
    if (value === null) return <span className="text-[#3A4553]">—</span>;
    return <span>{display.toLocaleString()}{suffix}</span>;
}

// ===== DATA =====
const FEATURES = [
    {
        icon: TrendingUp, title: "Stage Probability",
        desc: "Our engine predicts the likelihood an escort will accept your load — using real historical behavior, not guesswork. Updated every 4 hours.",
        color: "#F1A91B",
    },
    {
        icon: Shield, title: "Instant Trust",
        desc: "Built from real lane performance data. Every operator card shows response time, acceptance rate, and incident history — per corridor, not averaged.",
        color: "#22c55e",
    },
    {
        icon: Zap, title: "One-Tap Accept",
        desc: "Fast confirmation keeps loads moving. Escorts go from push notification to accepted in under two taps — with haptic confirmation so nothing gets missed.",
        color: "#3b82f6",
    },
    {
        icon: Map, title: "Territory Intelligence",
        desc: "Claim corridors and counties. See shortage zones and hard-fill alerts before your competitors do — and act before the window closes.",
        color: "#a855f7",
    },
    {
        icon: Activity, title: "Hard-Fill Alerts",
        desc: "When a load starts timing out, broker fix options appear automatically — raise the rate, widen the window, expand the radius — before it goes stale.",
        color: "#ef4444",
    },
    {
        icon: Star, title: "Boosted Guarantee",
        desc: "Boosted loads come with computed fill windows. Miss the window and a broker credit issues automatically. No disputes, no emails, no chasing.",
        color: "#F1A91B",
    },
];

const HOW_IT_WORKS = [
    {
        role: "For Brokers", color: "#F1A91B", icon: Truck,
        steps: [
            "Post load with dimensions, route & rate",
            "Intelligence engine scores fill probability in real time",
            "Matched escorts accept in one tap — you see it instantly",
        ],
    },
    {
        role: "For Escorts", color: "#22c55e", icon: Navigation,
        steps: [
            "Toggle available — your presence goes live on the map",
            "Receive push offers filtered to your capabilities and territory",
            "Accept in one tap. Status auto-sets to busy. Done.",
        ],
    },
];

// ===== PROPS =====
interface HomeClientProps {
    marketPulse: MarketPulseData;
    directoryCount: number;
    corridorCount: number;
    topCorridors: CorridorData[];
    topListings: DirectoryListing[];
}

// ===== MAIN COMPONENT =====
export default function HomeClient({
    marketPulse, directoryCount, corridorCount, topCorridors, topListings,
}: HomeClientProps) {
    const escortsOnline = marketPulse.escorts_online_now;
    const escortsAvailable = marketPulse.escorts_available_now;
    const openLoads = marketPulse.open_loads_now;
    const medianFillMin = marketPulse.median_fill_time_min_7d ? Math.round(marketPulse.median_fill_time_min_7d) : 0;

    // FIX: Smart hero badge — never show "0 Escorts Available"
    const heroBadgeText = escortsAvailable > 0
        ? `${escortsAvailable} Escorts Available Now`
        : "Real-Time Matching Active";

    return (
        <div className="min-h-screen bg-hc-bg text-white font-[family-name:var(--font-body)]">
            {/* ── Ambient Background with amber sweep ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(198,146,58,0.08),transparent_70%)]" />
                {/* Amber sweep glow — heavy haul night highway feel */}
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_50%_80%_at_30%_-10%,rgba(198,146,58,0.06),transparent_60%)] animate-[amberSweep_8s_ease-in-out_infinite_alternate]" />
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_50%_80%_at_70%_-10%,rgba(245,158,11,0.04),transparent_60%)] animate-[amberSweep_12s_ease-in-out_infinite_alternate-reverse]" />
            </div>

            {/* ═════════════════════════════════════════════
                NAVIGATION — Clean 3-part layout
                Brand | Nav Links | CTA
                FIX: No more overlapping icons. No "ONLINE" pill.
                No generic HC logo — uses real brand asset.
            ═════════════════════════════════════════════ */}
            <nav className="relative z-50 border-b border-white/[0.06]" style={{
                background: 'rgba(11,11,12,0.85)',
                backdropFilter: 'blur(24px) saturate(1.5)',
            }}>
                <div className="hc-container h-16 flex items-center justify-between">
                    {/* LEFT: Brand */}
                    <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                        <Image
                            src={LOGO_MARK_SRC}
                            alt={ALT_TEXT}
                            width={32}
                            height={32}
                            priority
                            className="flex-shrink-0"
                            style={{ objectFit: 'contain' }}
                        />
                        <span className="font-bold text-white text-sm uppercase tracking-[0.1em]">{BRAND_NAME_UPPER}</span>
                    </Link>

                    {/* CENTER: Nav links (desktop only) */}
                    <div className="hidden md:flex items-center gap-8 text-[11px] text-[#888] font-semibold uppercase tracking-[0.15em]">
                        <Link href="/directory" className="hover:text-[#C6923A] transition-colors py-2">Directory</Link>
                        <Link href="/loads" className="hover:text-[#C6923A] transition-colors py-2">Load Board</Link>
                        <Link href="/corridors" className="hover:text-[#C6923A] transition-colors py-2">Corridors</Link>
                        <Link href="/leaderboards" className="hover:text-[#C6923A] transition-colors py-2">Leaderboard</Link>
                    </div>

                    {/* RIGHT: Auth + CTA */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <Link href="/login"
                            className="text-[11px] text-[#888] font-semibold uppercase tracking-[0.15em] hover:text-white transition-colors hidden md:block py-2">
                            Sign In
                        </Link>
                        <Link href="/onboarding/start"
                            className="px-5 py-2.5 font-bold text-[11px] uppercase tracking-[0.1em] rounded-xl transition-all press-scale text-black"
                            style={{
                                background: 'linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)',
                                boxShadow: '0 4px 20px rgba(198,146,58,0.25), 0 0 0 1px rgba(198,146,58,0.3)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(198,146,58,0.35), 0 0 0 1px rgba(198,146,58,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(198,146,58,0.25), 0 0 0 1px rgba(198,146,58,0.3)';
                            }}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═════════════════════════════════════════════
                HERO — Maximum Impact Zone
                FIX: Smart badge (no "0 escorts"), premium glow
            ═════════════════════════════════════════════ */}
            <section className="relative z-10 pt-28 pb-8">
                <div className="hc-container max-w-5xl text-center">
                    {/* Live badge — NEVER shows "0" */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#C6923A]/[0.06] border border-[#C6923A]/20 rounded-full mb-10"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6923A] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6923A]" />
                        </span>
                        <span className="text-[11px] font-bold text-[#C6923A] uppercase tracking-[0.2em]">
                            {heroBadgeText}
                        </span>
                    </motion.div>

                    {/* Headline — sharper, more specific */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                        className="text-[clamp(2.75rem,6vw,5rem)] font-black tracking-[-0.03em] mb-7 leading-[1.02]"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Real-Time Escort Intelligence
                        <br />
                        <span className="bg-gradient-to-r from-[#C6923A] via-[#E0B05C] to-[#C6923A] bg-clip-text text-transparent">
                            for Heavy Haul
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                        className="text-lg sm:text-xl text-[#8fa3b8] max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
                    >
                        Match oversize loads with verified escorts in minutes.
                        Stage-based fill probability. One-tap accept.
                        Built for the corridor — not the general freight crowd.
                    </motion.p>

                    {/* Dual CTA — FIX: Clear visual hierarchy */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                    >
                        {/* PRIMARY: Escort — dominant */}
                        <Link
                            href="/onboarding/start?role=escort"
                            className="group relative flex items-center justify-center gap-2.5 px-10 py-4 text-black font-bold text-sm rounded-2xl transition-all press-scale overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)',
                                boxShadow: '0 4px 24px rgba(198,146,58,0.3), 0 0 48px rgba(198,146,58,0.1)',
                            }}
                        >
                            <Navigation className="w-4 h-4" />
                            I&apos;m an Escort
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        {/* SECONDARY: Broker — outline */}
                        <Link
                            href="/onboarding/start?role=broker"
                            className="group flex items-center justify-center gap-2.5 px-10 py-4 bg-transparent border-2 border-white/10 hover:border-[#C6923A]/40 text-white font-bold text-sm rounded-2xl transition-all hover:bg-white/[0.02] hover:shadow-[0_0_20px_rgba(198,146,58,0.1)]"
                        >
                            <Truck className="w-4 h-4" />
                            I&apos;m a Broker
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Trust signal — pulled above fold */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-8 gap-y-2 text-[12px] text-[#5A6577] tracking-[0.02em]"
                    >
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">Free for escorts</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <Shield className="w-3.5 h-3.5 text-[#C6923A]" />
                            <span className="font-medium">Escrow protected</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-medium">Multi-region coverage</span>
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                MARKET PULSE — FIX: Hierarchical metrics
                Primary stat dominant, secondary smaller
            ═════════════════════════════════════════════ */}
            <section className="relative z-10 py-16">
                <div className="hc-container max-w-5xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {[
                            {
                                label: "Verified Operators",
                                value: directoryCount,
                                suffix: "",
                                icon: Users,
                                color: "#22c55e",
                                isPrimary: true,
                            },
                            {
                                label: "Open Loads",
                                value: openLoads,
                                suffix: "",
                                icon: BarChart3,
                                color: "#3b82f6",
                                isPrimary: false,
                            },
                            {
                                label: "Active Corridors",
                                value: corridorCount,
                                suffix: "",
                                icon: Map,
                                color: "#a855f7",
                                isPrimary: false,
                            },
                            {
                                label: "Median Fill Time",
                                value: medianFillMin,
                                suffix: "m",
                                icon: Clock,
                                color: "#C6923A",
                                isPrimary: true,
                            },
                        ].map(({ label, value, suffix, icon: Icon, color, isPrimary }, i) => (
                            <motion.div
                                key={label}
                                custom={i}
                                variants={fadeUp}
                                className={`metric-block group relative overflow-hidden ${isPrimary ? 'ring-1 ring-white/[0.06]' : ''}`}
                            >
                                {/* Subtle accent glow for primary metrics */}
                                {isPrimary && (
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                        style={{ background: `radial-gradient(ellipse at center, ${color}, transparent 70%)` }} />
                                )}
                                <div className="flex items-center gap-2 mb-1 relative z-10">
                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                    {label === "Verified Operators" && (
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: color }} />
                                        </span>
                                    )}
                                </div>
                                <div className={`metric-block__value relative z-10 ${isPrimary ? 'text-white' : ''}`}>
                                    <AnimatedNumber value={value} suffix={suffix} />
                                </div>
                                <div className="metric-block__label relative z-10">{label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Liquidity Trust Strip — LIVE COUNTS, GLOBAL SCOPE ── */}
            <section className="relative z-10 pb-8">
                <div className="hc-container max-w-3xl">
                    <div className="liquidity-strip flex-wrap">
                        {[
                            { label: `${directoryCount.toLocaleString()} Verified Operators`, color: "#22c55e" },
                            { label: "Escrow Protected", color: "#C6923A" },
                            { label: `${medianFillMin}m Median Fill`, color: "#a855f7" },
                            { label: "North America + Global", color: "#3b82f6" },
                            { label: "Industry Leaderboard", color: "#C6923A" },
                        ].map(({ label, color }) => (
                            <div key={label} className="liquidity-strip__item">
                                <div className="liquidity-strip__dot" style={{ background: color }} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                HOT CORRIDORS — LIVE FROM SUPABASE
            ═════════════════════════════════════════════ */}
            {topCorridors.length > 0 && (
                <section className="relative z-10 py-20">
                    <div className="hc-container max-w-5xl">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
                            <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">Live Corridors</div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                                Hottest Routes Right Now
                            </h2>
                        </motion.div>
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topCorridors.slice(0, 6).map((corridor, i) => (
                                <motion.div key={corridor.id} custom={i} variants={fadeUp}
                                    className="intelligence-card group cursor-pointer" style={{ "--accent-color": "#C6923A" } as React.CSSProperties}>
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-white text-sm">{corridor.name}</h3>
                                        <span className="text-[10px] font-bold text-[#C6923A] bg-[#C6923A]/10 px-2 py-0.5 rounded-full">
                                            {corridor.heat_score > 0 ? `${Math.round(corridor.heat_score)}°` : "NEW"}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-[11px] text-[#8fa3b8]">
                                        {corridor.loads_7d > 0 && <span>{corridor.loads_7d} loads/7d</span>}
                                        {corridor.escorts_online > 0 && <span className="text-emerald-400">{corridor.escorts_online} online</span>}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        <div className="text-center mt-8">
                            <Link href="/corridors" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#C6923A] uppercase tracking-[0.15em] hover:text-[#E0B05C] transition-colors">
                                View all {corridorCount} corridors <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ═════════════════════════════════════════════
                DIRECTORY PREVIEW — LIVE FROM SUPABASE
            ═════════════════════════════════════════════ */}
            {topListings.length > 0 && (
                <section className="relative z-10 py-20">
                    <div className="hc-container max-w-5xl">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
                            <div className="text-[10px] font-bold text-[#22c55e] uppercase tracking-[0.3em] mb-4">Directory</div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                                {directoryCount.toLocaleString()} Verified Operators
                            </h2>
                            <p className="text-[#8fa3b8] mt-3 text-sm">Pilot car services, escort operators, and trucking companies across the US &amp; Canada</p>
                        </motion.div>
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {topListings.slice(0, 8).map((listing, i) => (
                                <motion.div key={listing.id} custom={i} variants={fadeUp}
                                    className="intelligence-card group cursor-pointer" style={{ "--accent-color": "#22c55e" } as React.CSSProperties}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                                            <Truck className="w-4 h-4 text-[#22c55e]" />
                                        </div>
                                        {listing.claim_status === "claimed" && (
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-white text-xs mb-1 line-clamp-1">{listing.name}</h3>
                                    <p className="text-[10px] text-[#8fa3b8]">
                                        {[listing.city, listing.region_code].filter(Boolean).join(", ") || listing.country_code}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                        <div className="text-center mt-8">
                            <Link href="/directory"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border border-white/10 hover:border-[#22c55e]/30 text-white font-bold text-[11px] uppercase tracking-[0.1em] rounded-xl transition-all hover:bg-white/[0.02]">
                                Browse full directory <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ═════════════════════════════════════════════
                HOW IT WORKS — FIX: Visual differentiation
            ═════════════════════════════════════════════ */}
            <section className="relative z-10 py-24">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
                        <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">How It Works</div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Built for Both Sides of the Match
                        </h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {HOW_IT_WORKS.map(({ role, color, steps, icon: RoleIcon }) => (
                            <motion.div key={role} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                                className="intelligence-card" style={{ "--accent-color": color } as React.CSSProperties}>
                                <div className="text-center">
                                    {/* FIX: Role icon header for differentiation */}
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                                        style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                                        <RoleIcon className="w-6 h-6" style={{ color }} />
                                    </div>
                                    <h3 className="font-bold text-sm uppercase tracking-[0.15em] mb-6" style={{ color }}>
                                        {role}
                                    </h3>
                                    <div className="inline-block text-left">
                                        <ol className="space-y-4 list-none p-0 m-0">
                                            {steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border mt-0.5"
                                                        style={{ color, borderColor: `${color}30`, backgroundColor: `${color}12` }}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-sm leading-relaxed font-medium" style={{ color: 'var(--hc-muted)' }}>
                                                        {step}
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                FEATURE GRID
            ═════════════════════════════════════════════ */}
            <section className="relative z-10 py-24">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
                        <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">Why Haul Command</div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            The Moat No One Else Has
                        </h2>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
                            <motion.div key={title} custom={i} variants={fadeUp}
                                className="intelligence-card group" style={{ "--accent-color": color } as React.CSSProperties}>
                                <div className="text-center">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 mx-auto"
                                        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}15` }}>
                                        <Icon className="w-5 h-5" style={{ color }} />
                                    </div>
                                    <h3 className="font-bold text-white text-base mb-2.5">{title}</h3>
                                    <p className="text-[#8fa3b8] text-[15px] leading-relaxed">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                BOTTOM CTA — FIX: More breathing room, no cramping
            ═════════════════════════════════════════════ */}
            <section className="relative z-10 pt-24 pb-32">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="max-w-2xl mx-auto text-center px-4">
                    <div className="relative bg-[var(--hc-surface)] border border-[var(--hc-border)] rounded-3xl p-14 shadow-[0_0_80px_rgba(198,146,58,0.06)] overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.06),transparent)] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-5">Ready?</div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
                                Run a smarter corridor.
                            </h2>
                            <p className="text-[#8fa3b8] text-sm mb-10 max-w-sm mx-auto leading-relaxed font-medium">
                                Free for escorts. Brokers get 10 boost credits on activation. No card required.
                            </p>
                            <Link href="/onboarding/start"
                                className="inline-flex items-center gap-2.5 px-10 py-4 text-black font-bold text-sm rounded-2xl transition-all press-scale"
                                style={{
                                    background: 'linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)',
                                    boxShadow: '0 4px 24px rgba(198,146,58,0.3), 0 0 48px rgba(198,146,58,0.1)',
                                }}>
                                Create Your Account <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═════════════════════════════════════════════
                FOOTER — FIX: Real logo, proper spacing, multi-column
            ═════════════════════════════════════════════ */}
            <footer className="relative z-10 border-t border-white/[0.06]">
                {/* Footer columns */}
                <div className="hc-container py-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <h4 className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">Market</h4>
                            <div className="space-y-2.5">
                                {[
                                    { href: "/loads", label: "Load Board" },
                                    { href: "/directory", label: "Escort Directory" },
                                    { href: "/leaderboards", label: "Leaderboard" },
                                    { href: "/corridors", label: "Corridors" },
                                    { href: "/map", label: "Live Map" },
                                ].map(l => (
                                    <Link key={l.href} href={l.href} className="block text-sm text-[#8fa3b8] hover:text-white transition-colors">{l.label}</Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">Popular Regions</h4>
                            <div className="space-y-2.5">
                                {["Texas", "Florida", "California", "Louisiana", "North Carolina", "Oklahoma"].map(s => (
                                    <Link key={s} href={`/directory/us/${s.toLowerCase().replace(/\s/g, '-')}`} className="block text-sm text-[#8fa3b8] hover:text-white transition-colors">{s} Pilot Cars</Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">Services</h4>
                            <div className="space-y-2.5">
                                {[
                                    { href: "/services/pilot-car", label: "Pilot Car Services" },
                                    { href: "/services/escort-vehicle", label: "Escort Vehicle Services" },
                                    { href: "/services/oversize-load", label: "Oversize Load Escorts" },
                                    { href: "/services/wide-load", label: "Wide Load Escorts" },
                                    { href: "/services/route-survey", label: "Route Surveys" },
                                    { href: "/services/height-pole", label: "Height Pole Services" },
                                ].map(l => (
                                    <Link key={l.href} href={l.href} className="block text-sm text-[#8fa3b8] hover:text-white transition-colors">{l.label}</Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">Company</h4>
                            <div className="space-y-2.5">
                                {[
                                    { href: "/terms", label: "Terms of Service" },
                                    { href: "/privacy", label: "Privacy Policy" },
                                    { href: "/contact", label: "Contact Us" },
                                    { href: "/about", label: "About" },
                                ].map(l => (
                                    <Link key={l.href} href={l.href} className="block text-sm text-[#8fa3b8] hover:text-white transition-colors">{l.label}</Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.04] py-6">
                    <div className="hc-container flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Image src={LOGO_MARK_SRC} alt={ALT_TEXT} width={24} height={24} style={{ objectFit: 'contain' }} />
                            <span className="text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.1em]">
                                © 2026 Haul Command. The Operating System for Heavy Haul.
                            </span>
                        </div>
                        <div className="flex gap-6 text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.1em]">
                            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
