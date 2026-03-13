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
    // ── CRITICAL — all channels, no quiet hours ────────────────────────────
    'load.matched': { channels: ['in_app', 'push', 'sms'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'load.urgent': { channels: ['in_app', 'push', 'sms'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'load.match_found': { channels: ['in_app', 'push', 'sms'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'payment.failed': { channels: ['in_app', 'push', 'email'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'sponsorship.payment_failed': { channels: ['in_app', 'push', 'email'], priority: 'critical', batch_window_minutes: 0, quiet_hours_respect: false },
    'dispute.filed': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: false },

    // ── HIGH — push + in-app ───────────────────────────────────────────────
    'claim.started': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'claim.completed': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'doc.expiring': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 60, quiet_hours_respect: true },
    'boost.expiring': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'boost.renewal_due': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'rank.dropped': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 30, quiet_hours_respect: true },
    'credential.rejected': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'credential.expiring': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 60, quiet_hours_respect: true },
    'training.renewal_due': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'training.expired': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'sponsorship.expiring': { channels: ['in_app', 'push', 'email'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },
    'lead.credit_low': { channels: ['in_app', 'push'], priority: 'high', batch_window_minutes: 0, quiet_hours_respect: true },

    // ── MEDIUM — in-app + email ────────────────────────────────────────────
    'freshness.cooling': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 120, quiet_hours_respect: true },
    'lead.unlocked': { channels: ['in_app'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'lead.credit_refund': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'profile.viewed': { channels: ['in_app'], priority: 'medium', batch_window_minutes: 60, quiet_hours_respect: true },
    'review.received': { channels: ['in_app', 'push'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'training.enrolled': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'training.completed': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'training.reminder': { channels: ['in_app', 'push'], priority: 'medium', batch_window_minutes: 1440, quiet_hours_respect: true },
    'credential.submitted': { channels: ['in_app'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'credential.approved': { channels: ['in_app', 'push', 'email'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'boost.activated': { channels: ['in_app', 'push'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },
    'sponsorship.activated': { channels: ['in_app', 'email'], priority: 'medium', batch_window_minutes: 0, quiet_hours_respect: true },

    // ── LOW — in-app only, batchable ───────────────────────────────────────
    'load.digest': { channels: ['in_app', 'email'], priority: 'low', batch_window_minutes: 1440, quiet_hours_respect: true },
    'load.alert_paused': { channels: ['in_app'], priority: 'low', batch_window_minutes: 0, quiet_hours_respect: true },
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
 * Every event_type maps to a Novu workflow_id and human-readable template name.
 * workflow_id uses kebab-case (dots → hyphens) for Novu compatibility.
 */
export const NOVU_WORKFLOWS: Record<string, { workflow_id: string; template_name: string }> = {
    // ── Core Platform ──────────────────────────────────────────────────────
    'load.matched': { workflow_id: 'load-matched', template_name: 'Load Match Alert' },
    'load.urgent': { workflow_id: 'load-urgent', template_name: 'Urgent Load Alert' },
    'claim.started': { workflow_id: 'claim-started', template_name: 'Claim Started' },
    'claim.completed': { workflow_id: 'claim-completed', template_name: 'Claim Completed' },
    'doc.expiring': { workflow_id: 'doc-expiring', template_name: 'Document Expiring' },
    'rank.dropped': { workflow_id: 'rank-dropped', template_name: 'Rank Drop Alert' },
    'freshness.cooling': { workflow_id: 'freshness-cooling', template_name: 'Freshness Alert' },
    'review.received': { workflow_id: 'review-received', template_name: 'New Review' },
    'payment.failed': { workflow_id: 'payment-failed', template_name: 'Payment Failed' },

    // ── Lead Unlocks (public.lead_unlocks) ──────────────────────────────────
    'lead.unlocked': { workflow_id: 'lead-unlocked', template_name: 'Lead Unlocked' },
    'lead.credit_low': { workflow_id: 'lead-credit-low', template_name: 'Credits Running Low' },
    'lead.credit_refund': { workflow_id: 'lead-credit-refund', template_name: 'Credit Refund Issued' },

    // ── Training (public.training_enrollments) ──────────────────────────────
    'training.enrolled': { workflow_id: 'training-enrolled', template_name: 'Training Enrollment Confirmed' },
    'training.reminder': { workflow_id: 'training-reminder', template_name: 'Training Reminder' },
    'training.renewal_due': { workflow_id: 'training-renewal-due', template_name: 'Training Renewal Due' },
    'training.expired': { workflow_id: 'training-expired', template_name: 'Training Certificate Expired' },

    // ── Credentials (public.credential_verifications) ───────────────────────
    'credential.submitted': { workflow_id: 'credential-submitted', template_name: 'Credential Under Review' },
    'credential.approved': { workflow_id: 'credential-approved', template_name: 'Credential Approved' },
    'credential.rejected': { workflow_id: 'credential-rejected', template_name: 'Credential Rejected' },
    'credential.expiring': { workflow_id: 'credential-expiring', template_name: 'Credential Expiring Soon' },

    // ── Load Alerts (public.hc_load_alerts) ─────────────────────────────────
    'load.match_found': { workflow_id: 'load-match-found', template_name: 'New Load Match' },
    'load.digest': { workflow_id: 'load-digest', template_name: 'Load Digest' },
    'load.alert_paused': { workflow_id: 'load-alert-paused', template_name: 'Load Alerts Paused' },

    // ── Profile Boosts (public.profile_boosts) ──────────────────────────────
    'boost.activated': { workflow_id: 'boost-activated', template_name: 'Boost Activated' },
    'boost.expiring': { workflow_id: 'boost-expiring', template_name: 'Boost Expiring Soon' },
    'boost.renewal_due': { workflow_id: 'boost-renewal-due', template_name: 'Boost Renewal Recommended' },

    // ── Territory Sponsorships (public.territory_sponsorships) ──────────────
    'sponsorship.activated': { workflow_id: 'sponsorship-activated', template_name: 'Sponsorship Live' },
    'sponsorship.expiring': { workflow_id: 'sponsorship-expiring', template_name: 'Sponsorship Expiring' },
    'sponsorship.payment_failed': { workflow_id: 'sponsorship-payment-failed', template_name: 'Sponsorship Payment Failed' },
};
