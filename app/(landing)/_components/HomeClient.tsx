"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, Search, MapPin, Shield, CheckCircle, Star,
    Users, Globe, TrendingUp, Phone, MessageSquare, Award,
    ChevronRight, Truck, Navigation, Building2, FileText,
    Zap, BookOpen, HelpCircle, Download,
} from "lucide-react";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";
import type { UserSignals } from "@/lib/next-moves-engine";
import { FooterAccordion } from "./FooterAccordion";

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════ */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
};

/* ═══════════════════════════════════════
   CATEGORY ICONS
   ═══════════════════════════════════════ */
const CATEGORIES = [
    { label: "Escort Vehicles", icon: Truck, color: "#C6923A", href: "/directory?category=escort-vehicle" },
    { label: "Pilot Cars", icon: Navigation, color: "#3B82F6", href: "/directory?category=pilot-car" },
    { label: "Lead/Chase", icon: ArrowRight, color: "#EC4899", href: "/directory?category=lead-chase" },
    { label: "Height Poles", icon: TrendingUp, color: "#8B5CF6", href: "/directory?category=height-pole" },
    { label: "Signage", icon: FileText, color: "#22C55E", href: "/directory?category=signage" },
    { label: "Route Survey", icon: MapPin, color: "#F59E0B", href: "/directory?category=route-survey" },
    { label: "Permits", icon: BookOpen, color: "#EF4444", href: "/permits" },
    { label: "Oversize", icon: Zap, color: "#06B6D4", href: "/directory?category=oversize" },
];

/* ═══════════════════════════════════════
   POPULAR US STATES
   ═══════════════════════════════════════ */
const POPULAR_STATES = [
    { name: "Texas", slug: "tx" }, { name: "Florida", slug: "fl" },
    { name: "California", slug: "ca" }, { name: "Louisiana", slug: "la" },
    { name: "Pennsylvania", slug: "pa" }, { name: "Ohio", slug: "oh" },
    { name: "Georgia", slug: "ga" }, { name: "Illinois", slug: "il" },
    { name: "New York", slug: "ny" }, { name: "Alabama", slug: "al" },
    { name: "North Carolina", slug: "nc" }, { name: "Virginia", slug: "va" },
    { name: "Michigan", slug: "mi" }, { name: "New Jersey", slug: "nj" },
    { name: "Colorado", slug: "co" }, { name: "Tennessee", slug: "tn" },
];

/* ═══════════════════════════════════════
   BROWSE BY COUNTRY
   ═══════════════════════════════════════ */
const COUNTRIES = [
    { name: "United States", slug: "us", flag: "🇺🇸" },
    { name: "Canada", slug: "ca", flag: "🇨🇦" },
    { name: "United Kingdom", slug: "gb", flag: "🇬🇧" },
    { name: "Australia", slug: "au", flag: "🇦🇺" },
    { name: "South Africa", slug: "za", flag: "🇿🇦" },
    { name: "Brazil", slug: "br", flag: "🇧🇷" },
    { name: "Mexico", slug: "mx", flag: "🇲🇽" },
    { name: "UAE", slug: "ae", flag: "🇦🇪" },
];

/* ═══════════════════════════════════════
   TRENDING LOCALITIES
   ═══════════════════════════════════════ */
const TRENDING_LOCALITIES = [
    "Houston TX", "Dallas TX", "Oklahoma City OK", "Atlanta GA",
    "Jacksonville FL", "Charlotte NC", "Phoenix AZ", "Denver CO",
    "Pittsburgh PA", "Indianapolis IN", "Nashville TN", "Louisville KY",
    "Los Angeles CA", "San Antonio TX", "Kansas City MO", "Baton Rouge LA",
    "Birmingham AL", "Memphis TN", "Columbus OH", "Tampa FL",
];

/* ═══════════════════════════════════════
   COMPONENT PROPS
   ═══════════════════════════════════════ */
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
    nextMoveSignals?: Partial<UserSignals>;
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function HomeClient({
    directoryCount, totalCountries, liveCountries,
    totalOperators, avgRatePerDay = 380,
}: HomeClientProps) {
    const displayCompanies = totalOperators > 0 ? totalOperators.toLocaleString() : "2,004";
    const displayCountries = liveCountries > 0 ? liveCountries : 2;
    const displayCategories = 6;

    return (
        <div className="font-[family-name:var(--font-body)] antialiased bg-white text-gray-900">

            {/* ═══════════════════════════════════════
                HERO — Highway Photo + Search Bar
                ═══════════════════════════════════════ */}
            <section className="relative w-full bg-white pb-8">
                <div className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-center">
                    <motion.h1
                        initial="hidden" animate="visible" variants={fadeUp} custom={0}
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-2"
                    >
                        Discover Verified Pilot Cars<span className="text-xs font-bold align-text-top ml-1 text-gray-400">SM</span>
                    </motion.h1>
                </div>

                <div className="relative max-w-6xl mx-auto px-4">
                    {/* Hero Image Container with Rounded Corners (matching YP) */}
                    <div className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-2xl shadow-sm">
                        <img
                            src="/images/homepage_hero_bg_1775877319950.png"
                            alt="Heavy haul escort vehicle on highway"
                            className="w-full h-full object-cover object-center"
                        />
                        {/* Light dark overlay to ensure search bar pops */}
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Search Bar Floating Inside */}
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <motion.form
                                action="/directory"
                                method="GET"
                                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                                className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch bg-white rounded-md shadow-2xl overflow-hidden"
                            >
                                <div className="flex-[1.5] flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-300">
                                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <select name="category" className="w-full bg-transparent text-sm md:text-base text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer">
                                        <option value="">Find a business or category</option>
                                        <option value="escort-vehicle">Escort Vehicle</option>
                                        <option value="pilot-car">Pilot Car</option>
                                        <option value="height-pole">Height Pole</option>
                                        <option value="route-survey">Route Survey</option>
                                    </select>
                                </div>
                                <div className="flex-1 flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-300">
                                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        name="q"
                                        placeholder="City, State"
                                        className="w-full bg-transparent text-sm md:text-base text-gray-900 placeholder-gray-500 font-medium focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="flex items-center justify-center bg-[#FFD700] hover:bg-[#FACC15] text-gray-900 font-bold text-lg px-8 py-3 transition-colors outline-none focus:ring-2 focus:ring-[#C6923A] focus:ring-inset"
                                >
                                    Find
                                </button>
                            </motion.form>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CATEGORY ICONS ROW
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                        {CATEGORIES.map((cat, i) => (
                            <motion.div key={cat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                                <Link href={cat.href} className="flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: `${cat.color}15` }}
                                    >
                                        <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors text-center">{cat.label}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                STATS CARDS
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { value: `${displayCompanies}+`, label: "Companies", icon: Users, color: "#F1A91B" },
                            { value: String(displayCountries), label: "Countries Active", icon: Globe, color: "#3B82F6" },
                            { value: String(displayCategories), label: "Service Categories", icon: Award, color: "#22C55E" },
                            { value: "23,530+", label: "Geocoded Locations", icon: TrendingUp, color: "#8B5CF6" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                                className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow"
                            >
                                <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                                <div className="text-xs text-gray-500 font-medium mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                POPULAR STATES
                ═══════════════════════════════════════ */}
            <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <h2 className="text-lg font-black text-gray-900 mb-5">Popular States</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                        {POPULAR_STATES.map((state) => (
                            <Link
                                key={state.slug}
                                href={`/directory/us/${state.slug}`}
                                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-[#F1A91B]/10 border border-gray-200 hover:border-[#F1A91B]/30 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#C6923A] transition-all group"
                            >
                                {state.name}
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#F1A91B] transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                BROWSE BY COUNTRY
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <h2 className="text-lg font-black text-gray-900 mb-5">Browse by Country</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {COUNTRIES.map((country) => (
                            <Link
                                key={country.slug}
                                href={`/directory/${country.slug}`}
                                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-lg transition-all group"
                            >
                                <span className="text-xl">{country.flag}</span>
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#C6923A] transition-colors">{country.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#F1A91B] ml-auto transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRENDING ESCORT LOCALITIES
                ═══════════════════════════════════════ */}
            <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex flex-wrap items-center gap-2">
                        {TRENDING_LOCALITIES.map((loc) => (
                            <Link
                                key={loc}
                                href={`/near/${loc.toLowerCase().replace(/\s+/g, '-').replace(',', '')}`}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-[#F1A91B]/10 hover:text-[#C6923A] border border-gray-200 hover:border-[#F1A91B]/30 rounded-full transition-all"
                            >
                                {loc}
                            </Link>
                        ))}
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline ml-2">
                            See all &rarr;
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CLAIM YOUR FREE LISTING
                ═══════════════════════════════════════ */}
            <section className="bg-white border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                        <div className="w-16 h-16 rounded-2xl bg-[#F1A91B]/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-8 h-8 text-[#F1A91B]" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-gray-900 mb-2">Claim Your Free Listing</h2>
                            <p className="text-sm text-gray-600 mb-4 max-w-xl">
                                Join {displayCompanies}+ verified companies. Claim any alleged profile in under 60 seconds & instantly unlock discoverability, trust badges and conversion tools.
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Instant verification available</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search & on map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>
                            </div>
                            <Link
                                href="/claim"
                                className="inline-flex items-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors shadow-md"
                            >
                                Claim Your Listing <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                HAVE A HEAVY HAUL QUESTION? (HC ASK)
                ═══════════════════════════════════════ */}
            <section className="bg-gradient-to-br from-[#FFF8E7] to-[#FFF0CC]">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Have a Heavy Haul Question?</h2>
                        <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
                            Ask anything about escort requirements, permit rules, and industry standards. Our AI-powered assistant provides FMCSA-grounded answers instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-xl mx-auto bg-white rounded-xl p-2 border border-gray-200 shadow-md">
                            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                                <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="&quot;What height requires an escort in Texas?&quot;"
                                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <button className="flex items-center justify-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white font-bold text-sm px-5 py-3 rounded-lg transition-colors">
                                Ask <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {["Escort Requirements", "OSOW Regulations", "Height/Weight Limits", "Permit Calculators", "Oversize Load Map"].map((tag) => (
                                <span key={tag} className="px-3 py-1 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRENDING ESCORT LOCALITIES V2
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Trending Escort Localities</p>
                    <div className="flex flex-wrap gap-2">
                        {["Houston Pilot Cars", "DFW Escort Vehicles", "I-10 Corridor Escorts", "Gulf Coast Height Poles", "Appalachia Route Survey"].map((tag) => (
                            <Link key={tag} href="/directory" className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-[#F1A91B]/10 hover:text-[#C6923A] border border-gray-200 hover:border-[#F1A91B]/30 rounded-full transition-all">
                                {tag}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ADVERTISE ON HAUL COMMAND
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-gray-900 mb-1">
                                Advertise on Haul Command & <span className="text-[#F1A91B]">Get Featured</span>
                            </h2>
                            <p className="text-sm text-gray-600 mb-4 max-w-xl">
                                Reach decision-makers. Get priority visibility, featured listings, and high-intent broker connections. Sponsor state and corridor pages for premium lead flow.
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1">📊 Real-time analytics</span>
                                <span className="flex items-center gap-1">🎯 Geo-targeted placements</span>
                                <span className="flex items-center gap-1">💎 Featured in search results</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/sponsor" className="inline-flex items-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                                    View Ad Products
                                </Link>
                                <Link href="/sponsor/waitlist" className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                                    Get Proposal
                                </Link>
                            </div>
                        </div>
                        <div className="w-24 h-24 bg-[#0096C7]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-10 h-10 text-[#0096C7]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                HOW CAN WE HELP YOU?
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <h2 className="text-lg font-black text-gray-900 mb-6">How Can We Help You?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/directory" className="bg-white border border-gray-200 hover:border-[#F1A91B]/40 rounded-xl p-6 text-center hover:shadow-md transition-all group">
                            <Search className="w-8 h-8 mx-auto mb-3 text-[#F1A91B]" />
                            <h3 className="font-bold text-gray-900 mb-1">I Need an Escort</h3>
                            <p className="text-xs text-gray-500">Find a verified pilot car or escort vehicle near your load&apos;s origin.</p>
                        </Link>
                        <Link href="/claim" className="bg-white border border-gray-200 hover:border-[#0096C7]/40 rounded-xl p-6 text-center hover:shadow-md transition-all group">
                            <Users className="w-8 h-8 mx-auto mb-3 text-[#0096C7]" />
                            <h3 className="font-bold text-gray-900 mb-1">I Provide Escorts</h3>
                            <p className="text-xs text-gray-500">Claim your free profile, verify your certifications, and get booked by brokers.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                MOBILE APP STRIP
                ═══════════════════════════════════════ */}
            <section className="bg-[#F1A91B]">
                <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Truck className="w-6 h-6 text-white" />
                        <span className="text-sm font-bold text-white">Get Haul Command. Track loads live.</span>
                    </div>
                    <Link
                        href="/app"
                        className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                    >
                        <Download className="w-4 h-4" /> Download the App
                    </Link>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TAKE HAUL COMMAND WITH YOU
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-10 text-center">
                    <h2 className="text-lg font-black text-gray-900 mb-3">Take Haul Command With You</h2>
                    <p className="text-xs text-gray-500 mb-5 max-w-md mx-auto">
                        Real-time OS/OW pilot car dispatch, live GPS tracking, and instant booking — all from your phone.
                    </p>
                    <div className="flex justify-center gap-3">
                        <Link href="/app" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors">
                            🍎 App Store
                        </Link>
                        <Link href="/app" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-900 transition-colors">
                            ▶ Google Play
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FOOTER
                ═══════════════════════════════════════ */}
            <footer className="bg-gray-50 text-gray-500 border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-8 mb-10">
                        <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Pilot Car Directory</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/directory" className="hover:text-[#C6923A] transition-colors">Search Operators</Link></li>
                                <li><Link href="/directory/us" className="hover:text-[#C6923A] transition-colors">United States</Link></li>
                                <li><Link href="/directory/ca" className="hover:text-[#C6923A] transition-colors">Canada</Link></li>
                                <li><Link href="/near-me" className="hover:text-[#C6923A] transition-colors">Near Me</Link></li>
                                <li><Link href="/map" className="hover:text-[#C6923A] transition-colors">Map View</Link></li>
                                <li><Link href="/available-now" className="hover:text-[#C6923A] transition-colors">Available Now</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Heavy Haul Tools</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/loads" className="hover:text-[#C6923A] transition-colors">Load Board</Link></li>
                                <li><Link href="/tools/route-survey" className="hover:text-[#C6923A] transition-colors">Route Survey</Link></li>
                                <li><Link href="/tools/permit-calculator" className="hover:text-[#C6923A] transition-colors">Permit Calculator</Link></li>
                                <li><Link href="/tools/escort-calculator" className="hover:text-[#C6923A] transition-colors">Escort Cost Calculator</Link></li>
                                <li><Link href="/corridors" className="hover:text-[#C6923A] transition-colors">Corridor Intelligence</Link></li>
                                <li><Link href="/rates" className="hover:text-[#C6923A] transition-colors">Rate Index</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Resources</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/escort-requirements" className="hover:text-[#C6923A] transition-colors">Escort Requirements</Link></li>
                                <li><Link href="/training" className="hover:text-[#C6923A] transition-colors">Training Hub</Link></li>
                                <li><Link href="/resources/guides/how-to-start-pilot-car-company" className="hover:text-[#C6923A] transition-colors">Start a Pilot Car Co.</Link></li>
                                <li><Link href="/blog" className="hover:text-[#C6923A] transition-colors">Blog</Link></li>
                                <li><Link href="/tools/terminology" className="hover:text-[#C6923A] transition-colors">Glossary</Link></li>
                                <li><Link href="/regulations" className="hover:text-[#C6923A] transition-colors">Regulations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">For Operators</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/claim" className="hover:text-[#C6923A] transition-colors">Claim Profile</Link></li>
                                <li><Link href="/sponsor" className="hover:text-[#C6923A] transition-colors">Advertise</Link></li>
                                <li><Link href="/pricing" className="hover:text-[#C6923A] transition-colors">Plans & Pricing</Link></li>
                                <li><Link href="/dashboard" className="hover:text-[#C6923A] transition-colors">Dashboard</Link></li>
                                <li><Link href="/quickpay" className="hover:text-[#C6923A] transition-colors">QuickPay</Link></li>
                                <li><Link href="/referral" className="hover:text-[#C6923A] transition-colors">Referral Program</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Company</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/about" className="hover:text-[#C6923A] transition-colors">About Haul Command</Link></li>
                                <li><Link href="/press" className="hover:text-[#C6923A] transition-colors">Press</Link></li>
                                <li><Link href="/terms" className="hover:text-[#C6923A] transition-colors">Terms of Service</Link></li>
                                <li><Link href="/privacy" className="hover:text-[#C6923A] transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/partner/apply" className="hover:text-[#C6923A] transition-colors">Partner With Us</Link></li>
                                <li><Link href="/security" className="hover:text-[#C6923A] transition-colors">Security</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Haul Command" className="h-6 opacity-60" />
                            <span className="text-xs text-gray-500">© {new Date().getFullYear()} Haul Command. The Heavy Haul Operating System.</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
                            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
                            <Link href="/security" className="hover:text-gray-900">Security</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}