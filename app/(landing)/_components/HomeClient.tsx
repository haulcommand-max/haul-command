"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, Globe, Shield, MapPin, CheckCircle, Search, Trophy, Compass
} from "lucide-react";
import {
    HcIconLoadAlerts, HcIconInsurance, HcIconDirectory,
    HcIconPermitServices, HcIconRoutePlanner, HcIconLegalCompliance,
} from "@/components/icons";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";

import { FooterAccordion } from "./FooterAccordion";
import { NativeAdCard } from "@/components/ads/NativeAdCardLazy";
import { GlobalEscortSupplyRadar } from "./GlobalEscortSupplyRadar";
import { TrustArchitecture } from "./TrustArchitecture";

// ===== ANIMATION VARIANTS =====
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
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
        <div className="bg-[#0F1318] text-white font-[family-name:var(--font-body)] antialiased selection:bg-[#C6923A] selection:text-white pb-0">
            <style>{`
                .landing-desktop-only { display: none !important; }
                .landing-mobile-only { display: flex !important; }
                @media (min-width: 1024px) {
                    .landing-desktop-only { display: flex !important; }
                    .landing-mobile-only { display: none !important; }
                }
            `}</style>
            
            {/* 1. ULTRA-POLISHED HERO SECTION */}
            <section className="relative w-full min-h-[92vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-28 pb-32 bg-[#0F1318]">
                {/* Visual Backdrop */}
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                    <img 
                        src="/images/homepage_hero_bg_1775877319950.png" 
                        alt="Heavy Haul Command Center" 
                        className="w-full h-full object-cover object-center opacity-30 scale-105 select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0F1318]/50 via-[#0F1318]/80 to-[#0F1318] z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,146,58,0.25)_0%,transparent_60%)] z-10 pointer-events-none mix-blend-screen" />
                </div>

                <div className="relative z-20 max-w-6xl mx-auto flex flex-col items-center w-full">
                    {/* Eyebrow Pill */}
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="inline-flex mb-8">
                        <span className="bg-[#1A1D24]/80 backdrop-blur-md text-[#E0B05C] border border-[#C6923A]/40 px-6 py-2.5 rounded-full text-sm font-bold tracking-[0.2em] uppercase shadow-[0_0_40px_rgba(198,146,58,0.2)]">
                            {liveCountries > 0 ? liveCountries : 120} Countries Checked In
                        </span>
                    </motion.div>
                    
                    {/* Massive Typography */}
                    <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-[52px] sm:text-[76px] md:text-[96px] lg:text-[120px] font-black tracking-tighter leading-[0.95] text-balance mb-8 text-white drop-shadow-2xl">
                        The Operating System <br className="hidden md:block" />
                        for <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F1C27B] via-[#C6923A] to-[#8A6428]">Heavy Haul</span>.
                    </motion.h1>
                    
                    {/* Subtitle */}
                    <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg md:text-2xl text-[#8fa3b8] leading-relaxed max-w-3xl text-balance mb-14 font-medium">
                        Discover verified pilot cars, post oversize loads, and execute complex freight routing with total transparency. 
                        The global command center is live.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                        <Link href="/onboarding/start" className="group relative flex items-center justify-center px-12 py-6 rounded-[24px] bg-gradient-to-b from-[#E0B05C] to-[#C6923A] text-black font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_50px_rgba(198,146,58,0.4)] hover:shadow-[0_0_80px_rgba(198,146,58,0.6)] hover:scale-[1.02] w-full sm:w-auto overflow-hidden">
                            <span className="relative z-10 flex items-center font-display">
                                GET STARTED FREE <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1.5 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-[110%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </Link>
                        <Link href="/directory" className="group flex items-center justify-center px-12 py-6 rounded-[24px] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-xl uppercase tracking-widest transition-all w-full sm:w-auto">
                            BROWSE NETWORK
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* 2. OVERLAPPING ROLE SELECTOR CARDS */}
            <section className="relative z-30 -mt-24 px-4 mb-24 sm:mb-32">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                    {/* Broker Card */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={1} variants={scaleIn}>
                        <Link href="/onboarding/broker" className="group flex flex-col items-center text-center rounded-[40px] bg-[#111214]/90 backdrop-blur-xl border border-white/[0.08] hover:border-[#22c55e]/40 p-12 sm:p-16 transition-all duration-500 hover:-translate-y-2 shadow-2xl hover:shadow-[0_40px_80px_rgba(34,197,94,0.15)] relative overflow-hidden h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/20 flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
                                <Search className="w-12 h-12 text-[#22c55e]" />
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-6 font-display tracking-tight text-white relative z-10">I need an Escort</h2>
                            <p className="text-[#8fa3b8] text-xl leading-relaxed mb-12 max-w-md mx-auto font-medium relative z-10">
                                Post your route, check state requirements, and hire verified PEVOs instantly. Your freight, protected automatically.
                            </p>
                            <div className="mt-auto px-10 py-5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-bold text-lg uppercase tracking-widest flex items-center group-hover:bg-[#22c55e] group-hover:text-black transition-colors relative z-10 border border-[#22c55e]/20 group-hover:border-transparent">
                                POST A LOAD <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>

                    {/* Operator Card */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={2} variants={scaleIn}>
                        <Link href="/onboarding/operator" className="group flex flex-col items-center text-center rounded-[40px] bg-[#111214]/90 backdrop-blur-xl border border-white/[0.08] hover:border-[#C6923A]/40 p-12 sm:p-16 transition-all duration-500 hover:-translate-y-2 shadow-2xl hover:shadow-[0_40px_80px_rgba(198,146,58,0.15)] relative overflow-hidden h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(198,146,58,0.12)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#C6923A]/20 to-[#C6923A]/5 border border-[#C6923A]/20 flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
                                <Shield className="w-12 h-12 text-[#C6923A]" />
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-6 font-display tracking-tight text-white relative z-10">I am an Escort</h2>
                            <p className="text-[#8fa3b8] text-xl leading-relaxed mb-12 max-w-md mx-auto font-medium relative z-10">
                                Get localized load alerts, claim your territory, and get paid via Escrow. The ultimate tool built entirely for the field.
                            </p>
                            <div className="mt-auto px-10 py-5 rounded-full bg-[#C6923A]/10 text-[#C6923A] font-bold text-lg uppercase tracking-widest flex items-center group-hover:bg-[#C6923A] group-hover:text-black transition-colors relative z-10 border border-[#C6923A]/20 group-hover:border-transparent">
                                CLAIM PROFILE <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* 3. RADAR / INTELLIGENCE MAP */}
            <section className="relative z-10 py-24 sm:py-32 px-4 bg-[#0F1318]">
                <div className="max-w-[1400px] mx-auto">
                    <div className="text-center mb-16 sm:mb-24">
                        <div className="inline-flex justify-center items-center gap-2 mb-6 text-[#C6923A] uppercase tracking-[0.3em] font-bold text-sm bg-[#C6923A]/10 px-6 py-2 rounded-full border border-[#C6923A]/20">
                            <span className="w-2 h-2 rounded-full bg-[#C6923A] animate-pulse" /> Live Uplink
                        </div>
                        <h3 className="text-4xl sm:text-5xl lg:text-7xl font-black font-display tracking-tight text-white">Global Supply Radar</h3>
                        <p className="text-xl sm:text-2xl text-[#8fa3b8] mt-8 max-w-3xl mx-auto font-medium leading-relaxed">
                            Tracking live PEVO movements, escort deployments, and load density across up to 120 global jurisdictions in real time.
                        </p>
                    </div>
                    
                    <div className="w-full rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_120px_rgba(198,146,58,0.12)] bg-[#111214] p-4 sm:p-8 md:p-12 relative group">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C6923A]/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                        <GlobalEscortSupplyRadar />
                    </div>
                </div>
            </section>

            {/* 4. CORE TOOLS */}
            <section className="relative z-10 py-24 sm:py-32 px-4 bg-[#111214] border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 sm:mb-28">
                        <h2 className="text-sm sm:text-base font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">Command Center</h2>
                        <h3 className="text-4xl sm:text-5xl lg:text-7xl font-black font-display tracking-tight text-white">Everything You Need</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            { icon: HcIconPermitServices, color: '#3b82f6', title: 'Permits', link: '/tools/escort-calculator', desc: "Calculator" },
                            { icon: HcIconLoadAlerts, color: '#22c55e', title: 'Load Board', link: '/loads', desc: "Live Freight" },
                            { icon: HcIconDirectory, color: '#F1A91B', title: 'Directory', link: '/directory', desc: "Find Pilots" },
                            { icon: HcIconLegalCompliance, color: '#ef4444', title: 'Regulations', link: '/escort-requirements', desc: "State Rules" },
                        ].map((tool, i) => (
                            <Link key={i} href={tool.link} className="flex flex-col items-center justify-center p-12 rounded-[40px] bg-[#1A1D24] border border-white/[0.04] hover:border-white/10 hover:bg-[#1f222a] transition-all duration-300 group shadow-lg">
                                <div className="w-24 h-24 rounded-[30px] flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ background: `${tool.color}15`, color: tool.color, boxShadow: `0 0 30px ${tool.color}10` }}>
                                    <tool.icon size={44} />
                                </div>
                                <span className="font-black text-2xl tracking-wide text-white group-hover:text-[#C6923A] transition-colors mb-2">{tool.title}</span>
                                <span className="text-[#8fa3b8] font-bold uppercase tracking-widest text-xs">{tool.desc}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. HYPERLOCAL ROUTER SEARCH */}
            <section className="relative z-10 py-24 sm:py-32 px-4 bg-[#0F1318] border-t border-white/[0.04] overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C6923A]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <h2 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-6">Market Dominance</h2>
                    <h3 className="text-4xl sm:text-5xl lg:text-7xl font-black font-display tracking-tight text-white mb-16 text-balance">
                        Find Routes & Regulations
                    </h3>
                    
                    <div className="relative group max-w-4xl mx-auto rounded-[40px]">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-[#C6923A]/40 via-[#E0B05C]/20 to-[#C6923A]/40 rounded-[44px] blur-xl opacity-30 group-hover:opacity-60 transition duration-1000" />
                        <div className="relative flex flex-col md:flex-row bg-[#1A1D24] shadow-2xl border border-white/10 rounded-[40px] p-2 md:p-3 overflow-hidden">
                            <div className="relative w-full flex-grow flex items-center">
                                <MapPin className="absolute left-8 w-8 h-8 text-[#C6923A]" />
                                <input 
                                    type="text" 
                                    placeholder="Enter State, Route, or City..." 
                                    className="w-full h-20 md:h-24 bg-transparent pl-24 pr-8 text-white text-xl md:text-3xl font-medium focus:outline-none placeholder:text-[#5A6577] tracking-wide" 
                                />
                            </div>
                            <Link href="/directory" className="h-20 md:h-24 px-10 md:px-14 md:ml-3 rounded-[30px] bg-gradient-to-r from-[#C6923A] to-[#E0B05C] hover:from-[#E0B05C] hover:to-[#C6923A] text-black font-black text-lg md:text-xl flex items-center justify-center whitespace-nowrap transition-transform hover:scale-[1.02] flex-shrink-0 shadow-lg">
                                BROWSE MARKETSPACE
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
                        {['Texas', 'Alberta', 'Florida', 'I-80 Corridor', 'United Kingdom', 'New South Wales'].map(loc => (
                            <Link key={loc} href={`/directory?q=${encodeURIComponent(loc)}`} className="text-sm font-bold px-6 py-3 rounded-full bg-white/[0.04] border border-white/[0.05] text-[#a0b3c6] hover:text-white hover:bg-white/[0.1] hover:border-white/[0.2] transition-all">
                                {loc}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* NATIVE AD OVERHAUL */}
            <section className="relative z-10 py-16 px-4 bg-[#111214] border-t border-white/[0.04]">
                <div className="max-w-6xl mx-auto border border-[#ef4444]/20 rounded-[40px] bg-gradient-to-b from-[#1A1D24] to-[#111214] p-8 sm:p-12 shadow-[0_0_80px_rgba(239,68,68,0.05)] relative overflow-hidden">
                    {/* Tiny watermark bg */}
                    <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none">
                        <HcIconLegalCompliance size={400} fill="#ef4444" />
                    </div>
                    <div className="relative z-10">
                        <NativeAdCard surface="homepage_mid" placementId="homepage-mid-1" variant="inline" />
                    </div>
                </div>
            </section>

            {/* 6. THE MOAT - WHY HAUL COMMAND */}
            <section className="relative z-10 py-24 sm:py-32 px-4 bg-[#0F1318] border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 sm:mb-28">
                        <h2 className="text-sm font-bold text-[#C6923A] uppercase tracking-[0.3em] mb-4">The Moat</h2>
                        <h3 className="text-4xl sm:text-5xl lg:text-7xl font-black font-display tracking-tight text-white mb-8">Why Use Us</h3>
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#C6923A] to-transparent mx-auto opacity-50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
                        {[
                            { title: 'Intelligence, Not Spam', desc: 'Stop sending mass emails to dead leads. Our engine predicts fill probability based on real historical behavior in your market.', icon: HcIconLoadAlerts, color: '#3b82f6', href: '/loads' },
                            { title: 'Escrow-Protected Pay', desc: 'Every job runs through Escrow. Funds are vaulted and automatically release on completion. No disputes, no chasing invoices.', icon: HcIconInsurance, color: '#22c55e', href: '/onboarding/broker' },
                            { title: 'Territory Dominance', desc: 'Claim your vital corridors and counties. Find gaps in the supply chain intelligence and completely dominate them.', icon: HcIconRoutePlanner, color: '#a855f7', href: '/corridors' },
                        ].map((feat, i) => (
                            <Link key={i} href={feat.href} className="group text-center p-12 rounded-[40px] bg-[#111214] border border-white/[0.04] hover:bg-[#1A1D24] transition-all block relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <feat.icon size={120} />
                                </div>
                                <div className="w-28 h-28 rounded-[32px] flex items-center justify-center mx-auto mb-10 transition-transform duration-500 group-hover:scale-110" style={{ background: `${feat.color}15`, color: feat.color, boxShadow: `0 0 40px ${feat.color}15` }}>
                                    <feat.icon size={50} />
                                </div>
                                <h4 className="font-black text-3xl mb-6 text-white group-hover:text-[#C6923A] transition-colors">{feat.title}</h4>
                                <p className="text-[#8fa3b8] text-lg leading-relaxed font-medium mb-10">{feat.desc}</p>
                                <div className="inline-flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-white group-hover:bg-[#C6923A] group-hover:border-[#C6923A] group-hover:text-black transition-colors uppercase tracking-widest">
                                    Learn more <ArrowRight className="w-5 h-5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. TRUST ARCHITECTURE */}
            <div className="border-t border-white/[0.04] bg-[#111214]">
                <TrustArchitecture />
            </div>

            {/* 8. FINAL BIG CTA */}
            <section className="relative z-10 py-32 sm:py-48 px-4 bg-[#0F1318]">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="max-w-5xl mx-auto text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(198,146,58,0.15)_0%,transparent_60%)] pointer-events-none mix-blend-screen" />
                    
                    <div className="relative z-10">
                        <Compass className="w-24 h-24 text-[#C6923A] mx-auto mb-10 opacity-80" />
                        <h2 className="text-5xl sm:text-6xl md:text-8xl font-black font-display tracking-tight leading-[0.95] mb-8 text-white">
                            Ready to Command?
                        </h2>
                        <p className="text-[#8fa3b8] text-xl md:text-3xl leading-relaxed mb-16 mx-auto max-w-3xl font-medium">
                            Stop hunting for emails and spreadsheets. <br className="hidden md:block" /> 
                            The new global standard is waiting for your signal.
                        </p>
                        
                        <div className="flex flex-col items-center gap-6">
                            <Link href="/onboarding/start" className="inline-flex items-center justify-center px-16 py-8 rounded-[32px] bg-gradient-to-r from-[#E0B05C] to-[#C6923A] hover:from-[#C6923A] hover:to-[#E0B05C] text-black font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_80px_rgba(198,146,58,0.4)] hover:scale-105">
                                CREATE FREE ACCOUNT
                            </Link>
                            <p className="text-[#5A6577] text-sm uppercase tracking-[0.2em] font-bold">
                                Takes 60 seconds. <span className="text-[#C6923A]">No card required.</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 9. CLEAN FOOTER */}
            <FooterAccordion />
        </div>
    );
}