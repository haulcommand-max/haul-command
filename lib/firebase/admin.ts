/**
 * Firebase Admin SDK — Server-side singleton
 *
 * Used by lib/notifications/fcm.ts to send push notifications via FCM.
 * All credentials come from environment variables set in Vercel.
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

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            '[firebase/admin] Missing env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
        );
    }

    _app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });

    return _app;
}

export function getAdminMessaging(): Messaging {
    if (_messaging) return _messaging;
    _messaging = getMessaging(getOrInitApp());
    return _messaging;
}

// Re-export for convenience — lazy-initialized
export const messaging = new Proxy({} as Messaging, {
    get(_, prop) {
        return (getAdminMessaging() as any)[prop];
    },
});
