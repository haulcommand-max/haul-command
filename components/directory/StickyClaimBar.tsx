/**
 * StickyClaimBar — Persistent "Claim this listing" CTA.
 *
 * On mobile: sticks to bottom of viewport.
 * On desktop: shows inline at top of listing/state page, plus a sticky header
 * version that appears after user scrolls past the fold.
 *
 * Props:
 *   context      — what surface this is on ("listing" | "state" | "category" | "root")
 *   regionName   — e.g. "Florida" (for copy personalization)
 *   claimedBy    — if set, shows claimed state instead of claim CTA
 *   suggestHref  — href for "Suggest an edit" secondary link
 */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ChevronRight, X, Pencil } from "lucide-react";

type ClaimBarContext = "listing" | "state" | "category" | "root";

interface StickyClaimBarProps {
    context?: ClaimBarContext;
    regionName?: string;
    claimedBy?: string | null;
    suggestHref?: string;
    claimHref?: string;
}

export function StickyClaimBar({
    context = "state",
    regionName,
    claimedBy,
    suggestHref = "/claim",
    claimHref = "/claim",
}: StickyClaimBarProps) {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Show sticky bar after scrolling 300px
    useEffect(() => {
        const handler = () => setVisible(window.scrollY > 300);
        window.addEventListener("scroll", handler, { passive: true });
        handler();
        return () => window.removeEventListener("scroll", handler);
    }, []);

    if (dismissed) return null;

    const copy = {
        listing: { headline: "Is this your business?", cta: "Claim this listing", tagline: "Free · Verified in 24 hrs" },
        state: { headline: regionName ? `Operating in ${regionName}?` : "Are you an operator?", cta: "Claim your profile", tagline: "Free · Get matched with loads" },
        category: { headline: "Are you in this space?", cta: "Add your listing", tagline: "Free · Verified in 24 hrs" },
        root: { headline: "Are you a pilot car operator?", cta: "Claim your profile", tagline: "Free forever — no subscription" },
    }[context];

    if (claimedBy) {
        return (
            <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
            >
                <ShieldCheck className="w-4 h-4" />
                Claimed by {claimedBy}
                {suggestHref && (
                    <Link
                        href={suggestHref}
                        className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity ml-2 pl-2 text-white/50"
                        style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
                    >
                        <Pencil className="w-3 h-3" />
                        <span className="text-xs">Suggest edit</span>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <>
            {/* ── Inline bar (always shown at top of section) ───────────────────── */}
            <div
                className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
                style={{
                    background: "rgba(241,169,27,0.06)",
                    border: "1px solid rgba(241,169,27,0.18)",
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(241,169,27,0.15)" }}>
                        <ShieldCheck className="w-4 h-4" style={{ color: "#F1A91B" }} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{copy.headline}</div>
                        <div className="text-[11px] text-white/40 font-medium">{copy.tagline}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {suggestHref && (
                        <Link
                            href={suggestHref}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/50 transition-colors hover:text-white"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                            <Pencil className="w-3 h-3" />
                            Suggest edit
                        </Link>
                    )}
                    <Link
                        href={claimHref}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-black transition-all hover:scale-[1.02]"
                        style={{ background: "#F1A91B" }}
                    >
                        {copy.cta}
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* ── Sticky bottom bar (mobile only, appears on scroll) ─────────────── */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                    }`}
                style={{ padding: "0 0 env(safe-area-inset-bottom)" }}
            >
                <div
                    className="flex items-center justify-between gap-3 px-4 py-3"
                    style={{
                        background: "rgba(9,11,17,0.97)",
                        borderTop: "1px solid rgba(241,169,27,0.25)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white">{copy.headline}</div>
                        <div className="text-[10px] text-white/40">{copy.tagline}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={claimHref}
                            className="px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider text-black"
                            style={{ background: "#F1A91B" }}
                        >
                            {copy.cta}
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white transition-colors"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * ClaimTopBadge — Compact always-visible badge for above-fold placement on listing pages.
 * Does not scroll-trigger — always present.
 */
export function ClaimTopBadge({
    href = "/claim",
    label = "Claim this listing",
}: {
    href?: string;
    label?: string;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wide text-black transition-all hover:scale-[1.02]"
            style={{ background: "#F1A91B", boxShadow: "0 2px 12px rgba(241,169,27,0.3)" }}
        >
            <ShieldCheck className="w-4 h-4" />
            {label}
        </Link>
    );
}
