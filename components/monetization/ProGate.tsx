"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Zap, Lock } from "lucide-react";
import Link from "next/link";
import { PRICING } from "@/lib/config/pricing";

// ══════════════════════════════════════════════════════════════
// ProGate — Haul Command
// Wraps any component or section behind a Pro tier gate.
// Shows a clean upgrade nudge — never a dark pattern.
// "You unlock X. It costs $49/mo. One button."
// ══════════════════════════════════════════════════════════════

type UserTier = "free" | "pro" | "elite";

interface ProGateProps {
    /** Current user tier */
    tier: UserTier;
    /** The one specific benefit they unlock with Pro */
    unlockBenefit: string;
    /** Children render normally if Pro */
    children: React.ReactNode;
    /** Optional: show as inline nudge chip instead of full overlay */
    variant?: "overlay" | "inline" | "chip";
    className?: string;
}

function UpgradeOverlay({ benefit }: { benefit: string }) {
    return (
        <div className="relative rounded-2xl overflow-hidden">
            {/* Blurred preview layer — hint of what's behind */}
            <div className="absolute inset-0 bg-hc-bg/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-hc-gold-500/10 border border-hc-gold-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-hc-gold-500" />
                </div>
                <div>
                    <p className="text-sm font-black text-hc-text uppercase tracking-tight mb-1">
                        Pro Feature
                    </p>
                    <p className="text-xs text-hc-muted max-w-[220px] leading-relaxed">
                        {benefit}
                    </p>
                </div>
                <Link
                    href="/upgrade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-xs uppercase tracking-widest rounded-xl transition-colors shadow-dispatch"
                >
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade — ${PRICING.ESCORT.PRO.price_monthly}/mo
                </Link>
            </div>
            {/* Blurred children behind the gate */}
            <div className="pointer-events-none select-none blur-[3px] opacity-40">
                <div className="h-24 bg-hc-surface rounded-2xl" />
            </div>
        </div>
    );
}

function InlineNudge({ benefit }: { benefit: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-hc-gold-500/5 border border-hc-gold-500/15 rounded-xl">
            <Zap className="w-4 h-4 text-hc-gold-500 shrink-0" />
            <p className="text-xs text-hc-muted flex-1">{benefit}</p>
            <Link
                href="/upgrade"
                className="text-[10px] font-black text-hc-gold-500 hover:text-hc-gold-600 uppercase tracking-widest whitespace-nowrap transition-colors"
            >
                Go Pro →
            </Link>
        </div>
    );
}

function ChipNudge({ benefit }: { benefit: string }) {
    return (
        <Link
            href="/upgrade"
            title={benefit}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-lg text-[10px] font-black text-hc-gold-500 uppercase tracking-widest hover:bg-hc-gold-500/20 transition-colors"
        >
            <Lock className="w-2.5 h-2.5" /> Pro
        </Link>
    );
}

export function ProGate({
    tier,
    unlockBenefit,
    children,
    variant = "overlay",
    className,
}: ProGateProps) {
    const isPro = tier === "pro" || tier === "elite";

    if (isPro) {
        return <>{children}</>;
    }

    return (
        <div className={cn("w-full", className)}>
            {variant === "overlay" && <UpgradeOverlay benefit={unlockBenefit} />}
            {variant === "inline" && <InlineNudge benefit={unlockBenefit} />}
            {variant === "chip" && <ChipNudge benefit={unlockBenefit} />}
        </div>
    );
}

// ── Pro Badge — show on Pro user profiles / nav ───────────────
export function ProBadge({ tier, className }: { tier: UserTier; className?: string }) {
    if (tier === "free") return null;
    const label = tier === "elite"
        ? PRICING.ESCORT.ELITE.badge_label
        : PRICING.ESCORT.PRO.badge_label;
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
            "bg-hc-gold-500/10 border border-hc-gold-500/30 text-hc-gold-500",
            className
        )}>
            <Zap className="w-2.5 h-2.5" />
            {label}
        </span>
    );
}

export default ProGate;
