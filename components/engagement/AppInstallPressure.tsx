"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Download, Bell, Zap, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

/* ──────────────────────────────────────────────────── */
/*  APP DOWNLOAD URL — single source of truth           */
/* ──────────────────────────────────────────────────── */
const APP_URL = "https://haulcommand.com/app";
const IOS_URL = "https://apps.apple.com/app/haulcommand";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.haulcommand";

/* ──────────────────────────────────────────────────── */
/*  1. HEADER MINI-BANNER                               */
/*  Thin gold bar at top of directory pages             */
/* ──────────────────────────────────────────────────── */
export function AppBannerHeader() {
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const d = localStorage.getItem("hc_app_banner_dismissed");
        if (d) setDismissed(true);
    }, []);

    const dismiss = () => {
        setDismissed(true);
        localStorage.setItem("hc_app_banner_dismissed", Date.now().toString());
    };

    if (dismissed) return null;

    return (
        <div className="bg-gradient-to-r from-[#F1A91B] to-[#e09500] text-black text-center py-2 px-4 relative z-50 flex items-center justify-center gap-3">
            <Bell className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs font-bold tracking-wide">
                Get load alerts first — <a href={APP_URL} className="underline underline-offset-2 hover:no-underline">Install the app</a>
            </p>
            <button onClick={dismiss} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

/* ──────────────────────────────────────────────────── */
/*  2. MOBILE STICKY BOTTOM BAR                         */
/*  Non-intrusive bottom bar on mobile only             */
/* ──────────────────────────────────────────────────── */
export function AppStickyBar() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Only on mobile
        if (typeof window === "undefined" || window.innerWidth > 768) return;
        const d = localStorage.getItem("hc_sticky_bar_dismissed");
        if (d && Date.now() - parseInt(d) < 7 * 24 * 60 * 60 * 1000) return; // 7-day cooldown

        const show = () => {
            if (window.scrollY > 300) setVisible(true);
        };
        window.addEventListener("scroll", show, { passive: true });
        return () => window.removeEventListener("scroll", show);
    }, []);

    const dismiss = () => {
        setDismissed(true);
        localStorage.setItem("hc_sticky_bar_dismissed", Date.now().toString());
    };

    if (dismissed || !visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#F1A91B]/20 p-3 flex items-center gap-3 animate-slide-up">
            <div className="w-10 h-10 bg-[#F1A91B] rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Instant match alerts</p>
                <p className="text-[10px] text-[#888]">Get notified before the competition</p>
            </div>
            <a
                href={APP_URL}
                className="bg-[#F1A91B] text-black text-xs font-black px-4 py-2 rounded-lg hover:bg-[#f0b93a] transition-colors whitespace-nowrap"
            >
                Install
            </a>
            <button onClick={dismiss} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" aria-label="Close">
                <X className="w-3.5 h-3.5 text-[#666]" />
            </button>
        </div>
    );
}

/* ──────────────────────────────────────────────────── */
/*  3. SCROLL-DEPTH / EXIT-INTENT MODAL                 */
/*  Shows after 60% scroll depth on mobile,             */
/*  or exit-intent on desktop. 7-day cooldown.          */
/* ──────────────────────────────────────────────────── */
export function AppInstallModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const lastShown = localStorage.getItem("hc_install_modal_shown");
        if (lastShown && Date.now() - parseInt(lastShown) < 7 * 24 * 60 * 60 * 1000) return;

        const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

        if (isMobile) {
            // Scroll-depth trigger (60%)
            const handler = () => {
                const scrollPct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
                if (scrollPct > 0.6) {
                    setOpen(true);
                    window.removeEventListener("scroll", handler);
                }
            };
            window.addEventListener("scroll", handler, { passive: true });
            return () => window.removeEventListener("scroll", handler);
        } else {
            // Exit-intent trigger (desktop)
            const handler = (e: MouseEvent) => {
                if (e.clientY < 10) {
                    setOpen(true);
                    document.removeEventListener("mouseout", handler);
                }
            };
            document.addEventListener("mouseout", handler);
            return () => document.removeEventListener("mouseout", handler);
        }
    }, []);

    const close = () => {
        setOpen(false);
        localStorage.setItem("hc_install_modal_shown", Date.now().toString());
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={close}>
            <div
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-3xl p-8 max-w-sm w-full relative animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={close} className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full" aria-label="Close">
                    <X className="w-4 h-4 text-[#666]" />
                </button>

                <div className="w-16 h-16 bg-[#F1A91B]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Download className="w-8 h-8 text-[#F1A91B]" />
                </div>

                <h3 className="text-xl font-black text-white text-center mb-2">Get Haul Command</h3>
                <p className="text-sm text-[#888] text-center mb-6">
                    Instant load alerts. Saved corridors. Real-time rank updates. Everything faster in the app.
                </p>

                <div className="space-y-3 mb-6">
                    {[
                        { icon: Bell, text: "Get alerts before the competition" },
                        { icon: MapPin, text: "Save corridors for instant access" },
                        { icon: Trophy, text: "Track your rank in real-time" },
                    ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-[#F1A91B] flex-shrink-0" />
                            <span className="text-xs text-[#ccc]">{text}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <a href={IOS_URL} className="flex-1 bg-[#F1A91B] text-black text-xs font-black py-3 rounded-xl text-center hover:bg-[#f0b93a] transition-colors">
                        iOS
                    </a>
                    <a href={ANDROID_URL} className="flex-1 bg-white/5 text-white text-xs font-bold py-3 rounded-xl text-center border border-[#1a1a1a] hover:bg-white/10 transition-colors">
                        Android
                    </a>
                </div>

                <button onClick={close} className="block w-full text-center text-[10px] text-[#555] mt-4 hover:text-[#888] transition-colors">
                    Maybe later
                </button>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────── */
/*  4. INLINE CTA CARDS                                 */
/*  Drop into any page — tools, city, claim success     */
/* ──────────────────────────────────────────────────── */
interface AppCtaProps {
    headline?: string;
    subtext?: string;
    variant?: "default" | "tools" | "claim" | "city";
}

const CTA_COPY: Record<string, { headline: string; subtext: string }> = {
    default: { headline: "Get instant alerts", subtext: "Load matches delivered to your phone before anyone else." },
    tools: { headline: "Run this faster in the app", subtext: "Route IQ, height checks, and rate intel — all offline-ready." },
    claim: { headline: "Get notified in the app", subtext: "Push alerts for loads, views, and broker inquiries in your corridor." },
    city: { headline: "Save this corridor", subtext: "Get alerts when new loads drop in this area." },
};

export function AppCtaCard({ headline, subtext, variant = "default" }: AppCtaProps) {
    const copy = CTA_COPY[variant];
    return (
        <div className="bg-[#0a0a0a] border border-[#F1A91B]/15 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F1A91B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-[#F1A91B]" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-white">{headline || copy.headline}</p>
                <p className="text-xs text-[#888] mt-0.5">{subtext || copy.subtext}</p>
            </div>
            <a href={APP_URL} className="bg-[#F1A91B] text-black text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#f0b93a] transition-colors whitespace-nowrap">
                Install →
            </a>
        </div>
    );
}
