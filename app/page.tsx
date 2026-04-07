import { getMarketPulse, getDirectoryListings, getCorridors } from "@/lib/server/data";
import { getCountryFromHeaders } from "@/lib/geo/getCountryFromRequest";
import { resolveHeroPack } from "@/components/hero/heroPacks";
import { getGlobalStats } from "@/lib/server/global-stats";
import HomeClient from "./(landing)/_components/HomeClient";

// ═══════════════════════════════════════════════════════
// ROOT HOMEPAGE — The Crown Jewel
// 
// Previously this was a stripped-down placeholder that
// competed with (landing)/page.tsx.  Now the root route
// renders the full premium HomeClient with all server-side
// data fetching for market pulse, corridors, and stats.
//
// The (landing) route group page remains as an alias.
// ═══════════════════════════════════════════════════════

export const metadata = {
  title: 'Pilot Car & Escort Vehicle Directory | Heavy Haul Load Board | Haul Command',
  description:
    'Find verified pilot car operators and escort vehicles for oversize loads across 120 countries. Browse the heavy haul load board, check state escort requirements, and claim your free listing.',
  keywords: [
    'pilot car',
    'escort vehicle',
    'oversize load',
    'heavy haul',
    'pilot car near me',
    'pilot car directory',
    'oversize load escort',
    'heavy haul load board',
    'superload escort',
    'oversize permit',
    'escort vehicle directory',
    'pilot car operator',
    'heavy haul dispatch',
    'oversize load transport',
    'pilot car rates',
    'escort vehicle cost per mile',
  ],
  openGraph: {
    title: 'Pilot Car & Escort Vehicle Directory | Heavy Haul Load Board | Haul Command',
    description:
      'Find verified pilot car operators and escort vehicles for oversize loads across 120 countries. Browse the load board, check state requirements, and claim your free listing.',
    url: 'https://www.haulcommand.com',
    siteName: 'Haul Command',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Haul Command — Pilot Car & Escort Vehicle Directory | Heavy Haul Escorts',
      },
    ],
    locale: 'en_US',
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Pilot Car & Escort Vehicle Directory | Haul Command',
    description: 'Find verified pilot car and escort vehicle operators across 120 countries. Post and browse oversize loads.',
    images: ['/og-image.png'],
    site: '@haulcommand',
  },
  alternates: {
    canonical: 'https://www.haulcommand.com',
  },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const countryCode = await getCountryFromHeaders();
    const heroPack = resolveHeroPack(countryCode);

    const [marketPulse, directoryResult, corridors, globalStats] = await Promise.all([
        getMarketPulse(),
        getDirectoryListings({ limit: 8 }),
        getCorridors(),
        getGlobalStats(),
    ]);

    return (
        <main>
            <h1 className="sr-only">
                Haul Command — The #1 Global Pilot Car Directory, Oversize Load Board, and Heavy Haul Operating System
            </h1>
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  "name": "Haul Command — The Operating System for Heavy Haul",
                  "url": "https://haulcommand.com",
                  "description": "Haul Command is the global operating system and #1 pilot car directory for the heavy haul, oversize load, and specialized freight transportation industries. Our routing platform provides real-time route surveys, DOT permit compliance, height pole escort verification, and an active oversize load board to match freight brokers with certified PEVO professionals across 120 countries.",
                  "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                      {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://haulcommand.com"
                      }
                    ]
                  },
                  "mainEntity": {
                    "@type": "SiteLinksSearchBox",
                    "url": "https://haulcommand.com",
                    "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://haulcommand.com/directory?q={search_term_string}",
                      "query-input": "required name=search_term_string"
                    }
                  }
                })
            }} />
            <HomeClient
                marketPulse={marketPulse}
                directoryCount={directoryResult.total}
                corridorCount={corridors.length}
                topCorridors={corridors}
                topListings={directoryResult.listings}
                heroPack={heroPack}
                totalCountries={globalStats.totalCountries}
                liveCountries={globalStats.liveCountries}
                coveredCountries={globalStats.coveredCountries}
                totalOperators={globalStats.totalOperators}
                totalCorridors={globalStats.totalCorridors}
                avgRatePerDay={globalStats.avgRatePerDay}
            />
        </main>
    );
}
