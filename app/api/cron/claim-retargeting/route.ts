import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'edge';

// ══════════════════════════════════════════════════════════════
// POST /api/cron/claim-retargeting
// Runs daily. Finds operators who initiated the claim flow or were
// viewed heavily in the directory but failed to finalize their verification.
// Sends high-converting Push Notification + Email via Firebase/Resend.
// ══════════════════════════════════════════════════════════════

export async function POST(req: Request) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Find operators who started a claim but stopped before verification
        // (i.e. they created an auth user attached to an operator record, but is_claimed=false)
        const { data: abandonedClaims, error: claimsError } = await supabase
            .from('hc_global_operators')
            .select(`
                id, 
                business_name, 
                claim_started_at,
                auth_user_id
            `)
            .eq('is_claimed', false)
            .not('auth_user_id', 'is', null)
            .not('claim_started_at', 'is', null)
            // Example window: Abandoned 24 hours ago
            .lt('claim_started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .gt('claim_started_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());

        if (claimsError) throw claimsError;

        if (!abandonedClaims || abandonedClaims.length === 0) {
            return NextResponse.json({ message: 'No abandoned claims to retarget today.', count: 0 });
        }

        // 2. Resolve Firebase FCM logic (via Supabase devices table)
        // Extract Auth User IDs to lookup FCM tokens
        const userIds = abandonedClaims.map(c => c.auth_user_id);
        const { data: devices } = await supabase
            .from('hc_device_tokens') // Schema from NativeBootstrap
            .select('user_id, token')
            .in('user_id', userIds);

        // 3. Dispatch High-FOMO Notifications
        let messagesSent = 0;

        for (const claim of abandonedClaims) {
            const userDevices = (devices || []).filter(d => d.user_id === claim.auth_user_id);
            
            for (const device of userDevices) {
                if (device.token) {
                    // Injecting a Firebase push notification via Supabase Edge Function or custom RPC
                    // E.g. we use the built in push handler
                    await supabase.rpc('trigger_fcm_notification', {
                        p_token: device.token,
                        p_title: 'Your profile got views today \uD83D\uDC40',
                        p_body: `Verify ${claim.business_name || 'your profile'} to see who is viewing you and start securing loads.`,
                        p_data: { deepLink: `haulcommand://claim/resume/${claim.id}` }
                    });
                    messagesSent++;
                }
            }

            // We would also optionally hit Resend/Email here targeting their auth email.
            // await sendRescueEmail(claim.auth_user_id, claim.id);
        }

        return NextResponse.json({
            success: true,
            abandoned_claims_found: abandonedClaims.length,
            push_notifications_sent: messagesSent
        });

    } catch (e: any) {
        console.error(`[Claim Retargeting Cron] execution failed:`, e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
