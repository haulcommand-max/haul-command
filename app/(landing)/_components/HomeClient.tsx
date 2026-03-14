"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    CheckCircle, ArrowRight, Clock, Globe, ChevronDown, ChevronRight, Shield,
    TrendingUp, Award, Flame,
} from "lucide-react";
import {
    HcIconLoadAlerts, HcIconInsurance, HcIconLoadBoard,
    HcIconMap, HcIconRoutePlanner, HcIconDirectory,
    HcIconHeavyHaulTrucking, HcIconPilotCarOperators,
    HcIconPermitServices, HcIconLegalCompliance,
    HcIconUrgentServices, HcIconReportCards,
} from "@/components/icons";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";
import { LOGO_SRC, LOGO_MARK_SRC, BRAND_NAME_UPPER, ALT_TEXT } from "@/lib/config/brand";

// ── New Command Center Components ──
import { LiveMarketHero } from "./LiveMarketHero";
import { LiveLoadsTicker } from "./LiveLoadsTicker";
import { CorridorOpportunityCards } from "./CorridorOpportunityCards";
import { GlobalEscortSupplyRadar } from "./GlobalEscortSupplyRadar";
import MarketConditionsPanel from "@/components/intelligence/MarketConditionsPanel";
import { MarketTerminalRibbon } from "@/components/market/MarketTerminalRibbon";
import { CorridorLeaderboard } from "@/components/gamification/CorridorLeaderboard";
import { NativeAdCard } from "@/components/ads/NativeAdCard";
import { FooterAccordion } from "./FooterAccordion";

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

// ===== DATA: FEATURES MOAT =====
const FEATURES = [
    {
        icon: HcIconReportCards, title: "Stage Probability",
        desc: "Our engine predicts the likelihood an escort will accept your load — using real historical behavior, not guesswork.",
        color: "#F1A91B", hcIcon: true,
    },
    {
        icon: HcIconInsurance, title: "Escrow-Protected Payments",
        desc: "Every job runs through escrow. Funds release on confirmed completion. No disputes, no chasing.",
        color: "#22c55e", hcIcon: true,
    },
    {
        icon: HcIconLoadAlerts, title: "One-Tap Accept",
        desc: "Fast confirmation keeps loads moving. Escorts go from push notification to accepted in under two taps.",
        color: "#3b82f6", hcIcon: true,
    },
    {
        icon: HcIconMap, title: "Territory Intelligence",
        desc: "Claim corridors and counties. See shortage zones and hard-fill alerts before your competitors do.",
        color: "#a855f7", hcIcon: true,
    },
    {
        icon: HcIconUrgentServices, title: "Hard-Fill Alerts",
        desc: "When a load starts timing out, broker fix options appear automatically — raise the rate, widen the window.",
        color: "#ef4444", hcIcon: true,
    },
    {
        icon: HcIconDirectory, title: "57-Country Expansion",
        desc: "Heavy haul doesn't stop at borders. Same intelligence engine, localized compliance, global reach.",
        color: "#F1A91B", hcIcon: true,
    },
];

// ===== HOW IT WORKS =====
const HOW_IT_WORKS = [
    {
        role: "For Brokers", color: "#F1A91B", icon: HcIconHeavyHaulTrucking, hcIcon: true,
        steps: [
            "Post load with dimensions, route & rate",
            "Intelligence engine scores fill probability in real time",
            "Matched escorts accept in one tap — you see it instantly",
        ],
    },
    {
        role: "For Escorts", color: "#22c55e", icon: HcIconPilotCarOperators, hcIcon: true,
        steps: [
            "Toggle available — your presence goes live on the map",
            "Receive push offers filtered to your capabilities and territory",
            "Accept in one tap. Status auto-sets to busy. Done.",
        ],
    },
];

// ===== FREE TOOLS =====
const FREE_TOOLS = [
    { href: '/tools/escort-calculator', IconCmp: HcIconRoutePlanner, title: 'Do I Need an Escort?', desc: 'Enter load + route, get exact escort counts for every state.', color: '#F1A91B', cta: 'Check Now' },
    { href: '/escort-requirements', IconCmp: HcIconPermitServices, title: 'Escort Requirements', desc: '57 countries, 67+ jurisdictions. All escort rules in one place.', color: '#22c55e', cta: 'Look Up' },
    { href: '/tools/compliance-card', IconCmp: HcIconLegalCompliance, title: 'Compliance Card', desc: 'Free one-page PDF with every threshold for your state.', color: '#3b82f6', cta: 'Download' },
    { href: '/tools/regulation-alerts', IconCmp: HcIconUrgentServices, title: 'Regulation Alerts', desc: 'Get notified when escort rules change. Never get fined.', color: '#ef4444', cta: 'Subscribe' },
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

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT — Command Center Layout
// Order: Market Hero → Map → Ticker → Opportunities →
//        Market Conditions → Leaderboard → Tools → Moat → CTA → Footer
// ═══════════════════════════════════════════════════════════════
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
                .nav-brand-logo { height: 42px !important; }
                @media (min-width: 768px) { .nav-brand-logo { height: 48px !important; } }
                @media (min-width: 1024px) { .nav-brand-logo { height: 56px !important; } }
            `}</style>

            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.012)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(198,146,58,0.08),transparent_70%)]" />
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_50%_80%_at_30%_-10%,rgba(198,146,58,0.06),transparent_60%)] animate-[amberSweep_8s_ease-in-out_infinite_alternate]" />
            </div>

            {/* ═══════════════════════════════════════════════
                NAVIGATION
            ═══════════════════════════════════════════════ */}
            <nav className="relative z-50 border-b border-white/[0.06] safe-area-header" style={{
                background: 'rgba(11,11,12,0.85)',
                backdropFilter: 'blur(24px) saturate(1.5)',
            }}>
                <div className="hc-container h-14 sm:h-16 flex items-center justify-between">
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '8px 10px 8px 0', textDecoration: 'none' }}>
                        <Image
                            src={LOGO_SRC} alt={ALT_TEXT} width={220} height={48} priority
                            className="nav-brand-logo"
                            style={{ objectFit: 'contain', objectPosition: 'left center', width: 'auto', maxHeight: '40px', display: 'block', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.35)) contrast(1.05) saturate(1.05)' }}
                        />
                    </Link>
                    <div className="landing-desktop-only items-center" style={{ gap: '2rem', fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
                        <Link href="/directory" className="hover:text-[#C6923A] transition-colors py-2">Directory</Link>
                        <Link href="/loads" className="hover:text-[#C6923A] transition-colors py-2">Load Board</Link>
                        <Link href="/tools/escort-calculator" className="hover:text-[#C6923A] transition-colors py-2">Tools</Link>
                        <Link href="/escort-requirements" className="hover:text-[#C6923A] transition-colors py-2">Requirements</Link>
                        <Link href="/leaderboards" className="hover:text-[#C6923A] transition-colors py-2">Leaderboard</Link>
                    </div>
                    <div className="flex items-center" style={{ flexShrink: 0 }}>
                        <Link href="/login" className="hover:text-white transition-colors hc-btn hc-btn--black" style={{ fontSize: '12px', padding: '10px 18px', borderRadius: '12px' }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════
                1. MARKET TERMINAL RIBBON — Live metrics strip
            ═══════════════════════════════════════════════ */}
            <MarketTerminalRibbon />

            {/* ═══════════════════════════════════════════════
                2. LIVE MARKET HERO — Command Center Surface
                   Replaces decorative hero with live data + role router
            ═══════════════════════════════════════════════ */}
            <LiveMarketHero
                totalOperators={totalOperators || directoryCount}
                corridorCount={totalCorridors || corridorCount}
                openLoads={openLoads}
                medianFillMin={medianFillMin}
            />

            {/* ═══════════════════════════════════════════════
                3. GLOBAL ESCORT SUPPLY RADAR — Map elevated to top
            ═══════════════════════════════════════════════ */}
            <GlobalEscortSupplyRadar />

            {/* ═══════════════════════════════════════════════
                4. LIVE LOADS TICKER — Stock-market activity feed
            ═══════════════════════════════════════════════ */}
            <LiveLoadsTicker />

            {/* ═══════════════════════════════════════════════
                5. CORRIDOR OPPORTUNITIES — Actionable decision cards
            ═══════════════════════════════════════════════ */}
            <CorridorOpportunityCards
                corridors={topCorridors}
                corridorCount={corridorCount}
            />

            {/* ═══════════════════════════════════════════════
                6. MARKET CONDITIONS PANEL — Rate intelligence
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-8 sm:py-12">
                <div className="hc-container max-w-5xl">
                    <MarketConditionsPanel />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                7. CORRIDOR LEADERBOARD — Claim Rank Loop
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-8 sm:py-12">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-end justify-between mb-5 sm:mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">
                                    Industry Leaderboard
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                                Top-Ranked Operators
                            </h2>
                        </div>
                        <Link href="/leaderboards" className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.15em] hover:text-[#E0B05C] transition-colors hidden sm:inline-flex items-center gap-1">
                            Full Leaderboard <ArrowRight className="w-3 h-3" />
                        </Link>
                    </motion.div>
                    <CorridorLeaderboard />
                    {/* Claim CTA — loop-feeding */}
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Claim Your Corridor Rank</div>
                                <div className="text-[11px] text-[#8fa3b8]">Get verified, earn your position, get priority loads.</div>
                            </div>
                        </div>
                        <Link href="/onboarding/claim" className="inline-flex items-center gap-2 text-xs font-bold text-black px-5 py-2.5 rounded-xl transition-all" style={{ background: "linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)" }}>
                            Claim Now <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                8. FREE TOOLS — Loop-feeding conversion engines
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-8 sm:py-12">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-6 sm:mb-10">
                        <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-2">Free Intelligence Tools</div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Start Here — No Account Needed
                        </h2>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {FREE_TOOLS.map(({ href, IconCmp, title, desc, color, cta }, i) => (
                            <Link key={href} href={href}>
                                <motion.div custom={i} variants={fadeUp}
                                    className="intelligence-card group cursor-pointer h-full" style={{ "--accent-color": color } as React.CSSProperties}>
                                    <div className="mb-3 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl mx-auto" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
                                        <IconCmp size={20} style={{ color }} />
                                    </div>
                                    <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-[#C6923A] transition-colors mb-1 text-center">{title}</h3>
                                    <p className="text-[#8fa3b8] text-[10px] sm:text-xs leading-relaxed text-center mb-3">{desc}</p>
                                    <div className="text-center">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg border transition-colors"
                                            style={{ color, borderColor: `${color}30`, backgroundColor: `${color}08` }}>
                                            {cta} <ArrowRight style={{ width: 10, height: 10 }} />
                                        </span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════ NATIVE AD — Homepage mid-page ═══════ */}
            <section className="relative z-10 py-4 sm:py-6">
                <div className="hc-container max-w-5xl">
                    <NativeAdCard surface="homepage_mid" placementId="homepage-mid-1" variant="inline" />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                9. HOW IT WORKS — Both sides of the match
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-8 sm:py-12">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-6 sm:mb-10">
                        <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-2">How It Works</div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Built for Both Sides
                        </h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        {HOW_IT_WORKS.map(({ role, color, steps, icon: RoleIcon, hcIcon }) => (
                            <motion.div key={role} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                                className="intelligence-card" style={{ "--accent-color": color } as React.CSSProperties}>
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 mx-auto"
                                        style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                                        {hcIcon ? <RoleIcon size={20} style={{ color }} /> : <RoleIcon className="w-5 h-5" style={{ color }} />}
                                    </div>
                                    <h3 className="font-bold text-xs uppercase tracking-[0.15em] mb-3 sm:mb-4" style={{ color }}>
                                        {role}
                                    </h3>
                                    <div className="inline-block text-left">
                                        <ol className="space-y-2.5 sm:space-y-3 list-none p-0 m-0">
                                            {steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-2.5">
                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border mt-0.5"
                                                        style={{ color, borderColor: `${color}30`, backgroundColor: `${color}12` }}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: 'var(--hc-muted)' }}>
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

            {/* ═══════════════════════════════════════════════
                10. MOAT — Why Haul Command
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-8 sm:py-12">
                <div className="hc-container max-w-5xl">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-6 sm:mb-10">
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.18em', lineHeight: 1, marginBottom: '8px', opacity: 0.95 }}>
                            Why Haul Command
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            The Moat No One Else Has
                        </h2>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                        {FEATURES.map(({ icon: Icon, title, desc, color, hcIcon }, i) => (
                            <motion.div key={title} custom={i} variants={fadeUp}
                                className="intelligence-card group" style={{ "--accent-color": color } as React.CSSProperties}>
                                <div className="text-center">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 mx-auto"
                                        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}15` }}>
                                        {hcIcon ? <Icon size={18} style={{ color }} /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />}
                                    </div>
                                    <h3 className="font-bold text-white text-xs sm:text-sm mb-1">{title}</h3>
                                    <p className="text-[#8fa3b8] text-[11px] sm:text-xs leading-relaxed">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                11. EXPANSION STATUS — Truthful market labels
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-6">
                <div className="hc-container max-w-3xl">
                    <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.15em]">
                                Expanding Across {totalCountries} Countries
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                            {[
                                { region: 'United States', status: 'live', color: '#22c55e' },
                                { region: 'Canada', status: 'live', color: '#22c55e' },
                                { region: 'Australia', status: 'expanding', color: '#F59E0B' },
                                { region: 'United Kingdom', status: 'planned', color: '#60a5fa' },
                                { region: 'Germany', status: 'planned', color: '#60a5fa' },
                                { region: 'Brazil', status: 'future', color: '#6b7280' },
                            ].map(({ region, status, color }) => (
                                <div key={region} className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: status === 'live' ? `0 0 6px ${color}60` : 'none' }} />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color }}>
                                        {status === 'live' ? 'LIVE' : status === 'expanding' ? 'NEXT' : status === 'planned' ? 'PLANNED' : 'FUTURE'}
                                    </span>
                                    <span className="text-[11px] font-medium" style={{ color: status === 'live' ? '#E5E7EB' : '#9CA3AF' }}>
                                        {region}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                12. TRUST SIGNALS — Coverage confidence
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-4">
                <div className="hc-container max-w-3xl text-center">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-[#5A6577]">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Last updated: just now
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <HcIconInsurance size={10} style={{ color: '#C6923A' }} />
                            Coverage: {
                                directoryCount > 5000 && corridorCount > 50 ? 'High' :
                                    directoryCount > 500 && corridorCount > 10 ? 'Medium' : 'Building'
                            }
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5 text-blue-400" />
                            {coveredCountries} countries with data
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                13. BOTTOM CTA — Quick activation
            ═══════════════════════════════════════════════ */}
            <section className="relative z-10 py-10 sm:py-16">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="max-w-lg mx-auto text-center px-4">
                    <div className="relative bg-[var(--hc-surface)] border border-[var(--hc-border)] rounded-2xl p-6 sm:p-10 shadow-[0_0_60px_rgba(198,146,58,0.06)] overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.06),transparent)] pointer-events-none" />
                        <div className="relative z-10">
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '10px' }}>
                                Ready?
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
                                Run a smarter corridor.
                            </h2>
                            <p className="text-[#8fa3b8] text-xs sm:text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                                Free for escorts. Brokers get 10 boost credits on activation. No card required.
                            </p>
                            <Link href="/onboarding/start"
                                className="inline-flex items-center gap-2 text-black font-bold text-sm rounded-2xl transition-all press-scale"
                                style={{
                                    minHeight: 48,
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)',
                                    boxShadow: '0 4px 24px rgba(198,146,58,0.3), 0 0 48px rgba(198,146,58,0.1)',
                                }}>
                                Create Free Account <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════
                14. FOOTER — Mobile accordion
            ═══════════════════════════════════════════════ */}
            <FooterAccordion />
        </div>
    );
}
