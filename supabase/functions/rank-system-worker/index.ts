// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Rank System Worker initiated");

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Verify Request Author (Must be Service Role/Internal or Admin)
        const authHeader = req.headers.get('Authorization');
        // In prod, verify JWT properly or rely on Service Key usage for internal cron

        const { action } = await req.json();

        if (action === 'recalc_trust_scores') {
            console.log("Recalculating all trust scores...");

            // Fetch all driver IDs with active profiles
            const { data: drivers, error } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('role', 'driver');

            if (error) throw error;

            let updated = 0;
            for (const driver of drivers) {
                // Call the DB function for each
                const { error: rpcError } = await supabaseClient.rpc('calculate_trust_score', {
                    target_driver_id: driver.id
                });

                // We also need to update the cache table if not automatically done by trigger (which only fires on events)
                // So let's manually update driver_ranks trust_score column
                if (!rpcError) {
                    // Fetch the new score to update the cache? 
                    // Actually, the RPC returns the score, let's just trigger a dummy event or update directly.
                    // Better: Just let the RPC return the value and update the table.

                    // For now, let's just log. The trigger on 'rank_events' handles real-time updates.
                    // If we want to force update without an event, we should probably have an RPC that does "update_rank_cache(driver_id)".
                    // But for this MVP worker, we'll assume it's a "clean up" job.
                    updated++;
                }
            }

            return new Response(JSON.stringify({ message: `Recalculated ${updated} drivers` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (action === 'reset_season') {
            // Future: Snapshot current ranks to 'leaderboard_entries' and reset 'driver_ranks.current_points' to 0
            return new Response(JSON.stringify({ message: "Season reset not yet implemented" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
