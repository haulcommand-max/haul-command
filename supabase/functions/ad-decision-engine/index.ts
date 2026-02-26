import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Ad Decision Engine — Scheduled Edge Function
 * 
 * Runs every 15–60 minutes. Three jobs:
 * 1. Update quality scores (CTR predictions, creative quality)
 * 2. Detect and flag fraud (rapid clicks, IP floods, blocked IPs)
 * 3. Recompute pacing factors (so campaigns deliver evenly across the day)
 * 4. Update advertiser trust scores
 */

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const results: Record<string, unknown> = {};

        // ── 1. Update Quality Scores ──
        const { data: qualityCount, error: qErr } = await supabase.rpc('update_ad_quality_scores');
        if (qErr) console.error('Quality score update error:', qErr);
        results.quality_scores_updated = qualityCount || 0;

        // ── 2. Run Fraud Detection ──
        const { data: fraudResult, error: fErr } = await supabase.rpc('detect_ad_fraud');
        if (fErr) console.error('Fraud detection error:', fErr);
        results.fraud = fraudResult || {};

        // ── 3. Recompute Pacing Factors ──
        // For each active campaign: pacing_factor = target / delivered (capped at 0.1–5.0)
        const { data: activeCampaigns } = await supabase
            .from('ad_campaigns')
            .select('id, daily_cap_cents')
            .eq('status', 'active');

        let pacingUpdated = 0;
        if (activeCampaigns) {
            for (const campaign of activeCampaigns) {
                // Count today's impressions for this campaign
                const { count: todayImpressions } = await supabase
                    .from('ad_impressions')
                    .select('id', { count: 'exact', head: true })
                    .in('creative_id',
                        (await supabase.from('ad_creatives').select('id').eq('campaign_id', campaign.id)).data?.map(c => c.id) || []
                    )
                    .gte('viewed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

                // Target: budget / CPM ($5 default) * 1000
                const targetImpressions = Math.max(1, (campaign.daily_cap_cents / 0.5));
                const currentHour = new Date().getUTCHours();
                const hoursLeft = Math.max(1, 24 - currentHour);
                const expectedByNow = targetImpressions * (currentHour / 24);

                let pacingFactor = 1.0;
                if ((todayImpressions || 0) > 0 && expectedByNow > 0) {
                    pacingFactor = Math.min(5.0, Math.max(0.1, expectedByNow / (todayImpressions || 1)));
                }

                await supabase.from('ad_pacing').upsert({
                    campaign_id: campaign.id,
                    target_date: new Date().toISOString().split('T')[0],
                    target_impressions: Math.round(targetImpressions),
                    delivered_impressions: todayImpressions || 0,
                    pacing_factor: Math.round(pacingFactor * 100) / 100,
                }, { onConflict: 'campaign_id,target_date' });

                pacingUpdated++;
            }
        }
        results.pacing_updated = pacingUpdated;

        // ── 4. Update Advertiser Trust Scores ──
        const { data: advertisers } = await supabase
            .from('ad_campaigns')
            .select('advertiser_id')
            .eq('status', 'active');

        const uniqueAdvertisers = [...new Set((advertisers || []).map(a => a.advertiser_id))];
        let trustUpdated = 0;

        for (const advId of uniqueAdvertisers) {
            // Get campaign creative IDs for this advertiser
            const { data: creativeIds } = await supabase
                .from('ad_creatives')
                .select('id')
                .in('campaign_id',
                    (await supabase.from('ad_campaigns').select('id').eq('advertiser_id', advId)).data?.map(c => c.id) || []
                );

            const cIds = (creativeIds || []).map(c => c.id);
            if (cIds.length === 0) continue;

            // Count valid vs total events
            const { count: totalEvents } = await supabase
                .from('ad_traffic_events')
                .select('id', { count: 'exact', head: true })
                .in('creative_id', cIds)
                .gte('occurred_at', new Date(Date.now() - 30 * 86400000).toISOString());

            const { count: invalidEvents } = await supabase
                .from('ad_traffic_events')
                .select('id', { count: 'exact', head: true })
                .in('creative_id', cIds)
                .eq('is_valid', false)
                .gte('occurred_at', new Date(Date.now() - 30 * 86400000).toISOString());

            // Creative quality from quality scores
            const { data: qualScores } = await supabase
                .from('ad_quality_scores')
                .select('quality_score')
                .in('creative_id', cIds);

            const avgCreativeQuality = qualScores && qualScores.length > 0
                ? qualScores.reduce((sum, q) => sum + (q.quality_score || 0), 0) / qualScores.length
                : 50;

            const fraudRate = (totalEvents || 0) > 0 ? (invalidEvents || 0) / (totalEvents || 1) : 0;
            const trustScore = Math.min(100, Math.max(0,
                100 - (fraudRate * 200) + (avgCreativeQuality * 0.3) - ((invalidEvents || 0) > 10 ? 20 : 0)
            ));

            await supabase.from('advertiser_trust_scores').upsert({
                advertiser_id: advId,
                trust_score: Math.round(trustScore * 100) / 100,
                creative_quality: Math.round(avgCreativeQuality * 100) / 100,
                policy_violations: invalidEvents || 0,
                last_computed_at: new Date().toISOString(),
            }, { onConflict: 'advertiser_id' });

            trustUpdated++;
        }
        results.trust_scores_updated = trustUpdated;

        // ── 5. Cleanup old traffic events (>30 days) ──
        const { count: cleaned } = await supabase
            .from('ad_traffic_events')
            .delete()
            .lt('occurred_at', new Date(Date.now() - 30 * 86400000).toISOString())
            .select('id', { count: 'exact', head: true });
        results.traffic_events_cleaned = cleaned || 0;

        return new Response(JSON.stringify({
            success: true,
            ...results,
            computed_at: new Date().toISOString(),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Ad decision engine error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
