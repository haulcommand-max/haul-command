import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './haul-command-background.css';
import { DynamicBackgroundEngine } from '@/components/ui/DynamicBackgroundEngine';
import { GlobalCommandBar } from '@/components/layout/GlobalCommandBar';
import { Suspense } from 'react';
import { PwaRegistry } from '@/components/layout/PwaRegistry';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { GoogleTagManager } from '@next/third-parties/google';
import { SignalGridProvider } from '@/components/telematics/SignalGridProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Haul Command',
    default: 'Haul Command | Heavy Haul Operating System — Pilot Cars, Load Board & Escort Directory',
  },
  description: "Find verified pilot car operators and escort vehicles for oversize loads across 120 countries. Load board, permit tools, rate guides, and heavy haul dispatch — all in one platform.",
  keywords: ['heavy haul load board', 'pilot car directory', 'oversize load escort', 'PEVO certification', 'pilot car operator', 'escort vehicle directory', 'heavy haul permits'],
  openGraph: {
    title: 'Haul Command | Heavy Haul Operating System',
    description: 'Find verified pilot car operators for oversize loads. 7,700+ operators, 120 countries, real-time dispatch.',
    url: 'https://haulcommand.com',
    siteName: 'Haul Command',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haul Command — Heavy Haul Operating System',
    description: 'Find verified pilot car operators for oversize loads across 120 countries.',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Haul Command',
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION_TOKEN
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION_TOKEN }
    : undefined,
};

// ── Viewport — mobile-first, prevents zoom on input focus ────────────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,          // Allow user zoom (accessibility) but not auto-zoom
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#f5c64a' },
    { media: '(prefers-color-scheme: light)', color: '#f5c64a' },
  ],
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en">
      {/* Google Tag Manager — manages GA4, ads pixels, and all tags from one UI */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
        <body className={`${inter.className} antialiased`} style={{ color: '#e8e8e8', overflowX: 'hidden' }}>
        <div className="hc-premium-bg hc-living-background-enabled hc-safe-x hc-site-shell">
        <Suspense fallback={null}>
          {/* PostHog — product analytics, session replay, A/B testing */}
          <PostHogProvider>
            <SignalGridProvider>
              <PwaRegistry />
              <GlobalCommandBar />
              <DynamicBackgroundEngine />
              {children}
            </SignalGridProvider>
          </PostHogProvider>
        </Suspense>
        </div>
      </body>
    </html>
  );
}