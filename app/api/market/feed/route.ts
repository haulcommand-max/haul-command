/**
 * HAUL COMMAND — Live Market Feed API
 * 
 * GET /api/market/feed
 * Returns real-time market pulse ticker items + radar geo data
 * powered by hc_event_journal → hc_rm_market_pulse + hc_rm_radar_geo
 * 
 * Every item includes provenance + freshness timestamps.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 30; // ISR: refresh every 30s
export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const country = searchParams.get('country') || 'US';
        const limit = Math.min(Number(searchParams.get('limit') || 12), 50);

        const sb = getSupabase();

        const [tickerRes, radarRes, pulseRes] = await Promise.all([
            // Market pulse ticker items
            sb.from('hc_rm_market_pulse')
                .select('pulse_id, title, body, severity, category, href, country_code, region_code, created_at, freshness_at, provenance')
                .eq('country_code', country)
                .order('created_at', { ascending: false })
                .limit(limit),

            // Radar geo aggregates
            sb.from('hc_rm_radar_geo')
                .select('*')
                .eq('country_code', country)
                .order('broker_load_count_24h', { ascending: false }),

            // Live market pulse view (summary stats)
            sb.from('v_market_pulse_live')
                .select('*')
                .single(),
        ]);

        return NextResponse.json({
            ticker: tickerRes.data || [],
            radar: radarRes.data || [],
            pulse: pulseRes.data || {
                open_loads_24h: 0,
                loads_72h: 0,
                active_brokers_72h: 0,
                critical_risk_signals: 0,
                active_corridors_72h: 0,
                total_broker_entities: 0,
                total_broker_loads: 0,
            },
            meta: {
                country,
                timestamp: new Date().toISOString(),
                ticker_count: tickerRes.data?.length || 0,
                radar_regions: radarRes.data?.length || 0,
            },
        });
    } catch (error) {
        console.error('Market feed API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market feed' },
            { status: 500 },
        );
    }
}
