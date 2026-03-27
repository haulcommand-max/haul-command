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

export const revalidate = 60; // ISR: refresh every 60 seconds

export const metadata = {
    title: 'Haul Command | The Operating System for Heavy Haul',
    description:
        'The #1 pilot car directory and load board for oversize loads. Find verified escort vehicles, post loads, check state requirements, and match with professional pilots across the US and 57 countries.',
    keywords: [
        'pilot car', 'escort vehicle', 'oversize load', 'heavy haul', 'pilot car near me', 'pilot car directory', 'oversize load escort', 'heavy haul load board', 'superload escort', 'oversize permit', 'escort vehicle directory', 'pilot car operator', 'heavy haul dispatch', 'oversize load transport', 'pilot car rates', 'escort vehicle cost per mile'
    ],
    openGraph: {
        title: 'Haul Command | The Operating System for Heavy Haul',
        description: 'Find verified pilot car operators, post oversize loads, and manage heavy haul operations. The world\'s largest escort vehicle directory across 57 countries.',
        url: 'https://haulcommand.com',
        siteName: 'Haul Command',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Haul Command — The Operating System for Heavy Haul' }],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Haul Command | The Operating System for Heavy Haul',
        description: 'Find verified pilot car operators and post oversize loads. The world\'s largest heavy haul directory.',
        images: ['/og-image.png'],
        site: '@haulcommand',
    },
    alternates: {
        canonical: 'https://haulcommand.com',
    },
};

const HOMEPAGE_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Haul Command — The Operating System for Heavy Haul",
    "url": "https://haulcommand.com",
    "description": "The #1 pilot car directory and load board for oversize loads across 57 countries.",
    "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://haulcommand.com" }
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
};

export default async function LandingPage() {
    const countryCode = await getCountryFromHeaders();
    const heroPack = resolveHeroPack(countryCode);

    const [marketPulse, directoryResult, corridors, globalStats] = await Promise.all([
        getMarketPulse(),
        getDirectoryListings({ limit: 8 }),
        getCorridors(),
        getGlobalStats(),
    ]);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOMEPAGE_JSONLD) }} />
            <HomeClient
                marketPulse={marketPulse}
                directoryCount={globalStats.totalOperators}
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
        </>
    );
}
