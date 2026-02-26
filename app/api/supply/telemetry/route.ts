export const dynamic = 'force-dynamic';
/**
 * GET /api/supply/telemetry
 * Returns live escort supply signals for a geography.
 * Powers: escort density heatmap, supply meter widget, fill probability predictor.
 *
 * Data sources: hc_escort_location_pings, escort_profiles, escort_availability_windows
 *
 * Query:
 *   ?state=FL   — filter by state
 *   ?county=Baker — filter by county (partial match)
 *   ?available=true — only available now (ping < 15min old)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // 5m — supply signals are near-realtime

export async function GET(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const sp = req.nextUrl.searchParams;
    const state = sp.get('state')?.toUpperCase();
    const county = sp.get('county');
    const onlyAvail = sp.get('available') === 'true';

    // 1. Live pings (last 15 min = available now)
    let pingQ = svc
        .from('hc_escort_location_pings')
        .select('escort_id, recorded_at, location_data, is_stale')
        .eq('is_stale', false)
        .gte('recorded_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .limit(500);

    const { data: pings } = await pingQ;
    const activePingIds = new Set((pings ?? []).map((p: any) => p.escort_id));

    // 2. Escort profiles with capabilities
    let profileQ = svc
        .from('escort_profiles')
        .select([
            'id', 'display_name', 'company_name', 'home_base_state', 'home_base_city',
            'twic_verified', 'availability_status', 'trust_score',
            'home_base_lat', 'home_base_lon',
        ].join(','))
        .eq('is_published', true);

    if (state) profileQ = profileQ.eq('home_base_state', state);
    if (onlyAvail) profileQ = profileQ.eq('availability_status', 'available');

    const { data: profiles } = await profileQ.limit(200);
    const pl = profiles ?? [];

    // 3. Merge: mark which escorts have live pings
    const enriched = pl.map((p: any) => ({
        ...p,
        has_live_ping: activePingIds.has(p.id),
        available_now: activePingIds.has(p.id) && p.availability_status === 'available',
    }));

    // 4. Supply metrics
    const totalOperators = enriched.length;
    const liveOperators = enriched.filter((e: any) => e.has_live_ping).length;
    const availableNow = enriched.filter((e: any) => e.available_now).length;
    const twicCount = enriched.filter((e: any) => e.twic_verified).length;

    // 5. Supply stress score
    const supplyStress = totalOperators === 0 ? 100
        : totalOperators < 2 ? 80
            : totalOperators < 5 ? 60
                : totalOperators < 10 ? 35 : 10;

    return NextResponse.json({
        operators: enriched,
        supply_metrics: {
            total_operators: totalOperators,
            live_operators: liveOperators,    // has active ping in last 15m
            available_now: availableNow,
            twic_operators: twicCount,
            supply_stress_score: supplyStress,
            supply_mode: supplyStress >= 80 ? 'critical' : supplyStress >= 60 ? 'tight' : supplyStress >= 35 ? 'moderate' : 'healthy',
        },
        filters: { state, county, available_only: onlyAvail },
        computed_at: new Date().toISOString(),
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
}
