import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Core logic: Parse intent, capture core pain, initial identity mapping.
    const { primary_role, top_pain, preferred_language, country } = body;
    
    if (!primary_role || !country) {
      return NextResponse.json(
        errorResponse("missing_fields", "Onboarding start requires primary_role and country", false),
        { status: 400 }
      );
    }
    
    // Create an onboarding session or link to an existing identity
    const sessionResponse = {
      onboarding_session_id: "obs_1001xyz",
      next_required_step: "identity_verification",
      message: "Ready to solve " + (top_pain ? top_pain : "your coverage gaps"),
    };

    return NextResponse.json(successResponse(sessionResponse));
  } catch (error) {
    return NextResponse.json(
      errorResponse("onboarding_start_failed", "Could not initialize onboarding session.", false),
      { status: 500 }
    );
  }
}
