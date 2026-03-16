import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/loads/dispatch
 * Corridor dispatch: broadcasts offers to available escorts near a load.
 * This is the Uber Freight-style instant dispatch.
 */
export async function POST(req: NextRequest) {
    try {
        const { load_id, max_offers } = await req.json();

        if (!load_id) {
            return NextResponse.json({ error: "load_id required" }, { status: 400 });
        }

        const sb = getSupabaseAdmin();

        const { data, error } = await sb.rpc("hc_corridor_dispatch", {
            p_load_id: load_id,
            p_max_offers: max_offers || 20,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
