import { NextResponse } from "next/server";
import { getGlobalStats } from "@/lib/server/global-stats";

const CACHE_TTL_MS = 60_000;

let cachedData: Awaited<ReturnType<typeof getGlobalStats>> | null = null;
let cacheExpiresAt = 0;

export const dynamic = "force-dynamic";

export async function GET() {
    const now = Date.now();

    if (cachedData !== null && now < cacheExpiresAt) {
        return NextResponse.json(cachedData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                "X-Cache": "HIT",
            },
        });
    }

    const data = await getGlobalStats();
    cachedData = data;
    cacheExpiresAt = now + CACHE_TTL_MS;

    return NextResponse.json(data, {
        status: 200,
        headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
            "X-Cache": "MISS",
        },
    });
}
