"use client";

import React, { useRef, useState } from "react";
import { MapPin, ChevronRight, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";

// ══════════════════════════════════════════════════════════════
// ScanModeCard — Haul Command
//
// Compact swipeable card for Quick Scan mode.
// Design rules from brief:
//   • 5 data points ONLY: route / date / escort type / pay / distance
//   • 48px+ min height — thumb-friendly in a cab
//   • Swipe right = Interested (saves to shortlist)
//   • Swipe left = Skip (deboosts for this session)
//   • Touch events via pointer deltas + CSS touch-action
//
// Wire up: pass onInterested / onSkip callbacks to
//   → your Supabase engagement signal logger
// ══════════════════════════════════════════════════════════════

export interface ScanCardModel {
    id: string;
    origin_city: string;
    origin_state: string;
    destination_city: string;
    destination_state: string;
    move_date: string;               // "Feb 24" — pre-formatted
    service_required: string;        // "Pilot Car"
    rate_min?: number | null;
    rate_max?: number | null;
    rate_amount?: number | null;
    rate_currency?: string | null;
    deadhead_miles?: number | null;
    status: "open" | "pending_hold" | "booked" | "in_progress" | "completed";
}

interface ScanModeCardProps {
    card: ScanCardModel;
    onInterested?: (id: string) => void;
    onSkip?: (id: string) => void;
    className?: string;
}

const SWIPE_THRESHOLD = 80; // px before action triggers

function formatRate(card: ScanCardModel): string {
    if (card.rate_amount) {
        return `${card.rate_currency ?? "$"}${Number(card.rate_amount).toLocaleString()}`;
    }
    if (card.rate_min && card.rate_max) {
        return `$${card.rate_min.toLocaleString()}–$${card.rate_max.toLocaleString()}`;
    }
    return "Rate TBD";
}

export function ScanModeCard({ card, onInterested, onSkip, className }: ScanModeCardProps) {
    const dragX = useMotionValue(0);
    const controls = useAnimation();

    // Background color feedback during drag
    const interestedOpacity = useTransform(dragX, [0, SWIPE_THRESHOLD], [0, 1]);
    const skipOpacity = useTransform(dragX, [-SWIPE_THRESHOLD, 0], [1, 0]);

    // Card rotation during drag
    const rotate = useTransform(dragX, [-200, 0, 200], [-6, 0, 6]);

    const isBooked = card.status !== "open" && card.status !== "pending_hold";

    async function handleDragEnd() {
        const x = dragX.get();
        if (x > SWIPE_THRESHOLD) {
            // Swipe right → interested
            await controls.start({ x: 500, opacity: 0, transition: { duration: 0.25 } });
            onInterested?.(card.id);
        } else if (x < -SWIPE_THRESHOLD) {
            // Swipe left → skip
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.25 } });
            onSkip?.(card.id);
        } else {
            // Snap back
            controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 30 } });
        }
    }

    return (
        <div className={cn("relative", className)} style={{ touchAction: "pan-y" }}>
            {/* ── Action Glow Layers ── */}
            <motion.div
                style={{ opacity: interestedOpacity }}
                className="absolute inset-0 rounded-2xl bg-hc-success/10 border-2 border-hc-success/40 pointer-events-none z-0"
            />
            <motion.div
                style={{ opacity: skipOpacity }}
                className="absolute inset-0 rounded-2xl bg-hc-danger/10 border-2 border-hc-danger/40 pointer-events-none z-0"
            />

            {/* ── Card ── */}
            <motion.article
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                style={{ x: dragX, rotate, minHeight: 72 }}
                animate={controls}
                onDragEnd={handleDragEnd}
                className={cn(
                    "relative z-10 flex items-center gap-4 px-5 py-4 rounded-2xl border cursor-grab active:cursor-grabbing select-none",
                    isBooked
                        ? "bg-hc-surface/50 border-hc-border-bare opacity-60"
                        : "bg-hc-surface border-hc-border hover:border-hc-border-high"
                )}
            >
                {/* Route */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-black text-hc-text text-sm truncate">
                        <span>{card.origin_city}, {card.origin_state}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-hc-subtle shrink-0" />
                        <span>{card.destination_city}, {card.destination_state}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {/* Date */}
                        <span className="text-[11px] font-bold text-hc-muted">{card.move_date}</span>
                        {/* Type */}
                        <span className="text-[11px] font-bold text-hc-muted px-1.5 py-0.5 bg-hc-elevated border border-hc-border-bare rounded uppercase tracking-wide">
                            {card.service_required}
                        </span>
                        {/* Deadhead */}
                        {card.deadhead_miles != null && (
                            <span className="text-[11px] text-hc-subtle font-medium">
                                ~{card.deadhead_miles}mi DH
                            </span>
                        )}
                    </div>
                </div>

                {/* Pay — always rightmost, always biggest */}
                <div className="shrink-0 text-right">
                    <div className="text-xl font-black text-hc-text tabular-nums">
                        {isBooked ? (
                            <span className="text-sm text-hc-success font-black">✓ Covered</span>
                        ) : (
                            formatRate(card)
                        )}
                    </div>
                </div>
            </motion.article>

            {/* ── Tap Action Buttons (alternative to swipe for desktop) ── */}
            {!isBooked && (
                <div className="flex gap-2 mt-2 px-1">
                    <button
                        onClick={() => onSkip?.(card.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-hc-border text-hc-subtle hover:text-hc-danger hover:border-hc-danger/30 text-xs font-bold uppercase tracking-widest transition-colors min-h-[40px]"
                    >
                        <X className="w-3.5 h-3.5" /> Skip
                    </button>
                    <button
                        onClick={() => onInterested?.(card.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-hc-gold-500/10 border border-hc-gold-500/30 text-hc-gold-500 hover:bg-hc-gold-500/20 text-xs font-bold uppercase tracking-widest transition-colors min-h-[40px]"
                    >
                        <Heart className="w-3.5 h-3.5" /> Interested
                    </button>
                </div>
            )}
        </div>
    );
}

export default ScanModeCard;
