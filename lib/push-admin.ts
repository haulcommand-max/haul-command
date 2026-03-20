/**
 * Firebase Admin Push Notification Service
 * 
 * Used by: ranking worker, corridor alerts, load match notifications
 * Replaces SMS for real-time engagement at zero per-message cost
 */

let admin: any = null;

async function getAdmin() {
  if (admin) return admin;

  try {
    const firebaseAdmin = await import('firebase-admin');

    if (!firebaseAdmin.default.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        firebaseAdmin.default.initializeApp({
          credential: firebaseAdmin.default.credential.cert(JSON.parse(serviceAccount)),
        });
      } else {
        // Use application default credentials
        firebaseAdmin.default.initializeApp();
      }
    }

    admin = firebaseAdmin.default;
    return admin;
  } catch {
    console.warn('[push] Firebase Admin not available');
    return null;
  }
}

interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export async function sendPush({ token, title, body, data = {}, imageUrl }: PushPayload): Promise<boolean> {
  const fb = await getAdmin();
  if (!fb) {
    console.warn('[push] Firebase Admin not initialized — skipping push');
    return false;
  }

  try {
    await fb.messaging().send({
      token,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data,
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'haul_command_alerts',
          priority: 'high' as const,
        },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          requireInteraction: true,
        },
      },
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown push error';
    console.error('[push] Failed:', msg);
    return false;
  }
}

// Rank notification helpers
export async function notifyRankDrop(token: string, newRank: number, oldRank: number): Promise<boolean> {
  return sendPush({
    token,
    title: '🚨 You Lost Your Spot',
    body: `Dropped from #${oldRank} to #${newRank}. Take it back before someone locks it in.`,
    data: { type: 'rank_drop', rank: String(newRank) },
  });
}

export async function notifyAlmostTop10(token: string, rank: number): Promise<boolean> {
  return sendPush({
    token,
    title: '⚠️ Almost Top 10',
    body: `You're #${rank} — one spot away from Top 10. Push now.`,
    data: { type: 'rank_opportunity', rank: String(rank) },
  });
}

export async function notifyWeeklyWin(token: string, rank: number, region: string): Promise<boolean> {
  return sendPush({
    token,
    title: '🏆 Weekly Winner!',
    body: `You finished #${rank} in ${region} this week. Badge earned.`,
    data: { type: 'weekly_win', rank: String(rank), region },
  });
}

export async function notifyCorridorAlert(token: string, corridor: string, alertType: string, message: string): Promise<boolean> {
  return sendPush({
    token,
    title: `⚠️ ${corridor} Alert`,
    body: message,
    data: { type: 'corridor_alert', corridor, alertType },
  });
}
