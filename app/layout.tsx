import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DynamicBackgroundEngine } from '@/components/ui/DynamicBackgroundEngine';
import { GlobalNavOverlay } from '@/components/layout/GlobalNavOverlay';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Haul Command Operations',
    default: 'Haul Command | Autonomous Heavy Haul Operating System',
  },
  description: 'The world\'s first fully-autonomous API, Load Board, and verified MSB settlement network for the heavy haul logistics industry.',
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
};

import { PwaRegistry } from '@/components/layout/PwaRegistry';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white antialiased`} style={{ background: '#0F1318' }}>
        <Suspense fallback={null}>
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        </Suspense>
        <PwaRegistry />
        <GlobalNavOverlay />
        <DynamicBackgroundEngine />
        {children}
      </body>
    </html>
  );
}