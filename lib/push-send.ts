import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// ── NATIVE PUSH ENGINE (V2) ──────────────────────────────────────────────────
// Re-established Firebase Admin SDK for Native APNs/FCM delivery.
// Features immutable delivery logging, token invalidation, and urgency prioritization.

let _vapidInitialized = false;
function ensureVapid() {
    if (_vapidInitialized) return true;
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
        return false;
    }
    webpush.setVapidDetails('mailto:support@haulcommand.com', pub, priv.replace(/=+$/, ''));
    _vapidInitialized = true;
    return true;
}

let fbAdmin: any = null;
async function getFirebaseAdmin() {
    if (fbAdmin) return fbAdmin;
    try {
        const firebaseAdminImport = await import('firebase-admin');
        if (!firebaseAdminImport.default.apps.length) {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (serviceAccount) {
                firebaseAdminImport.default.initializeApp({
                    credential: firebaseAdminImport.default.credential.cert(JSON.parse(serviceAccount)),
                });
            } else {
                firebaseAdminImport.default.initializeApp();
            }
        }
        fbAdmin = firebaseAdminImport.default;
        return fbAdmin;
    } catch (e) {
        console.warn('[push-engine] Firebase Admin init failed:', e);
        return null;
    }
}

export type PushPriority = 'urgent' | 'high' | 'normal';

export type PushPayload = {
    title: string;
    body: string;
    url?: string;
    priority?: PushPriority;
    loadId?: string;
    meta?: Record<string, string>;
};

export async function sendNativePush(userId: string, payload: PushPayload) {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const priority = payload.priority || 'normal';
    
    // 1. Fetch Tokens
    const { data: fcmTokens } = await supabase
        .from('push_tokens')
        .select('token, platform')
        .eq('profile_id', userId)
        .eq('enabled', true);

    const { data: webSubs } = await supabase
        .from('web_push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

    const fb = await getFirebaseAdmin();
    let sentCount = 0;
    
    // 2. Deliver Native Firebase (FCM / APNs)
    if (fb && fcmTokens && fcmTokens.length > 0) {
        for (const fcm of fcmTokens) {
            try {
                // Construct platform-specific payload payload shaping
                const message = {
                    token: fcm.token,
                    notification: { title: payload.title, body: payload.body },
                    data: { url: payload.url || '', ...payload.meta },
                    android: {
                        priority: priority === 'urgent' ? 'high' : 'normal',
                        notification: { channelId: priority === 'urgent' ? 'critical_alerts' : 'default' }
                    },
                    apns: {
                        headers: priority === 'urgent' ? { 'apns-priority': '10', 'apns-push-type': 'alert' } : { 'apns-priority': '5' },
                        payload: {
                            aps: {
                                sound: priority === 'urgent' ? 'critical_sound.wav' : 'default',
                                badge: 1,
                                'interruption-level': priority === 'urgent' ? 'critical' : 'active'
                            }
                        }
                    }
                };

                await fb.messaging().send(message);
                
                // Track success delivery log
                await supabase.from('push_delivery_log').insert({
                    profile_id: userId,
                    load_id: payload.loadId || null,
                    token_id: fcm.token.substring(0, 32),
                    platform: fcm.platform || 'mobile',
                    delivery_status: 'sent',
                    priority: priority
                }).catch(()=>null);
                
                sentCount++;

            } catch (err: any) {
                const errorCode = err.errorInfo?.code;
                
                // Token Invalidation logic
                if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                    await supabase.from('push_tokens').update({
                        enabled: false, last_failed_at: new Date().toISOString(), invalid_reason: errorCode
                    }).eq('token', fcm.token);
                    
                    await supabase.from('push_delivery_log').insert({
                        profile_id: userId, delivery_status: 'invalid_token', prioriy: priority, error_message: errorCode
                    }).catch(()=>null);
                } else {
                    await supabase.from('push_delivery_log').insert({
                        profile_id: userId, delivery_status: 'failed', priority: priority, error_message: err.message
                    }).catch(()=>null);
                }
            }
        }
    }

    // 3. Fallback Web Push
    if (ensureVapid() && webSubs && webSubs.length > 0) {
        for (const sub of webSubs) {
            try {
                await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload));
                sentCount++;
            } catch (err) {
                // handle expiration if needed
            }
        }
    }

    return { sent: sentCount, fcmChecked: fcmTokens?.length || 0, webChecked: webSubs?.length || 0 };
}
