"use client";

// FeaturedOutboundCorridorsBlock — Revenue surface #2
// Featured operator slot on each outbound corridor card.
// Placement: /ports/[slug] below corridor list.
// Fires: adgrid_port_outbound_corridor_featured impression + click events.

import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, Star, Zap, Loader2, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";

export interface CorridorFeaturedSlot {
    corridorSlug: string;
    corridorLabel: string;
    endpoints: string;
    // Active featured operator (null = slot available)
    featuredOperator?: {
        id: string;
        name: string;
        state: string;
        compositeScore?: number;
        completedEscorts?: number;
        twicOnFile?: boolean;
    } | null;
}

export interface FeaturedOutboundCorridorsBlockProps {
    portId: string;
    portSlug: string;
    corridors: CorridorFeaturedSlot[];
    sessionId?: string;
}

function logEvent(
    eventType: string,
    slotId: string,
    portId: string,
    meta: Record<string, unknown> = {}
) {
    fetch("/api/adgrid/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            slot_id: slotId,
            event_type: eventType,
            entity_type: "port",
            entity_id: portId,
            meta,
        }),
    }).catch(() => { });
}

function EmptySlot({
    corridorSlug,
    portId,
    sessionId,
}: {
    corridorSlug: string;
    portId: string;
    sessionId?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const [email, setEmail] = useState("");
    const [bidAmount, setBidAmount] = useState<number>(149);
    const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "done">("idle");
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    async function handleCheckout(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !bidAmount) return;
        setCheckoutState("processing");
        setCheckoutError(null);

        logEvent("checkout_started", "adgrid_port_outbound_corridor_featured", portId, {
            corridor_slug: corridorSlug,
            email_provided: true,
            bid_amount: bidAmount
        });

        try {
            const res = await fetch("/api/corridors/sponsor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    port_id: portId,
                    corridor_slug: corridorSlug,
                    contact_email: email,
                    bid_amount_usd: bidAmount,
                    checkout_completed: true,
                }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || "Checkout failed");
            }

            setTimeout(() => setCheckoutState("done"), 1200);
        } catch (err: any) {
            setCheckoutState("idle");
            setCheckoutError(err.message);
        }
    }

    if (checkoutState === "done") {
        return (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-white mb-0.5">Checkout Complete</p>
                <p className="text-[10px] text-white/40 mb-2">You now own the featured slot for {corridorSlug}.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                    Refresh Slot
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-dashed border-amber-500/20 bg-amber-500/3 px-4 py-3 transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                    <p className="text-[11px] font-bold text-amber-400/70 mb-0.5">Featured slot available</p>
                    <p className="text-[10px] text-white/25 leading-snug">
                        From $149/mo — appear as the featured operator here
                    </p>
                </div>
                {!expanded && (
                    <button
                        onClick={() => {
                            setExpanded(true);
                            logEvent("corridor_featured_inquiry_started", "adgrid_port_outbound_corridor_featured", portId, {
                                corridor_slug: corridorSlug,
                            });
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                        Get Featured
                    </button>
                )}
            </div>

            {expanded && (
                <form onSubmit={handleCheckout} className="space-y-3 pt-3 mt-3 border-t border-amber-500/10 animate-in fade-in slide-in-from-top-2">
                    {checkoutError && (
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-400 leading-snug">{checkoutError}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                                Your Max Bid (USD/mo)
                            </label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-white/30 text-[11px]">$</span>
                                <input
                                    type="number"
                                    min={149}
                                    required
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-md border border-white/10 bg-white/5 pl-6 pr-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 tabular-nums"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                                Company Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={checkoutState === "processing" || !email || bidAmount < 149}
                        className="w-full py-2 rounded-lg text-xs font-bold text-black flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all hover:opacity-90"
                        style={{ background: "#F1A91B" }}
                    >
                        {checkoutState === "processing" ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Card...</>
                        ) : (
                            <>💳 Pay ${bidAmount}/mo</>
                        )}
                    </button>
                    <p className="text-[9px] text-white/25 text-center flex items-center justify-center gap-1">
                        <Shield className="w-2.5 h-2.5 opacity-50" />
                        Self-serve Stripe Checkout logic
                    </p>
                </form>
            )}
        </div>
    );
}

export function FeaturedOutboundCorridorsBlock({
    portId,
    portSlug,
    corridors,
    sessionId,
}: FeaturedOutboundCorridorsBlockProps) {
    const impressionFired = useRef(false);

    useEffect(() => {
        if (!impressionFired.current && corridors.length > 0) {
            impressionFired.current = true;
            logEvent("impression", "adgrid_port_outbound_corridor_featured", portId, {
                port_slug: portSlug,
                corridor_count: corridors.length,
            });
        }
    }, [corridors.length, portId, portSlug]);

    if (corridors.length === 0) return null;

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 rounded-full" style={{ background: "#F1A91B" }} />
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                    Primary Outbound Corridors
                </h2>
            </div>

            <div className="space-y-3">
                {corridors.map((corridor) => {
                    const op = corridor.featuredOperator;

                    return (
                        <div key={corridor.corridorSlug} className="space-y-2">
                            {/* Corridor link */}
                            <Link
                                href={`/corridors/${corridor.corridorSlug}`}
                                className="group flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-all"
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(241,169,27,0.05)";
                                    e.currentTarget.style.borderColor = "rgba(241,169,27,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                                }}
                            >
                                <div>
                                    <div className="text-sm font-semibold text-white">{corridor.corridorLabel}</div>
                                    <div className="text-xs mt-0.5 truncate max-w-xs text-white/35">
                                        {corridor.endpoints}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-400" />
                            </Link>

                            {/* Featured operator slot */}
                            {op ? (
                                <Link
                                    href={`/directory/profile/${op.id}`}
                                    onClick={() =>
                                        logEvent("click", "adgrid_port_outbound_corridor_featured", portId, {
                                            corridor_slug: corridor.corridorSlug,
                                            operator_id: op.id,
                                        })
                                    }
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8 transition-colors"
                                >
                                    <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">
                                                Featured
                                            </span>
                                            {op.twicOnFile && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-blue-500/25 text-blue-400 bg-blue-500/10">
                                                    TWIC
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-bold text-white truncate">{op.name}</div>
                                        <div className="text-[10px] text-white/40">{op.state}</div>
                                    </div>
                                    {op.compositeScore != null && (
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-lg font-black text-amber-400 leading-none tabular-nums">
                                                {Math.round(op.compositeScore)}
                                            </div>
                                            <div className="text-[9px] text-white/30">Trust</div>
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                <EmptySlot
                                    corridorSlug={corridor.corridorSlug}
                                    portId={portId}
                                    sessionId={sessionId}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
