// app/api/v1/marketplace/match/route.ts
//
// POST /api/v1/marketplace/match
// Create a load request and return ranked escort matches.
// Geo-isolated, explainable, auditable.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { runMatchPipeline, type LoadRequest } from "@/lib/marketplace/match-engine";

export const runtime = "nodejs";

interface MatchRequestBody {
    country_code: string;
    admin1_code?: string;
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    pickup_time_window: { start: string; end: string };
    load_type_tags?: string[];
    dimensions?: { length?: number; width?: number; height?: number; weight?: number };
    required_escort_count?: number;
    special_requirements?: string[];
    broker_id?: string;
    carrier_id?: string;
    budget_range?: { min: number; max: number; currency: string };
    cross_border_flag?: boolean;
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();

    let body: MatchRequestBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate required fields
    if (!body.country_code) return NextResponse.json({ error: "country_code required" }, { status: 400 });
    if (body.origin_lat == null || body.origin_lon == null)
        return NextResponse.json({ error: "origin_lat and origin_lon required" }, { status: 400 });
    if (body.destination_lat == null || body.destination_lon == null)
        return NextResponse.json({ error: "destination_lat and destination_lon required" }, { status: 400 });
    if (!body.pickup_time_window?.start || !body.pickup_time_window?.end)
        return NextResponse.json({ error: "pickup_time_window.start and .end required" }, { status: 400 });

    // Create load request record
    const loadInsert = {
        country_code: body.country_code.toUpperCase(),
        admin1_code: body.admin1_code ?? null,
        origin_lat: body.origin_lat,
        origin_lon: body.origin_lon,
        destination_lat: body.destination_lat,
        destination_lon: body.destination_lon,
        pickup_time_window: body.pickup_time_window,
        load_type_tags: body.load_type_tags ?? [],
        dimensions: body.dimensions ?? undefined,
        required_escort_count: body.required_escort_count ?? 1,
        special_requirements: body.special_requirements ?? [],
        broker_id: body.broker_id ?? null,
        carrier_id: body.carrier_id ?? null,
        budget_range: body.budget_range ?? null,
        cross_border_flag: body.cross_border_flag ?? false,
        status: "pending",
    };

    const { data: loadRow, error: loadErr } = await supabase
        .from("load_requests")
        .insert(loadInsert)
        .select("request_id")
        .single();

    if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });

    const loadRequest: LoadRequest = {
        request_id: (loadRow as any).request_id,
        ...loadInsert,
    } as LoadRequest;

    // Run the match pipeline
    try {
        const result = await runMatchPipeline(loadRequest);

        return NextResponse.json({
            ok: true,
            request_id: result.request_id,
            match_run_id: result.match_run_id,
            candidates_generated: result.candidates_generated,
            matches: result.scored_candidates.slice(0, 10).map((c) => ({
                operator_id: c.operator_id,
                match_score: c.match_score,
                rank: c.rank,
                acceptance_probability: c.acceptance_probability,
                score_breakdown: c.breakdown,
            })),
            offer_plan: {
                strategy: result.offer_plan.strategy,
                offers_sent: result.offer_plan.targets.length,
                timeout_seconds: result.offer_plan.timeout_seconds,
            },
        });
    } catch (err: any) {
        console.error("[Match Pipeline Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
