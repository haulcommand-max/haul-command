import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OrganizationSchema, WebSiteSchema } from "@/components/BreadcrumbSchema";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { RoleProvider } from "@/lib/role-context";
import CookieConsent from "@/components/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://haulcommand.com'),
  title: {
    default: "Haul Command | World's Largest Pilot Car & Escort Vehicle Directory",
    template: "%s | Haul Command",
  },
  description: "Find pilot car operators, escort vehicles, and oversize load professionals across 120 countries. The world's largest directory for heavy haul transport.",
  keywords: [
    // Core
    'pilot car', 'escort vehicle', 'oversize load', 'heavy haul',
    // Intent & Money (Near Me)
    'pilot car near me', 'best escort vehicle operator', 'oversize load escort near me', 'heavy haul pilot car rates', 
    'escort vehicle cost per mile', 'find local pilot car',
    // Future & Autonomous
    'autonomous vehicle escort', 'av test route escort', 'self-driving truck pilot car', 
    // Industry & Compliance
    'route survey', 'superload escort', 'height pole car', 'oversize permit restrictions', 'state curfew pilot car'
  ],
  authors: [{ name: 'Haul Command' }],
  creator: 'Haul Command',
  publisher: 'Haul Command',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://haulcommand.com',
    siteName: 'Haul Command',
    title: "Haul Command | World's Largest Pilot Car & Escort Vehicle Directory",
    description: 'Find verified pilot car operators and escort vehicle professionals across 120 countries.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Haul Command | World's Largest Pilot Car & Escort Vehicle Directory",
    description: 'Find verified pilot car operators and escort vehicle professionals across 120 countries.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "pending-gsc-verification",
    yandex: "yandex-verification-pending",
    yahoo: "yahoo-site-verification-pending",
    other: {
      "msvalidate.01": "bing-verification-pending",
      "baidu-site-verification": "baidu-verification-pending",
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA — iOS Safari doesn't read manifest for these */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#0B0F14" />
        <meta name="rating" content="general" />
        <meta name="age-verification" content="18+" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* GA4 — only loads when NEXT_PUBLIC_GA4_ID is set */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA4_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${inter.variable} antialiased selection:bg-accent selection:text-accent-foreground overflow-x-hidden max-w-full min-w-0`}
      >
        <ServiceWorkerRegister />
        <RoleProvider>
          <OrganizationSchema />
          <WebSiteSchema />
          <div className="min-h-screen flex flex-col pb-14 md:pb-0 overflow-x-hidden max-w-full">
            {children}
            <Footer />
          </div>
          <MobileBottomNav />
          <CookieConsent />
        </RoleProvider>
      </body>
    </html>
  );
}
