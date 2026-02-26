import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * availability-truth-tick — Cron Edge Function (every 5 min)
 * Expires stale availability, computes readiness gates, logs execution
 */
serve(async () => {
    const start = Date.now();
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // 1. Expire stale availability
        const { data: expiredCount } = await supabase.rpc('expire_stale_availability');

        // 2. Compute market liquidity scores
        const { data: liqCount } = await supabase.rpc('compute_market_liquidity_score');

        // 3. Evaluate readiness gates
        const { data: gates } = await supabase.rpc('evaluate_readiness_gates');

        // 4. Log execution
        await supabase.from('hc_edge_execution_log').insert({
            function_name: 'availability-truth-tick',
            execution_time_ms: Date.now() - start,
            success: true,
            records_processed: (expiredCount || 0) + (liqCount || 0),
            metadata: { expired: expiredCount, liquidity: liqCount, gates }
        });

        // 5. Log to cron audit
        await supabase.from('hc_cron_audit').insert({
            job_name: 'availability-truth-tick',
            scheduled_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: 'completed',
            records_processed: (expiredCount || 0) + (liqCount || 0),
        });

        return new Response(JSON.stringify({
            success: true,
            expired_escorts: expiredCount,
            liquidity_corridors_updated: liqCount,
            readiness_gates: gates,
            execution_time_ms: Date.now() - start
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )
        await supabase.from('hc_cron_audit').insert({
            job_name: 'availability-truth-tick',
            scheduled_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: String(error),
        });

        return new Response(JSON.stringify({
            success: false,
            error: String(error),
            execution_time_ms: Date.now() - start
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
