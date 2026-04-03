import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/country/readiness
 * Returns country readiness scores and market states.
 * Query params:
 *   ?state=dormant|prepared|seed|live  (filter by state)
 *   ?candidates=true                   (show promotion candidates only)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const candidates = searchParams.get('candidates');

    const supabase = getSupabaseAdmin();

    if (candidates === 'true') {
        const { data, error } = await supabase
            .from('v_next_country_candidates')
            .select('*')
            .order('total_score', { ascending: false })
            .limit(20);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ candidates: data });
    }

    let query = supabase
        .from('hc_country_readiness')
        .select('country_code, country_name, market_state, total_score, supply_depth_score, demand_pull_score, law_readiness_score, autonomous_freight_score, av_regulatory_maturity, state_changed_at')
        .order('total_score', { ascending: false });

    if (state) {
        query = query.eq('market_state', state);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        countries: data,
        summary: {
            live: data?.filter(c => c.market_state === 'live').length ?? 0,
            seed: data?.filter(c => c.market_state === 'seed').length ?? 0,
            prepared: data?.filter(c => c.market_state === 'prepared').length ?? 0,
            dormant: data?.filter(c => c.market_state === 'dormant').length ?? 0,
        }
    });
}

/**
 * POST /api/country/readiness
 * Autonomous promotion check — called by cron or manually.
 * Body: { action: 'check_promotions' | 'promote', country_code?: string, target_state?: string }
 */
export async function POST(request: Request) {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (body.action === 'promote' && body.country_code && body.target_state) {
        const { error } = await supabase.rpc('promote_country', {
            p_country_code: body.country_code,
            p_target_state: body.target_state,
            p_reason: body.reason || 'manual promotion',
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ promoted: body.country_code, to: body.target_state });
    }

    if (body.action === 'check_promotions') {
        // Fetch candidates
        const { data: candidates } = await supabase
            .from('v_next_country_candidates')
            .select('*')
            .neq('recommendation', 'hold')
            .order('total_score', { ascending: false });

        if (!candidates || candidates.length === 0) {
            return NextResponse.json({ promotions: [], message: 'No countries ready for promotion' });
        }

        // Auto-promote top candidate (safety: only one per run)
        const top = candidates[0];
        const targetState = top.recommendation.replace('promote_to_', '');

        const { error } = await supabase.rpc('promote_country', {
            p_country_code: top.country_code,
            p_target_state: targetState,
            p_reason: `autonomous: score=${top.total_score}`,
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({
            promoted: top.country_code,
            to: targetState,
            score: top.total_score,
            remaining_candidates: candidates.slice(1).map((c: any) => ({
                country: c.country_code,
                score: c.total_score,
                recommendation: c.recommendation,
            })),
        });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
