import React from "react";
import { MobileAppNav } from "@/components/mobile/MobileAppNav";
import { FastWinContainer } from "@/components/engagement/FastWinReinforcement";
import { A2HSPrompt } from "@/components/pwa/A2HSPrompt";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// /app Mobile Shell Layout — Haul Command v4
// Canonical entrypoint for the PWA + mobile app experience.
// No sidebar. Full-height. Unified MobileAppNav always visible.
// Safe area insets for notched phones.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function AppShellLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className={[
                " bg-white text-gray-900 flex flex-col",
                // Safe area padding for notched devices
                "pt-[env(safe-area-inset-top)]",
            ].join(" ")}
        >
            {/* Content area — scrollable, padded above bottom nav */}
            <main className="flex-1 overflow-y-auto pb-[calc(60px+env(safe-area-inset-bottom))]">
                {children}
            </main>

            {/* Unified mobile bottom nav — ONE component across entire app */}
            <MobileAppNav />

            {/* Fast win toast container */}
            <FastWinContainer />

            {/* PWA install prompt */}
            <A2HSPrompt />
        </div>
    );
}