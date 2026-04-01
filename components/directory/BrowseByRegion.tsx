/**
 * BrowseByRegion — Elite 2026 intelligence tiles
 *
 * Features:
 * - US + Canada tab toggle
 * - Instant search (name or state code)
 * - Density signals (High / Medium / Thin / Coming Soon)
 * - HOT corridor badge on top corridors
 * - Micro-stats strip above grid
 * - Hover lift animation, gold border on hover
 * - Claim CTA (desktop + mobile)
 */
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Globe, Search, Zap } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const US: [string, string][] = [
    ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
    ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"],
    ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
    ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
    ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
    ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
    ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
    ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
    ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
    ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const CA: [string, string][] = [
    ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"],
    ["NL", "Newfoundland & Labrador"], ["NS", "Nova Scotia"], ["NT", "Northwest Territories"],
    ["NU", "Nunavut"], ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"],
    ["SK", "Saskatchewan"], ["YT", "Yukon"],
];

// Simulated density until real-time counts pipe through
// Format: region_code → { count, signal }
const DENSITY: Record<string, { count: number; signal: "high" | "medium" | "thin" | "soon" }> = {
    TX: { count: 47, signal: "high" }, FL: { count: 38, signal: "high" },
    CA: { count: 31, signal: "high" }, GA: { count: 24, signal: "high" },
    LA: { count: 22, signal: "high" }, TN: { count: 18, signal: "medium" },
    AL: { count: 16, signal: "medium" }, MS: { count: 14, signal: "medium" },
    NC: { count: 13, signal: "medium" }, OH: { count: 12, signal: "medium" },
    PA: { count: 11, signal: "medium" }, AZ: { count: 10, signal: "medium" },
    IL: { count: 9, signal: "medium" }, OK: { count: 8, signal: "medium" },
    SC: { count: 7, signal: "medium" }, CO: { count: 6, signal: "thin" },
    WA: { count: 6, signal: "thin" }, NY: { count: 5, signal: "thin" },
    VA: { count: 5, signal: "thin" }, AR: { count: 4, signal: "thin" },
    AB: { count: 12, signal: "medium" }, ON: { count: 9, signal: "medium" },
    BC: { count: 7, signal: "medium" }, SK: { count: 4, signal: "thin" },
};

const HOT = new Set(["TX", "FL", "LA", "GA", "CA", "TN", "AL", "MS", "AB", "ON"]);

const SIGNAL_CONFIG = {
    high: { dot: "#22c55e", label: "High Coverage", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.18)" },
    medium: { dot: "#F1A91B", label: "Medium Coverage", bg: "rgba(241,169,27,0.06)", border: "rgba(241,169,27,0.15)" },
    thin: { dot: "#f97316", label: "Thin Coverage", bg: "rgba(249,115,22,0.05)", border: "rgba(249,115,22,0.12)" },
    soon: { dot: "#4b5563", label: "Coming Soon", bg: "rgba(75,85,99,0.04)", border: "rgba(75,85,99,0.1)" },
};

// ── Tile ─────────────────────────────────────────────────────────────────────

function RegionTile({ code, name, href, hot }: { code: string; name: string; href: string; hot: boolean }) {
    const density = DENSITY[code] ?? { count: 0, signal: "soon" as const };
    const sig = SIGNAL_CONFIG[density.signal];

    return (
        <Link
            href={href}
            className="group relative flex flex-col gap-2 rounded-2xl p-3 transition-all duration-150"
            style={{
                background: sig.bg,
                border: `1px solid ${sig.border}`,
                transform: "translateY(0)",
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.borderColor = "rgba(241,169,27,0.5)";
                el.style.boxShadow = "0 8px 24px rgba(241,169,27,0.08)";
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.borderColor = sig.border;
                el.style.boxShadow = "none";
            }}
        >
            {/* Top row: code + HOT */}
            <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-black text-white/30 font-mono tracking-wider">{code}</span>
                {hot && (
                    <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest"
                        style={{ color: "#F1A91B" }}>
                        <Zap className="w-2.5 h-2.5" />HOT
                    </span>
                )}
            </div>

            {/* Name */}
            <div className="text-sm font-semibold text-white/70 group-hover:text-white truncate leading-tight transition-colors">
                {name}
            </div>

            {/* Density signal */}
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sig.dot }} />
                <span className="text-[9px] font-bold text-white/30 truncate">
                    {density.count > 0 ? `${density.count} operators` : sig.label}
                </span>
            </div>
        </Link>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BrowseByRegion({ className = "" }: { className?: string }) {
    const [tab, setTab] = useState<"us" | "ca">("us");
    const [query, setQuery] = useState("");

    const baseItems = tab === "us" ? US : CA;
    const base = tab === "us" ? "/directory/us" : "/directory/ca";

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return baseItems;
        return baseItems.filter(
            ([code, name]) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q)
        );
    }, [baseItems, query]);

    const totalOperators = Object.values(DENSITY).reduce((a, b) => a + b.count, 0);
    const highCoverage = Object.values(DENSITY).filter(d => d.signal === "high").length;

    return (
        <section className={`rounded-2xl p-5 ${className}`} style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.06)",
        }}>

            {/* ── Micro-stats strip ── */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-5 pb-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                    { label: "US States", value: "50" },
                    { label: "CA Provinces", value: "13" },
                    { label: "Operators", value: totalOperators.toString() },
                    { label: "High-Coverage Zones", value: highCoverage.toString() },
                ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                        <span className="text-base font-black text-white">{s.value}</span>
                        <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">{s.label}</span>
                    </div>
                ))}

                {/* Spacer + Claim CTA */}
                <div className="ml-auto hidden sm:block">
                    <Link href="/claim"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.03]"
                        style={{ background: "#F1A91B" }}>
                        Claim Profile →
                    </Link>
                </div>
            </div>

            {/* ── Header row ── */}
            <div className="flex items-center gap-3 mb-4">
                <Globe className="w-4 h-4 text-[#F1A91B] flex-shrink-0" />
                <div>
                    <div className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em]">Browse</div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">States + Provinces</h2>
                </div>

                {/* Tab toggle */}
                <div className="flex gap-1.5 ml-auto">
                    {(["us", "ca"] as const).map(t => (
                        <button key={t} onClick={() => { setTab(t); setQuery(""); }}
                            className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                            style={{
                                background: tab === t ? "#F1A91B" : "rgba(255,255,255,0.05)",
                                color: tab === t ? "#000" : "rgba(255,255,255,0.35)",
                                border: "1px solid " + (tab === t ? "transparent" : "rgba(255,255,255,0.08)"),
                            }}>
                            {t === "us" ? "🇺🇸 US" : "🇨🇦 CA"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Search ── */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={tab === "us" ? "Search state or code (FL, Texas…)" : "Search province or code (ON, Alberta…)"}
                    className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:ring-1"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        // @ts-ignore
                        "--tw-ring-color": "rgba(241,169,27,0.3)",
                    }}
                />
                {query && (
                    <button onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 text-xs">
                        ✕
                    </button>
                )}
            </div>

            {/* ── Tile grid ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-8 text-white/25 text-sm">
                    No regions match "{query}"
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {filtered.map(([code, name]) => (
                        <RegionTile
                            key={code}
                            code={code}
                            name={name}
                            href={`${base}/${code.toLowerCase()}`}
                            hot={HOT.has(code)}
                        />
                    ))}
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {Object.entries(SIGNAL_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        <span className="text-[9px] text-white/25 uppercase tracking-widest font-bold">{cfg.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Mobile claim CTA ── */}
            <div className="mt-4 sm:hidden">
                <Link href="/claim"
                    className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black"
                    style={{ background: "#F1A91B" }}>
                    Claim Your Profile →
                </Link>
            </div>
        </section>
    );
}
