import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from "@/lib/auth/confirmed-user";
import { ClaimService } from "@/server/services/claimService";

export async function POST(request: NextRequest) {
  try {
    const auth = createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!isEmailConfirmed(user)) {
      return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
    }

    const body = await request.json();
    const { session_id, step_name, payload } = body;

    if (!session_id || !step_name) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_fields", message: "session_id and step_name required." } },
        { status: 400 }
      );
    }

    const result = await ClaimService.submitClaimStep(session_id, user.id, step_name, payload || {});

    return NextResponse.json({
      ok: true,
      data: result,
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Step submission failed.";
    return NextResponse.json(
      { ok: false, error: { code: "claim_step_failed", message } },
      { status: 500 }
    );
  }
}
