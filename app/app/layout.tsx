import React from "react";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { FastWinContainer } from "@/components/engagement/FastWinReinforcement";
import { A2HSPrompt } from "@/components/pwa/A2HSPrompt";

// ══════════════════════════════════════════════════════════════
// /app Mobile Shell Layout — Haul Command v4
// Canonical entrypoint for the PWA + mobile app experience.
// No sidebar. Full-height. MobileBottomNav always visible.
// Safe area insets for notched phones.
// ══════════════════════════════════════════════════════════════

export default function AppShellLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className={[
                "min-h-screen bg-hc-bg flex flex-col",
                // Safe area padding for notched devices
                "pt-[env(safe-area-inset-top)]",
            ].join(" ")}
        >
            {/* Content area — scrollable, padded above bottom nav */}
            <main className="flex-1 overflow-y-auto pb-[calc(60px+env(safe-area-inset-bottom))]">
                {children}
            </main>

            {/* Always-visible mobile bottom nav */}
            <MobileBottomNav />

            {/* Fast win toast container */}
            <FastWinContainer />

            {/* PWA install prompt */}
            <A2HSPrompt />
        </div>
    );
}
