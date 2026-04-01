"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
    Antenna, Truck, ZapOff, Ship, Lightbulb,
    CheckCircle2, Filter, X
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// EquipmentFilterStrip — Haul Command
// 1-tap toggle filters for niche pilot car requirements.
// Used on Today Panel, load board top, and map pre-filter.
// ══════════════════════════════════════════════════════════════

export type EquipmentTag =
    | "high_pole"
    | "steersman"
    | "twic"
    | "amber_light"
    | "oversize_13ft"
    | "police_required"
    | "wide_load_4lane";

interface FilterDef {
    tag: EquipmentTag;
    label: string;
    abbr: string;
    icon: React.ElementType;
    tooltip: string;
}

const FILTERS: FilterDef[] = [
    {
        tag: "high_pole",
        label: "High Pole",
        abbr: "HP",
        icon: Antenna,
        tooltip: "Loads exceeding height threshold — height pole escort required",
    },
    {
        tag: "steersman",
        label: "Steersman",
        abbr: "STR",
        icon: Truck,
        tooltip: "Load requires a rear steersman / push car at destination",
    },
    {
        tag: "twic",
        label: "TWIC",
        abbr: "TWIC",
        icon: Ship,
        tooltip: "Port or secure facility — TWIC card required to escort",
    },
    {
        tag: "amber_light",
        label: "Amber Light",
        abbr: "ALB",
        icon: Lightbulb,
        tooltip: "Amber light bar compliant — state-specific requirement",
    },
    {
        tag: "oversize_13ft",
        label: "13ft+ Width",
        abbr: "13+",
        icon: ZapOff,
        tooltip: "Load exceeds 13ft — two escorts may be required depending on state",
    },
    {
        tag: "police_required",
        label: "Police Escort",
        abbr: "PD",
        icon: CheckCircle2,
        tooltip: "Route requires uniformed police escort — coordinate with county",
    },
    {
        tag: "wide_load_4lane",
        label: "4-Lane Req",
        abbr: "4LN",
        icon: Filter,
        tooltip: "Load requires minimum 4-lane highway — avoid rural 2-lane routes",
    },
];

interface EquipmentFilterStripProps {
    value: EquipmentTag[];
    onChange: (tags: EquipmentTag[]) => void;
    className?: string;
}

export function EquipmentFilterStrip({ value, onChange, className }: EquipmentFilterStripProps) {
    const toggle = (tag: EquipmentTag) => {
        onChange(
            value.includes(tag)
                ? value.filter(t => t !== tag)
                : [...value, tag]
        );
    };

    const clearAll = () => onChange([]);
    const hasActive = value.length > 0;

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-hc-muted uppercase tracking-widest">
                    Equipment Filters
                </span>
                {hasActive && (
                    <button
                        onClick={clearAll}
                        className="flex items-center gap-1 text-[10px] text-hc-subtle hover:text-hc-text transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Filter chips — horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {FILTERS.map(f => {
                    const Icon = f.icon;
                    const active = value.includes(f.tag);
                    return (
                        <button
                            key={f.tag}
                            onClick={() => toggle(f.tag)}
                            title={f.tooltip}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest shrink-0 transition-all duration-150",
                                "min-h-[40px]", // 40px touch target minimum
                                active
                                    ? "bg-hc-gold-500 border-hc-gold-500 text-hc-bg shadow-dispatch"
                                    : "bg-hc-elevated border-hc-border text-hc-muted hover:border-hc-border-high hover:text-hc-text"
                            )}
                        >
                            <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-hc-bg" : "text-hc-muted")} />
                            <span className="hidden sm:inline">{f.label}</span>
                            <span className="sm:hidden">{f.abbr}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active filter summary */}
            {hasActive && (
                <div className="text-[10px] text-hc-gold-500 font-semibold">
                    {value.length} filter{value.length !== 1 ? "s" : ""} active — showing matching loads only
                </div>
            )}
        </div>
    );
}

export default EquipmentFilterStrip;
