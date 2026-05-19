import { getMarketPulse, getDirectoryListings, getCorridors } from "@/lib/server/data";
import { getCountryFromHeaders } from "@/lib/geo/getCountryFromRequest";
import { resolveHeroPack } from "@/components/hero/heroPacks";
import { getGlobalStats } from "@/lib/server/global-stats";
import { collectNextMoveSignals } from "@/lib/server/collect-next-move-signals";
import { createClient } from "@/lib/supabase/server";
import { getHomepageRoleChips } from "@/lib/homepage/role-chips";
import { getGlobalHreflangTags } from "@/lib/seo/hreflang";
import HomeClient from "./_components/HomeClient";

const HOME_HERO_IMAGE_URL = 'https://www.haulcommand.com/images/hero/haul-command-find-post-claim-hero-pilot-car-oversize-load.webp';
const HOME_SOCIAL_IMAGE_URL = 'https://www.haulcommand.com/images/hero/haul-command-homepage-social-preview-pilot-car-heavy-haul.jpg';
const HOME_HERO_IMAGE_ALT = 'Pilot car escorting an oversize load truck on a highway at golden hour';
const HOME_FAQ_ITEMS = [
  {
    question: 'What is a pilot car or escort vehicle?',
    answer: 'A pilot car, also called an escort vehicle or PEVO, travels ahead of or behind an oversize load to warn traffic, check route clearances, and communicate with the load driver.',
  },
  {
    question: 'How do I find a pilot car near me?',
    answer: 'Search Haul Command by city, state, corridor, or country. Filter by equipment type, certification status, trust signals, and availability.',
  },
  {
    question: 'Can operators claim a free Haul Command listing?',
    answer: 'Yes. Claim your company listing to set your phone number, services, coverage area, certifications, and equipment. No credit card required.',
  },
  {
    question: 'Does Haul Command cover more than the United States?',
    answer: 'Yes. Haul Command is building a 120-country coverage model, with live and expanding market depth across the US, Canada, Australia, UK, Germany, UAE, South Africa, Brazil, and more.',
  },
  {
    question: 'Can brokers post or route oversize loads?',
    answer: 'Yes. Brokers and carriers can post loads, search available escorts on active corridors, and request route intelligence by load type.',
  },
  {
    question: 'Can staging yards, equipment installers, or sponsors join?',
    answer: 'Yes. Haul Command supports staging yards, secure parking, equipment suppliers, bucket truck operators, permit agents, route surveyors, training providers, and advertisers.',
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HOMEPAGE — Server Component
// Route: / (via (landing) route group)
// Fetches all data server-side, passes props to client.
// Resolves country for hero pack server-side (edge geo).
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const metadata = {
  title: {
    absolute: 'Haul Command | Pilot Car & Escort Vehicle Directory for Heavy Haul',
  },
  description:
    'Find pilot cars, escort vehicles, and heavy haul support with Haul Command. Search providers, post loads, and claim listings on a platform built for the heavy haul industry.',
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
    title: 'Haul Command | Pilot Car & Escort Vehicle Directory for Heavy Haul',
    description:
      'Find pilot car operators and escort vehicles for oversize loads across a 120-country heavy haul coverage model. Browse the load board, check requirements, and claim your free listing.',
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
    title: 'Pilot Car & Escort Vehicle Directory | Haul Command',
    description: 'Find pilot car and escort vehicle operators across a 120-country heavy haul coverage model. Post and browse oversize loads.',
    images: [HOME_SOCIAL_IMAGE_URL],
    site: '@haulcommand',
  },
  alternates: {
    canonical: 'https://www.haulcommand.com/',
    languages: getGlobalHreflangTags('/'),
  },
};

export const dynamic = 'force-dynamic'; // SSR-only — uses geo headers + live DB queries

export default async function LandingPage() {
    const countryCode = await getCountryFromHeaders();
    const heroPack = resolveHeroPack(countryCode);

    // Detect state from Vercel geo header (auto-populated on Edge Network)
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const detectedState = headersList.get('x-vercel-ip-country-region') ?? null;

    // Authenticated user id (anonymous if not logged in)
    let userId: string | null = null;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
    } catch {}

    let marketPulse: Awaited<ReturnType<typeof getMarketPulse>>;
    let directoryResult: Awaited<ReturnType<typeof getDirectoryListings>>;
    let corridors: Awaited<ReturnType<typeof getCorridors>>;
    let globalStats: Awaited<ReturnType<typeof getGlobalStats>>;
    let nextMoveSignals: Awaited<ReturnType<typeof collectNextMoveSignals>>;
    let heroRoleChipResult: Awaited<ReturnType<typeof getHomepageRoleChips>>;

    try {
        [marketPulse, directoryResult, corridors, globalStats, nextMoveSignals, heroRoleChipResult] = await Promise.all([
            getMarketPulse(),
            getDirectoryListings({ limit: 8 }),
            getCorridors(),
            getGlobalStats(),
            collectNextMoveSignals({ userId, detectedState }),
            getHomepageRoleChips(countryCode),
        ]);
    } catch (e) {
        console.error('Homepage data fetch failed:', e);
        marketPulse = { escorts_online_now: 0, escorts_available_now: 0, open_loads_now: 0, median_fill_time_min_7d: null, fill_rate_7d: null };
        directoryResult = { listings: [], total: 0 };
        corridors = [];
        globalStats = { totalCountries: 2, liveCountries: 2, coveredCountries: 2, nextCountries: 0, plannedCountries: 0, futureCountries: 0, totalOperators: -1, totalCorridors: -1, totalSupportLocations: -1, avgRatePerDay: 380, statsUpdatedAt: null };
        nextMoveSignals = {};
        heroRoleChipResult = { chips: [], source: 'fallback', eligibleCount: 0 };
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
                  "description": "Haul Command helps heavy haul teams find pilot cars, escort vehicles, permits, route intelligence, and support providers for oversize loads across a 120-country coverage model.",
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
                  "@type": "FAQPage",
                  "@id": "https://www.haulcommand.com/#faq",
                  "mainEntity": HOME_FAQ_ITEMS.map((item) => ({
                    "@type": "Question",
                    "name": item.question,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": item.answer,
                    },
                  })),
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
