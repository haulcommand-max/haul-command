import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/graph/recompute
 * Admin/service-only — rebuilds trust score cache from graph edges.
 * Body: { subject_type: 'operator' | 'broker' }
 */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const subjectType = body.subject_type ?? "operator";

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("hc_graph_scores_recompute", {
        p_subject_type: subjectType,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, recomputed: data });
}
