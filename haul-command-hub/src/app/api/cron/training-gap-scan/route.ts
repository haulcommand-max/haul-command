/**
 * GET /api/cron/training-gap-scan
 *
 * Phase 5 — Analytics gap-scan for training penetration.
 * Runs weekly (Monday 06:00 UTC) via Vercel Cron.
 *
 * Scans claimed operators with no active training badge and writes
 * a summary row to hc_training_gap_analytics for dashboard tracking.
 * Upserts per week so the row is idempotent.
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb  = supabaseServer();
  const now = new Date().toISOString();

  // ISO week key e.g. "2026-W15"
  const weekKey = (() => {
    const d = new Date();
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
    const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  })();

  try {
    // Total claimed operators
    const { count: totalClaimed } = await sb
      .from('hc_global_operators')
      .select('id', { count: 'exact', head: true })
      .not('user_id', 'is', null);

    // Operators with any active badge
    const { count: withBadge } = await sb
      .from('hc_global_operators')
      .select('id', { count: 'exact', head: true })
      .not('user_id', 'is', null)
      .in(
        'user_id',
        // sub-select via a raw query isn't available in the JS client — use RPC
        // We'll approximate by counting from training_user_badges
        []
      );

    // Use direct count from training_user_badges for operators who have active badges
    const { count: activeBadgeUsers } = await sb
      .from('training_user_badges')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Badge distribution breakdown
    const { data: badgeDist } = await sb
      .from('training_user_badges')
      .select('badge_slug')
      .eq('status', 'active');

    const dist: Record<string, number> = {};
    for (const row of (badgeDist as any[]) ?? []) {
      dist[row.badge_slug] = (dist[row.badge_slug] ?? 0) + 1;
    }

    // Count expired this week
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { count: expiredThisWeek } = await sb
      .from('training_user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'expired')
      .gte('updated_at', weekAgo);

    const { count: reviewDueCount } = await sb
      .from('training_user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'review_due');

    const summary = {
      week_key:             weekKey,
      total_claimed:        totalClaimed ?? 0,
      active_badge_users:   activeBadgeUsers ?? 0,
      gap_count:            Math.max(0, (totalClaimed ?? 0) - (activeBadgeUsers ?? 0)),
      badge_distribution:   dist,
      expired_this_week:    expiredThisWeek ?? 0,
      review_due_count:     reviewDueCount ?? 0,
      scanned_at:           now,
    };

    // Upsert into analytics table (non-fatal if table doesn't exist yet)
    await sb.from('hc_training_gap_analytics').upsert(
      { ...summary },
      { onConflict: 'week_key', ignoreDuplicates: false }
    );

    console.log(`[TrainingGapScan] ${weekKey}:`, JSON.stringify(summary));

    return NextResponse.json({ ok: true, week_key: weekKey, summary });
  } catch (err: any) {
    console.error('[TrainingGapScan] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
