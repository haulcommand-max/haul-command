import { NextRequest, NextResponse } from "next/server";
import { ClaimService } from "@/server/services/claimService";
import { createServerComponentClient } from "@/lib/supabase/server-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity_id } = body;
    const supabase = createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: "unauthorized", message: "Authentication required to start a claim." } },
        { status: 401 }
      );
    }

    if (!entity_id) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_fields", message: "entity_id required." } },
        { status: 400 }
      );
    }

    const session = await ClaimService.startClaimSession(entity_id, user.id);

    // Track claim_started event (non-blocking)
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase/admin');
      getSupabaseAdmin().from('hc_claim_events').insert({
        event_type: 'claim_started',
        surface: (body.surface as string) || 'claim_page',
        entity_id: entity_id,
        entity_slug: body.slug || null,
        entity_type: body.entity_type || 'operator',
        country_code: body.country_code || null,
      }).then(() => {}).catch(() => {});
    } catch {}

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
