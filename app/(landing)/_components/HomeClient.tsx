"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight, Search, MapPin, Shield, CheckCircle,
    Users, Globe, TrendingUp, FileText,
    Zap, BookOpen, HelpCircle, ChevronRight, Truck, Navigation,
    Award, Clock, DollarSign, AlertTriangle, Wrench, Star,
    Radio, BarChart3, Flame, Package, Wind, Anchor, Cpu,
    Building2, ShoppingBag, Megaphone, BadgeCheck, Car,
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

/* ── ROLES — Lucide icons, no emojis, all 14 roles per master plan ── */
const ROLES = [
    {
        id: "broker", label: "Broker / Dispatcher", Icon: FileText,
        desc: "I move loads and need escorts",
        goals: [
            { label: "Find Escorts Near Route", href: "/directory" },
            { label: "Post a Load", href: "/loads/post" },
            { label: "Estimate Cost", href: "/tools/escort-cost-calculator" },
            { label: "Check Escort Rules", href: "/escort-requirements" },
            { label: "Rate Intelligence", href: "/rates" },
            { label: "Compare Operators", href: "/directory" },
        ],
    },
    {
        id: "operator", label: "Pilot Car Operator", Icon: Car,
        desc: "I provide lead/chase escort services",
        goals: [
            { label: "Claim My Profile", href: "/claim" },
            { label: "Get Certified", href: "/training" },
            { label: "View Market Rates", href: "/rates/guide/pilot-car" },
            { label: "Find Available Loads", href: "/loads" },
            { label: "Shortage Index", href: "/shortage-index" },
            { label: "Upgrade Visibility", href: "/advertise/buy" },
        ],
    },
    {
        id: "height-pole", label: "Height Pole Operator", Icon: TrendingUp,
        desc: "I provide height / high-pole escort services",
        goals: [
            { label: "Height Pole Directory", href: "/directory?category=height-pole" },
            { label: "Height Pole Rates", href: "/rates/guide/pilot-car#height-pole" },
            { label: "Claim Specialist Profile", href: "/claim" },
            { label: "Clearance Requirements", href: "/escort-requirements" },
            { label: "Superload Requirements", href: "/escort-requirements" },
            { label: "Get Certified", href: "/training" },
        ],
    },
    {
        id: "route-survey", label: "Route Survey", Icon: MapPin,
        desc: "I provide route survey / engineering support",
        goals: [
            { label: "Route Survey Pricing", href: "/rates/guide/oversize-support#route-survey" },
            { label: "Claim Survey Profile", href: "/claim" },
            { label: "Corridor Demand Map", href: "/corridors" },
            { label: "Bridge / Clearance Tools", href: "/tools" },
            { label: "Survey Requirements", href: "/escort-requirements" },
            { label: "All 120 Countries", href: "/directory" },
        ],
    },
    {
        id: "bucket-truck", label: "Bucket Truck / Utility", Icon: Wrench,
        desc: "I provide utility / line-lift escort support",
        goals: [
            { label: "Bucket Truck Rates", href: "/rates/guide/oversize-support#bucket-truck" },
            { label: "Claim Utility Profile", href: "/claim" },
            { label: "Police Escort Rules", href: "/escort-requirements" },
            { label: "Urban Corridor Demand", href: "/corridors" },
            { label: "Multi-Agency Pricing", href: "/rates/guide/oversize-support" },
            { label: "Find Loads", href: "/loads" },
        ],
    },
    {
        id: "carrier", label: "Carrier / Driver", Icon: Truck,
        desc: "I'm moving an oversize load",
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
        id: "permit", label: "Permit / Compliance", Icon: BookOpen,
        desc: "Permits, regulations, official sources",
        goals: [
            { label: "Permit Calculator", href: "/tools/permit-cost-calculator" },
            { label: "State Requirements", href: "/escort-requirements" },
            { label: "Official Source Finder", href: "/regulations" },
            { label: "120-Country Rules", href: "/regulations" },
            { label: "Certification Map", href: "/training" },
            { label: "Compliance Copilot", href: "/tools/compliance-copilot" },
        ],
    },
    {
        id: "police", label: "Police / Authority", Icon: Shield,
        desc: "Law enforcement escort coordination",
        goals: [
            { label: "Police Escort Requirements", href: "/escort-requirements" },
            { label: "State-by-State Lead Times", href: "/escort-requirements" },
            { label: "Police Escort Cost Guide", href: "/rates/guide/oversize-support#police" },
            { label: "Authority Permit Guide", href: "/regulations" },
            { label: "Request Police Escort", href: "/loads/post" },
            { label: "Coordination Resources", href: "/escort-requirements" },
        ],
    },
    {
        id: "new", label: "New to Heavy Haul", Icon: Star,
        desc: "Just starting out in the industry",
        goals: [
            { label: "How to Start", href: "/blog" },
            { label: "Get Certified", href: "/training" },
            { label: "Equipment Checklist", href: "/training" },
            { label: "Industry Glossary", href: "/glossary" },
            { label: "Claim Free Profile", href: "/claim" },
            { label: "Rate Guide 2026", href: "/rates/guide/pilot-car" },
        ],
    },
    {
        id: "staging", label: "Staging / Yard Owner", Icon: Building2,
        desc: "I own staging, parking, or yard space for heavy haul",
        goals: [
            { label: "List My Staging Yard", href: "/claim" },
            { label: "Corridor Demand Map", href: "/corridors" },
            { label: "Infrastructure Partner", href: "/advertise/buy" },
            { label: "Find Operators Nearby", href: "/directory" },
            { label: "Route Support Listings", href: "/trucker-services" },
            { label: "All Markets", href: "/directory" },
        ],
    },
    {
        id: "equipment", label: "Equipment / Installer", Icon: ShoppingBag,
        desc: "I sell or install pilot car equipment",
        goals: [
            { label: "Supplier Application", href: "/advertise/buy" },
            { label: "Equipment Categories", href: "/directory" },
            { label: "Installer Partner Program", href: "/advertise/buy" },
            { label: "Sponsor a Category", href: "/advertise/buy" },
            { label: "Rate Guide Reference", href: "/rates/guide/pilot-car" },
            { label: "Corridor Demand", href: "/corridors" },
        ],
    },
    {
        id: "advertiser", label: "Advertiser / Sponsor", Icon: Megaphone,
        desc: "I want to reach brokers, operators, and carriers",
        goals: [
            { label: "View Ad Products", href: "/advertise/buy" },
            { label: "Corridor Sponsorships", href: "/advertise/buy" },
            { label: "State Sponsorships", href: "/advertise/buy" },
            { label: "Category Sponsorships", href: "/advertise/buy" },
            { label: "Get a Proposal", href: "/advertise/buy" },
            { label: "AdGrid Dashboard", href: "/advertise" },
        ],
    },
    {
        id: "specialized", label: "Specialized Escort", Icon: BadgeCheck,
        desc: "Oversize, superload, or specialized escort services",
        goals: [
            { label: "Superload Directory", href: "/directory?category=oversize" },
            { label: "Specialty Certification", href: "/training" },
            { label: "Claim Specialist Profile", href: "/claim" },
            { label: "Superload Requirements", href: "/escort-requirements" },
            { label: "Police Escort Rules", href: "/escort-requirements" },
            { label: "Load Board", href: "/loads" },
        ],
    },
    {
        id: "authority", label: "State / Association", Icon: Cpu,
        desc: "Government authority or industry association",
        goals: [
            { label: "Submit Regulatory Update", href: "/contact" },
            { label: "Authority Profile", href: "/claim" },
            { label: "Verify Regulations", href: "/regulations" },
            { label: "Training Endorsement", href: "/training" },
            { label: "Data Partnership", href: "/advertise/buy" },
            { label: "Association Directory", href: "/directory" },
        ],
    },
];

/* ── LOAD TYPES — for the "Find by Load Type" section ── */
const LOAD_TYPES = [
    { label: "Wind Turbine Blade", icon: Wind, href: "/directory?load=wind-blade", tag: "High Value" },
    { label: "Power Transformer", icon: Zap, href: "/directory?load=transformer", tag: "Superload" },
    { label: "Oilfield Equipment", icon: Flame, href: "/directory?load=oilfield", tag: "High Demand" },
    { label: "Modular Home", icon: Building2, href: "/directory?load=modular-home", tag: "Common" },
    { label: "Construction Equipment", icon: Wrench, href: "/directory?load=construction", tag: "Common" },
    { label: "Port / Marine Cargo", icon: Anchor, href: "/directory?load=port-cargo", tag: "Specialty" },
    { label: "Military Equipment", icon: Shield, href: "/directory?load=military", tag: "Clearance" },
    { label: "Industrial Machinery", icon: Package, href: "/directory?load=industrial", tag: "Heavy" },
];

/* ── LIVE ACTIVITY FEED (seeded — will pull from DB when wired) ── */
const ACTIVITY_FEED = [
    { text: "Operator claimed profile in Houston, TX", time: "12m ago", icon: BadgeCheck },
    { text: "Load posted: Permian Basin → Casper, WY", time: "28m ago", icon: Truck },
    { text: "New permit alert: Texas US-287 frost law lifted", time: "1h ago", icon: AlertTriangle },
    { text: "Operator available now in Dallas, TX", time: "34m ago", icon: Radio },
    { text: "Corridor demand spike: I-10 Gulf Coast +22%", time: "2h ago", icon: TrendingUp },
];

const POPULAR_STATES = [
    { name: "Texas", slug: "tx" }, { name: "Florida", slug: "fl" },
    { name: "California", slug: "ca" }, { name: "Louisiana", slug: "la" },
    { name: "Pennsylvania", slug: "pa" }, { name: "Ohio", slug: "oh" },
    { name: "Georgia", slug: "ga" }, { name: "Illinois", slug: "il" },
    { name: "New York", slug: "ny" }, { name: "Alabama", slug: "al" },
    { name: "North Carolina", slug: "nc" }, { name: "Virginia", slug: "va" },
    { name: "Michigan", slug: "mi" }, { name: "Colorado", slug: "co" },
    { name: "Tennessee", slug: "tn" }, { name: "Montana", slug: "mt" },
    { name: "Oklahoma", slug: "ok" }, { name: "Wyoming", slug: "wy" },
    { name: "North Dakota", slug: "nd" }, { name: "Kansas", slug: "ks" },
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
    { name: "Houston TX", slug: "houston-tx", count: 47 },
    { name: "Dallas TX", slug: "dallas-tx", count: 38 },
    { name: "Oklahoma City OK", slug: "oklahoma-city-ok", count: 29 },
    { name: "Atlanta GA", slug: "atlanta-ga", count: 31 },
    { name: "Jacksonville FL", slug: "jacksonville-fl", count: 22 },
    { name: "Charlotte NC", slug: "charlotte-nc", count: 18 },
    { name: "Phoenix AZ", slug: "phoenix-az", count: 24 },
    { name: "Denver CO", slug: "denver-co", count: 21 },
    { name: "Pittsburgh PA", slug: "pittsburgh-pa", count: 16 },
    { name: "Indianapolis IN", slug: "indianapolis-in", count: 19 },
    { name: "Nashville TN", slug: "nashville-tn", count: 23 },
    { name: "Louisville KY", slug: "louisville-ky", count: 14 },
    { name: "Los Angeles CA", slug: "los-angeles-ca", count: 33 },
    { name: "San Antonio TX", slug: "san-antonio-tx", count: 26 },
    { name: "Kansas City MO", slug: "kansas-city-mo", count: 17 },
    { name: "Baton Rouge LA", slug: "baton-rouge-la", count: 20 },
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

function AnimatedCounter({ value, duration = 1800 }: { value: string; duration?: number }) {
    const [display, setDisplay] = useState('0');
    const ref = useRef<HTMLDivElement>(null);
    const animated = useRef(false);
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !animated.current) {
                animated.current = true;
                const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
                const suffix = value.replace(/[0-9,.]/g, '');
                if (isNaN(numericPart)) { setDisplay(value); return; }
                const start = Date.now();
                const tick = () => {
                    const elapsed = Date.now() - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.round(eased * numericPart);
                    setDisplay(current.toLocaleString() + suffix);
                    if (progress < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        observer.observe(node);
        return () => observer.disconnect();
    }, [value, duration]);
    return <div ref={ref}>{display}</div>;
}

export default function HomeClient({
    totalCountries, totalOperators,
}: HomeClientProps) {
    const displayOperators = totalOperators > 100 ? totalOperators.toLocaleString() : "7,711";
    const displayCountries = totalCountries > 0 ? totalCountries : 120;

    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{type:string;label:string;href:string;sub?:string}>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activityIdx, setActivityIdx] = useState(0);
    const suggestTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Rotate live activity feed
    useEffect(() => {
        const interval = setInterval(() => setActivityIdx(i => (i + 1) % ACTIVITY_FEED.length), 4000);
        return () => clearInterval(interval);
    }, []);

    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
        if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        suggestTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(val)}`);
                const data = await res.json();
                setSuggestions(data.suggestions ?? []);
                setShowSuggestions(true);
            } catch { /* fail silently */ }
        }, 200);
    };

    const SUGGEST_ICONS: Record<string,string> = { operator:'🚗', corridor:'🛣️', place:'📍', rate:'💰' };
    const selectedRole = ROLES.find(r => r.id === activeRole);

    return (
        <div className="font-[family-name:var(--font-body)] antialiased text-amber-50">

            {/* ═══════════════════════════════════════
                HERO
                ═══════════════════════════════════════ */}
            <section className="relative w-full pb-0">
                <div className="max-w-6xl mx-auto px-4 pt-10 pb-4 text-center">
                    <motion.h1
                        initial="hidden" animate="visible" variants={fadeUp} custom={0}
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 tracking-tight"
                    >
                        The Heavy Haul Operating System
                    </motion.h1>
                    <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0.5}
                        className="text-sm text-amber-200/60 mb-4">
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

                        {/* Live activity ticker */}
                        <div className="absolute top-3 left-3 right-3 flex justify-center">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm text-xs text-amber-100/80 max-w-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                                <span className="truncate">{ACTIVITY_FEED[activityIdx].text}</span>
                                <span className="text-amber-200/60 flex-shrink-0">{ACTIVITY_FEED[activityIdx].time}</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pb-6">
                            <div className="flex gap-2">
                                <button type="button"
                                    onClick={() => setActiveRole(activeRole === "broker" ? null : "broker")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeRole === "broker" ? 'bg-[#F1A91B] border-[#F1A91B] text-black' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                >
                                    🔍 I Need an Escort
                                </button>
                                <button type="button"
                                    onClick={() => setActiveRole(activeRole === "operator" ? null : "operator")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeRole === "operator" ? 'bg-[#F1A91B] border-[#F1A91B] text-black' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                >
                                    🚗 I Provide Escorts
                                </button>
                            </div>

                            <motion.form action="/directory" method="GET"
                                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                                className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch bg-white rounded-xl overflow-hidden border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus-within:border-[#F1A91B]/40 transition-all duration-300"
                            >
                                <div className="flex-[1.5] flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                                    <Search className="w-5 h-5 text-amber-200/60 flex-shrink-0" />
                                    <select name="category" className="w-full bg-transparent text-sm text-gray-700 font-semibold focus:outline-none appearance-none cursor-pointer">
                                        <option value="">Find escorts, pilot cars, permits, or rates</option>
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
                                <div className="flex-1 flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
                                    <MapPin className="w-5 h-5 text-amber-200/60 flex-shrink-0" />
                                    <input type="text" name="q" value={searchQuery}
                                        onChange={e => handleSearchInput(e.target.value)}
                                        onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        placeholder="City, state, province, corridor, or country"
                                        className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 font-medium focus:outline-none"
                                        autoComplete="off"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                            {suggestions.map((s, i) => (
                                                <a key={i} href={s.href}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                                                    <span className="text-base shrink-0">{SUGGEST_ICONS[s.type] ?? '🔍'}</span>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-800 truncate">{s.label}</div>
                                                        {s.sub && <div className="text-xs text-amber-200/60 truncate">{s.sub}</div>}
                                                    </div>
                                                    <span className="ml-auto text-[9px] font-bold text-amber-200/60 uppercase tracking-wider shrink-0">{s.type}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="submit"
                                    className="flex items-center justify-center hc-btn-primary text-base px-7 py-3 transition-all shadow-[0_0_12px_rgba(241,169,27,0.4)]">
                                    Find
                                </button>
                            </motion.form>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ROLE ROUTER — 14 roles, Lucide icons, content swaps
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-200/60 mb-3 text-center">Choose your role for a personalized experience</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {ROLES.map(role => (
                            <button key={role.id} type="button"
                                onClick={() => setActiveRole(activeRole === role.id ? null : role.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                                    activeRole === role.id
                                        ? 'hc-chip active'
                                        : 'hc-chip'
                                }`}
                            >
                                <role.Icon className="w-3.5 h-3.5" />
                                {role.label}
                            </button>
                        ))}
                    </div>

                    {selectedRole && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="mt-5 p-5 bg-gradient-to-r from-[#F1A91B]/8 to-[#C6923A]/5 border border-[#F1A91B]/20 rounded-2xl"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <selectedRole.Icon className="w-5 h-5 text-[#F1A91B]" />
                                <p className="text-sm font-black text-white">{selectedRole.label}</p>
                            </div>
                            <p className="text-xs text-amber-200/60 mb-4">{selectedRole.desc}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {selectedRole.goals.map(goal => (
                                    <Link key={goal.label} href={goal.href}
                                        className="hc-card flex flex-col items-center text-center p-3 hover:border-amber-400/40 rounded-xl transition-all group">
                                        <span className="text-[11px] font-semibold text-amber-100/80 group-hover:text-[#C6923A] leading-tight">{goal.label}</span>
                                        <ChevronRight className="w-3 h-3 text-amber-200/60 group-hover:text-[#F1A91B] mt-1" />
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════
                STATS — Fixed labels, real data fallbacks
                ═══════════════════════════════════════ */}
            <section className="bg-black/20 border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { value: `${displayOperators}+`, label: "Listed Operators", icon: Users, color: "#F1A91B", href: "/directory" },
                            { value: `${displayCountries}`, label: "Countries in Registry", icon: Globe, color: "#3B82F6", href: "/directory" },
                            { value: "51", label: "Active / Seeded Corridors", icon: Navigation, color: "#22C55E", href: "/corridors" },
                            { value: "23,530+", label: "Geocoded Support Locations", icon: MapPin, color: "#8B5CF6", href: "/available-now" },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                                <Link href={stat.href} className="hc-card block rounded-xl p-5 text-center hover:border-amber-400/30 transition-all group">
                                    <stat.icon className="w-5 h-5 mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ color: stat.color }} />
                                    <div className="hc-heading text-2xl">
                                        <AnimatedCounter value={stat.value} />
                                    </div>
                                    <div className="text-xs text-amber-200/60 font-medium mt-1">{stat.label}</div>
                                    <div className="text-[10px] text-[#C6923A] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View →</div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SHORTAGE CALLOUT — scarcity signal
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-500/40 bg-[#1a0505]/90 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Flame className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <span className="text-sm font-black text-white">Texas escort shortage: Index 56</span>
                                <span className="text-xs text-red-300/80 ml-2">Operators needed in Permian Basin, I-10, and I-35 corridors</span>
                            </div>
                        </div>
                        <div className="flex gap-3 flex-shrink-0">
                            <Link href="/shortage-index" className="text-xs font-bold text-red-400 hover:text-red-300 whitespace-nowrap underline underline-offset-2">See Shortage Index →</Link>
                            <Link href="/claim" className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg whitespace-nowrap transition-all">Claim Profile</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                RATE INTELLIGENCE WIDGET
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#C6923A]/40 bg-[#120a02]/90 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-[#F1A91B] flex-shrink-0" />
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <span className="font-bold text-amber-300">2026 Rates:</span>
                                <span className="text-white">Southeast <span className="text-[#F1A91B] font-bold">$1.65–$1.85</span>/mi</span>
                                <span className="text-white">Midwest <span className="text-[#F1A91B] font-bold">$1.75–$1.95</span>/mi</span>
                                <span className="text-white">West Coast <span className="text-[#F1A91B] font-bold">$2.00–$2.25+</span>/mi</span>
                                <span className="text-white">Day Rate <span className="text-[#F1A91B] font-bold">$450–$650</span></span>
                            </div>
                        </div>
                        <Link href="/rates/guide/pilot-car" className="text-xs font-bold text-[#F1A91B] hover:text-amber-300 whitespace-nowrap flex-shrink-0 underline underline-offset-2">Full Rate Guide 2026 →</Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TOP MARKETS — US states + global
                ═══════════════════════════════════════ */}
            <section>
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="hc-heading text-lg">Top Heavy Haul Markets</h2>
                            <p className="text-xs text-amber-200/60 mt-0.5">United States state markets — part of our 120-country registry</p>
                        </div>
                        <Link href="/directory/us" className="text-xs font-bold text-[#F1A91B] hover:underline">See all states →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {POPULAR_STATES.map((state) => (
                            <Link key={state.slug} href={`/directory/us/${state.slug}`}
                                className="hc-chip rounded-lg w-full justify-between text-sm">
                                {state.name}
                                <ChevronRight className="w-3.5 h-3.5 text-amber-200/60 group-hover:text-[#F1A91B] transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                COUNTRIES
                ═══════════════════════════════════════ */}
            <section className="bg-black/20 border-y border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="hc-heading text-lg">120 Countries. One Platform.</h2>
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline">See all 120 countries →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {COUNTRIES.map((country) => (
                            <Link key={country.slug} href={`/directory/${country.slug}`}
                                className="hc-chip rounded-lg">
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-xs font-semibold text-amber-100/80 group-hover:text-[#C6923A] transition-colors">{country.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ROUTE INTELLIGENCE
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="hc-heading text-lg">Route-Based Intelligence</h2>
                            <p className="text-xs text-amber-200/60 mt-0.5">Search by corridor, port, border crossing, or near me — global coverage</p>
                        </div>
                        <Link href="/corridors" className="text-xs font-bold text-[#F1A91B] hover:underline hidden sm:block">All corridors →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                            { label: "Browse Corridors", sub: "51 active US/CA/AU routes", href: "/corridors", Icon: Navigation },
                            { label: "All 120 Countries", sub: "Global heavy haul network", href: "/directory", Icon: Globe },
                            { label: "Ports & Terminals", sub: "Marine, rail, industrial", href: "/trucker-services?category=port", Icon: Anchor },
                            { label: "Available Near Me", sub: "Escorts ready to dispatch", href: "/available-now", Icon: Radio },
                        ].map(item => (
                            <Link key={item.label} href={item.href}
                                className="hc-card flex flex-col gap-1 p-4 hover:border-amber-400/30 transition-all group">
                                <item.Icon className="w-4 h-4 text-[#C6923A] mb-1" />
                                <span className="text-sm font-bold text-amber-50 group-hover:text-[#C6923A]">{item.label}</span>
                                <span className="text-xs text-amber-200/60">{item.sub}</span>
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
                                className="hc-chip text-xs">
                                {c.name}
                            </Link>
                        ))}
                        <Link href="/corridors" className="px-3 py-1 text-xs font-bold text-[#F1A91B] hover:underline">See all →</Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FIND BY LOAD TYPE — SEO long-tail
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="hc-heading text-lg">Find Escorts by Load Type</h2>
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline">All load types →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {LOAD_TYPES.map(lt => (
                            <Link key={lt.label} href={lt.href}
                                className="hc-card flex items-start gap-3 p-4 hover:border-amber-400/30 transition-all group">
                                <lt.icon className="w-5 h-5 text-[#C6923A] mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-xs font-bold text-amber-50 group-hover:text-[#C6923A]">{lt.label}</div>
                                    <div className="text-[10px] text-amber-200/60 mt-0.5">{lt.tag}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRENDING LOCALITIES — with operator counts
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/60 mb-3">Trending Escort Localities</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {TRENDING_LOCALITIES.map((loc) => (
                            <Link key={loc.slug} href={`/near/${loc.slug}`}
                                className="hc-chip text-xs">
                                {loc.name}
                                <span className="text-[10px] text-amber-200/60 font-normal">({loc.count})</span>
                            </Link>
                        ))}
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline ml-2">See all →</Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CLAIM LISTING + TRUST PREVIEW
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-[#F1A91B]/10 flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-[#F1A91B]" />
                            </div>
                            <h2 className="hc-heading text-xl mb-2">Claim Your Free Listing</h2>
                            <p className="text-sm text-amber-100/80 mb-4 max-w-md">
                                Your profile may already be listed. Join {displayOperators}+ operators — claim it in 60 seconds before someone else controls your visibility.
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-amber-200/60 mb-5">
                                {["Verified badge + trust score", "Appears in search & map", "Analytics + lead tracking", "Priority ranking in directory"].map(f => (
                                    <span key={f} className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> {f}</span>
                                ))}
                            </div>
                            <Link href="/claim" className="inline-flex items-center gap-2 bg-[#F1A91B] hover:bg-[#D4951A] text-black px-6 py-3 rounded-lg text-sm font-black transition-colors shadow-md">
                                Claim Your Listing Free <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {/* Trust card — shows what a claimed profile looks like */}
                        <div className="hc-card rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="hc-heading text-base">J. Martinez Escort Co.</div>
                                    <div className="text-xs text-amber-200/60 mt-0.5">Houston, TX · Pilot Car / Height Pole</div>
                                </div>
                                <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-[#F1A91B]/15 border border-[#F1A91B]/40">
                                    <span className="text-xl font-black text-[#F1A91B]">94</span>
                                    <span className="text-[9px] font-bold text-[#F1A91B] uppercase">Trust</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {["Verified Insurance", "PEVO Certified", "Height Pole", "I-10 Specialist"].map(b => (
                                    <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-semibold">{b}</span>
                                ))}
                            </div>
                            <div className="text-xs text-amber-200/60 border-t border-white/[0.06] pt-3">Active 2 hours ago · ⭐ 4.9 (127 reviews)</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                HAVE A HEAVY HAUL QUESTION? — Fixed background
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <HelpCircle className="w-8 h-8 text-[#C6923A] mx-auto mb-3" />
                        <h2 className="hc-heading text-xl sm:text-2xl mb-3">Have a Heavy Haul Question?</h2>
                        <p className="text-sm text-amber-200/60 mb-6 max-w-lg mx-auto">
                            Ask anything about escort requirements, permit rules, and industry standards across all 120 countries. FMCSA-grounded answers instantly.
                        </p>
                        <div className="hc-card flex flex-col sm:flex-row items-stretch gap-2 max-w-xl mx-auto rounded-xl p-2">
                            <div className="flex-1 flex items-center gap-2 px-4 py-3">
                                <HelpCircle className="w-4 h-4 text-amber-200/60 flex-shrink-0" />
                                <input type="text"
                                    placeholder='"What height requires an escort in Texas?"'
                                    className="w-full bg-transparent text-sm text-amber-50 placeholder-gray-500 focus:outline-none"
                                />
                            </div>
                            <button className="flex items-center justify-center gap-2 hc-btn-primary text-sm px-5 py-3 rounded-lg transition-colors">
                                Ask <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {[
                                { label: "Escort Requirements", href: "/escort-requirements" },
                                { label: "OSOW Regulations", href: "/regulations" },
                                { label: "Height/Weight Limits", href: "/escort-requirements" },
                                { label: "Permit Calculators", href: "/tools/permit-cost-calculator" },
                                { label: "Oversize Load Map", href: "/map" },
                            ].map(q => (
                                <Link key={q.label} href={q.href} className="hc-chip text-xs">{q.label}</Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                RATE GUIDE HUB
                ═══════════════════════════════════════ */}
            <section className="bg-black/20 border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="hc-heading text-lg">Rate Guide Hub</h2>
                            <p className="text-xs text-amber-200/60 mt-0.5">Know what the job should cost before you quote it.</p>
                        </div>
                        <Link href="/rates" className="text-xs font-bold text-[#F1A91B] hover:underline">All rates →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Pilot Car Rate Guide 2026", href: "/rates/guide/pilot-car", sub: "Per-mile by region + day rates" },
                            { label: "Height Pole Rates", href: "/rates/guide/pilot-car#height-pole", sub: "$1.90–$2.75/mi" },
                            { label: "Bucket Truck Escort", href: "/rates/guide/oversize-support#bucket-truck", sub: "$2.25–$3.50/mi" },
                            { label: "Route Survey Pricing", href: "/rates/guide/oversize-support#route-survey", sub: "$550–$1,200/survey" },
                            { label: "Police Escort Rates", href: "/rates/guide/oversize-support#police", sub: "$31/hr + mileage" },
                            { label: "Deadhead & Repositioning", href: "/rates/guide/pilot-car#additional", sub: "$0.75–$1.25/mi" },
                            { label: "Layover & Detention", href: "/rates/guide/pilot-car#additional", sub: "$300–$500/day" },
                            { label: "Night Move Premiums", href: "/rates/guide/pilot-car#additional", sub: "+$0.25–$0.50/mi" },
                        ].map(r => (
                            <Link key={r.label} href={r.href}
                                className="hc-card p-4 hover:border-amber-400/30 transition-all group">
                                <div className="text-xs font-bold text-amber-50 group-hover:text-[#C6923A] mb-1">{r.label}</div>
                                <div className="text-[10px] text-amber-200/60">{r.sub}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ADGRID — with scarcity messaging
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#C6923A] mb-2">AdGrid — Sponsor Grid</p>
                            <h2 className="hc-heading text-xl mb-3">
                                Advertise on Haul Command & <span className="text-[#F1A91B]">Get Featured</span>
                            </h2>
                            <p className="text-sm text-amber-100/80 mb-2 max-w-lg">
                                Reach brokers, carriers, and dispatchers actively searching for escorts. Geo-targeted placements in directory, corridors, and tool pages.
                            </p>
                            <p className="text-xs text-[#C6923A] font-bold mb-4">🔥 3 of 12 Texas corridor spots remaining · Featured in 7,711 operator profile views/month</p>
                            <div className="flex flex-wrap gap-3 text-xs text-amber-200/60 mb-5">
                                {["Real-time analytics", "Geo-targeted placements", "Featured in search results", "Self-serve dashboard"].map(f => (
                                    <span key={f} className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-[#F1A91B]" /> {f}</span>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Link href="/advertise/buy" className="inline-flex items-center gap-2 hc-btn-primary px-5 py-2.5 text-sm transition-colors">View Ad Products</Link>
                                <Link href="/advertise/buy" className="inline-flex items-center gap-2 hc-btn-secondary px-5 py-2.5 text-sm rounded-lg">Get Proposal</Link>
                            </div>
                        </div>
                        <div className="w-20 h-20 rounded-2xl bg-[#F1A91B]/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-10 h-10 text-[#F1A91B]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                BLOG / INTELLIGENCE HUB — internal link SEO
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="hc-heading text-lg">Industry Intelligence</h2>
                            <p className="text-xs text-amber-200/60 mt-0.5">Guides, requirements, and market intelligence for heavy haul professionals.</p>
                        </div>
                        <Link href="/blog" className="text-xs font-bold text-[#F1A91B] hover:underline">All articles →</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { title: "Texas Oversize Escort Requirements 2026", href: "/blog/texas-escort-requirements-2026", tag: "Regulations" },
                            { title: "Florida FDOT Pilot Car Certification 2026", href: "/blog/florida-fdot-certification-2026", tag: "Certification" },
                            { title: "I-10 Corridor Heavy Haul Guide", href: "/blog/i-10-corridor-heavy-haul-guide", tag: "Corridors" },
                            { title: "How to Get More Loads as a Pilot Car Operator", href: "/blog/how-to-get-more-loads-pilot-car", tag: "Business" },
                            { title: "Louisiana Oversize Escort Requirements 2026", href: "/blog/louisiana-escort-requirements-2026", tag: "Regulations" },
                            { title: "Escort Shortage Index 2026", href: "/shortage-index", tag: "Market Data" },
                        ].map(a => (
                            <Link key={a.href} href={a.href}
                                className="hc-card p-4 hover:border-amber-400/30 transition-all group">
                                <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-wider mb-1.5">{a.tag}</div>
                                <div className="text-xs font-bold text-amber-50 group-hover:text-[#C6923A] leading-snug">{a.title}</div>
                                <div className="flex items-center gap-1 text-[10px] text-amber-200/60 mt-2 group-hover:text-[#F1A91B]">Read more <ChevronRight className="w-3 h-3" /></div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                HOW CAN WE HELP
                ═══════════════════════════════════════ */}
            <section className="bg-black/20 border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <h2 className="hc-heading text-lg mb-6 text-center">How Can We Help You?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/directory" className="hc-card hover:border-amber-400/40 rounded-2xl p-6 transition-all group">
                            <Search className="w-8 h-8 mb-3 text-[#F1A91B]" />
                            <h3 className="font-black text-white mb-2 group-hover:text-[#C6923A]">I Need an Escort</h3>
                            <p className="text-xs text-amber-200/60">Find a verified pilot car or escort vehicle near your load's origin. Real-time availability, trust scores, and instant dispatch matching.</p>
                        </Link>
                        <Link href="/claim" className="hc-card hover:border-amber-400/40 rounded-2xl p-6 transition-all group">
                            <Users className="w-8 h-8 mb-3 text-[#F1A91B]" />
                            <h3 className="font-black text-white mb-2 group-hover:text-[#C6923A]">I Provide Escorts</h3>
                            <p className="text-xs text-amber-200/60">Claim your free profile, verify your certifications, get booked by brokers, and unlock visibility tools — all from one dashboard.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                APP DOWNLOAD
                ═══════════════════════════════════════ */}
            <section className="bg-[#0B0F14] border-t border-[#F1A91B]/20">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-white font-bold text-sm">📱 Get Haul Command. Track loads live.</p>
                    <div className="flex gap-3">
                        <Link href="/download" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-xs font-black hover:bg-gray-100 transition-colors">
                            🍎 App Store
                        </Link>
                        <Link href="/download" className="flex items-center gap-2 bg-[#F1A91B] text-black px-4 py-2 rounded-lg text-xs font-black hover:bg-[#D4951A] transition-colors">
                            ▶ Google Play
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER DIRECTORY */}
            <section className="border-t border-white/[0.06] py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="hc-heading text-lg mb-8 text-center">Take Haul Command With You</h2>
                    <FooterAccordion />
                </div>
            </section>

        </div>
    );
}
