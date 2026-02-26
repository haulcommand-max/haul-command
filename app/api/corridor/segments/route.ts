export const dynamic = 'force-dynamic';
/**
 * GET /api/corridor/segments
 * Returns corridor and segment data for routing, SEO, and heatmap overlays.
 * Powers: corridor flow heatmap, corridor pages, risk score overlays.
 *
 * Sources: corridors, corridor_segments, corridor_metrics, hc_corridor_dominance
 *
 * Query:
 *   ?state=FL        — filter corridors passing through state
 *   ?interstate=I-10 — filter by specific interstate
 *   ?limit=50
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600; // 1h — corridors refresh weekly

export async function GET(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const sp = req.nextUrl.searchParams;
    const state = sp.get('state')?.toUpperCase();
    const interstate = sp.get('interstate');
    const limit = Math.min(parseInt(sp.get('limit') ?? '50', 10), 200);

    // Corridors (top-level)
    let corrQ = svc
        .from('corridors')
        .select('id, name, slug, states, country, is_active')
        .eq('is_active', true)
        .limit(limit);

    if (interstate) corrQ = corrQ.ilike('name', `%${interstate}%`);

    const { data: corridors } = await corrQ;
    const cl = corridors ?? [];

    // Corridor segments with metrics
    let segQ = svc
        .from('corridor_segments')
        .select('id, corridor_id, name, origin_geo, destination_geo, avg_demand_score, risk_score')
        .limit(200);

    const { data: segments } = await segQ;
    const sl = segments ?? [];

    // Corridor dominance scores (hc table)
    const { data: dominance } = await svc
        .from('hc_corridor_dominance')
        .select('corridor_id, dominance_score, operator_count, load_density')
        .limit(200);

    const domMap = ((dominance ?? []) as any[]).reduce((acc: Record<string, any>, d: any) => {
        acc[d.corridor_id] = d;
        return acc;
    }, {});

    // Merge
    const enriched = cl.map((c: any) => ({
        ...c,
        segments: sl.filter((s: any) => s.corridor_id === c.id),
        dominance: domMap[c.id] ?? null,
        passes_through_state: state ? (c.states ?? []).includes(state) : true,
    })).filter((c: any) => !state || c.passes_through_state);

    return NextResponse.json({
        corridors: enriched,
        total_corridors: enriched.length,
        total_segments: sl.length,
        filters: { state, interstate },
        computed_at: new Date().toISOString(),
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
}
