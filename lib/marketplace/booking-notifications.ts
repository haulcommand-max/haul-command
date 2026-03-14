// lib/marketplace/booking-notifications.ts
//
// P0 Gap #4: Offer notifications (push first, SMS fallback)
// P0 Gap #7: Review request after completion
// Uses push-send.ts (server-side FCM + web push) as primary channel.
// ============================================================

import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import { sendPushToUser, type PushPayload } from '@/lib/push-send';
import { isEnabled } from '@/lib/feature-flags';

// ── Helper: send push to multiple users ──

async function pushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(
    userIds.map(uid => sendPushToUser(uid, payload).catch(() => {}))
  );
}

// ── GAP #4: Notify operators when offers are sent ──

export async function notifyOffersCreated(params: {
  request_id: string;
  operator_ids: string[];
  rate_offered: number | null;
  currency: string;
  timeout_seconds: number;
  country_code: string;
  load_summary: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 1. Push notification to all target operators
  await pushToUsers(params.operator_ids, {
    title: '🚛 New escort job available',
    body: `${params.load_summary} — ${params.rate_offered ? `$${params.rate_offered} ${params.currency}` : 'Rate TBD'} — Respond in ${Math.round(params.timeout_seconds / 60)} min`,
    url: `/offers?request=${params.request_id}`,
    meta: { type: 'offer', request_id: params.request_id },
  });

  // 2. SMS fallback via Telnyx (operators without push tokens)
  if (isEnabled('TELNYX')) {
    try {
      const { sendSMS } = await import('@/lib/comms/telnyx');

      // Get operators without push tokens
      const { data: allOps } = await supabase
        .from('profiles')
        .select('id, phone')
        .in('id', params.operator_ids);

      const { data: pushOps } = await supabase
        .from('push_tokens')
        .select('profile_id')
        .in('profile_id', params.operator_ids)
        .eq('enabled', true);

      const pushUserIds = new Set((pushOps ?? []).map((p: any) => p.profile_id));
      const smsTargets = (allOps ?? []).filter((o: any) => !pushUserIds.has(o.id) && o.phone);

      for (const target of smsTargets.slice(0, 10)) {
        await sendSMS({
          to: target.phone,
          from: process.env.TELNYX_FROM_NUMBER || '',
          text: `Haul Command: New escort job — ${params.load_summary}. ${params.rate_offered ? `$${params.rate_offered}` : 'Rate TBD'}. Open app to respond.`,
        }).catch(() => {});
      }
    } catch {
      // SMS is fallback — don't block on failure
    }
  }

  // 3. Store notification records for in-app inbox
  const notifInserts = params.operator_ids.map(op_id => ({
    user_id: op_id,
    type: 'offer_sent',
    title: 'New escort job available',
    body: params.load_summary,
    data: { request_id: params.request_id, rate: params.rate_offered, currency: params.currency },
    read: false,
  }));

  await supabase.from('notifications').insert(notifInserts);
}

// ── Notify broker + escorts when booking is confirmed ──

export async function notifyBookingConfirmed(params: {
  job_id: string;
  broker_id: string;
  escort_ids: string[];
  total_rate: number;
  currency: string;
  payment_intent_id?: string;
}): Promise<void> {
  // Push to broker
  await sendPushToUser(params.broker_id, {
    title: '✅ Escorts assigned — booking confirmed',
    body: `${params.escort_ids.length} escort(s) confirmed for $${params.total_rate} ${params.currency}`,
    url: `/jobs/${params.job_id}`,
    meta: { type: 'booking_confirmed', job_id: params.job_id },
  }).catch(() => {});

  // Push to assigned escorts
  await pushToUsers(params.escort_ids, {
    title: '🎉 You\'re booked!',
    body: `Job ${params.job_id} confirmed. Check app for details.`,
    url: `/jobs/${params.job_id}`,
    meta: { type: 'booking_assigned', job_id: params.job_id },
  });
}

// ── GAP #7: Request reviews after completion ──

export async function requestReviews(params: {
  job_id: string;
  broker_id: string;
  escort_ids: string[];
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Create review records: broker reviews each escort, each escort reviews broker
  const reviewInserts: any[] = [];

  for (const escort_id of params.escort_ids) {
    reviewInserts.push({
      job_id: params.job_id,
      reviewer_id: params.broker_id,
      reviewer_role: 'broker',
      reviewee_id: escort_id,
      status: 'sent',
      request_sent_at: new Date().toISOString(),
    });
    reviewInserts.push({
      job_id: params.job_id,
      reviewer_id: escort_id,
      reviewer_role: 'operator',
      reviewee_id: params.broker_id,
      status: 'sent',
      request_sent_at: new Date().toISOString(),
    });
  }

  await supabase.from('job_reviews').insert(reviewInserts);

  // Mark job review requested
  await supabase
    .from('jobs')
    .update({ review_requested_at: new Date().toISOString() })
    .eq('job_id', params.job_id);

  // Push notification to all parties
  const allUserIds = [params.broker_id, ...params.escort_ids];
  await pushToUsers(allUserIds, {
    title: '⭐ How did it go?',
    body: 'Leave a review for your recent escort job',
    url: `/reviews?job=${params.job_id}`,
    meta: { type: 'review_request', job_id: params.job_id },
  });
}

// ── Notify on job completion ──

export async function notifyJobCompleted(params: {
  job_id: string;
  broker_id: string;
  escort_ids: string[];
  payment_captured: boolean;
}): Promise<void> {
  // Broker gets completion + payment notification
  await sendPushToUser(params.broker_id, {
    title: '✅ Job completed',
    body: params.payment_captured
      ? 'Payment has been processed. A review request will follow.'
      : 'Job marked complete. Payment processing.',
    url: `/jobs/${params.job_id}`,
    meta: { type: 'job_completed', job_id: params.job_id },
  }).catch(() => {});

  // Escorts get payout-ready notification
  await pushToUsers(params.escort_ids, {
    title: '💰 Job completed — payout processing',
    body: 'Great work! Your payout is being prepared.',
    url: `/jobs/${params.job_id}`,
    meta: { type: 'job_completed', job_id: params.job_id },
  });
}
