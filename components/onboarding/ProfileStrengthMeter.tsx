"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Star, Eye } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// ProfileStrengthMeter — Haul Command
// Always visible during onboarding.
// Shows score 0–100, current tier, and what unlocks next.
// Tier thresholds: hidden(0-24) limited(25-49) standard(50-79) featured(80-100)
// ══════════════════════════════════════════════════════════════

type VisibilityTier = "hidden" | "limited" | "standard" | "featured";

interface ProfileStrengthMeterProps {
    strength: number;               // 0–100
    tier: VisibilityTier;
    nextStep?: {
        step: string;
        reason: string;
        seconds: number;
    };
    compact?: boolean;
    className?: string;
}

const TIER_CONFIG: Record<VisibilityTier, {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    threshold: number;
    nextThreshold: number;
}> = {
    hidden: {
        label: "Not Visible",
        description: "Profile hidden from search",
        color: "text-hc-danger",
        bg: "bg-hc-danger/10",
        border: "border-hc-danger/20",
        icon: Eye,
        threshold: 0,
        nextThreshold: 25,
    },
    limited: {
        label: "Limited",
        description: "May appear in search — reach 50 for Standard",
        color: "text-hc-warning",
        bg: "bg-hc-warning/10",
        border: "border-hc-warning/20",
        icon: ShieldCheck,
        threshold: 25,
        nextThreshold: 50,
    },
    standard: {
        label: "Standard",
        description: "Normal ranking — reach 80 for Featured boost",
        color: "text-hc-success",
        bg: "bg-hc-success/10",
        border: "border-hc-success/20",
        icon: ShieldCheck,
        threshold: 50,
        nextThreshold: 80,
    },
    featured: {
        label: "Featured",
        description: "Priority ranking + Featured badge",
        color: "text-hc-gold-500",
        bg: "bg-hc-gold-500/10",
        border: "border-hc-gold-500/30",
        icon: Star,
        threshold: 80,
        nextThreshold: 100,
    },
};

const TIER_MILESTONES: { score: number; tier: VisibilityTier; label: string }[] = [
    { score: 0, tier: "hidden", label: "0" },
    { score: 25, tier: "limited", label: "25" },
    { score: 50, tier: "standard", label: "50" },
    { score: 80, tier: "featured", label: "80" },
];

export function ProfileStrengthMeter({
    strength,
    tier,
    nextStep,
    compact = false,
    className,
}: ProfileStrengthMeterProps) {
    const cfg = TIER_CONFIG[tier];
    const Icon = cfg.icon;
    const pct = Math.round((strength / 100) * 100);

    // Color of the progress bar based on strength
    const barColor =
        strength >= 80 ? "bg-hc-gold-500" :
            strength >= 50 ? "bg-hc-success" :
                strength >= 25 ? "bg-hc-warning" :
                    "bg-hc-danger";

    if (compact) {
        return (
            <div className={cn("flex items-center gap-3", className)}>
                <div className="flex-1 h-1.5 bg-hc-elevated rounded-full overflow-hidden">
                    <motion.div
                        className={cn("h-full rounded-full", barColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>
                <span className={cn("text-xs font-black tabular-nums", cfg.color)}>{strength}</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", cfg.color)}>{cfg.label}</span>
            </div>
        );
    }

    return (
        <div className={cn("hc-card p-6 space-y-5", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", cfg.bg, cfg.border)}>
                        <Icon className={cn("w-5 h-5", cfg.color)} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-hc-muted uppercase tracking-[0.2em]">Profile Strength</p>
                        <p className={cn("text-sm font-black uppercase tracking-tight", cfg.color)}>{cfg.label}</p>
                    </div>
                </div>
                <div className="text-right">
                    <motion.span
                        key={strength}
                        initial={{ scale: 1.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn("text-4xl font-black tabular-nums", cfg.color)}
                    >
                        {strength}
                    </motion.span>
                    <span className="text-lg font-black text-hc-subtle">/100</span>
                </div>
            </div>

            {/* Progress bar with tier milestones */}
            <div className="space-y-2">
                <div className="relative h-3 bg-hc-elevated rounded-full overflow-hidden">
                    <motion.div
                        className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {/* Tier markers */}
                    {TIER_MILESTONES.filter(m => m.score > 0).map(m => (
                        <div
                            key={m.score}
                            className="absolute top-0 bottom-0 w-px bg-hc-border"
                            style={{ left: `${m.score}%` }}
                        />
                    ))}
                </div>
                {/* Milestone labels */}
                <div className="relative h-4">
                    {TIER_MILESTONES.map(m => (
                        <span
                            key={m.score}
                            className={cn(
                                "absolute text-[9px] font-bold uppercase tracking-widest",
                                strength >= m.score ? cfg.color : "text-hc-subtle"
                            )}
                            style={{ left: `${m.score}%`, transform: m.score > 0 ? "translateX(-50%)" : "none" }}
                        >
                            {m.label}
                        </span>
                    ))}
                    <span className="absolute right-0 text-[9px] font-bold text-hc-subtle">100</span>
                </div>
            </div>

            {/* Tier description */}
            <p className="text-xs text-hc-muted leading-relaxed">{cfg.description}</p>

            {/* Next step CTA */}
            {nextStep && nextStep.step !== "done" && (
                <div className="flex items-start gap-3 p-4 bg-hc-elevated border border-hc-border rounded-xl">
                    <Zap className="w-4 h-4 text-hc-gold-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-hc-text">{nextStep.reason}</p>
                        <p className="text-[10px] text-hc-muted mt-0.5">~{nextStep.seconds}s to complete</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileStrengthMeter;
