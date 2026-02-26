/**
 * DirectorySortControls — Sort mode selector for operator listings.
 *
 * Gives users four sort modes that surface competitive intelligence
 * unavailable on generic directories (Angi, Nextdoor, YellowPages).
 *
 * Sort modes:
 *   fastest_response    — operators who reply fastest (response_time_min)
 *   highest_trust       — trust score (reliability + reviews + jobs)
 *   best_corridor_fit   — operator specializations vs. current corridor
 *   closest_available   — geo-distance from broker origin (requires coords)
 */
"use client";

import React from "react";
import { Zap, Shield, Route, MapPin } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortMode =
    | "fastest_response"
    | "highest_trust"
    | "best_corridor_fit"
    | "closest_available";

export interface DirectorySortControlsProps {
    value: SortMode;
    onChange: (mode: SortMode) => void;
    /** Hide "best corridor fit" if no corridor context is available */
    hasCorridor?: boolean;
    /** Hide "closest available" if geolocation isn't available */
    hasLocation?: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────────────

interface SortOption {
    value: SortMode;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
    description: string;
    requiresCorridor?: boolean;
    requiresLocation?: boolean;
}

const SORT_OPTIONS: SortOption[] = [
    {
        value: "fastest_response",
        label: "Fastest Response",
        shortLabel: "Fastest",
        icon: Zap,
        description: "Operators with the shortest avg. response time.",
    },
    {
        value: "highest_trust",
        label: "Highest Trust",
        shortLabel: "Trust",
        icon: Shield,
        description: "Ranked by on-time rate, jobs completed, and reviews.",
    },
    {
        value: "best_corridor_fit",
        label: "Best Corridor Fit",
        shortLabel: "Best Fit",
        icon: Route,
        description: "Operators most specialized for this corridor.",
        requiresCorridor: true,
    },
    {
        value: "closest_available",
        label: "Closest Available",
        shortLabel: "Closest",
        icon: MapPin,
        description: "Nearest operators with availability updated recently.",
        requiresLocation: true,
    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DirectorySortControls({
    value,
    onChange,
    hasCorridor = false,
    hasLocation = false,
}: DirectorySortControlsProps) {
    const visibleOptions = SORT_OPTIONS.filter(o => {
        if (o.requiresCorridor && !hasCorridor) return false;
        if (o.requiresLocation && !hasLocation) return false;
        return true;
    });

    return (
        <div
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
            role="group"
            aria-label="Sort operators by"
        >
            {/* Label */}
            <span
                className="text-[10px] font-black uppercase tracking-widest flex-shrink-0 mr-1"
                style={{ color: "rgba(255,255,255,0.2)" }}
            >
                Sort
            </span>

            {visibleOptions.map(opt => {
                const isActive = opt.value === value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        title={opt.description}
                        aria-pressed={isActive}
                        aria-label={opt.label}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
                        style={{
                            background: isActive ? "rgba(241,169,27,0.10)" : "rgba(255,255,255,0.04)",
                            border: isActive ? "1px solid rgba(241,169,27,0.30)" : "1px solid rgba(255,255,255,0.07)",
                            color: isActive ? "#F1A91B" : "rgba(255,255,255,0.45)",
                            boxShadow: isActive ? "0 0 12px rgba(241,169,27,0.10)" : "none",
                        }}
                        onMouseEnter={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isActive) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                            }
                        }}
                    >
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="hidden sm:inline">{opt.label}</span>
                        <span className="sm:hidden">{opt.shortLabel}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ── Sort logic — use on server or client to reorder operators ─────────────────

export type OperatorForSort = {
    id: string;
    responseTimeMin?: number;
    trustScore?: number;
    corridorSpecializations?: string[];
    distanceMiles?: number;
    isAvailable?: boolean;
};

export function sortOperators(
    operators: OperatorForSort[],
    mode: SortMode,
    activeCorridor?: string
): OperatorForSort[] {
    const sorted = [...operators];
    switch (mode) {
        case "fastest_response":
            return sorted.sort((a, b) =>
                (a.responseTimeMin ?? 9999) - (b.responseTimeMin ?? 9999));

        case "highest_trust":
            return sorted.sort((a, b) =>
                (b.trustScore ?? 0) - (a.trustScore ?? 0));

        case "best_corridor_fit":
            return sorted.sort((a, b) => {
                const aFit = activeCorridor && a.corridorSpecializations?.includes(activeCorridor) ? 1 : 0;
                const bFit = activeCorridor && b.corridorSpecializations?.includes(activeCorridor) ? 1 : 0;
                return bFit - aFit || (b.trustScore ?? 0) - (a.trustScore ?? 0);
            });

        case "closest_available":
            return sorted.sort((a, b) => {
                // Available operators first, then by distance
                const aScore = (a.isAvailable ? 0 : 10000) + (a.distanceMiles ?? 9999);
                const bScore = (b.isAvailable ? 0 : 10000) + (b.distanceMiles ?? 9999);
                return aScore - bScore;
            });

        default:
            return sorted;
    }
}
