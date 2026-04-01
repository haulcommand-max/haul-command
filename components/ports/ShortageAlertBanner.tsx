"use client";

// ShortageAlertBanner — Dynamic scarcity CTA for port + corridor pages.
// Shows when demand_score >= threshold (default 70).
// Rule: no fake data — banner only renders when score is backed by real port data.
// Fires: adgrid event 'sponsor_cta_click' on action click.

import React, { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, X } from "lucide-react";

export interface ShortageAlertBannerProps {
    /** Port or corridor identifier */
    entityId: string;
    entityType: "port" | "corridor";
    entityName: string;
    /** Demand score from DB — banner ONLY shows if this is provided and >= threshold */
    demandScore: number;
    /** Score at which to trigger the banner. Default: 70 */
    threshold?: number;
    /** Link target for the CTA */
    ctaHref?: string;
    ctaLabel?: string;
    sessionId?: string;
    className?: string;
}

type Urgency = "critical" | "high" | "moderate";

function getUrgency(score: number, threshold: number): Urgency {
    if (score >= 90) return "critical";
    if (score >= 80) return "high";
    return "moderate";
}

const URGENCY_STYLES: Record<Urgency, {
    bar: string;
    badge: string;
    badgeBg: string;
    badgeBorder: string;
    border: string;
    shadow: string;
}> = {
    critical: {
        bar: "#ef4444",
        badge: "text-red-300",
        badgeBg: "bg-red-500/12",
        badgeBorder: "border-red-500/25",
        border: "border-red-500/20",
        shadow: "shadow-[0_0_20px_rgba(239,68,68,0.08)]",
    },
    high: {
        bar: "#F1A91B",
        badge: "text-amber-300",
        badgeBg: "bg-amber-500/12",
        badgeBorder: "border-amber-500/25",
        border: "border-amber-500/20",
        shadow: "shadow-[0_0_20px_rgba(241,169,27,0.06)]",
    },
    moderate: {
        bar: "#22c55e",
        badge: "text-emerald-300",
        badgeBg: "bg-emerald-500/12",
        badgeBorder: "border-emerald-500/25",
        border: "border-emerald-500/20",
        shadow: "",
    },
};

const URGENCY_LABELS: Record<Urgency, string> = {
    critical: "Shortage Zone",
    high: "High Demand",
    moderate: "Rising Demand",
};

const URGENCY_SUBTEXTS: Record<Urgency, (name: string, type: string) => string> = {
    critical: (n, t) => `Escort supply is critically low on ${t === "port" ? "the" : ""} ${n}. Sponsor your slot now to capture priority placement.`,
    high: (n, t) => `Demand is elevated on ${n}. Sponsored operators are currently getting priority load routing on this ${t}.`,
    moderate: (n, _t) => `${n} is trending. Claim your sponsored slot before competitors do.`,
};

export function ShortageAlertBanner({
    entityId,
    entityType,
    entityName,
    demandScore,
    threshold = 70,
    ctaHref,
    ctaLabel,
    sessionId,
    className = "",
}: ShortageAlertBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const [shown, setShown] = useState(false);

    // Only animate in if score qualifies
    useEffect(() => {
        if (demandScore >= threshold) {
            const t = setTimeout(() => setShown(true), 300);
            return () => clearTimeout(t);
        }
    }, [demandScore, threshold]);

    if (demandScore < threshold || dismissed || !shown) return null;

    const urgency = getUrgency(demandScore, threshold);
    const styles = URGENCY_STYLES[urgency];
    const label = URGENCY_LABELS[urgency];
    const subtext = URGENCY_SUBTEXTS[urgency](entityName, entityType);

    function handleCta() {
        fetch("/api/adgrid/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slot_id: entityType === "port" ? "adgrid_port_hero_sponsor" : "adgrid_port_outbound_corridor_featured",
                event_type: "sponsor_cta_click",
                entity_type: entityType,
                entity_id: entityId,
                session_id: sessionId,
                meta: { demand_score: demandScore, urgency, triggered_by: "shortage_banner" },
            }),
        }).catch(() => { });
    }

    const pressurePct = Math.min(100, ((demandScore - threshold) / (100 - threshold)) * 100);

    return (
        <div
            className={`relative rounded-2xl border overflow-hidden transition-all duration-500 ${styles.border} ${styles.shadow} ${className}`}
            style={{ background: "rgba(0,0,0,0.4)", opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(-4px)" }}
            role="alert"
        >
            {/* Demand pressure bar — top edge */}
            <div className="h-[2px] w-full bg-white/5">
                <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ width: `${pressurePct}%`, background: styles.bar, boxShadow: `0 0 8px ${styles.bar}80` }}
                />
            </div>

            <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${styles.badgeBg} ${styles.badgeBorder}`}>
                        <AlertTriangle className={`w-4 h-4 ${styles.badge}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${styles.badge}`}>
                                {label}
                            </span>
                            <span className="text-[10px] text-white/30 tabular-nums">
                                {demandScore}/100
                            </span>
                        </div>
                        <p className="text-[11px] text-white/55 leading-snug">{subtext}</p>

                        {ctaHref && (
                            <a
                                href={ctaHref}
                                onClick={handleCta}
                                className={`inline-flex items-center gap-1 mt-3 text-[11px] font-bold ${styles.badge} hover:opacity-80 transition-opacity`}
                            >
                                {ctaLabel ?? "Claim Sponsor Slot"}
                                <ChevronRight className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={() => setDismissed(true)}
                        className="shrink-0 text-white/20 hover:text-white/50 transition-colors mt-0.5"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
