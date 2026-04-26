import React from 'react';
import { HCFooterShell } from '@/components/landing-system/footer/HCFooterShell';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';
import CartAbandonmentRetargeter from '@/components/growth/CartAbandonmentRetargeter';

/**
 * (public) Layout — Shell for public-facing pages.
 *
 * Navigation provided by GlobalCommandBar (root layout) — NO duplicate header here.
 * This layout adds: page background + desktop footer + mobile bottom tab nav.
 *
 * Fixed P1 #9: Removed HCGlobalHeader + HCMobileMenu which stacked on top of
 * GlobalCommandBar causing two sticky nav bars and double mobile menus.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <main className="text-gray-100 scrollbar-hide min-h-screen flex flex-col">
                {/* Page content */}
                <div className="flex-1 flex flex-col relative z-0">
                    {children}
                </div>

                {/* Desktop footer */}
                <div className="border-t border-[#C6923A]/15">
                    <HCFooterShell mode="public" />
                </div>

                {/* Mobile bottom tab nav (hidden on desktop via MobileAppNav internal CSS) */}
                <MobileAppNav />
            </main>

            <CartAbandonmentRetargeter />
        </>
    );
}