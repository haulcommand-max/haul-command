import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Market Intelligence — Scheduled Edge Function (every 5 min)
 * 
 * Runs the complete intelligence refresh cycle:
 * 1. Compute scarcity index per corridor
 * 2. Compute broker risk scores
 * 3. Compute surge pricing per corridor
 * 4. Self-audit checks
 */

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const results: Record<string, unknown> = {};

        // 1. Scarcity Index — all corridors
        const { data: scarcityCount, error: sErr } = await supabase.rpc('compute_scarcity_index');
        if (sErr) console.error('Scarcity error:', sErr);
        results.corridors_scarcity_computed = scarcityCount || 0;

        // 2. Broker Risk Scores — all brokers
        const { data: riskCount, error: rErr } = await supabase.rpc('compute_broker_risk_score');
        if (rErr) console.error('Broker risk error:', rErr);
        results.brokers_risk_computed = riskCount || 0;

        // 3. Surge Pricing — for all corridors with scarcity data
        const { data: corridors } = await supabase
            .from('hc_scarcity_index')
            .select('corridor_id, scarcity_index')
            .order('scarcity_index', { ascending: false })
            .limit(100);

        let surgeComputed = 0;
        for (const corridor of (corridors || [])) {
            await supabase.rpc('compute_surge_pricing', {
                p_corridor_id: corridor.corridor_id,
                p_urgency_level: 0,
                p_time_to_start_hours: 48,
            });
            surgeComputed++;
        }
        results.corridors_surge_computed = surgeComputed;

        // 4. Self-audit
        const audits: Record<string, boolean> = {};

        const { count: eventCount } = await supabase
            .from('hc_event_stream')
            .select('id', { count: 'exact', head: true })
            .gte('event_time', new Date(Date.now() - 24 * 3600000).toISOString());
        audits.event_stream_active = (eventCount || 0) > 0;

        const { count: lifecycleCount } = await supabase
            .from('hc_job_lifecycle')
            .select('job_id', { count: 'exact', head: true });
        audits.job_lifecycle_populated = (lifecycleCount || 0) > 0;

        const { count: rateCount } = await supabase
            .from('hc_rate_facts')
            .select('id', { count: 'exact', head: true });
        audits.rate_facts_populated = (rateCount || 0) > 0;

        const { count: paymentCount } = await supabase
            .from('hc_broker_payment_facts')
            .select('id', { count: 'exact', head: true });
        audits.payment_facts_populated = (paymentCount || 0) > 0;

        const { data: scarcityNull } = await supabase
            .from('hc_scarcity_index')
            .select('corridor_id')
            .is('scarcity_index', null)
            .limit(1);
        audits.scarcity_index_non_null = !scarcityNull?.length;

        results.self_audit = audits;

        return new Response(JSON.stringify({
            success: true,
            ...results,
            computed_at: new Date().toISOString(),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Market intelligence error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
