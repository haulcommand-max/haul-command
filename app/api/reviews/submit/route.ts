import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/reviews/submit
 * Submit a review (star rating + optional text) for an operator or broker.
 */
export async function POST(req: NextRequest) {
    try {
        const { reviewer_id, subject_id, subject_type, rating, summary } = await req.json();

        if (!reviewer_id || !subject_id || !subject_type || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
        }

        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await sb.rpc("hc_submit_review_v2", {
            p_reviewer_id: reviewer_id,
            p_subject_id: subject_id,
            p_subject_type: subject_type,
            p_overall_rating: rating,
            p_summary: summary || null,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
