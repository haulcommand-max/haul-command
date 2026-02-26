import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID keys are initialized lazily inside sendPushToUser.
// Per spec: push is wired but inactive until FCM/VAPID keys are confirmed.
// Moving setVapidDetails here (top-level) crashes builds when keys aren't set.
let _vapidInitialized = false;
function ensureVapid() {
    if (_vapidInitialized) return;
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
        throw new Error('Push not configured — VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
    }
    // Strip any = padding that web-push rejects
    webpush.setVapidDetails(
        'mailto:support@haulcommand.com',
        pub,
        priv.replace(/=+$/, ''),
    );
    _vapidInitialized = true;
}


type PushPayload = {
    title: string;
    body: string;
    url: string;
    meta?: Record<string, unknown>;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
    ensureVapid(); // lazy init — safe at build time
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('web_push_subscriptions')
        .select('endpoint,p256dh,auth')
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { sent: 0 };

    let sent = 0;
    await Promise.allSettled(
        data.map(async (sub) => {
            const subscription = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            } as any;

            await webpush.sendNotification(subscription, JSON.stringify(payload));
            sent += 1;
        })
    );

    return { sent };
}
