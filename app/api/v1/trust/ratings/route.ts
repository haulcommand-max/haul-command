// app/api/v1/trust/ratings/route.ts
//
// GET  /api/v1/trust/ratings?user_id=...   — get ratings for a user
// POST /api/v1/trust/ratings               — submit a rating

import { NextResponse } from "next/server";
import { submitRating } from "@/lib/trust/composite-trust-engine";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const { data: ratings } = await supabase
        .from("trust_ratings")
        .select("*")
        .eq("rated_user_id", userId)
        .eq("flagged", false)
        .order("created_at", { ascending: false })
        .limit(50);

    const allRatings = (ratings ?? []) as any[];
    const verified = allRatings.filter((r) => r.verified_job);

    // Compute averages
    const avgOverall = allRatings.length > 0
        ? allRatings.reduce((s, r) => s + r.overall_score, 0) / allRatings.length
        : 0;

    return NextResponse.json({
        ok: true,
        user_id: userId,
        total_ratings: allRatings.length,
        verified_ratings: verified.length,
        avg_overall: Math.round(avgOverall * 100) / 100,
        ratings: allRatings,
    });
}

export async function POST(req: Request) {
    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.rated_user_id || !body.rater_user_id || !body.rater_role || !body.overall) {
        return NextResponse.json(
            { error: "rated_user_id, rater_user_id, rater_role, and overall required" },
            { status: 400 }
        );
    }

    if (body.rated_user_id === body.rater_user_id) {
        return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 });
    }

    await submitRating(
        body.rated_user_id,
        body.rater_user_id,
        body.rater_role,
        {
            overall: body.overall,
            communication: body.communication,
            professionalism: body.professionalism,
            responsiveness: body.responsiveness,
            reliability: body.reliability,
            payment_reliability: body.payment_reliability,
            safety_compliance: body.safety_compliance,
            review_text: body.review_text,
        },
        body.job_id
    );

    return NextResponse.json({ ok: true, message: "Rating submitted" });
}
