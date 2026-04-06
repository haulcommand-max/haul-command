/**
 * /api/push/available-now-alert
 *
 * Called by: POST /api/available-now (fire-and-forget after broadcast upsert)
 *            OR Supabase Database Webhook on hc_available_now INSERT
 *
 * What it does:
 *   1. Accepts a new operator broadcast (partial hc_available_now row)
 *   2. Finds broker users who have saved searches overlapping the operator's
 *      country / region / service type (from hc_saved_searches)
 *   3. For each match, fires a targeted FCM push via push-service
 *      — dedup, throttle, quiet-hours all respected automatically
 *
 * Auth: service-role key (internal only, no public access)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/notifications/push-service';

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface AvailableNowRow {
  id?: string;
  operator_id?: string;
  operator_name?: string;
  business_name?: string;
  country_code: string;
  region_code?: string;
  city?: string;
  service_types?: string[];
  vehicle_type?: string;
  trust_score?: number;
  rate_per_km?: number;
  currency?: string;
  corridor_slugs?: string[];
  available_until?: string;
  lat?: number;
  lng?: number;
}

interface SavedSearch {
  user_id: string;
  country_code?: string;
  region_code?: string;
  corridor_slugs?: string[];
  service_types?: string[];
  notify_push?: boolean;
}

const SERVICE_LABEL: Record<string, string> = {
  pilot_car: 'Pilot Car',
  escort_truck: 'Escort Truck',
  height_pole: 'Height Pole',
  wide_load: 'Wide Load',
  chase_vehicle: 'Chase Vehicle',
  oversize: 'Oversize Escort',
};

// ── Auth guard ────────────────────────────────────────────────────────────────
function authorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const secret = process.env.SUPABASE_WEBHOOK_SECRET ?? '';
  return auth === `Bearer ${svcKey}` || auth === `Bearer ${secret}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { record?: unknown; broadcast?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawOp = (body.record ?? body.broadcast) as AvailableNowRow | undefined;
  if (!rawOp?.country_code) {
    return NextResponse.json({ error: 'country_code required' }, { status: 400 });
  }

  const op: AvailableNowRow = rawOp;

  // ── Find matching broker saved searches ───────────────────────────────────
  const matched = await findMatchingBrokers(op);
  if (matched.length === 0) {
    return NextResponse.json({ sent: 0, matched: 0, message: 'No matching broker searches' });
  }

  // ── Build notification copy ───────────────────────────────────────────────
  const opName = op.operator_name ?? op.business_name ?? 'An operator';
  const location = [op.city, op.region_code, op.country_code].filter(Boolean).join(', ');
  const svcTypes = op.service_types ?? (op.vehicle_type ? [op.vehicle_type] : ['escort']);
  const svcLabel = formatService(svcTypes);
  const rateSnip = op.rate_per_km ? ` · ${op.currency ?? 'USD'} ${op.rate_per_km}/km` : '';

  const title = `🟢 ${svcLabel} Available Now`;
  const pushBody = `${opName} is broadcasting near ${location}${rateSnip}`;

  // ── Fire FCM to each matched broker ──────────────────────────────────────
  const results = await Promise.allSettled(
    matched.map(b =>
      sendPushToUser({
        userId: b.user_id,
        eventType: 'operator_match_found',
        title,
        body: pushBody,
        deepLink: '/available-now',
        dataPayload: {
          operator_id: op.operator_id ?? '',
          country_code: op.country_code,
          region_code: op.region_code ?? '',
          available_until: op.available_until ?? '',
        },
        // Dedup: broker only gets one alert per operator per 8h window
        dedupKey: `available_now:${op.operator_id ?? op.id ?? 'unknown'}:${b.user_id}`,
        dedupWindowHrs: 8,
        countryCode: op.country_code,
        corridorSlug: op.corridor_slugs?.[0],
        roleKey: 'broker',
      })
    )
  );

  const sent = results.filter(
    r => r.status === 'fulfilled' && (r.value as { sent: number }).sent > 0
  ).length;
  const failed = results.filter(r => r.status === 'rejected').length;

  // ── Audit log (fire-and-forget, non-blocking) ─────────────────────────────
  void Promise.resolve(supa.from('hc_notif_events').insert({
    user_id: op.operator_id ?? null,
    event_type: 'operator_match_found',
    channel: 'push',
    status: 'broadcast_complete',
    title,
    body: pushBody,
    deep_link: '/available-now',
    data_payload: { matched_brokers: matched.length, sent, failed, country_code: op.country_code },
    dedup_key: `available_now_dispatch:${op.operator_id ?? op.id ?? 'unknown'}`,
    sent_at: new Date().toISOString(),
  })).catch(() => undefined);

  return NextResponse.json({ ok: true, matched_brokers: matched.length, sent, failed });
}

// ── Match logic ────────────────────────────────────────────────────────────────
async function findMatchingBrokers(op: AvailableNowRow): Promise<SavedSearch[]> {
  const { data: searches } = await supa
    .from('hc_saved_searches')
    .select('user_id, country_code, region_code, corridor_slugs, service_types, notify_push')
    .eq('notify_push', true)
    .limit(500);

  if (!searches?.length) return [];

  const matches: SavedSearch[] = [];

  for (const s of searches as SavedSearch[]) {
    if (s.country_code && s.country_code !== op.country_code) continue;
    if (s.region_code && op.region_code && s.region_code !== op.region_code) continue;
    if (
      (s.service_types?.length ?? 0) > 0 &&
      (op.service_types?.length ?? 0) > 0 &&
      !s.service_types!.some(st => op.service_types!.includes(st))
    ) continue;
    if (
      (s.corridor_slugs?.length ?? 0) > 0 &&
      (op.corridor_slugs?.length ?? 0) > 0 &&
      !s.corridor_slugs!.some(sl => op.corridor_slugs!.includes(sl))
    ) continue;
    if (s.user_id === op.operator_id) continue;
    matches.push(s);
  }

  return matches;
}

function formatService(types: string[]): string {
  const label = types[0] ? (SERVICE_LABEL[types[0]] ?? types[0]) : 'Escort';
  return types.length > 1 ? `${label} +${types.length - 1}` : label;
}
