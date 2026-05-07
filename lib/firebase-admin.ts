import * as admin from 'firebase-admin';
import { getFirebaseAdminStatus, isFirebaseAdminEnabled } from '@/lib/launch/production-guards';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

function initializeFirebaseAdmin(): boolean {
  if (!isFirebaseAdminEnabled()) return false;
  if (admin.apps.length) return true;

  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;

  if (rawServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(rawServiceAccount)),
    });
    return true;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return true;
  }

  return false;
}

function getMessaging() {
  if (!initializeFirebaseAdmin()) return null;
  return admin.messaging();
}

export async function sendPush(
  token: string,
  payload: PushPayload,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const messaging = getMessaging();
    if (!messaging) return { success: false, error: getFirebaseAdminStatus() };

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
          link: payload.clickAction ?? 'https://www.haulcommand.com',
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
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      return { success: false, error: 'invalid_token' };
    }
    return { success: false, error: err.message };
  }
}

export async function sendPushBatch(
  tokens: string[],
  payload: PushPayload,
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const messaging = getMessaging();
  if (!messaging) return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };

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
        link: payload.clickAction ?? 'https://www.haulcommand.com',
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

export async function sendToTopic(topic: string, payload: PushPayload): Promise<string> {
  const messaging = getMessaging();
  if (!messaging) return 'firebase_admin_disabled';

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
