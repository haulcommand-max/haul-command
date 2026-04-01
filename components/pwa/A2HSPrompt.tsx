"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// ══════════════════════════════════════════════════════════════
// A2HSPrompt — Add to Home Screen PWA install banner
// Shows on mobile when the app is installable (beforeinstallprompt).
// Appears once per session after 30s of engagement.
// Dismissable. Styled with HC tokens.
// ══════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function A2HSPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const pathname = usePathname();

    // Suppress on core operational flows — never obscure browse/transact
    const SUPPRESSED_ROUTES = ['/directory', '/inbox', '/loads', '/claim', '/login', '/place', '/map'];
    const isSuppressed = SUPPRESSED_ROUTES.some(r => pathname?.startsWith(r));

    useEffect(() => {
        // Don't show if already installed, dismissed, or on suppressed route
        if (
            dismissed ||
            isSuppressed ||
            window.matchMedia("(display-mode: standalone)").matches ||
            sessionStorage.getItem("a2hs_dismissed")
        ) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show banner after 30s engagement
            setTimeout(() => setVisible(true), 30_000);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [dismissed, isSuppressed]);

    if (!visible || !deferredPrompt) return null;

    async function handleInstall() {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setVisible(false);
        setDeferredPrompt(null);
    }

    function handleDismiss() {
        setVisible(false);
        setDismissed(true);
        sessionStorage.setItem("a2hs_dismissed", "1");
    }

    return (
        <div className="fixed bottom-[72px] left-4 right-4 z-50 max-w-sm mx-auto">
            <div className="hc-card p-4 flex items-center gap-3 shadow-elevated border-hc-gold-500/30">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/generated/pwa-icon-192.png" alt="Haul Command" width={40} height={40} className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-hc-text leading-tight">Install Haul Command</p>
                    <p className="text-xs text-hc-muted">Add to home screen for instant access</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleDismiss}
                        className="text-hc-subtle hover:text-hc-muted transition-colors text-lg leading-none px-1"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                    <button
                        onClick={handleInstall}
                        className="px-3 py-1.5 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg text-xs font-black uppercase tracking-wider rounded-lg transition-colors"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}

export default A2HSPrompt;
