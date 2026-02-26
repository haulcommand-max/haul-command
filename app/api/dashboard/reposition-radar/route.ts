/**
 * GET /api/dashboard/reposition-radar
 *
 * Returns ARR reposition plays for the currently logged-in escort.
 * Also exposes their liquidity score and the current market snapshot.
 *
 * Response shape:
 * {
 *   plays: RepositionPlay[],
 *   liquidity_score: number,
 *   region_snapshot: ZoneSnapshot | null
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RepositionPlay {
    id: string;
    target_region: string;
    target_country: string;
    play_type: string;
    confidence_score: number;
    distance_miles: number | null;
    expected_premium_pct: number | null;
    shortage_severity: string | null;
    explanation: string | null;
    valid_until: string;
    last_computed_at: string;
}

export async function GET(req: NextRequest) {
    // Auth — get user session
    const supabase = supabaseServer();
    const { data: { session }, error: authErr } = await supabase.auth.getSession();

    if (authErr || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Service-role client for protected tables
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Fetch plays + liquidity score in parallel
    const [playsRes, liquidityRes, profileRes] = await Promise.all([
        svc
            .from('arr_reposition_plays')
            .select(`
                id,
                target_region,
                target_country,
                play_type,
                confidence_score,
                distance_miles,
                expected_premium_pct,
                shortage_severity,
                explanation,
                valid_until,
                last_computed_at
            `)
            .eq('escort_user_id', userId)
            .gt('valid_until', new Date().toISOString())
            .order('confidence_score', { ascending: false })
            .limit(5),

        svc
            .from('escort_liquidity_score')
            .select('liquidity_score, avail_score, response_score, capability_score, port_depth_score')
            .eq('user_id', userId)
            .maybeSingle(),

        svc
            .from('escort_profiles')
            .select('region_code, country_code')
            .eq('user_id', userId)
            .maybeSingle(),
    ]);

    const plays = (playsRes.data ?? []) as RepositionPlay[];
    const liquidity = liquidityRes.data;
    const profile = profileRes.data;

    // Fetch the market snapshot for the escort's home region
    let zoneSnapshot = null;
    if (profile?.region_code && profile?.country_code) {
        const { data: snap } = await svc
            .from('market_pressure_snapshots')
            .select('cal_label, coverage_action_level, pressure_now, pressure_24h, premium_low_pct, premium_high_pct, loads_posted_7d, available_now, cal_label')
            .eq('region_code', profile.region_code)
            .eq('country_code', profile.country_code)
            .is('city_id', null)
            .is('corridor_id', null)
            .gt('valid_until', new Date().toISOString())
            .order('computed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        zoneSnapshot = snap;
    }

    // Group plays by type for the Radar card
    const byType: Record<string, RepositionPlay> = {};
    for (const play of plays) {
        if (!byType[play.play_type]) byType[play.play_type] = play;
    }

    return NextResponse.json({
        plays,
        plays_by_type: {
            sure_thing: byType['sure_thing'] ?? null,
            best_value: byType['best_value'] ?? null,
            speedster: byType['speedster'] ?? null,
        },
        liquidity_score: liquidity?.liquidity_score ?? null,
        liquidity_breakdown: liquidity
            ? {
                availability: liquidity.avail_score,
                response: liquidity.response_score,
                capabilities: liquidity.capability_score,
                port_depth: liquidity.port_depth_score,
            }
            : null,
        home_region_snapshot: zoneSnapshot,
    });
}
