"use client";

/**
 * SubscriberGate — Wraps trust surfaces with upgrade prompts
 *
 * When a viewer lacks access, this component renders a blur overlay
 * with a contextual upgrade CTA instead of the gated content.
 *
 * Usage:
 *   <SubscriberGate visibility={vis} surface="report_card">
 *     <OperatorReportCard ... />
 *   </SubscriberGate>
 */

import React from "react";
import Link from "next/link";
import { Lock, Eye, Zap, Crown, ArrowRight } from "lucide-react";
import {
    type ResolvedVisibility,
    UPGRADE_PROMPTS,
} from "@/lib/trust/visibility-resolver";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type GatedSurface =
    | "report_card"
    | "media"
    | "subscriber_media"
    | "contact"
    | "compare"
    | "trust_insights";

interface SubscriberGateProps {
    /** Resolved visibility from useVisibility hook */
    visibility: ResolvedVisibility;
    /** Which trust surface is being gated */
    surface: GatedSurface;
    /** Content to render when access is granted */
    children: React.ReactNode;
    /** Optional override for CTA text */
    ctaText?: string;
    /** Optional override for upgrade URL */
    upgradeUrl?: string;
    /** Whether to show a blurred teaser of children */
    showBlurredTeaser?: boolean;
    /** Compact mode for inline gates */
    compact?: boolean;
    /** Custom className */
    className?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// ACCESS CHECKER
// ════════════════════════════════════════════════════════════════════════════

function hasAccess(vis: ResolvedVisibility, surface: GatedSurface): boolean {
    switch (surface) {
        case "report_card":
            return vis.can_view_report_card;
        case "media":
            return vis.can_view_media;
        case "subscriber_media":
            return vis.can_view_subscriber_media;
        case "contact":
            return vis.can_view_contact;
        case "compare":
            return vis.tier === "paid" || vis.tier === "admin" || vis.tier === "claimed_owner";
        case "trust_insights":
            return vis.tier === "paid" || vis.tier === "admin" || vis.tier === "claimed_owner";
        default:
            return false;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SURFACE CONFIG
// ════════════════════════════════════════════════════════════════════════════

interface SurfaceConfig {
    icon: React.ElementType;
    title: string;
    message: string;
    ctaDefault: string;
    accentColor: string;
}

const SURFACE_CONFIG: Record<GatedSurface, SurfaceConfig> = {
    report_card: {
        icon: Eye,
        title: "Report Card Hidden",
        message: UPGRADE_PROMPTS.hidden_report_card,
        ctaDefault: "Unlock Full Report Card",
        accentColor: "#F1A91B",
    },
    media: {
        icon: Lock,
        title: "Media Restricted",
        message: "This operator's media gallery requires a verified account.",
        ctaDefault: "Unlock Media Gallery",
        accentColor: "#3B82F6",
    },
    subscriber_media: {
        icon: Crown,
        title: "Subscriber Content",
        message: UPGRADE_PROMPTS.subscriber_media,
        ctaDefault: "Upgrade to View Setup Details",
        accentColor: "#8B5CF6",
    },
    contact: {
        icon: Zap,
        title: "Contact Info Protected",
        message: "Create a free account to access operator contact details.",
        ctaDefault: "Sign Up to Contact",
        accentColor: "#10B981",
    },
    compare: {
        icon: Eye,
        title: "Compare Mode Locked",
        message: UPGRADE_PROMPTS.compare_mode,
        ctaDefault: "Upgrade to Compare",
        accentColor: "#F1A91B",
    },
    trust_insights: {
        icon: Crown,
        title: "Deep Trust Insights",
        message: UPGRADE_PROMPTS.trust_insights,
        ctaDefault: "Unlock Trust Intelligence",
        accentColor: "#F1A91B",
    },
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function SubscriberGate({
    visibility,
    surface,
    children,
    ctaText,
    upgradeUrl = "/pricing",
    showBlurredTeaser = true,
    compact = false,
    className = "",
}: SubscriberGateProps) {
    // Access granted — render children directly
    if (hasAccess(visibility, surface)) {
        return <>{children}</>;
    }

    const config = SURFACE_CONFIG[surface];
    const Icon = config.icon;
    const isAnonymous = visibility.tier === "anonymous";
    const resolvedCtaText = ctaText || config.ctaDefault;
    const resolvedUrl = isAnonymous ? "/auth/login" : upgradeUrl;

    // ── Compact inline gate ──
    if (compact) {
        return (
            <div className={`relative ${className}`}>
                {showBlurredTeaser && (
                    <div className="blur-[6px] pointer-events-none select-none opacity-40">
                        {children}
                    </div>
                )}
                <div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                >
                    <Link
                        href={resolvedUrl}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
                        style={{
                            background: `${config.accentColor}20`,
                            color: config.accentColor,
                            border: `1px solid ${config.accentColor}40`,
                        }}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {resolvedCtaText}
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        );
    }

    // ── Full gate overlay ──
    return (
        <div className={`relative rounded-2xl overflow-hidden ${className}`}>
            {/* Blurred teaser */}
            {showBlurredTeaser && (
                <div className="blur-[8px] pointer-events-none select-none opacity-30">
                    {children}
                </div>
            )}

            {/* Overlay */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center"
                style={{
                    background: "linear-gradient(135deg, rgba(0,0,0,0.85), rgba(10,10,10,0.9))",
                    backdropFilter: "blur(8px)",
                }}
            >
                {/* Icon */}
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{
                        background: `${config.accentColor}15`,
                        border: `1px solid ${config.accentColor}30`,
                    }}
                >
                    <Icon className="w-6 h-6" style={{ color: config.accentColor }} />
                </div>

                {/* Title */}
                <h3 className="text-base font-black text-white uppercase tracking-[0.15em] mb-2">
                    {config.title}
                </h3>

                {/* Message */}
                <p className="text-sm text-[#888] max-w-sm mb-6 leading-relaxed">
                    {config.message}
                </p>

                {/* Tier-specific messaging */}
                {isAnonymous && (
                    <p className="text-[10px] text-[#555] mb-4 uppercase tracking-wider">
                        Create a free account to see more
                    </p>
                )}
                {visibility.tier === "free" && (
                    <p className="text-[10px] text-[#555] mb-4 uppercase tracking-wider">
                        Paid subscribers get full access
                    </p>
                )}

                {/* CTA Button */}
                <Link
                    href={resolvedUrl}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 hover:-translate-y-0.5"
                    style={{
                        background: config.accentColor,
                        color: "#000",
                        boxShadow: `0 0 20px ${config.accentColor}30`,
                    }}
                >
                    {resolvedCtaText}
                    <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Secondary link */}
                {isAnonymous && (
                    <Link
                        href="/auth/register"
                        className="mt-3 text-xs underline underline-offset-2 transition-colors hover:text-white"
                        style={{ color: config.accentColor }}
                    >
                        No account? Sign up free
                    </Link>
                )}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// INLINE UPGRADE BANNER
// ════════════════════════════════════════════════════════════════════════════

interface UpgradeBannerProps {
    tier: string;
    surface?: GatedSurface;
    className?: string;
}

/**
 * Inline upgrade banner — shows at the bottom of a section
 * when more content is available with upgrade.
 */
export function InlineUpgradeBanner({
    tier,
    surface = "trust_insights",
    className = "",
}: UpgradeBannerProps) {
    if (tier === "paid" || tier === "admin" || tier === "claimed_owner") return null;

    const config = SURFACE_CONFIG[surface];
    const isAnonymous = tier === "anonymous";
    const url = isAnonymous ? "/auth/login" : "/pricing";

    return (
        <div
            className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${className}`}
            style={{
                background: `${config.accentColor}08`,
                borderColor: `${config.accentColor}20`,
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <config.icon className="w-4 h-4 flex-shrink-0" style={{ color: config.accentColor }} />
                <span className="text-xs text-[#888] truncate">{config.message}</span>
            </div>
            <Link
                href={url}
                className="flex-shrink-0 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105"
                style={{
                    background: `${config.accentColor}15`,
                    color: config.accentColor,
                    border: `1px solid ${config.accentColor}30`,
                }}
            >
                Upgrade
            </Link>
        </div>
    );
}
