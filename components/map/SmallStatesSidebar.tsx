"use client";

/**
 * SmallStatesSidebar → GLOBAL COUNTRY RAIL
 *
 * Originally J.B. Hunt–inspired "Northeast Sidebar" — now upgraded
 * to cover all 52 Haul Command countries, grouped by tier (A-D).
 *
 * PURPOSE:
 *   - Surfaces ALL countries in a compact vertical rail
 *   - Shows live operator/load counts per country
 *   - Grouped by tier with visual hierarchy (gold → blue → silver → muted)
 *   - Click → pre-filters Grid View to that country
 *   - Hover → tooltip with name + count + tier badge
 *   - Collapsible to minimize map obstruction
 *
 * DATA SOURCE:
 *   - Country list: lib/strategy/country-priority.ts (52 countries)
 *   - Counts: /api/map/loads endpoint (aggregated per country)
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronLeft, ChevronRight, Crown, Star, TrendingUp } from "lucide-react";
import { HC_COUNTRIES, countryFlag, type HCCountry, type CountryTier } from "@/lib/geo/countries";

// ── Derived types ────────────────────────────────────────────────────────────

export interface CountryRailItem {
    iso2: string;
    name: string;
    tier: CountryTier;
    count: number;
}

// ── Tier visual config ──────────────────────────────────────────────────────

const TIER_CONFIG = {
    A: {
        label: "Tier A",
        color: "#F1A91B",
        bg: "rgba(241,169,27,0.12)",
        border: "rgba(241,169,27,0.25)",
        icon: Crown,
        glow: "0 0 8px rgba(241,169,27,0.25)",
    },
    B: {
        label: "Tier B",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.10)",
        border: "rgba(59,130,246,0.20)",
        icon: Star,
        glow: "0 0 6px rgba(59,130,246,0.2)",
    },
    C: {
        label: "Tier C",
        color: "#94a3b8",
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.15)",
        icon: TrendingUp,
        glow: "none",
    },
    D: {
        label: "Tier D",
        color: "#64748b",
        bg: "rgba(100,116,139,0.06)",
        border: "rgba(100,116,139,0.10)",
        icon: TrendingUp,
        glow: "none",
    },
} as const;

// ── Props ────────────────────────────────────────────────────────────────────

export interface SmallStateData {
    code: string;
    name: string;
    count: number;
    country: "US" | "CA";
}

interface SmallStatesSidebarProps {
    /** Country-level counts: key = ISO2 code, value = count */
    countryCounts?: Record<string, number>;
    /** Also accepts the old SmallStateData[] for backwards compat */
    states?: SmallStateData[];
    onCountrySelect?: (iso2: string) => void;
    /** Legacy prop — still works */
    onStateSelect?: (code: string, country: "US" | "CA") => void;
    /** Only show countries with counts > 0 when true */
    hideEmpty?: boolean;
    className?: string;
}

export function SmallStatesSidebar({
    countryCounts = {},
    states,
    onCountrySelect,
    onStateSelect,
    hideEmpty = false,
    className = "",
}: SmallStatesSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(["A", "B"]));

    // Merge counts into country data
    const countriesWithCounts = useMemo((): CountryRailItem[] => {
        return HC_COUNTRIES.map((c) => ({
            iso2: c.iso2,
            name: c.name,
            tier: c.tier,
            count: countryCounts[c.iso2] ?? 0,
        })).filter((c) => !hideEmpty || c.count > 0 || c.tier === "A");
    }, [countryCounts, hideEmpty]);

    // Group by tier
    const grouped = useMemo(() => {
        const groups: Record<string, CountryRailItem[]> = {};
        for (const c of countriesWithCounts) {
            (groups[c.tier] ??= []).push(c);
        }
        return groups;
    }, [countriesWithCounts]);

    const toggleTier = (tier: string) => {
        setExpandedTiers((prev) => {
            const next = new Set(prev);
            if (next.has(tier)) next.delete(tier);
            else next.add(tier);
            return next;
        });
    };

    const handleClick = (country: CountryRailItem) => {
        onCountrySelect?.(country.iso2);
        // Legacy backwards compat
        if (onStateSelect && (country.iso2 === "US" || country.iso2 === "CA")) {
            onStateSelect(country.iso2, country.iso2 as "US" | "CA");
        }
    };

    // Total counts
    const totalActive = countriesWithCounts.reduce((s: number, c: CountryRailItem) => s + c.count, 0);

    return (
        <div className={`absolute right-0 top-0 bottom-0 z-20 flex items-stretch pointer-events-none ${className}`}>

            {/* ── Collapse toggle ────────────────────────────────────── */}
            <button aria-label="Interactive Button"
                onClick={() => setCollapsed((c) => !c)}
                className="pointer-events-auto self-center -mr-px w-6 h-16 flex items-center justify-center rounded-l-lg transition-all hover:w-8"
                style={{
                    background: "rgba(4,6,12,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRight: "none",
                    backdropFilter: "blur(12px)",
                }}
                title={collapsed ? "Show countries" : "Hide countries"}
            >
                {collapsed
                    ? <ChevronLeft className="w-3 h-3 text-white/50" />
                    : <ChevronRight className="w-3 h-3 text-white/50" />
                }
            </button>

            {/* ── Sidebar body ───────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 84, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="pointer-events-auto overflow-hidden flex-shrink-0"
                    >
                        <div
                            className="w-[84px] h-full flex flex-col overflow-y-auto"
                            style={{
                                background: "rgba(4,6,12,0.92)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                borderLeft: "1px solid rgba(255,255,255,0.06)",
                                scrollbarWidth: "none",
                            }}
                        >
                            {/* Header */}
                            <div className="flex flex-col items-center pt-3 pb-2 border-b border-white/5 px-1">
                                <Globe className="w-3.5 h-3.5 text-amber-400/70 mb-1" />
                                <span className="text-[7px] font-black text-white/30 uppercase tracking-wider">
                                    Global
                                </span>
                                {totalActive > 0 && (
                                    <span
                                        className="mt-1 px-2 py-0.5 rounded-full text-[8px] font-black"
                                        style={{ background: "rgba(241,169,27,0.15)", color: "#F1A91B" }}
                                    >
                                        {totalActive.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Tier groups */}
                            {(["A", "B", "C", "D"] as const).map((tier) => {
                                const tierCountries = grouped[tier];
                                if (!tierCountries?.length) return null;
                                const config = TIER_CONFIG[tier];
                                const TierIcon = config.icon;
                                const isExpanded = expandedTiers.has(tier);
                                const tierTotal = tierCountries.reduce((s: number, c: CountryRailItem) => s + c.count, 0);

                                return (
                                    <div key={tier} className="border-b border-white/5">
                                        {/* Tier header */}
                                        <button aria-label="Interactive Button"
                                            onClick={() => toggleTier(tier)}
                                            className="w-full flex items-center justify-between px-2 py-2 transition-colors hover:bg-white/[0.03]"
                                        >
                                            <div className="flex items-center gap-1">
                                                <TierIcon
                                                    className="w-2.5 h-2.5 flex-shrink-0"
                                                    style={{ color: config.color }}
                                                />
                                                <span
                                                    className="text-[8px] font-black uppercase tracking-wider"
                                                    style={{ color: config.color }}
                                                >
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {tierTotal > 0 && (
                                                    <span
                                                        className="text-[8px] font-bold"
                                                        style={{ color: config.color }}
                                                    >
                                                        {tierTotal}
                                                    </span>
                                                )}
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 0 : -90 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <ChevronLeft className="w-2.5 h-2.5 text-white/20 rotate-[-90deg]" />
                                                </motion.div>
                                            </div>
                                        </button>

                                        {/* Country chips */}
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="flex flex-col items-center gap-0.5 pb-2 px-1">
                                                        {tierCountries.map((country: CountryRailItem, idx: number) => (
                                                            <motion.button
                                                                key={country.iso2}
                                                                initial={{ opacity: 0, x: 12 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: idx * 0.02 }}
                                                                onClick={() => handleClick(country)}
                                                                onMouseEnter={() => setHoveredCountry(country.iso2)}
                                                                onMouseLeave={() => setHoveredCountry(null)}
                                                                className="group relative w-[74px] flex items-center justify-between px-1.5 py-1 rounded-lg transition-all"
                                                                style={{
                                                                    background: hoveredCountry === country.iso2
                                                                        ? config.bg
                                                                        : "rgba(255,255,255,0.02)",
                                                                    border: hoveredCountry === country.iso2
                                                                        ? `1px solid ${config.border}`
                                                                        : "1px solid transparent",
                                                                }}
                                                            >
                                                                {/* Flag + ISO code */}
                                                                <div className="flex items-center gap-1 min-w-0">
                                                                    <span className="text-[10px] leading-none flex-shrink-0">
                                                                        {countryFlag(country.iso2)}
                                                                    </span>
                                                                    <span
                                                                        className="text-[9px] font-black uppercase tracking-wider truncate transition-colors"
                                                                        style={{
                                                                            color: hoveredCountry === country.iso2
                                                                                ? config.color
                                                                                : "rgba(255,255,255,0.45)",
                                                                        }}
                                                                    >
                                                                        {country.iso2}
                                                                    </span>
                                                                </div>

                                                                {/* Count badge */}
                                                                <span
                                                                    className="min-w-[18px] h-[16px] flex items-center justify-center rounded-full text-[8px] font-black flex-shrink-0"
                                                                    style={{
                                                                        background: country.count > 0
                                                                            ? hoveredCountry === country.iso2
                                                                                ? config.color
                                                                                : `${config.color}25`
                                                                            : "rgba(255,255,255,0.04)",
                                                                        color: country.count > 0
                                                                            ? hoveredCountry === country.iso2
                                                                                ? "#000"
                                                                                : config.color
                                                                            : "rgba(255,255,255,0.2)",
                                                                    }}
                                                                >
                                                                    {country.count}
                                                                </span>

                                                                {/* Tooltip */}
                                                                {hoveredCountry === country.iso2 && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, x: 8 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg whitespace-nowrap z-50"
                                                                        style={{
                                                                            background: "rgba(4,6,12,0.96)",
                                                                            border: `1px solid ${config.border}`,
                                                                            backdropFilter: "blur(16px)",
                                                                            boxShadow: config.glow,
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm">{countryFlag(country.iso2)}</span>
                                                                            <span className="text-[11px] font-bold text-white">
                                                                                {country.name}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                                                                                style={{ background: config.bg, color: config.color }}
                                                                            >
                                                                                {config.label}
                                                                            </span>
                                                                            <span className="text-[9px] text-white/40">
                                                                                {country.count} active
                                                                            </span>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}

                            {/* Bottom spacer */}
                            <div className="flex-1" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SmallStatesSidebar;
