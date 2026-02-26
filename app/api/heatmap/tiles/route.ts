export const dynamic = 'force-dynamic';
/**
 * GET /api/heatmap/tiles
 * Returns composite heatmap tile data for the domination opportunity map.
 * Powers: escort density heatmap, broker activity, domination score.
 *
 * Query params:
 *   ?state=TX — filter by state
 *   ?country=US — filter by country (default US)
 *   ?tier=rural_thin — filter by market tier
 *   ?min_score=50 — minimum domination score threshold
 *   ?limit=200 — max tiles (default 200, max 500)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 1800; // 30m — matches heatmap_tiles refresh cadence

export async function GET(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const sp = req.nextUrl.searchParams;
    const state = sp.get('state')?.toUpperCase();
    const country = (sp.get('country') ?? 'US').toUpperCase();
    const tier = sp.get('tier');
    const minScore = parseInt(sp.get('min_score') ?? '0', 10);
    const limit = Math.min(parseInt(sp.get('limit') ?? '200', 10), 500);

    let q = svc
        .from('heatmap_tiles')
        .select([
            'tile_key', 'geo_key', 'state_province', 'county_name', 'tile_type',
            'escort_density_score', 'broker_demand_score', 'seo_competition_score',
            'corridor_flow_score', 'economic_distress_score',
            'domination_opportunity_score', 'metro_breakthrough_score',
            'active_operators', 'searches_30d', 'is_fcc_county', 'should_seed_page',
            'computed_at', 'expires_at',
        ].join(','))
        .eq('country_code', country)
        .gte('domination_opportunity_score', minScore)
        .order('domination_opportunity_score', { ascending: false })
        .limit(limit);

    if (state) q = q.eq('state_province', state);

    const { data: tiles, error } = await q;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const tl = (tiles ?? []) as any[];

    // Aggregate summary for map rendering
    const summary = {
        total_tiles: tl.length,
        critical_shortage: tl.filter((t: any) => t.active_operators === 0).length,
        should_seed: tl.filter((t: any) => t.should_seed_page).length,
        fcc_tiles: tl.filter((t: any) => t.is_fcc_county).length,
        avg_domination: tl.length ? Math.round(tl.reduce((s: number, t: any) => s + (t.domination_opportunity_score ?? 0), 0) / tl.length) : 0,
    };

    return NextResponse.json({
        tiles: tl,
        summary,
        meta: {
            state,
            country,
            min_score: minScore,
            limit,
            computed_at: tl[0]?.computed_at ?? null,
            expires_at: tl[0]?.expires_at ?? null,
        },
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300',
        },
    });
}

/**
 * POST /api/heatmap/tiles/refresh
 * Admin endpoint: trigger an immediate heatmap tiles refresh.
 */
export async function POST(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data, error } = await svc.rpc('refresh_heatmap_tiles');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tiles_refreshed: data, refreshed_at: new Date().toISOString() });
}
