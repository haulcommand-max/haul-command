import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// ── Push Send (Consolidated) ──────────────────────────────────────────────────
//
// Sends push notifications to a user across all registered channels:
//   1. Web Push (service worker subscriptions via web_push_subscriptions)
//   2. FCM tokens (via push_tokens — used by firebase-push.ts and usePushRegistration)
//
// Canonical token table: push_tokens
// Legacy web push table: web_push_subscriptions (stores endpoint/keys for web-push lib)
//
// VAPID keys are initialized lazily to avoid build crashes when keys aren't set.

let _vapidInitialized = false;
function ensureVapid() {
    if (_vapidInitialized) return true;
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
        console.warn('[push-send] VAPID keys not configured — web push disabled.');
        return false;
    }
    webpush.setVapidDetails(
        'mailto:support@haulcommand.com',
        pub,
        priv.replace(/=+$/, ''),
    );
    _vapidInitialized = true;
    return true;
}

export type PushPayload = {
    title: string;
    body: string;
    url: string;
    meta?: Record<string, unknown>;
};

/**
 * Send push to a user across all their registered devices.
 * Queries both push_tokens (canonical) and web_push_subscriptions (legacy web push).
 * Returns count of successful sends.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let sent = 0;

    // ── 1. Web Push Subscriptions (endpoint/keys — for web-push library) ──
    if (ensureVapid()) {
        const { data: webSubs } = await supabase
            .from('web_push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId);

        if (webSubs?.length) {
            const results = await Promise.allSettled(
                webSubs.map(async (sub) => {
                    const subscription = {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    } as any;
                    await webpush.sendNotification(subscription, JSON.stringify(payload));
                })
            );
            sent += results.filter(r => r.status === 'fulfilled').length;
        }
    }

    // ── 2. FCM Tokens (from canonical push_tokens table) ──────────────────
    // These tokens can be sent via Firebase Admin SDK when configured.
    // For now, log the intent — FCM Admin SDK integration plugs in here.
    const { data: fcmTokens } = await supabase
        .from('push_tokens')
        .select('token, platform_new')
        .eq('profile_id', userId)
        .eq('enabled', true);

    let fcmSent = 0;
    if (fcmTokens?.length) {
        // Send via Firebase Admin SDK if configured (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT)
        try {
            const admin = await import('firebase-admin');
            if (!admin.apps.length) {
                const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                    : undefined;
                admin.initializeApp(serviceAccount
                    ? { credential: admin.credential.cert(serviceAccount) }
                    : { credential: admin.credential.applicationDefault() }
                );
            }
            const tokens = fcmTokens.map(t => t.token).filter(Boolean);
            if (tokens.length) {
                const response = await admin.messaging().sendEachForMulticast({
                    tokens,
                    notification: { title: payload.title, body: payload.body },
                    data: { url: payload.url, ...(payload.meta as Record<string, string> ?? {}) },
                });
                fcmSent = response.successCount;
            }
        } catch {
            // Firebase Admin SDK not installed or not configured — skip FCM
            console.log(`[push-send] ${fcmTokens.length} FCM token(s) for user ${userId.slice(0, 8)}… (firebase-admin not available)`);
        }
    }

    return { sent: sent + fcmSent, fcmPending: fcmSent > 0 ? 0 : (fcmTokens?.length ?? 0) };
}
