"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight, Search, MapPin, Shield, CheckCircle,
    Users, TrendingUp,
    ChevronRight, Truck, Navigation, Building2, FileText,
    Zap, BookOpen, HelpCircle, Download,
} from "lucide-react";
import type { MarketPulseData, DirectoryListing, CorridorData } from "@/lib/server/data";
import type { HeroPack } from "@/components/hero/heroPacks";
import type { HomepageHeroChip } from "@/lib/homepage/role-chips";
import { buildHeroRoleWindow } from "@/lib/homepage/hero-role-rotation";
import type { UserSignals } from "@/lib/next-moves-engine";

/* ═══════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════ */
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
   GLOBAL MARKET STATUS
   ═══════════════════════════════════════ */
const GLOBAL_MARKETS = [
    { name: "United States", slug: "us", flag: "🇺🇸", status: "Live", statusColor: "text-green-600" },
    { name: "Canada", slug: "ca", flag: "🇨🇦", status: "Live", statusColor: "text-green-600" },
    { name: "Australia", slug: "au", flag: "🇦🇺", status: "Seeded", statusColor: "text-blue-500" },
    { name: "United Kingdom", slug: "gb", flag: "🇬🇧", status: "Seeded", statusColor: "text-blue-500" },
    { name: "South Africa", slug: "za", flag: "🇿🇦", status: "Seeded", statusColor: "text-blue-500" },
    { name: "New Zealand", slug: "nz", flag: "🇳🇿", status: "Expanding", statusColor: "text-amber-600" },
    { name: "Brazil", slug: "br", flag: "🇧🇷", status: "Expanding", statusColor: "text-amber-600" },
    { name: "Germany", slug: "de", flag: "🇩🇪", status: "Expanding", statusColor: "text-amber-600" },
    { name: "Netherlands", slug: "nl", flag: "🇳🇱", status: "Expanding", statusColor: "text-amber-600" },
    { name: "UAE", slug: "ae", flag: "🇦🇪", status: "Seeded", statusColor: "text-blue-500" },
    { name: "Mexico", slug: "mx", flag: "🇲🇽", status: "Seeded", statusColor: "text-blue-500" },
    { name: "Ireland", slug: "ie", flag: "🇮🇪", status: "Expanding", statusColor: "text-amber-600" },
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

const ROUTE_INTEL_LINKS = [
    { title: "Browse Corridors", body: "51 active US/CA/AU routes" },
    { title: "120-country Framework", body: "Global heavy haul coverage model" },
    { title: "Ports & Terminals", body: "Marine, rail, industrial" },
    { title: "Available Near Me", body: "Escorts ready to dispatch" },
];

const FEATURED_CORRIDORS = [
    "I-10 Gulf Coast", "I-35 Texas NAFTA", "I-95 East Coast", "I-5 West Coast",
    "I-75 Florida", "Hwy 63 Oil Sands (CA)", "Hwy 401 Ontario (CA)",
];

const LOAD_TYPES = [
    { title: "Wind Turbine Blade", tag: "High Value" },
    { title: "Power Transformer", tag: "Superload" },
    { title: "Oilfield Equipment", tag: "High Demand" },
    { title: "Modular Home", tag: "Common" },
    { title: "Construction Equipment", tag: "Common" },
    { title: "Port / Marine Cargo", tag: "Specialty" },
    { title: "Military Equipment", tag: "Clearance" },
    { title: "Industrial Machinery", tag: "Heavy" },
];

const RATE_GUIDES = [
    { title: "Pilot Car Rate Guide 2026", body: "Per-mile by region + day rates" },
    { title: "Height Pole Rates", body: "$1.90-$2.75/mi" },
    { title: "Bucket Truck Escort", body: "$2.25-$3.50/mi" },
    { title: "Route Survey Pricing", body: "$550-$1,200/survey" },
    { title: "Police Escort Rates", body: "$31/hr + mileage" },
    { title: "Deadhead & Repositioning", body: "$0.75-$1.25/mi" },
    { title: "Layover & Detention", body: "$300-$500/day" },
    { title: "Night Move Premiums", body: "+$0.25-$0.50/mi" },
];

const INDUSTRY_ARTICLES = [
    { category: "Regulations", title: "Texas Oversize Escort Requirements 2026" },
    { category: "Certification", title: "Florida FDOT Pilot Car Certification 2026" },
    { category: "Corridors", title: "I-10 Corridor Heavy Haul Guide" },
    { category: "Business", title: "How to Get More Loads as a Pilot Car Operator" },
    { category: "Regulations", title: "Louisiana Oversize Escort Requirements 2026" },
    { category: "Market Data", title: "Escort Shortage Index 2026" },
];

const FAQ_ITEMS = [
    {
        question: "What is a pilot car or escort vehicle?",
        answer: "A pilot car, also called an escort vehicle or PEVO, travels ahead of or behind an oversize load to warn traffic, check route clearances, and communicate with the load driver.",
        href: "/tools/terminology",
        cta: "Pilot car glossary",
    },
    {
        question: "How do I find a pilot car near me?",
        answer: "Search Haul Command by city, state, corridor, or country. Filter by equipment type, certification status, trust signals, and availability.",
        href: "/directory",
        cta: "Search directory",
    },
    {
        question: "Can operators claim a free Haul Command listing?",
        answer: "Yes. Claim your company listing to set your phone number, services, coverage area, certifications, and equipment. No credit card required.",
        href: "/claim",
        cta: "Claim your listing",
    },
    {
        question: "Does Haul Command cover more than the United States?",
        answer: "Yes. Haul Command is building a 120-country coverage model, with live and expanding market depth across the US, Canada, Australia, UK, Germany, UAE, South Africa, Brazil, and more.",
        href: "/directory",
        cta: "Browse all countries",
    },
    {
        question: "Can brokers post or route oversize loads?",
        answer: "Yes. Brokers and carriers can post loads, search available escorts on active corridors, and request route intelligence by load type.",
        href: "/loads/post",
        cta: "Post a load",
    },
    {
        question: "Can staging yards, equipment installers, or sponsors join?",
        answer: "Yes. Haul Command supports staging yards, secure parking, equipment suppliers, bucket truck operators, permit agents, route surveyors, training providers, and advertisers.",
        href: "/partner/apply",
        cta: "Join as a partner",
    },
];

const FALLBACK_POSITION_CHIPS: HomepageHeroChip[] = [
    { id: "pilot-car-operator", label: "Pilot Car Operator", type: "role", href: "/directory?q=Pilot%20Car%20Operator", priority: 80, weight: 1 },
    { id: "high-pole-escort", label: "High Pole Escort", type: "role", href: "/directory?q=High%20Pole%20Escort", priority: 78, weight: 1 },
    { id: "route-surveyor", label: "Route Surveyor", type: "role", href: "/directory?q=Route%20Surveyor", priority: 72, weight: 1 },
    { id: "traffic-control", label: "Traffic Control", type: "role", href: "/directory?q=Traffic%20Control", priority: 68, weight: 1 },
    { id: "bucket-truck", label: "Bucket Truck", type: "role", href: "/directory?q=Bucket%20Truck", priority: 66, weight: 1 },
];

const DESKTOP_HERO_CHIP_SLOT_COUNT = 7;
const MOBILE_HERO_CHIP_SLOT_COUNT = 3;
const HERO_CHIP_ROTATION_MS = 11200;

function buildWeightedChipPool(roleChips: HomepageHeroChip[]) {
    const deduped = new Map<string, HomepageHeroChip>();
    roleChips.forEach((chip) => {
        const key = `${chip.type}:${chip.id || chip.label.toLowerCase()}`;
        if (chip.label && !deduped.has(key)) deduped.set(key, chip);
    });

    const weightedRoles = Array.from(deduped.values()).filter((chip) => chip.type === "role");

    return weightedRoles.length ? weightedRoles : FALLBACK_POSITION_CHIPS;
}

function selectHeroChips(pool: HomepageHeroChip[], offset: number, visibleCount: number) {
    return buildHeroRoleWindow(pool, offset, visibleCount);
}

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
    totalSupportLocations?: number;
    avgRatePerDay?: number;
    statsUpdatedAt?: string | null;
    nextMoveSignals?: Partial<UserSignals>;
    heroRoleChips?: HomepageHeroChip[];
    heroRoleChipSource?: "canonical_roles" | "hc_role_catalog" | "fallback";
    heroRoleChipCount?: number;
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export default function HomeClient({
    totalCountries,
    totalOperators,
    totalCorridors,
    totalSupportLocations,
    statsUpdatedAt,
    heroRoleChips = [],
    heroRoleChipSource = "fallback",
    heroRoleChipCount = 0,
}: HomeClientProps) {
    const heroChipPool = useMemo(() => buildWeightedChipPool(heroRoleChips), [heroRoleChips]);
    const [heroChipOffset, setHeroChipOffset] = useState(0);
    const [heroChipSlotCount, setHeroChipSlotCount] = useState(DESKTOP_HERO_CHIP_SLOT_COUNT);
    const activeHeroChips = useMemo(() => selectHeroChips(heroChipPool, heroChipOffset, heroChipSlotCount), [heroChipPool, heroChipOffset, heroChipSlotCount]);
    const heroChipDataJson = useMemo(
        () => JSON.stringify(heroChipPool.map((chip) => ({
            id: chip.id,
            label: chip.label,
            href: chip.href || `/directory?q=${encodeURIComponent(chip.label)}`,
        }))).replace(/</g, "\\u003c"),
        [heroChipPool],
    );
    const displayRegistryOperators = totalOperators > 0 ? `${totalOperators.toLocaleString()}+` : "Data syncing";
    const registryCountries = totalCountries > 0 ? totalCountries : 120;
    const registryCountryLabel = String(registryCountries);
    const displayCorridors = totalCorridors > 0 ? totalCorridors.toLocaleString() : "Seeded";
    const corridorLabel = totalCorridors > 0 ? "Corridor Signals" : "Corridors Being Seeded";
    const displaySupportLocations = typeof totalSupportLocations === "number" && totalSupportLocations > 0
        ? `${totalSupportLocations.toLocaleString()}+`
        : "Mapping";
    const supportLocationLabel = typeof totalSupportLocations === "number" && totalSupportLocations > 0
        ? "Geocoded Support Locations"
        : "Support Locations Mapping";
    const statsFreshness = statsUpdatedAt
        ? `Directory stats last refreshed ${new Date(statsUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`
        : "Directory stats refresh from Supabase when available.";
    const goldButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#F1A91B] px-5 py-2.5 text-sm font-black !text-black shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-colors hover:bg-[#D4951A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/70";
    const darkOutlineButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#F1A91B]/40 bg-black/55 px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition-colors hover:border-[#F1A91B]/65 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/70";

    useEffect(() => {
        const mobileQuery = window.matchMedia("(max-width: 767px)");
        const updateSlotCount = () => setHeroChipSlotCount(mobileQuery.matches ? MOBILE_HERO_CHIP_SLOT_COUNT : DESKTOP_HERO_CHIP_SLOT_COUNT);

        updateSlotCount();
        mobileQuery.addEventListener("change", updateSlotCount);

        return () => mobileQuery.removeEventListener("change", updateSlotCount);
    }, []);

    useEffect(() => {
        if (heroChipPool.length <= heroChipSlotCount) return;

        const timeout = window.setTimeout(() => {
            setHeroChipOffset((offset) => (offset + heroChipSlotCount) % heroChipPool.length);
        }, HERO_CHIP_ROTATION_MS);

        return () => window.clearTimeout(timeout);
    }, [heroChipOffset, heroChipPool.length, heroChipSlotCount]);

    return (
        <div className="hc-homepage-shell font-[family-name:var(--font-body)] antialiased bg-transparent text-white">
            <style>{`
                .hc-homepage-shell {
                    --hc-brand-gold: #D79622;
                    --hc-brand-gold-bright: #F1A91B;
                    --hc-brand-bronze: #8B5518;
                    --hc-brand-black: #050505;
                    --hc-panel: rgba(0, 0, 0, 0.55);
                    --hc-panel-border: rgba(215,150,34,0.26);
                    --hc-panel-shadow: 0 18px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,210,120,0.08);
                    position: relative;
                    isolation: isolate;
                    min-height: 100vh;
                }
                .hc-homepage-shell::before {
                    content: "";
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(circle at 50% 0%, rgba(215, 150, 34, 0.12), transparent 34%),
                        linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.78));
                }
                .hc-homepage-shell > section,
                .hc-homepage-shell > footer {
                    position: relative;
                    z-index: 1;
                }
                .hc-homepage-dark-surface {
                    background: transparent !important;
                    color: #f5f7fb;
                }
                .hc-homepage-dark-surface section {
                    background-color: transparent !important;
                }
                .hc-homepage-dark-surface [style*="opacity: 0"] {
                    opacity: 1 !important;
                    transform: none !important;
                }
                .hc-copy-readable {
                    color: rgba(255,255,255,0.82);
                    text-shadow: 0 2px 12px rgba(0,0,0,0.85);
                }
                .hero-headline-industrial {
                    position: relative;
                    z-index: 1;
                    max-width: min(100%, 860px);
                    color: #fffaf0;
                    font-family: Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", "Roboto Condensed", sans-serif;
                    font-size: clamp(2.05rem, 7.1vw, 4.6rem);
                    font-weight: 900;
                    line-height: 0.88;
                    letter-spacing: 0.025em;
                    text-transform: uppercase;
                    text-wrap: balance;
                    text-shadow:
                        2px 2px 0 rgba(0,0,0,0.96),
                        0 4px 10px rgba(0,0,0,0.90),
                        0 0 1px rgba(0,0,0,1);
                }
                @supports ((-webkit-background-clip: text) or (background-clip: text)) {
                    .hero-headline-industrial {
                        background: none;
                        -webkit-text-fill-color: #fffaf0;
                    }
                }
                .hero-headline-industrial::after {
                    content: none;
                }
                @supports (-webkit-text-stroke: 1px black) {
                    .hero-headline-industrial {
                        -webkit-text-stroke: 0.5px rgba(0,0,0,0.42);
                    }
                }
                .hc-brand-card {
                    background: var(--hc-panel);
                    border: 1px solid var(--hc-panel-border);
                    box-shadow: var(--hc-panel-shadow);
                    backdrop-filter: blur(6px);
                }
                .hc-chip {
                    border: 1px solid rgba(215,150,34,0.28);
                    background: var(--hc-panel);
                    color: rgba(255,255,255,0.88);
                    backdrop-filter: blur(6px);
                }
                .hc-homepage-shell .bg-black\\/30,
                .hc-homepage-shell .bg-black\\/35,
                .hc-homepage-shell .bg-black\\/40,
                .hc-homepage-shell .bg-black\\/55 {
                    background-color: var(--hc-panel) !important;
                    backdrop-filter: blur(6px);
                }
                .hc-gold-divider {
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(241,169,27,0.92), transparent);
                    box-shadow: 0 0 20px rgba(241,169,27,0.35);
                }
                .hc-premium-hero {
                    min-height: 570px;
                    background: #120904;
                }
                .hc-premium-hero-image {
                    object-position: 61% center;
                    filter: saturate(1.05) contrast(1.02);
                }
                .hc-hero-readability {
                    background:
                        linear-gradient(180deg, rgba(0,0,0,0.54) 0%, rgba(0,0,0,0.18) 35%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.66) 100%),
                        radial-gradient(circle at 50% 14%, rgba(0,0,0,0.32), transparent 46%),
                        linear-gradient(90deg, rgba(0,0,0,0.42), transparent 30%, transparent 66%, rgba(0,0,0,0.32));
                }
                .hc-hero-sky-drift {
                    top: -14%;
                    height: 54%;
                    background:
                        radial-gradient(ellipse at 28% 42%, rgba(255,204,118,0.12), transparent 48%),
                        radial-gradient(ellipse at 72% 36%, rgba(255,235,172,0.09), transparent 42%);
                    mix-blend-mode: screen;
                    opacity: 0.72;
                    animation: hcSkyDrift 28s ease-in-out infinite alternate;
                }
                .hc-hero-beacon {
                    left: 70.4%;
                    top: 33.5%;
                    width: clamp(90px, 14vw, 250px);
                    height: clamp(22px, 3.6vw, 58px);
                    border-radius: 999px;
                    background:
                        radial-gradient(ellipse at 22% 50%, rgba(255,190,45,0.82), rgba(255,153,0,0.16) 38%, transparent 72%),
                        radial-gradient(ellipse at 78% 50%, rgba(255,190,45,0.76), rgba(255,153,0,0.14) 38%, transparent 72%);
                    filter: blur(7px);
                    mix-blend-mode: screen;
                    opacity: 0.58;
                    transform: translate(-50%, -50%);
                    animation: hcBeaconPulse 1.9s ease-in-out infinite;
                }
                .hc-hero-beacon::after {
                    content: "";
                    position: absolute;
                    inset: -36% -14%;
                    border-radius: inherit;
                    background: radial-gradient(ellipse at center, rgba(255,176,34,0.48), transparent 66%);
                    opacity: 0.55;
                    animation: hcBeaconHalo 1.9s ease-in-out infinite;
                }
                .hc-road-shimmer {
                    left: 45.4%;
                    bottom: -3%;
                    width: clamp(34px, 4.4vw, 82px);
                    height: 78%;
                    transform: translateX(-50%) perspective(430px) rotateX(56deg);
                    transform-origin: bottom center;
                    clip-path: polygon(38% 0, 62% 0, 88% 100%, 12% 100%);
                    background:
                        linear-gradient(180deg, transparent 0%, rgba(255,216,118,0.04) 32%, rgba(255,216,118,0.30) 48%, rgba(255,216,118,0.05) 63%, transparent 100%);
                    background-size: 100% 230%;
                    filter: blur(2px);
                    mix-blend-mode: screen;
                    opacity: 0.52;
                    animation: hcRoadShimmer 6.4s linear infinite;
                }
                .hc-hero-action-zone {
                    position: relative;
                }
                .hc-hero-action-zone::before {
                    content: "";
                    position: absolute;
                    inset: -24px -22px -22px;
                    z-index: -1;
                    border-radius: 28px;
                    background: radial-gradient(ellipse at center, rgba(241,169,27,0.22), rgba(241,169,27,0.08) 42%, transparent 72%);
                    opacity: 0.74;
                    filter: blur(14px);
                    animation: hcActionGlow 4.6s ease-in-out infinite;
                }
                .hc-floating-chip {
                    position: absolute;
                    z-index: 12;
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    max-width: 260px;
                    border: 1px solid rgba(241,169,27,0.32);
                    border-radius: 999px;
                    background: rgba(7,8,10,0.56);
                    padding: 8px 12px;
                    color: rgba(255,255,255,0.78);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    box-shadow: 0 12px 30px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,214,142,0.10);
                    backdrop-filter: blur(8px);
                    opacity: 0;
                    animation: hcFloatChip 11s ease-in-out infinite;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    text-decoration: none;
                    will-change: transform, opacity;
                }
                .hc-floating-chip::before {
                    content: "";
                    width: 6px;
                    height: 6px;
                    border-radius: 999px;
                    background: #F1A91B;
                    box-shadow: 0 0 12px rgba(241,169,27,0.9);
                    flex: 0 0 auto;
                }
                .hc-floating-chip-conversion {
                    border-color: rgba(241,169,27,0.50);
                    background: rgba(5,5,5,0.68);
                    color: rgba(255,255,255,0.90);
                }
                .hc-floating-chip-role {
                    border-color: rgba(255,255,255,0.18);
                    background: rgba(7,8,10,0.46);
                    color: rgba(255,255,255,0.72);
                    font-size: 10px;
                }
                .hc-floating-chip-role::before {
                    background: rgba(255,255,255,0.78);
                    box-shadow: 0 0 10px rgba(255,255,255,0.45);
                }
                .hc-role-window {
                    position: absolute;
                    z-index: 11;
                    inset: 0;
                    pointer-events: none;
                }
                .hc-role-window-list {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .hc-role-window-chip {
                    position: absolute;
                    pointer-events: auto;
                    display: inline-flex;
                    align-items: flex-start;
                    gap: 6px;
                    max-width: min(210px, 24vw);
                    overflow: visible;
                    white-space: normal;
                    border: 1px solid rgba(241,169,27,0.28);
                    border-radius: 999px;
                    background: linear-gradient(135deg, rgba(4,5,7,0.48), rgba(18,12,4,0.24));
                    box-shadow: 0 10px 22px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,222,156,0.12);
                    color: rgba(255,255,255,0.96);
                    padding: 7px 11px;
                    font-size: 10.5px;
                    font-weight: 950;
                    letter-spacing: 0.045em;
                    line-height: 1.12;
                    text-decoration: none;
                    text-transform: uppercase;
                    text-shadow: 0 1px 8px rgba(0,0,0,0.90);
                    backdrop-filter: blur(4px);
                    opacity: 0;
                    transform: translate3d(0, 44px, 0) scale(0.985);
                    animation: hcRoleBubbleFloat 11.2s ease-in-out forwards;
                    transition: border-color 180ms ease, background 180ms ease, color 180ms ease, transform 180ms ease;
                }
                .hc-role-window-chip::before {
                    content: "";
                    width: 6px;
                    height: 6px;
                    flex: 0 0 auto;
                    margin-top: 0.2em;
                    border-radius: 999px;
                    background: #F1A91B;
                    box-shadow: 0 0 12px rgba(241,169,27,0.95);
                }
                .hc-role-window-label {
                    display: -webkit-box;
                    min-width: 0;
                    overflow: hidden;
                    overflow-wrap: anywhere;
                    text-wrap: balance;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                }
                .hc-role-window-chip:hover {
                    border-color: rgba(241,169,27,0.52);
                    background: linear-gradient(135deg, rgba(96,53,9,0.50), rgba(7,10,14,0.38));
                    color: rgba(255,255,255,0.96);
                    transform: translate3d(0, -1px, 0);
                }
                .hc-role-window-chip-1 {
                    left: clamp(16px, 2.6vw, 38px);
                    top: 36%;
                }
                .hc-role-window-chip-2 {
                    right: clamp(18px, 3vw, 46px);
                    top: 39%;
                }
                .hc-role-window-chip-3 {
                    left: clamp(78px, 10vw, 156px);
                    top: 58%;
                }
                .hc-role-window-chip-4 {
                    right: clamp(68px, 9vw, 148px);
                    top: 59%;
                }
                .hc-role-window-chip-5 {
                    left: clamp(26px, 5vw, 82px);
                    bottom: 19%;
                }
                .hc-role-window-chip-6 {
                    right: clamp(22px, 4vw, 68px);
                    bottom: 20%;
                }
                .hc-role-window-chip-7 {
                    left: clamp(16px, 4vw, 76px);
                    top: 20%;
                }
                .hc-floating-chip-1 {
                    left: 5%;
                    top: 31%;
                    animation-delay: 0s;
                }
                .hc-floating-chip-2 {
                    right: 5%;
                    top: 24%;
                    animation-delay: 3.4s;
                }
                .hc-floating-chip-3 {
                    left: 8%;
                    bottom: 25%;
                    animation-delay: 6.8s;
                }
                .hc-floating-chip-4 {
                    right: 9%;
                    bottom: 34%;
                    animation-delay: 1.7s;
                }
                .hc-floating-chip-5 {
                    left: 38%;
                    top: 16%;
                    animation-delay: 5.1s;
                }
                @keyframes hcBeaconPulse {
                    0%, 100% { opacity: 0.30; transform: translate(-50%, -50%) scale(0.96); }
                    42% { opacity: 0.92; transform: translate(-50%, -50%) scale(1.04); }
                    58% { opacity: 0.50; transform: translate(-50%, -50%) scale(0.99); }
                }
                @keyframes hcBeaconHalo {
                    0%, 100% { opacity: 0.24; transform: scale(0.96); }
                    45% { opacity: 0.74; transform: scale(1.12); }
                }
                @keyframes hcRoadShimmer {
                    0% { background-position: 0 120%; opacity: 0.16; }
                    18% { opacity: 0.48; }
                    60% { opacity: 0.34; }
                    100% { background-position: 0 -120%; opacity: 0.16; }
                }
                @keyframes hcSkyDrift {
                    0% { transform: translate3d(-1.3%, 0, 0) scale(1.02); }
                    100% { transform: translate3d(1.4%, 1.1%, 0) scale(1.04); }
                }
                @keyframes hcActionGlow {
                    0%, 100% { opacity: 0.46; transform: scale(0.985); }
                    50% { opacity: 0.86; transform: scale(1.015); }
                }
                @keyframes hcFloatChip {
                    0%, 12% { opacity: 0; transform: translate3d(0, 12px, 0); }
                    20%, 42% { opacity: 0.72; transform: translate3d(0, 0, 0); }
                    58%, 100% { opacity: 0; transform: translate3d(0, -14px, 0); }
                }
                @keyframes hcRoleBubbleFloat {
                    0% { opacity: 0; transform: translate3d(0, 44px, 0) scale(0.985); }
                    14% { opacity: 0.84; transform: translate3d(0, 18px, 0) scale(1); }
                    72% { opacity: 0.84; transform: translate3d(0, -42px, 0) scale(1.01); }
                    100% { opacity: 0; transform: translate3d(0, -86px, 0) scale(1.015); }
                }
                @media (max-width: 1023px) {
                    .hc-role-window-chip {
                        max-width: min(200px, 36vw);
                    }
                }
                @media (max-width: 767px) {
                    .hc-premium-hero {
                        min-height: 620px;
                    }
                    .hc-premium-hero-image {
                        object-position: 54% center;
                    }
                    .hc-hero-readability {
                        background:
                            linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.34) 34%, rgba(0,0,0,0.30) 58%, rgba(0,0,0,0.76) 100%),
                            linear-gradient(90deg, rgba(0,0,0,0.18), transparent 46%, rgba(0,0,0,0.28));
                    }
                    .hc-hero-beacon {
                        left: 70%;
                        top: 36%;
                        width: 124px;
                        height: 30px;
                        opacity: 0.38;
                        animation-duration: 2.25s;
                    }
                    .hc-road-shimmer {
                        left: 41%;
                        width: 38px;
                        opacity: 0.28;
                        animation-duration: 7.6s;
                    }
                    .hc-hero-sky-drift {
                        opacity: 0.44;
                        animation-duration: 34s;
                    }
                    .hc-hero-action-zone::before {
                        inset: -16px -8px -14px;
                        opacity: 0.48;
                        animation-duration: 5.3s;
                    }
                    .hc-role-window-title {
                        display: none;
                    }
                    .hc-role-window-chip {
                        max-width: min(212px, 53vw);
                        padding: 7px 9px;
                        font-size: 9px;
                        letter-spacing: 0.03em;
                    }
                    .hc-role-window-label {
                        -webkit-line-clamp: 2;
                    }
                    .hc-role-window-chip-1 {
                        left: auto;
                        right: 8px;
                        top: 23%;
                    }
                    .hc-role-window-chip-2 {
                        left: 8px;
                        right: auto;
                        top: 32%;
                    }
                    .hc-role-window-chip-3 {
                        left: auto;
                        right: 14px;
                        top: 41%;
                    }
                    .hc-role-window-chip-4 {
                        display: none;
                    }
                    .hc-role-window-chip-5,
                    .hc-role-window-chip-6,
                    .hc-role-window-chip-7 {
                        display: none;
                    }
                    .hc-floating-chip {
                        max-width: 190px;
                        padding: 6px 10px;
                        font-size: 10px;
                        animation-duration: 15s;
                    }
                    .hc-floating-chip-1 {
                        left: auto;
                        right: 1rem;
                        top: 35%;
                    }
                    .hc-floating-chip-2 {
                        left: 1rem;
                        right: auto;
                        top: 47%;
                    }
                    .hc-floating-chip-3 {
                        left: auto;
                        right: 0.75rem;
                        top: 56%;
                    }
                    .hc-floating-chip-4,
                    .hc-floating-chip-5 {
                        display: none;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .hc-hero-sky-drift,
                    .hc-road-shimmer,
                    .hc-floating-chip {
                        animation: none !important;
                    }
                    .hc-role-window-chip {
                        animation: none !important;
                        opacity: 1 !important;
                        transform: none !important;
                    }
                    .hc-hero-sky-drift,
                    .hc-road-shimmer,
                    .hc-floating-chip {
                        opacity: 0 !important;
                    }
                    .hc-hero-beacon,
                    .hc-hero-beacon::after,
                    .hc-hero-action-zone::before {
                        animation: none !important;
                    }
                    .hc-hero-beacon {
                        opacity: 0.28;
                    }
                    .hc-hero-action-zone::before {
                        opacity: 0.34;
                    }
                }
            `}</style>

            {/* ═══════════════════════════════════════
                HERO — Highway Photo + Search Bar
                ═══════════════════════════════════════ */}
            <section className="relative w-full pb-8 hc-homepage-dark-surface">
                <div className="relative max-w-7xl mx-auto px-4 pt-2">
                    <div
                        className="hc-premium-hero relative w-full overflow-hidden rounded-xl border-2 border-[#D79622] shadow-[0_0_0_1px_rgba(255,218,130,0.22),0_24px_80px_rgba(0,0,0,0.55),0_0_42px_rgba(215,150,34,0.22)]"
                        data-role-chip-source={heroRoleChipSource}
                        data-role-chip-count={heroRoleChipCount}
                        data-role-chip-pool-count={heroChipPool.length}
                        data-role-chip-offset={heroChipOffset}
                        data-role-chip-root="true"
                    >
                        <picture>
                            <source media="(max-width: 767px)" srcSet="/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load-mobile.avif" type="image/avif" />
                            <source media="(max-width: 767px)" srcSet="/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load-mobile.webp" type="image/webp" />
                            <source srcSet="/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load.avif" type="image/avif" />
                            <source srcSet="/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load.webp" type="image/webp" />
                            <img
                                src="/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load.png"
                                alt="Pilot car escorting an oversize load truck on a highway at golden hour"
                                width={1916}
                                height={821}
                                className="hc-premium-hero-image absolute inset-0 h-full w-full object-cover"
                                decoding="async"
                                fetchPriority="high"
                            />
                        </picture>

                        <div className="hc-hero-sky-drift pointer-events-none absolute inset-x-0 z-[2]" aria-hidden="true" />
                        <div className="hc-road-shimmer pointer-events-none absolute z-[3]" aria-hidden="true" />
                        <div className="hc-hero-beacon pointer-events-none absolute z-[4]" aria-hidden="true" />
                        <div className="hc-hero-readability pointer-events-none absolute inset-0 z-[5]" aria-hidden="true" />

                        {activeHeroChips.length > 0 && (
                            <div className="hc-role-window" aria-label="Haul Command job position coverage">
                                <div className="hc-role-window-list" suppressHydrationWarning>
                                    {activeHeroChips.map((chip, index) => (
                                        <Link
                                            key={`role-window-${chip.id}-${heroChipOffset}-${index}`}
                                            href={chip.href || `/directory?q=${encodeURIComponent(chip.label)}`}
                                            className={`hc-role-window-chip hc-role-window-chip-${index + 1}`}
                                            style={{ animationDelay: `${index * 420}ms` }}
                                            title={chip.label}
                                            aria-label={`Search ${chip.label} on Haul Command`}
                                        >
                                            <span className="hc-role-window-label">{chip.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="relative z-10 flex min-h-[570px] flex-col justify-between px-4 py-5 text-center sm:min-h-[570px] sm:px-8 sm:py-7 md:min-h-[610px] lg:px-10">
                            <div className="mx-auto max-w-4xl">
                                <h1 className="hero-headline-industrial mx-auto mb-3">
                                    Find Pilot Cars, Escort Vehicles &amp; Heavy Haul Support
                                </h1>
                                <p className="mx-auto max-w-3xl rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black leading-6 text-black shadow-[0_8px_22px_rgba(0,0,0,0.14)] backdrop-blur-[2px] sm:text-base sm:leading-7">
                                    The heavy haul operating system for brokers, carriers, pilot car operators, permit teams, and route-support providers across a {registryCountryLabel}-country coverage model.
                                </p>
                            </div>

                            <div className="hc-hero-action-zone mx-auto flex w-full max-w-3xl flex-col items-center gap-3 sm:gap-4">
                                <div className="max-w-[calc(100vw-2.5rem)] whitespace-nowrap rounded-full border border-[#F1A91B]/25 bg-black/70 px-4 py-2 text-[11px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:text-xs">
                                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                                    Find escorts &middot; Post loads &middot; Claim profiles
                                </div>

                                <div className="grid w-full max-w-2xl grid-cols-3 gap-2">
                                    <Link href="/directory" className="flex min-h-11 items-center justify-center rounded-full border border-[#F1A91B]/35 bg-black/[0.62] px-3 py-2 text-center text-xs font-black text-white shadow-[0_8px_22px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-black/[0.76] sm:px-5 sm:text-sm">
                                        Find Escorts
                                    </Link>
                                    <Link href="/loads/post" className="flex min-h-11 items-center justify-center rounded-full border border-[#F1A91B]/35 bg-black/[0.62] px-3 py-2 text-center text-xs font-black text-white shadow-[0_8px_22px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-black/[0.76] sm:px-5 sm:text-sm">
                                        Post a Load
                                    </Link>
                                    <Link href="/claim" className="flex min-h-11 items-center justify-center rounded-full border border-[#F1A91B]/45 bg-[#F1A91B] px-3 py-2 text-center text-xs font-black !text-black shadow-[0_8px_22px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#D4951A] sm:px-5 sm:text-sm">
                                        Claim Listing
                                    </Link>
                                </div>
                                <form
                                    action="/directory"
                                    method="GET"
                                    className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch bg-white rounded-lg shadow-[0_18px_46px_rgba(0,0,0,0.5)] overflow-hidden"
                                >
                                    <div className="flex-[1.5] flex items-center gap-2 bg-white px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-300">
                                        <Search className="w-5 h-5 text-[#D4A348] flex-shrink-0" />
                                        <select name="category" className="w-full bg-transparent text-sm md:text-base text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer">
                                            <option value="">Pilot cars, escorts, permits...</option>
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
                                            placeholder="City, state, or country"
                                            className="w-full bg-transparent text-sm md:text-base text-gray-900 placeholder-gray-500 font-medium focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center bg-[#F1A91B] hover:bg-[#D4951A] !text-black font-bold text-base px-8 py-3 transition-colors outline-none focus:ring-2 focus:ring-[#C6923A] focus:ring-inset"
                                    >
                                        Find
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <script
                        id="hc-role-chip-data"
                        type="application/json"
                        dangerouslySetInnerHTML={{ __html: heroChipDataJson }}
                    />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
(function () {
  var dataEl = document.getElementById("hc-role-chip-data");
  var root = document.querySelector("[data-role-chip-root='true']");
  if (!dataEl || !root) return;

  var chips = [];
  try {
    chips = JSON.parse(dataEl.textContent || "[]").filter(function (chip) {
      return chip && chip.label;
    });
  } catch (error) {
    return;
  }

  var list = root.querySelector(".hc-role-window-list");
  if (!list || chips.length === 0) return;

  var offset = 0;
  var desktopCount = ${DESKTOP_HERO_CHIP_SLOT_COUNT};
  var mobileCount = ${MOBILE_HERO_CHIP_SLOT_COUNT};
  var cycleMs = ${HERO_CHIP_ROTATION_MS};
  var staggerMs = 420;
  var mobileQuery = window.matchMedia("(max-width: 767px)");

  function visibleCount() {
    return Math.min(mobileQuery.matches ? mobileCount : desktopCount, chips.length);
  }

  function render() {
    var count = visibleCount();
    root.setAttribute("data-role-chip-offset", String(offset));
    list.replaceChildren();

    for (var index = 0; index < count; index += 1) {
      var chip = chips[(offset + index) % chips.length];
      var link = document.createElement("a");
      link.href = chip.href || ("/directory?q=" + encodeURIComponent(chip.label));
      link.className = "hc-role-window-chip hc-role-window-chip-" + (index + 1);
      link.style.animationDelay = String(index * staggerMs) + "ms";
      link.title = chip.label;
      link.setAttribute("aria-label", "Search " + chip.label + " on Haul Command");
      var label = document.createElement("span");
      label.className = "hc-role-window-label";
      label.textContent = chip.label;
      link.appendChild(label);
      list.appendChild(link);
    }
  }

  function advance() {
    offset = (offset + visibleCount()) % chips.length;
    render();
  }

  render();
  window.setInterval(advance, cycleMs);

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", render);
  }
})();
                            `.trim(),
                        }}
                    />
                </div>

                <div className="mx-auto mt-7 max-w-7xl px-4">
                    <div className="relative overflow-hidden border-y border-[#D79622]/24 bg-black/30 px-4 py-6 shadow-[inset_0_1px_0_rgba(255,210,120,0.08),0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-[2px] sm:px-6 lg:px-8">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(241,169,27,0.12),transparent_24%),radial-gradient(circle_at_86%_16%,rgba(241,169,27,0.10),transparent_22%)]" />
                        <div className="relative grid gap-6 lg:grid-cols-[1fr_170px] lg:items-start">
                            <div>
                                <h2 className="text-[12px] font-black uppercase tracking-[0.22em] text-[#F1A91B]">
                                    What is Haul Command?
                                </h2>
                                <p className="mt-3 max-w-4xl text-[15px] font-semibold leading-7 text-white sm:text-base sm:leading-8">
                                    Haul Command helps heavy haul teams find the right pilot cars, escort vehicles, permits,
                                    route intelligence, and support providers for oversize loads.
                                </p>
                                <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-white/78 sm:text-[15px] sm:leading-7">
                                    For brokers and carriers, it is a faster way to compare providers, check requirements,
                                    and move loads. For pilot car operators and support companies, it is a free profile,
                                    visibility, and lead-generation engine built for the heavy haul industry across a
                                    {` ${registryCountryLabel}`}-country coverage model.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 lg:block lg:space-y-5 lg:text-right">
                                {[
                                    { value: displayRegistryOperators, label: "Industry records indexed" },
                                    { value: registryCountryLabel, label: "Country framework" },
                                ].map((stat) => (
                                    <div key={stat.label} className="rounded-lg border border-[#D79622]/20 bg-black/25 px-3 py-3 lg:border-transparent lg:bg-transparent lg:px-0 lg:py-0">
                                        <div className="text-3xl font-black leading-none text-[#F1A91B] sm:text-4xl">
                                            {stat.value}
                                        </div>
                                        <div className="mt-1 text-[11px] font-semibold leading-tight text-[#E0B05C]">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative mt-6 border-t border-[#D79622]/18 pt-5">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    { step: "1", title: "Search Your Route", body: "City, state, corridor, or country" },
                                    { step: "2", title: "Compare Providers", body: "Trust scores, certs, availability" },
                                    { step: "3", title: "Claim or Dispatch", body: "Request escort or claim profile" },
                                ].map((item) => (
                                    <div key={item.step} className="group text-left sm:text-center">
                                        <div className="mx-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#F1A91B]/45 bg-[#F1A91B]/12 text-sm font-black text-[#F1A91B] shadow-[0_0_24px_rgba(241,169,27,0.16)] sm:mx-auto">
                                            {item.step}
                                        </div>
                                        <div className="mt-3 text-sm font-black leading-tight text-white">
                                            {item.title}
                                        </div>
                                        <p className="mt-1 text-xs font-medium leading-5 text-[#D4A348]">{item.body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CATEGORY ICONS ROW
                ═══════════════════════════════════════ */}
            <div className="hc-gold-divider relative z-[1]" />

            <section className="hc-homepage-dark-surface">
                <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8">
                    <div className="hc-brand-card rounded-xl p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F1A91B]">
                                    Registry coverage, verified profiles, and route intelligence expanding by market
                                </p>
                                <h2 className="mt-1 text-lg font-black text-white">Live demand across escorts, loads, corridors, and support providers</h2>
                                <p className="mt-2 text-sm leading-6 text-white/68">
                                    Texas escort shortage: Index 56. Operators needed in Permian Basin, I-10,
                                    and I-35 corridors.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:items-end">
                                <Link href="/tools/heavy-haul-index" className={goldButtonClass}>
                                    See Shortage Index
                                </Link>
                                <Link href="/claim" className="text-xs font-bold text-[#F1A91B] hover:underline">
                                    Claim Profile
                                </Link>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { value: displayRegistryOperators, label: "Listed Operators" },
                                { value: registryCountryLabel, label: "Country Coverage Model" },
                                { value: displayCorridors, label: corridorLabel },
                                { value: displaySupportLocations, label: supportLocationLabel },
                            ].map((stat) => (
                                <Link key={stat.label} href="/directory" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-center hover:border-[#F1A91B]/35">
                                    <div className="text-xl font-black text-white">{stat.value}</div>
                                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/55">{stat.label}</div>
                                    <span className="mt-2 block text-[10px] font-bold text-[#F1A91B]">View &rarr;</span>
                                </Link>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] font-semibold leading-5 text-white/45">
                            {statsFreshness} Coverage-model counts are labeled separately from live operator, corridor, and geocoded records.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="hc-brand-card rounded-xl p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-black text-white">Top Heavy Haul Markets</h2>
                                <Link href="/directory/us" className="text-[11px] font-bold text-[#F1A91B]">See all states &rarr;</Link>
                            </div>
                            <p className="mb-3 text-xs text-white/58">United States state markets - part of our {registryCountryLabel}-country registry</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    "Texas", "Florida", "California", "Louisiana", "Pennsylvania", "Ohio",
                                    "Georgia", "Illinois", "New York", "Alabama", "North Carolina", "Virginia",
                                    "Michigan", "Colorado", "Tennessee", "Montana", "Oklahoma", "Wyoming",
                                    "North Dakota", "Kansas",
                                ].map((market) => (
                                    <Link key={market} href="/directory" className="hc-chip rounded-full px-3 py-2 text-xs font-bold">
                                        {market}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="hc-brand-card rounded-xl p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-black text-white">120-country Coverage Model</h2>
                                <Link href="/directory" className="text-[11px] font-bold text-[#F1A91B]">Explore the framework &rarr;</Link>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {GLOBAL_MARKETS.map((market) => (
                                    <Link key={market.slug} href={`/directory/${market.slug}`} className="hc-chip rounded-lg px-3 py-3 text-xs font-bold">
                                        <span className="mr-2">{market.flag}</span>{market.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="hc-brand-card rounded-xl p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-black text-white">Route-Based Intelligence</h2>
                                <p className="mt-1 text-xs text-white/58">Search by corridor, port, border crossing, or near me</p>
                            </div>
                            <Link href="/corridors" className="text-[11px] font-bold text-[#F1A91B]">All &rarr;</Link>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                            {ROUTE_INTEL_LINKS.map((item) => (
                                <Link key={item.title} href="/corridors" className="rounded-lg border border-white/10 bg-black/35 p-3 hover:border-[#F1A91B]/35">
                                    <div className="text-xs font-black text-white">{item.title}</div>
                                    <p className="mt-1 text-[11px] leading-4 text-white/58">{item.body}</p>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {FEATURED_CORRIDORS.map((corridor) => (
                                <Link key={corridor} href="/corridors" className="hc-chip rounded-full px-3 py-1.5 text-[11px] font-bold">
                                    {corridor}
                                </Link>
                            ))}
                            <Link href="/corridors" className="px-3 py-1.5 text-[11px] font-bold text-[#F1A91B]">
                                See all corridors &rarr;
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="hc-brand-card rounded-xl p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-black text-white">Find Escorts by Load Type</h2>
                                <Link href="/tools/escort-calculator" className="text-[11px] font-bold text-[#F1A91B]">All load types &rarr;</Link>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {LOAD_TYPES.map((loadType) => (
                                    <Link key={loadType.title} href="/directory" className="rounded-lg border border-white/10 bg-black/35 px-3 py-3 hover:border-[#F1A91B]/35">
                                        <span className="block text-xs font-black text-white">{loadType.title}</span>
                                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#F1A91B]">{loadType.tag}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="hc-brand-card rounded-xl p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-sm font-black text-white">Rate Guide Hub</h2>
                                <Link href="/rates" className="text-[11px] font-bold text-[#F1A91B]">All rates &rarr;</Link>
                            </div>
                            <p className="mb-3 text-xs text-white/58">Know what the job should cost before you quote it.</p>
                            <div className="grid grid-cols-1 gap-2">
                                {RATE_GUIDES.map((rate) => (
                                    <Link key={rate.title} href="/rates" className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2 hover:border-[#F1A91B]/35">
                                        <span className="text-xs font-black text-white">{rate.title}</span>
                                        <span className="text-[11px] font-bold text-white/58">{rate.body}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="hc-brand-card rounded-xl p-4">
                            <h2 className="text-sm font-black text-white">For Brokers & Dispatchers</h2>
                            <p className="mt-2 text-sm leading-6 text-white/68">
                                Post oversize loads, compare local escort coverage, route around permit constraints,
                                and find available pilot cars before a move turns into a rescue fill.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {["Find coverage", "Post a load", "Check rates", "Compare markets"].map((item) => (
                                    <span key={item} className="hc-chip rounded-full px-3 py-1.5 text-[11px] font-bold">{item}</span>
                                ))}
                            </div>
                        </div>

                        <div className="hc-brand-card rounded-xl p-4">
                            <h2 className="text-sm font-black text-white">For Pilot Car Operators</h2>
                            <p className="mt-2 text-sm leading-6 text-white/68">
                                Claim your profile, show your equipment and certifications, get discovered by brokers,
                                and build a stronger presence in the corridors you actually serve.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {["Claim profile", "Verify equipment", "Get leads", "Own territory"].map((item) => (
                                    <span key={item} className="hc-chip rounded-full px-3 py-1.5 text-[11px] font-bold">{item}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-[#D79622]/18 hc-homepage-dark-surface">
                <div className="max-w-6xl mx-auto px-4 py-7">
                    <div className="mb-5 flex flex-col items-center gap-1 text-center">
                        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#F1A91B]">Find by service</h2>
                        <p className="text-xs font-semibold text-white/68">Jump straight to the support type you need.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.label}
                                href={cat.href}
                                aria-label={`Find ${cat.label}`}
                                className="group flex min-h-[104px] flex-col items-center justify-center rounded-xl border border-[#D79622]/20 bg-black/45 px-3 py-4 text-center shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:border-[#F1A91B]/55 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B]/70"
                            >
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform group-hover:scale-105"
                                    style={{ color: cat.color }}
                                >
                                    <cat.icon className="h-5 w-5" />
                                </div>
                                <span className="mt-3 text-[12px] font-black leading-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                                    {cat.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                STATS CARDS
                ═══════════════════════════════════════ */}
            {/* ═══════════════════════════════════════
                POPULAR STATES
                ═══════════════════════════════════════ */}
            {/* ═══════════════════════════════════════
                GLOBAL MARKET STATUS (120 Countries)
                ═══════════════════════════════════════ */}

            {/* ═══════════════════════════════════════
                TRENDING ESCORT LOCALITIES
                ═══════════════════════════════════════ */}
            <section className="hc-homepage-dark-surface">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="hc-brand-card rounded-xl p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-black text-white">Live U.S. Escort Markets</h2>
                                <p className="text-xs text-white/70">Popular pilot car and heavy haul support markets in the United States.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/directory?country=US" className="text-[11px] font-bold text-[#F1A91B]">View U.S. markets &rarr;</Link>
                                <Link href="/training/countries" className="text-[11px] font-bold text-white/80 hover:text-[#F1A91B]">Explore {registryCountryLabel} countries &rarr;</Link>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {TRENDING_LOCALITIES.slice(0, 12).map((loc, index) => (
                            <Link
                                key={loc}
                                href={`/near/${loc.toLowerCase().replace(/\s+/g, '-').replace(',', '')}`}
                                className="px-3 py-1.5 text-xs font-semibold text-white/65 bg-black/30 hover:bg-[#F1A91B]/10 hover:text-[#D4A348] border border-white/10 hover:border-[#F1A91B]/30 rounded-full transition-all"
                            >
                                {loc} <span className="text-white/55">{index % 3 === 0 ? "47 operators" : index % 3 === 1 ? "38 listings" : "29 signals"}</span>
                            </Link>
                        ))}
                        </div>
                        <p className="mt-3 text-xs text-white/55">
                            U.S. cities are shown here because this block is the selected-country view. Global country coverage is being expanded across {registryCountryLabel} countries.
                            <Link href="/claim" className="ml-2 font-bold text-[#F1A91B]">Claim your listing &rarr;</Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CLAIM YOUR FREE LISTING
                ═══════════════════════════════════════ */}
            <section className="border-y border-white/10 hc-homepage-dark-surface">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                        <div className="w-16 h-16 rounded-2xl bg-[#F1A91B]/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-8 h-8 text-[#F1A91B]" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-white mb-2">Claim Your Free Listing</h2>
                            <p className="text-sm text-white/65 mb-4 max-w-xl">
                                Operators listed on Haul Command: {displayRegistryOperators}. Claim your profile to unlock visibility, trust signals, and broker lead flow — free in under 60 seconds.
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-white/55 mb-5">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Verification badge when eligibility confirmed</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search & on map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>
                            </div>
                            <Link
                                href="/claim"
                                className={goldButtonClass}
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
            <section className="hc-homepage-dark-surface">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <div className="hc-brand-card rounded-xl px-4 py-7 sm:px-6">
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-3">Have a Heavy Haul Question?</h2>
                        <p className="text-sm text-white/65 mb-6 max-w-lg mx-auto">
                            Ask about escort requirements, permit rules, and oversize load regulations. U.S. answers reference FMCSA and state DOT sources. Global answers cite official source paths when available.
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
                            <button className={goldButtonClass}>
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
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRENDING ESCORT LOCALITIES V2
                ═══════════════════════════════════════ */}
            {/* ═══════════════════════════════════════
                ADVERTISE ON HAUL COMMAND
                ═══════════════════════════════════════ */}
            <section className="border-b border-[#D79622]/20 hc-homepage-dark-surface">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="hc-brand-card flex flex-col items-start gap-6 rounded-xl p-5 md:flex-row md:items-center md:gap-10">
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-white mb-1">
                                <span className="text-[#F1A91B]">AdGrid</span> sponsor inventory
                            </h2>
                            <h3 className="text-lg font-black text-white mb-2">Advertise where heavy haul decisions happen</h3>
                            <p className="text-sm font-semibold leading-6 text-white/78 mb-4 max-w-xl">
                                Reach brokers, carriers, and dispatchers actively searching for escorts. Geo-targeted
                                placements in directory, corridors, and tool pages.
                            </p>
                            <p className="mb-4 rounded-lg border border-[#F1A91B]/35 bg-black/55 px-3 py-2 text-xs font-black text-[#F1A91B] shadow-[inset_0_1px_0_rgba(255,210,120,0.08)]">
                                3 of 12 Texas corridor spots remaining - featured in 7,711 operator profile views/month
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-bold text-white mb-5">
                                <span className="flex items-center gap-1">📊 Real-time analytics</span>
                                <span className="flex items-center gap-1">🎯 Geo-targeted placements</span>
                                <span className="flex items-center gap-1">💎 Featured in search results</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/sponsor" className={goldButtonClass}>
                                    View Ad Products
                                </Link>
                                <Link href="/sponsor/waitlist" className={darkOutlineButtonClass}>
                                    Get Proposal
                                </Link>
                            </div>
                        </div>
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border border-[#F1A91B]/25 bg-black/50 shadow-[inset_0_1px_0_rgba(255,210,120,0.08)]">
                            <Building2 className="w-10 h-10 text-[#F1A91B]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                INTENT COMMAND CARDS
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/10 hc-homepage-dark-surface">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black text-white">Industry Intelligence</h2>
                            <p className="mt-1 text-xs text-white/58">Guides, requirements, and market intelligence for heavy haul professionals.</p>
                        </div>
                        <Link href="/blog" className="text-xs font-bold text-[#F1A91B]">All articles &rarr;</Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {INDUSTRY_ARTICLES.map((article) => (
                            <Link key={article.title} href="/blog" className="rounded-xl border border-white/10 bg-black/35 p-4 hover:border-[#F1A91B]/35">
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F1A91B]">{article.category}</span>
                                <h3 className="mt-2 text-sm font-black text-white">{article.title}</h3>
                                <span className="mt-3 block text-[11px] font-bold text-white/58">Read more</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-white/10 hc-homepage-dark-surface">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <h2 className="text-lg font-black text-white mb-2 text-center">How Can We Help You?</h2>
                    <p className="text-xs text-center text-white/55 mb-8">Pick your intent and we route you directly.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/directory" className="bg-black/35 border border-white/10 hover:border-[#F1A91B]/50 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-[#F1A91B]/10 flex items-center justify-center"><Zap className="w-5 h-5 text-[#F1A91B]" /></div>
                            <h3 className="font-bold text-white text-sm">I Need an Escort</h3>
                            <p className="text-xs text-white/55 flex-1">Find a verified pilot car or escort vehicle near your load's origin. Real-time availability, trust scores, and instant dispatch matching.</p>
                            <span className="text-xs font-bold text-[#C6923A] flex items-center gap-1 mt-1">Find Escorts <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/claim" className="bg-black/35 border border-white/10 hover:border-[#3B82F6]/40 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-500" /></div>
                            <h3 className="font-bold text-white text-sm">I Provide Escorts</h3>
                            <p className="text-xs text-white/55 flex-1">Claim your free profile, verify your certifications, get booked by brokers, and unlock visibility tools from one dashboard.</p>
                            <span className="text-xs font-bold text-blue-500 flex items-center gap-1 mt-1">Claim Profile <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/permits" className="bg-black/35 border border-white/10 hover:border-[#22C55E]/40 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><FileText className="w-5 h-5 text-green-500" /></div>
                            <h3 className="font-bold text-white text-sm">Moving an oversize load?</h3>
                            <p className="text-xs text-white/55 flex-1">Check escort requirements, permits, and route support by state.</p>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1">Start Route Check <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/claim" className="bg-black/35 border border-white/10 hover:border-[#8B5CF6]/40 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center"><Users className="w-5 h-5 text-purple-500" /></div>
                            <h3 className="font-bold text-white text-sm">Own a pilot car business?</h3>
                            <p className="text-xs text-white/55 flex-1">Claim your listing, unlock visibility, and get found by brokers.</p>
                            <span className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-1">Claim Free Listing <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <Link href="/loads" className="bg-black/35 border border-white/10 hover:border-[#EC4899]/40 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center"><Truck className="w-5 h-5 text-pink-500" /></div>
                            <h3 className="font-bold text-white text-sm">Post or find a load</h3>
                            <p className="text-xs text-white/55 flex-1">Oversize load board — post free, find capacity instantly.</p>
                            <span className="text-xs font-bold text-pink-600 flex items-center gap-1 mt-1">Open Load Board <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/rates" className="bg-black/35 border border-white/10 hover:border-[#F59E0B]/40 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-500" /></div>
                            <h3 className="font-bold text-white text-sm">Check market rates</h3>
                            <p className="text-xs text-white/55 flex-1">Live escort rate index by state, corridor, and equipment type.</p>
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">View Rate Index <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/sponsor" className="bg-black/35 border border-white/10 hover:border-[#0096C7]/40 rounded-xl p-5 transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-sky-500" /></div>
                            <h3 className="font-bold text-white text-sm">Advertise your business</h3>
                            <p className="text-xs text-white/55 flex-1">Geo-targeted placements on state, corridor, and category pages.</p>
                            <span className="text-xs font-bold text-sky-600 flex items-center gap-1 mt-1">View Ad Products <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                MOBILE APP STRIP
                ═══════════════════════════════════════ */}
            {/* ═══════════════════════════════════════
                TAKE HAUL COMMAND WITH YOU
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/10 hc-homepage-dark-surface">
                <div className="max-w-4xl mx-auto px-4 py-10 text-center">
                    <h2 className="text-lg font-black text-white mb-3">Haul Command Mobile App</h2>
                    <p className="text-xs text-white/55 mb-5 max-w-md mx-auto">
                        Track loads, find escorts, and dispatch from the road - coming to iOS and Android.
                    </p>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/app" className="flex items-center justify-center gap-2 rounded-lg border border-[#D79622]/35 bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-900 transition-colors">
                            iOS Waitlist App Store
                        </Link>
                        <Link href="/app" className="flex items-center justify-center gap-2 rounded-lg border border-[#D79622]/35 bg-black px-4 py-2 text-xs font-bold text-white hover:bg-gray-900 transition-colors">
                            Android Waitlist Google Play
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FOOTER
                ═══════════════════════════════════════ */}
            <section className="border-b border-white/10 hc-homepage-dark-surface">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black text-white">Heavy Haul FAQ</h2>
                            <p className="mt-1 text-xs text-white/58">Common questions about pilot cars, escorts, permits, and heavy haul compliance.</p>
                        </div>
                        <Link href="/tools/terminology" className="text-xs font-bold text-[#F1A91B]">Full glossary &rarr;</Link>
                    </div>
                    <div className="grid gap-3">
                        {FAQ_ITEMS.map((item) => (
                            <div key={item.question} className="hc-brand-card rounded-xl p-4">
                                <h3 className="text-sm font-black text-white">{item.question}</h3>
                                <p className="mt-2 text-xs leading-6 text-white/62">{item.answer}</p>
                                <Link href={item.href} className="mt-3 inline-flex text-[11px] font-bold text-[#F1A91B]">
                                    {item.cta} &rarr;
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="bg-black/70 text-white/65 border-t border-[#D79622]/25">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-8 mb-10">
                        <div>
                            <h4 className="text-xs font-black text-[#F1A91B] uppercase tracking-widest mb-3">Pilot Car Directory</h4>
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
                            <h4 className="text-xs font-black text-[#F1A91B] uppercase tracking-widest mb-3">Heavy Haul Tools</h4>
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
                            <h4 className="text-xs font-black text-[#F1A91B] uppercase tracking-widest mb-3">Resources</h4>
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
                            <h4 className="text-xs font-black text-[#F1A91B] uppercase tracking-widest mb-3">For Operators</h4>
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
                            <h4 className="text-xs font-black text-[#F1A91B] uppercase tracking-widest mb-3">Company</h4>
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

                    <div className="mb-8 rounded-xl border border-[#D79622]/20 bg-black/35 p-5 text-center">
                        <h4 className="text-sm font-black text-white">The Global OS for Pilot Cars & Heavy Haul</h4>
                        <p className="mx-auto mt-3 max-w-3xl text-xs leading-6 text-white/58">
                            Haul Command is the world's premier logistics infrastructure for oversize load transportation:
                            a verified pilot car directory, oversize load board, permit compliance tools, route corridor
                            intelligence, and trust verification network covering {registryCountryLabel} countries.
                        </p>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-[#D79622]/25 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/brand/logo.svg" alt="Haul Command" className="h-8 w-auto opacity-90" />
                            <span className="text-xs text-white/50">&copy; {new Date().getFullYear()} Haul Command. The Operating System for Heavy Haul.</span>
                        </div>
                        <div className="flex gap-4 text-xs text-white/50">
                            <Link href="/terms" className="hover:text-[#F1A91B]">Terms</Link>
                            <Link href="/privacy" className="hover:text-[#F1A91B]">Privacy</Link>
                            <Link href="/security" className="hover:text-[#F1A91B]">Security</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
