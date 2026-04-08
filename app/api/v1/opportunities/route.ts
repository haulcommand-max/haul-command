import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const dummyOpportunities = [
      {
        id: "opp_urgent_abc123",
        type: "replacement",
        origin: { lat: 29.7604, lng: -95.3698, label: "Houston, TX" },
        urgency_level: "high",
        compensation: { amount_minor: 45000, currency_code: "USD" },
        status: "open_broadcast"
      }
    ];

    return NextResponse.json(successResponse(dummyOpportunities, {
      paging: { limit, offset, total: 1 }
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("opportunities_fetch_failed", "Failed to retrieve opportunities"),
      { status: 500 }
    );
  }
}
