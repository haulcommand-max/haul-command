import type { Metadata, Viewport } from 'next';
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import EnhancedFooter from '@/components/layout/EnhancedFooter';
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { A2HSPrompt } from "@/components/pwa/A2HSPrompt";
import { HeartbeatMount } from "@/components/presence/HeartbeatMount";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { FastWinContainer } from "@/components/engagement/FastWinReinforcement";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { BRAND_NAME_UPPER, LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';

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
        title: 'Haul Command — The Intelligence Layer for Heavy Haul',
        description: 'Find verified pilot cars & escort vehicles. Post loads. Get matched in minutes. The #1 oversize load operating system for the US & Canada.',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Haul Command' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Haul Command — The Intelligence Layer for Heavy Haul',
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
                {/* Sitewide Organization schema — entity registration for AI + SERP */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Haul Command",
                        "url": "https://haulcommand.com",
                        "logo": "https://haulcommand.com/logo.png",
                        "description": "The North American operating system for heavy haul. Verified pilot car directory, oversize load board, and corridor intelligence for the US and Canada.",
                        "sameAs": [
                            "https://twitter.com/haulcommand",
                            "https://linkedin.com/company/haulcommand",
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "contactType": "customer support",
                            "url": "https://haulcommand.com/contact",
                            "areaServed": ["US", "CA"],
                            "availableLanguage": "English",
                        },
                    })
                }} />
            </head>
            <body className="bg-hc-bg text-hc-text font-sans antialiased min-h-screen flex flex-col">

                {/* Fixed Sidebar */}
                <aside className="w-64 bg-hc-bg border-r border-hc-border fixed h-full flex flex-col z-20 hidden md:flex">
                    <div className="p-6 flex items-center gap-3">
                        <Image
                            src={LOGO_MARK_SRC}
                            alt={ALT_TEXT}
                            width={32}
                            height={32}
                            className="flex-shrink-0"
                            style={{ objectFit: 'contain' }}
                        />
                        <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--hc-gold-500)' }}>{BRAND_NAME_UPPER}</span>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1">
                        <div className="text-xs font-semibold text-hc-command-gold tracking-widest uppercase mb-4 px-2">Core OS</div>
                        {[
                            { href: '/loads', label: '📋 Load Board' },
                            { href: '/map', label: '🗺 Live Map' },
                            { href: '/directory', label: '🔍 Directory' },
                            { href: '/leaderboards', label: '🏆 Leaderboard' },
                            { href: '/escort/corridor', label: '📊 Corridors' },
                        ].map(link => (
                            <Link key={link.href} href={link.href} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-[#1a1a1a] hover:text-white transition-all text-[#6b7280] group">
                                <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                            </Link>
                        ))}

                        <div className="text-xs font-semibold text-[#4b5563] tracking-widest uppercase mt-6 mb-3 px-2">Free Tools</div>
                        {[
                            { href: '/rates', label: '💵 Rate Guides' },
                            { href: '/tools/permit-calculator', label: '🧮 Permit Calculator' },
                            { href: '/tools/rate-lookup', label: '💰 Rate Lookup' },
                        ].map(link => (
                            <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-hc-elevated hover:text-hc-text transition-all text-hc-muted">
                                {link.label}
                            </Link>
                        ))}

                        <div className="text-xs font-semibold text-hc-muted tracking-widest uppercase mt-6 mb-3 px-2">Payments</div>
                        {[
                            { href: '/escrow/checkout', label: '💳 Escrow Checkout' },
                        ].map(link => (
                            <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-hc-elevated hover:text-hc-text transition-all text-hc-muted">
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 m-4 rounded-xl glass-card group cursor-pointer">
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-hc-primary-gold flex items-center justify-center text-hc-command-black font-bold text-sm shadow-[0_0_15px_rgba(241,169,27,0.3)]">
                                OP
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[#d1d5db]">Active Operator</p>
                                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                    {/* Mobile-only brand header — visible below md.
                        min-height: 60px (touch-friendly, intentional not cramped).
                        Logo mark + brand name: single flex cluster, consistent 10px gap, baseline-centered. */}
                    <div
                        className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b"
                        style={{
                            minHeight: '60px',
                            paddingLeft: '20px',
                            paddingRight: '20px',
                            borderColor: 'rgba(255,255,255,0.06)',
                            background: 'rgba(11,11,12,0.97)',
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        {/* Logo cluster — mark + wordmark, always on one line */}
                        <div className="flex items-center gap-2.5">
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
                                className="font-black text-sm tracking-tight leading-none select-none"
                                style={{ color: 'var(--hc-gold-500)', letterSpacing: '-0.01em' }}
                            >
                                {BRAND_NAME_UPPER}
                            </span>
                        </div>
                        {/* Right: status pill — only if real data */}
                        <div
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
                            style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--hc-success)' }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4ade80' }}>Online</span>
                        </div>
                    </div>


                    {/* Desktop header — clean, no debug strings */}
                    <header className="hidden md:flex h-14 border-b border-[rgba(255,255,255,0.06)] glass-panel sticky top-0 z-10 items-center justify-end px-6">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#4CAF50]"></span>
                            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">All Systems Operational</span>
                        </div>
                    </header>

                    <div className="relative z-0 flex-1">
                        {children}
                    </div>

                    <EnhancedFooter />
                    {/* Mobile bottom nav — hidden on md+ */}
                    <MobileBottomNav />
                </main>

                <ServiceWorkerRegister />
                <A2HSPrompt />
                <HeartbeatMount />
                {/* Fast win toast container — works across all routes */}
                <FastWinContainer />
                <Analytics />
                <SpeedInsights />
                {/* GA4 — only loads when NEXT_PUBLIC_GA_ID is set */}
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
