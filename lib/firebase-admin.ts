// =====================================================================
// Haul Command — Firebase Admin SDK (Server-Side)
// lib/firebase-admin.ts
//
// Used by edge functions and API routes to SEND push notifications
// via Firebase Cloud Messaging (FCM). This is the server-side counterpart
// to lib/firebase.ts (client-side).
// =====================================================================

import * as admin from 'firebase-admin';

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    } catch (err) {
      console.error('[Firebase Admin] Init failed:', err);
      // Fallback: try default credentials (for Cloud Run / GCE environments)
      admin.initializeApp();
    }
  } else {
    // No service account key — init with default credentials
    console.warn('[Firebase Admin] No FIREBASE_SERVICE_ACCOUNT_KEY found, using default credentials');
    admin.initializeApp();
  }
}

const messaging = admin.messaging();

// ─── Send Push Notification ──────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

export async function sendPush(
  token: string,
  payload: PushPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data ?? {},
      webpush: {
        fcmOptions: {
          link: payload.clickAction ?? 'https://haulcommand.com',
        },
        notification: {
          icon: '/icons/hc-icon-192.png',
          badge: '/icons/hc-badge-72.png',
          requireInteraction: true,
        },
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'hc_operations',
          priority: 'high' as const,
          defaultSound: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messageId = await messaging.send(message);
    return { success: true, messageId };
  } catch (err: any) {
    // Handle invalid token
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      return { success: false, error: 'invalid_token' };
    }
    return { success: false, error: err.message };
  }
}

// ─── Send to Multiple Tokens ──────────────────────────────────────────

export async function sendPushBatch(
  tokens: string[],
  payload: PushPayload
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
    },
    data: payload.data ?? {},
    webpush: {
      fcmOptions: {
        link: payload.clickAction ?? 'https://haulcommand.com',
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  const invalidTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      if (
        resp.error.code === 'messaging/registration-token-not-registered' ||
        resp.error.code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };
}

// ─── Topic Messaging ──────────────────────────────────────────────────

export async function sendToTopic(
  topic: string,
  payload: PushPayload
): Promise<string> {
  const message: admin.messaging.Message = {
    topic,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data ?? {},
  };

  return messaging.send(message);
}

export { admin };
