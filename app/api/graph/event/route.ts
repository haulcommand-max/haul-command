import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/graph/event
 * Server-side only — ingests graph events (HIRED, COMPLETED, REVIEWED, etc.)
 * Body: { type, broker_id?, operator_id?, load_id?, corridor_id?, partner_id?, w?, props? }
 */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body || !body.type) {
        return NextResponse.json(
            { error: "Missing event type" },
            { status: 400 }
        );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.rpc("hc_graph_event_ingest", {
        p_event: body,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
