import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getObservationSummary } from '@/lib/intel/capture';

/**
 * GET /api/intel/scarcity
 *
 * Corridor scarcity intelligence.
 * Params: ?country=US&band=critical_shortage&limit=20
 *
 * EVERY response includes: basis, observations_count, sources_used
 */

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const country = url.searchParams.get('country');
    const band = url.searchParams.get('band');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let query = supabase
        .from('corridor_scarcity_scores')
        .select('corridor_slug, country_code, region_code, scarcity_band, scarcity_score_adjusted, supply_index, demand_intensity_index, friction_multiplier, confidence, forecast_24h_band, forecast_72h_band, computed_at')
        .order('scarcity_score_adjusted', { ascending: false })
        .limit(limit);

    if (country) query = query.eq('country_code', country.toUpperCase());
    if (band) query = query.eq('scarcity_band', band);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get observation context
    const countryCode = country?.toUpperCase() || 'US';
    const obs = await getObservationSummary(countryCode);

    // Enrich each corridor with basis
    const enriched = (data || []).map((row) => ({
        ...row,
        basis: obs.scarcityBasis,
        observations_count: obs.scarcityObservations30d,
        sources_used: buildSourcesList(obs),
    }));

    // Summary stats
    const bands: Record<string, number> = {};
    for (const row of data || []) {
        bands[row.scarcity_band] = (bands[row.scarcity_band] || 0) + 1;
    }

    return NextResponse.json({
        total: enriched.length,
        basis: obs.scarcityBasis,
        observations_count: obs.scarcityObservations30d,
        band_distribution: bands,
        corridors: enriched,
        note: obs.scarcityObservations30d === 0
            ? 'Estimate (low confidence) — improves as marketplace activity accumulates'
            : `Based on ${obs.scarcityObservations30d} observations (30d)`,
        generated_at: new Date().toISOString(),
    });
}

function buildSourcesList(obs: { behavioralEvents30d: number; crowdReports30d: number; scarcityObservations30d: number }) {
    const sources: string[] = ['baseline_heuristic'];
    if (obs.behavioralEvents30d > 0) sources.push('behavioral_exhaust');
    if (obs.crowdReports30d > 0) sources.push('crowdsourced');
    if (obs.scarcityObservations30d > 0) sources.push('scarcity_observations');
    return sources;
}
