import { NextRequest, NextResponse } from "next/server";
import { ClaimService } from "@/server/services/claimService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, step_name, payload } = body;

    if (!session_id || !step_name) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_fields", message: "session_id and step_name required." } },
        { status: 400 }
      );
    }

    const result = await ClaimService.submitClaimStep(session_id, step_name, payload || {});

    return NextResponse.json({
      ok: true,
      data: result,
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "claim_step_failed", message: e.message || "Step submission failed." } },
      { status: 500 }
    );
  }
}
