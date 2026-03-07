// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION INTELLIGENCE LAYER
// Smart throttling + relevance scoring across 52 countries and timezones
//
// Prevents: over-notification → uninstall, under-notification → missed fills,
//           wrong-time alerts across 52 countries
//
// For each user computes:
//   - timezone + quiet hours
//   - role (operator/broker)
//   - corridor preferences
//   - recent engagement score
//
// Send scoring:
//   notification_score = relevance × urgency × engagement × time_of_day
//
// Rules:
//   - suppress low-score notifications
//   - enforce quiet hours per locale
//   - batch non-urgent alerts
//   - instant send for panic-fill loads
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationChannel = 'push' | 'email' | 'in_app' | 'sms';
export type NotificationPriority = 'instant' | 'high' | 'normal' | 'batch' | 'suppress';

export interface UserNotificationProfile {
    userId: string;
    role: 'operator' | 'broker' | 'admin';
    timezone: string;            // IANA timezone e.g. "America/Chicago"
    countryCode: string;
    quietHoursStart: number;     // 0-23 local time
    quietHoursEnd: number;       // 0-23 local time
    corridorPreferences: string[];
    channelPreferences: {
        push: boolean;
        email: boolean;
        in_app: boolean;
        sms: boolean;
    };
    engagementScore: number;     // 0-100 (rolling 30-day)
    lastActiveAt: string;
    totalNotificationsSent7d: number;
    totalNotificationsOpened7d: number;
    totalNotificationsDismissed7d: number;
    fatigueIndex: number;        // 0-1 (higher = more fatigued)
    optOutTypes: string[];       // notification types user opted out of
}

export interface NotificationPayload {
    userId: string;
    type: string;                // e.g. 'load_match', 'rate_alert', 'corridor_shift'
    title: string;
    body: string;
    urgency: 'panic' | 'high' | 'normal' | 'low' | 'digest';
    relevanceContext: {
        corridorId?: string;
        countryCode?: string;
        loadId?: string;
        rateChange?: number;
    };
    channels: NotificationChannel[];
    data?: Record<string, unknown>;
}

export interface SendDecision {
    shouldSend: boolean;
    priority: NotificationPriority;
    channel: NotificationChannel | null;
    delayMinutes: number;        // 0 = immediate, >0 = batch window
    reason: string;
    score: number;
    batchGroup?: string;         // if batching, group key
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY TIMEZONE DEFAULTS
// Used if user hasn't set timezone explicitly
// ═══════════════════════════════════════════════════════════════════════════════

const COUNTRY_TIMEZONES: Record<string, string> = {
    US: 'America/Chicago', CA: 'America/Toronto', AU: 'Australia/Sydney',
    GB: 'Europe/London', NZ: 'Pacific/Auckland', ZA: 'Africa/Johannesburg',
    DE: 'Europe/Berlin', NL: 'Europe/Amsterdam', AE: 'Asia/Dubai',
    BR: 'America/Sao_Paulo', IE: 'Europe/Dublin', SE: 'Europe/Stockholm',
    NO: 'Europe/Oslo', DK: 'Europe/Copenhagen', FI: 'Europe/Helsinki',
    BE: 'Europe/Brussels', AT: 'Europe/Vienna', CH: 'Europe/Zurich',
    ES: 'Europe/Madrid', FR: 'Europe/Paris', IT: 'Europe/Rome',
    PT: 'Europe/Lisbon', SA: 'Asia/Riyadh', QA: 'Asia/Qatar',
    MX: 'America/Mexico_City', PL: 'Europe/Warsaw', CZ: 'Europe/Prague',
    SK: 'Europe/Bratislava', HU: 'Europe/Budapest', SI: 'Europe/Ljubljana',
    EE: 'Europe/Tallinn', LV: 'Europe/Riga', LT: 'Europe/Vilnius',
    HR: 'Europe/Zagreb', RO: 'Europe/Bucharest', BG: 'Europe/Sofia',
    GR: 'Europe/Athens', TR: 'Europe/Istanbul', KW: 'Asia/Kuwait',
    OM: 'Asia/Muscat', BH: 'Asia/Bahrain', SG: 'Asia/Singapore',
    MY: 'Asia/Kuala_Lumpur', JP: 'Asia/Tokyo', KR: 'Asia/Seoul',
    CL: 'America/Santiago', AR: 'America/Buenos_Aires', CO: 'America/Bogota',
    PE: 'America/Lima', UY: 'America/Montevideo', PA: 'America/Panama',
    CR: 'America/Costa_Rica', IN: 'Asia/Kolkata',
};

// Default quiet hours by culture/region
const QUIET_HOURS_DEFAULTS: Record<string, { start: number; end: number }> = {
    US: { start: 21, end: 7 },     // 9pm-7am
    AE: { start: 22, end: 8 },     // consider Friday as weekend
    SA: { start: 22, end: 8 },
    JP: { start: 21, end: 8 },     // more conservative
    DE: { start: 20, end: 7 },     // Germans like early evenings
    BR: { start: 22, end: 7 },
    DEFAULT: { start: 21, end: 7 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
    relevance: 0.35,
    urgency: 0.30,
    engagement: 0.20,
    timeOfDay: 0.15,
};

const SEND_THRESHOLD = 0.35;       // Don't send if score < 0.35
const BATCH_THRESHOLD = 0.55;      // Batch if score < 0.55
const INSTANT_THRESHOLD = 0.80;    // Instant if score >= 0.80

const DAILY_FATIGUE_LIMIT = 12;    // Max notifications per day
const HOURLY_BURST_LIMIT = 3;      // Max per hour

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION INTELLIGENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationIntelligence {

    // ── Core: Should We Send This? ──────────────────────────────────────────

    static decideSend(
        profile: UserNotificationProfile,
        notification: NotificationPayload,
    ): SendDecision {
        // Panic-fill loads ALWAYS send immediately
        if (notification.urgency === 'panic') {
            return {
                shouldSend: true,
                priority: 'instant',
                channel: this.getBestChannel(profile, 'push'),
                delayMinutes: 0,
                reason: 'Panic-fill: immediate delivery',
                score: 1.0,
            };
        }

        // Check opt-outs
        if (profile.optOutTypes.includes(notification.type)) {
            return {
                shouldSend: false,
                priority: 'suppress',
                channel: null,
                delayMinutes: 0,
                reason: `User opted out of "${notification.type}" notifications`,
                score: 0,
            };
        }

        // Compute scores
        const relevanceScore = this.computeRelevance(profile, notification);
        const urgencyScore = this.computeUrgency(notification);
        const engagementScore = profile.engagementScore / 100;
        const timeScore = this.computeTimeOfDayScore(profile);

        const totalScore =
            relevanceScore * WEIGHTS.relevance +
            urgencyScore * WEIGHTS.urgency +
            engagementScore * WEIGHTS.engagement +
            timeScore * WEIGHTS.timeOfDay;

        // Daily fatigue check
        if (profile.totalNotificationsSent7d / 7 > DAILY_FATIGUE_LIMIT) {
            const fatiguePenalty = 0.3;
            const adjustedScore = totalScore - fatiguePenalty;
            if (adjustedScore < SEND_THRESHOLD) {
                return {
                    shouldSend: false,
                    priority: 'suppress',
                    channel: null,
                    delayMinutes: 0,
                    reason: `Fatigue guard: user receiving avg ${(profile.totalNotificationsSent7d / 7).toFixed(1)}/day`,
                    score: adjustedScore,
                };
            }
        }

        // Quiet hours check
        if (this.isQuietHours(profile) && urgencyScore < 0.8) {
            return {
                shouldSend: true,
                priority: 'batch',
                channel: 'in_app',
                delayMinutes: this.minutesUntilQuietEnd(profile),
                reason: 'Quiet hours: batched until morning',
                score: totalScore,
                batchGroup: `morning_digest_${profile.userId}`,
            };
        }

        // Score-based decision
        if (totalScore < SEND_THRESHOLD) {
            return {
                shouldSend: false,
                priority: 'suppress',
                channel: null,
                delayMinutes: 0,
                reason: `Score ${totalScore.toFixed(2)} below threshold ${SEND_THRESHOLD}`,
                score: totalScore,
            };
        }

        if (totalScore < BATCH_THRESHOLD) {
            return {
                shouldSend: true,
                priority: 'batch',
                channel: 'in_app',
                delayMinutes: 30,
                reason: `Low-score batch: ${totalScore.toFixed(2)}`,
                score: totalScore,
                batchGroup: `batch_${notification.type}_${profile.userId}`,
            };
        }

        if (totalScore >= INSTANT_THRESHOLD) {
            return {
                shouldSend: true,
                priority: 'instant',
                channel: this.getBestChannel(profile, 'push'),
                delayMinutes: 0,
                reason: `High relevance: ${totalScore.toFixed(2)}`,
                score: totalScore,
            };
        }

        // Normal priority
        return {
            shouldSend: true,
            priority: 'normal',
            channel: this.getBestChannel(profile, 'push'),
            delayMinutes: 0,
            reason: `Standard send: ${totalScore.toFixed(2)}`,
            score: totalScore,
        };
    }

    // ── Relevance Score ─────────────────────────────────────────────────────

    private static computeRelevance(
        profile: UserNotificationProfile,
        notification: NotificationPayload,
    ): number {
        let score = 0.5; // base

        // Corridor match
        if (notification.relevanceContext.corridorId &&
            profile.corridorPreferences.includes(notification.relevanceContext.corridorId)) {
            score += 0.3;
        }

        // Country match
        if (notification.relevanceContext.countryCode === profile.countryCode) {
            score += 0.1;
        }

        // Role-specific relevance
        if (profile.role === 'operator' && ['load_match', 'rate_alert', 'corridor_surge'].includes(notification.type)) {
            score += 0.1;
        }
        if (profile.role === 'broker' && ['operator_available', 'fill_update', 'bid_received'].includes(notification.type)) {
            score += 0.1;
        }

        return Math.min(1, score);
    }

    // ── Urgency Score ───────────────────────────────────────────────────────

    private static computeUrgency(notification: NotificationPayload): number {
        const urgencyMap: Record<string, number> = {
            panic: 1.0,
            high: 0.8,
            normal: 0.5,
            low: 0.3,
            digest: 0.1,
        };
        return urgencyMap[notification.urgency] ?? 0.5;
    }

    // ── Time of Day Score ───────────────────────────────────────────────────

    private static computeTimeOfDayScore(profile: UserNotificationProfile): number {
        const localHour = this.getUserLocalHour(profile);

        // Peak hours: 7am-9pm → score 0.7-1.0
        // Off-peak: 5am-7am, 9pm-11pm → score 0.3-0.7
        // Quiet: 11pm-5am → score 0.0-0.3
        if (localHour >= 8 && localHour <= 20) return 1.0;
        if (localHour >= 7 || localHour <= 21) return 0.6;
        if (localHour >= 5 || localHour <= 23) return 0.3;
        return 0.1;
    }

    // ── Quiet Hours Check ───────────────────────────────────────────────────

    private static isQuietHours(profile: UserNotificationProfile): boolean {
        const localHour = this.getUserLocalHour(profile);
        const quietStart = profile.quietHoursStart;
        const quietEnd = profile.quietHoursEnd;

        if (quietStart > quietEnd) {
            // Crosses midnight (e.g., 21-7)
            return localHour >= quietStart || localHour < quietEnd;
        }
        return localHour >= quietStart && localHour < quietEnd;
    }

    private static minutesUntilQuietEnd(profile: UserNotificationProfile): number {
        const localHour = this.getUserLocalHour(profile);
        const quietEnd = profile.quietHoursEnd;
        let hoursUntilEnd = quietEnd - localHour;
        if (hoursUntilEnd < 0) hoursUntilEnd += 24;
        return hoursUntilEnd * 60;
    }

    // ── Best Channel Selection ──────────────────────────────────────────────

    private static getBestChannel(
        profile: UserNotificationProfile,
        preferred: NotificationChannel,
    ): NotificationChannel {
        if (profile.channelPreferences[preferred]) return preferred;
        const channels: NotificationChannel[] = ['push', 'in_app', 'email', 'sms'];
        for (const ch of channels) {
            if (profile.channelPreferences[ch]) return ch;
        }
        return 'in_app'; // always available
    }

    // ── Engagement Score Computation ────────────────────────────────────────

    static computeEngagementScore(params: {
        openRate7d: number;           // 0-1
        actionRate7d: number;         // 0-1 (clicked CTA after open)
        lastActiveDaysAgo: number;
        totalSessions30d: number;
    }): number {
        let score = 0;

        // Open rate: weighted heavily
        score += params.openRate7d * 35;

        // Action rate: most valuable signal
        score += params.actionRate7d * 30;

        // Recency
        if (params.lastActiveDaysAgo <= 1) score += 20;
        else if (params.lastActiveDaysAgo <= 3) score += 15;
        else if (params.lastActiveDaysAgo <= 7) score += 10;
        else if (params.lastActiveDaysAgo <= 14) score += 5;

        // Session frequency
        score += Math.min(15, params.totalSessions30d * 0.5);

        return Math.min(100, Math.round(score));
    }

    // ── Fatigue Index Computation ───────────────────────────────────────────

    static computeFatigueIndex(params: {
        notificationsSent7d: number;
        notificationsOpened7d: number;
        notificationsDismissed7d: number;
        optOutActions30d: number;
    }): number {
        const openRate = params.notificationsSent7d > 0
            ? params.notificationsOpened7d / params.notificationsSent7d
            : 0;
        const dismissRate = params.notificationsSent7d > 0
            ? params.notificationsDismissed7d / params.notificationsSent7d
            : 0;

        // High dismiss rate = high fatigue
        // Low open rate = high fatigue
        // Opt-outs = very high fatigue
        let fatigue = 0;
        fatigue += (1 - openRate) * 0.3;
        fatigue += dismissRate * 0.3;
        fatigue += Math.min(0.4, params.optOutActions30d * 0.1);

        return Math.min(1, Math.round(fatigue * 100) / 100);
    }

    // ── Build Default Profile ───────────────────────────────────────────────

    static buildDefaultProfile(params: {
        userId: string;
        role: 'operator' | 'broker' | 'admin';
        countryCode: string;
    }): UserNotificationProfile {
        const quietHours = QUIET_HOURS_DEFAULTS[params.countryCode] || QUIET_HOURS_DEFAULTS.DEFAULT;
        const tz = COUNTRY_TIMEZONES[params.countryCode] || 'UTC';

        return {
            userId: params.userId,
            role: params.role,
            timezone: tz,
            countryCode: params.countryCode,
            quietHoursStart: quietHours.start,
            quietHoursEnd: quietHours.end,
            corridorPreferences: [],
            channelPreferences: { push: true, email: true, in_app: true, sms: false },
            engagementScore: 50, // start neutral
            lastActiveAt: new Date().toISOString(),
            totalNotificationsSent7d: 0,
            totalNotificationsOpened7d: 0,
            totalNotificationsDismissed7d: 0,
            fatigueIndex: 0,
            optOutTypes: [],
        };
    }

    // ── Unsubscribe Health Monitor ──────────────────────────────────────────

    static computeUnsubscribeHealth(params: {
        totalUsers: number;
        unsubscribes30d: number;
        optOutsByType: Record<string, number>;
    }): {
        unsubscribeRate: number;    // 0-1
        healthStatus: 'healthy' | 'warning' | 'critical';
        problematicTypes: string[];
        recommendation: string;
    } {
        const rate = params.totalUsers > 0
            ? params.unsubscribes30d / params.totalUsers
            : 0;

        const problematic = Object.entries(params.optOutsByType)
            .filter(([, count]) => count > params.totalUsers * 0.05)
            .map(([type]) => type);

        let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
        let recommendation = 'Notification health is good';

        if (rate > 0.05) {
            healthStatus = 'critical';
            recommendation = `CRITICAL: ${(rate * 100).toFixed(1)}% unsubscribe rate. Reduce notification volume immediately.`;
        } else if (rate > 0.02) {
            healthStatus = 'warning';
            recommendation = `WARNING: ${(rate * 100).toFixed(1)}% unsubscribe rate. Review ${problematic.join(', ')} notification types.`;
        }

        return { unsubscribeRate: rate, healthStatus, problematicTypes: problematic, recommendation };
    }

    // ── Internal Helpers ────────────────────────────────────────────────────

    private static getUserLocalHour(profile: UserNotificationProfile): number {
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: profile.timezone,
                hour: 'numeric',
                hour12: false,
            });
            return parseInt(formatter.format(now), 10);
        } catch {
            return new Date().getUTCHours(); // fallback
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT METRICS TYPES (for dashboarding)
// ═══════════════════════════════════════════════════════════════════════════════

export interface NotificationMetrics {
    period: '7d' | '30d';
    totalSent: number;
    totalOpened: number;
    totalDismissed: number;
    totalSuppressed: number;
    openRate: number;
    actionRate: number;
    fatigueIndex: number;  // platform-wide average
    byChannel: Record<NotificationChannel, { sent: number; opened: number }>;
    byType: Record<string, { sent: number; opened: number; optOuts: number }>;
    byCountry: Record<string, { sent: number; opened: number }>;
}
