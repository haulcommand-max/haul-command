/**
 * GET /api/demand/signals
 * Returns load and broker demand aggregates for a geography.
 * Powers: broker demand heatmap, lane demand index, unfilled risk score.
 *
 * Sources: loads, brokers, lanes, hc_broker_demand_heatmap, directory_search_logs
 *
 * Query:
 *   ?state=TX        — filter by origin state
 *   ?corridor=I-10   — filter by corridor (partial)
 *   ?window=7d       — aggregation window (7d|24h|1h, default 7d)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 900; // 15m — demand aggregates

export async function GET(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const sp = req.nextUrl.searchParams;
    const state = sp.get('state')?.toUpperCase();
    const window = sp.get('window') ?? '7d';

    const windowHours: Record<string, number> = { '1h': 1, '24h': 24, '7d': 168 };
    const hours = windowHours[window] ?? 168;
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    // 1. Recent loads in window
    let loadsQ = svc
        .from('loads')
        .select('id, origin_state, destination_state, status, created_at')
        .gte('created_at', since)
        .limit(500);

    if (state) {
        loadsQ = loadsQ.or(`origin_state.eq.${state},destination_state.eq.${state}`);
    }

    const { data: recentLoads } = await loadsQ;
    const rl = recentLoads ?? [];

    // 2. Broker demand heatmap (existing table)
    const { data: demandCells } = await svc
        .from('hc_broker_demand_heatmap')
        .select('*')
        .limit(200);

    // 3. Search signals from directory
    const { data: searchLogs } = await svc
        .from('directory_search_logs')
        .select('parsed_state, parsed_city, raw_query, created_at')
        .gte('created_at', since)
        .not('parsed_state', 'is', null)
        .limit(1000);

    const sl = searchLogs ?? [];

    // 4. Aggregate by state
    const stateSearchCounts: Record<string, number> = {};
    for (const s of sl) {
        const k = String(s.parsed_state ?? '');
        if (!k) continue;
        stateSearchCounts[k] = (stateSearchCounts[k] ?? 0) + 1;
    }

    // 5. Compute top demand states
    const topDemandStates = Object.entries(stateSearchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([state_code, searches]) => ({
            state_code,
            searches,
            load_count: rl.filter((l: any) => l.origin_state === state_code || l.destination_state === state_code).length,
            demand_score: Math.min(100, searches * 3 + Math.min(50, rl.filter((l: any) => l.origin_state === state_code).length * 5)),
        }));

    return NextResponse.json({
        demand_signals: {
            loads_in_window: rl.length,
            searches_in_window: sl.length,
            demand_cells: (demandCells ?? []).length,
            top_demand_states: topDemandStates,
        },
        aggregation_window: window,
        filters: { state },
        computed_at: new Date().toISOString(),
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
    });
}
