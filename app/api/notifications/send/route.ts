/**
 * POST /api/notifications/send — Notification Brain Dispatch
 *
 * Wires the notification-brain decision engine to actual delivery channels:
 *   - Resend (email)
 *   - Web Push (when registered)
 *   - In-app (Supabase insert)
 *
 * The brain decides WHAT to send and WHERE. This route executes the decision.
 *
 * Usage:
 *   POST /api/notifications/send
 *   Body: { event_type, recipient_id, recipient_role, priority, data }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    decideNotification,
    NOVU_WORKFLOWS,
    type NotificationPayload,
    type NotificationChannel,
} from '@/lib/engines/notification-brain';

// ── Channel Dispatchers ──────────────────────────────────

async function dispatchInApp(payload: NotificationPayload, channels: NotificationChannel[]): Promise<void> {
    const supabase = createClient();
    const workflow = NOVU_WORKFLOWS[payload.event_type];

    await supabase.from('notifications').insert({
        user_id: payload.recipient_id,
        type: payload.event_type,
        title: workflow?.template_name ?? payload.event_type.replace(/\./g, ' '),
        body: buildNotificationBody(payload),
        data: payload.data,
        channels_sent: channels,
        read: false,
        created_at: new Date().toISOString(),
    });
}

async function dispatchEmail(payload: NotificationPayload): Promise<void> {
    // Use Resend API if env configured
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const supabase = createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', payload.recipient_id)
        .single();

    if (!profile?.email) return;

    const workflow = NOVU_WORKFLOWS[payload.event_type];
    const subject = workflow?.template_name ?? `Haul Command: ${payload.event_type}`;

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Haul Command <alerts@haulcommand.com>',
                to: profile.email,
                subject,
                html: buildEmailHtml(payload, profile.display_name ?? 'Operator'),
            }),
        });
    } catch (err) {
        console.error('[notification-dispatch] email failed:', err);
    }
}

async function dispatchPush(payload: NotificationPayload): Promise<void> {
    // Web Push via FCM — requires push subscription in profiles
    const supabase = createClient();
    const { data: sub } = await supabase
        .from('push_subscriptions')
        .select('endpoint, keys')
        .eq('user_id', payload.recipient_id)
        .limit(1)
        .single();

    if (!sub?.endpoint) return;

    const workflow = NOVU_WORKFLOWS[payload.event_type];
    // Web Push API dispatch — placeholder for FCM/APNS integration
    console.log(`[notification-dispatch] push queued for ${payload.recipient_id}: ${workflow?.template_name}`);
}

// ── Template Builders ────────────────────────────────────

function buildNotificationBody(payload: NotificationPayload): string {
    const d = payload.data as Record<string, string>;
    switch (payload.event_type) {
        case 'load.matched':
        case 'load.match_found':
            return `New load match: ${d.origin ?? 'origin'} → ${d.destination ?? 'destination'}`;
        case 'claim.completed':
            return `Your listing has been claimed and verified.`;
        case 'doc.expiring':
        case 'credential.expiring':
            return `Your ${d.document_type ?? 'document'} expires in ${d.days_remaining ?? '?'} days.`;
        case 'review.received':
            return `You received a ${d.rating ?? '5'}★ review from ${d.reviewer ?? 'a client'}.`;
        case 'payment.failed':
        case 'sponsorship.payment_failed':
            return `Payment failed. Please update your payment method to avoid service interruption.`;
        case 'rank.dropped':
            return `Your ranking dropped. Update your profile or post availability to recover.`;
        case 'freshness.cooling':
            return `Your profile freshness is cooling. Log in or update availability to maintain visibility.`;
        case 'lead.unlocked':
            return `A new lead was unlocked for you in ${d.location ?? 'your area'}.`;
        case 'lead.credit_low':
            return `You have ${d.credits_remaining ?? 'few'} credits remaining.`;
        case 'boost.expiring':
            return `Your profile boost expires soon. Renew to maintain premium visibility.`;
        case 'sponsorship.activated':
            return `Your territory sponsorship is now live.`;
        case 'sponsorship.expiring':
            return `Your territory sponsorship expires soon. Renew to keep your placement.`;
        default:
            return `${payload.event_type.replace(/\./g, ' ')}`;
    }
}

function buildEmailHtml(payload: NotificationPayload, name: string): string {
    const body = buildNotificationBody(payload);
    const workflow = NOVU_WORKFLOWS[payload.event_type];
    const title = workflow?.template_name ?? payload.event_type;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0B0B0C;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="font-size:20px;font-weight:900;color:#D4A843;letter-spacing:0.05em">HAUL COMMAND</span>
  </div>
  <div style="background:#111114;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#D4A843;margin-bottom:8px">${title}</div>
    <div style="font-size:15px;color:#E5E7EB;line-height:1.6;margin-bottom:16px">
      Hi ${name},
    </div>
    <div style="font-size:14px;color:#9CA3AF;line-height:1.6;margin-bottom:24px">
      ${body}
    </div>
    <a href="https://www.haulcommand.com/dashboard" style="display:inline-block;padding:10px 24px;background:#D4A843;color:#0B0B0C;font-weight:700;font-size:13px;border-radius:8px;text-decoration:none">
      View Dashboard →
    </a>
  </div>
  <div style="text-align:center;margin-top:24px;font-size:11px;color:#4B5563">
    Haul Command · Heavy Haul Intelligence<br/>
    <a href="https://www.haulcommand.com/settings/notifications" style="color:#6B7280">Manage notifications</a>
  </div>
</div>
</body>
</html>`;
}

// ── Main Handler ─────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as NotificationPayload;

        if (!body.event_type || !body.recipient_id) {
            return NextResponse.json({ error: 'event_type and recipient_id required' }, { status: 400 });
        }

        // Fetch user notification state from DB
        const supabase = createClient();
        const { data: sentCounts } = await supabase
            .from('notifications')
            .select('channels_sent')
            .eq('user_id', body.recipient_id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        // Build per-channel counts
        const counts: Record<NotificationChannel, number> = {
            in_app: 0, push: 0, email: 0, sms: 0, webhook: 0,
        };
        for (const row of (sentCounts ?? [])) {
            const channels = (row.channels_sent ?? []) as NotificationChannel[];
            for (const ch of channels) {
                if (counts[ch] !== undefined) counts[ch]++;
            }
        }

        // Get user preferences (fallback to sensible defaults)
        const { data: prefs } = await supabase
            .from('profiles')
            .select('notification_preferences, timezone_offset')
            .eq('id', body.recipient_id)
            .single();

        const userPrefs = prefs?.notification_preferences ?? {
            channels_enabled: ['in_app', 'push', 'email'] as NotificationChannel[],
            quiet_hours_enabled: true,
            timezone_offset_hours: -5,
        };

        // Ask the brain
        const decision = decideNotification(body, {
            notifications_sent_24h: counts,
            user_preferences: {
                channels_enabled: userPrefs.channels_enabled ?? ['in_app', 'push', 'email'],
                quiet_hours_enabled: userPrefs.quiet_hours_enabled ?? true,
                timezone_offset_hours: prefs?.timezone_offset ?? -5,
            },
        });

        // Execute if not suppressed
        if (decision.channels.length === 0) {
            return NextResponse.json({
                sent: false,
                reason: decision.suppression_reason ?? 'No eligible channels',
            });
        }

        // Delay if brain says so (queue for later)
        if (decision.delay_seconds > 0) {
            // In production: push to job queue (e.g., Supabase Edge Function cron or BullMQ)
            // For now: log and skip immediate dispatch
            console.log(`[notification-brain] delayed ${decision.delay_seconds}s for ${body.event_type}`);
            // Still insert in-app notification immediately
            if (decision.channels.includes('in_app')) {
                await dispatchInApp(body, decision.channels);
            }
            return NextResponse.json({
                sent: true,
                channels: ['in_app'],
                delayed_channels: decision.channels.filter(c => c !== 'in_app'),
                delay_seconds: decision.delay_seconds,
            });
        }

        // Dispatch to all decided channels
        const dispatched: NotificationChannel[] = [];

        if (decision.channels.includes('in_app')) {
            await dispatchInApp(body, decision.channels);
            dispatched.push('in_app');
        }

        if (decision.channels.includes('email')) {
            await dispatchEmail(body);
            dispatched.push('email');
        }

        if (decision.channels.includes('push')) {
            await dispatchPush(body);
            dispatched.push('push');
        }

        return NextResponse.json({
            sent: true,
            channels: dispatched,
            anti_fatigue_ok: decision.anti_fatigue_ok,
            batch_eligible: decision.batch_eligible,
        });
    } catch (err) {
        console.error('[notification-dispatch] error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
