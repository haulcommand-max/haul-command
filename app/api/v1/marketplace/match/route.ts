import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RETIRED_MATCH_ROUTE = {
  ok: false,
  error: "Legacy marketplace match is retired.",
  reason: "payment_authorized_job_required",
  canonical_required: true,
  canonical_route: "/api/loads/create",
  dispatch_route: "/api/loads/dispatch",
  status: 410,
} as const;

export async function POST() {
  return NextResponse.json(RETIRED_MATCH_ROUTE, {
    status: 410,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
