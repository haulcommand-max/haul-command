/**
 * Firebase Client Configuration — HAUL COMMAND
 * 
 * Architecture role:
 * - FCM Push (topic subscriptions + digest delivery)
 * - Remote Config (feature flags, throttles, A/B tests)
 * - App Check (anti-abuse on token registration)
 * - Analytics (money events only — 9 approved events)
 * - Crashlytics (future PWA/native builds)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics, logEvent as fbLogEvent } from 'firebase/analytics';

const rawAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
if (typeof window !== 'undefined' && rawAppId.includes(':android:')) {
    console.warn('[Firebase] ⚠️ FIREBASE_APP_ID looks like an Android ID. Get a Web app ID from Firebase Console → Project Settings → Add App → Web');
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: rawAppId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ═══ App Check ═══
let appCheck = null;
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
    });
}

// ═══ Analytics — MONEY EVENTS ONLY ═══
const APPROVED_EVENTS = new Set([
    'view_city_service_page',
    'signup_started',
    'signup_completed',
    'claim_started',
    'claim_completed',
    'lead_sent',
    'lead_accepted',
    'watch_replay_started',
    'watch_replay_completed',
]);

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
    if (!APPROVED_EVENTS.has(eventName)) {
        console.warn(`[Analytics] Blocked non-money event: ${eventName}`);
        return;
    }
    if (typeof window !== 'undefined') {
        try {
            const analytics = getAnalytics(app);
            fbLogEvent(analytics, eventName, params);
        } catch (e) {
            // Analytics not loaded yet
        }
    }
}

// ═══ FCM Push ═══
export async function requestPushPermission() {
    if (typeof window === 'undefined') return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
        });
        return token;
    } catch (err) {
        console.error('[FCM] Token error:', err);
        return null;
    }
}

export function onPushMessage(callback: any) {
    if (typeof window === 'undefined') return () => { };
    try {
        const messaging = getMessaging(app);
        return onMessage(messaging, callback);
    } catch {
        return () => { };
    }
}

// ═══ Register device token with Supabase ═══
export async function registerPushToken(supabase: any, token: string, profileId: string, countryCode?: string, role?: string, state?: string) {
    if (!token || !profileId) return;

    // Register token
    await supabase.rpc('hc_push_register', {
        p_profile_id: profileId,
        p_token: token,
        p_platform: 'web',
        p_country_code: countryCode || 'US',
    });

    // Auto-subscribe to topics
    await supabase.rpc('hc_fcm_auto_subscribe', {
        p_profile_id: profileId,
        p_role: role || 'operator',
        p_country_code: countryCode || 'US',
        p_state: state || null,
    });
}

export { app, appCheck };
