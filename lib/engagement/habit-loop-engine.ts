// ══════════════════════════════════════════════════════════════
// HABIT LOOP ENGINE
// Spec: HC_DOMINATION_PATCH_V1 Phase 8
// Purpose: Drive daily/weekly return visits. Every user should
//          have a reason to come back. Notifications, streaks,
//          alerts, and engagement hooks across all 52 countries.
// ══════════════════════════════════════════════════════════════

// ── Habit Loop Types ──

export interface HabitLoop {
    id: string;
    name: string;
    trigger: HabitTrigger;
    action: string;
    reward: HabitReward;
    frequency: "immediate" | "daily" | "weekly" | "event_driven";
    targetAudience: ("escort" | "broker" | "carrier")[];
    retentionImpact: "critical" | "high" | "medium" | "low";
}

export interface HabitTrigger {
    type: "push_notification" | "email" | "sms" | "in_app" | "badge" | "webhook";
    condition: string;
    /** Localized message template — {var} placeholders */
    messageTemplate: string;
}

export interface HabitReward {
    type: "visibility_boost" | "badge" | "streak_counter" | "lead_priority" | "data_unlock" | "social_proof";
    description: string;
    value?: number;
}

// ── Core Habit Loops ──

export const HABIT_LOOPS: HabitLoop[] = [
    // ── ESCORT OPERATOR LOOPS ──
    {
        id: "escort_daily_availability",
        name: "Daily Availability Check-In",
        trigger: {
            type: "push_notification",
            condition: "8:00 AM local time, escort hasn't updated availability today",
            messageTemplate: "Are you available today? Quick check-in boosts your visibility 🟢",
        },
        action: "Tap to confirm availability status",
        reward: {
            type: "visibility_boost",
            description: "Available escorts get 2x listing priority",
            value: 2,
        },
        frequency: "daily",
        targetAudience: ["escort"],
        retentionImpact: "critical",
    },
    {
        id: "escort_lead_alert",
        name: "New Lead Alert",
        trigger: {
            type: "push_notification",
            condition: "Broker requests escort within operator's radius",
            messageTemplate: "🔔 New job request in {city}! {distance}km away. Respond first to win.",
        },
        action: "View lead details + accept/decline",
        reward: {
            type: "lead_priority",
            description: "Fast responders get priority on future leads",
        },
        frequency: "event_driven",
        targetAudience: ["escort"],
        retentionImpact: "critical",
    },
    {
        id: "escort_weekly_stats",
        name: "Weekly Performance Report",
        trigger: {
            type: "email",
            condition: "Every Monday 9:00 AM local time",
            messageTemplate: "Your week: {views} profile views, {leads} leads, {rank} rank in {city}. See how to improve →",
        },
        action: "Open performance dashboard",
        reward: {
            type: "data_unlock",
            description: "See competitor benchmarks and improvement tips",
        },
        frequency: "weekly",
        targetAudience: ["escort"],
        retentionImpact: "high",
    },
    {
        id: "escort_streak",
        name: "Availability Streak",
        trigger: {
            type: "in_app",
            condition: "Consecutive days of confirmed availability",
            messageTemplate: "🔥 {streak_days}-day streak! Keep it up for a Reliability Badge.",
        },
        action: "Maintain daily check-in",
        reward: {
            type: "badge",
            description: "7-day streak = 'Reliable' badge. 30-day = 'Iron' badge. 90-day = 'Titanium' badge.",
        },
        frequency: "daily",
        targetAudience: ["escort"],
        retentionImpact: "high",
    },
    {
        id: "escort_review_received",
        name: "New Review Notification",
        trigger: {
            type: "push_notification",
            condition: "Broker leaves a review for escort",
            messageTemplate: "⭐ {broker_name} left you a {rating}-star review! See what they said.",
        },
        action: "View review + respond",
        reward: {
            type: "social_proof",
            description: "More reviews improve trust score and listing rank",
        },
        frequency: "event_driven",
        targetAudience: ["escort"],
        retentionImpact: "high",
    },
    {
        id: "escort_coverage_gap",
        name: "Coverage Gap Opportunity",
        trigger: {
            type: "push_notification",
            condition: "Critical coverage gap detected within 200km",
            messageTemplate: "🚨 No escorts available near {city}! Expand coverage to capture demand.",
        },
        action: "Expand operating radius or travel to gap zone",
        reward: {
            type: "lead_priority",
            description: "First escort in a gap zone gets exclusive leads for 48h",
        },
        frequency: "event_driven",
        targetAudience: ["escort"],
        retentionImpact: "medium",
    },

    // ── BROKER LOOPS ──
    {
        id: "broker_coverage_alert",
        name: "Route Coverage Change Alert",
        trigger: {
            type: "push_notification",
            condition: "Coverage score changes on saved route",
            messageTemplate: "⚠️ Coverage on {route_name} dropped to {score}%. {escorts_lost} escorts went offline.",
        },
        action: "View updated coverage + find alternatives",
        reward: {
            type: "data_unlock",
            description: "Real-time coverage intelligence prevents delays",
        },
        frequency: "event_driven",
        targetAudience: ["broker"],
        retentionImpact: "critical",
    },
    {
        id: "broker_corridor_heat",
        name: "Corridor Heat Weekly Digest",
        trigger: {
            type: "email",
            condition: "Every Friday 2:00 PM local time",
            messageTemplate: "This week: {hot_corridors} corridors heating up, {gaps} new coverage gaps. Plan ahead →",
        },
        action: "Review corridor heat map + pre-book escorts",
        reward: {
            type: "data_unlock",
            description: "Corridor intelligence for proactive planning",
        },
        frequency: "weekly",
        targetAudience: ["broker"],
        retentionImpact: "high",
    },
    {
        id: "broker_new_escorts",
        name: "New Escorts in Your Area",
        trigger: {
            type: "push_notification",
            condition: "New escort claims profile within broker's saved corridors",
            messageTemplate: "New verified escort in {city}! {name} — {rating}⭐, {completed_jobs} jobs completed.",
        },
        action: "View new escort profile",
        reward: {
            type: "data_unlock",
            description: "Stay ahead of supply changes",
        },
        frequency: "event_driven",
        targetAudience: ["broker"],
        retentionImpact: "medium",
    },

    // ── CARRIER LOOPS ──
    {
        id: "carrier_permit_expiry",
        name: "Permit Expiry Warning",
        trigger: {
            type: "email",
            condition: "Oversize permit nearing expiration (14 days)",
            messageTemplate: "⚠️ Your {state} oversize permit expires in {days_left} days. Renew now to avoid fines.",
        },
        action: "Click to renew or find permit services",
        reward: {
            type: "data_unlock",
            description: "Avoid $5K-$25K oversize violation fines",
        },
        frequency: "event_driven",
        targetAudience: ["carrier"],
        retentionImpact: "high",
    },
    {
        id: "carrier_route_risk_change",
        name: "Route Risk Intelligence Update",
        trigger: {
            type: "push_notification",
            condition: "Corridor risk score changes significantly on carrier's active routes",
            messageTemplate: "📊 Risk on {corridor_name} changed from {old_grade} to {new_grade}. Check before dispatch.",
        },
        action: "View corridor risk breakdown",
        reward: {
            type: "data_unlock",
            description: "Prevent delays and compliance issues",
        },
        frequency: "event_driven",
        targetAudience: ["carrier"],
        retentionImpact: "high",
    },
];

// ── Streak System ──

export interface StreakState {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastCheckInAt: string;
    badges: StreakBadge[];
}

export interface StreakBadge {
    name: string;
    threshold: number;
    icon: string;
    unlockedAt?: string;
}

export const STREAK_BADGES: StreakBadge[] = [
    { name: "Getting Started", threshold: 3, icon: "🌱" },
    { name: "Reliable", threshold: 7, icon: "✅" },
    { name: "Consistent", threshold: 14, icon: "💪" },
    { name: "Iron", threshold: 30, icon: "🔩" },
    { name: "Titanium", threshold: 90, icon: "⚡" },
    { name: "Diamond", threshold: 365, icon: "💎" },
];

export function processCheckIn(state: StreakState, now: Date): StreakState {
    const lastCheckIn = new Date(state.lastCheckInAt);
    const hoursDiff = (now.getTime() - lastCheckIn.getTime()) / 3_600_000;

    let newStreak: number;
    if (hoursDiff <= 36) { // within 36h = continues streak
        newStreak = state.currentStreak + 1;
    } else {
        newStreak = 1; // streak broken
    }

    const newBadges = [...state.badges];
    for (const badge of STREAK_BADGES) {
        if (newStreak >= badge.threshold && !newBadges.find(b => b.name === badge.name)) {
            newBadges.push({ ...badge, unlockedAt: now.toISOString() });
        }
    }

    return {
        userId: state.userId,
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
        lastCheckInAt: now.toISOString(),
        badges: newBadges,
    };
}

// ── Notification Scheduling ──

export interface ScheduledNotification {
    habitLoopId: string;
    userId: string;
    channel: "push" | "email" | "sms";
    scheduledAt: string;
    message: string;
    status: "pending" | "sent" | "opened" | "acted";
}

export function getOptimalSendTime(countryCode: string, habitFrequency: string): string {
    // Returns HH:MM in local time
    switch (habitFrequency) {
        case "daily": return "08:00";
        case "weekly": return "09:00"; // Monday
        default: return "immediate";
    }
}

// ── Engagement Metrics ──

export interface EngagementMetrics {
    userId: string;
    dau: boolean; // daily active today
    wau: boolean; // weekly active this week
    mau: boolean; // monthly active this month
    sessionsThisWeek: number;
    avgSessionSeconds: number;
    lastActionAt: string;
    habitLoopsTriggered: number;
    habitLoopsActed: number;
    engagementScore: number; // 0-100
}

export function computeEngagementScore(metrics: EngagementMetrics): number {
    const frequency = Math.min(metrics.sessionsThisWeek / 7, 1) * 30;
    const depth = Math.min(metrics.avgSessionSeconds / 300, 1) * 25;
    const responsiveness = metrics.habitLoopsTriggered > 0
        ? (metrics.habitLoopsActed / metrics.habitLoopsTriggered) * 25
        : 0;
    const recency = metrics.dau ? 20 : metrics.wau ? 10 : 0;
    return Math.round(frequency + depth + responsiveness + recency);
}
