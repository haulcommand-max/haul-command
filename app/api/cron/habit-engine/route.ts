import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cronGuard, supabaseAdmin, logCronRun, deadLetter } from '../_lib/cron-guard';
import { HABIT_LOOPS, processCheckIn, type StreakState, STREAK_BADGES } from '@/lib/engagement/habit-loop-engine';
import { sendPushToUser } from '@/lib/push-send';

// ── habit_engine_v1 ────────────────────────────────────────────────
// Runs daily at 08:00 UTC via Vercel Cron
// 1. Evaluates daily/weekly habit loops for each active operator
// 2. Processes availability streaks
// 3. Schedules notifications via push_queue + scheduled_notifications

export async function GET() {
    const guard = await cronGuard();
    if (guard) return guard;

    const startMs = Date.now();
    const sb = supabaseAdmin();
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    let totalSent = 0;
    let streaksUpdated = 0;

    try {
        // 1. Fetch active operators (logged in within 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: operators } = await sb
            .from('profiles')
            .select('id, role, availability_status, display_name')
            .gte('last_sign_in_at', thirtyDaysAgo)
            .limit(1000);

        if (!operators?.length) {
            await logCronRun('habit_engine_v1', startMs, 'success', {
                rows_affected: 0,
                metadata: { reason: 'no_active_operators' },
            });
            return NextResponse.json({ ok: true, sent: 0, streaks: 0 });
        }

        // 2. Process daily habit loops
        const dailyLoops = HABIT_LOOPS.filter(h => h.frequency === 'daily');
        const weeklyLoops = HABIT_LOOPS.filter(h => h.frequency === 'weekly');
        const isMonday = now.getUTCDay() === 1;

        for (const op of operators) {
            const role = op.role as 'escort' | 'broker' | 'carrier';

            // Find applicable daily loops for this role
            const applicable = dailyLoops.filter(h => h.targetAudience.includes(role));
            if (isMonday) {
                applicable.push(...weeklyLoops.filter(h => h.targetAudience.includes(role)));
            }

            for (const loop of applicable) {
                // Dedup: check if already sent today
                const { count } = await sb
                    .from('scheduled_notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', op.id)
                    .eq('habit_loop_id', loop.id)
                    .gte('created_at', `${todayKey}T00:00:00Z`);

                if ((count ?? 0) > 0) continue;

                // Evaluate trigger condition
                const shouldFire = await evaluateTrigger(sb, loop.id, op);
                if (!shouldFire) continue;

                // Fill template
                const message = loop.trigger.messageTemplate
                    .replace('{streak_days}', '0')
                    .replace('{views}', '—')
                    .replace('{leads}', '—')
                    .replace('{rank}', '—')
                    .replace('{city}', 'your area');

                // Write to scheduled_notifications
                await sb.from('scheduled_notifications').insert({
                    user_id: op.id,
                    habit_loop_id: loop.id,
                    channel: loop.trigger.type === 'email' ? 'email' : 'push',
                    scheduled_at: now.toISOString(),
                    message,
                    status: 'pending',
                });

                // Send push immediately for push-type triggers
                if (loop.trigger.type === 'push_notification') {
                    try {
                        await sendPushToUser(op.id, {
                            title: loop.name,
                            body: message,
                            url: '/app',
                            meta: { habit_loop_id: loop.id },
                        });
                        await sb.from('scheduled_notifications')
                            .update({ status: 'sent' })
                            .eq('user_id', op.id)
                            .eq('habit_loop_id', loop.id)
                            .gte('created_at', `${todayKey}T00:00:00Z`);
                    } catch { /* push failure is non-fatal */ }
                }

                totalSent++;
            }

            // 3. Process availability streaks for escorts
            if (role === 'escort') {
                const { data: streakRow } = await sb
                    .from('operator_streaks')
                    .select('*')
                    .eq('user_id', op.id)
                    .maybeSingle();

                const isAvailable = op.availability_status === 'available';

                if (isAvailable) {
                    const currentState: StreakState = streakRow ? {
                        userId: op.id,
                        currentStreak: streakRow.current_streak,
                        longestStreak: streakRow.longest_streak,
                        lastCheckInAt: streakRow.last_check_in ?? new Date(0).toISOString(),
                        badges: streakRow.badges ?? [],
                    } : {
                        userId: op.id,
                        currentStreak: 0,
                        longestStreak: 0,
                        lastCheckInAt: new Date(0).toISOString(),
                        badges: [],
                    };

                    const updated = processCheckIn(currentState, now);

                    await sb.from('operator_streaks').upsert({
                        user_id: op.id,
                        streak_type: 'availability',
                        current_streak: updated.currentStreak,
                        longest_streak: updated.longestStreak,
                        last_check_in: now.toISOString(),
                        badges: updated.badges,
                        updated_at: now.toISOString(),
                    }, { onConflict: 'user_id' });

                    streaksUpdated++;

                    // Notify on badge unlock
                    const newBadges = updated.badges.filter(b =>
                        b.unlockedAt === now.toISOString()
                    );
                    for (const badge of newBadges) {
                        await sb.from('notification_events').insert({
                            user_id: op.id,
                            type: 'streak_badge',
                            title: `${badge.icon} ${badge.name} Badge Unlocked!`,
                            body: `You've maintained a ${badge.threshold}-day availability streak.`,
                            data: { badge_name: badge.name, streak: updated.currentStreak },
                        });
                    }
                }
            }
        }

        await logCronRun('habit_engine_v1', startMs, 'success', {
            rows_affected: totalSent + streaksUpdated,
            metadata: {
                operators_scanned: operators.length,
                notifications_sent: totalSent,
                streaks_updated: streaksUpdated,
            },
        });

        return NextResponse.json({
            ok: true,
            operators_scanned: operators.length,
            notifications_sent: totalSent,
            streaks_updated: streaksUpdated,
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await deadLetter('habit_engine_v1', { date: todayKey }, msg);
        await logCronRun('habit_engine_v1', startMs, 'failed', { error_message: msg });
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}

// ── Trigger evaluation ──────────────────────────────────────────────────

async function evaluateTrigger(
    sb: ReturnType<typeof supabaseAdmin>,
    loopId: string,
    operator: { id: string; role: string; availability_status: string }
): Promise<boolean> {
    switch (loopId) {
        case 'escort_daily_availability':
            // Fire if escort hasn't toggled availability today
            return operator.availability_status !== 'available';

        case 'escort_streak':
            // Always fire for available escorts (streak check-in reminder)
            return operator.availability_status === 'available';

        case 'escort_weekly_stats':
            // Fire for all escorts on Monday
            return true;

        case 'broker_corridor_heat':
            // Fire for all brokers on Friday
            return new Date().getUTCDay() === 5;

        default:
            // Event-driven loops handled elsewhere (match engine, review creation, etc.)
            return false;
    }
}
