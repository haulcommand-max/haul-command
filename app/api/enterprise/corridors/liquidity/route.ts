export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { enterpriseGate, shapeResponse, logResponseMetrics } from '@/lib/enterprise/auth-middleware';
import { enrichWithConfidence, filterByGeoCredibility, recordLatency } from '@/lib/enterprise/data-confidence';

/**
 * GET /api/enterprise/corridors/liquidity
 * Enterprise corridor liquidity API endpoint
 * Returns aggregated, redacted corridor liquidity data
 *
 * Auth: Enterprise API key required (X-API-Key header)
 * Product: operations_optimizer (pro_intelligence tier+)
 *
 * Tier 3: Includes confidence metadata + geo credibility gating
 */
export async function GET(req: NextRequest) {
    const startMs = Date.now();

    // ── Auth + Entitlement Gate ────────────────────────────────
    const gate = await enterpriseGate(req, 'operations_optimizer');
    if (gate.error) return gate.error;
    const ctx = gate.context!;

    // ── Query ─────────────────────────────────────────────────
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
    if (error) {
        recordLatency('corridor_intelligence', -1); // negative = error marker
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Tier-aware response shaping ───────────────────────────
    const raw = (data || []).map(d => ({
        corridor_id: d.corridor_id,
        liquidity_score: d.liquidity_score,
        liquidity_band: d.liquidity_band,
        fill_rate: d.fill_rate,
        fill_rate_band: (d.fill_rate || 0) >= 0.8 ? 'high' : (d.fill_rate || 0) >= 0.5 ? 'medium' : 'low',
        median_time_to_fill_minutes: d.median_time_to_fill_minutes,
        p90_time_to_fill_minutes: d.p90_time_to_fill_minutes,
        response_rate: d.response_rate,
        response_rate_band: (d.response_rate || 0) >= 0.7 ? 'strong' : (d.response_rate || 0) >= 0.4 ? 'moderate' : 'weak',
        corridor_rate_per_mile_median: d.corridor_rate_per_mile_median,
        corridor_rate_volatility: d.corridor_rate_volatility,
        volatility_band: (d.corridor_rate_volatility || 0) > 3 ? 'high' : (d.corridor_rate_volatility || 0) > 1 ? 'moderate' : 'stable',
        updated_at: d.created_at,
    }));

    const shaped = shapeResponse(raw, ctx, 'operations_optimizer');

    // ── Geo credibility gating (Tier 3) ───────────────────────
    const { data: geoFiltered, suppressed, warnings } = await filterByGeoCredibility(shaped);

    // ── Confidence enrichment (Tier 3) ────────────────────────
    const enriched = await enrichWithConfidence(geoFiltered, 'corridor', 'corridor_id', {
        defaultSourceQuality: 0.6,
        defaultGeoDensity: 0.5,
    });

    const latencyMs = Date.now() - startMs;
    recordLatency('corridor_intelligence', latencyMs);

    // ── Log metrics with endpoint metadata ────────────────────
    await logResponseMetrics(ctx, enriched.length, latencyMs, {
        endpoint: '/api/enterprise/corridors/liquidity',
        method: 'GET',
        statusCode: 200,
    });

    return NextResponse.json({
        corridors: enriched,
        count: enriched.length,
        meta: {
            tier: ctx.tier,
            product: 'operations_optimizer',
            geo_suppressed: suppressed,
            geo_warnings: warnings.length > 0 ? warnings : undefined,
        },
    });
}
