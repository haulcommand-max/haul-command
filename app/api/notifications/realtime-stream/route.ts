import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendPushToTopic } from '@/lib/firebase/admin';

/**
 * GET /api/notifications/realtime-stream
 * Server-Sent Events (SSE) endpoint for in-app realtime notifications.
 * Subscribes to Supabase Realtime on hc_notifications for the current user.
 *
 * POST /api/notifications/realtime-stream
 * Internal: Triggers a system-wide broadcast (admin/cron only).
 *
 * Usage in NativeBootstrap.tsx:
 *   const es = new EventSource('/api/notifications/realtime-stream');
 *   es.onmessage = (e) => showToast(JSON.parse(e.data));
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── Server-Sent Events stream ─────────────────────────
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected or stream already closed.
        }
      };

      // Send heartbeat every 25s to prevent connection drop
      const heartbeat = setInterval(() => {
        send({ type: 'heartbeat', ts: Date.now() });
      }, 25_000);

      // Subscribe to Supabase Realtime on hc_notifications
      const channel = serviceClient
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'hc_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notif = payload.new as any;
            send({
              type: 'notification',
              id: notif.id,
              title: notif.title,
              body: notif.body,
              data: notif.data_json,
              channel: notif.channel,
              created_at: notif.created_at,
            });
          }
        )
        .subscribe();

      // Also subscribe to hc_events for system broadcasts
      const systemChannel = serviceClient
        .channel(`system-events:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'hc_events',
            filter: `actor_id=eq.${user.id}`,
          },
          (payload) => {
            const evt = payload.new as any;
            send({ type: 'event', event_type: evt.event_type, payload: evt.payload_json });
          }
        )
        .subscribe();

      // Cleanup on disconnect. Every controller/channel action is guarded because
      // Vercel/Next can fire abort after the stream has already closed.
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        try { serviceClient.removeChannel(channel); } catch {}
        try { serviceClient.removeChannel(systemChannel); } catch {}
        try { controller.close(); } catch {}
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * POST /api/notifications/realtime-stream
 * Admin broadcast — push to Firebase topic + insert to hc_notifications
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, title, body, data } = await req.json();
  if (!topic || !title) {
    return NextResponse.json({ error: 'topic and title required' }, { status: 400 });
  }

  // Firebase push to topic subscribers
  try {
    await sendPushToTopic(topic, {
      notification: { title, body },
      data: { ...(data ?? {}), url: data?.url ?? '/' },
    });
  } catch (err) {
    console.error('[realtime-stream] Firebase topic push failed', err);
  }

  return NextResponse.json({ ok: true });
}
