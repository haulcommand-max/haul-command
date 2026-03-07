// app/api/subscriptions/plans/route.ts
//
// Returns available subscription plans with PPP-adjusted pricing.

import { NextRequest, NextResponse } from "next/server";
import {
    getDirectoryPlans,
    getMobilePlans,
    getLocalizedPrice,
    getPPPMultiplier,
} from "@/lib/subscriptions/pricing-config";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const cc = req.nextUrl.searchParams.get("country") || "US";
    const platform = req.nextUrl.searchParams.get("platform"); // "directory" | "mobile" | null (both)

    const multiplier = getPPPMultiplier(cc);

    const formatPlans = (plans: ReturnType<typeof getDirectoryPlans>) =>
        plans.map(p => ({
            tier: p.tier,
            platform: p.platform,
            name: p.name,
            tagline: p.tagline,
            base_price_usd: p.base_price_usd,
            localized_price_usd: getLocalizedPrice(p.base_price_usd, cc),
            lookup_key: p.stripe_price_lookup_key,
            features: p.features,
            limits: p.limits,
            highlight: p.highlight || false,
        }));

    const result: Record<string, unknown> = {
        country_code: cc,
        ppp_multiplier: multiplier,
    };

    if (!platform || platform === "directory") {
        result.directory = formatPlans(getDirectoryPlans());
    }
    if (!platform || platform === "mobile") {
        result.mobile = formatPlans(getMobilePlans());
    }

    return NextResponse.json(result, {
        headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
    });
}
