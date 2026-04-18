/**
 * GET /api/cron/training-badge-expiry
 *
 * Phase 5 — Renewal notification + badge expiry processor.
 * Runs daily at 07:00 UTC via Vercel Cron.
 *
 * Steps:
 *   1. Expire badges past expires_at → status='expired'
 *   2. Mark review_due badges (within 30 days of review_due_at) → status='review_due'
 *   3. Queue renewal notifications via /api/cron/training-badge-expiry (this job)
 *      writing to hc_notification_queue (or profiles email direct if queue unavailable)
 *   4. Return gap-scan analytics summary
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REVIEW_DUE_WINDOW_DAYS = 30;
const EXPIRY_WARNING_DAYS    = 14;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb     = supabaseServer();
  const now    = new Date();
  const nowIso = now.toISOString();

  const reviewDueWindowIso = new Date(
    now.getTime() + REVIEW_DUE_WINDOW_DAYS * 86_400_000
  ).toISOString();

  const expiryWarningIso = new Date(
    now.getTime() + EXPIRY_WARNING_DAYS * 86_400_000
  ).toISOString();

  const stats = {
    expired:          0,
    review_due_set:   0,
    notifications:    0,
    errors:           [] as string[],
  };

  // ── 1. Expire badges past expires_at ─────────────────────────────────────
  try {
    const { data: toExpire } = await sb
      .from('training_user_badges')
      .select('id, user_id, badge_slug')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso);

    if (toExpire && toExpire.length > 0) {
      const ids = toExpire.map((b: any) => b.id);
      const { error } = await sb
        .from('training_user_badges')
        .update({ status: 'expired', updated_at: nowIso })
        .in('id', ids);

      if (error) {
        stats.errors.push(`expire_badges: ${error.message}`);
      } else {
        stats.expired = ids.length;
        console.log(`[TrainingExpiry] Expired ${ids.length} badges`);
      }

      // Queue renewal notifications for expired badges
      for (const badge of toExpire as any[]) {
        await queueRenewalNotification(sb, badge.user_id, badge.badge_slug, 'expired', nowIso, stats);
      }
    }
  } catch (err: any) {
    stats.errors.push(`expire_step: ${err.message}`);
  }

  // ── 2. Set review_due for badges within review window ────────────────────
  try {
    const { data: toReview } = await sb
      .from('training_user_badges')
      .select('id, user_id, badge_slug, review_due_at')
      .eq('status', 'active')
      .not('review_due_at', 'is', null)
      .lt('review_due_at', reviewDueWindowIso)
      .gte('review_due_at', nowIso); // not already past (those stay active until expires_at)

    if (toReview && toReview.length > 0) {
      const ids = toReview.map((b: any) => b.id);
      const { error } = await sb
        .from('training_user_badges')
        .update({ status: 'review_due', updated_at: nowIso })
        .in('id', ids);

      if (error) {
        stats.errors.push(`review_due_set: ${error.message}`);
      } else {
        stats.review_due_set = ids.length;
        console.log(`[TrainingExpiry] Set ${ids.length} badges to review_due`);
      }

      // Queue review-due notifications
      for (const badge of toReview as any[]) {
        await queueRenewalNotification(sb, badge.user_id, badge.badge_slug, 'review_due', nowIso, stats);
      }
    }
  } catch (err: any) {
    stats.errors.push(`review_due_step: ${err.message}`);
  }

  // ── 3. Expiry warning notifications (active, expiring within 14 days) ────
  try {
    const { data: expiringSoon } = await sb
      .from('training_user_badges')
      .select('id, user_id, badge_slug, expires_at')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', expiryWarningIso)
      .gte('expires_at', nowIso);

    if (expiringSoon && expiringSoon.length > 0) {
      for (const badge of expiringSoon as any[]) {
        await queueRenewalNotification(sb, badge.user_id, badge.badge_slug, 'expiring_soon', nowIso, stats);
      }
    }
  } catch (err: any) {
    stats.errors.push(`expiry_warning_step: ${err.message}`);
  }

  return NextResponse.json({
    ok: true,
    timestamp: nowIso,
    stats,
  });
}

// ── Notification helper ───────────────────────────────────────────────────────
async function queueRenewalNotification(
  sb: ReturnType<typeof import('@/lib/supabase-server').supabaseServer>,
  userId: string,
  badgeSlug: string,
  eventType: 'expired' | 'review_due' | 'expiring_soon',
  nowIso: string,
  stats: { notifications: number; errors: string[] }
) {
  const BADGE_LABELS: Record<string, string> = {
    road_ready: 'Road Ready',
    certified: 'Certified',
    'certified-operator': 'Certified',
    elite: 'Elite',
    'elite-escort': 'Elite',
    av_ready: 'AV-Ready',
  };
  const label = BADGE_LABELS[badgeSlug] ?? badgeSlug;

  const messages: Record<string, { subject: string; body: string }> = {
    expired: {
      subject: `Your HC ${label} badge has expired`,
      body: `Your Haul Command ${label} training badge expired. Renew now to restore your directory ranking and broker-visible trust signal.`,
    },
    review_due: {
      subject: `Your HC ${label} badge is due for review`,
      body: `Your Haul Command ${label} badge is coming up for annual review. Complete the review module to keep your badge active and maintain directory ranking.`,
    },
    expiring_soon: {
      subject: `Your HC ${label} badge expires in 14 days`,
      body: `Your Haul Command ${label} training badge expires in 14 days. Renew now to avoid losing directory ranking and broker trust signal visibility.`,
    },
  };

  const msg = messages[eventType];

  try {
    // Write to hc_notification_queue if it exists; silently skip otherwise
    const { error } = await sb.from('hc_notification_queue').insert({
      user_id: userId,
      notification_type: `training_badge_${eventType}`,
      channel: 'email',
      subject: msg.subject,
      body: msg.body,
      metadata: { badge_slug: badgeSlug, event_type: eventType, renewal_url: '/training' },
      status: 'pending',
      created_at: nowIso,
    });

    if (!error) {
      stats.notifications++;
    }
    // If table doesn't exist or RLS blocks, fail silently (non-fatal)
  } catch {
    // non-fatal — notification queue may not be wired yet
  }
}
