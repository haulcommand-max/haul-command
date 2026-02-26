"use client";

// PortSponsorBlock — Revenue surface #1: Sponsor This Port
// Placement: /ports/[slug] right sidebar (above Port Metrics)
//
// No payment processing yet — collects inquiry lead + fires adgrid_events.
// Tiers: starter $199 | pro $399 | domination $799
// Scarcity meter: driven by compute_adgrid_suggested_price RPC.

import React, { useState, useEffect } from "react";
import { Star, ChevronRight, CheckCircle2, Loader2, Flame, AlertTriangle, Shield } from "lucide-react";

export interface PortSponsorBlockProps {
    portId: string;
    portSlug: string;
    portName: string;
    demandScore?: number;
    /** Active sponsor for this port (if any) — shows "1 slot taken" on Domination */
    activeSponsorTier?: "starter" | "pro" | "domination" | null;
    sessionId?: string;
}

const TIERS = [
    {
        id: "starter",
        name: "Starter",
        price: 199,
        badge: null,
        tag: "Most Popular",
        tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
        includes: [
            "Sponsored badge on port page",
            "Top 3 operator slot",
            "Basic click tracking",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        price: 399,
        badge: "⭐",
        tag: "Best Value",
        tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/25",
        includes: [
            "Pinned across port + directory",
            "Category targeting",
            "Lead form routing",
        ],
    },
    {
        id: "domination",
        name: "Domination",
        price: 799,
        badge: "🔥",
        tag: "Exclusive",
        tagColor: "text-red-400 bg-red-500/10 border-red-500/25",
        includes: [
            "Exclusive port ownership (1 buyer)",
            "Outbound corridor co-sponsorship",
            "Priority lead routing",
        ],
    },
] as const;

type TierId = "starter" | "pro" | "domination";

export function PortSponsorBlock({
    portId,
    portSlug,
    portName,
    demandScore,
    activeSponsorTier,
    sessionId,
}: PortSponsorBlockProps) {
    const [selectedTier, setSelectedTier] = useState<TierId>("pro");
    const [expanded, setExpanded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "done">("idle");
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [bidAmount, setBidAmount] = useState<number>(399); // default Pro
    const [pricing, setPricing] = useState<{
        suggestedPrice: number;
        scarcityMultiplier: number;
        sponsorCompetition: number;
    } | null>(null);

    const dominationTaken = activeSponsorTier === "domination";

    // Update default bid when tier changes
    useEffect(() => {
        const base = TIERS.find(t => t.id === selectedTier)?.price || 199;
        setBidAmount(selectedTier === "domination" && pricing ? Math.max(pricing.suggestedPrice, base) : base);
    }, [selectedTier, pricing]);

    // Fetch live scarcity pricing from RPC
    useEffect(() => {
        fetch(`/api/adgrid/pricing?port_id=${portId}&slot_id=adgrid_port_hero_sponsor`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => {
                if (d?.suggested_price) {
                    setPricing({
                        suggestedPrice: d.suggested_price,
                        scarcityMultiplier: d.scarcity_multiplier ?? 1,
                        sponsorCompetition: d.sponsor_competition ?? 0,
                    });
                }
            })
            .catch(() => { });
    }, [portId]);

    async function fireEvent(eventType: string, extra: Record<string, unknown> = {}) {
        try {
            await fetch("/api/adgrid/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slot_id: "adgrid_port_hero_sponsor",
                    event_type: eventType,
                    entity_type: "port",
                    entity_id: portId,
                    session_id: sessionId,
                    meta: { port_slug: portSlug, tier: selectedTier, ...extra },
                }),
            });
        } catch {
            // non-blocking
        }
    }

    async function handleCheckout(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !bidAmount) return;
        setSubmitting(true);
        setCheckoutState("processing");
        setCheckoutError(null);

        await fireEvent("checkout_started", { email_provided: true, bid_amount: bidAmount });

        // Submit self-serve checkout with bidding logic
        try {
            const res = await fetch("/api/ports/sponsor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    port_id: portId,
                    tier: selectedTier,
                    contact_email: email,
                    bid_amount_usd: bidAmount,
                    checkout_completed: true, // Self-serve!
                }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || "Checkout failed");
            }

            // Fake processing delay for UX
            setTimeout(() => {
                setSubmitting(false);
                setCheckoutState("done");
            }, 1200);

        } catch (err: any) {
            setSubmitting(false);
            setCheckoutState("idle");
            setCheckoutError(err.message);
        }
    }

    function handleCtaClick() {
        fireEvent("sponsor_cta_click");
        setExpanded(true);
    }

    if (checkoutState === "done") {
        return (
            <div className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-white mb-1">Checkout Complete</p>
                <p className="text-xs text-white/40 mb-3">
                    Your bid of ${bidAmount}/mo is active. You now own the {selectedTier} slot for {portName}.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                    Refresh Port Data
                </button>
            </div>
        );
    }

    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "rgba(241,169,27,0.03)", borderColor: "rgba(241,169,27,0.15)" }}
        >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                        Sponsor This Port
                    </span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">
                    Own discovery for high-intent {portName} traffic.
                    {demandScore && demandScore >= 75 && (
                        <span className="text-amber-400/70"> Demand score: {demandScore}/100.</span>
                    )}
                </p>
            </div>

            {!expanded ? (
                /* Collapsed: quick pitch + scarcity meter */
                <div className="p-5 space-y-4">
                    {/* Scarcity meter */}
                    {pricing && (
                        <div className="rounded-xl p-3 border border-red-500/15 bg-red-500/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                                        {pricing.scarcityMultiplier >= 1.8 ? "High Demand" : pricing.scarcityMultiplier >= 1.4 ? "Rising Demand" : "Active Market"}
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/40 tabular-nums">
                                    {pricing.sponsorCompetition > 0 ? `${pricing.sponsorCompetition} active sponsor${pricing.sponsorCompetition > 1 ? 's' : ''}` : 'No active sponsors'}
                                </span>
                            </div>
                            {/* Pressure bar */}
                            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(100, ((pricing.scarcityMultiplier - 1) / 1.5) * 100)}%`,
                                        background: pricing.scarcityMultiplier >= 1.8 ? '#ef4444' : pricing.scarcityMultiplier >= 1.4 ? '#F1A91B' : '#22c55e',
                                    }}
                                />
                            </div>
                            {dominationTaken && (
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    Domination slot claimed — Starter &amp; Pro available
                                </div>
                            )}
                        </div>
                    )}

                    <ul className="space-y-2">
                        {[
                            "Rank above organic operators",
                            "TWIC + corridor lead routing",
                            "Sponsored badge in directory",
                        ].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[11px] text-white/60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/60 flex-shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>
                    <div className="text-center">
                        <p className="text-[10px] text-white/30 mb-3">
                            {pricing ? `Suggested: $${pricing.suggestedPrice}/mo` : 'From $199/month'}
                        </p>
                        <button
                            onClick={handleCtaClick}
                            className="w-full py-2.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-1.5 transition-all"
                            style={{ background: "#F1A91B" }}
                        >
                            Own This Port
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                /* Expanded: tier picker + form */
                <div className="p-5 space-y-4">
                    {/* Tier cards */}
                    <div className="space-y-2">
                        {TIERS.map((tier) => {
                            const isSelected = selectedTier === tier.id;
                            const isTaken = tier.id === "domination" && dominationTaken;
                            return (
                                <button
                                    key={tier.id}
                                    disabled={isTaken}
                                    onClick={() => setSelectedTier(tier.id)}
                                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${isTaken
                                        ? "opacity-40 cursor-not-allowed"
                                        : isSelected
                                            ? "border-amber-500/40 bg-amber-500/8"
                                            : "border-white/8 bg-white/2 hover:border-white/15"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {tier.badge && <span>{tier.badge}</span>}
                                            <span className="text-sm font-bold text-white">{tier.name}</span>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${tier.tagColor}`}>
                                                {isTaken ? "TAKEN" : tier.tag}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-amber-400">
                                            ${tier.price}<span className="text-[10px] font-normal text-white/30">/mo</span>
                                        </span>
                                    </div>
                                    <ul className="space-y-0.5">
                                        {tier.includes.map((f) => (
                                            <li key={f} className="text-[10px] text-white/40 flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-amber-400/40 flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                            );
                        })}
                    </div>

                    {/* Self-serve Checkout / Bidding Form */}
                    <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                        {checkoutError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-400 leading-snug">{checkoutError}</p>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                                {selectedTier === 'domination' ? "Your Max Bid (USD/mo)" : "Monthly Budget (USD)"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-white/30 text-sm">$</span>
                                <input
                                    type="number"
                                    min={TIERS.find((t) => t.id === selectedTier)?.price}
                                    required
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 pl-7 pr-3 py-2 text-lg font-black text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 tabular-nums transition-colors"
                                />
                            </div>
                            {selectedTier === 'domination' && pricing && pricing.sponsorCompetition > 0 && (
                                <p className="text-[9px] text-amber-400 mt-1 pl-1">
                                    Must exceed current active bid to take over slot instantly.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                                Company Email (Receipts)
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="dispatch@..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !email || bidAmount < (TIERS.find((t) => t.id === selectedTier)?.price || 0)}
                            className="w-full py-2.5 mt-1 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(241,169,27,0.2)] hover:shadow-[0_0_30px_rgba(241,169,27,0.4)]"
                            style={{ background: "#F1A91B" }}
                        >
                            {checkoutState === "processing" ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Card...</>
                            ) : (
                                <>💳 Pay ${bidAmount}/mo</>
                            )}
                        </button>
                        <p className="text-[10px] text-white/25 text-center flex items-center justify-center gap-1.5">
                            <Shield className="w-3 h-3 opacity-50" />
                            Stripe Placeholder — Acts as a live checkout
                        </p>
                    </form>
                </div>
            )}
        </div>
    );
}
