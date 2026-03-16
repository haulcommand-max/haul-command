import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { emitNotification, NOVU_EVENT_NAMES, type NovuEventName } from '@/lib/novu';

/**
 * POST /api/novu/trigger
 * 
 * Backend-only notification trigger endpoint.
 * Accepts an event name + payload + recipient, emits to Novu.
 * 
 * Security: Requires service-role auth header (X-Service-Key)
 * or internal cron auth.
 * 
 * @status wired_not_live — endpoint ready, Novu API key pending
 */
export async function POST(req: NextRequest) {
    try {
        // ── Auth Check ────────────────────────────────────────────────────
        const serviceKey = req.headers.get('x-service-key');
        const cronAuth = req.headers.get('authorization');
        const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (serviceKey !== expectedKey && cronAuth !== `Bearer ${expectedKey}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Parse Body ────────────────────────────────────────────────────
        const body = await req.json();
        const {
            event_name,
            subscriber_id,
            payload = {},
            email,
            phone,
            actor_id,
            tenant,
        } = body;

        if (!event_name || !subscriber_id) {
            return NextResponse.json(
                { error: 'event_name and subscriber_id are required' },
                { status: 400 },
            );
        }

        // Validate event name exists in registry
        const validEvents = Object.values(NOVU_EVENT_NAMES) as string[];
        if (!validEvents.includes(event_name)) {
            return NextResponse.json(
                { error: `Unknown event: ${event_name}. Valid events: ${validEvents.join(', ')}` },
                { status: 400 },
            );
        }

        // ── Emit ──────────────────────────────────────────────────────────
        const result = await emitNotification(
            event_name as NovuEventName,
            payload,
            {
                subscriberId: subscriber_id,
                email,
                phone,
                actorId: actor_id,
                tenant,
            },
        );

        return NextResponse.json({
            ...result,
        }, { status: result.ok ? 200 : 500 });
    } catch (err) {
        console.error('[API:NOVU:TRIGGER] Error:', err);
        return NextResponse.json(
            { error: 'Internal error', details: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}

/**
 * GET /api/novu/trigger
 * 
 * Returns the event registry for debugging/discovery.
 */
export async function GET() {
    return NextResponse.json({
        ok: true,
        event_count: Object.keys(NOVU_EVENT_NAMES).length,
        events: NOVU_EVENT_NAMES,
        dry_run: !process.env.NOVU_API_KEY,
    });
}
