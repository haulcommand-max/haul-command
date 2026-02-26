import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * recompute-ad-models — Scheduled Edge Function (every 15-60 min)
 * 
 * Learning loop:
 * 1. Recompute surface-specific CTR + quality scores
 * 2. Update advertiser trust rollups
 * 3. Recompute pacing curves
 * 4. Run fraud scoring across active sessions
 * 5. Cleanup stale frequency state
 */

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const results: Record<string, unknown> = {};

        // ── 1. Recompute surface-specific CTR + quality ──
        const { data: surfaces } = await supabase
            .from('ad_placements')
            .select('id, surface')
            .eq('is_active', true);

        let surfaceStatsUpdated = 0;
        for (const placement of (surfaces || [])) {
            // Get all creatives with their 7-day stats for this surface
            const { data: creatives } = await supabase
                .from('ad_creatives')
                .select('id, headline, body, image_url')
                .eq('status', 'active');

            for (const creative of (creatives || [])) {
                // Count 7-day impressions + clicks for this surface
                const { count: impressions } = await supabase
                    .from('ad_event_ledger')
                    .select('id', { count: 'exact', head: true })
                    .eq('ad_id', creative.id)
                    .eq('surface', placement.id)
                    .eq('event_type', 'impression')
                    .gte('event_time', new Date(Date.now() - 7 * 86400000).toISOString());

                const { count: clicks } = await supabase
                    .from('ad_event_ledger')
                    .select('id', { count: 'exact', head: true })
                    .eq('ad_id', creative.id)
                    .eq('surface', placement.id)
                    .eq('event_type', 'click')
                    .eq('billable', true)
                    .gte('event_time', new Date(Date.now() - 7 * 86400000).toISOString());

                const ctr = (impressions || 0) > 20
                    ? Math.min(1, (clicks || 0) / (impressions || 1))
                    : 0.01;

                // Creative quality: completeness score
                const qualityScore = Math.min(1, (
                    (creative.image_url ? 0.3 : 0) +
                    (creative.body && creative.body.length > 20 ? 0.25 : 0) +
                    (creative.headline && creative.headline.length > 5 ? 0.25 : 0) +
                    (ctr > 0.02 ? 0.2 : ctr > 0.01 ? 0.1 : 0)
                ));

                await supabase.from('ad_models_surface_stats').upsert({
                    surface: placement.id,
                    ad_id: creative.id,
                    impressions_7d: impressions || 0,
                    clicks_7d: clicks || 0,
                    ctr_7d: Math.round(ctr * 10000) / 10000,
                    quality_score: Math.round(qualityScore * 100) / 100,
                    last_recomputed_at: new Date().toISOString(),
                }, { onConflict: 'surface,ad_id' });

                surfaceStatsUpdated++;
            }
        }
        results.surface_stats_updated = surfaceStatsUpdated;

        // ── 2. Update advertiser trust ──
        const { data: advertisers } = await supabase
            .from('ad_campaigns')
            .select('advertiser_id')
            .eq('status', 'active');

        const uniqueAdvIds = [...new Set((advertisers || []).map(a => a.advertiser_id))];
        let trustUpdated = 0;

        for (const advId of uniqueAdvIds) {
            // Get all creative IDs for this advertiser
            const { data: campaigns } = await supabase
                .from('ad_campaigns')
                .select('id')
                .eq('advertiser_id', advId);

            const campIds = (campaigns || []).map(c => c.id);
            const { data: creatives } = await supabase
                .from('ad_creatives')
                .select('id')
                .in('campaign_id', campIds);

            const cIds = (creatives || []).map(c => c.id);
            if (cIds.length === 0) continue;

            const { count: totalEvents } = await supabase
                .from('ad_event_ledger')
                .select('id', { count: 'exact', head: true })
                .in('ad_id', cIds)
                .gte('event_time', new Date(Date.now() - 30 * 86400000).toISOString());

            const { count: invalidEvents } = await supabase
                .from('ad_event_ledger')
                .select('id', { count: 'exact', head: true })
                .in('ad_id', cIds)
                .eq('billable', false)
                .gte('event_time', new Date(Date.now() - 30 * 86400000).toISOString());

            const fraudRate = (totalEvents || 0) > 0 ? (invalidEvents || 0) / (totalEvents || 1) : 0;
            const trustScore = Math.min(100, Math.max(0, 80 - (fraudRate * 200)));

            await supabase.from('advertiser_trust_scores').upsert({
                advertiser_id: advId,
                trust_score: Math.round(trustScore * 100) / 100,
                policy_violations: invalidEvents || 0,
                last_computed_at: new Date().toISOString(),
            }, { onConflict: 'advertiser_id' });

            trustUpdated++;
        }
        results.trust_scores_updated = trustUpdated;

        // ── 3. Recompute pacing curves ──
        const { data: activeCampaigns } = await supabase
            .from('ad_campaigns')
            .select('id, daily_cap_cents')
            .eq('status', 'active');

        let pacingUpdated = 0;
        const currentHour = new Date().getUTCHours();

        for (const campaign of (activeCampaigns || [])) {
            const { count: todayImpressions } = await supabase
                .from('ad_event_ledger')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .eq('event_type', 'impression')
                .gte('event_time', new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString());

            // Count today's spend
            const { data: spendRows } = await supabase
                .from('ad_event_ledger')
                .select('cost_cents')
                .eq('campaign_id', campaign.id)
                .eq('billable', true)
                .gte('event_time', new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString());

            const totalSpent = (spendRows || []).reduce((sum, r) => sum + (r.cost_cents || 0), 0);
            const expectedSpent = Math.round((campaign.daily_cap_cents * currentHour) / 24);
            const aheadRatio = expectedSpent > 0 ? totalSpent / expectedSpent : 1.0;

            await supabase.from('ad_pacing_state').upsert({
                campaign_id: campaign.id,
                day: new Date().toISOString().split('T')[0],
                spent_cents: totalSpent,
                cap_cents: campaign.daily_cap_cents,
                expected_spent_cents: expectedSpent,
                ahead_ratio: Math.round(aheadRatio * 100) / 100,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'campaign_id,day' });

            pacingUpdated++;
        }
        results.pacing_updated = pacingUpdated;

        // ── 4. Run fraud scoring on active sessions ──
        const { data: activeSessions } = await supabase
            .from('ad_fraud_signals')
            .select('session_id')
            .gt('last_seen_at', new Date(Date.now() - 3600000).toISOString())
            .gt('impressions', 5)
            .limit(100);

        let fraudScored = 0;
        for (const session of (activeSessions || [])) {
            await supabase.rpc('compute_session_fraud_score', { p_session_id: session.session_id });
            fraudScored++;
        }
        results.sessions_fraud_scored = fraudScored;

        // ── 5. Cleanup stale frequency state (>7 days) ──
        const { count: freqCleaned } = await supabase
            .from('ad_frequency_state')
            .delete()
            .lt('day', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
            .select('viewer_key', { count: 'exact', head: true });
        results.frequency_state_cleaned = freqCleaned || 0;

        return new Response(JSON.stringify({
            success: true,
            ...results,
            computed_at: new Date().toISOString(),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Recompute ad models error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
