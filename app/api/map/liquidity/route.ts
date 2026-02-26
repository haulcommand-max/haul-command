export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET() {
    const { data, error } = await getSupabase()
        .from("liquidity_cells")
        .select("cell_id,corridor_id,liquidity_score,confidence,recency_health,updated_at,escorts_online,loads_active,unfilled_loads")
        .order("liquidity_score", { ascending: false })
        .limit(200);

    if (error) {
        return NextResponse.json(
            { cells: [], error: error.message },
            { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=10" } }
        );
    }

    const cells = (data ?? []).map((c: any) => {
        // PLM = 1 + 0.35*(1-C) + 0.20*(1-R) â€” amplifies visual intensity, not data
        const C = Number(c.confidence ?? 0.6);
        const R = Number(c.recency_health ?? 0.8);
        const plm = 1 + 0.35 * (1 - C) + 0.2 * (1 - R);
        return {
            cell_id: c.cell_id,
            corridor_id: c.corridor_id ?? null,
            liquidity_score: Number(c.liquidity_score ?? 0),
            confidence: C,
            recency_health: R,
            plm: Math.round(plm * 100) / 100,
            escorts_online: c.escorts_online ?? 0,
            loads_active: c.loads_active ?? 0,
            unfilled_loads: c.unfilled_loads ?? 0,
            updated_at: c.updated_at,
        };
    });

    return NextResponse.json(
        { cells },
        { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=10" } }
    );
}
