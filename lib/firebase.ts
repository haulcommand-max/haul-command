// =====================================================================
// Haul Command — Firebase Client SDK Initialization
// lib/firebase.ts
//
// Provides Firebase App + Messaging for web push notifications.
// Used by the push registration route and client-side token capture.
// =====================================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase config — sourced from environment variables
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton Firebase app
let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  if (getApps().length > 0) {
    firebaseApp = getApp();
    return firebaseApp;
  }
  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
}

// Messaging instance (browser-only)
let messagingInstance: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null; // SSR guard
  if (messagingInstance) return messagingInstance;

  try {
    const app = getFirebaseApp();
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.error('[Firebase] Messaging init failed:', err);
    return null;
  }
}

// ─── Token Registration ─────────────────────────────────────────────
// Requests push permission and registers the FCM token with our backend
export async function registerPushToken(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Firebase] Push permission denied');
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey });

    if (token) {
      // Register token with our backend
      await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: detectPlatform(),
          device_label: navigator.userAgent.substring(0, 80),
        }),
      });
      console.log('[Firebase] Push token registered');
    }

    return token;
  } catch (err) {
    console.error('[Firebase] Token registration failed:', err);
    return null;
  }
}

// ─── Message Listener ────────────────────────────────────────────────
// Sets up foreground message handler (background handled by service worker)
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[Firebase] Foreground message:', payload);
    callback(payload);
  });

  return unsubscribe;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function detectPlatform(): 'ios' | 'android' | 'web' {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
}
