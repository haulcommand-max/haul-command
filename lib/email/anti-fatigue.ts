/**
 * Anti-Fatigue Email Gate
 * 
 * Prevents email spam by enforcing:
 *  - 3 emails/user/day global cap
 *  - Quiet hours (21:00–07:00 user local time)
 *  - 120-day inactivity suppress
 *  - 180-day auto-sunset (unsubscribe unengaged)
 */

import { supabaseServer } from '@/lib/supabase/server';

// ─── Types ───────────────────────────────────────────────────────
export interface FatigueCheckResult {
    allowed: boolean;
    reason?: string;
}

export interface FatigueConfig {
    globalCapPerDay: number;
    suppressIfInactiveDays: number;
    autoSunsetDays: number;
    quietHoursStart: number; // 0-23
    quietHoursEnd: number;   // 0-23
}

// ─── Default Config ──────────────────────────────────────────────
const DEFAULT_FATIGUE_CONFIG: FatigueConfig = {
    globalCapPerDay: 3,
    suppressIfInactiveDays: 120,
    autoSunsetDays: 180,
    quietHoursStart: 21, // 9 PM
    quietHoursEnd: 7,     // 7 AM
};

// ─── Checks ──────────────────────────────────────────────────────

/**
 * Check if sending an email to this user is allowed.
 * Call this BEFORE every transactional email send.
 */
export async function checkFatigue(
    userId: string,
    config: Partial<FatigueConfig> = {}
): Promise<FatigueCheckResult> {
    const cfg = { ...DEFAULT_FATIGUE_CONFIG, ...config };
    const supabase = supabaseServer();

    // ── 1. Email opt-in check ──
    const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_opt_in, quiet_hours_start, quiet_hours_end')
        .eq('user_id', userId)
        .single();

    if (prefs && prefs.email_opt_in === false) {
        return { allowed: false, reason: 'User has opted out of email' };
    }

    // ── 2. Daily cap check ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from('email_send_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('sent_at', todayStart.toISOString());

    if ((count || 0) >= cfg.globalCapPerDay) {
        return { allowed: false, reason: `Daily cap reached (${cfg.globalCapPerDay}/day)` };
    }

    // ── 3. Quiet hours check ──
    const userQuietStart = prefs?.quiet_hours_start ?? cfg.quietHoursStart;
    const userQuietEnd = prefs?.quiet_hours_end ?? cfg.quietHoursEnd;
    const currentHour = new Date().getUTCHours(); // TODO: convert to user's timezone

    if (isInQuietHours(currentHour, userQuietStart, userQuietEnd)) {
        return { allowed: false, reason: `Quiet hours (${userQuietStart}:00–${userQuietEnd}:00)` };
    }

    // ── 4. Inactivity suppress (120 days) ──
    const { data: lastActivity } = await supabase
        .from('driver_profiles')
        .select('updated_at')
        .eq('user_id', userId)
        .single();

    if (lastActivity?.updated_at) {
        const daysSinceActivity = daysBetween(new Date(lastActivity.updated_at), new Date());

        if (daysSinceActivity >= cfg.autoSunsetDays) {
            // Auto-sunset: disable email for this user
            await supabase
                .from('notification_preferences')
                .update({ email_opt_in: false, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
            return { allowed: false, reason: `Auto-sunset: ${daysSinceActivity} days inactive (>${cfg.autoSunsetDays})` };
        }

        if (daysSinceActivity >= cfg.suppressIfInactiveDays) {
            return { allowed: false, reason: `Suppressed: ${daysSinceActivity} days inactive (>${cfg.suppressIfInactiveDays})` };
        }
    }

    return { allowed: true };
}

// ─── Helpers ─────────────────────────────────────────────────────

function isInQuietHours(currentHour: number, start: number, end: number): boolean {
    if (start < end) {
        // e.g. start=9, end=17 → quiet during 9-17
        return currentHour >= start && currentHour < end;
    }
    // Wraps midnight: e.g. start=21, end=7 → quiet during 21-24 AND 0-7
    return currentHour >= start || currentHour < end;
}

function daysBetween(a: Date, b: Date): number {
    const diffMs = Math.abs(b.getTime() - a.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export { DEFAULT_FATIGUE_CONFIG };
