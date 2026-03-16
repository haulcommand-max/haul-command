// app/api/v1/demand-intelligence/spikes/route.ts
//
// GET /api/v1/demand-intelligence/spikes?status=upcoming&country_code=US
// Returns event-based demand spikes (wind farm builds, bridge projects, etc.)
//
// POST /api/v1/demand-intelligence/spikes
// Create a demand spike event.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    const countryCode = url.searchParams.get("country_code") ?? "US";
    const status = url.searchParams.get("status");
    const eventType = url.searchParams.get("event_type");
    const regionCode = url.searchParams.get("region_code");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

    let query = supabase
        .from("demand_spike_events")
        .select("*")
        .eq("country_code", countryCode)
        .order("start_date", { ascending: true })
        .limit(limit);

    if (status) query = query.eq("status", status);
    if (eventType) query = query.eq("event_type", eventType);
    if (regionCode) query = query.eq("region_code", regionCode);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const events = (data ?? []) as any[];

    // Compute aggregate demand
    const totalEstimatedEscortDemand = events.reduce(
        (s, e) => s + (e.estimated_escort_demand ?? 0),
        0
    );

    return NextResponse.json({
        ok: true,
        country_code: countryCode,
        events_count: events.length,
        total_estimated_escort_demand: totalEstimatedEscortDemand,
        events,
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

    if (!body.event_type || !body.event_label) {
        return NextResponse.json({ error: "event_type and event_label required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("demand_spike_events")
        .insert({
            event_type: body.event_type,
            event_label: body.event_label,
            country_code: body.country_code ?? "US",
            region_code: body.region_code ?? null,
            corridor_ids: body.corridor_ids ?? [],
            industry_segments: body.industry_segments ?? [],
            estimated_escort_demand: body.estimated_escort_demand ?? null,
            estimated_duration_months: body.estimated_duration_months ?? null,
            start_date: body.start_date ?? null,
            end_date: body.end_date ?? null,
            source_url: body.source_url ?? null,
            confidence_level: body.confidence_level ?? "medium",
            status: body.status ?? "upcoming",
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, event: data });
}
