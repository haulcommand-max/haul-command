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
import CountryHero from "@/components/hero/CountryHero";
import type { HeroPack } from "@/components/hero/heroPacks";
import { LOGO_SRC, LOGO_MARK_SRC, BRAND_NAME_UPPER, ALT_TEXT } from "@/lib/config/brand";
import { GlobalEscortSupplyRadar } from "./GlobalEscortSupplyRadar";
import { NativeAdCard } from "@/components/ads/NativeAdCard";
import MarketConditionsPanel from "@/components/intelligence/MarketConditionsPanel";
import { MarketTerminalRibbon } from "@/components/market/MarketTerminalRibbon";
import { CorridorLeaderboard } from "@/components/gamification/CorridorLeaderboard";

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
    return <span>{display.toLocaleString("en-US")}{suffix}</span>;
}

// ===== DATA — FIX #14: Premium feature copy =====
const FEATURES = [
    {
        icon: TrendingUp, title: "Stage Probability",
        desc: "Our engine predicts the likelihood an escort will accept your load — using real historical behavior, not guesswork. Updated every 4 hours.",
        color: "#F1A91B",
    },
    {
        icon: Shield, title: "Escrow-Protected Payments",
        desc: "Every job runs through escrow. Funds release on confirmed completion. No disputes, no chasing — money moves when the load does.",
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
        icon: Globe, title: "57-Country Expansion Plan",
        desc: "Heavy haul doesn't stop at borders. We're building coverage across 57 countries — same intelligence engine, localized compliance, global reach.",
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
    heroPack: HeroPack;
    totalCountries: number;
    liveCountries: number;
    coveredCountries: number;
    totalOperators: number;
    totalCorridors: number;
}

// ===== MAIN COMPONENT =====
export default function HomeClient({
    marketPulse, directoryCount, corridorCount, topCorridors, topListings, heroPack,
    totalCountries, liveCountries, coveredCountries, totalOperators, totalCorridors,
}: HomeClientProps) {
    const escortsOnline = marketPulse.escorts_online_now;
    const escortsAvailable = marketPulse.escorts_available_now;
    const openLoads = marketPulse.open_loads_now;
    const medianFillMin = marketPulse.median_fill_time_min_7d ? Math.round(marketPulse.median_fill_time_min_7d) : 0;

    return (
        <div className="min-h-screen bg-hc-bg text-white font-[family-name:var(--font-body)]">
            {/* Inline responsive styles */}
            <style>{`
                .landing-desktop-only { display: none !important; }
                @media (min-width: 768px) {
                    .landing-desktop-only { display: flex !important; }
                }
                .landing-desktop-inline { display: none !important; }
                @media (min-width: 768px) {
                    .landing-desktop-inline { display: block !important; }
                }
                .nav-brand-logo { height: 42px !important; }
                @media (min-width: 768px) {
                    .nav-brand-logo { height: 48px !important; }
                }
                @media (min-width: 1024px) {
                    .nav-brand-logo { height: 56px !important; }
                }
                /* FIX #02: Header CTA never truncates */
                .nav-cta-btn {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 46vw;
                    min-width: 0;
                }
                @media (min-width: 768px) {
                    .nav-cta-btn { max-width: none; }
                }
            `}</style>

            {/* ── Ambient Background with amber sweep ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(198,146,58,0.08),transparent_70%)]" />
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_50%_80%_at_30%_-10%,rgba(198,146,58,0.06),transparent_60%)] animate-[amberSweep_8s_ease-in-out_infinite_alternate]" />
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_50%_80%_at_70%_-10%,rgba(245,158,11,0.04),transparent_60%)] animate-[amberSweep_12s_ease-in-out_infinite_alternate-reverse]" />
            </div>

            {/* ═══════════════════════════════════════════════
                FIX #02 + #03: NAVIGATION — Clean, aligned, no truncation
            ═══════════════════════════════════════════════ */}
            <nav className="relative z-50 border-b border-white/[0.06] safe-area-header" style={{
                background: 'rgba(11,11,12,0.85)',
                backdropFilter: 'blur(24px) saturate(1.5)',
            }}>
                <div className="hc-container h-16 flex items-center justify-between">
                    {/* LEFT: Brand */}
                    <Link href="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        padding: '8px 10px 8px 0',
                        textDecoration: 'none',
                    }}>
                        <Image
                            src={LOGO_SRC}
                            alt={ALT_TEXT}
                            width={220}
                            height={48}
                            priority
                            className="nav-brand-logo"
                            style={{
                                objectFit: 'contain',
                                objectPosition: 'left center',
                                width: 'auto',
                                maxHeight: '40px',
                                display: 'block',
                                filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.35)) contrast(1.05) saturate(1.05)',
                            }}
                        />
                    </Link>

                    {/* CENTER: Nav links (desktop only) */}
                    <div className="landing-desktop-only items-center" style={{ gap: '2rem', fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
                        <Link href="/directory" className="hover:text-[#C6923A] transition-colors py-2">Directory</Link>
                        <Link href="/loads" className="hover:text-[#C6923A] transition-colors py-2">Load Board</Link>
                        <Link href="/tools/escort-calculator" className="hover:text-[#C6923A] transition-colors py-2">Tools</Link>
                        <Link href="/escort-requirements" className="hover:text-[#C6923A] transition-colors py-2">Requirements</Link>
                        <Link href="/leaderboards" className="hover:text-[#C6923A] transition-colors py-2">Leaderboard</Link>
                    </div>

                    {/* RIGHT: Auth */}
                    <div className="flex items-center" style={{ flexShrink: 0 }}>
                        <Link href="/login"
                            className="hover:text-white transition-colors hc-btn hc-btn--black"
                            style={{ fontSize: '12px', padding: '10px 18px', borderRadius: '12px' }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════
                MARKET TERMINAL RIBBON — Live metrics strip
            ═══════════════════════════════════════════════ */}
            <MarketTerminalRibbon />

            {/* ═══════════════════════════════════════════════
                HERO — Cinematic Country-Relative Video Hero
                FIX #04, #05, #07, #08, #09, #18, #19
            ═══════════════════════════════════════════════ */}
            <CountryHero
                pack={heroPack}
                totalOperators={totalOperators || directoryCount}
                totalCorridors={totalCorridors || corridorCount}
                totalCountries={totalCountries}
                liveCountries={liveCountries}
            />

            {/* FIX #14: Trust signal strip — updated copy */}
            <section className="relative z-10 py-6">
                <div className="hc-container max-w-5xl text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-x-6 md:gap-x-8 gap-y-2 text-[12px] text-[#5A6577] tracking-[0.02em]"
                    >
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">Free for Escorts</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <Shield className="w-3.5 h-3.5 text-[#C6923A]" />
                            <span className="font-medium">Escrow-Protected Payments</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-medium">{totalCountries}-Country Expansion Plan</span>
                        </span>
                    </motion.div>

                    {/* ── GLOBAL EXPANSION STRIP ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        style={{ marginTop: '2rem' }}
                    >
                        <div style={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            padding: '1.25rem 1.5rem 1.5rem',
                        }}>
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                            }} />
                            <div style={{ position: 'relative', zIndex: 10 }}>
                                {/* FIX #16: Title uses truth from RPC */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    marginBottom: '16px',
                                }}>
                                    <Globe className="w-4 h-4" style={{ color: '#93c5fd' }} />
                                    <h3 className="expansion-strip-title" style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: '#93c5fd',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.18em',
                                        lineHeight: 1,
                                        margin: 0,
                                    }}>
                                        Expanding Across {totalCountries} Countries
                                    </h3>
                                </div>
                                <style>{`
                                    @media (min-width: 768px) {
                                        .expansion-strip-title { font-size: 15px !important; }
                                    }
                                `}</style>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2rem 2.5rem',
                                }}>
                                    {[
                                        { region: 'United States', short: 'US', status: 'live', color: '#22c55e' },
                                        { region: 'Canada', short: 'CA', status: 'live', color: '#22c55e' },
                                        { region: 'Australia', short: 'AU', status: 'expanding', color: '#F59E0B' },
                                        { region: 'United Kingdom', short: 'UK', status: 'planned', color: '#60a5fa' },
                                        { region: 'Germany', short: 'DE', status: 'planned', color: '#60a5fa' },
                                        { region: 'Brazil', short: 'BR', status: 'future', color: '#6b7280' },
                                    ].map(({ region, short, status, color }) => (
                                        <div key={region} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: color,
                                                boxShadow: status === 'live' ? `0 0 8px ${color}60` : 'none',
                                                flexShrink: 0,
                                            }} />
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, color,
                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                            }}>
                                                {status === 'live' ? 'LIVE' : status === 'expanding' ? 'NEXT' : status === 'planned' ? 'PLANNED' : 'FUTURE'}
                                            </span>
                                            <span style={{
                                                fontSize: '13px', fontWeight: 600,
                                                color: status === 'live' ? '#E5E7EB' : '#9CA3AF',
                                            }}>
                                                {region}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                MARKET PULSE — FIX #15: Consistent spacing (py-12)
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-12">
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
                                label: "Loads Available",
                                value: openLoads,
                                suffix: "",
                                icon: BarChart3,
                                color: "#3b82f6",
                                isPrimary: false,
                            },
                            {
                                label: "Live Corridors",
                                value: corridorCount,
                                suffix: "",
                                icon: Map,
                                color: "#a855f7",
                                isPrimary: false,
                            },
                            {
                                label: "Avg Match Time",
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

            {/* ── FIX #16: Liquidity Trust Strip — ALL counts from RPC, no hardcoded numbers ── */}
            <section className="relative z-10 pb-8">
                <div className="hc-container max-w-3xl">
                    <div className="liquidity-strip flex-wrap">
                        {[
                            { label: `${directoryCount.toLocaleString()} Verified Operators`, color: "#22c55e" },
                            { label: "Escrow-Protected Payments", color: "#C6923A" },
                            { label: `${medianFillMin}m Avg Match`, color: "#a855f7" },
                            { label: `${totalCountries} Countries Planned`, color: "#3b82f6" },
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

            {/* ═══════════════════════════════════════════════
                GLOBAL ESCORT SUPPLY RADAR
            ═══════════════════════════════════════════════ */}
            <GlobalEscortSupplyRadar />

            {/* ═══════════════════════════════════════════════
                MARKET CONDITIONS PANEL
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-12">
                <div className="hc-container max-w-5xl">
                    <MarketConditionsPanel />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                HOT CORRIDORS — LIVE FROM SUPABASE
            ═══════════════════════════════════════════════ */}
            {topCorridors.length > 0 && (
                <section className="relative z-10 py-16">
                    <div className="hc-container max-w-5xl">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12" style={{ marginTop: 24 }}>
                            <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">Live Corridors</div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                                Hottest Routes Right Now
                            </h2>
                        </motion.div>
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topCorridors.slice(0, 6).map((corridor, i) => (
                                <Link key={corridor.id} href={`/corridors/${corridor.id}`}>
                                    <motion.div custom={i} variants={fadeUp}
                                        className="intelligence-card group cursor-pointer" style={{ "--accent-color": "#C6923A" } as React.CSSProperties}>
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-bold text-white text-sm group-hover:text-[#C6923A] transition-colors">{corridor.name}</h3>
                                            <span className="text-[10px] font-bold text-[#C6923A] bg-[#C6923A]/10 px-2 py-0.5 rounded-full">
                                                {corridor.heat_score > 0 ? `${Math.round(corridor.heat_score)}°` : "NEW"}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 text-[11px] text-[#8fa3b8]">
                                            {corridor.loads_7d > 0 && <span>{corridor.loads_7d} loads/7d</span>}
                                            {corridor.escorts_online > 0 && <span className="text-emerald-400">{corridor.escorts_online} online</span>}
                                        </div>
                                    </motion.div>
                                </Link>
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

            {/* ═══════════════════════════════════════════════
                FREE TOOLS — 5 Conversion Engines
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-16">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12" style={{ marginTop: 24 }}>
                        <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">Free Intelligence Tools</div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Tools That Build Authority
                        </h2>
                        <p className="text-[#8fa3b8] text-sm mt-3 max-w-lg mx-auto">
                            Stop guessing, stop searching 50 pages. One platform, every answer.
                        </p>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { href: '/tools/escort-calculator', icon: '🧮', title: 'Do I Need an Escort?', desc: 'Enter load + route, get exact escort counts for every state.', color: '#F1A91B' },
                            { href: '/escort-requirements', icon: '📋', title: 'Escort Requirements', desc: '57 countries, 67+ jurisdictions. All escort rules in one place.', color: '#22c55e' },
                            { href: '/tools/compliance-card', icon: '🎁', title: 'Compliance Card', desc: 'Free one-page PDF with every threshold for your state.', color: '#3b82f6' },
                            { href: '/tools/regulation-alerts', icon: '⚠️', title: 'Regulation Alerts', desc: 'Get notified when escort rules change. Never get fined.', color: '#ef4444' },
                        ].map(({ href, icon, title, desc, color }, i) => (
                            <Link key={href} href={href}>
                                <motion.div custom={i} variants={fadeUp}
                                    className="intelligence-card group cursor-pointer h-full" style={{ "--accent-color": color } as React.CSSProperties}>
                                    <div className="text-3xl mb-3">{icon}</div>
                                    <h3 className="font-bold text-white text-sm group-hover:text-[#C6923A] transition-colors mb-2">{title}</h3>
                                    <p className="text-[#8fa3b8] text-xs leading-relaxed">{desc}</p>
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                CORRIDOR LEADERBOARD — Social Proof / Authority
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-16">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12" style={{ marginTop: 24 }}>
                        <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">Industry Leaderboard</div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Top-Ranked Escort Operators
                        </h2>
                        <p className="text-[#8fa3b8] text-sm mt-3 max-w-lg mx-auto">
                            Real rankings based on verified performance, reliability, and corridor dominance.
                        </p>
                    </motion.div>
                    <CorridorLeaderboard />
                    <div className="text-center mt-8">
                        <Link href="/leaderboards" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#C6923A] uppercase tracking-[0.15em] hover:text-[#E0B05C] transition-colors">
                            View Full Leaderboard <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>



            {/* ═══════════════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-20">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16" style={{ marginTop: 24 }}>
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

            {/* ═══════ NATIVE AD — Homepage mid-page ═══════ */}
            <section className="relative z-10 py-8">
                <div className="hc-container max-w-5xl">
                    <NativeAdCard
                        surface="homepage_mid"
                        placementId="homepage-mid-1"
                        variant="inline"
                    />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                FEATURE GRID — FIX #14: Updated copy
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-20">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16" style={{ marginTop: 24 }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#C6923A',
                            textTransform: 'uppercase',
                            letterSpacing: '0.18em',
                            lineHeight: 1,
                            marginBottom: '10px',
                            marginTop: '6px',
                            opacity: 0.95,
                            textShadow: '0 0 10px rgba(212,175,55,0.22)',
                            WebkitFontSmoothing: 'antialiased',
                        }}>Why Haul Command</div>
                        <div style={{ width: '120px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(198,146,58,0.25), transparent)', margin: '0 auto 16px' }} />
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

            {/* ═══════════════════════════════════════════════
                FIX #20: TRUST SIGNALS — Last updated + confidence
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-8">
                <div className="hc-container max-w-3xl text-center">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#5A6577]">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Last updated: just now
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-[#C6923A]" />
                            Coverage confidence: {
                                directoryCount > 5000 && corridorCount > 50 ? 'High' :
                                    directoryCount > 500 && corridorCount > 10 ? 'Medium' : 'Building'
                            }
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-blue-400" />
                            {coveredCountries} countries with data
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                BOTTOM CTA
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 pt-20 pb-28">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="max-w-2xl mx-auto text-center px-4">
                    <div className="relative bg-[var(--hc-surface)] border border-[var(--hc-border)] rounded-3xl p-14 shadow-[0_0_80px_rgba(198,146,58,0.06)] overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.06),transparent)] pointer-events-none" />
                        <div className="relative z-10">
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#C6923A',
                                textTransform: 'uppercase',
                                letterSpacing: '0.18em',
                                lineHeight: 1,
                                marginBottom: '12px',
                                opacity: 0.95,
                                textShadow: '0 0 10px rgba(212,175,55,0.22)',
                                WebkitFontSmoothing: 'antialiased',
                            }}>Ready?</div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
                                Run a smarter corridor.
                            </h2>
                            <p className="text-[#8fa3b8] text-sm mb-10 max-w-sm mx-auto leading-relaxed font-medium">
                                Free for escorts. Brokers get 10 boost credits on activation. No card required.
                            </p>
                            <div className="mb-4 md:mb-5">
                                <Link href="/onboarding/start"
                                    className="inline-flex items-center gap-2.5 px-10 text-black font-bold text-sm rounded-2xl transition-all press-scale"
                                    style={{
                                        minHeight: 56,
                                        background: 'linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)',
                                        boxShadow: '0 4px 24px rgba(198,146,58,0.3), 0 0 48px rgba(198,146,58,0.1)',
                                    }}>
                                    Create Your Account <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════ */}
            <footer className="relative z-10 border-t border-white/[0.06]">
                <div className="hc-container py-16">
                    <style>{`
                        .footer-link-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 3rem; }
                        @media (min-width: 768px) { .footer-link-grid { grid-template-columns: repeat(4, 1fr); } }
                    `}</style>
                    <div className="footer-link-grid">
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
                            <h4 className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">Free Tools</h4>
                            <div className="space-y-2.5">
                                {[
                                    { href: "/tools/escort-calculator", label: "Escort Calculator" },
                                    { href: "/escort-requirements", label: "Escort Requirements" },
                                    { href: "/tools/compliance-card", label: "Compliance Card" },
                                    { href: "/tools/regulation-alerts", label: "Regulation Alerts" },
                                    { href: "/tools/discovery-map", label: "Discovery Map" },
                                    { href: "/services/pilot-car", label: "Pilot Car Services" },
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
                        <div className="flex gap-4 text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.1em]">
                            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                            <span className="opacity-50 text-[10px]">•</span>
                            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                            <span className="opacity-50 text-[10px]">•</span>
                            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
