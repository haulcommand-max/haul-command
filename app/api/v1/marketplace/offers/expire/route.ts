import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RETIRED_OFFER_EXPIRY_ROUTE = {
  ok: false,
  error: "Legacy marketplace offer expiry is retired.",
  reason: "canonical_match_offers_required",
  canonical_required: true,
  canonical_table: "match_offers",
  canonical_inbox: "/offers/inbox",
  status: 410,
} as const;

export async function POST() {
  return NextResponse.json(RETIRED_OFFER_EXPIRY_ROUTE, {
    status: 410,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
