export const dynamic = 'force-dynamic';
/**
 * GET /api/supply/telemetry
 * Returns aggregated escort supply signals for a geography.
 * Powers: escort density heatmap, supply meter widget, fill probability predictor.
 *
 * Data sources: hc_escort_location_pings, escort_profiles, escort_availability_windows
 * Public route: do not expose raw pings, coordinates, or per-escort live status.
 *
 * Query:
 *   ?state=FL   — filter by state
 *   ?county=Baker — filter by county (partial match)
 *   ?available=true — only available now (ping < 15min old)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 300; // 5m — supply signals are near-realtime

export async function GET(req: NextRequest) {
    const svc = getSupabaseAdmin();

    const sp = req.nextUrl.searchParams;
    const state = sp.get('state')?.toUpperCase();
    const county = sp.get('county');
    const onlyAvail = sp.get('available') === 'true';

    // 1. Live pings (last 15 min = available now). Select IDs only so raw
    // location_data never crosses the public API boundary.
    let pingQ = svc
        .from('hc_escort_location_pings')
        .select('escort_id')
        .eq('is_stale', false)
        .gte('recorded_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .limit(500);

    const { data: pings } = await pingQ;
    const activePingIds = new Set((pings ?? []).map((p: any) => p.escort_id));

    // 2. Escort profiles with capabilities
    let profileQ = svc
        .from('escort_profiles')
        .select([
            'id', 'home_base_state', 'home_base_city',
            'twic_verified', 'availability_status', 'trust_score',
        ].join(','))
        .eq('is_published', true);

    if (state) profileQ = profileQ.eq('home_base_state', state);
    if (onlyAvail) profileQ = profileQ.eq('availability_status', 'available');

    const { data: profiles } = await profileQ.limit(200);
    const pl = profiles ?? [];

    // 3. Merge for aggregate metrics. Individual operators and live flags are
    // intentionally not returned because this is a public, cached route.
    const enriched = pl.map((p: any) => {
        const hasLivePing = activePingIds.has(p.id);
        return {
            home_base_state: p.home_base_state,
            home_base_city: p.home_base_city,
            twic_verified: p.twic_verified,
            availability_status: p.availability_status,
            trust_score: p.trust_score,
            has_live_ping: hasLivePing,
            available_now: hasLivePing && p.availability_status === 'available',
        };
    });

    // 4. Supply metrics
    const totalOperators = enriched.length;
    const liveOperators = enriched.filter((e: any) => e.has_live_ping).length;
    const availableNow = enriched.filter((e: any) => e.available_now).length;
    const twicCount = enriched.filter((e: any) => e.twic_verified).length;
    const supplyByCity = Array.from(
        enriched.reduce((acc: Map<string, any>, operator: any) => {
            const key = `${operator.home_base_state || 'unknown'}:${operator.home_base_city || 'unknown'}`;
            const current = acc.get(key) ?? {
                state: operator.home_base_state,
                city: operator.home_base_city,
                total_operators: 0,
                recent_signal_operators: 0,
                recently_available_signal: 0,
                twic_operators: 0,
            };

            current.total_operators += 1;
            if (operator.has_live_ping) current.recent_signal_operators += 1;
            if (operator.available_now) current.recently_available_signal += 1;
            if (operator.twic_verified) current.twic_operators += 1;
            acc.set(key, current);
            return acc;
        }, new Map<string, any>()).values()
    ).sort((a: any, b: any) => b.total_operators - a.total_operators).slice(0, 50);

    // 5. Supply stress score
    const supplyStress = totalOperators === 0 ? 100
        : totalOperators < 2 ? 80
            : totalOperators < 5 ? 60
                : totalOperators < 10 ? 35 : 10;

    return NextResponse.json({
        supply_by_city: supplyByCity,
        supply_metrics: {
            total_operators: totalOperators,
            recent_signal_operators: liveOperators,
            recently_available_signal: availableNow,
            twic_operators: twicCount,
            supply_stress_score: supplyStress,
            supply_mode: supplyStress >= 80 ? 'critical' : supplyStress >= 60 ? 'tight' : supplyStress >= 35 ? 'moderate' : 'healthy',
        },
        filters: { state, county, available_only: onlyAvail },
        privacy: 'raw_location_and_per_operator_live_status_suppressed',
        computed_at: new Date().toISOString(),
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
}
