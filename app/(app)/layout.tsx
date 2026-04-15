import React from 'react';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';
import { HCFooterShell } from '@/components/landing-system/footer/HCFooterShell';

/**
 * (app) Layout — Authenticated app shell.
 *
 * Navigation provided by GlobalCommandBar (root layout) — NO duplicate header here.
 * This layout adds: page content + mobile bottom nav.
 *
 * Fixed P1 #9: Removed HCGlobalHeader + HCMobileMenu which stacked on top of
 * GlobalCommandBar causing two sticky nav bars and double mobile menus.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="bg-hc-bg text-slate-100 min-h-screen flex flex-col">
            {/* Content area */}
            <div className="flex-1 flex flex-col relative z-0">
                {children}
            </div>

            {/* App shell uses minimal footer if any */}
            <HCFooterShell mode="app" />

            {/* Mobile bottom nav (hidden on desktop via internal CSS) */}
            <MobileAppNav />
        </main>
    );
}