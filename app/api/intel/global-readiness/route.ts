import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/intel/global-readiness
 *
 * Executive dashboard: country readiness, scarcity overview, friction summary,
 * monetization targets, and recruitment hotspots.
 *
 * Auth: CRON_SECRET or service_role
 */

interface CountryReadiness {
    country_code: string;
    tier: string;
    overall_readiness: number;
    monetization_readiness: number;
    escort_supply_density: number;
    permit_rule_coverage: number;
    payment_confidence: number;
    crowd_signal_volume: number;
    data_thin_areas: string[];
    high_value_gaps: string[];
    recommended_sources: string[];
}

interface ScarcitySummary {
    corridor_slug: string;
    country_code: string;
    scarcity_band: string;
    scarcity_score_adjusted: number;
    supply_index: number;
    demand_intensity_index: number;
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || req.headers.get('x-ops-secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Country readiness scores
    const { data: readiness } = await supabase
        .from('country_readiness_scores')
        .select('*')
        .order('overall_readiness', { ascending: false });

    // 2. Top shortage zones
    const { data: scarcity } = await supabase
        .from('corridor_scarcity_scores')
        .select('corridor_slug, country_code, scarcity_band, scarcity_score_adjusted, supply_index, demand_intensity_index')
        .in('scarcity_band', ['shortage_risk', 'critical_shortage'])
        .order('scarcity_score_adjusted', { ascending: false })
        .limit(10);

    // 3. Highest friction corridors
    const { data: friction } = await supabase
        .from('permit_friction_scores')
        .select('country_code, region_code, corridor_slug, friction_score, friction_band, confidence')
        .in('friction_band', ['high', 'extreme'])
        .order('friction_score', { ascending: false })
        .limit(10);

    // 4. Recruitment hotspots
    const { data: recruitment } = await supabase
        .from('recruitment_priority_zones')
        .select('*')
        .eq('is_active', true)
        .order('priority_rank', { ascending: true })
        .limit(10);

    // 5. Crowd intel volume by country (last 30d)
    const { data: crowdCounts } = await supabase
        .from('crowd_intel_events')
        .select('country_code')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const crowdByCountry: Record<string, number> = {};
    for (const e of crowdCounts || []) {
        crowdByCountry[e.country_code] = (crowdByCountry[e.country_code] || 0) + 1;
    }

    // Group readiness by tier
    const tiers: Record<string, CountryReadiness[]> = { home: [], tier_a: [], tier_b: [], tier_c: [] };
    for (const r of (readiness || []) as CountryReadiness[]) {
        const t = r.tier || 'tier_c';
        if (!tiers[t]) tiers[t] = [];
        tiers[t].push(r);
    }

    // Fastest monetization targets (sort by monetization readiness descending, exclude home)
    const monetizationTargets = (readiness || [])
        .filter((r: CountryReadiness) => r.tier !== 'home')
        .sort((a: CountryReadiness, b: CountryReadiness) => b.monetization_readiness - a.monetization_readiness)
        .slice(0, 5)
        .map((r: CountryReadiness) => ({
            country: r.country_code,
            monetization_readiness: r.monetization_readiness,
            overall_readiness: r.overall_readiness,
            key_gap: r.high_value_gaps?.[0] || 'none',
        }));

    // Weakest supply regions
    const weakestSupply = (readiness || [])
        .sort((a: CountryReadiness, b: CountryReadiness) => a.escort_supply_density - b.escort_supply_density)
        .slice(0, 5)
        .map((r: CountryReadiness) => ({
            country: r.country_code,
            escort_density: r.escort_supply_density,
            thin_areas: r.data_thin_areas?.slice(0, 2) || [],
        }));

    return NextResponse.json({
        generated_at: new Date().toISOString(),
        status: 'ok',

        readiness_by_tier: tiers,

        top_10_shortage_zones: (scarcity || []).map((s: ScarcitySummary) => ({
            corridor: s.corridor_slug,
            country: s.country_code,
            band: s.scarcity_band,
            score: s.scarcity_score_adjusted,
            supply: s.supply_index,
            demand: s.demand_intensity_index,
        })),

        highest_friction_corridors: (friction || []).map((f: { corridor_slug: string; country_code: string; friction_band: string; friction_score: number; confidence: number }) => ({
            corridor: f.corridor_slug,
            country: f.country_code,
            band: f.friction_band,
            score: f.friction_score,
            confidence: f.confidence,
        })),

        recruitment_hotspots: recruitment || [],

        crowd_signal_volume_30d: crowdByCountry,

        fastest_monetization_targets: monetizationTargets,
        weakest_supply_regions: weakestSupply,

        recommended_next_beachhead: monetizationTargets[0]?.country || 'AU',
    });
}
