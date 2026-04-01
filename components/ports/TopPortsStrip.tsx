"use client";

// TopPortsStrip — Directory page component
// Shows top 10 ports by demand_score with sponsored pin badges.
// Slot: adgrid_directory_top_ports_sponsor — fires impression on mount.

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Anchor, Star } from "lucide-react";

export interface TopPortEntry {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    demandScore: number;
    twicRequired: boolean;
    isSponsored?: boolean;
}

export interface TopPortsStripProps {
    ports: TopPortEntry[];
    sessionId?: string;
}

export function TopPortsStrip({ ports, sessionId }: TopPortsStripProps) {
    const impressionFired = useRef(false);

    useEffect(() => {
        if (!impressionFired.current && ports.length > 0) {
            impressionFired.current = true;
            fetch("/api/adgrid/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slot_id: "adgrid_directory_top_ports_sponsor",
                    event_type: "impression",
                    entity_type: "port",
                    session_id: sessionId,
                    meta: { port_count: ports.length, sponsored: ports.filter((p) => p.isSponsored).length },
                }),
            }).catch(() => { });
        }
    }, [ports.length, sessionId]);

    if (ports.length === 0) return null;

    function handleClick(port: TopPortEntry) {
        fetch("/api/adgrid/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slot_id: "adgrid_directory_top_ports_sponsor",
                event_type: "click",
                entity_type: "port",
                entity_id: port.id,
                session_id: sessionId,
                meta: { port_slug: port.slug, is_sponsored: port.isSponsored },
            }),
        }).catch(() => { });
    }

    // Sponsored ports float to top
    const sorted = [...ports].sort((a, b) => {
        if (a.isSponsored && !b.isSponsored) return -1;
        if (!a.isSponsored && b.isSponsored) return 1;
        return b.demandScore - a.demandScore;
    });

    return (
        <section className="py-10">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#F1A91B" }} />
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                    Top Ports
                </h2>
                <Link
                    href="/directory#all-ports"
                    className="ml-auto text-[10px] font-semibold text-white/25 hover:text-white/60 transition-colors"
                >
                    Browse all ports →
                </Link>
            </div>

            {/* Horizontal scroll strip */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                {sorted.slice(0, 10).map((port) => (
                    <Link
                        key={port.id}
                        href={`/ports/${port.slug}`}
                        onClick={() => handleClick(port)}
                        className="group relative snap-start flex-shrink-0 w-40 rounded-2xl border transition-all"
                        style={{
                            background: port.isSponsored
                                ? "rgba(241,169,27,0.05)"
                                : "rgba(255,255,255,0.025)",
                            borderColor: port.isSponsored
                                ? "rgba(241,169,27,0.2)"
                                : "rgba(255,255,255,0.07)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(241,169,27,0.35)";
                            e.currentTarget.style.background = "rgba(241,169,27,0.07)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = port.isSponsored
                                ? "rgba(241,169,27,0.2)"
                                : "rgba(255,255,255,0.07)";
                            e.currentTarget.style.background = port.isSponsored
                                ? "rgba(241,169,27,0.05)"
                                : "rgba(255,255,255,0.025)";
                        }}
                    >
                        <div className="p-4">
                            {/* Sponsored badge */}
                            {port.isSponsored && (
                                <div className="flex items-center gap-1 mb-2">
                                    <Star className="w-2.5 h-2.5 text-amber-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                        Sponsored
                                    </span>
                                </div>
                            )}

                            {/* Port icon */}
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                                style={{
                                    background: "rgba(241,169,27,0.08)",
                                    border: "1px solid rgba(241,169,27,0.15)",
                                }}
                            >
                                <Anchor className="w-4 h-4" style={{ color: "#F1A91B" }} />
                            </div>

                            {/* Port name */}
                            <div className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
                                {port.name}
                            </div>
                            <div className="text-[10px] text-white/35">{port.city}, {port.state}</div>

                            {/* Demand score + TWIC */}
                            <div className="flex items-center gap-1.5 mt-3">
                                <div
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background: port.demandScore >= 80
                                            ? "rgba(239,68,68,0.12)"
                                            : port.demandScore >= 65
                                                ? "rgba(241,169,27,0.12)"
                                                : "rgba(34,197,94,0.12)",
                                        color: port.demandScore >= 80
                                            ? "#ef4444"
                                            : port.demandScore >= 65
                                                ? "#F1A91B"
                                                : "#22c55e",
                                    }}
                                >
                                    {port.demandScore}
                                </div>
                                {port.twicRequired && (
                                    <span className="text-[9px] text-blue-400/60">TWIC</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Advertise slot */}
                <div className="snap-start flex-shrink-0 w-36 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-4 text-center">
                    <Star className="w-5 h-5 text-amber-400/30 mb-2" />
                    <p className="text-[10px] text-white/25 leading-snug">
                        Sponsor a port slot
                    </p>
                    <p className="text-[9px] text-white/15 mt-1">from $199/mo</p>
                </div>
            </div>
        </section>
    );
}
