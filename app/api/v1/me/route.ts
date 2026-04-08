import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function GET(request: NextRequest) {
  try {
    // Phase 0: Stub implementation. Will verify identity via Supabase Auth.
    // Spec requires session payload: person_id, active_role, market_context, entitlements

    const dummyMe = {
      person_id: "usr_12345",
      full_name: "Mobile Operator",
      active_role: "pilot_car_operator",
      market_context: {
        country: "US",
        region: "TX"
      },
      entitlements: ["priority_alerts", "urgent_replacement_mode"]
    };

    return NextResponse.json(successResponse(dummyMe));
  } catch (error) {
    return NextResponse.json(
      errorResponse("identity_fetch_failed", "Failed to retrieve identity profile"),
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
