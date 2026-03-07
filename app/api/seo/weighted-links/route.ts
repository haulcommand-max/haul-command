import { NextResponse } from "next/server";
import { getWeightedLinks } from "@/lib/seo/internalLinks";
import type { LinkTargetType } from "@/lib/seo/internalLinks";

/**
 * GET /api/seo/weighted-links?to=city&country=US&region=TX
 * Returns signal-weighted internal links with CDN caching.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const toPageType = searchParams.get("to") as LinkTargetType;
    const countryCode = searchParams.get("country") ?? undefined;
    const regionCode = searchParams.get("region") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);

    if (!toPageType) {
        return NextResponse.json({ error: "'to' param required" }, { status: 400 });
    }

    const data = await getWeightedLinks({
        fromPageType: "any",
        toPageType,
        countryCode,
        regionCode,
        limit: Math.min(limit, 50),
    });

    const res = NextResponse.json({ data });

    // CDN caching: 1hr TTL + stale-while-revalidate for instant responses
    res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res;
}
