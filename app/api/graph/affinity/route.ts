import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/graph/affinity?broker_id=...&limit=25
 * Returns ranked operators by relationship affinity for a broker.
 */
export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;
    const brokerId = sp.get("broker_id");
    const limit = Math.min(parseInt(sp.get("limit") ?? "25", 10), 50);

    if (!brokerId) {
        return NextResponse.json(
            { error: "broker_id required" },
            { status: 400 }
        );
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.rpc("hc_graph_affinity", {
        p_broker_id: brokerId,
        p_limit: limit,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ broker_id: brokerId, results: data ?? [] });
}
