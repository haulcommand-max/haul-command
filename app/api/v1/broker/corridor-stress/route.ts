export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "corridor_stress_not_available",
      status: "requires_broker_api_contract",
      message:
        "Corridor stress data is held until public-safe aggregation, freshness labels, and authenticated broker access are wired.",
    },
    { status: 501 },
  );
}
