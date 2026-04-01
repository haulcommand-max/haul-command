'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Star } from 'lucide-react';
import { track } from '@/lib/telemetry';

/* ──────────────────────────────────────────────────── */
/*  Smart App Banner                                     */
/*  Shows iOS / Android install prompt on web pages       */
/*  Respects dismissed state via localStorage            */
/* ──────────────────────────────────────────────────── */

interface SmartAppBannerProps {
    /** Override default text */
    title?: string;
    /** Override CTA button text */
    cta?: string;
    /** App Store URL */
    appStoreUrl?: string;
    /** Play Store URL */
    playStoreUrl?: string;
    /** Theme variant */
    variant?: 'dark' | 'light';
}

const DISMISS_KEY = 'hc_app_banner_dismiss';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
}

function isNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).Capacitor?.isNativePlatform?.();
}

function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        (window.matchMedia?.('(display-mode: standalone)')?.matches) ||
        (window.navigator as any).standalone === true
    );
}

export default function SmartAppBanner({
    title = 'Haul Command',
    cta = 'Open',
    appStoreUrl = 'https://apps.apple.com/app/haul-command/id0000000000',
    playStoreUrl = 'https://play.google.com/store/apps/details?id=com.haulcommand.app',
    variant = 'dark',
}: SmartAppBannerProps) {
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
    const pathname = usePathname();

    // Suppress on core operational flows — top banner must never push content on these routes
    const SUPPRESSED_ROUTES = ['/directory', '/inbox', '/loads', '/claim', '/login', '/place', '/map', '/home'];
    const isSuppressed = SUPPRESSED_ROUTES.some(r => pathname?.startsWith(r));

    useEffect(() => {
        // Don't show in native app, standalone PWA, or on suppressed routes
        if (isNativeApp() || isStandalone() || isSuppressed) return;

        // Check dismissal
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const ts = parseInt(dismissedAt, 10);
            if (Date.now() - ts < DISMISS_TTL_MS) return;
            localStorage.removeItem(DISMISS_KEY);
        }

        // Detect platform
        if (isIOS()) {
            setPlatform('ios');
            setVisible(true);
        } else if (isAndroid()) {
            setPlatform('android');
            setVisible(true);
        }
        // Don't show on desktop
    }, []);

    useEffect(() => {
        if (visible) {
            track('app_banner_shown' as any, {
                metadata: { platform },
            });
        }
    }, [visible, platform]);

    if (!visible) return null;

    const storeUrl = platform === 'ios' ? appStoreUrl : playStoreUrl;
    const storeName = platform === 'ios' ? 'App Store' : 'Google Play';

    const handleOpen = () => {
        track('app_banner_clicked' as any, {
            metadata: { platform, action: 'open' },
        });
        window.location.href = storeUrl;
    };

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
        track('app_banner_clicked' as any, {
            metadata: { platform, action: 'dismiss' },
        });
    };

    const isDark = variant === 'dark';

    return (
        <div
            className={`
                fixed top-0 left-0 right-0 z-[9999]
                flex items-center gap-3 px-4 py-2.5
                ${isDark
                    ? 'bg-slate-900/95 border-b border-slate-700/50 text-white'
                    : 'bg-white/95 border-b border-slate-200 text-slate-900'
                }
                backdrop-blur-md shadow-lg
                animate-in slide-in-from-top duration-300
            `}
            role="banner"
            aria-label="Download app"
        >
            {/* Dismiss */}
            <button
                onClick={handleDismiss}
                className={`shrink-0 p-1 rounded-full transition-colors ${isDark
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>

            {/* App Icon */}
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-black">HC</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                    <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-current" />
                        ))}
                    </div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        FREE — {storeName}
                    </span>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={handleOpen}
                className="shrink-0 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm rounded-full transition-colors shadow-sm"
            >
                {cta}
            </button>
        </div>
    );
}
