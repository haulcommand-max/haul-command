import { NextRequest, NextResponse } from "next/server";
import { isInternalRequest } from "@/lib/auth/internal-request";
import {
  buildSearchIntentFeedbackPlan,
  type SearchIntentSource,
} from "@/lib/growth/search-intent-feedback-loop";

export async function POST(req: NextRequest) {
  if (!isInternalRequest(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const plan = buildSearchIntentFeedbackPlan({
    query,
    source: (typeof body.source === "string" ? body.source : "directory_search") as SearchIntentSource,
    role: typeof body.role === "string" ? body.role : undefined,
    countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
    region: typeof body.region === "string" ? body.region : undefined,
    city: typeof body.city === "string" ? body.city : undefined,
    corridor: typeof body.corridor === "string" ? body.corridor : undefined,
    impressions: typeof body.impressions === "number" ? body.impressions : undefined,
    clicks: typeof body.clicks === "number" ? body.clicks : undefined,
    costCents: typeof body.costCents === "number" ? body.costCents : undefined,
    providerClicks: typeof body.providerClicks === "number" ? body.providerClicks : undefined,
    postLoadStarts: typeof body.postLoadStarts === "number" ? body.postLoadStarts : undefined,
    claimStarts: typeof body.claimStarts === "number" ? body.claimStarts : undefined,
    supportRequests: typeof body.supportRequests === "number" ? body.supportRequests : undefined,
    noResultsCount: typeof body.noResultsCount === "number" ? body.noResultsCount : undefined,
    resultsCount: typeof body.resultsCount === "number" ? body.resultsCount : undefined,
    conversions: typeof body.conversions === "number" ? body.conversions : undefined,
  });

  return NextResponse.json({
    ok: true,
    writesDatabase: false,
    plan,
  });
}
