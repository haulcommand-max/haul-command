import { getMarketPulse, getDirectoryListings, getCorridors } from "@/lib/server/data";
import HomeClient from "./_components/HomeClient";

// ═══════════════════════════════════════════════════════
// HOMEPAGE — Server Component
// Route: / (via (landing) route group)
// Fetches all data server-side, passes props to client.
// ═══════════════════════════════════════════════════════

export const revalidate = 60; // ISR: refresh every 60 seconds

export default async function LandingPage() {
    const [marketPulse, directoryResult, corridors] = await Promise.all([
        getMarketPulse(),
        getDirectoryListings({ limit: 8 }),
        getCorridors(),
    ]);

    return (
        <HomeClient
            marketPulse={marketPulse}
            directoryCount={directoryResult.total}
            corridorCount={corridors.length}
            topCorridors={corridors}
            topListings={directoryResult.listings}
        />
    );
}
