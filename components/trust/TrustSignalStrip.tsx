"use client";

// TrustSignalStrip — compact horizontal badge strip for operator cards
// Signals sourced from driver_profiles + operator_trust_scores
//
// Usage:
//   <TrustSignalStrip
//     verified={profile.verified_badge}
//     twicOnFile={profile.twic_on_file}
//     photoVerified={trustScores.photo_verified}
//     repeatBrokerCount={trustScores.repeat_broker_count}
//     corridorsCovered90d={driverMetrics.corridors_covered_90d}
//     compositeScore={trustScores.composite_score}
//   />

import React from "react";
import { ShieldCheck, Lock, Camera, RefreshCw, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TrustSignalStripProps {
    /** operator is identity-verified */
    verified?: boolean;
    /** TWIC card on file */
    twicOnFile?: boolean;
    /** has at least one verified photo */
    photoVerified?: boolean;
    /** number of brokers who have hired this operator 2+ times */
    repeatBrokerCount?: number;
    /** unique corridors covered in last 90 days (gate pro threshold: ≥ 5) */
    corridorsCovered90d?: number;
    /** composite trust score (0-100) — shown as a numeric chip when present */
    compositeScore?: number;
    /** visual size */
    size?: "sm" | "md";
    className?: string;
}

interface BadgeDef {
    key: string;
    icon: React.ElementType;
    label: string;
    color: string;
    bg: string;
    border: string;
    title: string;
}

export function TrustSignalStrip({
    verified,
    twicOnFile,
    photoVerified,
    repeatBrokerCount = 0,
    corridorsCovered90d = 0,
    compositeScore,
    size = "md",
    className,
}: TrustSignalStripProps) {
    const isGatePro = corridorsCovered90d >= 5;
    const isRepeatBroker = repeatBrokerCount >= 2;

    const badges: BadgeDef[] = [
        verified && {
            key: "verified",
            icon: ShieldCheck,
            label: "Verified",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/25",
            title: "Identity verified by Haul Command",
        },
        twicOnFile && {
            key: "twic",
            icon: Lock,
            label: "TWIC",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/25",
            title: "TWIC card on file — cleared for port / terminal access",
        },
        photoVerified && {
            key: "photo",
            icon: Camera,
            label: "Photo Verified",
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            border: "border-violet-500/25",
            title: "Equipment photos verified",
        },
        isRepeatBroker && {
            key: "repeat",
            icon: RefreshCw,
            label: `${repeatBrokerCount}× Brokers`,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/25",
            title: `Hired again by ${repeatBrokerCount} different brokers`,
        },
        isGatePro && {
            key: "gate",
            icon: DoorOpen,
            label: "Gate Pro",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/25",
            title: `Active on ${corridorsCovered90d} corridors in last 90 days`,
        },
    ].filter(Boolean) as BadgeDef[];

    if (badges.length === 0 && compositeScore == null) return null;

    const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
    const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";
    const px = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";

    return (
        <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
            {/* Trust score chip — leading position */}
            {compositeScore != null && compositeScore > 0 && (
                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full border font-black tabular-nums",
                        px, textSize,
                        compositeScore >= 75
                            ? "text-hc-gold-400 bg-hc-gold-400/10 border-hc-gold-400/25"
                            : compositeScore >= 50
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                                : "text-zinc-400 bg-zinc-800/50 border-zinc-700/50"
                    )}
                    title={`Trust score: ${Math.round(compositeScore)}/100`}
                >
                    {Math.round(compositeScore)}
                    <span className="font-normal opacity-60">/ 100</span>
                </span>
            )}

            {/* Signal badges */}
            {badges.map(({ key, icon: Icon, label, color, bg, border, title }) => (
                <span
                    key={key}
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full border font-semibold",
                        px, textSize, color, bg, border
                    )}
                    title={title}
                >
                    <Icon className={iconSize} />
                    {label}
                </span>
            ))}
        </div>
    );
}
