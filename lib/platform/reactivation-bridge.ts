// ═══════════════════════════════════════════════════════════════════════════════
// REACTIVATION BRIDGE
// Wires UrgencyEngine reactivation sequences through NotificationIntelligence
// for smart throttling, fatigue detection, and timezone-aware delivery.
//
// Called by cron (daily). Replaces the direct push_queue writes in UrgencyEngine
// with NotificationIntelligence-scored delivery.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import {
    NotificationIntelligence,
    type UserNotificationProfile,
    type NotificationPayload,
} from './notification-intelligence';
import { sendPushToUser } from '@/lib/push-send';
import { captureEvent } from '@/lib/analytics/event-pipeline';

// ── Reactivation windows ────────────────────────────────────────────────────

interface ReactivationStep {
    trigger: string;
    daysInactive: number;
    windowHours: number;    // ±window around the target day
    title: string;
    bodyTemplate: string;
    channel: 'push' | 'email';
    urgency: 'high' | 'normal' | 'low';
}

const REACTIVATION_STEPS: ReactivationStep[] = [
    {
        trigger: 'reactivation_d3',
        daysInactive: 3,
        windowHours: 12,
        title: 'loads are moving in your area',
        bodyTemplate: '{{load_count}} loads posted near you since you were last active. toggle available to get matched.',
        channel: 'push',
        urgency: 'normal',
    },
    {
        trigger: 'reactivation_d7',
        daysInactive: 7,
        windowHours: 12,
        title: 'your corridor is busy',
        bodyTemplate: '{{load_count}} loads posted in {{corridor_name}} this week. {{competitor_count}} operators are getting booked.',
        channel: 'push',
        urgency: 'high',
    },
    {
        trigger: 'reactivation_d14',
        daysInactive: 14,
        windowHours: 12,
        title: 'brokers are searching your area',
        bodyTemplate: '{{search_count}} broker searches in your coverage area this week. your profile is losing visibility.',
        channel: 'push',
        urgency: 'high',
    },
    {
        trigger: 'reactivation_d30',
        daysInactive: 30,
        windowHours: 12,
        title: "we miss you — here's what you've missed",
        bodyTemplate: '{{load_count}} loads, {{booking_count}} bookings in your corridors this month. your momentum score has dropped to {{momentum}}.',
        channel: 'email',
        urgency: 'normal',
    },
];

// ── Bridge ──────────────────────────────────────────────────────────────────

function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

function interpolate(template: string, vars: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

async function buildNotificationProfile(
    db: ReturnType<typeof createClient<any, any, any>>,
    userId: string,
    countryCode: string,
): Promise<UserNotificationProfile> {
    // Get notification stats for fatigue
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [sentRes, openedRes, dismissedRes] = await Promise.all([
        db.from('notification_events').select('id', { count: 'exact', head: true })
            .eq('user_id', userId).gte('created_at', sevenDaysAgo),
        db.from('notification_events').select('id', { count: 'exact', head: true })
            .eq('user_id', userId).not('read_at', 'is', null).gte('created_at', sevenDaysAgo),
        db.from('notification_events').select('id', { count: 'exact', head: true })
            .eq('user_id', userId).gte('created_at', sevenDaysAgo),
    ]);

    const sent7d = sentRes.count ?? 0;
    const opened7d = openedRes.count ?? 0;

    const profile = NotificationIntelligence.buildDefaultProfile({
        userId,
        role: 'operator',
        countryCode: countryCode || 'US',
    });

    profile.totalNotificationsSent7d = sent7d;
    profile.totalNotificationsOpened7d = opened7d;
    profile.engagementScore = NotificationIntelligence.computeEngagementScore({
        openRate7d: sent7d > 0 ? opened7d / sent7d : 0.5,
        actionRate7d: 0.1, // default — no action tracking yet
        lastActiveDaysAgo: 3,
        totalSessions30d: 5,
    });
    profile.fatigueIndex = NotificationIntelligence.computeFatigueIndex({
        notificationsSent7d: sent7d,
        notificationsOpened7d: opened7d,
        notificationsDismissed7d: 0,
        optOutActions30d: 0,
    });

    return profile;
}

export async function runReactivationWithIntelligence(): Promise<{
    total_scanned: number;
    total_sent: number;
    total_suppressed: number;
    by_step: Record<string, { scanned: number; sent: number; suppressed: number }>;
}> {
    const db = getDb();
    const now = Date.now();
    const results: Record<string, { scanned: number; sent: number; suppressed: number }> = {};
    let totalScanned = 0;
    let totalSent = 0;
    let totalSuppressed = 0;

    for (const step of REACTIVATION_STEPS) {
        const stepResult = { scanned: 0, sent: 0, suppressed: 0 };

        // Find operators in this inactivity window
        const windowStart = new Date(now - (step.daysInactive * 86400000 + step.windowHours * 3600000)).toISOString();
        const windowEnd = new Date(now - (step.daysInactive * 86400000 - step.windowHours * 3600000)).toISOString();

        const { data: operators } = await db
            .from('profiles')
            .select('id, home_state, country')
            .eq('role', 'driver')
            .gte('last_active_at', windowStart)
            .lte('last_active_at', windowEnd)
            .limit(200);

        if (!operators || operators.length === 0) {
            results[step.trigger] = stepResult;
            continue;
        }

        for (const op of operators) {
            stepResult.scanned++;
            totalScanned++;

            const state = op.home_state ?? 'FL';
            const country = op.country ?? 'US';

            // Deduplicate: check if we already sent this trigger recently
            const cooldownStart = new Date(now - 7 * 86400000).toISOString();
            const { count: recentSent } = await db
                .from('notification_events')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', op.id)
                .eq('type', step.trigger)
                .gte('created_at', cooldownStart);

            if ((recentSent ?? 0) > 0) {
                stepResult.suppressed++;
                totalSuppressed++;
                continue;
            }

            // Get corridor activity for personalization
            const weekAgo = new Date(now - 7 * 86400000).toISOString();
            const monthAgo = new Date(now - 30 * 86400000).toISOString();

            const [loadRes, bookingRes, searchRes, momentumRes] = await Promise.all([
                db.from('loads').select('id', { count: 'exact', head: true })
                    .eq('origin_state', state).gte('created_at', weekAgo),
                db.from('jobs').select('id', { count: 'exact', head: true })
                    .gte('created_at', monthAgo),
                db.from('directory_views').select('id', { count: 'exact', head: true })
                    .gte('created_at', weekAgo),
                db.from('operator_momentum').select('score').eq('user_id', op.id).maybeSingle(),
            ]);

            const eventData = {
                load_count: loadRes.count ?? 0,
                booking_count: bookingRes.count ?? 0,
                search_count: searchRes.count ?? 0,
                corridor_name: `${state} corridor`,
                competitor_count: Math.max(3, Math.floor((loadRes.count ?? 5) * 0.6)),
                momentum: (momentumRes.data as any)?.score ?? 0,
            };

            // Build notification payload
            const body = interpolate(step.bodyTemplate, eventData);
            const payload: NotificationPayload = {
                userId: op.id,
                type: step.trigger,
                title: step.title,
                body,
                urgency: step.urgency,
                relevanceContext: { countryCode: country },
                channels: [step.channel],
                data: eventData,
            };

            // Route through NotificationIntelligence
            const profile = await buildNotificationProfile(db, op.id, country);
            const decision = NotificationIntelligence.decideSend(profile, payload);

            if (!decision.shouldSend) {
                stepResult.suppressed++;
                totalSuppressed++;
                continue;
            }

            // Deliver based on decided channel
            const channel = decision.channel ?? step.channel;

            if (channel === 'push' && decision.delayMinutes === 0) {
                try {
                    await sendPushToUser(op.id, {
                        title: step.title,
                        body,
                        url: '/app',
                    });
                } catch {
                    // Push is best-effort
                }
            }

            // Always write to notification_events for in-app + history
            await db.from('notification_events').insert({
                user_id: op.id,
                type: step.trigger,
                title: step.title,
                body,
                action_url: '/app',
                meta: {
                    ...eventData,
                    decision_score: decision.score,
                    decision_channel: channel,
                    decision_reason: decision.reason,
                },
            });

            // Fire analytics event
            captureEvent({
                category: 'notification',
                action: 'reactivation_sent',
                trigger: step.trigger,
                channel,
                score: decision.score,
                days_inactive: step.daysInactive,
            } as any);

            stepResult.sent++;
            totalSent++;
        }

        results[step.trigger] = stepResult;
    }

    return {
        total_scanned: totalScanned,
        total_sent: totalSent,
        total_suppressed: totalSuppressed,
        by_step: results,
    };
}
