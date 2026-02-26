"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// EquipmentBadges — Haul Command Directory
// Visual icon-badge manifest for pilot car equipment.
// Stolen pattern from: GeoDirectory MultiRatings badge system.
// ══════════════════════════════════════════════════════════════

export interface EquipmentItem {
    key: string;
    label: string;
    icon: string;          // emoji or SVG path
    description?: string;
}

export const EQUIPMENT_MANIFEST: EquipmentItem[] = [
    {
        key: "high_pole",
        label: "High Pole",
        icon: "📡",
        description: "Telescoping high pole for overhead clearance detection",
    },
    {
        key: "cb_radio",
        label: "CB Radio",
        icon: "📻",
        description: "Citizens Band radio for corridor communication",
    },
    {
        key: "radar_gun",
        label: "Radar / Speed",
        icon: "🎯",
        description: "Speed measurement equipment for work zone compliance",
    },
    {
        key: "flags_signs",
        label: "Flags & Signs",
        icon: "🚩",
        description: "Standard OVERSIZE LOAD flags and signage package",
    },
    {
        key: "rotating_beacon",
        label: "Rotating Beacon",
        icon: "🔆",
        description: "Amber rotating or LED beacon light bar",
    },
    {
        key: "two_way_radio",
        label: "2-Way Radio",
        icon: "📡",
        description: "Licensed two-way radio for dispatch communication",
    },
    {
        key: "amber_lights",
        label: "Amber Lights",
        icon: "⚠️",
        description: "Vehicle-mounted amber warning light system",
    },
    {
        key: "lead_car",
        label: "Lead Car",
        icon: "▲",
        description: "Qualified to operate as lead pilot car",
    },
    {
        key: "chase_car",
        label: "Chase Car",
        icon: "▼",
        description: "Qualified to operate as trailing chase car",
    },
    {
        key: "steer_escort",
        label: "Steerman",
        icon: "🏗️",
        description: "Certified to operate rear steering on modular trailers",
    },
    {
        key: "night_certified",
        label: "Night Certified",
        icon: "🌙",
        description: "Equipped and certified for dusk-to-dawn runs",
    },
    {
        key: "multi_state",
        label: "Multi-State",
        icon: "🗺️",
        description: "Certified to operate across multiple state lines",
    },
    {
        key: "twic",
        label: "TWIC Card",
        icon: "💳",
        description: "Transportation Worker Identification Credential for port access",
    },
    {
        key: "police_coordination",
        label: "Police Escort",
        icon: "🚓",
        description: "Experienced in coordinating with local/state police escorts",
    },
    {
        key: "bucket_support",
        label: "Bucket Truck",
        icon: "🪜",
        description: "Bucket truck support for overhead wire lifts",
    },
    {
        key: "route_surveys",
        label: "Route Surveys",
        icon: "📏",
        description: "Pre-trip physical route constraint measurement",
    },
    {
        key: "superload",
        label: "Superload",
        icon: "💪",
        description: "Certified for superload / extreme dimension moves",
    },
    {
        key: "odsna",
        label: "ODSNA",
        icon: "✅",
        description: "Overdimensional Safety Network of America certified",
    },
    {
        key: "imsa",
        label: "IMSA",
        icon: "🏛️",
        description: "International Municipal Signal Association certified",
    },
];

const EQUIPMENT_MAP = Object.fromEntries(
    EQUIPMENT_MANIFEST.map(e => [e.key, e])
);

interface EquipmentBadgesProps {
    equipmentKeys: string[];
    /** Compact = small pill row; expanded = larger labeled cards */
    variant?: "compact" | "expanded";
    className?: string;
    /** Max number to show before a "+N more" overflow */
    maxVisible?: number;
}

export function EquipmentBadges({
    equipmentKeys,
    variant = "compact",
    className,
    maxVisible,
}: EquipmentBadgesProps) {
    if (!equipmentKeys || equipmentKeys.length === 0) {
        return (
            <span className="text-[11px] text-hc-subtle italic">No equipment listed</span>
        );
    }

    const resolved = equipmentKeys
        .map(k => EQUIPMENT_MAP[k])
        .filter(Boolean);

    const visible = maxVisible ? resolved.slice(0, maxVisible) : resolved;
    const overflow = maxVisible ? resolved.length - maxVisible : 0;

    if (variant === "expanded") {
        return (
            <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2", className)}>
                {resolved.map(item => (
                    <div
                        key={item.key}
                        className="flex items-center gap-2 px-3 py-2 bg-hc-elevated border border-hc-border-bare rounded-xl"
                        title={item.description}
                    >
                        <span className="text-base leading-none">{item.icon}</span>
                        <div>
                            <p className="text-[11px] font-bold text-hc-text uppercase tracking-widest leading-none">
                                {item.label}
                            </p>
                            {item.description && (
                                <p className="text-[10px] text-hc-subtle leading-snug mt-0.5 line-clamp-1">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Compact pill row
    return (
        <div className={cn("flex flex-wrap gap-1.5 items-center", className)}>
            {visible.map(item => (
                <span
                    key={item.key}
                    title={item.description}
                    className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-lg",
                        "bg-hc-elevated border border-hc-border-bare",
                        "text-[10px] font-bold text-hc-text uppercase tracking-widest",
                        "cursor-default",
                        // Gold highlight for high-value certs
                        (item.key === "high_pole" || item.key === "superload" || item.key === "odsna") &&
                        "bg-hc-gold-500/8 border-hc-gold-500/20 text-hc-gold-600"
                    )}
                >
                    <span className="text-xs leading-none">{item.icon}</span>
                    {item.label}
                </span>
            ))}
            {overflow > 0 && (
                <span className="text-[10px] text-hc-subtle font-semibold px-2">
                    +{overflow} more
                </span>
            )}
        </div>
    );
}

/** Inline single badge — used in card list rows */
export function EquipmentPip({
    equipmentKey,
    className,
}: {
    equipmentKey: string;
    className?: string;
}) {
    const item = EQUIPMENT_MAP[equipmentKey];
    if (!item) return null;
    return (
        <span
            title={item.label}
            className={cn(
                "inline-flex items-center justify-center w-5 h-5",
                "rounded-full bg-hc-elevated border border-hc-border-bare",
                "text-[11px] leading-none cursor-default",
                className
            )}
        >
            {item.icon}
        </span>
    );
}

export default EquipmentBadges;
