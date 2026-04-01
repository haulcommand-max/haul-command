'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Truck, Wrench, User } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// MOBILE BOTTOM TAB NAVIGATION — 5-tab bar
// Fixes the 10-item top nav overflow on mobile (Audit C1, C7)
// Standard mobile pattern aligned with native app conventions
// ══════════════════════════════════════════════════════════════

const TABS = [
    { href: '/', label: 'Home', icon: Home, match: ['/'] },
    { href: '/directory', label: 'Directory', icon: Search, match: ['/directory', '/near'] },
    { href: '/loads', label: 'Loads', icon: Truck, match: ['/loads', '/jobs'] },
    { href: '/tools', label: 'Tools', icon: Wrench, match: ['/tools', '/rates', '/requirements'] },
    { href: '/login', label: 'Account', icon: User, match: ['/login', '/onboarding', '/settings', '/profile', '/claim'] },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    const isActive = (tab: typeof TABS[number]) => {
        if (tab.href === '/' && pathname === '/') return true;
        if (tab.href === '/') return false;
        return tab.match.some(m => pathname.startsWith(m));
    };

    return (
        <>
            {/* Spacer so content isn't hidden behind fixed nav */}
            <div className="mobile-nav-spacer" />

            <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
                {TABS.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`mobile-bottom-nav-item ${active ? 'mobile-bottom-nav-item--active' : ''}`}
                        >
                            <Icon className="mobile-bottom-nav-icon" />
                            <span className="mobile-bottom-nav-label">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style>{`
                /* Only visible on mobile (< 768px) */
                .mobile-bottom-nav {
                    display: none;
                }
                .mobile-nav-spacer {
                    display: none;
                }

                @media (max-width: 767px) {
                    .mobile-bottom-nav {
                        display: flex;
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        z-index: 9999;
                        background: rgba(11, 11, 12, 0.95);
                        backdrop-filter: blur(20px) saturate(180%);
                        -webkit-backdrop-filter: blur(20px) saturate(180%);
                        border-top: 1px solid rgba(255, 255, 255, 0.06);
                        padding: 6px 0 max(6px, env(safe-area-inset-bottom));
                        justify-content: space-around;
                        align-items: center;
                    }
                    .mobile-nav-spacer {
                        display: block;
                        height: calc(60px + env(safe-area-inset-bottom, 0px));
                    }
                    .mobile-bottom-nav-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 2px;
                        padding: 4px 0;
                        min-width: 56px;
                        min-height: 44px; /* WCAG tap target */
                        text-decoration: none;
                        transition: color 0.15s ease;
                        color: #5A6577;
                    }
                    .mobile-bottom-nav-item--active {
                        color: #F1A91B;
                    }
                    .mobile-bottom-nav-icon {
                        width: 20px;
                        height: 20px;
                    }
                    .mobile-bottom-nav-label {
                        font-size: 10px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }
                }
            `}</style>
        </>
    );
}
