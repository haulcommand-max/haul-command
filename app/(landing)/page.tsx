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
    );
}
