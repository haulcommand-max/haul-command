/**
 * lib/push/role-lock.ts
 *
 * Firebase ↔ Supabase Role Lock
 *
 * This file enforces the dual-system architecture:
 *
 *   Supabase = System of record
 *     - authentication, primary database, escort presence,
 *       broker activity, liquidity scoring, trust metrics,
 *       telemetry storage, realtime subscriptions
 *
 *   Firebase = Push delivery ONLY
 *     - FCM push delivery, device token management, notification fanout
 *     - NOT responsible for: database, business logic, marketplace state
 *
 * NEVER bypass this file to call Firebase for data storage or business logic.
 * NEVER bypass this file to use Supabase for push notification delivery.
 *
 * Notification priority ladder:
 *   1. Push (Firebase FCM) ← always try first
 *   2. In-app alert        ← Supabase realtime
 *   3. Email               ← Supabase + transactional provider
 *   4. SMS                 ← LAST RESORT ONLY (cost protection)
 */

// ── Role definitions (locked — do not modify without architecture review) ──────

export const SUPABASE_RESPONSIBILITIES = [
    "authentication",
    "primary_database",
    "escort_presence",
    "broker_activity",
    "liquidity_scoring",
    "trust_metrics",
    "telemetry_storage",
    "realtime_subscriptions",
] as const;

export const FIREBASE_RESPONSIBILITIES = [
    "fcm_push_delivery",
    "device_token_management",
    "notification_fanout",
] as const;

export const FIREBASE_NOT_RESPONSIBLE_FOR = [
    "primary_database",
    "business_logic",
    "marketplace_state",
    "trust_scoring",
    "liquidity_data",
] as const;

// ── Notification priority ladder ───────────────────────────────────────────────

export type NotificationChannel = "push" | "in_app" | "email" | "sms";

export const NOTIFICATION_PRIORITY_LADDER: NotificationChannel[] = [
    "push",    // Firebase FCM — always attempt first
    "in_app",  // Supabase realtime subscription
    "email",   // Transactional email provider
    "sms",     // LAST RESORT only — cost protection enforced
];

// ── SMS cost protection policy ─────────────────────────────────────────────────

export interface SmsPolicy {
    /** Minimum urgency score (0–100) required to allow SMS send */
    minUrgencyScore: number;
    /** User must have explicitly opted into SMS */
    requireOptIn: boolean;
    /** Must attempt push first; only send SMS if push not delivered */
    requirePushAttemptFirst: boolean;
    /** Max SMS per user per 24h window */
    maxPerUserPer24h: number;
}

export const SMS_POLICY: SmsPolicy = {
    minUrgencyScore: 75,
    requireOptIn: true,
    requirePushAttemptFirst: true,
    maxPerUserPer24h: 2,
};

// ── Guard function — use before any SMS send ───────────────────────────────────

/**
 * Returns true if SMS is allowed for this event.
 * Call before invoking any SMS provider.
 */
export function smsAllowed(opts: {
    urgencyScore: number;
    userOptedIn: boolean;
    pushWasAttempted: boolean;
    smsSentTodayCount: number;
}): { allowed: boolean; reason?: string } {
    if (!opts.userOptedIn) {
        return { allowed: false, reason: "User has not opted into SMS notifications." };
    }
    if (!opts.pushWasAttempted) {
        return { allowed: false, reason: "Push must be attempted before SMS fallback." };
    }
    if (opts.urgencyScore < SMS_POLICY.minUrgencyScore) {
        return { allowed: false, reason: `Urgency score ${opts.urgencyScore} below threshold ${SMS_POLICY.minUrgencyScore}.` };
    }
    if (opts.smsSentTodayCount >= SMS_POLICY.maxPerUserPer24h) {
        return { allowed: false, reason: `Daily SMS limit (${SMS_POLICY.maxPerUserPer24h}) reached.` };
    }
    return { allowed: true };
}

// ── Architecture violation detection (dev mode) ───────────────────────────────

/**
 * Use in development to assert you're using the right system.
 * No-op in production builds.
 */
export function assertSupabaseRole(action: string) {
    if (FIREBASE_NOT_RESPONSIBLE_FOR.some(r => action.includes(r))) {
        console.warn(
            `[role-lock] ⚠ Action "${action}" appears to use Firebase for a Supabase responsibility. ` +
            `Firebase is push delivery only. Check your data flow.`
        );
    }
}
