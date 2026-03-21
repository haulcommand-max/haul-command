/**
 * POST /api/messaging/response-stats
 * Recomputes 30-day response stats for an operator.
 * Calculates avg response time, response rate, populates message_stats.
 * Called by cron or after message events.
 *
 * GET /api/messaging/response-stats?operator_id=xxx
 * Returns the operator's response stats for directory card display.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const opId = req.nextUrl.searchParams.get('operator_id');
    if (!opId) return NextResponse.json({ error: 'operator_id required' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data } = await admin.from('message_stats').select('*').eq('operator_id', opId).maybeSingle();

    if (!data) return NextResponse.json({ ok: true, stats: null, message: 'No message activity yet' });

    return NextResponse.json({
        ok: true,
        stats: {
            avg_response_time_minutes: data.avg_response_time_minutes,
            response_rate_pct: data.response_rate_pct,
            messages_received_30d: data.messages_received_30d,
            messages_responded_30d: data.messages_responded_30d,
            has_response_guarantee: data.has_response_guarantee,
            badge: data.avg_response_time_minutes && data.avg_response_time_minutes <= 30 ? 'gold_clock' : null,
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const secret = req.headers.get('x-ops-secret') || req.nextUrl.searchParams.get('secret');
        if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { operator_id } = body;
        if (!operator_id) return NextResponse.json({ error: 'operator_id required' }, { status: 400 });

        const admin = getSupabaseAdmin();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Count messages received in last 30 days
        const { count: received } = await admin.from('inbox_messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', operator_id)
            .gte('created_at', thirtyDaysAgo);

        // Count messages responded (operator sent reply)
        const { count: responded } = await admin.from('inbox_messages')
            .select('id', { count: 'exact', head: true })
            .eq('sender_id', operator_id)
            .gte('created_at', thirtyDaysAgo);

        const total = received || 0;
        const replies = responded || 0;
        const rate = total > 0 ? Math.round((replies / total) * 10000) / 100 : null;

        await admin.from('message_stats').upsert({
            operator_id,
            messages_received_30d: total,
            messages_responded_30d: replies,
            response_rate_pct: rate,
            last_computed_at: new Date().toISOString(),
        }, { onConflict: 'operator_id' });

        return NextResponse.json({ ok: true, operator_id, received: total, responded: replies, rate_pct: rate });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
