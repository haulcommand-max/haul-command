import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/cron/claim-pressure
 * Runs nightly to advance claim pressure stages based on aging + signals.
 *
 * Stage progression logic:
 *   Stage 0 → 1: shell_age_days ≥ 30 AND page_indexed = true
 *   Stage 1 → 2: shell_age_days ≥ 60 AND (profile_views ≥ 5 OR organic_impressions ≥ 50)
 *   Stage 2 → 3: shell_age_days ≥ 90 AND (nearby_competitor_claims ≥ 1 OR demand_activity_touches ≥ 3)
 *   Stage 3 → 4: shell_age_days ≥ 120 AND (profile_views ≥ 25 OR saved_search_touches ≥ 5)
 */
export async function POST() {
    const supabase = getSupabaseAdmin();
    const results = { stage_0_to_1: 0, stage_1_to_2: 0, stage_2_to_3: 0, stage_3_to_4: 0, errors: [] as string[] };

    // Stage 0 → 1: Soft FOMO (30+ days, indexed)
    const { count: s01 } = await supabase
        .from('hc_claim_pressure_state')
        .update({ pressure_stage: 1, updated_at: new Date().toISOString() })
        .eq('pressure_stage', 0)
        .eq('claim_status', 'unclaimed')
        .eq('page_indexed', true)
        .gte('shell_age_days', 30);
    results.stage_0_to_1 = s01 ?? 0;

    // Stage 1 → 2: Operational benefit (60+ days, engagement signals)
    const { count: s12 } = await supabase
        .from('hc_claim_pressure_state')
        .update({ pressure_stage: 2, updated_at: new Date().toISOString() })
        .eq('pressure_stage', 1)
        .eq('claim_status', 'unclaimed')
        .gte('shell_age_days', 60)
        .or('profile_views.gte.5,organic_impressions.gte.50');
    results.stage_1_to_2 = s12 ?? 0;

    // Stage 2 → 3: Competitive pressure (90+ days, competitor/demand signals)
    const { count: s23 } = await supabase
        .from('hc_claim_pressure_state')
        .update({ pressure_stage: 3, updated_at: new Date().toISOString() })
        .eq('pressure_stage', 2)
        .eq('claim_status', 'unclaimed')
        .gte('shell_age_days', 90)
        .or('nearby_competitor_claims.gte.1,demand_activity_touches.gte.3');
    results.stage_2_to_3 = s23 ?? 0;

    // Stage 3 → 4: Rescue outreach (120+ days, high engagement)
    const { count: s34 } = await supabase
        .from('hc_claim_pressure_state')
        .update({ pressure_stage: 4, updated_at: new Date().toISOString() })
        .eq('pressure_stage', 3)
        .eq('claim_status', 'unclaimed')
        .gte('shell_age_days', 120)
        .or('profile_views.gte.25,saved_search_touches.gte.5');
    results.stage_3_to_4 = s34 ?? 0;

    return NextResponse.json({
        success: true,
        promotions: results,
        timestamp: new Date().toISOString(),
    });
}
