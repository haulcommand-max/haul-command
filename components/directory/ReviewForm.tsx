"use client";

import React, { useState } from "react";
import { Star, Send, X, Clock, Truck, MessageSquare, Map, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// ReviewForm — Haul Command Directory (v2 — 5-axis)
// Post-job broker → escort operational review.
// Axes: On Time | Communication | Professionalism | Equipment | Route Awareness
// + would_use_again boolean + optional 500-char text + photo upload
// ══════════════════════════════════════════════════════════════

interface ReviewFormProps {
    escortId: string;
    jobId?: string;
    escortName?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    className?: string;
}

interface StarInputProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    hint?: string;
    hero?: boolean;
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function StarInput({ label, value, onChange, hint, hero }: StarInputProps) {
    const [hovered, setHovered] = useState(0);
    const displayed = hovered || value;

    return (
        <div className={cn("space-y-1", hero && "pb-3 mb-1 border-b border-hc-border-bare")}>
            <div className="flex items-center justify-between">
                <label className={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    hero ? "text-hc-gold-500" : "text-hc-text"
                )}>
                    {hero && <span className="mr-1">★</span>}
                    {label}
                    {hero && <span className="ml-1.5 text-[9px] font-black text-hc-gold-500/60 normal-case tracking-normal">(most important)</span>}
                </label>
                {value > 0 && (
                    <span className={cn(
                        "text-[10px] font-black",
                        hero ? "text-hc-gold-500" : "text-hc-muted"
                    )}>
                        {RATING_LABELS[value]}
                    </span>
                )}
            </div>
            <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onMouseEnter={() => setHovered(i + 1)}
                        onClick={() => onChange(i + 1)}
                        className="p-0.5 rounded transition-transform hover:scale-110 active:scale-95"
                    >
                        <Star className={cn(
                            "transition-colors",
                            hero ? "w-8 h-8" : "w-6 h-6",
                            i < displayed
                                ? "text-hc-gold-500 fill-hc-gold-500"
                                : "text-hc-border"
                        )} />
                    </button>
                ))}
            </div>
            {hint && <p className="text-[10px] text-hc-subtle">{hint}</p>}
        </div>
    );
}

export function ReviewForm({
    escortId,
    jobId,
    escortName,
    onSuccess,
    onCancel,
    className,
}: ReviewFormProps) {
    // 5-axis state
    const [onTime, setOnTime] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [professionalism, setProfessionalism] = useState(0);
    const [equipmentReady, setEquipmentReady] = useState(0);
    const [routeAwareness, setRouteAwareness] = useState(0);
    const [wouldUseAgain, setWouldUseAgain] = useState(true);
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const isValid =
        onTime > 0 && communication > 0 &&
        professionalism > 0 && equipmentReady > 0 && routeAwareness > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/directory/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    escort_id: escortId,
                    load_id: jobId ?? null,
                    on_time_rating: onTime,
                    communication_rating: communication,
                    professionalism_rating: professionalism,
                    equipment_ready_rating: equipmentReady,
                    route_awareness_rating: routeAwareness,
                    would_use_again: wouldUseAgain,
                    review_text: body.trim() || null,
                }),
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error ?? "Failed to submit review");
            }

            setDone(true);
            setTimeout(() => onSuccess?.(), 1200);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className={cn("hc-card p-8 flex flex-col items-center gap-3 text-center", className)}>
                <div className="w-12 h-12 rounded-full bg-hc-success/15 border border-hc-success/30 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-hc-success" />
                </div>
                <h3 className="text-base font-black text-hc-text uppercase tracking-tight">Review Submitted</h3>
                <p className="text-[12px] text-hc-muted">Trust scores update within a few minutes.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={cn("hc-card p-6 space-y-5", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-black text-hc-text uppercase tracking-tight">
                        Operational Review
                    </h3>
                    {escortName && (
                        <p className="text-[11px] text-hc-muted mt-0.5">for {escortName}</p>
                    )}
                </div>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-hc-elevated text-hc-subtle"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* 5-axis star inputs */}
            <div className="space-y-4 py-4 border-y border-hc-border-bare">
                {/* On Time — hero axis */}
                <StarInput
                    label="On Time"
                    value={onTime}
                    onChange={setOnTime}
                    hint="Did they arrive on time and keep to schedule?"
                    hero
                />
                <StarInput
                    label="Communication"
                    value={communication}
                    onChange={setCommunication}
                    hint="Radio check-ins, status updates, responsiveness"
                />
                <StarInput
                    label="Professionalism"
                    value={professionalism}
                    onChange={setProfessionalism}
                    hint="Conduct, appearance, attitude on the job"
                />
                <StarInput
                    label="Equipment Readiness"
                    value={equipmentReady}
                    onChange={setEquipmentReady}
                    hint="Vehicle presentation, signage, lights, equipment quality"
                />
                <StarInput
                    label="Route Awareness"
                    value={routeAwareness}
                    onChange={setRouteAwareness}
                    hint="Corridor knowledge, hazard spotting, permit compliance"
                />
            </div>

            {/* Would Use Again toggle */}
            <div className="flex items-center justify-between py-1">
                <div>
                    <span className="text-[11px] font-bold text-hc-text uppercase tracking-widest">
                        Would Use Again?
                    </span>
                    <p className="text-[10px] text-hc-subtle mt-0.5">Factored into repeat-use rate</p>
                </div>
                <button
                    type="button"
                    onClick={() => setWouldUseAgain(v => !v)}
                    className={cn(
                        "px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-widest border transition-all duration-200",
                        wouldUseAgain
                            ? "bg-hc-success/10 border-hc-success/30 text-hc-success"
                            : "bg-hc-danger/10 border-hc-danger/30 text-hc-danger"
                    )}
                >
                    {wouldUseAgain ? "✓ Yes" : "✗ No"}
                </button>
            </div>

            {/* Written review (optional) */}
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-hc-text uppercase tracking-widest">
                    Comments <span className="text-hc-subtle font-normal">(optional)</span>
                </label>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Briefly describe your experience on this move…"
                    rows={3}
                    maxLength={500}
                    className={cn(
                        "w-full px-4 py-3 rounded-xl resize-none",
                        "bg-hc-elevated border border-hc-border",
                        "text-hc-text placeholder:text-hc-subtle text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-hc-gold-500/30",
                        "transition-all duration-200"
                    )}
                />
                <p className="text-right text-[10px] text-hc-subtle">{body.length}/500</p>
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-hc-danger font-medium">{error}</p>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={!isValid || submitting}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-xl",
                    "font-black text-[13px] uppercase tracking-widest",
                    "transition-all duration-200",
                    isValid && !submitting
                        ? "brand-button press-feedback"
                        : "bg-hc-elevated text-hc-subtle border border-hc-border cursor-not-allowed"
                )}
            >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting…" : "Submit Review"}
            </button>
        </form>
    );
}

export default ReviewForm;
