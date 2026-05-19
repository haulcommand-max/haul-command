import { getMarketPulse, getDirectoryListings, getCorridors } from "@/lib/server/data";
import { headers } from "next/headers";
import { resolveHeroPack } from "@/components/hero/heroPacks";
import { getGlobalStats } from "@/lib/server/global-stats";
import { getHomepageRoleChips } from "@/lib/homepage/role-chips";
import type { UserSignals } from "@/lib/next-moves-engine";
import HomeClient from "./_components/HomeClient";

const HOME_HERO_IMAGE_URL = 'https://www.haulcommand.com/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load.webp';
const HOME_SOCIAL_IMAGE_URL = 'https://www.haulcommand.com/images/hero/haul-command-homepage-social-preview-pilot-car-heavy-haul.jpg';
const HOME_HERO_IMAGE_ALT = 'Pilot car escorting an oversize load truck on a highway at golden hour';
const HOMEPAGE_DATA_TIMEOUT_MS = 650;

const FALLBACK_MARKET_PULSE: Awaited<ReturnType<typeof getMarketPulse>> = {
    escorts_online_now: 0,
    escorts_available_now: 0,
    open_loads_now: 0,
    median_fill_time_min_7d: null,
    fill_rate_7d: null,
};

const FALLBACK_DIRECTORY_RESULT: Awaited<ReturnType<typeof getDirectoryListings>> = {
    listings: [],
    total: 0,
};

const FALLBACK_GLOBAL_STATS: Awaited<ReturnType<typeof getGlobalStats>> = {
    totalCountries: 2,
    liveCountries: 2,
    coveredCountries: 2,
    nextCountries: 0,
    plannedCountries: 0,
    futureCountries: 0,
    totalOperators: -1,
    totalCorridors: -1,
    totalSupportLocations: -1,
    avgRatePerDay: 380,
    statsUpdatedAt: null,
};

const FALLBACK_ROLE_CHIPS: Awaited<ReturnType<typeof getHomepageRoleChips>> = {
    chips: [],
    source: 'fallback',
    eligibleCount: 0,
};

async function withHomepageFallback<T>(label: string, promise: Promise<T>, fallback: T): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const guarded = promise.catch((error) => {
        console.warn(`${label} fallback:`, error instanceof Error ? error.message : error);
        return fallback;
    });
    const timeout = new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
            console.warn(`${label} timed out; rendering homepage fallback`);
            resolve(fallback);
        }, HOMEPAGE_DATA_TIMEOUT_MS);
    });

    const result = await Promise.race([guarded, timeout]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
}

async function getHomepageRequestContext(): Promise<{ countryCode: string; detectedState: string | null }> {
    try {
        const h = await headers();
        const cookieHeader = h.get("cookie") ?? "";
        const cookieCountry = cookieHeader.match(/(?:^|;\s*)hc_country=([A-Za-z]{2})/)?.[1];
        const rawCountry =
            cookieCountry ??
            h.get("x-vercel-ip-country") ??
            h.get("cf-ipcountry") ??
            h.get("x-country") ??
            h.get("x-geo-country") ??
            "US";
        const countryCode = /^[A-Za-z]{2}$/.test(rawCountry) ? rawCountry.toUpperCase() : "US";

        return {
            countryCode,
            detectedState: h.get("x-vercel-ip-country-region"),
        };
    } catch {
        return { countryCode: "US", detectedState: null };
    }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HOMEPAGE — Server Component
// Route: / (via (landing) route group)
// Fetches all data server-side, passes props to client.
// Resolves country for hero pack server-side (edge geo).
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const metadata = {
  title: {
    absolute: 'Haul Command | Pilot Car Directory & Oversize Load Escort Network',
  },
  description:
    'Find pilot car companies, escort vehicles, height-pole providers, route survey support, and oversize load requirements with Haul Command. Search providers, post loads, and claim listings on a heavy haul support network.',
  keywords: [
    'pilot car',
    'pilot car company',
    'pilot car service',
    'escort vehicle',
    'oversize load',
    'heavy haul',
    'pilot car near me',
    'pilot cars near me',
    'pilot car directory',
    'pilot car companies near me',
    'oversize load escort',
    'wide load escort',
    'heavy haul escort',
    'heavy haul load board',
    'superload escort',
    'oversize permit',
    'oversize load permit',
    'escort vehicle directory',
    'escort requirements by state',
    'pilot car operator',
    'heavy haul dispatch',
    'oversize load transport',
    'pilot car rates',
    'escort vehicle cost per mile',
    'height pole escort',
    'route survey company',
    'OSOW regulations',
  ],
  openGraph: {
    title: 'Haul Command | Pilot Car Directory & Oversize Load Escort Network',
    description:
      'Find pilot car companies, escort vehicles, height-pole providers, route survey support, truck stops, hotels, and oversize load requirements across a 120-country heavy haul coverage model.',
    url: 'https://www.haulcommand.com/',
    siteName: 'Haul Command',
    images: [
      {
        url: HOME_SOCIAL_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: HOME_HERO_IMAGE_ALT,
      },
    ],
    locale: 'en_US',
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Pilot Car Directory & Oversize Escort Network | Haul Command',
    description: 'Find pilot car companies, escort vehicles, route support, and oversize load requirements across a 120-country heavy haul coverage model.',
    images: [HOME_SOCIAL_IMAGE_URL],
    site: '@haulcommand',
  },
  alternates: {
    canonical: 'https://www.haulcommand.com/',
  },
};

export const dynamic = 'force-dynamic'; // SSR-only — uses geo headers + live DB queries

export default async function LandingPage() {
    const { countryCode, detectedState } = await getHomepageRequestContext();
    const heroPack = resolveHeroPack(countryCode);

    let marketPulse: Awaited<ReturnType<typeof getMarketPulse>>;
    let directoryResult: Awaited<ReturnType<typeof getDirectoryListings>>;
    let corridors: Awaited<ReturnType<typeof getCorridors>>;
    let globalStats: Awaited<ReturnType<typeof getGlobalStats>>;
    const nextMoveSignals: Partial<UserSignals> = { detectedState };
    let heroRoleChipResult: Awaited<ReturnType<typeof getHomepageRoleChips>>;

    try {
        [marketPulse, directoryResult, corridors, globalStats, heroRoleChipResult] = await Promise.all([
            withHomepageFallback('getMarketPulse', getMarketPulse(), FALLBACK_MARKET_PULSE),
            withHomepageFallback('getDirectoryListings', getDirectoryListings({ limit: 8 }), FALLBACK_DIRECTORY_RESULT),
            withHomepageFallback('getCorridors', getCorridors(), []),
            withHomepageFallback('getGlobalStats', getGlobalStats(), FALLBACK_GLOBAL_STATS),
            withHomepageFallback('getHomepageRoleChips', getHomepageRoleChips(countryCode), FALLBACK_ROLE_CHIPS),
        ]);
    } catch (e) {
        console.warn('Homepage data fallback used:', e instanceof Error ? e.message : e);
        marketPulse = FALLBACK_MARKET_PULSE;
        directoryResult = FALLBACK_DIRECTORY_RESULT;
        corridors = [];
        globalStats = FALLBACK_GLOBAL_STATS;
        heroRoleChipResult = FALLBACK_ROLE_CHIPS;
    }

    return (
        <main>
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "name": "Haul Command",
                  "url": "https://www.haulcommand.com/",
                  "description": "Haul Command helps brokers, carriers, and operators find pilot cars, escort vehicles, route support, and heavy haul services.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Haul Command",
                    "url": "https://www.haulcommand.com"
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.haulcommand.com/directory?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                })
            }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  "name": "Haul Command - Pilot Car & Escort Vehicle Directory for Heavy Haul",
                  "url": "https://www.haulcommand.com/",
                  "image": HOME_HERO_IMAGE_URL,
                  "primaryImageOfPage": {
                    "@type": "ImageObject",
                    "url": HOME_HERO_IMAGE_URL,
                    "width": 1916,
                    "height": 821,
                    "caption": HOME_HERO_IMAGE_ALT
                  },
                  "description": "Haul Command helps heavy haul teams find pilot car companies, escort vehicles, height-pole providers, route survey support, permits, truck stops, hotels, route intelligence, and oversize load requirements across a 120-country coverage model.",
                  "about": [
                    "pilot car directory",
                    "pilot car service",
                    "escort vehicle directory",
                    "oversize load escort",
                    "wide load escort",
                    "height pole escort",
                    "route survey company",
                    "oversize load permit",
                    "escort requirements by state",
                    "OSOW regulations",
                    "heavy haul support network"
                  ],
                  "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                      {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://www.haulcommand.com/"
                      }
                    ]
                  },
                  "mainEntity": {
                    "@type": "SiteLinksSearchBox",
                    "url": "https://www.haulcommand.com/",
                    "potentialAction": {
                      "@type": "SearchAction",
                       "target": "https://www.haulcommand.com/directory?q={search_term_string}",
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
                  "logo": "https://www.haulcommand.com/brand/logo.svg",
                  "image": HOME_HERO_IMAGE_URL,
                  "description": "The heavy haul operating system for pilot car discovery, escort requirements, load board activity, route intelligence, and compliance training across a 120-country coverage model.",
                  "areaServed": { "@type": "Place", "name": "Worldwide" },
                  "knowsAbout": ["Pilot Car Services","Oversize Load Escort","Heavy Haul Transportation","PEVO Certification","Escort Vehicle Operator Training","DOT Permit Compliance","Route Survey Services"]
                })
            }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  "name": "Haul Command Training Courses",
                  "description": "Pilot car operator certification and escort vehicle training resources for US states and the global Haul Command coverage model.",
                  "url": "https://www.haulcommand.com/training",
                  "itemListElement": [
                    { "@type": "Course", "position": 1, "name": "Pilot Car Operator Certification Prep — Florida (FDOT)", "url": "https://www.haulcommand.com/training/region/united-states/florida", "description": "Prepare for Florida's 8-hour FDOT escort vehicle operator certification. Covers 6 hours instruction and 2-hour exam requirements.", "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://www.haulcommand.com" } },
                    { "@type": "Course", "position": 2, "name": "Pilot Car Operator Training — Texas", "url": "https://www.haulcommand.com/training/region/united-states/texas", "description": "Texas escort vehicle operator training covering TxDOT oversize load escort requirements and certification preparation.", "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://www.haulcommand.com" } },
                    { "@type": "Course", "position": 3, "name": "Global Pilot Car Training Hub", "url": "https://www.haulcommand.com/training", "description": "Jurisdiction-specific escort vehicle operator training resources for US states and global heavy haul markets.", "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://www.haulcommand.com" } }
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
                totalSupportLocations={globalStats.totalSupportLocations}
                avgRatePerDay={globalStats.avgRatePerDay}
                statsUpdatedAt={globalStats.statsUpdatedAt}
                nextMoveSignals={nextMoveSignals}
                heroRoleChips={heroRoleChipResult.chips}
                heroRoleChipSource={heroRoleChipResult.source}
                heroRoleChipCount={heroRoleChipResult.eligibleCount}
            />
        </main>
    );
}
