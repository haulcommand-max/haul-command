// POST /api/push/send — Send targeted web push notifications
// Supports: user_id, role, and geo targeting — no external service needed.
//
// VAPID setup (run ONCE, then add to .env.local):
//   npx web-push generate-vapid-keys
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
//   VAPID_PRIVATE_KEY=<privateKey>
//   VAPID_EMAIL=mailto:ops@haulcommand.com
//   npm install web-push

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
    data?: Record<string, unknown>;
}

interface SendRequest {
    payload: PushPayload;
    user_id?: string;
    role?: string;
    geo?: string;
    limit?: number;
    agent?: string;
}

export async function POST(req: NextRequest) {
    const isInternal = req.headers.get('x-internal-agent') === 'haul-command-swarm'
        || req.headers.get('authorization') === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

    if (!isInternal) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendRequest = await req.json();
    const { payload, user_id, role, geo, limit = 100, agent = 'manual' } = body;

    if (!payload?.title || !payload?.body) {
        return NextResponse.json({ error: 'payload.title and payload.body required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let query = admin
        .from('web_push_subscriptions')
        .select('endpoint, p256dh, auth, user_id, role, geo')
        .eq('active', true)
        .limit(limit);

    if (user_id) query = query.eq('user_id', user_id);
    else if (role) query = query.eq('role', role);
    else if (geo) query = query.eq('geo', geo);

    const { data: subscribers } = await query;
    if (!subscribers?.length) {
        return NextResponse.json({ ok: true, sent: 0, message: 'No active subscribers for target' });
    }

    let sent = 0;
    try {
        const webpush = await import('web-push').catch(() => null);
        if (webpush && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            webpush.setVapidDetails(
                process.env.VAPID_EMAIL ?? 'mailto:ops@haulcommand.com',
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY,
            );
            const results = await Promise.allSettled(
                subscribers.map(sub =>
                    webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        JSON.stringify({ title: payload.title, body: payload.body, icon: payload.icon ?? '/icons/icon-192.png', url: payload.url ?? '/', tag: payload.tag ?? `hc-${Date.now()}` }),
                    ).catch((err: { statusCode?: number }) => {
                        if (err?.statusCode === 410) {
                        (async () => { try { await admin.from('web_push_subscriptions').update({ active: false }).eq('endpoint', sub.endpoint); } catch {} })()
                        }
                        throw err;
                    }),
                ),
            );
            sent = results.filter(r => r.status === 'fulfilled').length;
        } else {
            console.warn('[push/send] VAPID keys not configured — run: npx web-push generate-vapid-keys');
        }
    } catch (err) {
        console.error('[push/send]', err);
    }

    ;(async () => { try { await admin.from('swarm_activity_log').insert({
        agent_name: agent,
        trigger_reason: 'push_send',
        action_taken: `Push: "${payload.title}" → ${sent}/${subscribers.length} delivered`,
        surfaces_touched: ['web_push'],
        revenue_impact: sent * 2,
        country: geo ?? 'US',
        status: 'completed',
    }); } catch {} })()

    return NextResponse.json({ ok: true, sent, attempted: subscribers.length });
}

// GET ?vapid=1 — returns public VAPID key for browser subscription
export async function GET(req: NextRequest) {
    if (req.nextUrl.searchParams.get('vapid')) {
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) return NextResponse.json({
            error: 'VAPID not configured',
            setup: ['npx web-push generate-vapid-keys', 'Add keys to .env.local', 'npm install web-push'],
        }, { status: 503 });
        return NextResponse.json({ publicKey: key });
    }
    return NextResponse.json({ error: 'Use ?vapid=1' }, { status: 405 });
}


