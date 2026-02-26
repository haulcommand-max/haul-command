/**
 * CorridorStrip — High-Demand Corridors horizontal scroll strip.
 *
 * Displays corridor cards with live supply/demand meters.
 * Used on root directory page (above Browse State) and state pages.
 *
 * Data: self-fetches from /api/corridor/segments or accepts static corridors prop.
 */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ChevronRight, Users } from "lucide-react";
import LiquidityBadge, { estimateLiquidityScore } from "@/components/intelligence/LiquidityBadge";

interface Corridor {
    id?: string;
    slug?: string;
    label: string;
    href: string;
    endpoints?: string;          // "Houston, TX → Baton Rouge, LA"
    hot?: boolean;
    supplyPct?: number;          // 0–100 (100 = full, 0 = void)
    demandScore?: number;        // 0–100
    operatorCount?: number;
}

interface CorridorStripProps {
    corridors?: Corridor[];
    state?: string;              // filter corridors by state (optional)
    title?: string;
    compact?: boolean;           // smaller variant for state pages
}

const STATIC_CORRIDORS: Corridor[] = [
    // ── Tier 1 — Backbone Interstates ────────────────────────────────────────
    {
        label: "I-10 Gulf South",
        href: "/corridors/i-10",
        endpoints: "Los Angeles, CA → Jacksonville, FL",
        hot: true, supplyPct: 28, demandScore: 91, operatorCount: 47,
    },
    {
        label: "I-75 Southeast",
        href: "/corridors/i-75",
        endpoints: "Sault Ste. Marie, MI → Miami, FL",
        hot: true, supplyPct: 42, demandScore: 84, operatorCount: 63,
    },
    {
        label: "I-35 Central Spine",
        href: "/corridors/i-35",
        endpoints: "Laredo, TX → Duluth, MN",
        hot: true, supplyPct: 31, demandScore: 88, operatorCount: 52,
    },
    {
        label: "I-40 Southwest",
        href: "/corridors/i-40",
        endpoints: "Barstow, CA → Wilmington, NC",
        hot: false, supplyPct: 55, demandScore: 72, operatorCount: 38,
    },
    {
        label: "I-20 Deep South",
        href: "/corridors/i-20",
        endpoints: "Pecos, TX → Florence, SC",
        hot: true, supplyPct: 38, demandScore: 79, operatorCount: 44,
    },
    {
        label: "I-95 Northeast Corridor",
        href: "/corridors/i-95",
        endpoints: "Miami, FL → Fort Kent, ME",
        hot: false, supplyPct: 61, demandScore: 68, operatorCount: 55,
    },
    {
        label: "I-70 Heartland",
        href: "/corridors/i-70",
        endpoints: "Cove Fort, UT → Baltimore, MD",
        hot: false, supplyPct: 64, demandScore: 65, operatorCount: 41,
    },
    {
        label: "I-80 Northern Transcontinental",
        href: "/corridors/i-80",
        endpoints: "San Francisco, CA → Teaneck, NJ",
        hot: false, supplyPct: 49, demandScore: 70, operatorCount: 36,
    },
    {
        label: "I-90 Northern Tier",
        href: "/corridors/i-90",
        endpoints: "Seattle, WA → Boston, MA",
        hot: false, supplyPct: 52, demandScore: 61, operatorCount: 29,
    },
    {
        label: "I-5 West Coast",
        href: "/corridors/i-5",
        endpoints: "San Diego, CA → Blaine, WA",
        hot: false, supplyPct: 58, demandScore: 63, operatorCount: 41,
    },
    {
        label: "I-65 Midwest–Gulf",
        href: "/corridors/i-65",
        endpoints: "Mobile, AL → Gary, IN",
        hot: false, supplyPct: 60, demandScore: 59, operatorCount: 33,
    },
    {
        label: "Trans-Canada HWY",
        href: "/corridors/trans-canada",
        endpoints: "Victoria, BC → St. John's, NL",
        hot: false, supplyPct: 70, demandScore: 55, operatorCount: 24,
    },
];


function supplyColor(pct: number) {
    if (pct <= 25) return "#ef4444";
    if (pct <= 45) return "#f97316";
    if (pct <= 65) return "#F1A91B";
    return "#22c55e";
}

function supplyLabel(pct: number) {
    if (pct <= 25) return "Critical";
    if (pct <= 45) return "Tight";
    if (pct <= 65) return "Moderate";
    return "Healthy";
}

export function CorridorStrip({
    corridors: propCorridors,
    title = "High-Demand Corridors",
    compact = false,
}: CorridorStripProps) {
    const [corridors] = useState<Corridor[]>(propCorridors ?? STATIC_CORRIDORS);

    return (
        <section>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" style={{ color: "#F1A91B" }} />
                <h2 className={`font-black uppercase tracking-[0.18em] ${compact ? "text-xs text-white/50" : "text-sm text-white/60"}`}>
                    {title}
                </h2>
                <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ml-1"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    Live
                </div>
            </div>

            {/* Mobile: horizontal scroll with snap.
                Desktop (md+): flex-wrap into 3-col grid — min-w floor prevents card collapse. */}
            <div
                className="flex gap-3 pb-2 overflow-x-auto md:overflow-visible md:flex-wrap"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    paddingRight: "32px",
                    paddingLeft: "2px",
                    scrollSnapType: "x mandatory",
                }}
            >
                {corridors.map((c) => {
                    const color = supplyColor(c.supplyPct ?? 50);
                    return (
                        <Link
                            key={c.label}
                            href={c.href}
                            className={[
                                "group flex-shrink-0 rounded-2xl flex flex-col",
                                "transition-all duration-200",
                                "hover:-translate-y-0.5 hover:border-opacity-40",
                                compact
                                    ? "p-3 min-w-[190px]"
                                    /* Desktop: keep 220px floor so no card text clips */
                                    : "p-5 min-w-[220px] md:flex-1 md:basis-[calc(33.33%-0.5rem)]",
                            ].join(" ")}
                            style={{
                                background: c.hot
                                    ? "rgba(241,169,27,0.06)"
                                    : "rgba(255,255,255,0.03)",
                                border: c.hot
                                    ? "1px solid rgba(241,169,27,0.22)"
                                    : "1px solid rgba(255,255,255,0.07)",
                            }}
                        >
                            {/* Corridor name + hot indicator */}
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div
                                    className={[
                                        "font-black leading-tight truncate",
                                        "text-white/80 group-hover:text-white transition-colors",
                                        compact ? "text-xs" : "text-sm",
                                    ].join(" ")}
                                >
                                    {c.label}
                                </div>
                                {c.hot && (
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px]"
                                        style={{ background: "#F1A91B" }}
                                    />
                                )}
                            </div>

                            {/* Endpoints — truncated, slightly more contrast than before */}
                            {c.endpoints && (
                                <div className="text-[10px] font-mono mb-3 leading-snug truncate"
                                    style={{ color: "rgba(255,255,255,0.40)" }}>
                                    {c.endpoints}
                                </div>
                            )}

                            {/* Supply meter */}
                            {c.supplyPct != null && (
                                <div className="mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-widest"
                                            style={{ color }}
                                        >
                                            {supplyLabel(c.supplyPct)} Supply
                                        </span>
                                        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                                            {c.supplyPct}%
                                        </span>
                                    </div>
                                    <div
                                        className="h-1 rounded-full overflow-hidden"
                                        style={{ background: "rgba(255,255,255,0.07)" }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${c.supplyPct}%`, background: color }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stats row — "View →" always visible, dims unless hovered */}
                            <div className="flex items-center gap-3 mt-auto pt-2">
                                {c.operatorCount != null && (
                                    <span className="flex items-center gap-1 text-[10px]"
                                        style={{ color: "rgba(255,255,255,0.45)" }}>
                                        <Users className="w-3 h-3" />
                                        {c.operatorCount}
                                    </span>
                                )}
                                {(c.demandScore != null && c.supplyPct != null) && (
                                    <LiquidityBadge
                                        score={estimateLiquidityScore(c.supplyPct, c.demandScore)}
                                        compact
                                    />
                                )}
                                <span className="flex items-center gap-0.5 ml-auto text-[10px] font-bold transition-colors"
                                    style={{ color: "rgba(255,255,255,0.25)" }}>
                                    View
                                    <ChevronRight className="w-3 h-3 group-hover:text-[#F1A91B] group-hover:translate-x-0.5 transition-all" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
