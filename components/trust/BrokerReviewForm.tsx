"use client";

import React, { useState } from "react";
import { Star, Send, X, DollarSign, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// BrokerReviewForm — Haul Command Trust Layer
// Escort-submitted operational review of a broker.
// HIGH-LEVERAGE: no competitor platform rates brokers on pay behavior.
//
// 5 axes (weighted per YAML):
//   1. Paid on Time    — 0.45 weight — HERO AXIS
//   2. Rate Accuracy   — 0.20 weight
//   3. Communication   — 0.15 weight
//   4. Load Clarity    — 0.10 weight
//   5. Detention Fair  — 0.10 weight
// + would_work_again boolean + optional 500-char text
// ══════════════════════════════════════════════════════════════

interface BrokerReviewFormProps {
    brokerId: string;
    loadId?: string;
    brokerName?: string;
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
        <div className={cn(
            "space-y-1",
            hero && "p-4 rounded-xl bg-hc-gold-500/6 border border-hc-gold-500/20 mb-2"
        )}>
            <div className="flex items-center justify-between">
                <label className={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    hero ? "text-hc-gold-500" : "text-hc-text"
                )}>
                    {hero && <DollarSign className="inline w-3 h-3 mr-1 -mt-0.5" />}
                    {label}
                    {hero && (
                        <span className="ml-1.5 text-[9px] font-black text-hc-gold-500/60 normal-case tracking-normal">
                            45% of pay score
                        </span>
                    )}
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
                            hero ? "w-9 h-9" : "w-6 h-6",
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

export function BrokerReviewForm({
    brokerId,
    loadId,
    brokerName,
    onSuccess,
    onCancel,
    className,
}: BrokerReviewFormProps) {
    // Hero axis first
    const [paidOnTime, setPaidOnTime] = useState(0);
    const [rateAccuracy, setRateAccuracy] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [loadClarity, setLoadClarity] = useState(0);
    const [detentionFairness, setDetentionFairness] = useState(0);
    const [wouldWorkAgain, setWouldWorkAgain] = useState(true);
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const isValid =
        paidOnTime > 0 && rateAccuracy > 0 && communication > 0 &&
        loadClarity > 0 && detentionFairness > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/trust/broker-reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    broker_id: brokerId,
                    load_id: loadId ?? null,
                    paid_on_time_rating: paidOnTime,
                    rate_accuracy_rating: rateAccuracy,
                    communication_rating: communication,
                    load_clarity_rating: loadClarity,
                    detention_fairness_rating: detentionFairness,
                    would_work_again: wouldWorkAgain,
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
                <p className="text-[12px] text-hc-muted">Broker pay score updates within a few minutes.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={cn("hc-card p-6 space-y-5", className)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-black text-hc-text uppercase tracking-tight">
                        Rate This Broker
                    </h3>
                    {brokerName && (
                        <p className="text-[11px] text-hc-muted mt-0.5">{brokerName}</p>
                    )}
                    <p className="text-[10px] text-hc-subtle mt-1 max-w-xs leading-relaxed">
                        Your review is anonymous to the public. Brokers cannot see who left specific scores.
                    </p>
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="p-2 rounded-lg hover:bg-hc-elevated text-hc-subtle shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ★ HERO AXIS: Paid on Time */}
            <StarInput
                label="Paid on Time"
                value={paidOnTime}
                onChange={setPaidOnTime}
                hint="Did they pay on schedule? This is the #1 factor escorts care about."
                hero
            />

            {/* Remaining 4 axes */}
            <div className="space-y-4 pt-1 border-t border-hc-border-bare">
                <StarInput
                    label="Rate Accuracy"
                    value={rateAccuracy}
                    onChange={setRateAccuracy}
                    hint="Did the final rate match what was agreed? Any surprise deductions?"
                />
                <StarInput
                    label="Communication"
                    value={communication}
                    onChange={setCommunication}
                    hint="Responsiveness, pickup time accuracy, load updates"
                />
                <StarInput
                    label="Load Clarity"
                    value={loadClarity}
                    onChange={setLoadClarity}
                    hint="Were load specs accurate? Dimensions, weight, routing?"
                />
                <StarInput
                    label="Detention Fairness"
                    value={detentionFairness}
                    onChange={setDetentionFairness}
                    hint="Were detention claims handled fairly and without argument?"
                />
            </div>

            {/* Would Work Again toggle */}
            <div className="flex items-center justify-between py-1 border-y border-hc-border-bare">
                <div>
                    <span className="text-[11px] font-bold text-hc-text uppercase tracking-widest">
                        Would Work Again?
                    </span>
                    <p className="text-[10px] text-hc-subtle mt-0.5">Escorts can filter by this signal</p>
                </div>
                <button
                    type="button"
                    onClick={() => setWouldWorkAgain(v => !v)}
                    className={cn(
                        "px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-widest border transition-all duration-200",
                        wouldWorkAgain
                            ? "bg-hc-success/10 border-hc-success/30 text-hc-success"
                            : "bg-hc-danger/10 border-hc-danger/30 text-hc-danger"
                    )}
                >
                    {wouldWorkAgain ? "✓ Yes" : "✗ No"}
                </button>
            </div>

            {/* Comment (optional) */}
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-hc-text uppercase tracking-widest">
                    Comments <span className="text-hc-subtle font-normal">(optional)</span>
                </label>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Describe your payment experience…"
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

            {error && <p className="text-sm text-hc-danger font-medium">{error}</p>}

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
                {submitting ? "Submitting…" : "Submit Broker Review"}
            </button>
        </form>
    );
}

export default BrokerReviewForm;
