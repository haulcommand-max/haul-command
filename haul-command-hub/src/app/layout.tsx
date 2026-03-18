import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OrganizationSchema, WebSiteSchema } from "@/components/BreadcrumbSchema";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hub.haulcommand.com'),
  title: {
    default: "Haul Command | World's Largest Pilot Car & Escort Vehicle Directory",
    template: "%s | Haul Command",
  },
  description: "Find pilot car operators, escort vehicles, and oversize load professionals across 57 countries. The world's largest directory for heavy haul transport.",
  keywords: [
    'pilot car',
    'escort vehicle',
    'oversize load',
    'heavy haul',
    'wide load escort',
    'pilot car service',
    'escort vehicle directory',
    'oversize load permit',
    'heavy haul escort',
    'route survey',
    'superload escort',
  ],
  authors: [{ name: 'Haul Command' }],
  creator: 'Haul Command',
  publisher: 'Haul Command',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hub.haulcommand.com',
    siteName: 'Haul Command',
    title: "Haul Command | World's Largest Pilot Car & Escort Vehicle Directory",
    description: 'Find verified pilot car operators and escort vehicle professionals across 57 countries.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Haul Command | World's Largest Pilot Car & Escort Vehicle Directory",
    description: 'Find verified pilot car operators and escort vehicle professionals across 57 countries.',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
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
        className={`${inter.variable} antialiased selection:bg-accent selection:text-accent-foreground`}
      >
        <OrganizationSchema />
        <WebSiteSchema />
        <div className="min-h-screen flex flex-col pb-14 md:pb-0">
          {children}
          <Footer />
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
