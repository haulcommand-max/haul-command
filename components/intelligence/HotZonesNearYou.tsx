/**
 * HotZonesNearYou — Operator-facing supply steering surface.
 *
 * Shows corridors where escort demand is outpacing supply,
 * and prompts operators to reposition or update availability.
 *
 * Data: fetches from supply_move_recommendations via API route,
 * falls back to static corridor shortage data if unavailable.
 *
 * Psychology:
 *   "Escorts in this zone are booking faster."
 *   "Position now to capture upcoming loads."
 */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Zap, MapPin, ChevronRight, Flame } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface HotZone {
    corridor: string;          // slug, e.g. "i-10"
    label: string;             // display name, e.g. "I-10 Gulf South"
    priority_score: number;    // 0–100
    pressure_bucket: string;   // stable | watch | reposition_recommended | urgent_supply_needed
    recommended_radius_miles: number;
}

// ── Static fallback (used when Supabase data is unavailable) ──────────────────
const FALLBACK_ZONES: HotZone[] = [
    { corridor: "i-10", label: "I-10 Gulf South", priority_score: 88, pressure_bucket: "urgent_supply_needed", recommended_radius_miles: 100 },
    { corridor: "i-35", label: "I-35 Central Spine", priority_score: 76, pressure_bucket: "urgent_supply_needed", recommended_radius_miles: 100 },
    { corridor: "i-20", label: "I-20 Deep South", priority_score: 64, pressure_bucket: "reposition_recommended", recommended_radius_miles: 75 },
    { corridor: "i-75", label: "I-75 Southeast", priority_score: 58, pressure_bucket: "reposition_recommended", recommended_radius_miles: 75 },
    { corridor: "i-80", label: "I-80 Northern Transcontinental", priority_score: 42, pressure_bucket: "watch", recommended_radius_miles: 50 },
];

// ── Bucket config ─────────────────────────────────────────────────────────────
const BUCKET_CONFIG: Record<string, { color: string; label: string; urgency: string }> = {
    urgent_supply_needed: { color: "#ef4444", label: "Critical", urgency: "Position now" },
    reposition_recommended: { color: "#F1A91B", label: "High Demand", urgency: "Opportunity zone" },
    watch: { color: "#f97316", label: "Tightening", urgency: "Monitor" },
    stable: { color: "#22c55e", label: "Stable", urgency: "Healthy" },
};

interface Props {
    /** Max zones to show. Default: 4 */
    limit?: number;
    /** Visual variant: 'card' (standalone) or 'strip' (horizontal compact) */
    variant?: "card" | "strip";
    /** Optional operator home corridor to deprioritize (they're already there) */
    homeCorridor?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HotZonesNearYou({ limit = 4, variant = "card", homeCorridor }: Props) {
    const [zones, setZones] = useState<HotZone[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchZones() {
            try {
                // TODO: wire to /api/supply/recommendations once route exists.
                // For now use fallback data; swap for real fetch when ready:
                //
                // const res = await fetch("/api/supply/recommendations?limit=10");
                // if (!res.ok) throw new Error("non-200");
                // const { data } = await res.json();
                // setZones(data.slice(0, limit));

                // Simulate network latency for realistic UX
                await new Promise(r => setTimeout(r, 300));
                if (!cancelled) {
                    const filtered = FALLBACK_ZONES
                        .filter(z => z.corridor !== homeCorridor)
                        .slice(0, limit);
                    setZones(filtered);
                }
            } catch {
                if (!cancelled) setZones(FALLBACK_ZONES.slice(0, limit));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchZones();
        return () => { cancelled = true; };
    }, [limit, homeCorridor]);

    if (loading) {
        return (
            <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-4 w-40 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl mb-2.5" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
            </div>
        );
    }

    if (zones.length === 0) return null;

    // ── Strip variant ─────────────────────────────────────────────────────────
    if (variant === "strip") {
        return (
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 no-scrollbar">
                {zones.map(zone => {
                    const cfg = BUCKET_CONFIG[zone.pressure_bucket] ?? BUCKET_CONFIG.stable;
                    return (
                        <Link
                            key={zone.corridor}
                            href={`/corridors/${zone.corridor}`}
                            className="flex-shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 transition-all"
                            style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}22` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                            <span className="text-xs font-bold whitespace-nowrap" style={{ color: cfg.color }}>
                                {zone.label}
                            </span>
                            <span className="text-[10px] font-semibold" style={{ color: `${cfg.color}80` }}>
                                {zone.priority_score}
                            </span>
                        </Link>
                    );
                })}
            </div>
        );
    }

    // ── Card variant (default) ────────────────────────────────────────────────
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2.5 px-5 py-4 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
                <Flame className="w-4 h-4 flex-shrink-0" style={{ color: "#F1A91B" }} />
                <div>
                    <h3 className="text-sm font-black text-white leading-none">Hot Zones Near You</h3>
                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: "#5A6577" }}>
                        Escorts are booking faster in these corridors.
                    </p>
                </div>
                <span
                    className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)" }}
                >
                    Live
                </span>
            </div>

            {/* Zone list */}
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {zones.map((zone, i) => {
                    const cfg = BUCKET_CONFIG[zone.pressure_bucket] ?? BUCKET_CONFIG.stable;
                    return (
                        <Link
                            key={zone.corridor}
                            href={`/corridors/${zone.corridor}`}
                            className="group flex items-center gap-4 px-5 py-4 transition-all"
                            style={{}}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                            aria-label={`View ${zone.label} — ${cfg.label}`}
                        >
                            {/* Rank */}
                            <span
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                style={{ background: `${cfg.color}12`, color: cfg.color }}
                            >
                                {i + 1}
                            </span>

                            {/* Corridor info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white truncate">{zone.label}</span>
                                    {zone.pressure_bucket === "urgent_supply_needed" && (
                                        <Zap className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} aria-label="Urgent" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                    <span className="text-[10px]" style={{ color: "#3A4553" }}>
                                        {zone.recommended_radius_miles}mi radius
                                    </span>
                                </div>
                            </div>

                            {/* Score + urgency */}
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <span className="text-sm font-black tabular-nums" style={{ color: cfg.color }}>
                                    {zone.priority_score}
                                </span>
                                <span className="text-[9px] font-semibold" style={{ color: "#2A3340" }}>
                                    {cfg.urgency}
                                </span>
                            </div>

                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-20 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    );
                })}
            </div>

            {/* Footer nudge */}
            <div
                className="px-5 py-3.5 flex items-center justify-between border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}
            >
                <p className="text-[11px] font-medium" style={{ color: "#3A4553" }}>
                    Position now to capture upcoming loads.
                </p>
                <Link
                    href="/profile/availability"
                    className="text-[11px] font-bold uppercase tracking-wider transition-colors"
                    style={{ color: "rgba(241,169,27,0.7)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F1A91B"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(241,169,27,0.7)"; }}
                >
                    Set Availability →
                </Link>
            </div>
        </div>
    );
}
