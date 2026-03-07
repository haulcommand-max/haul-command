// app/api/v1/trust/score/route.ts
//
// GET  /api/v1/trust/score?user_id=...     — get composite trust score
// POST /api/v1/trust/score/recompute       — batch recompute (cron)

import { NextResponse } from "next/server";
import { computeCompositeTrustScore } from "@/lib/trust/composite-trust-engine";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const result = await computeCompositeTrustScore(userId);

    return NextResponse.json({
        ok: true,
        ...result,
        summary: {
            composite: result.composite_score,
            experience: result.experience_score,
            trust: result.trust_score,
            confidence: result.confidence,
            is_emerging: result.is_emerging,
        },
    });
}

export async function POST() {
    const supabase = getSupabaseAdmin();

    // Get all users with any activity
    const { data: users } = await supabase
        .from("verified_activity_summary")
        .select("user_id")
        .limit(5000);

    let processed = 0;
    let errors = 0;

    for (const u of (users ?? []) as any[]) {
        try {
            await computeCompositeTrustScore(u.user_id);
            processed++;
        } catch {
            errors++;
        }
    }

    return NextResponse.json({ ok: true, processed, errors });
}
