/**
 * Notification Brain — Hybrid Stack
 * 
 * Orchestrates multi-channel notifications via Novu.
 * Channels: in-app, push, email (Resend), SMS, webhook.
 * 
 * Smart routing: picks channel by urgency, user prefs, and time-of-day.
 * 
 * Anti-fatigue: enforces rate limits per user/channel/window.
 */

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms' | 'webhook';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationPayload {
    event_type: string;
    recipient_id: string;
    recipient_role: 'operator' | 'broker' | 'dispatcher' | 'admin';
    priority: NotificationPriority;
    data: Record<string, unknown>;
    // Channel preferences (optional overrides)
    force_channels?: NotificationChannel[];
    suppress_channels?: NotificationChannel[];
}

export interface NotificationDecision {
    channels: NotificationChannel[];
    delay_seconds: number;
    batch_eligible: boolean;
    anti_fatigue_ok: boolean;
    suppression_reason?: string;
}

// Event → channel mapping
interface EventConfig {
    channels: NotificationChannel[];
    priority: NotificationPriority;
    batch_window_minutes: number;
    quiet_hours_respect: boolean;
}

const EVENT_CONFIGS: Record<string, EventConfig> = {
    // Critical — all channels
    'load.matched': { channels: ['in_app', 'push', 'sms'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'load.urgent': { channels: ['in_app', 'push', 'sms'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'payment.failed': { channels: ['in_app', 'push', 'email'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'dispute.filed': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: false },

    // High — push + in-app
    'claim.started': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'claim.completed': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'doc.expiring': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 60, quiet_hours_respect: true },
    'boost.expiring': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'rank.dropped': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 30, quiet_hours_respect: true },

    // Medium — in-app + email digest
    'freshness.cooling': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 120, quiet_hours_respect: true },
    'lead.unlocked': { channels: ['in_app'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'profile.viewed': { channels: ['in_app'], priority: 'medium', batch_window_minutes: 60, quiet_hours_respect: true },
    'review.received': { channels: ['in_app', 'push'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'training.completed': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },

    // Low — in-app only, batchable
    'report_card.updated': { channels: ['in_app'], priority: 'low', batch_window_minutes: 1440, quiet_hours_respect: true },
    'leaderboard.update': { channels: ['in_app'], priority: 'low', batch_window_minutes: 1440, quiet_hours_respect: true },
    'system.announcement': { channels: ['in_app', 'email'], priority: 'low', batch_window_minutes: 0, quiet_hours_respect: true },
};

// Anti-fatigue limits: max notifications per channel per window
const RATE_LIMITS: Record<NotificationChannel, { max: number; window_hours: number }> = {
    in_app: { max: 20, window_hours: 24 },
    push: { max: 8, window_hours: 24 },
    email: { max: 3, window_hours: 24 },
    sms: { max: 4, window_hours: 24 },
    webhook: { max: 100, window_hours: 24 },
};

// Quiet hours (user's local time)
const QUIET_START = 22; // 10 PM
const QUIET_END = 7;   // 7 AM

interface UserNotificationState {
    notifications_sent_24h: Record<NotificationChannel, number>;
    user_preferences: {
        channels_enabled: NotificationChannel[];
        quiet_hours_enabled: boolean;
        timezone_offset_hours: number;
    };
}

function isQuietHours(timezoneOffset: number): boolean {
    const userHour = (new Date().getUTCHours() + timezoneOffset + 24) % 24;
    return userHour >= QUIET_START || userHour < QUIET_END;
}

export function decideNotification(
    payload: NotificationPayload,
    userState: UserNotificationState,
): NotificationDecision {
    const config = EVENT_CONFIGS[payload.event_type];

    if (!config) {
        // Unknown event — default to in-app only
        return {
            channels: ['in_app'],
            delay_seconds: 0,
            batch_eligible: false,
            anti_fatigue_ok: true,
        };
    }

    // Start with configured channels
    let channels = [...config.channels];

    // Apply force overrides
    if (payload.force_channels?.length) {
        channels = payload.force_channels;
    }

    // Apply suppress overrides
    if (payload.suppress_channels?.length) {
        channels = channels.filter(c => !payload.suppress_channels!.includes(c));
    }

    // Filter by user preferences
    channels = channels.filter(c => userState.user_preferences.channels_enabled.includes(c));

    // Quiet hours check
    const inQuietHours = userState.user_preferences.quiet_hours_enabled &&
        isQuietHours(userState.user_preferences.timezone_offset_hours);

    if (inQuietHours && config.quiet_hours_respect) {
        // Keep in-app, suppress push/sms
        channels = channels.filter(c => c === 'in_app' || c === 'email' || c === 'webhook');
    }

    // Anti-fatigue check
    let antiOk = true;
    let suppressionReason: string | undefined;
    const filteredChannels: NotificationChannel[] = [];

    for (const ch of channels) {
        const limit = RATE_LIMITS[ch];
        const sent = userState.notifications_sent_24h[ch] || 0;
        if (sent >= limit.max) {
            antiOk = false;
            suppressionReason = `${ch} rate limit (${sent}/${limit.max} in ${limit.window_hours}h)`;
        } else {
            filteredChannels.push(ch);
        }
    }

    // Critical always gets through (at least in-app)
    if (payload.priority === 'critical' && filteredChannels.length === 0) {
        filteredChannels.push('in_app');
        antiOk = true;
        suppressionReason = undefined;
    }

    // Batch eligibility
    const batchEligible = config.batch_window_minutes > 0;
    const delaySec = inQuietHours && config.quiet_hours_respect
        ? Math.max(config.batch_window_minutes * 60, 3600) // Delay until morning
        : config.batch_window_minutes * 60;

    return {
        channels: filteredChannels,
        delay_seconds: delaySec,
        batch_eligible: batchEligible,
        anti_fatigue_ok: antiOk,
        suppression_reason: suppressionReason,
    };
}

/**
 * Template map for Novu workflow triggers
 */
export const NOVU_WORKFLOWS: Record<string, { workflow_id: string; template_name: string }> = {
    'load.matched': { workflow_id: 'load-matched', template_name: 'Load Match Alert' },
    'load.urgent': { workflow_id: 'load-urgent', template_name: 'Urgent Load Alert' },
    'claim.started': { workflow_id: 'claim-started', template_name: 'Claim Started' },
    'claim.completed': { workflow_id: 'claim-completed', template_name: 'Claim Completed' },
    'doc.expiring': { workflow_id: 'doc-expiring', template_name: 'Document Expiring' },
    'boost.expiring': { workflow_id: 'boost-expiring', template_name: 'Boost Expiring' },
    'rank.dropped': { workflow_id: 'rank-dropped', template_name: 'Rank Drop Alert' },
    'freshness.cooling': { workflow_id: 'freshness-cooling', template_name: 'Freshness Alert' },
    'review.received': { workflow_id: 'review-received', template_name: 'New Review' },
    'payment.failed': { workflow_id: 'payment-failed', template_name: 'Payment Failed' },
};
