// POST /api/push/subscribe  — Register push subscription with role + geo targeting
// DELETE /api/push/subscribe — Unsubscribe
//
// VAPID key generation (run ONCE, then add to .env.local):
//   npx web-push generate-vapid-keys
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
//   VAPID_PRIVATE_KEY=<privateKey>
//   VAPID_EMAIL=mailto:ops@haulcommand.com

import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const body = await req.json();
    const { user_id, endpoint, keys, role, geo, user_agent } = body || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return new Response('Invalid payload', { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.from('web_push_subscriptions').upsert({
        user_id: user_id ?? null,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: user_agent ?? null,
        role: role ?? null,
        geo: geo ?? null,
        active: true,
        subscribed_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });

    if (error) return new Response(error.message, { status: 500 });

    // Attribution event (fire-and-forget)
    ;(async () => {
        try {
            await admin.from('swarm_activity_log').insert({
                agent_name: 'push_notification_agent',
                trigger_reason: 'push_subscribe',
                action_taken: `Push subscription registered${role ? ` role=${role}` : ''}${geo ? ` geo=${geo}` : ''}`,
                surfaces_touched: ['web_push_subscriptions'],
                revenue_impact: 5,
                country: geo ?? 'US',
                status: 'completed',
            });
        } catch {}
    })();



    return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
    const { endpoint } = await req.json();
    const admin = getSupabaseAdmin();
    await admin.from('web_push_subscriptions')
        .update({ active: false })
        .eq('endpoint', endpoint);
    return Response.json({ ok: true });
}

