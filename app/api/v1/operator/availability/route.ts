import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function GET(request: NextRequest) {
  try {
    const dummyAvailability = {
      status_now: "available",
      service_radius_miles: 250,
      urgent_eligible: true,
      markets: ["TX-Houston", "LA-BatonRouge"]
    };

    return NextResponse.json(successResponse(dummyAvailability));
  } catch (error) {
    return NextResponse.json(
      errorResponse("availability_fetch_failed", "Failed to get availability state"),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key");
    
    if (!idempotencyKey) {
      // Just logging the spec requirement for now
      console.warn("Missing idempotency key in state mutation");
    }

    return NextResponse.json(successResponse({ updated: true, ...body }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("invalid_body", "Request body was unreadable", false),
      { status: 400 }
    );
  }
}
