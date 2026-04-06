/**
 * Firebase Admin SDK — Haul Command
 *
 * REVIVED: Firebase is required infrastructure per master prompt.
 * Firebase Cloud Messaging (FCM) is the PRIMARY push delivery channel.
 * SMS is surgical / fallback only.
 *
 * This module provides the canonical Firebase Admin singleton.
 * Used by: lib/notifications/fcm.ts, dispatch engine, corridor alerts, load matches
 *
 * Required env vars (set in Vercel + .env.local):
 *   FIREBASE_SERVICE_ACCOUNT      — JSON string of service account credentials
 *   OR individually:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

let _admin: any = null;
let _initAttempted = false;

async function initAdmin() {
  if (_initAttempted) return _admin;
  _initAttempted = true;

  try {
    const firebaseAdmin = await import('firebase-admin');

    if (firebaseAdmin.default.apps.length > 0) {
      _admin = firebaseAdmin.default;
      return _admin;
    }

    // Try FIREBASE_SERVICE_ACCOUNT (full JSON) first
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      firebaseAdmin.default.initializeApp({
        credential: firebaseAdmin.default.credential.cert(JSON.parse(serviceAccount)),
      });
      _admin = firebaseAdmin.default;
      console.log('[Firebase] Admin SDK initialized via FIREBASE_SERVICE_ACCOUNT');
      return _admin;
    }

    // Try individual env vars
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      firebaseAdmin.default.initializeApp({
        credential: firebaseAdmin.default.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      _admin = firebaseAdmin.default;
      console.log('[Firebase] Admin SDK initialized via individual env vars');
      return _admin;
    }

    // Try application default credentials (works in GCP environments)
    try {
      firebaseAdmin.default.initializeApp();
      _admin = firebaseAdmin.default;
      console.log('[Firebase] Admin SDK initialized via application default credentials');
      return _admin;
    } catch {
      console.warn(
        '[Firebase] No credentials found. Set FIREBASE_SERVICE_ACCOUNT or ' +
        'FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
      );
      return null;
    }
  } catch (err) {
    console.warn('[Firebase] Admin SDK failed to load:', err);
    return null;
  }
}

/**
 * Get the Firebase Admin Messaging instance.
 * Returns a real Messaging instance if Firebase is configured,
 * or a safe no-op stub if credentials are missing (dev environments).
 */
export function getAdminMessaging(): any {
  // Lazy init — returns the promise-resolved admin on subsequent calls
  if (_admin) {
    return _admin.messaging();
  }

  // Return a proxy that initializes on first call
  return new Proxy({}, {
    get(_, method) {
      return async (...args: any[]) => {
        const admin = await initAdmin();
        if (!admin) {
          console.warn(`[Firebase:noop] ${String(method)} called but Firebase not configured`);
          // Return safe defaults
          if (method === 'sendEachForMulticast') {
            const msg = args[0];
            return {
              responses: (msg?.tokens ?? []).map(() => ({
                success: false,
                error: { code: 'firebase/not-configured', message: 'Firebase credentials not set' },
              })),
            };
          }
          if (method === 'send') return 'noop';
          return null;
        }
        return admin.messaging()[method](...args);
      };
    },
  });
}

/**
 * Direct Firebase Admin access for advanced use cases.
 * Returns null if Firebase is not configured.
 */
export async function getFirebaseAdmin() {
  return initAdmin();
}

// Named exports for backward compatibility
export async function sendPushToToken(token: string, payload: any) {
  const admin = await initAdmin();
  if (!admin) return null;
  return admin.messaging().send({ token, ...payload });
}

export async function sendPushToTopic(topic: string, payload: any) {
  const admin = await initAdmin();
  if (!admin) return null;
  return admin.messaging().send({ topic, ...payload });
}

export async function sendPushMulticast(tokens: string[], payload: any) {
  const admin = await initAdmin();
  if (!admin) return null;
  return admin.messaging().sendEachForMulticast({ tokens, ...payload });
}

export const messaging = getAdminMessaging();
