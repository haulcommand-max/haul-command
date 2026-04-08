import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runProfileAudit } from '@/lib/workers/profileAuditWorker';

/**
 * POST /api/events/profile-updated
 * Receives hc_events of type "profile.updated" and triggers a profile audit.
 *
 * Sources:
 *   - Supabase Database Webhook on operator_profiles (UPDATE)
 *   - Internal event bus (hc_events INSERT with event_type = 'profile.updated')
 *   - Manual admin trigger
 *
 * Auth: x-supabase-signature | x-cron-secret
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
    ?? req.headers.get('x-supabase-signature');

  if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    event_type?: string;
    entity_id?: string;
    record?: { id?: string; team_id?: string };
    old_record?: Record<string, unknown>;
    payload_json?: { entity_id?: string };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Support Supabase Realtime webhook OR direct hc_events payload
  const entity_id = body.entity_id
    ?? body.payload_json?.entity_id
    ?? body.record?.id;

  if (!entity_id) {
    return NextResponse.json({ error: 'entity_id required' }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Emit hc_event so the event bus records this trigger
  await db.from('hc_events').upsert({
    event_type: 'profile_audit.triggered',
    event_source: 'profile-updated-webhook',
    entity_type: 'operator',
    entity_id,
    payload_json: { triggered_by: 'profile.updated', original_payload: body },
    idempotency_key: `profile-audit-${entity_id}-${new Date().toISOString().slice(0, 16)}`,
  }, { onConflict: 'idempotency_key', ignoreDuplicates: true });

  try {
    // Fetch operator profile to build the audit input
    const { data: profile } = await db.from('operator_profiles')
      .select('id, country_code, region_code, city_name, lat, lng, primary_role_type, listing_score')
      .eq('id', entity_id)
      .single();

    const result = runProfileAudit({
      entity_id,
      profile_class: 'local',
      country_code: profile?.country_code ?? 'US',
      region_code: profile?.region_code,
      city_name: profile?.city_name,
      lat: profile?.lat,
      lng: profile?.lng,
    });

    // Emit completion event
    await db.from('hc_events').insert({
      event_type: 'profile_audit.completed',
      event_source: 'profile-updated-webhook',
      entity_type: 'operator',
      entity_id,
      payload_json: {
        score_total: result.score_total,
        hard_fail: result.hard_fail,
        repair_count: result.repair_actions?.length ?? 0,
      },
    });

    return NextResponse.json({
      ok: true,
      entity_id,
      score_total: result.score_total,
      hard_fail: result.hard_fail,
      audit_status: result.audit_status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[profile-updated webhook]', err);

    await db.from('hc_events').insert({
      event_type: 'profile_audit.failed',
      event_source: 'profile-updated-webhook',
      entity_type: 'operator',
      entity_id,
      payload_json: { error: msg },
    });

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
