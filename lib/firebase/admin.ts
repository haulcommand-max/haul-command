/**
 * Firebase Admin SDK — Server-side FCM sender (ONLY)
 *
 * SCOPE: Send push notifications via FCM. That's it.
 * Auth, DB, Storage, Realtime → Supabase.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let _app: App;
let _messaging: Messaging;

function getOrInitApp(): App {
    if (_app) return _app;
    if (getApps().length > 0) {
        _app = getApps()[0];
        return _app;
    }

    const projectId   = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('[firebase/admin] Missing: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }

    _app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return _app;
}

export function getAdminMessaging(): Messaging {
    if (_messaging) return _messaging;
    _messaging = getMessaging(getOrInitApp());
    return _messaging;
}

/**
 * Send a push notification to a single FCM token.
 */
export async function sendPushToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string
) {
    const msg = getAdminMessaging();
    return msg.send({
        token,
        notification: { title, body, imageUrl },
        data: data ?? {},
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        android: { priority: 'high', notification: { sound: 'default' } },
        webpush: { notification: { icon: '/brand/generated/pwa-icon-192.png' } },
    });
}

/**
 * Send to a topic (e.g. 'us-tx-operator', 'av_partner').
 */
export async function sendPushToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
) {
    const msg = getAdminMessaging();
    return msg.send({ topic, notification: { title, body }, data: data ?? {} });
}

/**
 * Send to multiple tokens at once (max 500 per call).
 */
export async function sendPushMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
) {
    if (!tokens.length) return;
    const msg = getAdminMessaging();
    return msg.sendEachForMulticast({
        tokens: tokens.slice(0, 500),
        notification: { title, body },
        data: data ?? {},
        apns: { payload: { aps: { sound: 'default' } } },
        android: { priority: 'high' },
    });
}

export const messaging = new Proxy({} as Messaging, {
    get(_, prop) { return (getAdminMessaging() as any)[prop]; },
});
