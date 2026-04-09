import { createClient } from '@supabase/supabase-js';
import { sendPush } from '@/lib/push-admin';

// Task 9: Polygon-Bound FCM Push Notifications 
// This service takes the exact ST_Intersects PolyLine corridor matched in the database
// and targets high-priority FCM Push Notifications exclusively to drivers inside the polygon buffer.
// Completely eliminates false-positive radius alerts (e.g., rivers, mountains) leading to massive CTR spikes.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function dispatchPolygonPush(loadId: string, equipmentType: string, loadRate: number) {
    try {
        // 1. Invoke the PostGIS PolyLine RPC (Task 5 core logic)
        // This yields exactly the operator IDs physically overlapping the deadhead route polygon
        const { data: matches, error: matchError } = await supabaseAdmin
            .rpc('hc_match_operators_to_load_polyline', { 
                p_load_id: loadId, 
                p_buffer_meters: 16093.4 // Exactly 10 miles corridor bounds 
            });

        if (matchError || !matches || matches.length === 0) {
            console.log(`[Polygon Push] No interceptors found for load ${loadId}.`);
            return { sent: 0 };
        }

        const operatorIds = matches.map((m: any) => m.operator_id);

        // 2. Fetch the validated FCM Tokens for matched operators
        const { data: subscribers, error: pushError } = await supabaseAdmin
            .from('push_subscriptions')
            .select('user_id, fcm_token')
            .in('user_id', operatorIds)
            .eq('bad_token', false);
            
        if (pushError || !subscribers) return { sent: 0 };

        let sentCount = 0;
        
        // Map to prevent spamming dual tokens while ensuring delivery
        const tokensToFire = [...new Set(subscribers.map((s: any) => s.fcm_token))];

        // 3. Dispatch the high-priority Polygon Push
        for (const token of tokensToFire) {
            const success = await sendPush({
                token,
                title: '⚡ Load Crossing Your Vector',
                body: `A ${equipmentType} load paying $${loadRate} runs exactly through your current deadhead corridor. Tap to intercept.`,
                data: {
                    type: 'polygon_match_alert',
                    load_id: loadId,
                    action_url: `/dashboard/loads/${loadId}/claim`
                }
            });
            if (success) sentCount++;
        }

        // Store log metrics
        await supabaseAdmin.from('hc_polygon_push_metrics').insert({
            load_id: loadId,
            matched_operators: operatorIds.length,
            notifications_sent: sentCount
        });

        return { sent: sentCount };

    } catch (error) {
        console.error('[Polygon Push Error]', error);
        return { sent: 0 };
    }
}
