"use client";

// CoverageEstimateForm — "Get Escort Coverage Estimate"
// Haul Command's version of Nextdoor's "free estimate" lead capture.
//
// Inputs:  route (origin/dest), load dimensions, port origin, night move
// Outputs: escort count, police trigger, rough cost estimate, urgency
// Lead is routed to active port/corridor sponsor first, then organic operators.
// Fires: lead_form_submit adgrid event on submit.

import React, { useState } from "react";
import {
    Calculator, Truck, DoorOpen, Moon,
    CheckCircle2, Loader2, ChevronRight, ChevronDown, MapPin
} from "lucide-react";

export interface CoverageEstimateFormProps {
    /** Pre-filled from port context */
    defaultPortSlug?: string;
    defaultPortName?: string;
    defaultCorridorSlug?: string;
    sessionId?: string;
}

interface EstimateResult {
    escortCount: number;
    needsPolice: boolean;
    needsHeightPole: boolean;
    estimatedCost: string;
    urgencyLevel: "low" | "medium" | "high";
    note: string;
}

const WIDTH_OPTIONS = [
    { value: "8.5", label: "Up to 8.5 ft — Standard" },
    { value: "10", label: "8.5–10 ft — Oversize" },
    { value: "12", label: "10–12 ft — Wide" },
    { value: "14", label: "12–14 ft — Extra Wide" },
    { value: "16", label: "14–16 ft — Requires escorts" },
    { value: "18", label: "16–18 ft — Police possible" },
    { value: "20", label: "18+ ft — Police likely" },
];

const HEIGHT_OPTIONS = [
    { value: "13.5", label: "Under 13.5 ft — Standard" },
    { value: "14.5", label: "13.5–14.5 ft — Oversize" },
    { value: "15.5", label: "14.5–15.5 ft — Height pole likely" },
    { value: "16", label: "15.5–16 ft — Height pole required" },
    { value: "16+", label: "Over 16 ft — Special permit" },
];

function computeEstimate(
    widthFt: string,
    heightFt: string,
    nightMove: boolean,
    _portSlug: string | undefined
): EstimateResult {
    const w = parseFloat(widthFt);
    const h = parseFloat(heightFt);
    const isOversize = w > 8.5 || h > 13.5;
    const needsPolice = w >= 16 || h >= 15.5;
    const needsHeightPole = h >= 14.5;

    let escortCount = 0;
    if (w > 8.5 && w <= 14) escortCount = 1;
    if (w > 14 && w <= 16) escortCount = 2;
    if (w > 16) escortCount = 2;
    if (nightMove && isOversize) escortCount = Math.max(escortCount, 2);

    const basePerEscort = nightMove ? 375 : 275;
    const policeCost = needsPolice ? 600 : 0;
    const heightPoleCost = needsHeightPole ? 350 : 0;
    const totalLow = escortCount * basePerEscort * 0.85 + policeCost + heightPoleCost;
    const totalHigh = escortCount * basePerEscort * 1.4 + policeCost + heightPoleCost;

    const urgencyLevel: EstimateResult["urgencyLevel"] =
        escortCount >= 2 || needsPolice ? "high" : isOversize ? "medium" : "low";

    const note = needsPolice
        ? "Police escort likely required — allow 72h lead time for law enforcement coordination."
        : needsHeightPole
            ? "Height pole team required — book with your pilot car for optimal pricing."
            : isOversize
                ? "Oversize permit required before departure. Book escorts 24–48h in advance."
                : "Load appears within standard limits. Verify permit requirements with your state DOT.";

    return {
        escortCount,
        needsPolice,
        needsHeightPole,
        estimatedCost: escortCount === 0 ? "No escort required" : `$${Math.round(totalLow).toLocaleString()} – $${Math.round(totalHigh).toLocaleString()}`,
        urgencyLevel,
        note,
    };
}

export function CoverageEstimateForm({
    defaultPortSlug,
    defaultPortName,
    defaultCorridorSlug,
    sessionId,
}: CoverageEstimateFormProps) {
    const [width, setWidth] = useState("12");
    const [height, setHeight] = useState("13.5");
    const [origin, setOrigin] = useState(defaultPortName ?? "");
    const [destination, setDest] = useState("");
    const [nightMove, setNight] = useState(false);
    const [email, setEmail] = useState("");
    const [submitting, setSubmit] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<EstimateResult | null>(null);

    function handleEstimate(e: React.FormEvent) {
        e.preventDefault();
        setResult(computeEstimate(width, height, nightMove, defaultPortSlug));
    }

    async function handleSubmitLead(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !result) return;
        setSubmit(true);

        // Fire lead event
        await fetch("/api/adgrid/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slot_id: "adgrid_port_hero_sponsor",
                event_type: "lead_form_submit",
                entity_type: defaultPortSlug ? "port" : "corridor",
                session_id: sessionId,
                meta: {
                    port_slug: defaultPortSlug,
                    corridor_slug: defaultCorridorSlug,
                    load_width_ft: width,
                    load_height_ft: height,
                    night_move: nightMove,
                    escort_count: result.escortCount,
                    needs_police: result.needsPolice,
                    origin,
                    destination,
                },
            }),
        }).catch(() => { });

        // Submit lead for routing
        await fetch("/api/estimate/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                port_slug: defaultPortSlug,
                corridor_slug: defaultCorridorSlug,
                origin,
                destination,
                load_width_ft: parseFloat(width),
                load_height_ft: parseFloat(height),
                night_move: nightMove,
                estimate: result,
            }),
        }).catch(() => { });

        setSubmit(false);
        setSubmitted(true);
    }

    const urgencyColors = {
        low: { text: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/20" },
        medium: { text: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/20" },
        high: { text: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/20" },
    };

    return (
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.07)" }}
        >
            {/* Header */}
            <div
                className="px-5 pt-5 pb-4 border-b border-white/5"
                style={{ background: "rgba(241,169,27,0.03)" }}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                        Get Escort Coverage Estimate
                    </span>
                </div>
                <p className="text-[11px] text-white/40">
                    Enter your load dimensions to get escort count, police triggers, and cost range.
                    Lead routed to the best available operator.
                </p>
            </div>

            {submitted ? (
                <div className="p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Estimate sent</p>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">
                        A verified escort operator near {defaultPortName ?? "your port"} will contact you
                        within 1–4 hours with a full quote.
                    </p>
                </div>
            ) : (
                <div className="p-5 space-y-5">
                    {/* Step 1: Inputs */}
                    <form onSubmit={handleEstimate} className="space-y-3">
                        {/* Route */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block">
                                    Origin
                                </label>
                                <input
                                    type="text"
                                    value={origin}
                                    onChange={(e) => setOrigin(e.target.value)}
                                    placeholder={defaultPortName ?? "City or Port"}
                                    className="w-full rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block">
                                    Destination
                                </label>
                                <input
                                    type="text"
                                    value={destination}
                                    onChange={(e) => setDest(e.target.value)}
                                    placeholder="City or State"
                                    className="w-full rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40"
                                />
                            </div>
                        </div>

                        {/* Dimensions */}
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Load Width
                            </label>
                            <div className="relative">
                                <select
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 pr-7"
                                >
                                    {WIDTH_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-neutral-900">
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block">
                                Load Height
                            </label>
                            <div className="relative">
                                <select
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 pr-7"
                                >
                                    {HEIGHT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-neutral-900">
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                            </div>
                        </div>

                        {/* Night move toggle */}
                        <button
                            type="button"
                            onClick={() => setNight(!nightMove)}
                            className={`flex items-center gap-2.5 w-full rounded-lg border px-3 py-2.5 transition-colors ${nightMove
                                    ? "border-amber-500/30 bg-amber-500/8 text-amber-400"
                                    : "border-white/8 bg-white/2 text-white/40"
                                }`}
                        >
                            <Moon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium">Night movement</span>
                            <div
                                className={`ml-auto w-7 h-4 rounded-full transition-colors relative ${nightMove ? "bg-amber-500" : "bg-white/10"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${nightMove ? "translate-x-3.5" : "translate-x-0.5"
                                        }`}
                                />
                            </div>
                        </button>

                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition-all flex items-center justify-center gap-1.5"
                            style={{ background: "#F1A91B" }}
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            Calculate Coverage
                        </button>
                    </form>

                    {/* Step 2: Result */}
                    {result && (
                        <div
                            className={`rounded-xl border p-4 space-y-3 ${urgencyColors[result.urgencyLevel].bg} ${urgencyColors[result.urgencyLevel].border}`}
                        >
                            {/* Metrics row */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className={`text-2xl font-black tabular-nums ${urgencyColors[result.urgencyLevel].text}`}>
                                        {result.escortCount}
                                    </div>
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Escorts</div>
                                </div>
                                <div>
                                    <div className={`text-sm font-black ${result.needsPolice ? "text-red-400" : "text-white/20"}`}>
                                        {result.needsPolice ? "YES" : "NO"}
                                    </div>
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Police</div>
                                </div>
                                <div>
                                    <div className={`text-sm font-black ${result.needsHeightPole ? "text-amber-400" : "text-white/20"}`}>
                                        {result.needsHeightPole ? "YES" : "NO"}
                                    </div>
                                    <div className="text-[9px] text-white/35 uppercase tracking-wider">Ht. Pole</div>
                                </div>
                            </div>

                            <div className={`text-base font-black text-center ${urgencyColors[result.urgencyLevel].text}`}>
                                {result.estimatedCost}
                            </div>

                            <p className="text-[10px] text-white/40 leading-snug">{result.note}</p>

                            {/* Lead capture */}
                            <form onSubmit={handleSubmitLead} className="space-y-2 pt-1 border-t border-white/8">
                                <p className="text-[10px] text-white/50">
                                    Get a full quote from a verified operator:
                                </p>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !email}
                                    className="w-full py-2 rounded-lg text-xs font-bold text-black flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                                    style={{ background: "#F1A91B" }}
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Routing...</>
                                    ) : (
                                        <>Get Matched with an Operator <ChevronRight className="w-3.5 h-3.5" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
