import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idempotencyKey = request.headers.get("x-idempotency-key");
    
    // The core of the replacement/gap surge: fanning out a dispatch broadcast to the network
    const { origin, destination, urgency_level, required_credentials, compensation } = body;

    if (!origin || !urgency_level) {
      return NextResponse.json(
        errorResponse("missing_fields", "Origin and urgency level are required for broadcasts", false),
        { status: 400 }
      );
    }

    const broadcastStub = {
      broadcast_id: "bc_urgent_" + Date.now(),
      status: "fanning_out",
      matching_operators_found: 12,
      estimated_fill_time_minutes: 15,
      premium_surge_applied: urgency_level === 'high'
    };

    return NextResponse.json(successResponse(broadcastStub));

  } catch (error) {
    return NextResponse.json(
      errorResponse("broadcast_failed", "Failed to launch broadcast dispatch", true),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const listStub = [
       { broadcast_id: "bc_xyz123", status: "filled", filled_by: "usr_789" }
    ];
    return NextResponse.json(successResponse(listStub, { paging: { limit: 10, offset: 0, total: 1 }}));
  } catch (error) {
    return NextResponse.json(errorResponse("fetch_failed", "Failed to load broadcast history"), { status: 500 });
  }
}
