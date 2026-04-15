/**
 * app/api/next-moves/push-batch/route.ts
 * ══════════════════════════════════════════════════════════════
 * POST /api/next-moves/push-batch
 *
 * Scheduled batch push trigger for the Next Moves Engine.
 * Called by Vercel Cron (or Make.com webhook) on a schedule.
 *
 * Cron schedule: daily at 9:00 AM UTC
 * Add to vercel.json: { "crons": [{ "path": "/api/next-moves/push-batch", "schedule": "0 9 * * *" }] }
 *
 * Algorithm:
 * 1. Fetch all operators who haven't been active in 3+ days
 * 2. For each user, collect their signals (profile state, loads nearby)
 * 3. Run resolveNextMoves() to find their best push-eligible move
 * 4. Fire sendNativePush() with the move's pushTitle + pushBody
 * 5. Log to push_delivery_log
 *
 * Hard limits:
 * - Max 200 users per batch (Vercel function timeout safety)
 * - Only pushes 'critical' or 'high' urgency moves
 * - Never re-pushes the same move type within 24h (dedup via delivery log)
 * ══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { resolveNextMoves, getSchedulablePushMoves } from '@/lib/next-moves-engine';
import { sendNativePush } from '@/lib/push-send';

export const dynamic = 'force-dynamic';

// Cron secret — must match CRON_SECRET env var
function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = getSupabaseAdmin();
  const since3d = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // 1. Fetch inactive operators with push tokens
  const { data: candidates, error } = await svc
    .from('listings')
    .select(`
      claimed_by,
      is_claimed,
      completion_pct,
      has_certifications,
      role,
      state_code,
      last_active_at
    `)
    .eq('is_claimed', true)
    .lt('last_active_at', since3d)
    .not('claimed_by', 'is', null)
    .limit(200);

  if (error || !candidates?.length) {
    return NextResponse.json({ pushed: 0, reason: 'No eligible candidates' });
  }

  let pushed = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const userId = candidate.claimed_by;
    if (!userId) continue;

    // 2. Check dedup — did we push this user in last 24h?
    const { count: recentPush } = await svc
      .from('push_delivery_log')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .gte('created_at', since24h);

    if ((recentPush ?? 0) > 0) {
      skipped++;
      continue;
    }

    // 3. Get loads nearby for signal
    const { count: loadsNearby } = await svc
      .from('loads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .or(`origin_state.eq.${candidate.state_code},destination_state.eq.${candidate.state_code}`);

    // 4. Resolve moves for this user
    const pushableMoves = getSchedulablePushMoves({
      role: candidate.role ?? 'escort_operator',
      isAuthenticated: true,
      hasClaim: candidate.is_claimed,
      profileComplete: (candidate.completion_pct ?? 0) >= 90,
      profileCompletionPct: candidate.completion_pct ?? 0,
      hasCertifications: candidate.has_certifications ?? false,
      loadsNearby: loadsNearby ?? 0,
      detectedState: candidate.state_code,
      daysSinceLastVisit: Math.floor(
        (Date.now() - new Date(candidate.last_active_at ?? 0).getTime()) / (1000 * 60 * 60 * 24)
      ),
    });

    if (!pushableMoves.length) { skipped++; continue; }

    const topMove = pushableMoves[0];

    // 5. Send push
    try {
      const result = await sendNativePush(userId, {
        title: topMove.pushTitle!,
        body: topMove.pushBody!,
        url: `https://www.haulcommand.com${topMove.href}`,
        priority: topMove.urgency === 'critical' ? 'urgent' : 'high',
        meta: {
          move_id: topMove.id,
          move_trigger: topMove.trigger,
        },
      });

      if (result.sent > 0) pushed++;
    } catch (err) {
      console.warn(`[next-moves-push] Failed for user ${userId}:`, err);
    }
  }

  return NextResponse.json({
    pushed,
    skipped,
    total: candidates.length,
    computed_at: new Date().toISOString(),
  });
}
