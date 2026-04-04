/**
 * Haul Command — Firebase Push Service
 * lib/notifications/push-service.ts
 *
 * Firebase FCM is the PRIMARY delivery channel.
 * SMS is surgical / fallback only.
 * This service reads device tokens and preferences from Supabase,
 * enforces dedup + throttle, then sends via Firebase Admin SDK.
 */

import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { createClient } from '@supabase/supabase-js';

// ─── Firebase Admin singleton ─────────────────────────────────────────────────
function getFirebaseApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

// ─── Supabase service-role client ─────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotifEventType =
  | 'new_load_match'
  | 'missed_opportunity'
  | 'load_cancelled'
  | 'route_alert'
  | 'rate_alert'
  | 'urgent_nearby_work'
  | 'repositioning_opportunity'
  | 'operator_match_found'
  | 'quote_received'
  | 'coverage_gap_alert'
  | 'urgent_replacement_needed'
  | 'load_status_update'
  | 'claim_reminder'
  | 'claim_verification_step'
  | 'claim_approved'
  | 'profile_incomplete'
  | 'profile_benefit_unlocked'
  | 'trust_score_changed'
  | 'nearby_market_active'
  | 'corridor_activity'
  | 'saved_corridor_update'
  | 'leaderboard_rank_change'
  | 'market_activated'
  | 'waitlist_position_update'
  | 'rules_update'
  | 'adgrid_slot_active'
  | 'data_product_expiring'
  | 'payment_confirmed'
  | 'payment_failed';

export interface PushPayload {
  userId: string;
  eventType: NotifEventType;
  title: string;
  body: string;
  deepLink?: string;
  dataPayload?: Record<string, string>;
  dedupKey?: string;
  dedupWindowHrs?: number;
  corridorSlug?: string;
  countryCode?: string;
  roleKey?: string;
}

export interface BroadcastPayload {
  /** Target a role group instead of a single user */
  roleKey?: string;
  countryCode?: string;
  corridorSlug?: string;
  eventType: NotifEventType;
  title: string;
  body: string;
  deepLink?: string;
  dataPayload?: Record<string, string>;
  dedupKey?: string;
  dedupWindowHrs?: number;
  limitTokens?: number;
}

interface SendResult {
  sent: number;
  failed: number;
  deduped: number;
  throttled: number;
}

// ─── Core: send push to a single user ─────────────────────────────────────────
export async function sendPushToUser(payload: PushPayload): Promise<SendResult> {
  const app = getFirebaseApp();
  const messaging = getMessaging(app);

  const result: SendResult = { sent: 0, failed: 0, deduped: 0, throttled: 0 };

  // 1. Dedup check
  const dedupKey = payload.dedupKey ?? `${payload.userId}:${payload.eventType}`;
  if (payload.dedupKey !== null) {
    const { data: isDup } = await supabase.rpc('hc_notif_is_duplicate', {
      p_user_id: payload.userId,
      p_dedup_key: dedupKey,
      p_window_hrs: payload.dedupWindowHrs ?? 24,
    });
    if (isDup) {
      result.deduped++;
      return result;
    }
  }

  // 2. Preferences check
  const { data: prefs } = await supabase
    .from('hc_notif_preferences')
    .select('push_enabled,max_push_per_day,quiet_hours_start,quiet_hours_end,timezone')
    .eq('user_id', payload.userId)
    .maybeSingle();

  if (prefs && !prefs.push_enabled) {
    await logEvent(payload.userId, payload, 'opted_out', null, dedupKey);
    return result;
  }

  // 3. Throttle check
  const { data: dayCount } = await supabase.rpc('hc_notif_daily_count', {
    p_user_id: payload.userId,
    p_channel: 'push',
  });
  const maxPerDay = prefs?.max_push_per_day ?? 12;
  if ((dayCount ?? 0) >= maxPerDay) {
    await logEvent(payload.userId, payload, 'throttled', null, dedupKey);
    result.throttled++;
    return result;
  }

  // 4. Quiet hours check (UTC-based)
  if (prefs?.quiet_hours_start && prefs?.quiet_hours_end) {
    const nowUtc = new Date();
    const hour = nowUtc.getUTCHours();
    const minute = nowUtc.getUTCMinutes();
    const nowMins = hour * 60 + minute;
    const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const inQuiet = startMins < endMins
      ? nowMins >= startMins && nowMins < endMins
      : nowMins >= startMins || nowMins < endMins;
    if (inQuiet) {
      // Queue for later — log as queued, scheduler will retry
      await logEvent(payload.userId, payload, 'queued', null, dedupKey);
      return result;
    }
  }

  // 5. Get device tokens
  const { data: tokens } = await supabase
    .from('hc_device_tokens')
    .select('id,token,platform')
    .eq('user_id', payload.userId)
    .eq('is_active', true);

  if (!tokens || tokens.length === 0) {
    await logEvent(payload.userId, payload, 'failed', null, dedupKey, 'no_device_tokens');
    result.failed++;
    return result;
  }

  // 6. Send via FCM multicast
  const fcmTokens = tokens.map(t => t.token);
  const message: MulticastMessage = {
    tokens: fcmTokens,
    notification: { title: payload.title, body: payload.body },
    data: {
      event_type: payload.eventType,
      deep_link: payload.deepLink ?? '',
      ...(payload.dataPayload ?? {}),
    },
    android: {
      priority: 'high',
      notification: { clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const resp = await messaging.sendEachForMulticast(message);

    // 7. Process per-token results
    for (let i = 0; i < resp.responses.length; i++) {
      const r = resp.responses[i];
      const tokenRow = tokens[i];
      if (r.success) {
        await logEvent(payload.userId, payload, 'sent', tokenRow.id, dedupKey, undefined, r.messageId);
        result.sent++;
      } else {
        // Deactivate stale tokens
        const code = r.error?.code;
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token') {
          await supabase
            .from('hc_device_tokens')
            .update({ is_active: false })
            .eq('id', tokenRow.id);
        }
        await logEvent(payload.userId, payload, 'failed', tokenRow.id, dedupKey, r.error?.message);
        result.failed++;
      }
    }
  } catch (err: any) {
    await logEvent(payload.userId, payload, 'failed', null, dedupKey, err.message);
    result.failed++;
  }

  return result;
}

// ─── Broadcast to a role/geo segment ──────────────────────────────────────────
export async function broadcastPush(payload: BroadcastPayload): Promise<SendResult> {
  const totals: SendResult = { sent: 0, failed: 0, deduped: 0, throttled: 0 };

  let q = supabase
    .from('hc_device_tokens')
    .select('user_id')
    .eq('is_active', true);

  if (payload.roleKey) q = q.eq('role_key', payload.roleKey);
  if (payload.countryCode) q = q.eq('country_code', payload.countryCode);
  q = q.limit(payload.limitTokens ?? 500);

  const { data: targets } = await q;
  const userIds = [...new Set((targets ?? []).map(t => t.user_id))];

  // Fire per-user — respects individual prefs, dedup, throttle
  const batch = userIds.map(uid =>
    sendPushToUser({
      userId: uid,
      eventType: payload.eventType,
      title: payload.title,
      body: payload.body,
      deepLink: payload.deepLink,
      dataPayload: payload.dataPayload,
      dedupKey: payload.dedupKey,
      dedupWindowHrs: payload.dedupWindowHrs,
      corridorSlug: payload.corridorSlug,
      countryCode: payload.countryCode,
      roleKey: payload.roleKey,
    })
  );

  const results = await Promise.allSettled(batch);
  for (const r of results) {
    if (r.status === 'fulfilled') {
      totals.sent += r.value.sent;
      totals.failed += r.value.failed;
      totals.deduped += r.value.deduped;
      totals.throttled += r.value.throttled;
    } else {
      totals.failed++;
    }
  }

  return totals;
}

// ─── Internal log helper ──────────────────────────────────────────────────────
async function logEvent(
  userId: string,
  payload: PushPayload | BroadcastPayload,
  status: string,
  deviceTokenId: string | null,
  dedupKey: string,
  failedReason?: string,
  firebaseMessageId?: string
) {
  await supabase.from('hc_notif_events').insert({
    user_id: userId,
    device_token_id: deviceTokenId,
    event_type: payload.eventType,
    channel: 'push',
    status,
    title: payload.title,
    body: payload.body,
    deep_link: payload.deepLink ?? null,
    data_payload: payload.dataPayload ?? {},
    role_key: payload.roleKey ?? null,
    country_code: (payload as any).countryCode ?? null,
    corridor_slug: (payload as any).corridorSlug ?? null,
    dedup_key: dedupKey,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    failed_reason: failedReason ?? null,
    firebase_message_id: firebaseMessageId ?? null,
  });
}
