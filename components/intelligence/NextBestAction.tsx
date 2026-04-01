"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
    Radio, List, CheckCircle2, AlertTriangle,
    PlusCircle, ArrowRight, Zap,
} from "lucide-react";
import { HCButton } from "@/components/ui/hc-button";

// ══════════════════════════════════════════════════════════════
// NextBestAction — Haul Command v4
// Computes ONE primary action per context. No menus. No noise.
// Blue-collar guardrail: single dispatch button, always visible.
// ══════════════════════════════════════════════════════════════

type Role = "escort" | "broker";
type EscortStatus = "available" | "busy" | "offline";

interface NextBestActionProps {
    role: Role;
    // Escort-specific
    availabilityStatus?: EscortStatus;
    openLoadsNearby?: number;
    hasActiveJob?: boolean;
    corridorHeat?: "low" | "building" | "hot";
    // Broker-specific
    atRiskLoads?: number;
    unfilledLoads?: number;
    avgFillMinutes?: number;
    // Layout
    compact?: boolean;
    className?: string;
}

// ── Action definitions ───────────────────────────────────────
interface Action {
    icon: React.ElementType;
    headline: string;
    subline: string;
    cta: string;
    href: string;
    variant: "dispatch" | "primary" | "ghost";
    urgency: "critical" | "high" | "normal" | "idle";
}

function computeEscortAction(props: Omit<NextBestActionProps, "role">): Action {
    const { availabilityStatus, openLoadsNearby = 0, hasActiveJob, corridorHeat } = props;

    if (hasActiveJob) {
        return {
            icon: CheckCircle2,
            headline: "Job In Progress",
            subline: "Mark complete when the load is delivered.",
            cta: "Mark Complete",
            href: "/profile?action=markComplete",
            variant: "primary",
            urgency: "normal",
        };
    }

    if (availabilityStatus === "offline") {
        return {
            icon: Radio,
            headline: "Go Live — Loads Need Pilots",
            subline: corridorHeat === "hot"
                ? "Your corridor is hot. Brokers are waiting."
                : "Toggle available and start receiving offers.",
            cta: "Set Available Now",
            href: "/profile?action=setAvailable",
            variant: "dispatch",
            urgency: "critical",
        };
    }

    if (availabilityStatus === "available" && openLoadsNearby > 0) {
        return {
            icon: Zap,
            headline: `${openLoadsNearby} Load${openLoadsNearby !== 1 ? "s" : ""} Near You`,
            subline: "Tap to see loads matched to your location and capabilities.",
            cta: "View Nearby Loads",
            href: "/loads?filter=nearby",
            variant: "primary",
            urgency: "high",
        };
    }

    if (availabilityStatus === "available") {
        return {
            icon: List,
            headline: "You're Live — Stay Ready",
            subline: "New loads will notify you instantly. Browse the board anytime.",
            cta: "Browse Load Board",
            href: "/loads",
            variant: "ghost",
            urgency: "idle",
        };
    }

    // busy but no active job tracked
    return {
        icon: CheckCircle2,
        headline: "Currently Busy",
        subline: "Mark your job complete when finished to go available again.",
        cta: "Update Status",
        href: "/profile?action=updateStatus",
        variant: "ghost",
        urgency: "normal",
    };
}

function computeBrokerAction(props: Omit<NextBestActionProps, "role">): Action {
    const { atRiskLoads = 0, unfilledLoads = 0, avgFillMinutes } = props;

    if (atRiskLoads > 0) {
        return {
            icon: AlertTriangle,
            headline: `${atRiskLoads} Load${atRiskLoads !== 1 ? "s" : ""} Need Attention`,
            subline: "Fill probability has dropped. Boost rate or widen window now.",
            cta: `Fix ${atRiskLoads} At-Risk Load${atRiskLoads !== 1 ? "s" : ""}`,
            href: "/loads?filter=at_risk",
            variant: "dispatch",
            urgency: "critical",
        };
    }

    if (unfilledLoads > 0) {
        return {
            icon: List,
            headline: `${unfilledLoads} Open Load${unfilledLoads !== 1 ? "s" : ""} Matching`,
            subline: avgFillMinutes
                ? `Avg fill time: ${avgFillMinutes} min. Escorts standing by.`
                : "Escorts are available. Check your open loads.",
            cta: "View Open Loads",
            href: "/loads?filter=open",
            variant: "primary",
            urgency: "high",
        };
    }

    return {
        icon: PlusCircle,
        headline: "Post Your Next Load",
        subline: "Instant match with verified escorts. Under 2 minutes to post.",
        cta: "Post a Load",
        href: "/loads/post",
        variant: "primary",
        urgency: "normal",
    };
}

// ── Urgency ring colors ──────────────────────────────────────
const URGENCY_RING: Record<string, string> = {
    critical: "border-hc-gold-500/40 shadow-dispatch",
    high: "border-hc-border-high",
    normal: "border-hc-border",
    idle: "border-hc-border-bare",
};

const URGENCY_ICON_BG: Record<string, string> = {
    critical: "bg-hc-gold-500/20 text-hc-gold-500",
    high: "bg-hc-gold-500/10 text-hc-gold-400",
    normal: "bg-hc-elevated text-hc-muted",
    idle: "bg-hc-elevated text-hc-subtle",
};

// ── Main Component ───────────────────────────────────────────
export function NextBestAction({ role, compact = false, className, ...props }: NextBestActionProps) {
    const action = role === "escort"
        ? computeEscortAction(props)
        : computeBrokerAction(props);

    const Icon = action.icon;

    if (compact) {
        // Compact mode: inline strip (for use in secondary surfaces)
        return (
            <div className={cn(
                "flex items-center gap-3 hc-card p-3",
                URGENCY_RING[action.urgency],
                className,
            )}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", URGENCY_ICON_BG[action.urgency])}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-hc-text truncate">{action.headline}</p>
                    <p className="text-xs text-hc-muted truncate">{action.subline}</p>
                </div>
                <Link href={action.href}>
                    <HCButton variant={action.variant} size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        {action.cta}
                    </HCButton>
                </Link>
            </div>
        );
    }

    // Full mode: hero card (for primary surfaces — above fold on mobile)
    return (
        <div className={cn(
            "hc-card p-5 relative overflow-hidden",
            URGENCY_RING[action.urgency],
            action.urgency === "critical" && "animate-glow-ring",
            className,
        )}>
            {/* Subtle gold glow for critical urgency */}
            {action.urgency === "critical" && (
                <div className="absolute inset-0 bg-radial-gold-glow opacity-25 pointer-events-none" />
            )}

            <div className="relative z-10">
                {/* Icon + label */}
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", URGENCY_ICON_BG[action.urgency])}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {action.urgency === "critical" && (
                        <span className="text-[10px] font-black text-hc-gold-500 uppercase tracking-widest">
                            Action Required
                        </span>
                    )}
                </div>

                {/* Headline */}
                <h3 className="text-xl font-black text-hc-text tracking-tight mb-1">
                    {action.headline}
                </h3>
                <p className="text-sm text-hc-muted mb-4 leading-relaxed">
                    {action.subline}
                </p>

                {/* Single CTA — always full width on mobile */}
                <Link href={action.href} className="block">
                    <HCButton
                        variant={action.variant}
                        size="lg"
                        fullWidth
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                        {action.cta}
                    </HCButton>
                </Link>
            </div>
        </div>
    );
}

export default NextBestAction;
