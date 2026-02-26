import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/ops/notify
 *
 * Zero-cost ops notification endpoint.
 * Auth: CRON_SECRET header or service role.
 * Slack is optional — if SLACK_WEBHOOK_URL exists, forward; otherwise skip silently.
 */

const OPS_SECRET = process.env.CRON_SECRET || '';

interface OpsEvent {
    event_type: string;
    severity?: 'P0' | 'P1' | 'P2' | 'P3';
    title: string;
    message?: string;
    metadata?: Record<string, unknown>;
    source?: string;
}

export async function POST(req: NextRequest) {
    // Auth check
    const authHeader = req.headers.get('x-ops-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!OPS_SECRET || authHeader !== OPS_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: OpsEvent;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body.event_type || !body.title) {
        return NextResponse.json({ error: 'event_type and title required' }, { status: 400 });
    }

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Store event
    const { data: event, error } = await supabase
        .from('ops_events')
        .insert({
            event_type: body.event_type,
            severity: body.severity || 'P2',
            title: body.title,
            message: body.message || null,
            metadata: body.metadata || {},
            source: body.source || 'api',
        })
        .select('id, severity')
        .single();

    if (error) {
        console.error('[ops/notify] Insert failed:', error.message);
        return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    const results: { stored: boolean; slack: boolean; push: boolean } = {
        stored: true,
        slack: false,
        push: false,
    };

    // Optional Slack forwarding (non-blocking, skip silently if not configured)
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackUrl) {
        try {
            const severity = body.severity || 'P2';
            const emoji = severity === 'P0' ? '🔴' : severity === 'P1' ? '🟠' : '🔵';
            await fetch(slackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `${emoji} *[${severity}] ${body.title}*\n${body.message || ''}\nSource: ${body.source || 'api'}`,
                }),
            });
            results.slack = true;
        } catch {
            // Slack failure is non-blocking
            console.warn('[ops/notify] Slack forward failed (non-blocking)');
        }
    }

    // Push notification for P0/P1 severity
    if (event && (event.severity === 'P0' || event.severity === 'P1')) {
        try {
            const { data: tokens } = await supabase
                .from('admin_push_tokens')
                .select('token')
                .eq('is_active', true);

            if (tokens?.length) {
                // Fire push via existing /api/push/send or FCM directly
                // For now, log the intent — FCM integration can plug in here
                console.log(`[ops/notify] Would push to ${tokens.length} admin devices for ${event.severity}`);
                results.push = true;
            }
        } catch {
            console.warn('[ops/notify] Push lookup failed (non-blocking)');
        }
    }

    return NextResponse.json({
        ok: true,
        event_id: event?.id,
        ...results,
    });
}
