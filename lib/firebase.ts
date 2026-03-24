/**
 * Firebase Client — HAUL COMMAND (FCM + AppCheck only)
 *
 * WHAT FIREBASE DOES HERE (and nothing else):
 *   ✔ FCM push notifications (web + iOS/Android via Capacitor)
 *   ✔ App Check (anti-abuse reCAPTCHA on token registration)
 *   ✔ Firebase Analytics (9 approved money events)
 *
 * WHAT SUPABASE OWNS (not Firebase):
 *   ✘ Auth → Supabase Auth
 *   ✘ Database → Supabase Postgres
 *   ✘ Storage → Supabase Storage
 *   ✘ Realtime → Supabase Realtime channels
 *   ✘ Presence / heartbeat → Supabase `presence` table
 *   ✘ Feature flags → lib/feature-flags.ts (Supabase-backed)
 *
 * Push token lifecycle:
 *   1. User grants permission → requestPushPermission() returns FCM token
 *   2. Token saved to Supabase: profiles.fcm_token (NOT Firestore)
 *   3. Server sends push via firebase-admin/messaging directly
 *   4. Token refresh handled by onTokenRefresh in SW
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics, logEvent as fbLogEvent } from 'firebase/analytics';

const firebaseConfig = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || '',
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || '',
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || '',
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || '', // kept for SDK compat, NOT used for storage
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '',
    measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     || '',
};

// Singleton (safe to call multiple times)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// App Check (anti-abuse)
let appCheck = null;
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
    });
}

// ── Analytics (9 money events only) ─────────────────────────────────
const APPROVED_EVENTS = new Set([
    'view_city_service_page',
    'signup_started',
    'signup_completed',
    'claim_started',
    'claim_completed',
    'lead_sent',
    'lead_accepted',
    'route_check_used',         // Route Check free tool
    'partner_inquiry_submitted', // Partner portal
]);

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;
    if (!APPROVED_EVENTS.has(eventName) && process.env.NODE_ENV === 'development') {
        console.warn(`[Firebase] Unapproved event: ${eventName} — add to APPROVED_EVENTS or use GA4 directly`);
    }
    try {
        const analytics = getAnalytics(app);
        fbLogEvent(analytics, eventName, params);
    } catch { /* analytics not ready yet */ }
}

// ── FCM Web Push ─────────────────────────────────────────────────────
export async function requestPushPermission(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
            serviceWorkerRegistration: swReg,
        });
        return token;
    } catch (err) {
        console.error('[FCM] Token error:', err);
        return null;
    }
}

export function onPushMessage(callback: (payload: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    try {
        const messaging = getMessaging(app);
        return onMessage(messaging, callback);
    } catch {
        return () => {};
    }
}

/**
 * Save FCM token to Supabase profiles table (NOT Firestore).
 * Called after requestPushPermission() succeeds.
 */
export async function registerPushToken(
    supabase: any,
    token: string,
    profileId: string,
    meta?: { countryCode?: string; role?: string; state?: string }
) {
    if (!token || !profileId) return;

    // 1. Save token to profiles.fcm_token (Supabase, not Firestore)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ fcm_token: token, fcm_token_updated_at: new Date().toISOString() })
        .eq('id', profileId);

    if (profileError) {
        console.error('[FCM] Failed to save token to profiles:', profileError);
    }

    // 2. Also upsert to push_tokens table for topic subscriptions
    await supabase.from('push_tokens').upsert({
        profile_id: profileId,
        token,
        platform: 'web',
        country_code: meta?.countryCode ?? 'US',
        updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    // 3. Auto-subscribe to role/region topics via RPC
    if (meta?.role) {
        await supabase.rpc('hc_fcm_auto_subscribe', {
            p_profile_id: profileId,
            p_role: meta.role,
            p_country_code: meta.countryCode ?? 'US',
            p_state: meta.state ?? null,
        }).catch(() => {}); // non-fatal if RPC doesn't exist yet
    }
}

export { app, appCheck };
