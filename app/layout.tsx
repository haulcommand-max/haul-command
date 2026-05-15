import type { Metadata } from 'next';
import './globals.css';
import { DynamicBackgroundEngine } from '@/components/ui/DynamicBackgroundEngine';
import { GlobalCommandBar } from '@/components/layout/GlobalCommandBar';
import { Suspense } from 'react';
import { PwaRegistry } from '@/components/layout/PwaRegistry';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { GoogleTagManager } from '@next/third-parties/google';
import { SignalGridProvider } from '@/components/telematics/SignalGridProvider';
import { SITE_URL } from '@/lib/site-url';
import { TopicHeroRouteSlot } from '@/components/topic-hero/TopicHeroRouteSlot';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | Haul Command Operations',
    default: 'Haul Command | Autonomous Heavy Haul Operating System',
  },
  description: "The world's first fully-autonomous API, Load Board, and verified MSB settlement network for the heavy haul logistics industry.",
  keywords: ['heavy haul load board', 'pilot car directory', 'oversize load routing', 'logistics MSB settlement'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Haul Command Logistics OS',
    description: 'Autonomous Heavy Haul Network',
    url: SITE_URL,
    siteName: 'Haul Command',
    images: [{ url: '/brand/generated/og-1200x630.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/brand/generated/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/generated/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/generated/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/brand/generated/favicon-32.png'],
  },
  // ── Google Search Console Ownership Verification ──
  // Replace with token from: GSC > Settings > Ownership verification > HTML tag
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION_TOKEN
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION_TOKEN }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      {/* Google Tag Manager — manages GA4, ads pixels, and all tags from one UI */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
        <body className="hc-brand-site antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          {/* PostHog — product analytics, session replay, A/B testing */}
          <PostHogProvider>
            <SignalGridProvider>
              <DynamicBackgroundEngine />
              <PwaRegistry />
              <GlobalCommandBar />
              <div className="relative z-10 min-h-screen">
                <TopicHeroRouteSlot />
                {children}
              </div>
            </SignalGridProvider>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
