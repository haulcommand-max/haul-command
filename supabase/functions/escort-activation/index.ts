import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Escort Activation Engine — Scheduled Edge Function
 * 
 * Smart wake notifications + inactivity nudge sequences:
 * - Day 1 dormant: gentle_ping
 * - Day 3 dormant: missing_loads (with load count in territory)
 * - Day 7 dormant: going_dormant warning
 * - Smart wake: nudge when predicted availability window approaches + demand exists
 */

const NUDGE_SEQUENCE = [
    { days: 1, type: 'gentle_ping', message: "Hey! 👋 Quick check — are you still available for escort work?" },
    { days: 3, type: 'missing_loads', message: "📦 You've missed {count} loads in your area this week. Tap to go online." },
    { days: 7, type: 'going_dormant', message: "⚠️ Your profile is going dormant. Go online now to stay in the active pool." },
] as const;

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        let nudgesSent = 0;
        let staleMarked = 0;

        // 1. Auto-mark stale escorts as unavailable (48h timeout)
        const { data: staleCount } = await supabase.rpc('auto_unavailable_stale_escorts');
        staleMarked = staleCount || 0;

        // 2. Process inactivity nudge sequence
        for (const step of NUDGE_SEQUENCE) {
            // Find escorts dormant for exactly N days (±6h window to avoid duplicates)
            const { data: dormant } = await supabase
                .from('escort_presence')
                .select('escort_id')
                .eq('status', 'offline')
                .lt('updated_at', new Date(Date.now() - step.days * 86400000).toISOString())
                .gt('updated_at', new Date(Date.now() - (step.days + 1) * 86400000).toISOString())
                .limit(50);

            if (!dormant?.length) continue;

            for (const escort of dormant) {
                // Check if already nudged at this tier
                const { data: existing } = await supabase
                    .from('activation_nudges')
                    .select('id')
                    .eq('escort_id', escort.escort_id)
                    .eq('nudge_type', step.type)
                    .gt('sent_at', new Date(Date.now() - 7 * 86400000).toISOString())
                    .limit(1);

                if (existing?.length) continue;

                // Insert nudge record
                await supabase.from('activation_nudges').insert({
                    escort_id: escort.escort_id,
                    nudge_type: step.type,
                    channel: 'push',
                });
                nudgesSent++;
            }
        }

        // 3. Smart wake: predicted availability + territory demand
        const now = new Date();
        const currentDOW = now.getUTCDay();
        const currentHour = now.getUTCHours();

        const { data: predictedAvail } = await supabase
            .from('escort_predicted_availability')
            .select('escort_id')
            .eq('day_of_week', currentDOW)
            .eq('hour_block', currentHour)
            .gte('probability', 0.6)
            .limit(25);

        if (predictedAvail?.length) {
            for (const pred of predictedAvail) {
                // Check if escort is currently offline
                const { data: presence } = await supabase
                    .from('escort_presence')
                    .select('status')
                    .eq('escort_id', pred.escort_id)
                    .single();

                if (presence?.status !== 'offline') continue;

                // Check for demand in their territory
                const { data: territory } = await supabase
                    .from('escort_territory_claims')
                    .select('state_code')
                    .eq('escort_id', pred.escort_id)
                    .limit(5);

                if (!territory?.length) continue;

                const stateCodes = territory.map(t => t.state_code);
                const { count: demandCount } = await supabase
                    .from('loads')
                    .select('id', { count: 'exact', head: true })
                    .in('origin_state', stateCodes)
                    .in('status', ['open', 'active']);

                if ((demandCount || 0) > 0) {
                    // Avoid duplicate smart wakes
                    const { data: recentWake } = await supabase
                        .from('activation_nudges')
                        .select('id')
                        .eq('escort_id', pred.escort_id)
                        .eq('nudge_type', 'smart_wake')
                        .gt('sent_at', new Date(Date.now() - 12 * 3600000).toISOString())
                        .limit(1);

                    if (!recentWake?.length) {
                        await supabase.from('activation_nudges').insert({
                            escort_id: pred.escort_id,
                            nudge_type: 'smart_wake',
                            channel: 'push',
                        });
                        nudgesSent++;
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            stale_marked_offline: staleMarked,
            nudges_sent: nudgesSent,
            computed_at: new Date().toISOString(),
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Escort activation error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
