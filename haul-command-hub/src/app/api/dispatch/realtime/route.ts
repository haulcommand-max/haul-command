import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * WebSocket Dispatch — Real-Time Event Stream
 * 
 * GET  /api/dispatch/realtime — SSE event stream for live dispatch updates
 * POST /api/dispatch/realtime — Broadcast dispatch events to all listeners
 * 
 * Architecture:
 *   Next.js on Vercel doesn't support raw WebSockets, so we use two patterns:
 * 
 *   1. SSE (Server-Sent Events) — lightweight, unidirectional server→client push
 *      Used for: load updates, match notifications, surge alerts, status changes
 *      Compatible with ALL deployment targets (Vercel, Node, Docker)
 * 
 *   2. Supabase Realtime — bidirectional, presence-aware channels
 *      Used by the client directly (dispatch/page.tsx already subscribes to
 *      postgres_changes on hc_loads). This API layer complements it for:
 *      - Push notifications to mobile (via SSE → app)
 *      - Cross-channel event aggregation
 *      - Event logging / audit trail
 * 
 * Event Types:
 *   load:new        — New load posted
 *   load:matched    — Load matched to operator(s)
 *   load:accepted   — Operator accepted a load
 *   load:completed  — Load marked complete
 *   load:cancelled  — Load cancelled
 *   surge:updated   — Surge multiplier changed
 *   dispatch:alert  — System alert (capacity, deadline, etc.)
 *   operator:online — Operator came online / GPS ping
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Types ───────────────────────────────────────────────────

interface DispatchEvent {
  type: string;
  payload: Record<string, any>;
  region?: string;
  timestamp: string;
  eventId: string;
}

// ─── In-memory subscriber store (per instance) ───────────────
// Production: replace with Redis pub/sub or Supabase broadcast

interface Subscriber {
  id: string;
  controller: ReadableStreamDefaultController;
  regions: string[];  // Filter: only receive events for these regions
  createdAt: number;
}

const subscribers = new Map<string, Subscriber>();

function broadcastEvent(event: DispatchEvent) {
  const eventString = `event: ${event.type}\ndata: ${JSON.stringify(event)}\nid: ${event.eventId}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(eventString);

  for (const [id, sub] of subscribers) {
    try {
      // Region filter: send to all if no filter, or match region
      if (sub.regions.length === 0 || !event.region || sub.regions.includes(event.region)) {
        sub.controller.enqueue(bytes);
      }
    } catch {
      // Dead subscriber — remove
      subscribers.delete(id);
    }
  }
}

// ─── Heartbeat to keep connections alive ─────────────────────
setInterval(() => {
  const encoder = new TextEncoder();
  const heartbeat = encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`);
  for (const [id, sub] of subscribers) {
    try {
      sub.controller.enqueue(heartbeat);
    } catch {
      subscribers.delete(id);
    }
  }
  
  // Cleanup stale connections (>30 min)
  const now = Date.now();
  for (const [id, sub] of subscribers) {
    if (now - sub.createdAt > 30 * 60 * 1000) {
      try { sub.controller.close(); } catch {}
      subscribers.delete(id);
    }
  }
}, 15_000);

// ─── GET: SSE Event Stream ───────────────────────────────────

export async function GET(req: Request) {
  const url = new URL(req.url);
  const regions = url.searchParams.get('regions')?.split(',').filter(Boolean) || [];
  const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const stream = new ReadableStream({
    start(controller) {
      // Register subscriber
      subscribers.set(subId, {
        id: subId,
        controller,
        regions,
        createdAt: Date.now(),
      });

      // Send initial connection event
      const encoder = new TextEncoder();
      const welcome: DispatchEvent = {
        type: 'connection:established',
        payload: {
          subscriberId: subId,
          regions: regions.length > 0 ? regions : 'all',
          activeSubscribers: subscribers.size,
        },
        timestamp: new Date().toISOString(),
        eventId: `evt_${Date.now()}`,
      };
      controller.enqueue(
        encoder.encode(`event: connection:established\ndata: ${JSON.stringify(welcome)}\nid: ${welcome.eventId}\n\n`)
      );
    },
    cancel() {
      subscribers.delete(subId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── POST: Broadcast Dispatch Event ──────────────────────────

export async function POST(req: Request) {
  try {
    // Auth check — only backend/cron/admin can push events
    const authHeader = req.headers.get('authorization');
    const cronKey = process.env.CRON_SECRET;
    if (cronKey && authHeader !== `Bearer ${cronKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, payload, region } = body;

    if (!type || !payload) {
      return NextResponse.json({ error: 'type and payload required' }, { status: 400 });
    }

    const validTypes = [
      'load:new', 'load:matched', 'load:accepted', 'load:completed', 'load:cancelled',
      'surge:updated', 'dispatch:alert', 'operator:online', 'system:maintenance',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const event: DispatchEvent = {
      type,
      payload,
      region,
      timestamp: new Date().toISOString(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    // Broadcast to all connected SSE clients
    broadcastEvent(event);

    // Also store in Supabase for audit trail
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('hc_dispatch_events').insert({
        event_type: type,
        payload,
        region_code: region || null,
        event_id: event.eventId,
        created_at: event.timestamp,
      }).catch(() => {}); // Non-blocking
    }

    return NextResponse.json({
      success: true,
      eventId: event.eventId,
      broadcastTo: subscribers.size,
      type,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
