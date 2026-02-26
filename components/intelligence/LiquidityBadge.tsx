/**
 * LiquidityBadge — Corridor market health indicator.
 *
 * Shows the liquidity state of a corridor (thin / balanced / thick market)
 * derived from the Corridor Liquidity Engine score model.
 *
 * Score interpretation:
 *   thin_market    < -25  → red,  "Thin Market"
 *   balanced       -25–25 → gold, "Balanced"
 *   thick_market   > 25   → green, "Thick Market"
 *
 * Use on corridor cards, map overlays, and broker load post flow.
 */
"use client";

import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LiquidityState = "thin" | "balanced" | "thick";

export interface LiquidityBadgeProps {
    /**
     * Liquidity score from the formula, range -100 to +100.
     * Derives the state automatically.
     */
    score?: number;
    /** Or provide state directly */
    state?: LiquidityState;
    /** Show trend arrow (up/down/flat) */
    showTrend?: boolean;
    /** Whether score is improving vs last period */
    trending?: "up" | "down" | "flat";
    /** Compact: pill only, no label text */
    compact?: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<LiquidityState, {
    color: string;
    bg: string;
    border: string;
    label: string;
    sublabel: string;
}> = {
    thin: {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.08)",
        border: "rgba(239,68,68,0.22)",
        label: "Thin Market",
        sublabel: "Escorts needed",
    },
    balanced: {
        color: "#F1A91B",
        bg: "rgba(241,169,27,0.07)",
        border: "rgba(241,169,27,0.20)",
        label: "Balanced",
        sublabel: "Normal fill time",
    },
    thick: {
        color: "#22c55e",
        bg: "rgba(34,197,94,0.07)",
        border: "rgba(34,197,94,0.18)",
        label: "Thick Market",
        sublabel: "Good coverage",
    },
};

function scoreToState(score: number): LiquidityState {
    if (score < -25) return "thin";
    if (score > 25) return "thick";
    return "balanced";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiquidityBadge({
    score,
    state: propState,
    showTrend = false,
    trending = "flat",
    compact = false,
}: LiquidityBadgeProps) {
    const state: LiquidityState =
        propState ?? (score !== undefined ? scoreToState(score) : "balanced");

    const cfg = STATE_CONFIG[state];

    const TrendIcon =
        trending === "up" ? TrendingUp :
            trending === "down" ? TrendingDown :
                Minus;

    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                title={cfg.sublabel}
                role="status"
                aria-label={cfg.label}
            >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                {cfg.label}
            </span>
        );
    }

    return (
        <div
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            role="status"
        >
            <div>
                <div className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: cfg.color }}>
                    {cfg.label}
                </div>
                {!compact && (
                    <div className="text-[9px] mt-0.5 leading-none" style={{ color: `${cfg.color}70` }}>
                        {cfg.sublabel}
                    </div>
                )}
            </div>
            {showTrend && (
                <TrendIcon
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: `${cfg.color}80` }}
                    aria-label={`Trending ${trending}`}
                />
            )}
        </div>
    );
}

// ── Exported helper for use in server components / data transforms ─────────────

export function getLiquidityState(score: number): LiquidityState {
    return scoreToState(score);
}

/**
 * Compute a simplified liquidity score from static corridor data.
 * Use when real-time score isn't available.
 *
 * Formula (simplified):
 *   score = (supply_pct - 50) × 0.8 + (demand_score - 50) × 0.2 scaled to -100–+100
 *
 * Positive = more supply than demand (thick). Negative = more demand (thin).
 */
export function estimateLiquidityScore(supplyPct: number, demandScore: number): number {
    const supplySignal = (supplyPct - 50) * 0.8;
    const demandSignal = (50 - demandScore) * 0.2;  // high demand → negative
    return Math.round(Math.max(-100, Math.min(100, supplySignal + demandSignal)));
}
