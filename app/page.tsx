"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Activity, Shield, Zap, Map, TrendingUp, Users,
    ChevronRight, Star, CheckCircle, ArrowRight, Truck,
    Clock, BarChart3, Radio
} from "lucide-react";
import { fetchMarketPulse, type MarketPulse } from "@/lib/actions/market-pulse";

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

// ===== LIVE COUNTER COMPONENT =====
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

// ===== FEATURE DATA =====
const FEATURES = [
    {
        icon: TrendingUp,
        title: "Stage Probability",
        desc: "Our engine predicts the likelihood an escort will accept your load — using real historical behavior, not guesswork. Updated every 4 hours.",
        color: "#F1A91B",
    },
    {
        icon: Shield,
        title: "Instant Trust",
        desc: "Built from real lane performance data. Every operator card shows response time, acceptance rate, and incident history — per corridor, not averaged.",
        color: "#22c55e",
    },
    {
        icon: Zap,
        title: "One-Tap Accept",
        desc: "Fast confirmation keeps loads moving. Escorts go from push notification to accepted in under two taps — with haptic confirmation so nothing gets missed.",
        color: "#3b82f6",
    },
    {
        icon: Map,
        title: "Territory Intelligence",
        desc: "Claim corridors and counties. See shortage zones and hard-fill alerts before your competitors do — and act before the window closes.",
        color: "#a855f7",
    },
    {
        icon: Activity,
        title: "Hard-Fill Alerts",
        desc: "When a load starts timing out, broker fix options appear automatically — raise the rate, widen the window, expand the radius — before it goes stale.",
        color: "#ef4444",
    },
    {
        icon: Star,
        title: "Boosted Guarantee",
        desc: "Boosted loads come with computed fill windows. Miss the window and a broker credit issues automatically. No disputes, no emails, no chasing.",
        color: "#F1A91B",
    },
];

const HOW_IT_WORKS = [
    {
        role: "For Brokers",
        color: "#F1A91B",
        steps: [
            "Post load with dimensions, route & rate",
            "Intelligence engine scores fill probability in real time",
            "Matched escorts accept in one tap — you see it instantly",
        ],
    },
    {
        role: "For Escorts",
        color: "#22c55e",
        steps: [
            "Toggle available — your presence goes live on the map",
            "Receive push offers filtered to your capabilities and territory",
            "Accept in one tap. Status auto-sets to busy. Done.",
        ],
    },
];

// ===== MAIN PAGE =====
export default function HomePage() {
    // Live data from v_market_pulse via server action — with timeout fallback
    const [pulse, setPulse] = useState<MarketPulse | null>(null);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!loaded) {
                setPulse({
                    escorts_online_now: 0,
                    escorts_available_now: 0,
                    open_loads_now: 0,
                    median_fill_time_min_7d: null,
                    fill_rate_7d: null,
                });
                setLoaded(true);
            }
        }, 3000);
        fetchMarketPulse()
            .then((p) => { setPulse(p); setLoaded(true); })
            .catch(() => {
                setPulse({
                    escorts_online_now: 0,
                    escorts_available_now: 0,
                    open_loads_now: 0,
                    median_fill_time_min_7d: null,
                    fill_rate_7d: null,
                });
                setLoaded(true);
            });
        return () => clearTimeout(timeout);
    }, []);

    const escortsOnline = pulse?.escorts_online_now ?? 0;
    const escortsAvailable = pulse?.escorts_available_now ?? 0;
    const openLoads = pulse?.open_loads_now ?? 0;
    const medianFillMin = pulse?.median_fill_time_min_7d ? Math.round(pulse.median_fill_time_min_7d) : 0;

    return (
        <div className="min-h-screen bg-hc-bg text-white font-[family-name:var(--font-body)]">
            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(241,169,27,0.10),transparent_70%)]" />
            </div>

            {/* ── Nav ── */}
            <nav className="relative z-50 border-b border-white/[0.06] surface-glass">
                <div className="hc-container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#F1A91B] rounded-xl flex items-center justify-center font-black text-black text-sm shadow-[0_0_24px_rgba(241,169,27,0.3)]">
                            HC
                        </div>
                        <span className="font-bold text-white text-sm uppercase tracking-[0.15em]">Haul Command</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-[11px] text-[#777] font-semibold uppercase tracking-[0.15em]">
                        <Link href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                        <Link href="/loads" className="hover:text-[#F1A91B] transition-colors">Load Board</Link>
                        <Link href="/leaderboards" className="hover:text-[#F1A91B] transition-colors">Leaderboard</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-[11px] text-[#777] font-semibold uppercase tracking-[0.15em] hover:text-white transition-colors hidden sm:block">
                            Sign In
                        </Link>
                        <Link href="/onboarding/start" className="px-5 py-2.5 bg-[#F1A91B] hover:bg-[#d4911a] text-black font-bold text-[11px] uppercase tracking-[0.1em] rounded-xl transition-all press-scale shadow-[0_0_20px_rgba(241,169,27,0.2)]">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════
                HERO — Maximum Impact Zone
            ═══════════════════════════════════════════ */}
            <section className="relative z-10 pt-28 pb-8">
                <div className="hc-container max-w-5xl text-center">
                    {/* Live badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#F1A91B]/[0.06] border border-[#F1A91B]/20 rounded-full mb-10"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F1A91B] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F1A91B]" />
                        </span>
                        <span className="text-[11px] font-bold text-[#F1A91B] uppercase tracking-[0.2em]">
                            {escortsAvailable} Escorts Available Now
                        </span>
                    </motion.div>

                    {/* Headline — 2026 Upgrade: Maximum visual dominance */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                        className="text-[clamp(2.75rem,6vw,5rem)] font-black tracking-[-0.03em] mb-7 leading-[1.02]"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        The Intelligence Layer
                        <br />
                        <span className="bg-gradient-to-r from-[#E0B05C] via-[#F1A91B] to-[#C6923A] bg-clip-text text-transparent">
                            for Heavy Haul
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                        className="text-lg sm:text-xl text-[#8fa3b8] max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
                    >
                        Real-time escort matching. Stage-based fill probability.
                        One-tap accept from push notification.
                        Built for the oversize load corridor — not the general freight crowd.
                    </motion.p>

                    {/* Dual CTA — stronger gold presence */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
                    >
                        <Link
                            href="/onboarding/start?role=escort"
                            className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-[#F1A91B] hover:bg-[#E0A318] text-black font-bold text-sm rounded-2xl transition-all press-scale shadow-[0_0_40px_rgba(241,169,27,0.25)] hover:shadow-[0_0_60px_rgba(241,169,27,0.4)]"
                        >
                            <Users className="w-4 h-4" />
                            I&apos;m an Escort
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="/onboarding/start?role=broker"
                            className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-transparent border border-white/10 hover:border-[#F1A91B]/30 text-white font-bold text-sm rounded-2xl transition-all hover:bg-white/[0.02]"
                        >
                            <Truck className="w-4 h-4" />
                            I&apos;m a Broker
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Trust signal */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-[11px] text-[#5A6577] flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Free for escorts · Brokers get 10 boost credits on activation · No card required
                    </motion.p>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                LIVE MARKET PULSE — Upgraded to Metric Blocks
            ═══════════════════════════════════════════ */}
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
                            { label: "Escorts Online", value: escortsOnline, suffix: "", icon: Radio, color: "#22c55e" },
                            { label: "Available Now", value: escortsAvailable, suffix: "", icon: Users, color: "#F1A91B" },
                            { label: "Open Loads", value: openLoads, suffix: "", icon: BarChart3, color: "#3b82f6" },
                            { label: "Median Fill Time", value: medianFillMin, suffix: "m", icon: Clock, color: "#a855f7" },
                        ].map(({ label, value, suffix, icon: Icon, color }, i) => (
                            <motion.div key={label} custom={i} variants={fadeUp} className="metric-block group">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                    {label === "Escorts Online" && (
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                                        </span>
                                    )}
                                </div>
                                <div className="metric-block__value">
                                    <AnimatedNumber value={value} suffix={suffix} />
                                </div>
                                <div className="metric-block__label">{label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Liquidity Trust Strip ── */}
            <section className="relative z-10 pb-8">
                <div className="hc-container max-w-3xl">
                    <div className="liquidity-strip flex-wrap">
                        {[
                            { label: "Verified Escorts", color: "#22c55e" },
                            { label: "Escrow Protected", color: "#F1A91B" },
                            { label: "Median Fill: 47min", color: "#a855f7" },
                            { label: "US + Canada", color: "#3b82f6" },
                            { label: "Industry Leaderboard", color: "#F1A91B" },
                        ].map(({ label, color }) => (
                            <div key={label} className="liquidity-strip__item">
                                <div className="liquidity-strip__dot" style={{ background: color }} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                HOW IT WORKS — Elevated Cards
            ═══════════════════════════════════════════ */}
            <section className="relative z-10 py-24">
                <div className="hc-container max-w-5xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        className="text-center mb-16"
                    >
                        <div className="text-[10px] font-bold text-[#F1A91B] uppercase tracking-[0.3em] mb-4">How It Works</div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Built for Both Sides of the Match
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {HOW_IT_WORKS.map(({ role, color, steps }) => (
                            <motion.div
                                key={role}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={scaleIn}
                                className="intelligence-card"
                                style={{ "--accent-color": color } as React.CSSProperties}
                            >
                                {/* Inner content wrapper — max-width + centered.
                                    Keeps the card full-width but centers content inside it. */}
                                <div className="text-center">
                                    <h3
                                        className="font-bold text-sm uppercase tracking-[0.15em] mb-6"
                                        style={{ color }}
                                    >
                                        {role}
                                    </h3>
                                    {/* List container: parent text-align:center ensures the inline-block
                                        is centered. Text inside stays left-aligned for readability. */}
                                    <div className="inline-block text-left">
                                        <ol className="space-y-4 list-none p-0 m-0">
                                            {steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span
                                                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border mt-0.5"
                                                        style={{
                                                            color,
                                                            borderColor: `${color}30`,
                                                            backgroundColor: `${color}12`,
                                                        }}
                                                    >
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

            {/* ══════════════════════════════════════════
                FEATURE GRID — Intelligence Cards with Accent Bars
            ═══════════════════════════════════════════ */}
            <section className="relative z-10 py-24">
                <div className="hc-container max-w-5xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        className="text-center mb-16"
                    >
                        <div className="text-[10px] font-bold text-[#F1A91B] uppercase tracking-[0.3em] mb-4">Why Haul Command</div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            The Moat No One Else Has
                        </h2>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
                            <motion.div
                                key={title}
                                custom={i}
                                variants={fadeUp}
                                className="intelligence-card group"
                                style={{ "--accent-color": color } as React.CSSProperties}
                            >
                                {/* Centered content layout — icon + heading + body all aligned */}
                                <div className="text-center">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 mx-auto"
                                        style={{ backgroundColor: `${color}10`, border: `1px solid ${color}15` }}
                                    >
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

            {/* ══════════════════════════════════════════
                BOTTOM CTA — With Radial Glow
            ═══════════════════════════════════════════ */}
            <section className="relative z-10 py-24">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={scaleIn}
                    className="max-w-2xl mx-auto text-center"
                >
                    <div className="relative bg-[var(--hc-surface)] border border-[var(--hc-border)] rounded-3xl p-14 shadow-[0_0_80px_rgba(241,169,27,0.06)] overflow-hidden">
                        {/* Radial glow backdrop */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(241,169,27,0.06),transparent)] pointer-events-none" />

                        <div className="relative z-10">
                            <div className="text-[10px] font-bold text-[#F1A91B] uppercase tracking-[0.3em] mb-5">Ready?</div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-5" style={{ fontFamily: "var(--font-display)" }}>
                                Run a smarter corridor.
                            </h2>
                            <p className="text-[#8fa3b8] text-sm mb-10 max-w-sm mx-auto leading-relaxed font-medium">
                                Free for escorts. Brokers get 10 boost credits on activation. No card required.
                            </p>
                            <Link
                                href="/onboarding/start"
                                className="inline-flex items-center gap-2.5 px-10 py-4 bg-[#F1A91B] hover:bg-[#E0A318] text-black font-bold text-sm rounded-2xl transition-all press-scale shadow-[0_0_50px_rgba(241,169,27,0.25)] hover:shadow-[0_0_70px_rgba(241,169,27,0.4)]"
                            >
                                Create Your Account
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-white/[0.06] py-12">
                <div className="hc-container flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#F1A91B] rounded-lg flex items-center justify-center font-black text-black text-[10px]">HC</div>
                        <span className="text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.15em]">© 2026 Haul Command. The Operating System for Heavy Haul.</span>
                    </div>
                    <div className="flex gap-6 text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.1em]">
                        <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                        <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
                        <Link href="/directory" className="hover:text-white/60 transition-colors">Directory</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
