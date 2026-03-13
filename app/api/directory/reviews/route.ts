// app/api/directory/reviews/route.ts
// POST — submit review for a listing → escort_reviews table
// GET  — fetch reviews for a listing (by listing_id)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

/** Service-role client for bypassing RLS on trusted server actions */
async function makeServiceSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

/**
 * GET /api/directory/reviews?escort_id=<listing_id_or_slug>
 * 
 * Actual table schema (escort_reviews):
 *   id, reviewer_id, listing_id (FK → directory_listings), overall_rating,
 *   professionalism, communication, reliability, equipment, body,
 *   is_verified, is_hidden, created_at, safety_score, surface_category,
 *   corridor_id, country_code, review_type, cargo_type, load_dimensions,
 *   route_quality, response_time_hours
 */
export async function GET(req: NextRequest) {
    const supabase = await makeSupabase();
    const { searchParams } = new URL(req.url);
    const escortId = searchParams.get("escort_id");
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 50);

    if (!escortId) {
        return NextResponse.json({ error: "escort_id required" }, { status: 400 });
    }

    // Query uses actual columns: listing_id, reviewer_id
    // No FK join to profiles — reviewer info is not available via relation
    const { data, error } = await supabase
        .from("escort_reviews")
        .select(`
            id,
            listing_id,
            reviewer_id,
            overall_rating,
            professionalism,
            communication,
            reliability,
            equipment,
            safety_score,
            route_quality,
            body,
            is_verified,
            review_type,
            cargo_type,
            created_at
        `)
        .eq("listing_id", escortId)
        .or("is_hidden.eq.false,is_hidden.is.null")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[reviews GET]", error);
        // Don't expose internal error details — return empty, log the actual error
        return NextResponse.json({ reviews: [], error: "Failed to load reviews" }, { status: 200 });
    }

    // Map to OperatorReview interface used by ReviewCard component
    const reviews = (data ?? []).map((r: any) => ({
        id: r.id,
        reviewer_company: null, // No FK to profiles — will show "Anonymous Broker" in UI
        reviewer_role: r.review_type || "Broker",
        created_at: r.created_at,
        score_on_time: r.reliability ?? null,
        score_communication: r.communication ?? null,
        score_professionalism: r.professionalism ?? null,
        score_equipment_ready: r.equipment ?? null,
        score_route_awareness: r.route_quality ?? null,
        would_use_again: (r.overall_rating ?? 0) >= 4,
        review_text: r.body,
        verified_job: r.is_verified ?? false,
    }));

    return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
    const supabase = await makeSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
        listing_id,            // maps to escort_reviews.listing_id (FK → directory_listings)
        overall_rating,
        professionalism,
        communication,
        reliability,
        equipment,
        safety_score,
        route_quality,
        review_text,
        review_type,
        cargo_type,
    } = body;

    // Also accept legacy field name
    const targetId = listing_id || body.escort_id;

    if (!targetId) {
        return NextResponse.json({ error: "listing_id required" }, { status: 400 });
    }

    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
        return NextResponse.json({ error: "overall_rating required (1–5)" }, { status: 400 });
    }

    // Anti self-review
    if (targetId === user.id) {
        return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });
    }

    // Use service role to insert (bypasses RLS)
    const svc = await makeServiceSupabase();
    const { data: review, error } = await svc
        .from("escort_reviews")
        .insert({
            listing_id: targetId,
            reviewer_id: user.id,
            overall_rating,
            professionalism: professionalism ?? null,
            communication: communication ?? null,
            reliability: reliability ?? null,
            equipment: equipment ?? null,
            safety_score: safety_score ?? null,
            route_quality: route_quality ?? null,
            body: review_text ?? null,
            review_type: review_type ?? null,
            cargo_type: cargo_type ?? null,
            is_verified: false,
            is_hidden: false,
        })
        .select("id")
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "You already reviewed this listing" },
                { status: 409 }
            );
        }
        console.error("[reviews POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: review!.id }, { status: 201 });
}
