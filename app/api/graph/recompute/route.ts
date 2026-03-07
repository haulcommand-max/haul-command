import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/graph/recompute
 * Admin/service-only — rebuilds trust score cache from graph edges.
 * Body: { subject_type: 'operator' | 'broker' }
 */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const subjectType = body.subject_type ?? "operator";

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc("hc_graph_scores_recompute", {
        p_subject_type: subjectType,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, recomputed: data });
}
