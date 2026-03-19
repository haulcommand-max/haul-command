"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight, TrendingUp, Flame, Radio, Shield, Search,
    MapPin, FileCheck, Briefcase, Building2, BarChart3, Eye,
    Repeat, MessageSquare, Package, Wrench, Star, Map,
} from "lucide-react";
import { useRole } from "@/lib/role-context";
import { ROLE_LIST, ROLE_CONFIGS, type HCRole } from "@/lib/role-config";

/* ═══════════════════════════════════════════════════════════════
   LIVE MARKET HERO — Role-Aware Command Surface

   When no role is selected → shows role selector cards
   When role is selected → shows role-specific action grid

   ANTI-REGRESSION RULES:
   - Escort operators NEVER see "Find an Escort" as first action
   - Each role gets genuinely different actions
   - Role badge in header links back to selector
   ═══════════════════════════════════════════════════════════════ */

interface LiveMarketHeroProps {
    totalOperators: number;
    corridorCount: number;
    openLoads: number;
    medianFillMin: number;
    hotCorridor?: string;
    hotCorridorDelta?: number;
    avgRate?: number;
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!value) return;
        let s = 0;
        const dur = 1000;
        const step = Math.max(1, Math.ceil(dur / value));
        const timer = setInterval(() => {
            s += Math.max(1, Math.ceil(value / 30));
            if (s >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(s);
        }, step);
        return () => clearInterval(timer);
    }, [value]);
    if (!value) return <span className="text-[#3A4553]">—</span>;
    return <span>{display.toLocaleString("en-US")}{suffix}</span>;
}

// ─── Role-specific routes ────────────────────────────────────
type RouteConfig = { href: string; icon: any; label: string; desc: string; color: string; primary: boolean };

const ROLE_ROUTE_MAP: Record<HCRole, RouteConfig[]> = {
    escort_operator: [
        { href: "/loads", icon: Package, label: "Find Jobs", desc: "Loads near you", color: "#22c55e", primary: true },
        { href: "/onboarding/claim", icon: Shield, label: "Claim Profile", desc: "Get verified", color: "#3b82f6", primary: true },
        { href: "/settings/services", icon: Wrench, label: "Set Services", desc: "Your capabilities", color: "#a855f7", primary: false },
        { href: "/settings/area", icon: Map, label: "Service Area", desc: "Where you operate", color: "#C6923A", primary: false },
    ],
    broker_dispatcher: [
        { href: "/directory", icon: Search, label: "Find Escort", desc: "Verified operators", color: "#C6923A", primary: true },
        { href: "/loads/post", icon: MapPin, label: "Post Load", desc: "Get coverage fast", color: "#22c55e", primary: true },
        { href: "/corridors", icon: BarChart3, label: "Corridor Coverage", desc: "Supply density", color: "#a855f7", primary: false },
        { href: "/loads/rescue", icon: Flame, label: "Rescue Fill", desc: "Hard-fill lanes", color: "#ef4444", primary: false },
    ],
    both: [
        { href: "/loads/post", icon: MapPin, label: "Post Load", desc: "Need coverage", color: "#C6923A", primary: true },
        { href: "/loads", icon: Package, label: "Find Jobs", desc: "Take a load", color: "#22c55e", primary: true },
        { href: "#", icon: Repeat, label: "Switch Mode", desc: "Broker ↔ Operator", color: "#3b82f6", primary: false },
        { href: "/messages", icon: MessageSquare, label: "Inbox", desc: "Messages", color: "#a855f7", primary: false },
    ],
    support_partner: [
        { href: "/partner/join", icon: Building2, label: "Become Partner", desc: "Join the network", color: "#C6923A", primary: true },
        { href: "/onboarding/claim", icon: MapPin, label: "Claim Location", desc: "Add your spot", color: "#22c55e", primary: true },
        { href: "/partner/services", icon: Wrench, label: "List Services", desc: "What you offer", color: "#3b82f6", primary: false },
        { href: "/map", icon: Map, label: "Market Gaps", desc: "Where you're needed", color: "#a855f7", primary: false },
    ],
    observer_researcher: [
        { href: "/leaderboards", icon: BarChart3, label: "Dashboards", desc: "Market rankings", color: "#C6923A", primary: true },
        { href: "/corridors", icon: Eye, label: "Track Corridors", desc: "Activity trends", color: "#22c55e", primary: true },
        { href: "/intelligence", icon: TrendingUp, label: "Reports", desc: "Analysis & data", color: "#3b82f6", primary: false },
        { href: "/map", icon: Map, label: "Density Map", desc: "Supply heatmap", color: "#a855f7", primary: false },
    ],
};

const DEFAULT_ROUTES: RouteConfig[] = [
    { href: "/loads/post", icon: MapPin, label: "Post a Load", desc: "Find escorts fast", color: "#C6923A", primary: true },
    { href: "/loads", icon: Search, label: "Find Loads", desc: "Escort jobs near you", color: "#22c55e", primary: true },
    { href: "/onboarding/claim", icon: Shield, label: "Claim Profile", desc: "Get verified", color: "#3b82f6", primary: false },
    { href: "/escort-requirements", icon: FileCheck, label: "Requirements", desc: "Check your state", color: "#a855f7", primary: false },
];

export function LiveMarketHero({
    totalOperators,
    corridorCount,
    openLoads,
    medianFillMin,
    hotCorridor = "Texas Gulf Coast",
    hotCorridorDelta = 12,
    avgRate = 380,
}: LiveMarketHeroProps) {
    const { role, setRole, config, clearRole } = useRole();
    const activeRoutes = role ? ROLE_ROUTE_MAP[role] : DEFAULT_ROUTES;
    const roleLabel = config?.label ?? null;
    const roleIcon = config?.icon ?? null;
    return (
        <section className="relative z-10">
            <style>{`
                /* ── Mobile-first hero styles ── */
                .hero-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    max-width: 280px;
                    margin: 0 auto 16px;
                }
                .hero-metric-third { display: none; }
                .hero-hot-corridor { display: none; }
                .hero-roles {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                .hero-role-card {
                    padding: 12px 8px 10px;
                }
                .hero-status-line {
                    gap: 8px 12px;
                    font-size: 9px;
                }

                /* ── Tablet+ (≥768px) ── */
                @media (min-width: 768px) {
                    .hero-metrics {
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 24px;
                        max-width: 480px;
                        margin-bottom: 24px;
                    }
                    .hero-metric-third { display: block; }
                    .hero-hot-corridor { display: flex; }
                    .hero-roles {
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        max-width: 640px;
                    }
                    .hero-role-card {
                        padding: 14px 8px 12px;
                    }
                    .hero-status-line {
                        gap: 4px 16px;
                        font-size: 10px;
                    }
                }
            `}</style>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(198,146,58,0.08),transparent_60%)]" />
            </div>

            <div className="hc-container relative z-10 pb-5 pt-5 sm:pt-10 sm:pb-8">
                {/* LIVE label */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-center gap-2 mb-4"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 800, color: '#22c55e',
                        textTransform: 'uppercase', letterSpacing: '0.2em',
                    }}>Live Escort Market</span>
                </motion.div>

                {/* TOP-LINE METRICS — 2 on mobile, 3 on desktop */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="hero-metrics"
                >
                    <div className="text-center">
                        <div className="text-lg sm:text-3xl font-black tracking-tight" style={{ color: "#22c55e", fontFamily: "var(--font-mono, monospace)" }}>
                            <Counter value={totalOperators} />
                        </div>
                        <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                            Network Contacts
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg sm:text-3xl font-black tracking-tight" style={{ color: "#a855f7", fontFamily: "var(--font-mono, monospace)" }}>
                            <Counter value={corridorCount} />
                        </div>
                        <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                            Active Corridors
                        </div>
                    </div>
                    <div className="text-center hero-metric-third">
                        <div className="text-lg sm:text-3xl font-black tracking-tight" style={{ color: "#C6923A", fontFamily: "var(--font-mono, monospace)" }}>
                            $<Counter value={avgRate} />
                        </div>
                        <div className="text-[9px] sm:text-[11px] text-[#8fa3b8] font-semibold uppercase tracking-[0.12em] mt-0.5">
                            Avg Rate/Day
                        </div>
                    </div>
                </motion.div>

                {/* HOTTEST CORRIDOR — hidden on mobile */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="hero-hot-corridor justify-center mb-5"
                >
                    <Link href="/corridors" className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12] transition-all">
                        <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-red-400 uppercase tracking-[0.15em]">Hottest Corridor</div>
                            <div className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                                {hotCorridor}
                                <span className="text-red-400 ml-2 text-xs font-mono">+{hotCorridorDelta}%</span>
                            </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-red-400/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </Link>
                </motion.div>

                {/* ROLE ROUTER — role-aware */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {!role ? (
                        /* ── No role selected → show role chooser ── */
                        <>
                            <div className="text-center text-[10px] text-[#5A6577] font-semibold uppercase tracking-[0.15em] mb-2 sm:mb-3">
                                What&apos;s your role?
                            </div>
                            <div className="hero-roles" style={{ maxWidth: 520 }}>
                                {ROLE_LIST.map((r) => {
                                    const rc = ROLE_CONFIGS[r];
                                    return (
                                        <button
                                            key={r}
                                            onClick={() => setRole(r)}
                                            className="hero-role-card group relative flex flex-col items-center text-center rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
                                        >
                                            <div className="text-lg sm:text-xl mb-1">{rc.icon}</div>
                                            <div className="text-[11px] sm:text-xs font-bold text-white group-hover:text-[#C6923A] transition-colors leading-tight">{rc.label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        /* ── Role selected → show role-specific actions ── */
                        <>
                            <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                                <span className="text-sm">{roleIcon}</span>
                                <span className="text-[10px] text-[#C6923A] font-bold uppercase tracking-[0.15em]">
                                    {roleLabel}
                                </span>
                                <button
                                    onClick={clearRole}
                                    className="text-[9px] text-[#5A6577] hover:text-white transition-colors ml-1 underline cursor-pointer"
                                >
                                    change
                                </button>
                            </div>
                            <div className="hero-roles">
                                {activeRoutes.map(({ href, icon: Icon, label, desc, color, primary }: RouteConfig) => (
                                    <Link
                                        key={href + label}
                                        href={href}
                                        className={`hero-role-card group relative flex flex-col items-center text-center rounded-xl border transition-all
                                            ${primary
                                                ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
                                                : 'border-white/[0.06] bg-transparent hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1.5 transition-colors"
                                            style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
                                        </div>
                                        <div className="text-[11px] sm:text-xs font-bold text-white group-hover:text-[#C6923A] transition-colors leading-tight">{label}</div>
                                        <div className="text-[9px] text-[#5A6577] mt-0.5 hidden sm:block">{desc}</div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>

                {/* STATUS LINE — simplified on mobile */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="hero-status-line flex flex-wrap items-center justify-center mt-4 text-[#5A6577]"
                >
                    <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 text-[#C6923A]" />
                        Escrow payments
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-blue-400" />
                        Free for escorts
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
