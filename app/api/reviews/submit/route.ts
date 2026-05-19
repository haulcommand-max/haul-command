import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/reviews/submit
 * Submit a review (star rating + optional text) for an operator or broker.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { subject_id, subject_type, rating, summary } = await req.json();

        if (!subject_id || !subject_type || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
        }

        const sb = getSupabaseAdmin();

        const { data, error } = await sb.rpc("hc_submit_review_v2", {
            p_reviewer_id: user.id,
            p_subject_id: subject_id,
            p_subject_type: subject_type,
            p_overall_rating: rating,
            p_summary: summary || null,
        });

        if (error) {
            console.error("[reviews-submit] review RPC failed:", error);
            return NextResponse.json({ error: "Review submission failed" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
