/**
 * Firebase Client SDK — Haul Command
 *
 * REVIVED: Firebase is required infrastructure per master prompt.
 * Client-side Firebase for:
 *   - FCM token registration (push notifications)
 *   - Analytics event tracking
 *   - Remote config
 *
 * Required env vars (NEXT_PUBLIC_ prefix for client-side):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp(): FirebaseApp | null {
  // Don't initialize if no config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

/**
 * Get Firebase Cloud Messaging instance for token registration.
 * Returns null if Firebase is not configured or if running on server.
 */
export async function getMessaging() {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const { getMessaging: getFCM } = await import('firebase/messaging');
    return getFCM(app);
  } catch {
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Returns the token string or null if unavailable.
 */
export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessaging();
  if (!messaging) return null;
  try {
    const { getToken } = await import('firebase/messaging');
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
    });
    return token;
  } catch (err) {
    console.warn('[Firebase:client] Failed to get FCM token:', err);
    return null;
  }
}

/**
 * Register for push notifications — requests permission, gets token,
 * and stores it in Supabase for the given user.
 */
export async function registerForPushNotifications(
  userId: string,
  supabaseClient: any
): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const token = await requestFcmToken();
  if (!token) return null;

  // Store token in Supabase
  await supabaseClient.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: 'web',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  );

  return token;
}

/**
 * Listen for foreground messages (when app is open).
 */
export function onMessageListener(): Promise<any> {
  return new Promise(async (resolve) => {
    const messaging = await getMessaging();
    if (!messaging) return resolve(null);
    try {
      const { onMessage } = await import('firebase/messaging');
      onMessage(messaging, (payload) => resolve(payload));
    } catch {
      resolve(null);
    }
  });
}

/**
 * Track analytics event via Firebase Analytics.
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const app = getFirebaseApp();
  if (!app) return;
  try {
    import('firebase/analytics').then(({ getAnalytics, logEvent }) => {
      const analytics = getAnalytics(app);
      logEvent(analytics, eventName, params);
    });
  } catch {
    // Analytics not available
  }
}
