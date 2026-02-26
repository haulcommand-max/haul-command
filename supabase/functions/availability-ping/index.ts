import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * Availability Ping Loop — Scheduled Edge Function
 * 
 * Runs every 4 hours (via cron or manual trigger):
 * 1. Decays stale availability (escorts who haven't confirmed in 6h)
 * 2. Sends ping notifications to active escorts asking them to confirm
 * 3. Logs all pings for audit trail
 * 
 * Trigger via: POST /functions/v1/availability-ping
 */

const STALE_HOURS = 6
const BATCH_SIZE = 50

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // ── Step 1: Decay stale availability ──
        const { data: decayResult } = await supabase.rpc('decay_stale_availability', {
            stale_hours: STALE_HOURS
        })
        const staleCount = decayResult ?? 0

        // ── Step 2: Find escorts due for a ping ──
        // Ping escorts who: are available, haven't been pinged in 4h, haven't confirmed in 4h
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

        const { data: escortsToPing } = await supabase
            .from('profiles')
            .select('id, display_name')
            .eq('is_available', true)
            .eq('availability_stale', false)
            .or(`availability_confirmed_at.is.null,availability_confirmed_at.lt.${fourHoursAgo}`)
            .limit(BATCH_SIZE)

        if (!escortsToPing || escortsToPing.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                stale_decayed: staleCount,
                pings_sent: 0,
                message: 'No escorts due for ping'
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        // ── Step 3: Insert ping records ──
        const pingRecords = escortsToPing.map(e => ({
            profile_id: e.id,
            ping_type: 'push',
            ttl_hours: 4
        }))

        const { data: pings, error: pingErr } = await supabase
            .from('availability_pings')
            .insert(pingRecords)
            .select('id, profile_id')

        if (pingErr) {
            console.error('Ping insert error:', pingErr)
        }

        // ── Step 4: Trigger push notifications (via existing push infra) ──
        // This calls the existing /api/push/send endpoint for each escort
        const pushPromises = (escortsToPing || []).map(async (escort) => {
            try {
                await supabase.functions.invoke('push-notify', {
                    body: {
                        user_id: escort.id,
                        title: '🟢 Still Available?',
                        body: 'Tap to confirm your availability. Loads are waiting!',
                        data: { action: 'confirm_availability' }
                    }
                })
            } catch (e) {
                // Non-fatal: log and continue
                console.warn(`Push failed for ${escort.id}:`, e)
            }
        })

        await Promise.allSettled(pushPromises)

        return new Response(JSON.stringify({
            success: true,
            stale_decayed: staleCount,
            pings_sent: escortsToPing.length,
            escorts_pinged: escortsToPing.map(e => e.display_name)
        }), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('Availability ping error:', error)
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
