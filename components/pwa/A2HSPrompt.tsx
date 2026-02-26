"use client";

import React, { useEffect, useState } from "react";

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

    useEffect(() => {
        // Don't show if already installed or already dismissed this session
        if (
            dismissed ||
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
    }, [dismissed]);

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
                <div className="w-10 h-10 bg-hc-gold-500/15 rounded-xl flex items-center justify-center shrink-0 border border-hc-gold-500/20">
                    <span className="text-base font-black text-hc-gold-500">HC</span>
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
