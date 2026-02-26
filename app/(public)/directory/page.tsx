"use client";

/**
 * /directory — Haul Command Directory Root
 *
 * HARD RULES (per product spec):
 *   ✅  Show ONLY: country toggle, search, region grid, corridors, claim bar
 *   🚫  No category labels (hotels, support, motels, permit-services, etc.)
 *   🚫  No accordion expansions
 *   🚫  No "unknown" badges
 *   🚫  No nested listing previews
 *
 * Clicking a state → /directory/{country}/{region} (no inline expansion)
 *
 * LAYOUT CONTRACT (2026 Standard):
 *   - Canonical centered container: max-w-[1280px] mx-auto px-[clamp(16px,4vw,32px)]
 *   - Every section lives inside this container — NO content can bleed left
 *   - CorridorStrip and BrowseRegions get natural left/right breathing from container
 */

import React, { useState } from "react";
import Link from "next/link";
import BrowseRegions2026 from "@/components/directory/BrowseRegions2026";
import { CorridorStrip } from "@/components/directory/CorridorStrip";
import { StickyClaimBar } from "@/components/directory/StickyClaimBar";
import SupplyRadarStrip from "@/components/intelligence/SupplyRadarStrip";
import { Map, Users, Zap, Flag } from "lucide-react";

// ── Stats ──────────────────────────────────────────────────────────────────────
const STATS = [
    { label: "Verified Operators", value: "2,400+", icon: Users },
    { label: "US States", value: "50", icon: Flag },
    { label: "Active Corridors", value: "120+", icon: Zap },
] as const;

// ── Port hubs ─────────────────────────────────────────────────────────────────
interface PortHub {
    slug: string;
    name: string;
    state: string;
    twic: boolean;
    demandScore: number; // 0–100
    hot: boolean;
}

const PORT_HUBS: PortHub[] = [
    { slug: "port-of-houston", name: "Port of Houston", state: "TX", twic: true, demandScore: 94, hot: true },
    { slug: "port-of-los-angeles", name: "Port of Los Angeles", state: "CA", twic: true, demandScore: 88, hot: true },
    { slug: "port-of-new-orleans", name: "Port of New Orleans", state: "LA", twic: true, demandScore: 82, hot: true },
    { slug: "port-of-savannah", name: "Port of Savannah", state: "GA", twic: true, demandScore: 79, hot: true },
    { slug: "port-of-norfolk", name: "Port of Norfolk", state: "VA", twic: true, demandScore: 71, hot: false },
    { slug: "port-of-charleston", name: "Port of Charleston", state: "SC", twic: true, demandScore: 68, hot: false },
    { slug: "port-of-tampa", name: "Port of Tampa", state: "FL", twic: true, demandScore: 65, hot: false },
    { slug: "port-of-long-beach", name: "Port of Long Beach", state: "CA", twic: true, demandScore: 63, hot: false },
    { slug: "port-of-mobile", name: "Port of Mobile", state: "AL", twic: true, demandScore: 58, hot: false },
    { slug: "port-of-corpus-christi", name: "Port of Corpus Christi", state: "TX", twic: true, demandScore: 55, hot: false },
];

// ── Root page ──────────────────────────────────────────────────────────────────
export default function DirectoryPage() {
    const [country] = useState<"US" | "CA">("US");


    return (
        <div className="min-h-screen bg-gray-950 text-white" data-testid="directory-root">

            {/* ══════════════════════════════════════════════════════════
                CANONICAL CENTERED CONTAINER — all content lives here.
                max-w-[1280px] + clamp padding ensures nothing hugs an edge.
            ══════════════════════════════════════════════════════════ */}
            <div
                className="mx-auto w-full"
                style={{
                    maxWidth: "1280px",
                    paddingLeft: "clamp(16px, 4vw, 32px)",
                    paddingRight: "clamp(16px, 4vw, 32px)",
                }}
            >

                {/* ══════════════════════════════════════════
                    HERO
                ═══════════════════════════════════════════ */}
                <div className="pt-14 pb-10 md:pt-20 md:pb-14">

                    {/* Live badge */}
                    <div className="flex items-center gap-2 mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
                            Live Directory
                        </span>
                    </div>

                    {/* Headline */}
                    <h1
                        className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.04em] uppercase leading-none mb-4"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Pilot Car &amp;&nbsp;
                        <span className="bg-gradient-to-r from-[#E0B05C] via-[#F1A91B] to-[#C6923A] bg-clip-text text-transparent">
                            Escort Directory
                        </span>
                    </h1>
                    <p className="text-[#8fa3b8] text-base sm:text-lg max-w-xl font-medium leading-relaxed mb-10">
                        The North American heavy haul intelligence network.
                        Select a state or province to find verified operators near you.
                    </p>

                    {/* Stats strip */}
                    <div className="flex flex-wrap gap-3">
                        {STATS.map(({ label, value, icon: Icon }) => (
                            <div
                                key={label}
                                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 hover-lift-strong cursor-default"
                                style={{
                                    background: "var(--hc-surface, rgba(255,255,255,0.04))",
                                    border: "1px solid var(--hc-border, rgba(255,255,255,0.07))",
                                }}
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F1A91B" }} />
                                <span className="text-sm font-black text-white">{value}</span>
                                <span className="text-[10px] text-[#5A6577] font-semibold">{label}</span>
                            </div>
                        ))}
                        <Link
                            href="/map"
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all hover:opacity-80"
                            style={{
                                background: "rgba(241,169,27,0.08)",
                                border: "1px solid rgba(241,169,27,0.2)",
                                color: "#F1A91B",
                            }}
                        >
                            <Map className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Interactive Map</span>
                        </Link>
                    </div>
                </div>

                {/* ── Divider ── */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

                {/* ── Supply Radar — shortage index at a glance ── */}
                <SupplyRadarStrip surface="directory" minScarcity={40} />

                {/* ── High-Demand Corridors ── */}
                <div className="py-10">
                    <CorridorStrip />
                </div>

                {/* ── Divider ── */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

                {/* ══════════════════════════════════════════
                    HIGH-ACTIVITY PORTS
                    Port schema ready (ports + port_corridor_links tables live).
                    This section links to /ports/[slug] pages (scaffold pending).
                ═══════════════════════════════════════════ */}
                <div className="py-10" data-testid="port-hubs-section">
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "var(--hc-gold-500, #F1A91B)" }} />
                        <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                            High-Activity Ports
                        </h2>
                        <span
                            className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(241,169,27,0.08)", color: "rgba(241,169,27,0.6)", border: "1px solid rgba(241,169,27,0.14)" }}
                        >
                            Demand Origins
                        </span>
                    </div>

                    {/* Port grid */}
                    <div
                        className="grid gap-2.5"
                        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
                    >
                        {PORT_HUBS.map(port => (
                            <Link
                                key={port.slug}
                                href={`/ports/${port.slug}`}
                                className="group rounded-xl px-4 py-4 flex items-start justify-between gap-3 transition-all duration-150 focus-visible:outline-none"
                                style={{
                                    background: port.hot ? "rgba(241,169,27,0.06)" : "rgba(255,255,255,0.03)",
                                    border: port.hot ? "1px solid rgba(241,169,27,0.22)" : "1px solid rgba(255,255,255,0.07)",
                                    minHeight: "64px",
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget;
                                    el.style.transform = "translateY(-2px)";
                                    el.style.boxShadow = port.hot
                                        ? "0 4px 16px rgba(241,169,27,0.18), 0 0 0 1px rgba(241,169,27,0.3)"
                                        : "0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.10)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "";
                                    e.currentTarget.style.boxShadow = "";
                                }}
                                title={`Escorts near ${port.name}`}
                                aria-label={`Browse escorts near ${port.name}`}
                            >
                                <div className="min-w-0">
                                    <div
                                        className="text-sm font-semibold leading-tight group-hover:text-white transition-colors truncate"
                                        style={{ color: port.hot ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)" }}
                                    >
                                        {port.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className="text-[9px] font-black uppercase tracking-widest"
                                            style={{ color: port.hot ? "rgba(241,169,27,0.75)" : "rgba(255,255,255,0.28)" }}
                                        >
                                            {port.state}
                                        </span>
                                        {port.twic && (
                                            <span
                                                className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                style={{ background: "rgba(59,130,246,0.10)", color: "rgba(59,130,246,0.7)", border: "1px solid rgba(59,130,246,0.15)" }}
                                            >
                                                TWIC
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Demand score pill */}
                                <div
                                    className="flex-shrink-0 text-[10px] font-black tabular-nums rounded-lg px-2 py-1 mt-0.5"
                                    style={{
                                        background: port.demandScore >= 75 ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.04)",
                                        color: port.demandScore >= 75 ? "#ef4444" : "rgba(255,255,255,0.28)",
                                        border: `1px solid ${port.demandScore >= 75 ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.06)"}`,
                                    }}
                                    title={`Demand index: ${port.demandScore}/100`}
                                >
                                    {port.demandScore}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Divider ── */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

                {/* ══════════════════════════════════════════
                    BROWSE STATE / PROVINCE GRID
                ═══════════════════════════════════════════ */}
                <div className="py-10" data-testid="state-grid-section">
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#F1A91B" }} />
                        <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                            Browse by State or Province
                        </h2>
                    </div>

                    {/* Country toggle — kept here so it's inside the container */}
                    <BrowseRegions2026 initialCountry={country} />
                </div>

            </div>
            {/* /container */}

            {/* ══════════════════════════════════════════
                STICKY CLAIM BAR — intentionally full width
            ═══════════════════════════════════════════ */}
            <StickyClaimBar context="root" />

        </div>
    );
}

