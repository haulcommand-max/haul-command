"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, Globe, Shield, MapPin, CheckCircle, Search, Trophy
} from "lucide-react";
import {
    HcIconLoadAlerts, HcIconInsurance, HcIconDirectory,
    HcIconPermitServices, HcIconRoutePlanner, HcIconLegalCompliance,
} from "@/components/icons";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";
import { LOGO_SRC, BRAND_NAME_UPPER, ALT_TEXT } from "@/lib/config/brand";
import { MobileNavSheet } from "@/components/layout/MobileNavSheet";
import { FooterAccordion } from "./FooterAccordion";
import { NativeAdCard } from "@/components/ads/NativeAdCardLazy";
import { GlobalEscortSupplyRadar } from "./GlobalEscortSupplyRadar";
import { TrustArchitecture } from "./TrustArchitecture";

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
}

export default function HomeClient({
    directoryCount, totalCountries, liveCountries, coveredCountries,
    totalOperators, topCorridors, avgRatePerDay = 380,
}: HomeClientProps) {
    return (
        <div className="min-h-screen bg-hc-bg text-white font-[family-name:var(--font-body)]">
            <style>{`
                .landing-desktop-only { display: none !important; }
                .landing-mobile-only { display: flex !important; }
                @media (min-width: 1024px) {
                    .landing-desktop-only { display: flex !important; }
                    .landing-mobile-only { display: none !important; }
                }
                .nav-brand-logo { height: 42px !important; }
                @media (min-width: 768px) { .nav-brand-logo { height: 48px !important; } }
                @media (min-width: 1024px) { .nav-brand-logo { height: 56px !important; } }
            `}</style>
            
            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(ellipse_50%_80%_at_30%_-10%,rgba(198,146,58,0.05),transparent_60%)] animate-[amberSweep_8s_ease-in-out_infinite_alternate]" />
            </div>

{/* Navigation is now inherited from (landing)/layout.tsx via GlobalCommandBar */}

            {/* 1. HERO SECTION */}
            <section className="relative z-10 pt-16 pb-12 sm:pt-24 sm:pb-16 px-4">
                <div className="hc-container text-center max-w-4xl mx-auto">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C6923A]/30 bg-[#C6923A]/10 text-xs font-bold text-[#C6923A] mb-8 tracking-widest uppercase">
                            <Globe size={14} /> 120 Countries Covered
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 font-display drop-shadow-lg">
                            The Operating System for <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6923A] to-[#E0B05C]">Heavy Haul</span>
                        </h1>
                        <p className="text-[#a0b3c6] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                            Discover verified pilot cars, post oversize loads, and execute complex freight routing with total compliance. The global command center is ready.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/onboarding/start" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#C6923A] to-[#E0B05C] hover:from-[#E0B05C] hover:to-[#C6923A] text-white font-black text-sm transition-all shadow-[0_0_24px_rgba(198,146,58,0.25)]">
                                Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Link>
                            <Link href="/directory" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/30 text-white font-bold text-sm transition-colors">
                                Browse Directory
                            </Link>
                        </div>
                        <p className="text-[10px] text-[#555] mt-3 uppercase tracking-widest font-semibold">No card required · 60 seconds to claim</p>
                    </motion.div>
                </div>
            </section>

            {/* 2. ROLE SELECTOR CARDS */}
            <section className="relative z-10 pb-16 px-4">
                <div className="hc-container max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Broker/Carrier Card */}
                        <motion.div initial="hidden" animate="visible" custom={1} variants={scaleIn}>
                            <Link href="/onboarding/broker" className="block h-full relative group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-6 sm:p-8 hover:border-[#C6923A]/40 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mb-6">
                                        <Search className="w-6 h-6 text-[#22c55e]" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-2">I need an Escort</h2>
                                    <p className="text-[#8fa3b8] text-sm leading-relaxed mb-6 flex-grow">
                                        Post your route, check state requirements, and hire verified PEVOs instantly. Your freight, protected.
                                    </p>
                                    <div className="flex items-center font-bold text-sm text-[#22c55e] group-hover:translate-x-1 transition-transform">
                                        Post a Load <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Operator Card */}
                        <motion.div initial="hidden" animate="visible" custom={2} variants={scaleIn}>
                            <Link href="/onboarding/operator" className="block h-full relative group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-6 sm:p-8 hover:border-[#C6923A]/40 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-12 h-12 rounded-xl bg-[#C6923A]/10 border border-[#C6923A]/20 flex items-center justify-center mb-6">
                                        <Shield className="w-6 h-6 text-[#C6923A]" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-2">I am an Escort</h2>
                                    <p className="text-[#8fa3b8] text-sm leading-relaxed mb-6 flex-grow">
                                        Get localized load alerts, claim your territory, and get paid via Escrow. Built for the field.
                                    </p>
                                    <div className="flex items-center font-bold text-sm text-[#C6923A] group-hover:translate-x-1 transition-transform">
                                        Claim Profile <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. MARKET INTELLIGENCE — The moat. Live supply radar. */}
            <div className="border-t border-white/[0.04]">
                <GlobalEscortSupplyRadar />
            </div>

            {/* 4. PROOF STRIP / NETWORK ENTITIES */}
            <section className="relative z-10 py-6 border-y border-white/[0.04] bg-white/[0.01]">
                <div className="hc-container max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-12 text-center text-xs font-semibold text-[#8fa3b8] uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#C6923A]" /> {totalOperators.toLocaleString()}+ Operators
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#3b82f6]" /> 4,000+ Brokers
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#22c55e]" /> 7,000+ Tillermen
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2 text-white">
                        <MapPin className="w-4 h-4 text-[#a855f7]" /> 6,000+ Height Poles
                    </div>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#ef4444]" /> 2,500+ Route Surveyors
                    </div>
                    <div className="hidden lg:block w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2 text-[#C6923A]">
                        {liveCountries} Countries Live
                    </div>
                </div>
            </section>

            {/* 4. WHAT YOU CAN DO HERE (ICON GRID) */}
            <section className="relative z-10 py-16 sm:py-24 px-4">
                <div className="hc-container max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-2">Core Tools</h2>
                        <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">Everything You Need</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: HcIconPermitServices, color: '#3b82f6', title: 'Permits', link: '/tools/escort-calculator' },
                            { icon: HcIconLoadAlerts, color: '#22c55e', title: 'Load Board', link: '/loads' },
                            { icon: HcIconDirectory, color: '#F1A91B', title: 'Directory', link: '/directory' },
                            { icon: HcIconLegalCompliance, color: '#ef4444', title: 'Regulations', link: '/escort-requirements' },
                        ].map((tool, i) => (
                            <Link key={i} href={tool.link} className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `${tool.color}15`, color: tool.color }}>
                                    <tool.icon size={24} />
                                </div>
                                <span className="font-bold text-sm tracking-wide text-white group-hover:text-[#C6923A] transition-colors">{tool.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. HYPERLOCAL ROUTER */}
            <section className="relative z-10 py-16 sm:py-24 bg-[#0a0a0b] px-4 border-y border-white/[0.04]">
                <div className="hc-container max-w-4xl mx-auto text-center">
                    <h2 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">Hyperlocal Routing</h2>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight mb-8">Search by Market</h3>
                    <div className="max-w-2xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-grow">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8fa3b8]" />
                                <input type="text" placeholder="State, Province, or Country..." className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-[#C6923A] transition-colors" />
                            </div>
                            <Link href="/directory" className="h-14 px-8 rounded-xl bg-[#C6923A] hover:bg-[#E0B05C] text-white font-bold flex items-center justify-center whitespace-nowrap transition-colors">
                                Browse Network
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                            {['Texas', 'Alberta', 'Florida', 'I-80 Corridor', 'United Kingdom', 'New South Wales'].map(loc => (
                                <Link key={loc} href={`/directory?q=${encodeURIComponent(loc)}`} className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 text-[#8fa3b8] hover:text-white hover:border-white/30 transition-colors">
                                    {loc}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-6 pt-5 border-t border-white/[0.06]">
                            <p className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-3 text-center">State Training &amp; Requirements</p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {[
                                    { label: 'Florida', slug: 'florida' },
                                    { label: 'Texas', slug: 'texas' },
                                    { label: 'California', slug: 'california' },
                                    { label: 'Ohio', slug: 'ohio' },
                                    { label: 'Georgia', slug: 'georgia' },
                                    { label: 'Washington', slug: 'washington' },
                                ].map(({ label, slug }) => (
                                    <Link key={slug} href={`/training/region/united-states/${slug}`} className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-[#C6923A]/25 text-[#C6923A] hover:text-white hover:border-white/30 transition-colors flex items-center gap-1">
                                        {label} <ArrowRight className="w-2.5 h-2.5" />
                                    </Link>
                                ))}
                                <Link href="/training" className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 text-[#8fa3b8] hover:text-white hover:border-white/30 transition-colors">
                                    All 50 States →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. FEATURED SURFACES */}
            {topCorridors && topCorridors.length > 0 && (
                <section className="relative z-10 py-16 sm:py-24 px-4">
                    <div className="hc-container max-w-5xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-2">High Demand</h2>
                                <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">Featured Corridors</h3>
                            </div>
                            <Link href="/corridors" className="text-xs font-bold text-[#C6923A] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                                View Intelligence <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topCorridors.slice(0, 3).map((corridor, i) => (
                                <Link key={corridor.id} href={`/corridors/${corridor.slug}`} className="group block relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-[#C6923A]/50 transition-colors">
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <h4 className="font-bold text-lg text-white mb-1 group-hover:text-[#C6923A] transition-colors">{corridor.name}</h4>
                                    <p className="text-[#8fa3b8] text-xs font-semibold uppercase tracking-wider mb-4">{corridor.origin_region} &rarr; {corridor.destination_region}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="text-xs text-[#b0bac9]"><strong className="text-white">{corridor.loads_7d}</strong> Loads/wk</div>
                                        <div className="text-xs text-[#b0bac9]"><strong className="text-white">{corridor.escorts_online}</strong> Available</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* NATIVE AD */}
            <section className="relative z-10 py-4 sm:py-6 px-4">
                <div className="hc-container max-w-5xl mx-auto">
                    <NativeAdCard surface="homepage_mid" placementId="homepage-mid-1" variant="inline" />
                </div>
            </section>

            {/* 7. WHY HAUL COMMAND VS OLD WAY */}
            <section className="relative z-10 py-16 sm:py-24 px-4 bg-[#0a0a0b] border-y border-white/[0.04]">
                <div className="hc-container max-w-5xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-2">The Moat</h2>
                        <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">Why Haul Command</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            { title: 'Intelligence, Not Spray', desc: 'Stop sending mass emails. Our engine predicts fill probability based on real historical behavior.', icon: HcIconLoadAlerts, color: '#3b82f6', href: '/loads' },
                            { title: 'Escrow-Protected Payments', desc: 'Every job runs through Escrow. Funds release on confirmed completion. No disputes, no chasing.', icon: HcIconInsurance, color: '#22c55e', href: '/onboarding/broker' },
                            { title: 'Territory Dominance', desc: 'Claim corridors and counties. Find gaps in the supply chain and dominate them before your competitors do.', icon: HcIconRoutePlanner, color: '#a855f7', href: '/corridors' },
                        ].map((feat, i) => (
                            <Link key={i} href={feat.href} className="group text-center p-6 rounded-2xl border border-white/[0.04] hover:border-white/10 transition-colors block">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: `${feat.color}15`, color: feat.color, border: `1px solid ${feat.color}20` }}>
                                    <feat.icon size={24} />
                                </div>
                                <h4 className="font-bold text-lg mb-3 group-hover:text-[#C6923A] transition-colors">{feat.title}</h4>
                                <p className="text-[#8fa3b8] text-sm leading-relaxed">{feat.desc}</p>
                                <div className="flex items-center justify-center gap-1 mt-4 text-xs font-bold text-[#555] group-hover:text-[#C6923A] transition-colors">
                                    Learn more <ArrowRight className="w-3 h-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-[#666] uppercase tracking-widest">
                        <Link href="/escort-requirements" className="hover:text-[#C6923A] transition-colors">Regulations</Link>
                        <Link href="/glossary" className="hover:text-[#C6923A] transition-colors">Glossary</Link>
                        <Link href="/tools/escort-calculator" className="hover:text-[#C6923A] transition-colors">Rate Calculator</Link>
                        <Link href="/training" className="hover:text-[#C6923A] transition-colors">Training Hub</Link>
                        <Link href="/corridors" className="hover:text-[#C6923A] transition-colors">Corridor Intelligence</Link>
                        <Link href="/leaderboards" className="hover:text-[#C6923A] transition-colors">Leaderboard</Link>
                    </div>
                </div>
            </section>

            {/* 8. TRUST ARCHITECTURE — Report card, verification metrics, industry signals */}
            <div className="border-t border-white/[0.04]">
                <TrustArchitecture />
            </div>

            {/* 9. FINAL CTA */}
            <section className="relative z-10 py-16 sm:py-32 px-4">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="max-w-xl mx-auto text-center">
                    <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0b] border border-[#C6923A]/20 rounded-3xl p-8 sm:p-12 shadow-[0_0_80px_rgba(198,146,58,0.1)] overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,146,58,0.1),transparent)] pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight mb-4">
                                Ready to command your territory?
                            </h2>
                            <p className="text-[#8fa3b8] text-sm sm:text-base leading-relaxed mb-8 mx-auto max-w-sm">
                                Stop hunting for emails and spreadsheets. The global command center is ready.
                            </p>
                            <Link href="/onboarding/start" className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#C6923A] to-[#E0B05C] hover:from-[#E0B05C] hover:to-[#C6923A] text-white font-black text-sm transition-all shadow-[0_0_30px_rgba(198,146,58,0.3)]">
                                Create Your Free Account
                            </Link>
                            <p className="text-[#888] text-[10px] mt-4 uppercase tracking-widest font-semibold">
                                Takes 60 seconds. No card required.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 10. CLEAN FOOTER */}
            <FooterAccordion />
        </div>
    );
}
