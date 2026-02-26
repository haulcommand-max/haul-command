// app/api/directory/reviews/route.ts
// POST — submit 5-axis escort review (broker → escort) → escort_reviews table
// GET  — fetch reviews for an escort (reads from escort_reviews with fallback to legacy)

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

export async function GET(req: NextRequest) {
    const supabase = await makeSupabase();
    const { searchParams } = new URL(req.url);
    const escortId = searchParams.get("escort_id");
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 50);

    if (!escortId) {
        return NextResponse.json({ error: "escort_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("escort_reviews")
        .select(`
            id,
            escort_id,
            broker_id,
            load_id,
            on_time_rating,
            communication_rating,
            professionalism_rating,
            equipment_ready_rating,
            route_awareness_rating,
            would_use_again,
            review_text,
            verified_job,
            created_at,
            reviewer:profiles!broker_id (
                company_name,
                role
            )
        `)
        .eq("escort_id", escortId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[reviews GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to OperatorReview interface used by ReviewCard
    const reviews = (data ?? []).map((r: any) => ({
        id: r.id,
        reviewer_company: r.reviewer?.company_name ?? null,
        reviewer_role: r.reviewer?.role ?? "Broker",
        created_at: r.created_at,
        score_on_time: r.on_time_rating,
        score_communication: r.communication_rating,
        score_professionalism: r.professionalism_rating,
        score_equipment_ready: r.equipment_ready_rating,
        score_route_awareness: r.route_awareness_rating,
        would_use_again: r.would_use_again,
        review_text: r.review_text,
        verified_job: r.verified_job,
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
        escort_id,
        load_id,
        on_time_rating,
        communication_rating,
        professionalism_rating,
        equipment_ready_rating,
        route_awareness_rating,
        would_use_again,
        review_text,
    } = body;

    // Validate required fields
    if (!escort_id) {
        return NextResponse.json({ error: "escort_id required" }, { status: 400 });
    }

    const ratings = [on_time_rating, communication_rating, professionalism_rating, equipment_ready_rating, route_awareness_rating];
    if (ratings.some(r => r == null || r < 1 || r > 5)) {
        return NextResponse.json({ error: "All 5 ratings are required and must be 1–5" }, { status: 400 });
    }

    // Anti self-review
    if (escort_id === user.id) {
        return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });
    }

    // Verify the load belongs to this broker (enables verified_job flag)
    let verified_job = false;
    if (load_id) {
        const { data: load } = await supabase
            .from("loads")
            .select("id, broker_id")
            .eq("id", load_id)
            .single();
        if (load && load.broker_id === user.id) {
            verified_job = true;
        }
    }

    // Use service role to insert (bypasses RLS)
    const svc = await makeServiceSupabase();
    const { data: review, error } = await svc
        .from("escort_reviews")
        .insert({
            escort_id,
            broker_id: user.id,
            load_id: load_id ?? null,
            on_time_rating,
            communication_rating,
            professionalism_rating,
            equipment_ready_rating,
            route_awareness_rating,
            would_use_again: would_use_again ?? true,
            review_text: review_text ?? null,
            verified_job,
        })
        .select("id")
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "You already reviewed this escort for this job" },
                { status: 409 }
            );
        }
        console.error("[reviews POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Refresh escort trust score async (fire and forget)
    svc.rpc("compute_escort_report_card", { p_escort_id: escort_id }).then();

    return NextResponse.json({ id: review!.id }, { status: 201 });
}
