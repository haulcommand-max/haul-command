import { NextRequest, NextResponse } from 'next/server';
import { sendPushToUser, broadcastPush, buildPushPayload } from '@/lib/notifications/push-service';
import type { NotifEventType } from '@/lib/notifications/push-service';

/**
 * POST /api/notifications/send
 * Sends a push notification to a single user or broadcasts to a role/geo segment.
 * Auth: service-role via x-admin-key header OR internal server-side call.
 */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mode = 'single', userId, roleKey, countryCode, corridorSlug,
            eventType, title, body: notifBody, deepLink, dataPayload, dedupKey } = body;

    if (!eventType) return NextResponse.json({ error: 'eventType required' }, { status: 400 });

    if (mode === 'broadcast') {
      const result = await broadcastPush({
        roleKey, countryCode, corridorSlug,
        eventType: eventType as NotifEventType,
        title, body: notifBody, deepLink, dataPayload, dedupKey,
      });
      return NextResponse.json({ ok: true, mode: 'broadcast', result });
    }

    // Single user
    if (!userId) return NextResponse.json({ error: 'userId required for single mode' }, { status: 400 });
    const payload = buildPushPayload(userId, eventType as NotifEventType, {
      title, body: notifBody, deepLink, dataPayload, dedupKey, roleKey, countryCode, corridorSlug,
    });
    const result = await sendPushToUser(payload);
    return NextResponse.json({ ok: true, mode: 'single', result });
  } catch (err: any) {
    console.error('[notifications/send]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
