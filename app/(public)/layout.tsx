import React from 'react';
import { HCGlobalHeader } from '@/components/landing-system/navigation/HCGlobalHeader';
import { HCFooterShell } from '@/components/landing-system/footer/HCFooterShell';
import { HCMobileMenu } from '@/components/landing-system/mobile-menu/HCMobileMenu';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';
import { BRAND_NAME_UPPER, LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';
import CartAbandonmentRetargeter from '@/components/growth/CartAbandonmentRetargeter';
import Image from 'next/image';
import Link from 'next/link';

/**
 * (public) Layout — Unified app shell for public-facing pages.
 * Mobile: same MobileAppNav as (app) layout.
 * Desktop: Global Header.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <style>{`
                .app-main { flex: 1; min-height: 100dvh; display: flex; flex-direction: column; margin-left: 0; }
                .app-mobile-header { display: flex; position: sticky; top: 0; z-index: 40; align-items: center; justify-content: space-between; }
                .app-desktop-header { display: none; }
                .app-desktop-footer { display: none; }
                @media (min-width: 1024px) {
                    .app-mobile-header { display: none; }
                    .app-desktop-header { display: block; position: sticky; top: 0; z-index: 40; }
                    .app-desktop-footer { display: block; }
                }
            `}</style>
            
            <main className="app-main bg-hc-bg bg-industrial-noise text-slate-100 scrollbar-hide">
                <div className="absolute inset-0 bg-grid-white/5 pointer-events-none" />
                {/* Desktop Global Header */}
                <div className="app-desktop-header">
                    <HCGlobalHeader mode="public" />
                </div>

                {/* Mobile brand header */}
                <div
                    className="app-mobile-header safe-area-header"
                    style={{
                        minHeight: '56px',
                        paddingLeft: 'var(--m-screen-pad, 16px)',
                        paddingRight: 'var(--m-screen-pad, 16px)',
                        borderBottom: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
                        background: 'rgba(5,5,8,0.92)',
                        backdropFilter: 'blur(20px) saturate(1.4)',
                    }}
                >
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Image
                            src={LOGO_MARK_SRC}
                            alt={ALT_TEXT}
                            width={28}
                            height={28}
                            priority
                            className="flex-shrink-0"
                            style={{ objectFit: 'contain', display: 'block' }}
                        />
                        <span style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1, color: 'var(--hc-gold-500)' }}>
                            {BRAND_NAME_UPPER}
                        </span>
                    </Link>
                    {/* Unified Mobile Menu */}
                    <HCMobileMenu mode="public" />
                </div>


                {/* Content area */}
                <div className="m-shell-content flex-1 flex flex-col relative z-0">
                    {children}
                </div>

                {/* Desktop footer only */}
                <div className="app-desktop-footer  border-t border-slate-800">
                    <HCFooterShell mode="public" />
                </div>

                {/* Unified mobile bottom nav */}
                <MobileAppNav />
            </main>
            
            <CartAbandonmentRetargeter />
        </>
    );
}