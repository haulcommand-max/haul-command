import React from "react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// StatusBadge — Haul Command v4
// High-contrast, outdoor-readable, token-only colors.
// Industry terminology: Available | Staged | En Route | Verified
// ══════════════════════════════════════════════════════════════

type StatusVariant =
    | "available"
    | "staged"
    | "en-route"
    | "verified"
    | "compliance"
    | "danger"
    | "warning"
    | "info"
    | "inactive"
    | "boosted";

interface StatusBadgeProps {
    variant: StatusVariant;
    label?: string;
    dot?: boolean;
    pulse?: boolean;
    size?: "sm" | "md";
    className?: string;
}

const VARIANT_CONFIG: Record<StatusVariant, { dot: string; pill: string; default: string }> = {
    available: {
        dot: "bg-hc-success",
        pill: "bg-hc-success/15 text-hc-success border-hc-success/30",
        default: "Available",
    },
    staged: {
        dot: "bg-hc-warning",
        pill: "bg-hc-warning/15 text-hc-warning border-hc-warning/30",
        default: "Staged",
    },
    "en-route": {
        dot: "bg-hc-gold-500",
        pill: "bg-hc-gold-500/15 text-hc-gold-400 border-hc-gold-500/30",
        default: "En Route",
    },
    verified: {
        dot: "bg-hc-success",
        pill: "bg-hc-success/15 text-hc-success border-hc-success/30",
        default: "Verified",
    },
    compliance: {
        dot: "bg-blue-400",
        pill: "bg-blue-500/15 text-blue-400 border-blue-400/30",
        default: "Compliance",
    },
    danger: {
        dot: "bg-hc-danger",
        pill: "bg-hc-danger/15 text-hc-danger border-hc-danger/30",
        default: "Critical",
    },
    warning: {
        dot: "bg-hc-warning",
        pill: "bg-hc-warning/15 text-hc-warning border-hc-warning/30",
        default: "At Risk",
    },
    info: {
        dot: "bg-blue-400",
        pill: "bg-blue-500/10 text-blue-400 border-blue-400/20",
        default: "Info",
    },
    inactive: {
        dot: "bg-hc-subtle",
        pill: "bg-hc-elevated text-hc-muted border-hc-border-bare",
        default: "Inactive",
    },
    boosted: {
        dot: "bg-hc-gold-500",
        pill: "bg-gradient-to-r from-hc-gold-500/20 to-hc-gold-600/10 text-hc-gold-400 border-hc-gold-500/40",
        default: "Boosted",
    },
};

export function StatusBadge({
    variant,
    label,
    dot = true,
    pulse = false,
    size = "sm",
    className,
}: StatusBadgeProps) {
    const config = VARIANT_CONFIG[variant];
    const text = label ?? config.default;
    const textSize = size === "sm" ? "text-xs" : "text-sm";
    const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
    const padding = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-widest",
                config.pill,
                textSize,
                padding,
                className,
            )}
        >
            {dot && (
                <span className={cn("relative flex shrink-0 rounded-full", dotSize)}>
                    {pulse && (
                        <span className={cn(
                            "absolute inset-0 rounded-full animate-ping opacity-75",
                            config.dot,
                        )} />
                    )}
                    <span className={cn("relative rounded-full", dotSize, config.dot)} />
                </span>
            )}
            {text}
        </span>
    );
}

// ── Verification Badge (trust element) ───────────────────────
interface VerificationBadgeProps {
    level?: "verified" | "premium" | "compliance";
    size?: "sm" | "md";
    label?: string;
}

export function VerificationBadge({ level = "verified", size = "sm", label }: VerificationBadgeProps) {
    const config = {
        verified: { pill: "bg-hc-success/15 text-hc-success border-hc-success/30", icon: "✓", default: "Verified" },
        premium: { pill: "bg-hc-gold-500/15 text-hc-gold-400 border-hc-gold-500/30", icon: "★", default: "Premium" },
        compliance: { pill: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: "⬡", default: "Compliant" },
    }[level];

    return (
        <span className={cn(
            "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-widest",
            config.pill,
            size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        )}>
            <span>{config.icon}</span>
            {label ?? config.default}
        </span>
    );
}

export default StatusBadge;
