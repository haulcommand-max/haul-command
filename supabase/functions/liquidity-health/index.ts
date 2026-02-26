import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Liquidity Health — Scheduled Edge Function
 * 
 * Computes corridor health scores and flags uncovered loads.
 * Run on a schedule (every 5 minutes recommended).
 */

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // 1. Compute corridor health scores
        const { data: healthCount, error: healthErr } = await supabase.rpc('compute_corridor_health');
        if (healthErr) console.error('Corridor health error:', healthErr);

        // 2. Flag uncovered loads
        const { data: flagCount, error: flagErr } = await supabase.rpc('flag_uncovered_loads');
        if (flagErr) console.error('Uncovered loads error:', flagErr);

        // 3. Auto-resolve alerts for loads that got matched
        const { data: resolved } = await supabase
            .from('uncovered_load_alerts')
            .update({ resolved_at: new Date().toISOString() })
            .is('resolved_at', null)
            .in('load_id',
                (await supabase.from('match_offers').select('load_id').in('status', ['offered', 'accepted'])).data?.map(r => r.load_id) || []
            )
            .select('id');

        return new Response(JSON.stringify({
            success: true,
            corridors_updated: healthCount || 0,
            loads_flagged: flagCount || 0,
            alerts_resolved: resolved?.length || 0,
            computed_at: new Date().toISOString(),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Liquidity health error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
