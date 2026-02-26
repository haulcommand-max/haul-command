'use client';
// Firebase FCM Push Service (Section 6 — No SMS)
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
let fbApp: any = null;

async function initFB() {
    if (fbApp) return fbApp;
    const { initializeApp } = await import('firebase/app');
    fbApp = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    return fbApp;
}

export async function registerForPush() {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
    const app = await initFB();
    const { getMessaging, getToken } = await import('firebase/messaging');
    const msg = getMessaging(app);
    const token = await getToken(msg, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    if (!token) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await supabase.from('hc_push_tokens').upsert(
            { profile_id: session.user.id, fcm_token: token, device_type: 'web', is_active: true, last_used_at: new Date().toISOString() },
            { onConflict: 'profile_id,fcm_token' }
        );
    }
    return token;
}

export function onForegroundMessage(cb: (p: { title: string; body: string; type: string }) => void) {
    initFB().then(app => {
        import('firebase/messaging').then(({ getMessaging, onMessage }) => {
            onMessage(getMessaging(app), (p) => cb({ title: p.notification?.title || '', body: p.notification?.body || '', type: (p.data?.type as string) || 'system' }));
        });
    });
}

export const isPushSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const isQuietHours = () => { const h = new Date().getHours(); return h >= 22 || h < 7; };
