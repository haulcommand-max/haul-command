/**
 * Supabase Edge Function: rate-index-recompute
 *
 * Runs nightly via pg_cron to materialize the rate_index_cache table
 * from lb_corridors + lb_observations data.
 *
 * Schedule: 0 3 * * * (3 AM UTC daily)
 *
 * This replaces the stub function with the real implementation.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const startTime = Date.now();

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // Step 1: Call the recompute function
        const { data: count, error: recomputeError } = await supabase.rpc('recompute_rate_index_cache');

        if (recomputeError) {
            throw new Error(`Recompute RPC failed: ${recomputeError.message}`);
        }

        // Step 2: Get summary stats for the log
        const { data: stats } = await supabase
            .from('rate_index_cache')
            .select('corridor_key, avg_rate_per_mile, demand_band, trend_direction', { count: 'exact' });

        const totalCorridors = stats?.length || 0;
        const byDemand = {
            dominant: stats?.filter(s => s.demand_band === 'dominant').length || 0,
            strong: stats?.filter(s => s.demand_band === 'strong').length || 0,
            emerging: stats?.filter(s => s.demand_band === 'emerging').length || 0,
            cold: stats?.filter(s => s.demand_band === 'cold').length || 0,
        };
        const byTrend = {
            rising: stats?.filter(s => s.trend_direction === 'rising').length || 0,
            stable: stats?.filter(s => s.trend_direction === 'stable').length || 0,
            falling: stats?.filter(s => s.trend_direction === 'falling').length || 0,
        };

        const elapsed = Date.now() - startTime;

        return new Response(JSON.stringify({
            status: "rate_index_updated",
            corridors_processed: count || 0,
            total_corridors_cached: totalCorridors,
            demand_breakdown: byDemand,
            trend_breakdown: byTrend,
            elapsed_ms: elapsed,
            timestamp: new Date().toISOString(),
        }), {
            headers: { ...corsHeaders, "content-type": "application/json" },
        });

    } catch (error: any) {
        console.error('[rate-index-recompute] Error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            elapsed_ms: Date.now() - startTime,
        }), {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" },
        });
    }
});
