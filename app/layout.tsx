import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { A2HSPrompt } from "@/components/pwa/A2HSPrompt";
import { HeartbeatMount } from "@/components/presence/HeartbeatMount";
import { FastWinContainer } from "@/components/engagement/FastWinReinforcement";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';

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
    alternates: { canonical: '/' },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://haulcommand.com',
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
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    themeColor: '#0B0B0C',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
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
                        "logo": "https://haulcommand.com/logo.png",
                        "description": "The global operating system for heavy haul. Verified pilot car directory, oversize load board, and corridor intelligence.",
                        "sameAs": [
                            "https://twitter.com/haulcommand",
                            "https://linkedin.com/company/haulcommand",
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer support",
                            "url": "https://haulcommand.com/contact",
                            "areaServed": ["US", "CA", "GB", "AU"],
                            "availableLanguage": "English",
                        },
                    })
                }} />
            </head>
            <body className="bg-hc-bg text-hc-text font-sans antialiased min-h-screen">
                {children}

                <ServiceWorkerRegister />
                <A2HSPrompt />
                <HeartbeatMount />
                <FastWinContainer />
                <Analytics />
                <SpeedInsights />
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                                    send_page_view: false
                                });
                            `}
                        </Script>
                    </>
                )}
            </body>
        </html>
    );
}
