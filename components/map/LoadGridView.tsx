"use client";

/**
 * LoadGridView — J.B. Hunt–Inspired "Go to Grid Navigation"
 *
 * A sortable, filterable table/card view of loads and escorts.
 * Renders when toggled from the map view or when a cluster is clicked.
 *
 * FEATURES:
 *  - Sort by urgency, distance, price, state
 *  - Filter bar: origin, destination, equipment, urgency
 *  - Responsive: table on desktop, stacked cards on mobile
 *  - Click any row → navigate to load detail or operator profile
 *  - Real-time count badge: "X Total Available"
 *  - Freshness timestamp: "Last Updated: ..."
 *
 * Inspired by J.B. Hunt's grid/list view, adapted for escort/pilot car ops.
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MapPin,
    Clock,
    Truck,
    Filter,
    RefreshCw,
    Eye,
    Zap,
    ChevronDown,
    Map as MapIcon,
    LayoutGrid,
    Search,
    X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoadGridItem {
    id: string;
    title: string;
    origin_city: string;
    origin_state: string;
    dest_city?: string;
    dest_state?: string;
    equipment_type?: string;
    urgency: number;
    status: "open" | "matched" | "urgent";
    distance_mi?: number;
    rate_per_mile?: number;
    posted_at?: string;
    escort_count_needed?: number;
}

type SortField = "urgency" | "origin_state" | "distance_mi" | "rate_per_mile" | "posted_at";
type SortDir = "asc" | "desc";

interface LoadGridViewProps {
    loads: LoadGridItem[];
    onLoadSelect?: (id: string) => void;
    onSwitchToMap?: () => void;
    stateFilter?: string | null;
    className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function urgencyLabel(u: number): { text: string; color: string; bg: string } {
    if (u >= 80) return { text: "URGENT", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    if (u >= 50) return { text: "FILLING FAST", color: "#f97316", bg: "rgba(249,115,22,0.12)" };
    return { text: "OPEN", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
}

function timeAgo(iso?: string): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ── Equipment type options ───────────────────────────────────────────────────

const EQUIPMENT_OPTIONS = [
    "All Equipment",
    "Pilot Car",
    "High Pole",
    "Bucket Truck",
    "Front Escort",
    "Rear Escort",
    "Multi-Vehicle",
];

const URGENCY_OPTIONS = [
    "All Urgency",
    "Urgent Only",
    "Filling Fast",
    "Open",
];

// ── Component ────────────────────────────────────────────────────────────────

export function LoadGridView({
    loads,
    onLoadSelect,
    onSwitchToMap,
    stateFilter: initialStateFilter,
    className = "",
}: LoadGridViewProps) {
    const [sortField, setSortField] = useState<SortField>("urgency");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [searchQuery, setSearchQuery] = useState("");
    const [equipFilter, setEquipFilter] = useState("All Equipment");
    const [urgencyFilter, setUrgencyFilter] = useState("All Urgency");
    const [stateFilter, setStateFilter] = useState(initialStateFilter ?? "");
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [showFilters, setShowFilters] = useState(false);

    // Refresh timestamp every 30s
    useEffect(() => {
        const interval = setInterval(() => setLastUpdated(new Date()), 30_000);
        return () => clearInterval(interval);
    }, []);

    // Toggle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir(field === "urgency" ? "desc" : "asc");
        }
    };

    // Filter and sort
    const filteredSorted = useMemo(() => {
        let result = [...loads];

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (l) =>
                    l.title.toLowerCase().includes(q) ||
                    l.origin_city.toLowerCase().includes(q) ||
                    l.origin_state.toLowerCase().includes(q) ||
                    (l.dest_city?.toLowerCase().includes(q) ?? false) ||
                    (l.dest_state?.toLowerCase().includes(q) ?? false)
            );
        }

        // State filter
        if (stateFilter) {
            result = result.filter(
                (l) => l.origin_state.toUpperCase() === stateFilter.toUpperCase()
            );
        }

        // Equipment filter
        if (equipFilter !== "All Equipment") {
            result = result.filter(
                (l) => l.equipment_type?.toLowerCase() === equipFilter.toLowerCase()
            );
        }

        // Urgency filter
        if (urgencyFilter === "Urgent Only") {
            result = result.filter((l) => l.urgency >= 80);
        } else if (urgencyFilter === "Filling Fast") {
            result = result.filter((l) => l.urgency >= 50 && l.urgency < 80);
        } else if (urgencyFilter === "Open") {
            result = result.filter((l) => l.urgency < 50);
        }

        // Sort
        result.sort((a, b) => {
            let va: number | string = 0;
            let vb: number | string = 0;
            switch (sortField) {
                case "urgency": va = a.urgency; vb = b.urgency; break;
                case "origin_state": va = a.origin_state; vb = b.origin_state; break;
                case "distance_mi": va = a.distance_mi ?? 0; vb = b.distance_mi ?? 0; break;
                case "rate_per_mile": va = a.rate_per_mile ?? 0; vb = b.rate_per_mile ?? 0; break;
                case "posted_at": va = a.posted_at ?? ""; vb = b.posted_at ?? ""; break;
            }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [loads, searchQuery, stateFilter, equipFilter, urgencyFilter, sortField, sortDir]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-white/20" />;
        return sortDir === "asc"
            ? <ArrowUp className="w-3 h-3 text-amber-400" />
            : <ArrowDown className="w-3 h-3 text-amber-400" />;
    };

    return (
        <div className={`flex flex-col h-full bg-gray-950 ${className}`}>

            {/* ── Header Bar ─────────────────────────────────────────────── */}
            <div
                className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b"
                style={{
                    background: "rgba(4,6,12,0.95)",
                    borderColor: "rgba(255,255,255,0.06)",
                }}
            >
                {/* Left: title + count */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-black text-white uppercase tracking-wider">
                            Find Escorts
                        </span>
                    </div>
                    <div
                        className="px-3 py-1 rounded-full text-xs font-black"
                        style={{
                            background: "rgba(241,169,27,0.12)",
                            color: "#F1A91B",
                            border: "1px solid rgba(241,169,27,0.2)",
                        }}
                    >
                        {filteredSorted.length} Available
                    </div>
                </div>

                {/* Right: controls */}
                <div className="flex items-center gap-2">
                    {/* Last Updated */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white/40"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <RefreshCw className="w-3 h-3 text-white/30" />
                        Last Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Toggle filters (mobile) */}
                    <button
                        onClick={() => setShowFilters((f) => !f)}
                        className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white/60"
                        style={{
                            background: showFilters ? "rgba(241,169,27,0.12)" : "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <Filter className="w-3 h-3" />
                        Filters
                    </button>

                    {/* Go to Map View */}
                    {onSwitchToMap && (
                        <button
                            onClick={onSwitchToMap}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                            style={{
                                background: "rgba(241,169,27,0.12)",
                                color: "#F1A91B",
                                border: "1px solid rgba(241,169,27,0.2)",
                            }}
                        >
                            <MapIcon className="w-3 h-3" />
                            Go to Map View
                        </button>
                    )}
                </div>
            </div>

            {/* ── Filter Bar ─────────────────────────────────────────────── */}
            <div
                className={`flex-shrink-0 px-4 py-2.5 border-b gap-2 ${showFilters ? "flex" : "hidden md:flex"} flex-wrap items-center`}
                style={{
                    background: "rgba(4,6,12,0.85)",
                    borderColor: "rgba(255,255,255,0.05)",
                }}
            >
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                    <input
                        type="text"
                        placeholder="City, State, ZIP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-8 text-xs text-white rounded-lg outline-none transition-all"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-3 h-3 text-white/30 hover:text-white/60" />
                        </button>
                    )}
                </div>

                {/* State filter */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="State..."
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value.toUpperCase().slice(0, 2))}
                        maxLength={2}
                        className="w-16 h-9 px-3 text-xs text-white text-center rounded-lg outline-none uppercase"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: stateFilter
                                ? "1px solid rgba(241,169,27,0.3)"
                                : "1px solid rgba(255,255,255,0.08)",
                        }}
                    />
                </div>

                {/* Equipment dropdown */}
                <div className="relative">
                    <select
                        value={equipFilter}
                        onChange={(e) => setEquipFilter(e.target.value)}
                        className="h-9 pl-3 pr-8 text-xs text-white/70 rounded-lg outline-none appearance-none cursor-pointer"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {EQUIPMENT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                </div>

                {/* Urgency dropdown */}
                <div className="relative">
                    <select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter(e.target.value)}
                        className="h-9 pl-3 pr-8 text-xs text-white/70 rounded-lg outline-none appearance-none cursor-pointer"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {URGENCY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
                </div>
            </div>

            {/* ── Table (Desktop) / Cards (Mobile) ───────────────────────── */}
            <div className="flex-1 overflow-y-auto">

                {/* Desktop table */}
                <table className="hidden md:table w-full">
                    <thead>
                        <tr
                            className="text-[10px] font-black uppercase tracking-wider text-white/30 border-b"
                            style={{ borderColor: "rgba(255,255,255,0.05)" }}
                        >
                            <th className="px-4 py-3 text-left">Status</th>
                            <th
                                className="px-4 py-3 text-left cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort("origin_state")}
                            >
                                <span className="flex items-center gap-1">Origin <SortIcon field="origin_state" /></span>
                            </th>
                            <th className="px-4 py-3 text-left">Destination</th>
                            <th className="px-4 py-3 text-left">Equipment</th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort("distance_mi")}
                            >
                                <span className="flex items-center justify-end gap-1">Distance <SortIcon field="distance_mi" /></span>
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort("rate_per_mile")}
                            >
                                <span className="flex items-center justify-end gap-1">Rate <SortIcon field="rate_per_mile" /></span>
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort("posted_at")}
                            >
                                <span className="flex items-center justify-end gap-1">Posted <SortIcon field="posted_at" /></span>
                            </th>
                            <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {filteredSorted.map((load, idx) => {
                                const urg = urgencyLabel(load.urgency);
                                return (
                                    <motion.tr
                                        key={load.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                                        onClick={() => onLoadSelect?.(load.id)}
                                        className="group cursor-pointer border-b transition-colors hover:bg-white/[0.02]"
                                        style={{ borderColor: "rgba(255,255,255,0.04)" }}
                                    >
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase"
                                                style={{ color: urg.color, background: urg.bg }}
                                            >
                                                {load.urgency >= 80 && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: urg.color }} />}
                                                {urg.text}
                                            </span>
                                        </td>

                                        {/* Origin */}
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-bold text-white">{load.origin_city}</div>
                                            <div className="text-[10px] text-white/40">{load.origin_state}</div>
                                        </td>

                                        {/* Destination */}
                                        <td className="px-4 py-3">
                                            {load.dest_city ? (
                                                <>
                                                    <div className="text-xs font-bold text-white">{load.dest_city}</div>
                                                    <div className="text-[10px] text-white/40">{load.dest_state}</div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-white/20">—</span>
                                            )}
                                        </td>

                                        {/* Equipment */}
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-white/60">{load.equipment_type ?? "Pilot Car"}</span>
                                        </td>

                                        {/* Distance */}
                                        <td className="px-4 py-3 text-right">
                                            {load.distance_mi ? (
                                                <span className="text-xs font-bold text-white">{load.distance_mi.toLocaleString()} mi</span>
                                            ) : (
                                                <span className="text-xs text-white/20">—</span>
                                            )}
                                        </td>

                                        {/* Rate */}
                                        <td className="px-4 py-3 text-right">
                                            {load.rate_per_mile ? (
                                                <span className="text-xs font-bold text-emerald-400">
                                                    ${load.rate_per_mile.toFixed(2)}/mi
                                                </span>
                                            ) : (
                                                <span className="text-xs text-white/20">—</span>
                                            )}
                                        </td>

                                        {/* Posted */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-xs text-white/40">{timeAgo(load.posted_at)}</span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-95"
                                                style={{
                                                    background: "rgba(241,169,27,0.15)",
                                                    color: "#F1A91B",
                                                    border: "1px solid rgba(241,169,27,0.25)",
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onLoadSelect?.(load.id);
                                                }}
                                            >
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> View
                                                </span>
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2 p-3">
                    <AnimatePresence>
                        {filteredSorted.map((load, idx) => {
                            const urg = urgencyLabel(load.urgency);
                            return (
                                <motion.div
                                    key={load.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                    onClick={() => onLoadSelect?.(load.id)}
                                    className="p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-xs font-bold text-white">{load.title}</div>
                                            <div className="text-[10px] text-white/40">
                                                {load.origin_city}, {load.origin_state}
                                                {load.dest_city && ` → ${load.dest_city}, ${load.dest_state}`}
                                            </div>
                                        </div>
                                        <span
                                            className="px-2 py-0.5 rounded text-[8px] font-black uppercase"
                                            style={{ color: urg.color, background: urg.bg }}
                                        >
                                            {urg.text}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-white/40">{load.equipment_type ?? "Pilot Car"}</span>
                                        <div className="flex items-center gap-3">
                                            {load.distance_mi && <span className="text-white/60">{load.distance_mi.toLocaleString()} mi</span>}
                                            {load.rate_per_mile && <span className="text-emerald-400 font-bold">${load.rate_per_mile.toFixed(2)}/mi</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Empty state */}
                {filteredSorted.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Truck className="w-10 h-10 text-white/10" />
                        <p className="text-sm text-white/30 font-medium">No loads match your filters</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setStateFilter("");
                                setEquipFilter("All Equipment");
                                setUrgencyFilter("All Urgency");
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-amber-400 transition-all hover:-translate-y-0.5"
                            style={{
                                background: "rgba(241,169,27,0.1)",
                                border: "1px solid rgba(241,169,27,0.2)",
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoadGridView;
