import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-homepage-fixes.css';
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
    template: '%s | Haul Command Operations',
    default: 'Haul Command | Autonomous Heavy Haul Operating System',
  },
  description: "The world's first fully-autonomous API, Load Board, and verified MSB settlement network for the heavy haul logistics industry.",
  keywords: ['heavy haul load board', 'pilot car directory', 'oversize load routing', 'logistics MSB settlement'],
  openGraph: {
    title: 'Haul Command Logistics OS',
    description: 'Autonomous Heavy Haul Network',
    url: 'https://haulcommand.com',
    siteName: 'Haul Command',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  manifest: '/manifest.json',
  // ── Google Search Console Ownership Verification ──
  // Replace with token from: GSC > Settings > Ownership verification > HTML tag
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION_TOKEN
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION_TOKEN }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en">
      {/* Google Tag Manager — manages GA4, ads pixels, and all tags from one UI */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
        <body className={`${inter.className} antialiased`} style={{ color: '#e8e8e8', backgroundColor: '#090706' }}>
        <div className="hc-premium-bg hc-living-background-enabled">
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
