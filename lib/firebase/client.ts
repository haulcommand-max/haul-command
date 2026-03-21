/**
 * Firebase Client SDK — Browser-side initialization
 *
 * Used for FCM token registration on web.
 * All config values are public (NEXT_PUBLIC_*) — not secrets.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _messaging: Messaging | null = null;

function getClientApp(): FirebaseApp {
    if (_app) return _app;
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    return _app;
}

function getClientMessaging(): Messaging | null {
    if (typeof window === 'undefined') return null;
    if (_messaging) return _messaging;
    try {
        _messaging = getMessaging(getClientApp());
        return _messaging;
    } catch {
        console.warn('[firebase/client] Messaging not available in this environment');
        return null;
    }
}

/**
 * Request notification permission and retrieve the FCM token.
 * Returns null if the user denies permission or messaging is unavailable.
 */
export async function registerToken(): Promise<string | null> {
    const messaging = getClientMessaging();
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const swRegistration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
        );

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swRegistration,
        });

        return token;
    } catch (err) {
        console.error('[firebase/client] Token registration failed:', err);
        return null;
    }
}

/**
 * Listen for foreground messages. Call this in your layout/provider.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
    const messaging = getClientMessaging();
    if (!messaging) return null;
    return onMessage(messaging, callback);
}

export { getClientApp, getClientMessaging };
