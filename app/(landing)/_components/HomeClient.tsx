"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight, Search, MapPin, Shield, CheckCircle,
    Users, Globe, TrendingUp, FileText,
    Zap, BookOpen, HelpCircle, ChevronRight, Truck, Navigation,
    Award, Clock, DollarSign, AlertTriangle, Wrench,
} from "lucide-react";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";
import type { UserSignals } from "@/lib/next-moves-engine";
import { FooterAccordion } from "./FooterAccordion";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    }),
};

/* ── SERVICE TYPES (expanded from rate guides) ── */
const SERVICE_TYPES = [
    { label: "Pilot Car / PEVO", value: "pilot-car", icon: Navigation },
    { label: "Escort Vehicle", value: "escort-vehicle", icon: Truck },
    { label: "Lead / Chase Car", value: "lead-chase", icon: ArrowRight },
    { label: "Height Pole", value: "height-pole", icon: TrendingUp },
    { label: "Route Survey", value: "route-survey", icon: MapPin },
    { label: "Bucket Truck / Utility", value: "bucket-truck", icon: Wrench },
    { label: "Police Escort", value: "police-escort", icon: Shield },
    { label: "Oversize / Superload", value: "oversize", icon: Zap },
    { label: "Permit Services", value: "permit", icon: BookOpen },
    { label: "Signage / Flags", value: "signage", icon: FileText },
    { label: "Night Move Support", value: "night-move", icon: Clock },
    { label: "Rates & Intelligence", value: "rates", icon: DollarSign },
];

/* ── ROLE DEFINITIONS ── */
const ROLES = [
    {
        id: "broker",
        label: "Broker / Dispatcher",
        icon: "📋",
        desc: "I move loads and need escorts",
        goals: [
            { label: "Find Escorts Near Route", href: "/directory" },
            { label: "Post a Load", href: "/loads/post" },
            { label: "Estimate Cost", href: "/tools/escort-cost-calculator" },
            { label: "Check Escort Rules", href: "/escort-requirements" },
            { label: "Compare Operators", href: "/directory" },
            { label: "Rate Intelligence", href: "/rates" },
        ],
    },
    {
        id: "operator",
        label: "Pilot Car Operator",
        icon: "🚗",
        desc: "I provide escort / pilot car services",
        goals: [
            { label: "Claim My Profile", href: "/claim" },
            { label: "Get Certified", href: "/training" },
            { label: "View Market Rates", href: "/rates" },
            { label: "Find Available Loads", href: "/loads" },
            { label: "Check Requirements", href: "/escort-requirements" },
            { label: "Upgrade Visibility", href: "/advertise/buy" },
        ],
    },
    {
        id: "specialized",
        label: "Specialized Escort",
        icon: "🔧",
        desc: "Height pole, route survey, bucket truck",
        goals: [
            { label: "Height Pole Directory", href: "/directory?category=height-pole" },
            { label: "Route Survey Pricing", href: "/rates/route-survey" },
            { label: "Bucket Truck Support", href: "/directory?category=bucket-truck" },
            { label: "Specialty Certification", href: "/training" },
            { label: "Claim Specialist Profile", href: "/claim" },
            { label: "Superload Requirements", href: "/escort-requirements" },
        ],
    },
    {
        id: "permit",
        label: "Permit / Compliance",
        icon: "📄",
        desc: "Permits, regulations, official sources",
        goals: [
            { label: "Permit Calculator", href: "/tools/permit-cost-calculator" },
            { label: "State Requirements", href: "/escort-requirements" },
            { label: "Official Source Finder", href: "/regulations" },
            { label: "Reciprocity Guide", href: "/blog/escort-reciprocity-guide" },
            { label: "Certification Map", href: "/training" },
            { label: "120-Country Rules", href: "/regulations" },
        ],
    },
    {
        id: "carrier",
        label: "Carrier / Driver",
        icon: "🚛",
        desc: "Moving an oversize load",
        goals: [
            { label: "Do I Need an Escort?", href: "/escort-requirements" },
            { label: "Get Permit Help", href: "/tools/permit-cost-calculator" },
            { label: "Find Escorts Now", href: "/directory" },
            { label: "Route Intelligence", href: "/corridors" },
            { label: "Load Board", href: "/loads" },
            { label: "Training Hub", href: "/training" },
        ],
    },
    {
        id: "new",
        label: "New to Heavy Haul",
        icon: "🎓",
        desc: "Just starting out in the industry",
        goals: [
            { label: "Start a Pilot Car Business", href: "/blog/how-to-start-pilot-car-business" },
            { label: "Get Certified", href: "/training" },
            { label: "Equipment Checklist", href: "/blog/pilot-car-equipment-checklist-2026" },
            { label: "Industry Glossary", href: "/glossary" },
            { label: "Claim Free Profile", href: "/claim" },
            { label: "Industry Q&A", href: "/blog" },
        ],
    },
    {
        id: "police",
        label: "Police / Authority",
        icon: "🚔",
        desc: "Law enforcement escort coordination",
        goals: [
            { label: "Police Escort Requirements", href: "/escort-requirements?type=police-escort" },
            { label: "State-by-State Lead Times", href: "/blog/police-escort-lead-times" },
            { label: "Police Escort Cost Guide", href: "/rates/police-escort" },
            { label: "Coordination Resources", href: "/escort-requirements" },
            { label: "Authority Permit Guide", href: "/regulations" },
            { label: "Request Police Escort", href: "/loads/post?type=police-escort" },
        ],
    },
];

/* ── EXPANDED CATEGORIES (full rate guide service types) ── */
const CATEGORIES = [
    { label: "Pilot Cars", icon: Navigation, color: "#F1A91B", href: "/directory?category=pilot-car" },
    { label: "Escort Vehicles", icon: Truck, color: "#3B82F6", href: "/directory?category=escort-vehicle" },
    { label: "Height Poles", icon: TrendingUp, color: "#8B5CF6", href: "/directory?category=height-pole" },
    { label: "Route Survey", icon: MapPin, color: "#F59E0B", href: "/directory?category=route-survey" },
    { label: "Bucket Truck", icon: Wrench, color: "#06B6D4", href: "/directory?category=bucket-truck" },
    { label: "Lead/Chase", icon: ArrowRight, color: "#EC4899", href: "/directory?category=lead-chase" },
    { label: "Police Escort", icon: Shield, color: "#EF4444", href: "/directory?category=police-escort" },
    { label: "Night Moves", icon: Clock, color: "#6366F1", href: "/rates/specialty/night-moves" },
    { label: "Permits", icon: BookOpen, color: "#22C55E", href: "/tools/permit-cost-calculator" },
    { label: "Rate Index", icon: DollarSign, color: "#C6923A", href: "/rates" },
    { label: "Oversize", icon: Zap, color: "#F97316", href: "/directory?category=oversize" },
    { label: "Signage", icon: FileText, color: "#64748B", href: "/directory?category=signage" },
];

/* ── POPULAR STATES (US-focused but with global context) ── */
const POPULAR_STATES = [
    { name: "Texas", slug: "tx" }, { name: "Florida", slug: "fl" },
    { name: "California", slug: "ca" }, { name: "Louisiana", slug: "la" },
    { name: "Pennsylvania", slug: "pa" }, { name: "Ohio", slug: "oh" },
    { name: "Georgia", slug: "ga" }, { name: "Illinois", slug: "il" },
    { name: "New York", slug: "ny" }, { name: "Alabama", slug: "al" },
    { name: "North Carolina", slug: "nc" }, { name: "Virginia", slug: "va" },
    { name: "Michigan", slug: "mi" }, { name: "Colorado", slug: "co" },
    { name: "Tennessee", slug: "tn" }, { name: "Montana", slug: "mt" },
];

const COUNTRIES = [
    { name: "United States", slug: "us", flag: "🇺🇸" },
    { name: "Canada", slug: "ca", flag: "🇨🇦" },
    { name: "United Kingdom", slug: "gb", flag: "🇬🇧" },
    { name: "Australia", slug: "au", flag: "🇦🇺" },
    { name: "South Africa", slug: "za", flag: "🇿🇦" },
    { name: "Brazil", slug: "br", flag: "🇧🇷" },
    { name: "Germany", slug: "de", flag: "🇩🇪" },
    { name: "UAE", slug: "ae", flag: "🇦🇪" },
    { name: "Netherlands", slug: "nl", flag: "🇳🇱" },
    { name: "New Zealand", slug: "nz", flag: "🇳🇿" },
    { name: "Mexico", slug: "mx", flag: "🇲🇽" },
    { name: "Ireland", slug: "ie", flag: "🇮🇪" },
];

const TRENDING_LOCALITIES = [
    "Houston TX", "Dallas TX", "Oklahoma City OK", "Atlanta GA",
    "Jacksonville FL", "Charlotte NC", "Phoenix AZ", "Denver CO",
    "Pittsburgh PA", "Indianapolis IN", "Nashville TN", "Louisville KY",
    "Los Angeles CA", "San Antonio TX", "Kansas City MO", "Baton Rouge LA",
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
    nextMoveSignals?: Partial<UserSignals>;
}

export default function HomeClient({
    directoryCount, totalCountries, liveCountries,
    totalOperators, avgRatePerDay = 380,
}: HomeClientProps) {
    const displayCompanies = totalOperators > 0 ? totalOperators.toLocaleString() : "7,711";
    const displayCountries = liveCountries > 0 ? liveCountries : 10;
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const selectedRole = ROLES.find(r => r.id === activeRole);

    return (
        <div className="font-[family-name:var(--font-body)] antialiased bg-white text-gray-900">

            {/* ═══════════════════════════════════════
                HERO — Brand Image + Role-Aware Search
                ═══════════════════════════════════════ */}
            <section className="relative w-full bg-white pb-0">
                <div className="max-w-6xl mx-auto px-4 pt-10 pb-4 text-center">
                    <motion.h1
                        initial="hidden" animate="visible" variants={fadeUp} custom={0}
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-1 tracking-tight"
                    >
                        The Heavy Haul Operating System
                    </motion.h1>
                    <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0.5}
                        className="text-sm text-gray-500 mb-4">
                        Pilot car operators · Escort vehicles · Permits · Rates · Compliance — 120 countries
                    </motion.p>
                </div>

                {/* Hero Image + Search */}
                <div className="relative max-w-6xl mx-auto px-4">
                    <div
                        className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] overflow-hidden rounded-2xl shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #1a2332 40%, #0f1a24 70%, #0B0F14 100%)' }}
                    >
                        <img
                            src="/images/heavy_haul_bg_faded.png"
                            alt="Heavy haul escort convoy on highway"
                            className="absolute inset-0 w-full h-full object-cover object-center"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14]/85 via-[#0B0F14]/55 to-[#0B0F14]/75" />
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#F1A91B]/70 to-transparent" />

                        {/* Search + Role Tabs stacked inside hero */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pb-6">

                            {/* Role Intent Tabs */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveRole(activeRole ? null : "broker")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeRole ? 'bg-[#F1A91B] border-[#F1A91B] text-black' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                >
                                    🔍 I Need an Escort
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveRole(activeRole ? null : "operator")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${!activeRole ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                >
                                    🚗 I Provide Escorts
                                </button>
                            </div>

                            {/* Main Search Bar */}
                            <motion.form
                                action="/directory"
                                method="GET"
                                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                                className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
                            >
                                <div className="flex-[1.5] flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <select name="category" className="w-full bg-transparent text-sm text-gray-700 font-semibold focus:outline-none appearance-none cursor-pointer">
                                        <option value="">Pilot cars, escorts, permits, rates…</option>
                                        <optgroup label="─── Escort Services ───">
                                            <option value="pilot-car">Pilot Car / PEVO</option>
                                            <option value="escort-vehicle">Escort Vehicle</option>
                                            <option value="lead-chase">Lead / Chase Car</option>
                                            <option value="height-pole">Height Pole Operator</option>
                                            <option value="route-survey">Route Survey</option>
                                            <option value="bucket-truck">Bucket Truck / Utility</option>
                                            <option value="police-escort">Police Escort Coordination</option>
                                            <option value="oversize">Oversize / Superload Support</option>
                                        </optgroup>
                                        <optgroup label="─── Tools & Intelligence ───">
                                            <option value="rates">Rate Index</option>
                                            <option value="permits">Permit Services</option>
                                            <option value="training">Certification / Training</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="flex-1 flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        name="q"
                                        placeholder="City, state, corridor, or country"
                                        className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-500 font-medium focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="flex items-center justify-center bg-[#F1A91B] hover:bg-[#D4951A] text-white font-bold text-base px-7 py-3 transition-colors"
                                >
                                    Find
                                </button>
                            </motion.form>

                            {/* Quick-action chips — full 13-chip set */}
                            <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl">
                                {[
                                    { label: "Pilot Cars", href: "/directory?category=pilot-car" },
                                    { label: "Escort Vehicles", href: "/directory?category=escort-vehicle" },
                                    { label: "Available Now", href: "/available-now" },
                                    { label: "Height Pole", href: "/directory?category=height-pole" },
                                    { label: "Route Survey", href: "/directory?category=route-survey" },
                                    { label: "Bucket Truck", href: "/directory?category=bucket-truck" },
                                    { label: "Police Escort Rules", href: "/escort-requirements?type=police-escort" },
                                    { label: "Permit Help", href: "/tools/permit-cost-calculator" },
                                    { label: "Rates", href: "/rates" },
                                    { label: "Certification", href: "/training" },
                                    { label: "Multi-Day Support", href: "/rates/specialty/multi-day" },
                                    { label: "Deadhead / Repo", href: "/rates/specialty/deadhead" },
                                    { label: "Claim Profile", href: "/claim" },
                                ].map(chip => (
                                    <Link key={chip.label} href={chip.href}
                                        className="px-3 py-1 bg-white/10 hover:bg-[#F1A91B]/20 border border-white/20 hover:border-[#F1A91B]/50 text-white text-[11px] font-semibold rounded-full transition-all">
                                        {chip.label}
                                    </Link>
                                ))}
                            </div>

                            {/* Journey shortcuts — goal-first routing */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mt-1">
                                {[
                                    { label: "🔍 Find Support", href: "/directory" },
                                    { label: "💰 Estimate Rate", href: "/tools/escort-cost-calculator" },
                                    { label: "📋 Check Escort Rules", href: "/escort-requirements" },
                                    { label: "⚖️ Compare Providers", href: "/directory" },
                                    { label: "📦 Post a Load", href: "/loads/post" },
                                    { label: "🏷️ Claim My Profile", href: "/claim" },
                                    { label: "🎓 Get Certified", href: "/training" },
                                ].map(s => (
                                    <Link key={s.label} href={s.href}
                                        className="px-3 py-1 bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/30 text-white/80 hover:text-white text-[11px] font-bold rounded-md transition-all">
                                        {s.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ROLE SELECTOR — "Who are you?"
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">Choose your role for a personalized experience</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {ROLES.map(role => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => setActiveRole(activeRole === role.id ? null : role.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                                    activeRole === role.id
                                        ? 'bg-[#F1A91B] border-[#F1A91B] text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#F1A91B]/40 hover:text-[#C6923A]'
                                }`}
                            >
                                <span>{role.icon}</span>
                                <span>{role.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Role goal strip — expands when role selected */}
                    {selectedRole && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-5 p-5 bg-gradient-to-r from-[#F1A91B]/5 to-[#C6923A]/5 border border-[#F1A91B]/20 rounded-2xl"
                        >
                            <p className="text-sm font-black text-gray-900 mb-1">{selectedRole.icon} {selectedRole.label}</p>
                            <p className="text-xs text-gray-500 mb-4">{selectedRole.desc}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {selectedRole.goals.map(goal => (
                                    <Link key={goal.label} href={goal.href}
                                        className="flex flex-col items-center text-center p-3 bg-white border border-gray-200 hover:border-[#F1A91B]/40 hover:bg-[#F1A91B]/5 rounded-xl transition-all group">
                                        <span className="text-[11px] font-semibold text-gray-700 group-hover:text-[#C6923A] leading-tight">{goal.label}</span>
                                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-[#F1A91B] mt-1" />
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SERVICE CATEGORY GRID (expanded)
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-4">
                        {CATEGORIES.map((cat, i) => (
                            <motion.div key={cat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.03}>
                                <Link href={cat.href} className="flex flex-col items-center gap-1.5 group">
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: `${cat.color}18` }}
                                    >
                                        <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                                    </div>
                                    <span className="text-[10px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors text-center leading-tight">{cat.label}</span>
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
                            { value: `${displayCompanies}+`, label: "Operators Listed", icon: Users, color: "#F1A91B" },
                            { value: `${totalCountries || 120}`, label: "Countries Covered", icon: Globe, color: "#3B82F6" },
                            { value: "51", label: "Active Corridors", icon: Navigation, color: "#22C55E" },
                            { value: "23,530+", label: "Geocoded Locations", icon: MapPin, color: "#8B5CF6" },
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
                POPULAR STATES (US) + GLOBAL MARKETS
                ═══════════════════════════════════════ */}
            <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-black text-gray-900">Popular US States</h2>
                        <Link href="/directory/us" className="text-xs font-bold text-[#F1A91B] hover:underline">See all states →</Link>
                    </div>
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
                BROWSE BY COUNTRY — 120 markets
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-black text-gray-900">120 Countries. One Platform.</h2>
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline">See all 120 countries →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {COUNTRIES.map((country) => (
                            <Link
                                key={country.slug}
                                href={`/directory/${country.slug}`}
                                className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-lg transition-all group"
                            >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#C6923A] transition-colors">{country.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                GEOGRAPHY ROUTER — Corridor + Port + Near Me
                ═══════════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-900">Route-Based Intelligence</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Search by corridor, port, border crossing, or near me — global coverage</p>
                        </div>
                        <Link href="/corridors" className="text-xs font-bold text-[#F1A91B] hover:underline hidden sm:block">All corridors →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                            { label: "🛣️ Browse Corridors", sub: "51 active US/CA/AU routes", href: "/corridors" },
                            { label: "🌐 All 120 Countries", sub: "Global heavy haul network", href: "/directory" },
                            { label: "🚢 Ports & Terminals", sub: "Marine, rail, industrial", href: "/trucker-services?category=port" },
                            { label: "📍 Available Near Me", sub: "Escorts ready to dispatch", href: "/available-now" },
                        ].map(item => (
                            <Link key={item.label} href={item.href}
                                className="flex flex-col gap-1 p-4 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
                                <span className="text-sm font-bold text-gray-900 group-hover:text-[#C6923A]">{item.label}</span>
                                <span className="text-xs text-gray-500">{item.sub}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: "I-10 Gulf Coast", slug: "i-10-gulf-coast" },
                            { name: "I-35 Texas NAFTA", slug: "i-35-texas-nafta" },
                            { name: "I-95 East Coast", slug: "i-95-east-coast-run" },
                            { name: "I-5 West Coast", slug: "i-5-west-coast" },
                            { name: "I-75 Florida", slug: "i-75-florida-corridor" },
                            { name: "Hwy 63 Oil Sands (CA)", slug: "hwy-63-oil-sands" },
                            { name: "Hwy 401 Ontario (CA)", slug: "hwy-401-ontario" },
                        ].map(c => (
                            <Link key={c.slug} href={`/corridors/${c.slug}`}
                                className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-[#F1A91B]/10 hover:text-[#C6923A] border border-gray-200 hover:border-[#F1A91B]/30 rounded-full transition-all">
                                {c.name}
                            </Link>
                        ))}
                        <Link href="/corridors" className="px-3 py-1 text-xs font-bold text-[#F1A91B] hover:underline">See all →</Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRENDING LOCALITIES
                ═══════════════════════════════════════ */}
            <section className="bg-white">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Trending Escort Localities</p>
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
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline ml-2">See all →</Link>
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
                                Join {displayCompanies}+ verified operators. Claim your profile in under 60 seconds to unlock discoverability, verified badge, trust score, and broker lead flow.
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Verified badge + trust score</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search & map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Priority ranking in directory</span>
                            </div>
                            <Link
                                href="/claim"
                                className="inline-flex items-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors shadow-md"
                            >
                                Claim Your Listing Free <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                HAVE A HEAVY HAUL QUESTION?
                ═══════════════════════════════════════ */}
            <section className="bg-gradient-to-br from-[#FFF8E7] to-[#FFF0CC]">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Have a Heavy Haul Question?</h2>
                        <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
                            Ask anything about escort requirements, permit rules, and industry standards across all 120 countries. FMCSA-grounded answers instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-xl mx-auto bg-white rounded-xl p-2 border border-gray-200 shadow-md">
                            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                                <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder='"What height requires an escort in Texas?"'
                                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <button className="flex items-center justify-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white font-bold text-sm px-5 py-3 rounded-lg transition-colors">
                                Ask <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {["Escort Requirements", "OSOW Regulations", "Height/Weight Limits", "Permit Calculators", "Oversize Load Map"].map(q => (
                                <Link key={q} href="/escort-requirements" className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:text-[#C6923A] hover:border-[#F1A91B]/30 transition-all">{q}</Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ADVERTISE ON HAUL COMMAND
                ═══════════════════════════════════════ */}
            <section className="bg-white border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#C6923A] mb-2">AdGrid — Sponsor Grid</p>
                            <h2 className="text-xl font-black text-gray-900 mb-3">
                                Advertise on Haul Command & <span className="text-[#F1A91B]">Get Featured</span>
                            </h2>
                            <p className="text-sm text-gray-600 mb-4 max-w-lg">
                                Reach brokers, carriers, and dispatchers actively searching for escorts and services. Geo-targeted placements in directory, corridors, and tool pages.
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#F1A91B]" /> Real-time analytics</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#F1A91B]" /> Geo-targeted placements</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#F1A91B]" /> Featured in search results</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#F1A91B]" /> Self-serve dashboard</span>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/advertise/buy" className="inline-flex items-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
                                    View Ad Products
                                </Link>
                                <Link href="/advertise/buy" className="inline-flex items-center gap-2 border border-gray-300 hover:border-[#F1A91B]/40 px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#C6923A] transition-all">
                                    Get Proposal
                                </Link>
                            </div>
                        </div>
                        <div className="w-20 h-20 rounded-2xl bg-[#F1A91B]/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-10 h-10 text-[#F1A91B]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                I NEED / I PROVIDE — Role Entry Points
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <h2 className="text-lg font-black text-gray-900 mb-6 text-center">How Can We Help You?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/directory" className="bg-white border border-gray-200 hover:border-[#F1A91B]/40 rounded-2xl p-6 hover:shadow-md transition-all group">
                            <Search className="w-8 h-8 mb-3 text-[#F1A91B]" />
                            <h3 className="font-black text-gray-900 mb-2 group-hover:text-[#C6923A]">I Need an Escort</h3>
                            <p className="text-xs text-gray-500">Find a verified pilot car or escort vehicle near your load's origin. Real-time availability, trust scores, and instant dispatch matching.</p>
                        </Link>
                        <Link href="/claim" className="bg-white border border-gray-200 hover:border-[#F1A91B]/40 rounded-2xl p-6 hover:shadow-md transition-all group">
                            <Users className="w-8 h-8 mb-3 text-[#F1A91B]" />
                            <h3 className="font-black text-gray-900 mb-2 group-hover:text-[#C6923A]">I Provide Escorts</h3>
                            <p className="text-xs text-gray-500">Claim your free profile, verify your certifications, get booked by brokers, and unlock visibility tools — all from one dashboard.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                APP DOWNLOAD BANNER
                ═══════════════════════════════════════ */}
            <section className="bg-[#F1A91B]">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-white font-bold text-sm">📱 Get Haul Command. Track loads live.</p>
                    <Link href="/download" className="flex items-center gap-2 bg-[#0B0F14] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#1a2332] transition-colors">
                        Download the App
                    </Link>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FOOTER DIRECTORY
                ═══════════════════════════════════════ */}
            <section className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-lg font-black text-gray-900 mb-8 text-center">Take Haul Command With You</h2>
                    <FooterAccordion />
                </div>
            </section>

        </div>
    );
}
