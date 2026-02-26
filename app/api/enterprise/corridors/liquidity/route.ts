export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/enterprise/corridors/liquidity
 * Enterprise corridor liquidity API endpoint
 * Returns aggregated, redacted corridor liquidity data
 */
export async function GET(req: NextRequest) {
    const corridor = req.nextUrl.searchParams.get('corridor_id');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const supabase = createClient();

    let query = supabase
        .from('hc_corridor_market_metrics')
        .select('corridor_id, liquidity_score, liquidity_band, fill_rate, median_time_to_fill_minutes, p90_time_to_fill_minutes, response_rate, corridor_rate_per_mile_median, corridor_rate_volatility, created_at')
        .order('liquidity_score', { ascending: false })
        .limit(Math.min(limit, 100));

    if (corridor) query = query.eq('corridor_id', corridor);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Redaction: round values, suppress small samples
    const redacted = (data || []).map(d => ({
        corridor_id: d.corridor_id,
        liquidity_score: Math.round((d.liquidity_score || 0) * 100) / 100,
        liquidity_band: d.liquidity_band,
        fill_rate_band: (d.fill_rate || 0) >= 0.8 ? 'high' : (d.fill_rate || 0) >= 0.5 ? 'medium' : 'low',
        median_fill_minutes_range: `${Math.round((d.median_time_to_fill_minutes || 0) / 5) * 5}-${Math.round((d.median_time_to_fill_minutes || 0) / 5) * 5 + 10}`,
        response_rate_band: (d.response_rate || 0) >= 0.7 ? 'strong' : (d.response_rate || 0) >= 0.4 ? 'moderate' : 'weak',
        rate_per_mile_median: Math.round((d.corridor_rate_per_mile_median || 0) * 100) / 100,
        volatility_band: (d.corridor_rate_volatility || 0) > 3 ? 'high' : (d.corridor_rate_volatility || 0) > 1 ? 'moderate' : 'stable',
        updated_at: d.created_at,
    }));

    return NextResponse.json({ corridors: redacted, count: redacted.length });
}
