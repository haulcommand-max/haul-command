import Image from 'next/image';
import Link from 'next/link';
import EnhancedFooter from '@/components/layout/EnhancedFooter';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';
import { MobileNavSheet } from '@/components/layout/MobileNavSheet';
import { BRAND_NAME_UPPER, LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';
import CartAbandonmentRetargeter from '@/components/growth/CartAbandonmentRetargeter';
import { GlobalOmniSearch } from '@/components/ui/GlobalOmniSearch';
/**
 * (public) Layout — Unified app shell for public-facing pages.
 * Mobile: same MobileAppNav as (app) layout — ONE bottom nav system.
 * Desktop: sidebar + top header.
 *
 * RULE: EnhancedFooter is desktop-only. Mobile gets bottom nav, no footer.
 * RULE: Same MobileAppNav as (app)/layout.tsx — no competing nav components.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Responsive styles — Tailwind content scan misses (public) route group on Windows */}
            <style>{`
                .app-sidebar { display: none; position: fixed; height: 100%; z-index: 20; width: 16rem; flex-direction: column; background: var(--hc-bg); border-right: 1px solid var(--hc-border); }
                .app-main { flex: 1; min-height: 100dvh; display: flex; flex-direction: column; margin-left: 0; }
                .app-mobile-header { display: flex; position: sticky; top: 0; z-index: 20; align-items: center; justify-content: space-between; }
                .app-desktop-header { display: none; }
                .app-desktop-footer { display: none; }
                @media (min-width: 768px) {
                    .app-sidebar { display: flex; }
                    .app-main { margin-left: 16rem; }
                    .app-mobile-header { display: none; }
                    .app-desktop-header { display: flex; }
                    .app-desktop-footer { display: block; }
                }
            `}</style>

            {/* Fixed Sidebar (desktop only) */}
            <aside className="app-sidebar">
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Image
                        src={LOGO_MARK_SRC}
                        alt={ALT_TEXT}
                        width={32}
                        height={32}
                        className="flex-shrink-0"
                        style={{ objectFit: 'contain' }}
                    />
                    <span className="font-bold" style={{ fontSize: '1.125rem', letterSpacing: '-0.025em', color: 'var(--hc-gold-500)' }}>
                        {BRAND_NAME_UPPER}
                    </span>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--hc-gold-500)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', padding: '0 0.5rem' }}>
                        Core OS
                    </div>
                    {[
                        { href: '/loads', label: '📋 Oversize Load Board' },
                        { href: '/map', label: '🗺 Live Map' },
                        { href: '/directory', label: '🔍 Pilot Car Directory' },
                        { href: '/available-now', label: '⏱️ Available Now' },
                        { href: '/reposition', label: '🛣️ Repositioning' },
                        { href: '/estimate', label: '⚡ Instant Quote' },
                        { href: '/leaderboards', label: '🏆 Leaderboard' },
                        { href: '/corridor', label: '📊 Corridors' },
                    ].map(link => (
                        <Link aria-label="Navigation Link" key={link.href} href={link.href}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem', color: '#6b7280', transition: 'all 0.15s' }}>
                            {link.label}
                        </Link>
                    ))}

                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1.5rem', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                        Free Tools
                    </div>
                    {[
                        { href: '/tools', label: '🔧 All Tools' },
                        { href: '/glossary', label: '📖 HC Glossary' },
                        { href: '/regulations', label: '⚖️ Regulations' },
                        { href: '/blog', label: '📝 Blog & Intel' },
                        { href: '/resources', label: '📚 Resource Hub' },
                        { href: '/rates', label: '💵 Pilot Car Rates' },
                        { href: '/tools/permit-calculator', label: '🧮 Permit Calculator' },
                        { href: '/tools/rate-lookup', label: '💰 Rate Lookup' },
                        { href: '/map/route-check', label: '🗺️ Route Check' },
                    ].map(link => (
                        <Link aria-label="Navigation Link" key={link.href} href={link.href}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem', color: '#9CA3AF', transition: 'all 0.15s' }}>
                            {link.label}
                        </Link>
                    ))}

                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1.5rem', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                        Intelligence
                    </div>
                    <Link aria-label="Navigation Link" href="/data"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem', color: '#D4A843', transition: 'all 0.15s' }}>
                        📊 Data Marketplace
                    </Link>
                    <Link aria-label="Navigation Link" href="/advertise"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem', color: '#D4A843', transition: 'all 0.15s' }}>
                        📣 Advertise
                    </Link>

                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '1.5rem', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                        Payments
                    </div>
                    <Link aria-label="Navigation Link" href="/escrow/checkout"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem', color: '#9CA3AF', transition: 'all 0.15s' }}>
                        💳 Escrow Checkout
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="app-main">
                {/* Mobile brand header (hidden on desktop) — SAME as (app) layout */}
                <div
                    className="app-mobile-header safe-area-header"
                    style={{
                        minHeight: '52px',
                        paddingLeft: 'var(--m-screen-pad, 16px)',
                        paddingRight: 'var(--m-screen-pad, 16px)',
                        borderBottom: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
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
                    {/* Hamburger + full nav sheet */}
                    <MobileNavSheet />
                </div>

                {/* Mobile Search Bar (under the brand header but above content) */}
                <div className="app-mobile-search md:hidden px-4 py-2 bg-slate-950 border-b border-slate-800">
                    <GlobalOmniSearch />
                </div>

                {/* Desktop header bar */}
                <header className="app-desktop-header" style={{
                    height: '4rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1.5rem',
                    background: 'rgba(11,11,12,0.85)',
                    backdropFilter: 'blur(24px) saturate(1.5)',
                }}>
                    <div style={{ flex: 1, paddingRight: '2rem' }}>
                        <GlobalOmniSearch />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: '9999px', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: '#22C55E', boxShadow: '0 0 8px #4CAF50' }} />
                        <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            All Systems Operational
                        </span>
                    </div>
                </header>

                {/* Content area — padded for mobile bottom nav */}
                <div className="m-shell-content" style={{ position: 'relative', zIndex: 0, flex: 1 }}>
                    {children}
                </div>

                {/* Desktop footer only — HIDDEN on mobile via .app-desktop-footer CSS */}
                <div className="app-desktop-footer">
                    <EnhancedFooter />
                </div>

                {/* Unified mobile bottom nav — SAME component as (app)/layout.tsx */}
                <MobileAppNav />
            </main>
            
            {/* Global Growth Tooling */}
            <CartAbandonmentRetargeter />
        </>
    );
}
