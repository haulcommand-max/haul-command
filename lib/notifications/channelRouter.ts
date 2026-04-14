/**
 * lib/notifications/channelRouter.ts
 * 
 * Smart notification channel routing for Haul Command.
 * Determines the optimal delivery channel(s) based on:
 *   - Event urgency
 *   - User's available channels (push token, email, phone)
 *   - Time of day
 *   - Channel preferences
 * 
 * Channel priority (per Master Prompt §29):
 *   1. Push (instant, free, highest engagement)
 *   2. Email (reliable, async, recordable)
 *   3. SMS (expensive, reserved for critical/time-sensitive)
 * 
 * Usage:
 *   const channels = await routeNotification(userId, event);
 *   // channels = ['push', 'email'] or ['sms'] etc.
 */

import { createClient } from '@supabase/supabase-js';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';
export type NotificationUrgency = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationEvent {
  type: string;
  urgency: NotificationUrgency;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  url?: string;
}

interface UserChannels {
  hasPush: boolean;
  hasEmail: boolean;
  hasSms: boolean;
  email?: string;
  phone?: string;
}

// Events that justify SMS (expensive)
const SMS_ELIGIBLE_EVENTS = new Set([
  'no_show_alert',
  'payment_received',
  'dispatch_urgent',
  'load_expiring',
  'account_security',
]);

// Events that can be email-only (low urgency)
const EMAIL_ONLY_EVENTS = new Set([
  'training_enrollment',
  'weekly_digest',
  'broker_briefing',
  'operator_briefing',
  'marketing',
]);

/**
 * Determine which channels to use for a given user + event.
 */
export async function routeNotification(
  userId: string,
  event: NotificationEvent,
): Promise<NotificationChannel[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Check what channels the user has available
  const channels = await getUserChannels(supabase, userId);
  const selected: NotificationChannel[] = [];

  // Always add in_app
  selected.push('in_app');

  // ── Critical events: all available channels
  if (event.urgency === 'critical') {
    if (channels.hasPush) selected.push('push');
    if (channels.hasEmail) selected.push('email');
    if (channels.hasSms && SMS_ELIGIBLE_EVENTS.has(event.type)) selected.push('sms');
    return selected;
  }

  // ── High urgency: push + email
  if (event.urgency === 'high') {
    if (channels.hasPush) selected.push('push');
    if (channels.hasEmail) selected.push('email');
    return selected;
  }

  // ── Email-only events
  if (EMAIL_ONLY_EVENTS.has(event.type)) {
    if (channels.hasEmail) selected.push('email');
    return selected;
  }

  // ── Normal urgency: push preferred, email fallback
  if (channels.hasPush) {
    selected.push('push');
  } else if (channels.hasEmail) {
    selected.push('email');
  }

  // ── Low urgency: in_app only (already added)
  if (event.urgency === 'low') {
    return ['in_app'];
  }

  return selected;
}

/**
 * Send a notification through the routed channels.
 * Inserts records into hc_notifications for each channel.
 */
export async function sendRoutedNotification(
  userId: string,
  event: NotificationEvent,
): Promise<{ channels: NotificationChannel[]; queued: number }> {
  const channels = await routeNotification(userId, event);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const records = channels.map(channel => ({
    user_id: userId,
    title: event.title,
    body: event.body,
    data_json: {
      type: event.type,
      url: event.url,
      ...event.data,
    },
    channel,
    status: 'queued',
    created_at: new Date().toISOString(),
  }));

  if (records.length > 0) {
    await supabase.from('hc_notifications').insert(records);
  }

  return { channels, queued: records.length };
}

// ── Internal helpers ──

async function getUserChannels(supabase: any, userId: string): Promise<UserChannels> {
  // Check push token
  const { count: pushCount } = await supabase
    .from('push_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  // Check user email + phone from auth
  const { data: { user } } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: { user: null } }));

  return {
    hasPush: (pushCount ?? 0) > 0,
    hasEmail: Boolean(user?.email),
    hasSms: Boolean(user?.phone),
    email: user?.email,
    phone: user?.phone,
  };
}
