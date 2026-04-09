import { getMarketPulse, getDirectoryListings, getCorridors } from "@/lib/server/data";
import { getCountryFromHeaders } from "@/lib/geo/getCountryFromRequest";
import { resolveHeroPack } from "@/components/hero/heroPacks";
import { getGlobalStats } from "@/lib/server/global-stats";
import HomeClient from "./_components/HomeClient";

// ═══════════════════════════════════════════════════════
// HOMEPAGE — Server Component
// Route: / (via (landing) route group)
// Fetches all data server-side, passes props to client.
// Resolves country for hero pack server-side (edge geo).
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

export const dynamic = 'force-dynamic'; // SSR-only — uses geo headers + live DB queries

export default async function LandingPage() {
    const countryCode = await getCountryFromHeaders();
    const heroPack = resolveHeroPack(countryCode);

    let marketPulse: Awaited<ReturnType<typeof getMarketPulse>>;
    let directoryResult: Awaited<ReturnType<typeof getDirectoryListings>>;
    let corridors: Awaited<ReturnType<typeof getCorridors>>;
    let globalStats: Awaited<ReturnType<typeof getGlobalStats>>;

    try {
        [marketPulse, directoryResult, corridors, globalStats] = await Promise.all([
            getMarketPulse(),
            getDirectoryListings({ limit: 8 }),
            getCorridors(),
            getGlobalStats(),
        ]);
    } catch (e) {
        console.error('Homepage data fetch failed:', e);
        marketPulse = { escorts_online_now: 0, escorts_available_now: 0, open_loads_now: 0, median_fill_time_min_7d: null, fill_rate_7d: null };
        directoryResult = { listings: [], total: 0 };
        corridors = [];
        globalStats = { totalCountries: 120, liveCountries: 2, coveredCountries: 120, nextCountries: 5, plannedCountries: 60, futureCountries: 53, totalOperators: 1566000, totalCorridors: 219, avgRatePerDay: 380 };
    }

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
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "name": "Haul Command",
                  "url": "https://www.haulcommand.com",
                  "logo": "https://www.haulcommand.com/logo.png",
                  "description": "The global operating system for the heavy haul and oversize load transportation industry. Verified pilot car directory, escort requirements, load board, and compliance training across 120 countries.",
                  "areaServed": { "@type": "Place", "name": "Worldwide" },
                  "knowsAbout": ["Pilot Car Services","Oversize Load Escort","Heavy Haul Transportation","PEVO Certification","Escort Vehicle Operator Training","DOT Permit Compliance","Route Survey Services"]
                })
            }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  "name": "Haul Command Training Courses",
                  "description": "Pilot car operator certification and escort vehicle training covering all 50 US states and 120 countries.",
                  "url": "https://www.haulcommand.com/training",
                  "itemListElement": [
                    { "@type": "Course", "position": 1, "name": "Pilot Car Operator Certification Prep — Florida (FDOT)", "url": "https://www.haulcommand.com/training/region/united-states/florida", "description": "Prepare for Florida's 8-hour FDOT escort vehicle operator certification. Covers 6 hours instruction and 2-hour exam requirements.", "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://www.haulcommand.com" } },
                    { "@type": "Course", "position": 2, "name": "Pilot Car Operator Training — Texas", "url": "https://www.haulcommand.com/training/region/united-states/texas", "description": "Texas escort vehicle operator training covering TxDOT oversize load escort requirements and certification preparation.", "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://www.haulcommand.com" } },
                    { "@type": "Course", "position": 3, "name": "Global Pilot Car Training Hub — 120 Countries", "url": "https://www.haulcommand.com/training", "description": "Jurisdiction-specific escort vehicle operator training for all 50 US states and 120 countries.", "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://www.haulcommand.com" } }
                  ]
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
