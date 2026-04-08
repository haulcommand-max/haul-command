import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function GET(request: NextRequest) {
  try {
    const dummyReadiness = {
      profile_freshness: 95,
      trust_score: 88,
      credentials: [
        {
          id: "cred_123",
          type: "twic",
          status: "verified",
          expires_at: "2028-01-01T00:00:00Z"
        },
        {
          id: "cred_456",
          type: "insurance",
          status: "verified",
          expires_at: "2027-06-15T00:00:00Z"
        }
      ],
      vehicle_setup: {
        type: "pilot_car_lead",
        tags: ["high_pole", "oversize_load_ready"]
      }
    };

    return NextResponse.json(successResponse(dummyReadiness));
  } catch (error) {
    return NextResponse.json(
      errorResponse("readiness_fetch_failed", "Failed to retrieve readiness state"),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(successResponse({ updated: true, ...body }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("invalid_body", "Request body was unreadable", false),
      { status: 400 }
    );
  }
}
