/**
 * GET /api/market/heartbeat
 * 
 * Returns live market vitals for any region.
 * Answers: "Is this market alive right now?"
 * 
 * Query params:
 *   - state: State code (e.g. "TX")
 *   - city: Optional city name
 *   - corridor: Optional corridor key (e.g. "TX-LA")
 *   - origin_state: Optional origin state for lane query
 *   - destination_state: Optional destination state for lane query
 * 
 * Returns:
 *   - active_loads: count of open loads in region
 *   - verified_operators: count of verified operators
 *   - total_operators: total operators in region
 *   - recent_loads: last 5 load summaries
 *   - last_activity_at: most recent activity timestamp
 *   - market_mode: 'live' | 'seeding' | 'demand_capture' | 'waitlist'
 *   - freshness_seconds: seconds since last activity
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface MarketHeartbeatResponse {
    active_loads: number;
    verified_operators: number;
    total_operators: number;
    claimed_operators: number;
    recent_loads: {
        company_name: string;
        origin: string;
        destination: string;
        position_type: string;
        rate_amount: number | null;
        ago: string;
    }[];
    last_activity_at: string | null;
    market_mode: 'live' | 'seeding' | 'demand_capture' | 'waitlist';
    freshness_seconds: number;
    freshness_label: string;
    service_type_mix: Record<string, number>;
    rate_band: { min: number | null; max: number | null; median: number | null };
}

function getAgoLabel(isoDate: string | null): string {
    if (!isoDate) return 'No activity';
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}

function determineMarketMode(
    activeLoads: number,
    verifiedOps: number,
    totalOps: number,
    freshnessSec: number,
): MarketHeartbeatResponse['market_mode'] {
    const oneDay = 86400;
    const oneWeek = oneDay * 7;

    // Live: operators exist AND recent activity within 24h
    if (totalOps >= 3 && activeLoads > 0 && freshnessSec < oneDay) return 'live';
    // Seeding: some operators but thin or stale
    if (totalOps >= 1 && (verifiedOps > 0 || activeLoads > 0)) return 'seeding';
    // Demand capture: loads flowing but no operators
    if (activeLoads > 0 && totalOps === 0) return 'demand_capture';
    // Waitlist: nothing yet
    return 'waitlist';
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.toUpperCase() || '';
    const city = searchParams.get('city') || '';
    const corridor = searchParams.get('corridor') || '';
    const originState = searchParams.get('origin_state')?.toUpperCase() || '';
    const destState = searchParams.get('destination_state')?.toUpperCase() || '';

    if (!state && !corridor && !(originState && destState)) {
        return NextResponse.json({ error: 'state, corridor, or origin_state+destination_state required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
        // 1. Active loads count + recent loads
        let loadsQuery = supabase
            .from('hc_load_alerts')
            .select('company_name, origin_city, origin_state, destination_city, destination_state, position_type, rate_amount, ingested_at')
            .eq('status', 'active')
            .order('ingested_at', { ascending: false })
            .limit(10);

        if (corridor) {
            loadsQuery = loadsQuery.eq('corridor', corridor);
        } else if (originState && destState) {
            // Lane query: origin→destination
            loadsQuery = loadsQuery.eq('origin_state', originState).eq('destination_state', destState);
        } else if (city && state) {
            loadsQuery = loadsQuery.or(`origin_state.eq.${state},destination_state.eq.${state}`)
                .or(`origin_city.ilike.%${city}%,destination_city.ilike.%${city}%`);
        } else if (state) {
            loadsQuery = loadsQuery.or(`origin_state.eq.${state},destination_state.eq.${state}`);
        }

        const { data: loadData, error: loadErr } = await loadsQuery;

        // 2. Operator counts
        let opsQuery = supabase
            .from('directory_listings')
            .select('id, verification_status, is_claimed', { count: 'exact', head: false });

        if (state) {
            opsQuery = opsQuery.ilike('home_base_state', state);
        }

        const { data: opsData, count: totalOps } = await opsQuery;

        const verifiedOps = (opsData || []).filter(
            (op: any) => op.verification_status === 'verified'
        ).length;
        
        const claimedOps = (opsData || []).filter(
            (op: any) => op.is_claimed === true
        ).length;

        // 3. Compute freshness
        const activeLoads = loadData?.length ?? 0;
        const lastActivity = loadData?.[0]?.ingested_at ?? null;
        const freshnessSec = lastActivity
            ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 1000)
            : 999999;

        // 4. Market mode
        const mode = determineMarketMode(
            activeLoads,
            verifiedOps,
            totalOps ?? 0,
            freshnessSec,
        );

        // 5. Recent loads (for display)
        const recentLoads = (loadData || []).slice(0, 5).map((l: any) => ({
            company_name: l.company_name || 'Unknown',
            origin: [l.origin_city, l.origin_state].filter(Boolean).join(', '),
            destination: [l.destination_city, l.destination_state].filter(Boolean).join(', '),
            position_type: l.position_type || 'unknown',
            rate_amount: l.rate_amount,
            ago: getAgoLabel(l.ingested_at),
        }));

        // 6. Service type mix + rate band
        const serviceTypeMix: Record<string, number> = {};
        const rates: number[] = [];
        for (const l of (loadData || [])) {
            const pt = (l as any).position_type || 'unknown';
            serviceTypeMix[pt] = (serviceTypeMix[pt] || 0) + 1;
            if ((l as any).rate_amount) rates.push((l as any).rate_amount);
        }
        rates.sort((a, b) => a - b);
        const rateBand = {
            min: rates.length > 0 ? rates[0] : null,
            max: rates.length > 0 ? rates[rates.length - 1] : null,
            median: rates.length > 0 ? rates[Math.floor(rates.length / 2)] : null,
        };

        const response: MarketHeartbeatResponse = {
            active_loads: activeLoads,
            verified_operators: verifiedOps,
            total_operators: totalOps ?? 0,
            claimed_operators: claimedOps,
            recent_loads: recentLoads,
            last_activity_at: lastActivity,
            market_mode: mode,
            freshness_seconds: freshnessSec,
            freshness_label: getAgoLabel(lastActivity),
            service_type_mix: serviceTypeMix,
            rate_band: rateBand,
        };

        return NextResponse.json(response, {
            headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
