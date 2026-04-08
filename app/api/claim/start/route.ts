import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ClaimService } from "@/server/services/claimService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity_id, user_id } = body;

    if (!entity_id || !user_id) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_fields", message: "entity_id and user_id required." } },
        { status: 400 }
      );
    }

    const session = await ClaimService.startClaimSession(entity_id, user_id);

    return NextResponse.json({
      ok: true,
      data: session,
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "claim_start_failed", message: e.message || "Failed to start claim." } },
      { status: 500 }
    );
  }
}
