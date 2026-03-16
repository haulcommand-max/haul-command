// app/api/v1/demand-intelligence/corridors/route.ts
//
// GET /api/v1/demand-intelligence/corridors?country_code=US&demand_level=high
// Returns corridor demand signals with surge status.
//
// POST /api/v1/demand-intelligence/corridors
// Upsert a corridor demand signal (admin / telemetry ingestion).

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    const countryCode = url.searchParams.get("country_code") ?? "US";
    const demandLevel = url.searchParams.get("demand_level");
    const surgeOnly = url.searchParams.get("surge_only") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

    let query = supabase
        .from("corridor_demand_signals")
        .select("*")
        .eq("country_code", countryCode)
        .order("demand_level", { ascending: false })
        .limit(limit);

    if (demandLevel) query = query.eq("demand_level", demandLevel);
    if (surgeOnly) query = query.eq("surge_active", true);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const corridors = (data ?? []) as any[];

    return NextResponse.json({
        ok: true,
        country_code: countryCode,
        corridors_count: corridors.length,
        surge_active_count: corridors.filter((c) => c.surge_active).length,
        corridors,
    });
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.corridor_id || !body.corridor_label) {
        return NextResponse.json({ error: "corridor_id and corridor_label required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("corridor_demand_signals")
        .upsert(
            {
                corridor_id: body.corridor_id,
                corridor_label: body.corridor_label,
                country_code: body.country_code ?? "US",
                origin_region: body.origin_region ?? null,
                destination_region: body.destination_region ?? null,
                industry_segments: body.industry_segments ?? [],
                demand_level: body.demand_level ?? "moderate",
                avg_monthly_loads: body.avg_monthly_loads ?? null,
                avg_rate_usd: body.avg_rate_usd ?? null,
                surge_active: body.surge_active ?? false,
                surge_multiplier: body.surge_multiplier ?? 1.0,
                seasonality_pattern: body.seasonality_pattern ?? null,
                last_signal_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        )
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, corridor: data });
}
