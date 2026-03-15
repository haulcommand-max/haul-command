import type { Metadata, Viewport } from 'next';
import './globals.css';
import './mobile.css';
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { A2HSPrompt } from "@/components/pwa/A2HSPrompt";
import { HeartbeatMount } from "@/components/presence/HeartbeatMount";
import { FastWinContainer } from "@/components/engagement/FastWinReinforcement";
import { NativeBootstrap } from "@/components/mobile/NativeBootstrap";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import PostHogProvider from "@/components/providers/PostHogProvider";
import { AuthStatusBanner } from "@/components/dev/AuthStatusBanner";
import SmartAppBanner from "@/components/growth/SmartAppBanner";

// ═══════════════════════════════════════════════════════════════
// ROOT LAYOUT — Minimal shell only.
// Renders <html>, <body>, global providers, analytics.
// NO sidebar. NO nav. NO footer. NO mobile bottom nav.
// UI chrome lives in route-group layouts:
//   (landing)/layout.tsx → marketing header + footer
//   (app)/layout.tsx     → sidebar + mobile nav (future)
//   (public)/layout.tsx  → public page chrome (future)
// ═══════════════════════════════════════════════════════════════

export const metadata: Metadata = {
    title: {
        default: 'Haul Command | The Operating System for Heavy Haul',
        template: '%s | Haul Command',
    },
    description: 'The #1 pilot car directory & load board for oversize loads. Find verified escort vehicles, post loads, and match with professional pilots across the US & Canada. Real-time intelligence, escrow payments, and industry leaderboard.',
    keywords: [
        'pilot car services', 'escort vehicle services', 'oversize load escorts',
        'wide load escorts', 'pilot car directory', 'pilot car near me',
        'escort vehicle near me', 'heavy haul escort', 'oversize load permit',
        'pilot car load board', 'escort vehicle load board', 'route survey services',
        'height pole services', 'police escort services', 'oversize load shipping',
        'pilot car company', 'escort car company', 'Haul Command',
    ],
    authors: [{ name: 'Haul Command' }],
    creator: 'Haul Command',
    publisher: 'Haul Command',
    metadataBase: new URL('https://haulcommand.com'),
    alternates: {
        canonical: '/',
        languages: {
            // Tier A — Gold (10)
            'en-US': 'https://haulcommand.com',
            'en-CA': 'https://haulcommand.com/ca',
            'en-AU': 'https://haulcommand.com/au',
            'en-GB': 'https://haulcommand.com/gb',
            'en-NZ': 'https://haulcommand.com/nz',
            'en-ZA': 'https://haulcommand.com/za',
            'de-DE': 'https://haulcommand.com/de',
            'nl-NL': 'https://haulcommand.com/nl',
            'ar-AE': 'https://haulcommand.com/ae',
            'pt-BR': 'https://haulcommand.com/br',
            // Tier B — Blue (15)
            'en-IE': 'https://haulcommand.com/ie',
            'sv-SE': 'https://haulcommand.com/se',
            'nb-NO': 'https://haulcommand.com/no',
            'da-DK': 'https://haulcommand.com/dk',
            'fi-FI': 'https://haulcommand.com/fi',
            'nl-BE': 'https://haulcommand.com/be',
            'de-AT': 'https://haulcommand.com/at',
            'de-CH': 'https://haulcommand.com/ch',
            'es-ES': 'https://haulcommand.com/es',
            'fr-FR': 'https://haulcommand.com/fr',
            'it-IT': 'https://haulcommand.com/it',
            'pt-PT': 'https://haulcommand.com/pt',
            'ar-SA': 'https://haulcommand.com/sa',
            'ar-QA': 'https://haulcommand.com/qa',
            'es-MX': 'https://haulcommand.com/mx',
            // Tier C — Silver (24)
            'pl-PL': 'https://haulcommand.com/pl',
            'cs-CZ': 'https://haulcommand.com/cz',
            'sk-SK': 'https://haulcommand.com/sk',
            'hu-HU': 'https://haulcommand.com/hu',
            'sl-SI': 'https://haulcommand.com/si',
            'et-EE': 'https://haulcommand.com/ee',
            'lv-LV': 'https://haulcommand.com/lv',
            'lt-LT': 'https://haulcommand.com/lt',
            'hr-HR': 'https://haulcommand.com/hr',
            'ro-RO': 'https://haulcommand.com/ro',
            'bg-BG': 'https://haulcommand.com/bg',
            'el-GR': 'https://haulcommand.com/gr',
            'tr-TR': 'https://haulcommand.com/tr',
            'ar-KW': 'https://haulcommand.com/kw',
            'ar-OM': 'https://haulcommand.com/om',
            'ar-BH': 'https://haulcommand.com/bh',
            'en-SG': 'https://haulcommand.com/sg',
            'ms-MY': 'https://haulcommand.com/my',
            'ja-JP': 'https://haulcommand.com/jp',
            'ko-KR': 'https://haulcommand.com/kr',
            'es-CL': 'https://haulcommand.com/cl',
            'es-AR': 'https://haulcommand.com/ar',
            'es-CO': 'https://haulcommand.com/co',
            'es-PE': 'https://haulcommand.com/pe',
            // Tier D — Slate (3)
            'es-UY': 'https://haulcommand.com/uy',
            'es-PA': 'https://haulcommand.com/pa',
            'es-CR': 'https://haulcommand.com/cr',
            // x-default fallback
            'x-default': 'https://haulcommand.com',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://haulcommand.com',
        siteName: 'Haul Command',
        title: 'Haul Command — Real-Time Escort Intelligence for Heavy Haul',
        description: 'Find verified pilot cars & escort vehicles. Post loads. Get matched in minutes. The #1 oversize load operating system.',
        images: [{ url: '/brand/generated/og-1200x630.png', width: 1200, height: 630, alt: 'Haul Command' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Haul Command — Real-Time Escort Intelligence for Heavy Haul',
        description: 'Find verified pilot cars & escort vehicles. Post loads. Get matched in minutes.',
        images: ['/brand/generated/og-1200x630.png'],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    icons: {
        icon: [
            { url: '/icons/app/icon-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icons/app/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
        shortcut: '/icons/app/icon-64.png',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#0B0B0C',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover', // PATCH-002: Required for env(safe-area-inset-*) to work
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Haul Command",
                        "url": "https://haulcommand.com",
                        "logo": "https://haulcommand.com/brand/logo.svg",
                        "description": "The global operating system for heavy haul. Verified pilot car directory, oversize load board, and corridor intelligence.",
                        "sameAs": [
                            "https://twitter.com/haulcommand",
                            "https://linkedin.com/company/haulcommand",
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer support",
                            "url": "https://haulcommand.com/contact",
                            "areaServed": ["US", "CA", "GB", "AU", "NZ", "ZA", "DE", "NL", "AE", "BR", "IE", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "ES", "FR", "IT", "PT", "SA", "QA", "MX", "PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "TR", "KW", "OM", "BH", "SG", "MY", "JP", "KR", "CL", "AR", "CO", "PE", "UY", "PA", "CR"],
                            "availableLanguage": ["English", "Spanish", "French", "German", "Portuguese", "Dutch", "Italian", "Arabic", "Japanese", "Korean", "Turkish", "Polish"],
                        },
                    })
                }} />
            </head>
            <body className="bg-hc-bg text-hc-text font-sans antialiased" style={{ minHeight: '100dvh' }}>
                <SmartAppBanner />
                <PostHogProvider>
                    {children}
                </PostHogProvider>

                <ServiceWorkerRegister />
                <A2HSPrompt />
                <HeartbeatMount />
                <FastWinContainer />
                <NativeBootstrap />
                <Analytics />
                <SpeedInsights />
                <AuthStatusBanner />
            </body>
        </html>
    );
}
