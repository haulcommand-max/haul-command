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
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { SessionDNATracker } from "@/components/security/SessionDNATracker";
import CaptureOverlay from "@/components/capture/CaptureOverlay";
import { CookieConsent } from "@/components/legal/CookieConsent";
import PushConsentModal from "@/components/push/PushConsentModal";
import { StickyMobileChipRail } from "@/components/ads/StickyMobileChipRail";
import { getHouseAds } from "@/lib/ads/house-ads";
import { GlobalCommandBar } from "@/components/layout/GlobalCommandBar";
import BetaWaitlistModal from "@/components/capture/BetaWaitlistModal";

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
        default: 'Haul Command | Global Pilot Car Directory & Heavy Haul Escorts',
        template: '%s | Haul Command',
    },
    description: 'The #1 pilot car and escort vehicle directory for oversize loads. Find verified operators across 120 countries. Real-time intelligence, escrow payments, and industry leaderboard.',
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
    metadataBase: new URL('https://www.haulcommand.com'),
    alternates: {
        canonical: 'https://www.haulcommand.com',
        languages: {
            // Tier A — Gold (10)
            'en-US': 'https://www.haulcommand.com',
            'en-CA': 'https://www.haulcommand.com/ca',
            'en-AU': 'https://www.haulcommand.com/au',
            'en-GB': 'https://www.haulcommand.com/gb',
            'en-NZ': 'https://www.haulcommand.com/nz',
            'en-ZA': 'https://www.haulcommand.com/za',
            'de-DE': 'https://www.haulcommand.com/de',
            'nl-NL': 'https://www.haulcommand.com/nl',
            'ar-AE': 'https://www.haulcommand.com/ae',
            'pt-BR': 'https://www.haulcommand.com/br',
            // Tier B — Blue (15)
            'en-IE': 'https://www.haulcommand.com/ie',
            'sv-SE': 'https://www.haulcommand.com/se',
            'nb-NO': 'https://www.haulcommand.com/no',
            'da-DK': 'https://www.haulcommand.com/dk',
            'fi-FI': 'https://www.haulcommand.com/fi',
            'nl-BE': 'https://www.haulcommand.com/be',
            'de-AT': 'https://www.haulcommand.com/at',
            'de-CH': 'https://www.haulcommand.com/ch',
            'es-ES': 'https://www.haulcommand.com/es',
            'fr-FR': 'https://www.haulcommand.com/fr',
            'it-IT': 'https://www.haulcommand.com/it',
            'pt-PT': 'https://www.haulcommand.com/pt',
            'ar-SA': 'https://www.haulcommand.com/sa',
            'ar-QA': 'https://www.haulcommand.com/qa',
            'es-MX': 'https://www.haulcommand.com/mx',
            // Tier C — Silver (24)
            'pl-PL': 'https://www.haulcommand.com/pl',
            'cs-CZ': 'https://www.haulcommand.com/cz',
            'sk-SK': 'https://www.haulcommand.com/sk',
            'hu-HU': 'https://www.haulcommand.com/hu',
            'sl-SI': 'https://www.haulcommand.com/si',
            'et-EE': 'https://www.haulcommand.com/ee',
            'lv-LV': 'https://www.haulcommand.com/lv',
            'lt-LT': 'https://www.haulcommand.com/lt',
            'hr-HR': 'https://www.haulcommand.com/hr',
            'ro-RO': 'https://www.haulcommand.com/ro',
            'bg-BG': 'https://www.haulcommand.com/bg',
            'el-GR': 'https://www.haulcommand.com/gr',
            'tr-TR': 'https://www.haulcommand.com/tr',
            'ar-KW': 'https://www.haulcommand.com/kw',
            'ar-OM': 'https://www.haulcommand.com/om',
            'ar-BH': 'https://www.haulcommand.com/bh',
            'en-SG': 'https://www.haulcommand.com/sg',
            'ms-MY': 'https://www.haulcommand.com/my',
            'ja-JP': 'https://www.haulcommand.com/jp',
            'ko-KR': 'https://www.haulcommand.com/kr',
            'es-CL': 'https://www.haulcommand.com/cl',
            'es-AR': 'https://www.haulcommand.com/ar',
            'es-CO': 'https://www.haulcommand.com/co',
            'es-PE': 'https://www.haulcommand.com/pe',
            // Tier D — Slate (25)
            'es-UY': 'https://www.haulcommand.com/uy',
            'es-PA': 'https://www.haulcommand.com/pa',
            'es-CR': 'https://www.haulcommand.com/cr',
            'he-IL': 'https://www.haulcommand.com/il',
            'en-NG': 'https://www.haulcommand.com/ng',
            'ar-EG': 'https://www.haulcommand.com/eg',
            'sw-KE': 'https://www.haulcommand.com/ke',
            'fr-MA': 'https://www.haulcommand.com/ma',
            'sr-RS': 'https://www.haulcommand.com/rs',
            'uk-UA': 'https://www.haulcommand.com/ua',
            'kk-KZ': 'https://www.haulcommand.com/kz',
            'zh-TW': 'https://www.haulcommand.com/tw',
            'ur-PK': 'https://www.haulcommand.com/pk',
            'bn-BD': 'https://www.haulcommand.com/bd',
            // Tier E — Copper (representative)
            'es-BO': 'https://www.haulcommand.com/bo',
            'es-GT': 'https://www.haulcommand.com/gt',
            'sq-AL': 'https://www.haulcommand.com/al',
            'ar-IQ': 'https://www.haulcommand.com/iq',
            'am-ET': 'https://www.haulcommand.com/et',
            // x-default fallback
            'x-default': 'https://www.haulcommand.com',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://www.haulcommand.com',
        siteName: 'Haul Command',
        title: 'Haul Command — Real-Time Escort Intelligence for Heavy Haul',
        description: 'Find verified pilot cars & escort vehicles. Post loads. Get matched in minutes. The #1 oversize load operating system.',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Haul Command' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Haul Command — Real-Time Escort Intelligence for Heavy Haul',
        description: 'Find verified pilot cars & escort vehicles. Post loads. Get matched in minutes.',
        images: ['/og-image.png'],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    verification: {
        google: '6zs87JY2SjNbpsR',
    },
    // Icons: Next.js auto-detects app/icon.png and app/apple-icon.png convention files.
    // Do NOT specify manual paths here — they conflict with the convention files.
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#0B0B0C',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
};

import { RoleProvider } from "@/lib/role-context";
import { GlobalBackground } from "@/app/_components/GlobalBackground";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preload" as="image" href="/hero-command-center.png" fetchPriority="high" />
                <link rel="preload" as="image" href="/og-image.png" fetchPriority="low" />
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Haul Command",
                        "url": "https://www.haulcommand.com",
                        "logo": "https://www.haulcommand.com/logo.png",
                        "description": "The operating system for heavy haul — the world's largest directory of pilot car operators, escort vehicles, and oversize load transport professionals across 120 countries.",
                        "additionalType": "https://schema.org/SoftwareApplication",
                        "sameAs": [
                            "https://x.com/haulcommand",
                            "https://linkedin.com/company/haulcommand",
                            "https://instagram.com/haulcommand",
                            "https://facebook.com/haulcommand",
                            "https://www.facebook.com/groups/pilotcarjobs",
                            "https://www.youtube.com/@haulcommand",
                            "https://www.tiktok.com/@haulcommand",
                            "https://www.crunchbase.com/organization/haul-command"
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer service",
                            "availableLanguage": ["English", "Spanish", "French", "German", "Portuguese", "Japanese", "Arabic"]
                        },
                        "areaServed": {
                            "@type": "GeoShape",
                            "description": "120 countries worldwide"
                        },
                        "foundingDate": "2024",
                        "knowsLanguage": ["en", "es", "fr", "de", "pt", "ja", "ar", "nl", "sv", "fi"],
                        "numberOfEmployees": {
                            "@type": "QuantitativeValue",
                            "minValue": 1,
                            "maxValue": 10
                        },
                        "knowsAbout": [
                            "Pilot Car Operations",
                            "Escort Vehicle Services",
                            "Oversize Load Transport",
                            "Heavy Haul Logistics",
                            "Superload Permits",
                            "Route Surveys",
                            "Escort Vehicle Certification",
                            "DOT Compliance",
                            "Frost Law Tracking",
                            "Cross-Border Escort Compliance"
                        ]
                    })
                }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Haul Command",
                        "url": "https://www.haulcommand.com",
                        "description": "The operating system for heavy haul — find pilot cars, escort vehicles, and oversize load professionals worldwide.",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": {
                                "@type": "EntryPoint",
                                "urlTemplate": "https://www.haulcommand.com/directory?q={search_term_string}"
                            },
                            "query-input": "required name=search_term_string"
                        }
                    })
                }} />
                {/* SpeakableSpecification → Voice Search Eligibility */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Haul Command — The Operating System for Heavy Haul",
                        "url": "https://www.haulcommand.com",
                        "speakable": {
                            "@type": "SpeakableSpecification",
                            "cssSelector": [".speakable-headline", ".speakable-summary", "h1", "[data-speakable]"],
                        },
                    })
                }} />
                {/* OpenSearch — Browser Search Integration */}
                <link rel="search" type="application/opensearchdescription+xml" title="Haul Command" href="/api/opensearch" />
                {/* RSS Feed For Syndication */}
                <link rel="alternate" type="application/rss+xml" title="Haul Command | Heavy Haul Intelligence" href="/feed.xml" />
                {/* Inbound Authority Machine — Tracking Pixels */}
                <AnalyticsProvider />
            </head>
            <body className="bg-hc-bg text-hc-text font-sans antialiased" style={{ minHeight: '100dvh' }}>
                <RoleProvider>
                    <GlobalBackground />
                    <SmartAppBanner />
                    
                    <GlobalCommandBar />

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
                    <SessionDNATracker />
                    {/* CaptureOverlay was replaced per User directive causing a dark blank issue */}
                    {/* <CaptureOverlay /> */}
                    <BetaWaitlistModal />
                    <PushConsentModal />
                    <CookieConsent />
                    <StickyMobileChipRail ads={getHouseAds({ limit: 4 })} />
                </RoleProvider>
            </body>
        </html>
    );
}
