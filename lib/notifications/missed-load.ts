/**
 * MissedLoadNotification — Push notification trigger for missed loads.
 *
 * P2: Re-engagement — notifies operators when loads on their corridors
 * expire without being accepted. Drives urgency and return visits.
 *
 * Server-side function called by cron/trigger when a load expires.
 */

import { createClient } from '@/lib/supabase/server';

interface MissedLoadPayload {
  corridor_id: string;
  corridor_label: string;
  origin_state: string;
  destination_state: string;
  rate_usd: number;
  expired_at: string;
  load_id: string;
}

interface NotificationTarget {
  user_id: string;
  push_token?: string;
  email?: string;
  phone?: string;
  availability_status?: string;
  claim_state?: string;
}

/**
 * Find operators who should be notified about a missed load.
 * Criteria: operator has the corridor in their service areas.
 * We include offline and unverified operators for re-engagement.
 */
export async function findMissedLoadTargets(corridorId: string): Promise<NotificationTarget[]> {
  const supabase = createClient();

  const { data: operators } = await supabase
    .from('profiles')
    .select('id, push_token, email, phone, availability_status, claim_state')
    .contains('service_corridors', [corridorId])
    .not('push_token', 'is', null)
    .limit(100);

  return (operators ?? []).map(op => ({
    user_id: op.id,
    push_token: op.push_token,
    email: op.email,
    phone: op.phone,
    availability_status: op.availability_status,
    claim_state: op.claim_state,
  }));
}

/**
 * Build push notification payload for a missed load based on user state.
 */
export function buildMissedLoadPush(load: MissedLoadPayload, target: NotificationTarget) {
  const rateFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(load.rate_usd);

  let body = `${load.origin_state} → ${load.destination_state} expired without coverage. Stay available to catch the next one.`;
  let actionUrl = `/loads?corridor=${load.corridor_id}`;

  if (target.claim_state !== 'dispatch_eligible' && target.claim_state !== 'premium_paid' && target.claim_state !== 'premium_trial') {
    body = `A ${rateFormatted} load just expired on your corridor. Complete your identity verification to start receiving load offers!`;
    actionUrl = `/settings/documents`;
  } else if (target.availability_status !== 'available') {
    body = `You just missed a ${rateFormatted} load. Toggle your status to available to catch the next one.`;
    actionUrl = `/profile/availability`;
  }

  return {
    title: `💰 Missed ${rateFormatted} load on ${load.corridor_label}`,
    body,
    data: {
      type: 'missed_load',
      load_id: load.load_id,
      corridor_id: load.corridor_id,
      url: actionUrl,
    },
    tag: `missed-load-${load.corridor_id}`,
    // Group by corridor to avoid notification spam
    collapseKey: `missed-load-${load.corridor_id}`,
  };
}

/**
 * Send missed load notifications to all relevant operators.
 * Called from API route or cron when a load expires.
 */
export async function sendMissedLoadNotifications(load: MissedLoadPayload): Promise<{
  sent: number;
  failed: number;
}> {
  const targets = await findMissedLoadTargets(load.corridor_id);
  let sent = 0;
  let failed = 0;

  // Use existing push infrastructure
  for (const target of targets) {
    try {
      if (target.push_token) {
        const push = buildMissedLoadPush(load, target);
        // Send via existing push service (FCM/APNs)
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            token: target.push_token,
            ...push,
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  // Log notification event
  try {
    const supabase = createClient();
    await supabase.from('notification_log').insert({
      event_type: 'missed_load',
      payload: load,
      targets_count: targets.length,
      sent_count: sent,
      failed_count: failed,
    });
  } catch (err) {
    // silent
  }

  return { sent, failed };
}

/**
 * API handler for missed load notifications.
 * POST /api/notifications/missed-load
 */
export async function handleMissedLoadAPI(req: Request): Promise<Response> {
  try {
    const body = await req.json() as MissedLoadPayload;

    if (!body.corridor_id || !body.load_id) {
      return new Response(JSON.stringify({ error: 'Missing corridor_id or load_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await sendMissedLoadNotifications(body);

    return new Response(JSON.stringify({
      ok: true,
      ...result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[missed-load-notification] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
