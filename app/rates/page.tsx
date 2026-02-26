"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DollarSign, Zap, ChevronRight, TrendingUp, Calculator, MapPin, Truck } from "lucide-react";

// ── Design tokens ───────────────────────────────────────────────────────────
const T = {
    bg: "#060b12",
    surface: "rgba(255,255,255,0.03)",
    surfaceHigh: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.07)",
    borderStrong: "rgba(255,255,255,0.12)",
    gold: "#F1A91B",
    green: "#22c55e",
    blue: "#3ba4ff",
    textPrimary: "#ffffff",
    textBody: "#cfd8e3",
    textMuted: "#8fa3b8",
    textSubtle: "#5A6577",
} as const;

// ── US States ───────────────────────────────────────────────────────────────
const US_STATES = [
    { code: "tx", name: "Texas", hot: true },
    { code: "ca", name: "California", hot: true },
    { code: "fl", name: "Florida", hot: true },
    { code: "ok", name: "Oklahoma", hot: true },
    { code: "la", name: "Louisiana", hot: true },
    { code: "tn", name: "Tennessee", hot: false },
    { code: "ga", name: "Georgia", hot: false },
    { code: "nc", name: "North Carolina", hot: false },
    { code: "oh", name: "Ohio", hot: false },
    { code: "pa", name: "Pennsylvania", hot: false },
    { code: "il", name: "Illinois", hot: false },
    { code: "wa", name: "Washington", hot: false },
    { code: "az", name: "Arizona", hot: false },
    { code: "co", name: "Colorado", hot: false },
    { code: "mo", name: "Missouri", hot: false },
    { code: "mi", name: "Michigan", hot: false },
    { code: "ny", name: "New York", hot: false },
    { code: "va", name: "Virginia", hot: false },
    { code: "al", name: "Alabama", hot: false },
    { code: "ar", name: "Arkansas", hot: true },
    { code: "ms", name: "Mississippi", hot: false },
    { code: "ks", name: "Kansas", hot: false },
    { code: "ne", name: "Nebraska", hot: false },
    { code: "wy", name: "Wyoming", hot: false },
    { code: "mt", name: "Montana", hot: false },
    { code: "id", name: "Idaho", hot: false },
    { code: "nv", name: "Nevada", hot: false },
    { code: "nm", name: "New Mexico", hot: false },
    { code: "ut", name: "Utah", hot: false },
    { code: "or", name: "Oregon", hot: false },
];

const HOT_CORRIDORS = [
    { slug: "i95-northeast", label: "I-95 NE Corridor", states: "ME → FL", base: 420 },
    { slug: "i10-south", label: "I-10 Southern", states: "FL → CA", base: 380 },
    { slug: "i80-midwest", label: "I-80 Midwest", states: "NJ → CA", base: 350 },
    { slug: "i40-crosscountry", label: "I-40 Cross-Country", states: "NC → CA", base: 360 },
    { slug: "i75-southeast", label: "I-75 Southeast", states: "MI → FL", base: 320 },
    { slug: "texas-oilfield", label: "Texas Oilfield Runs", states: "TX/NM/LA", base: 440 },
];

// ── Rate Calculator Widget ────────────────────────────────────────────────────
function RateCalculator() {
    const [miles, setMiles] = useState(100);
    const [jobType, setJobType] = useState<"local" | "regional" | "longhaul">("regional");
    const [pilotCount, setPilotCount] = useState(1);

    const BASE_RATES = { local: 310, regional: 380, longhaul: 460 };
    const PER_MILE = { local: 0.014, regional: 0.016, longhaul: 0.019 };

    const base = BASE_RATES[jobType];
    const perMile = PER_MILE[jobType];
    const estimated = Math.round((base + miles * perMile) * pilotCount);
    const low = Math.round(estimated * 0.8);
    const high = Math.round(estimated * 1.25);

    return (
        <div className="rounded-3xl p-6 sm:p-8" style={{ background: T.surfaceHigh, border: `1px solid ${T.borderStrong}` }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${T.gold}15`, border: `1px solid ${T.gold}30` }}>
                    <Calculator className="w-5 h-5" style={{ color: T.gold }} />
                </div>
                <div>
                    <h2 className="font-black text-white text-lg leading-none">Escort Rate Estimator</h2>
                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Instant market-rate estimate — no sign-up</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {/* Miles */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: T.textSubtle }}>
                        Distance (miles)
                    </label>
                    <input
                        type="number"
                        value={miles}
                        onChange={e => setMiles(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-3 rounded-xl text-white font-mono text-sm font-bold outline-none focus:ring-2 transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                </div>

                {/* Job type */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: T.textSubtle }}>
                        Run Type
                    </label>
                    <select
                        value={jobType}
                        onChange={e => setJobType(e.target.value as typeof jobType)}
                        className="w-full px-4 py-3 rounded-xl text-white font-bold text-sm outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                        <option value="local">Local (&lt;50 mi)</option>
                        <option value="regional">Regional (50-150 mi)</option>
                        <option value="longhaul">Long Haul (150+ mi)</option>
                    </select>
                </div>

                {/* Pilot count */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: T.textSubtle }}>
                        Pilot Cars Needed
                    </label>
                    <select
                        value={pilotCount}
                        onChange={e => setPilotCount(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl text-white font-bold text-sm outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                        {[1, 2, 3, 4].map(n => (
                            <option key={n} value={n}>{n} {n === 1 ? "pilot" : "pilots"}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Result */}
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(241,169,27,0.06)", border: "1px solid rgba(241,169,27,0.18)" }}>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: T.textSubtle }}>Estimated Cost Range</div>
                <div className="flex items-center justify-center gap-4">
                    <div>
                        <div className="text-2xl font-black font-mono" style={{ color: T.textMuted }}>${low.toLocaleString()}</div>
                        <div className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: T.textSubtle }}>Budget</div>
                    </div>
                    <div className="text-lg" style={{ color: T.textSubtle }}>→</div>
                    <div>
                        <div className="text-4xl font-black font-mono" style={{ color: T.gold }}>${estimated.toLocaleString()}</div>
                        <div className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: T.textSubtle }}>Market Rate</div>
                    </div>
                    <div className="text-lg" style={{ color: T.textSubtle }}>→</div>
                    <div>
                        <div className="text-2xl font-black font-mono" style={{ color: T.textMuted }}>${high.toLocaleString()}</div>
                        <div className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: T.textSubtle }}>Premium</div>
                    </div>
                </div>
                <p className="text-[10px] mt-3" style={{ color: T.textSubtle }}>
                    Based on {miles} miles · {jobType} run · {pilotCount} pilot car{pilotCount > 1 ? "s" : ""}
                </p>
            </div>

            <div className="flex gap-3 mt-4">
                <Link href="/loads/new"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                    style={{ background: `linear-gradient(135deg,${T.gold},#d97706)`, color: "#000" }}>
                    Post a Load with This Rate <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/directory"
                    className="px-5 py-3 rounded-xl font-bold text-sm transition-colors hover:opacity-80"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textBody }}>
                    Find Operators
                </Link>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RatesPage() {
    const [filter, setFilter] = useState("");
    const filtered = US_STATES.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="min-h-screen" style={{ background: T.bg, color: T.textBody, fontFamily: "var(--font-body, 'Inter', system-ui)" }}>
            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org", "@type": "WebPage",
                    name: "Pilot Car & Escort Rates Guide 2026 | Haul Command",
                    description: "Comprehensive escort and pilot car rate guides for every US state. Use our free rate calculator to estimate costs for your oversize load."
                })
            }} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* ── Hero Header ── */}
                <header className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                        style={{ background: "rgba(241,169,27,0.08)", border: "1px solid rgba(241,169,27,0.18)" }}>
                        <DollarSign className="w-3.5 h-3.5" style={{ color: T.gold }} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: T.gold }}>2026 Rate Intelligence</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "var(--font-display, inherit)" }}>
                        Pilot Car & Escort
                        <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent"> Rate Guides</span>
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: T.textMuted }}>
                        What does a pilot car cost? Browse state-by-state market rates, calculate your escort cost in seconds, or find a verified operator ready to quote.
                    </p>
                </header>

                {/* ── Rate Calculator ── */}
                <div className="mb-12">
                    <RateCalculator />
                </div>

                {/* ── Hot Corridors ── */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4" style={{ color: T.gold }} />
                        <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: T.textSubtle }}>High-Demand Corridors</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {HOT_CORRIDORS.map(c => (
                            <Link key={c.slug}
                                href={`/leaderboards?corridor=${c.slug}`}
                                className="group rounded-2xl p-4 transition-all hover:scale-[1.01] hover:-translate-y-0.5"
                                style={{ background: "rgba(241,169,27,0.04)", border: "1px solid rgba(241,169,27,0.12)" }}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-black text-white text-sm leading-tight">{c.label}</div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <MapPin className="w-2.5 h-2.5" style={{ color: T.textSubtle }} />
                                            <span className="text-[11px]" style={{ color: T.textMuted }}>{c.states}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black font-mono text-sm" style={{ color: T.gold }}>${c.base}+</div>
                                        <div className="text-[9px] uppercase tracking-wide" style={{ color: T.textSubtle }}>daily</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Browse by State ── */}
                <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" style={{ color: T.textSubtle }} />
                            <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: T.textSubtle }}>Rates by State</h2>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter states…"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="px-4 py-2 rounded-xl text-sm text-white outline-none"
                            style={{ background: T.surfaceHigh, border: `1px solid ${T.border}`, width: 180 }}
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {filtered.map(s => (
                            <Link key={s.code}
                                href={`/rates/${s.code}/pilot-car-cost`}
                                className="group flex items-center justify-between gap-2 rounded-xl px-4 py-3 transition-all hover:scale-[1.015] hover:-translate-y-px"
                                style={{
                                    background: s.hot ? "rgba(241,169,27,0.06)" : T.surface,
                                    border: s.hot ? "1px solid rgba(241,169,27,0.18)" : `1px solid ${T.border}`,
                                }}>
                                <span className="font-semibold text-sm truncate"
                                    style={{ color: s.hot ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)" }}>
                                    {s.name}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest flex-shrink-0"
                                    style={{ color: s.hot ? "rgba(241,169,27,0.7)" : "rgba(255,255,255,0.2)" }}>
                                    {s.code.toUpperCase()}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>No states match &ldquo;{filter}&rdquo;</p>
                            <button onClick={() => setFilter("")} className="text-xs font-black uppercase tracking-widest mt-2 transition-opacity hover:opacity-70" style={{ color: T.gold }}>
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Bottom CTA ── */}
                <div className="mt-12 rounded-3xl p-8 text-center"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: T.gold }} />
                    <h3 className="text-xl font-black text-white mb-2">Get live market rates from active operators</h3>
                    <p className="text-sm mb-6" style={{ color: T.textMuted }}>
                        Post your load and receive competitive quotes from verified pilot car operators in your corridor.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/loads/new"
                            className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-all hover:brightness-110"
                            style={{ background: `linear-gradient(135deg,${T.gold},#d97706)`, color: "#000" }}>
                            Post a Load → Get Quotes
                        </Link>
                        <Link href="/directory"
                            className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors"
                            style={{ background: T.surfaceHigh, border: `1px solid ${T.borderStrong}`, color: T.textBody }}>
                            Browse Operator Directory
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
