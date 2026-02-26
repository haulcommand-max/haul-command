"use client";

import React, { useState } from "react";
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import {
    DirectoryFilters,
    DEFAULT_FILTERS,
    EQUIPMENT_OPTIONS,
    SERVICE_TYPE_OPTIONS,
    VERIFICATION_OPTIONS,
    US_STATES,
    CORRIDORS,
    countActiveAdvancedFilters,
    type EquipmentType,
    type ServiceType,
} from "@/lib/directory/filters";

// ══════════════════════════════════════════════════════════════
// DirectoryFilterDrawer — Haul Command v5
// 10x version of GeoDirectory Advanced Search.
// Heavy-haul industry specific: equipment types, certified states,
// superload quals, service type (lead/chase/both), corridor filter.
// Slides in from right on mobile, inline panel on desktop.
// ══════════════════════════════════════════════════════════════

interface DirectoryFilterDrawerProps {
    filters: DirectoryFilters;
    onChange: (filters: DirectoryFilters) => void;
    /** Mobile: show as slide-over drawer */
    open?: boolean;
    onClose?: () => void;
    className?: string;
    /** Always show inline (no slide-over behavior) */
    inline?: boolean;
}

function SectionHeader({
    title,
    count,
    expanded,
    onToggle,
}: {
    title: string;
    count?: number;
    expanded: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between py-2 text-left"
        >
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-hc-text uppercase tracking-widest">
                    {title}
                </span>
                {count !== undefined && count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-hc-gold-500 text-hc-bg text-[9px] font-black flex items-center justify-center">
                        {count}
                    </span>
                )}
            </div>
            {expanded
                ? <ChevronUp className="w-3.5 h-3.5 text-hc-subtle" />
                : <ChevronDown className="w-3.5 h-3.5 text-hc-subtle" />
            }
        </button>
    );
}

function FilterChip({
    label,
    selected,
    gold,
    onClick,
}: {
    label: string;
    selected: boolean;
    gold?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                "border transition-all duration-150 press-feedback",
                selected && gold
                    ? "bg-hc-gold-500 border-hc-gold-500 text-hc-bg"
                    : selected
                        ? "bg-hc-success/15 border-hc-success/40 text-hc-success"
                        : "bg-hc-elevated border-hc-border text-hc-muted hover:border-hc-border-high"
            )}
        >
            {label}
        </button>
    );
}

function FilterPanel({ filters, onChange }: {
    filters: DirectoryFilters;
    onChange: (f: DirectoryFilters) => void;
}) {
    const [expandedSections, setExpandedSections] = useState({
        equipment: true,
        serviceType: true,
        states: false,
        corridors: false,
        qualifications: true,
        verification: true,
    });

    function toggle(section: keyof typeof expandedSections) {
        setExpandedSections(s => ({ ...s, [section]: !s[section] }));
    }

    function setEquipment(key: EquipmentType) {
        const current = filters.equipment;
        const next = current.includes(key)
            ? current.filter(k => k !== key)
            : [...current, key];
        onChange({ ...filters, equipment: next });
    }

    function setServiceType(key: ServiceType) {
        const current = filters.serviceType;
        const next = current.includes(key)
            ? current.filter(k => k !== key)
            : [...current, key];
        onChange({ ...filters, serviceType: next });
    }

    function toggleState(code: string) {
        const current = filters.certifiedStates;
        const next = current.includes(code)
            ? current.filter(c => c !== code)
            : [...current, code];
        onChange({ ...filters, certifiedStates: next });
    }

    function toggleCorridor(c: string) {
        const current = filters.search;
        // Corridor filter reuses text search for now — quick wins
        onChange({ ...filters, search: current === c ? "" : c });
    }

    const activeAdvanced = countActiveAdvancedFilters(filters);

    return (
        <div className="space-y-1 divide-y divide-hc-border-bare">

            {/* ── Service Type ── */}
            <div className="py-3">
                <SectionHeader
                    title="Service Type"
                    count={filters.serviceType.length}
                    expanded={expandedSections.serviceType}
                    onToggle={() => toggle("serviceType")}
                />
                <AnimatePresence initial={false}>
                    {expandedSections.serviceType && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 flex flex-wrap gap-2">
                                {SERVICE_TYPE_OPTIONS.map(opt => (
                                    <FilterChip
                                        key={opt.key}
                                        label={opt.label}
                                        selected={filters.serviceType.includes(opt.key)}
                                        onClick={() => setServiceType(opt.key)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Equipment / Gear ── */}
            <div className="py-3">
                <SectionHeader
                    title="Equipment Required"
                    count={filters.equipment.length}
                    expanded={expandedSections.equipment}
                    onToggle={() => toggle("equipment")}
                />
                <AnimatePresence initial={false}>
                    {expandedSections.equipment && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 flex flex-wrap gap-2">
                                {EQUIPMENT_OPTIONS.map(opt => (
                                    <FilterChip
                                        key={opt.key}
                                        label={`${opt.icon} ${opt.label}`}
                                        selected={filters.equipment.includes(opt.key)}
                                        gold={opt.key === "high_pole"}
                                        onClick={() => setEquipment(opt.key)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Qualifications ── */}
            <div className="py-3">
                <SectionHeader
                    title="Qualifications"
                    count={(filters.superloadQualified ? 1 : 0) + (filters.highPoleOnly ? 1 : 0)}
                    expanded={expandedSections.qualifications}
                    onToggle={() => toggle("qualifications")}
                />
                <AnimatePresence initial={false}>
                    {expandedSections.qualifications && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 space-y-2">
                                {/* Superload */}
                                <label className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-xl",
                                    "border cursor-pointer transition-all duration-150",
                                    filters.superloadQualified
                                        ? "bg-hc-gold-500/10 border-hc-gold-500/30"
                                        : "bg-hc-elevated border-hc-border"
                                )}>
                                    <div>
                                        <p className="text-[11px] font-bold text-hc-text">💪 Superload Qualified</p>
                                        <p className="text-[10px] text-hc-subtle">Extreme dimension / mega-move certified</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.superloadQualified}
                                        onChange={e => onChange({ ...filters, superloadQualified: e.target.checked })}
                                        className="w-4 h-4 accent-[#C6923A]"
                                    />
                                </label>
                                {/* High Pole only */}
                                <label className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-xl",
                                    "border cursor-pointer transition-all duration-150",
                                    filters.highPoleOnly
                                        ? "bg-hc-gold-500/10 border-hc-gold-500/30"
                                        : "bg-hc-elevated border-hc-border"
                                )}>
                                    <div>
                                        <p className="text-[11px] font-bold text-hc-text">📡 High Pole Required</p>
                                        <p className="text-[10px] text-hc-subtle">Must have telescoping height detection pole</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.highPoleOnly}
                                        onChange={e => onChange({ ...filters, highPoleOnly: e.target.checked })}
                                        className="w-4 h-4 accent-[#C6923A]"
                                    />
                                </label>
                                {/* Night Certified */}
                                <label className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-xl",
                                    "border cursor-pointer transition-all duration-150",
                                    filters.nightCertified
                                        ? "bg-hc-gold-500/10 border-hc-gold-500/30"
                                        : "bg-hc-elevated border-hc-border"
                                )}>
                                    <div>
                                        <p className="text-[11px] font-bold text-hc-text">🌙 Night Certified</p>
                                        <p className="text-[10px] text-hc-subtle">Equipped and certified for dusk-to-dawn runs</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.nightCertified}
                                        onChange={e => onChange({ ...filters, nightCertified: e.target.checked })}
                                        className="w-4 h-4 accent-[#C6923A]"
                                    />
                                </label>
                                {/* Multi-State */}
                                <label className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-xl",
                                    "border cursor-pointer transition-all duration-150",
                                    filters.multiStateCertified
                                        ? "bg-hc-gold-500/10 border-hc-gold-500/30"
                                        : "bg-hc-elevated border-hc-border"
                                )}>
                                    <div>
                                        <p className="text-[11px] font-bold text-hc-text">🗺️ Multi-State</p>
                                        <p className="text-[10px] text-hc-subtle">Certified to operate across state lines</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.multiStateCertified}
                                        onChange={e => onChange({ ...filters, multiStateCertified: e.target.checked })}
                                        className="w-4 h-4 accent-[#C6923A]"
                                    />
                                </label>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Verification Status (OSOW Haven parity) ── */}
            <div className="py-3">
                <SectionHeader
                    title="Verification Status"
                    count={[
                        filters.verifiedOnly,
                        filters.witpacCertified,
                        filters.cevoCertified,
                        filters.backgroundChecked,
                        filters.insuranceVerified,
                    ].filter(Boolean).length}
                    expanded={expandedSections.verification}
                    onToggle={() => toggle("verification")}
                />
                <AnimatePresence initial={false}>
                    {expandedSections.verification && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 space-y-2">
                                {/* Verified Only toggle */}
                                <label className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-xl",
                                    "border cursor-pointer transition-all duration-150",
                                    filters.verifiedOnly
                                        ? "bg-hc-success/10 border-hc-success/30"
                                        : "bg-hc-elevated border-hc-border"
                                )}>
                                    <div>
                                        <p className="text-[11px] font-bold text-hc-text">✅ Verified Listings Only</p>
                                        <p className="text-[10px] text-hc-subtle">Haul Command verified operators</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.verifiedOnly}
                                        onChange={e => onChange({ ...filters, verifiedOnly: e.target.checked })}
                                        className="w-4 h-4 accent-[#10b981]"
                                    />
                                </label>
                                {/* WITPAC / CEVO / Background / Insurance */}
                                {VERIFICATION_OPTIONS.map(opt => (
                                    <label key={opt.key} className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-xl",
                                        "border cursor-pointer transition-all duration-150",
                                        filters[opt.key]
                                            ? "bg-hc-elevated border-hc-border-high"
                                            : "bg-hc-elevated border-hc-border"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ background: opt.color }}
                                            />
                                            <p className="text-[11px] font-bold text-hc-text">{opt.label}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={filters[opt.key]}
                                            onChange={e => onChange({ ...filters, [opt.key]: e.target.checked })}
                                            className="w-4 h-4"
                                            style={{ accentColor: opt.color }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Certified States ── */}
            <div className="py-3">
                <SectionHeader
                    title="Certified States"
                    count={filters.certifiedStates.length}
                    expanded={expandedSections.states}
                    onToggle={() => toggle("states")}
                />
                <AnimatePresence initial={false}>
                    {expandedSections.states && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 grid grid-cols-4 gap-1.5">
                                {US_STATES.slice(0, 20).map(({ code }) => (
                                    <FilterChip
                                        key={code}
                                        label={code}
                                        selected={filters.certifiedStates.includes(code)}
                                        onClick={() => toggleState(code)}
                                    />
                                ))}
                            </div>
                            {US_STATES.length > 20 && (
                                <button
                                    type="button"
                                    onClick={() => toggle("states")}
                                    className="mt-2 text-[10px] text-hc-gold-500 font-bold uppercase tracking-widest"
                                >
                                    + {US_STATES.length - 20} more states
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Corridor Quick-Pick ── */}
            <div className="py-3">
                <SectionHeader
                    title="Corridor"
                    count={filters.search && CORRIDORS.includes(filters.search) ? 1 : 0}
                    expanded={expandedSections.corridors}
                    onToggle={() => toggle("corridors")}
                />
                <AnimatePresence initial={false}>
                    {expandedSections.corridors && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 flex flex-wrap gap-2">
                                {CORRIDORS.map(c => (
                                    <FilterChip
                                        key={c}
                                        label={c}
                                        selected={filters.search === c}
                                        gold
                                        onClick={() => toggleCorridor(c)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export function DirectoryFilterDrawer({
    filters,
    onChange,
    open = false,
    onClose,
    className,
    inline = false,
}: DirectoryFilterDrawerProps) {
    const activeCount = countActiveAdvancedFilters(filters);

    function handleReset() {
        onChange({
            ...DEFAULT_FILTERS,
            search: filters.search, // preserve text search
            availableOnly: filters.availableOnly,
            sort: filters.sort,
        });
    }

    const panel = (
        <div className={cn("space-y-2", className)}>
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-hc-gold-500" />
                    <h3 className="text-[11px] font-black text-hc-text uppercase tracking-widest">
                        Advanced Filters
                    </h3>
                    {activeCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-hc-gold-500 text-hc-bg text-[10px] font-black flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-[10px] text-hc-subtle hover:text-hc-danger font-bold uppercase tracking-widest transition-colors"
                        >
                            Reset
                        </button>
                    )}
                    {!inline && onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-hc-elevated text-hc-subtle"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <FilterPanel filters={filters} onChange={onChange} />
        </div>
    );

    if (inline) return panel;

    // Mobile slide-over drawer
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={onClose}
                    />
                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={cn(
                            "fixed right-0 top-0 bottom-0 z-50",
                            "w-80 max-w-[90vw]",
                            "bg-hc-surface border-l border-hc-border",
                            "overflow-y-auto overscroll-contain",
                            "p-5 shadow-modal"
                        )}
                    >
                        {panel}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/** Trigger button — shows on directory page next to sort chips */
export function FilterTriggerButton({
    activeCount,
    onClick,
    className,
}: {
    activeCount: number;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-xl border",
                "text-xs font-bold uppercase tracking-widest",
                "transition-all duration-150 min-h-[44px] press-feedback",
                activeCount > 0
                    ? "bg-hc-gold-500/10 border-hc-gold-500/30 text-hc-gold-500"
                    : "bg-hc-elevated border-hc-border text-hc-muted hover:border-hc-border-high"
            )}
        >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-hc-gold-500 text-hc-bg text-[9px] font-black flex items-center justify-center">
                    {activeCount}
                </span>
            )}
        </button>
    );
}

export default DirectoryFilterDrawer;
