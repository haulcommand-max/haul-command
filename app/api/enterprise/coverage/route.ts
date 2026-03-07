export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

/**
 * GET /api/enterprise/coverage
 *
 * Public data coverage map. No auth required.
 * Returns geo credibility scores and readiness bands for all regions.
 * Enterprise buyers use this to evaluate coverage for their corridors.
 */
export async function GET() {
    const svc = admin();

    // 1. Geo credibility scores
    const { data: geoScores } = await svc
        .from('geo_credibility_scores')
        .select('*')
        .order('composite_score', { ascending: false });

    // 2. Confidence distribution
    const { data: confDist } = await svc
        .from('data_confidence_snapshots')
        .select('confidence_band');

    const distribution: Record<string, number> = { verified: 0, high: 0, medium: 0, low: 0 };
    (confDist ?? []).forEach((c: any) => {
        if (c.confidence_band in distribution) distribution[c.confidence_band]++;
    });
    const total = Object.values(distribution).reduce((s, v) => s + v, 0) || 1;

    // 3. Coverage summary by readiness band
    const bandSummary = {
        tier_a: (geoScores ?? []).filter((g: any) => g.readiness_band === 'tier_a').length,
        tier_b: (geoScores ?? []).filter((g: any) => g.readiness_band === 'tier_b').length,
        tier_c: (geoScores ?? []).filter((g: any) => g.readiness_band === 'tier_c').length,
        tier_d: (geoScores ?? []).filter((g: any) => g.readiness_band === 'tier_d').length,
    };

    return NextResponse.json({
        regions: (geoScores ?? []).map((g: any) => ({
            region: g.region_code,
            country: g.country_code,
            readiness: g.readiness_band,
            composite_score: g.composite_score,
            corridor_density: g.corridor_density_score,
            escort_supply: g.escort_supply_score,
            observability: g.market_observability_score,
            freshness: g.freshness_index,
            suppressed: g.suppress_in_api,
        })),
        summary: bandSummary,
        confidence_distribution: {
            verified_pct: Math.round((distribution.verified / total) * 100),
            high_pct: Math.round((distribution.high / total) * 100),
            medium_pct: Math.round((distribution.medium / total) * 100),
            low_pct: Math.round((distribution.low / total) * 100),
            total_entities: total,
        },
        methodology: {
            confidence_model: 'Weighted composite: source_quality(0.30) + freshness(0.25) + geo_density(0.20) + cross_signal(0.15) + source_count(0.10)',
            freshness_decay: 'Exponential with 24h half-life',
            geo_readiness_bands: {
                tier_a: 'Production ready (composite >= 0.80)',
                tier_b: 'Emerging signal (composite >= 0.55)',
                tier_c: 'Experimental (composite >= 0.30)',
                tier_d: 'Insufficient data (suppressed from API)',
            },
        },
        generated_at: new Date().toISOString(),
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
    });
}
