import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Search simulation based on broker criteria (location, credentials, urgency)
    const dummyResults = [
        {
            hc_operator_id: "usr_789",
            display_name: "Texas Pilot Pro",
            trust_score: 92,
            distance_miles: 15,
            urgent_eligible: true,
            verified_credentials: ["twic", "insurance"]
        },
        {
            hc_operator_id: "usr_101",
            display_name: "Gulf Coast Escorts",
            trust_score: 85,
            distance_miles: 42,
            urgent_eligible: false,
            verified_credentials: ["insurance"]
        }
    ];

    return NextResponse.json(successResponse(dummyResults, {
      paging: { limit: 10, offset: 0, total: 2 }
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("search_failed", "Coverage search encountered an error"),
      { status: 500 }
    );
  }
}
