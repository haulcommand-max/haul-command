import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';
import { BRAND_NAME_UPPER, LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';
import { HCGlobalHeader } from '@/components/landing-system/navigation/HCGlobalHeader';
import { HCFooterShell } from '@/components/landing-system/footer/HCFooterShell';
import { HCMobileMenu } from '@/components/landing-system/mobile-menu/HCMobileMenu';

/**
 * (app) Layout — App shell with top header + mobile native bottom nav.
 * Mobile: Frame 1 shell (bottom nav + content)
 * Desktop: top header
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <style>{`
                .app-main { flex: 1; min-height: 100dvh; display: flex; flex-direction: column; margin-left: 0; }
                .app-mobile-header { display: flex; position: sticky; top: 0; z-index: 40; align-items: center; justify-content: space-between; }
                .app-desktop-header { display: none; }
                @media (min-width: 1024px) {
                    .app-mobile-header { display: none; }
                    .app-desktop-header { display: block; position: sticky; top: 0; z-index: 40; }
                }
            `}</style>
            
            <main className="app-main bg-slate-950">
                {/* Desktop Global Header */}
                <div className="app-desktop-header">
                    <HCGlobalHeader mode="app" is_authenticated={true} />
                </div>

                {/* Mobile brand header (hidden on desktop) */}
                <div
                    className="app-mobile-header safe-area-header"
                    style={{
                        minHeight: '52px',
                        paddingLeft: 'var(--m-screen-pad)',
                        paddingRight: 'var(--m-screen-pad)',
                        borderBottom: '1px solid var(--m-border-subtle)',
                        background: 'rgba(5,5,8,0.92)',
                        backdropFilter: 'blur(20px) saturate(1.4)',
                    }}
                >
                    <Link aria-label="Navigation Link" href="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Image
                            src={LOGO_MARK_SRC}
                            alt={ALT_TEXT}
                            width={28}
                            height={28}
                            priority
                            className="flex-shrink-0"
                            style={{ objectFit: 'contain', display: 'block' }}
                        />
                        <span
                            style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1, color: 'var(--hc-gold-500)' }}>
                            {BRAND_NAME_UPPER}
                        </span>
                    </Link>
                    <HCMobileMenu mode="app" />
                </div>

                {/* Content area — padded for mobile bottom nav */}
                <div className="m-shell-content" style={{ position: 'relative', zIndex: 0, flex: 1 }}>
                    {children}
                </div>

                {/* App shell uses minimal footer if any - handled inside HCFooterShell (returns null for mode=app) */}
                <HCFooterShell mode="app" />

                {/* Mobile bottom nav (hidden on desktop via CSS) */}
                <MobileAppNav />
            </main>
        </>
    );
}
