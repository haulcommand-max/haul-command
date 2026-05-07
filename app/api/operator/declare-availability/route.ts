import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';

/**
 * POST /api/operator/declare-availability
 *
 * Sets hc_available_now.available_until = now + hours.
 * Truth-safe: this is self-reported availability, not GPS-confirmed.
 * The UI must label this as "Self-Reported" — not "Live GPS".
 *
 * Body: { operator_id: string, hours: number (1-24) }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { operator_id, hours = 8 } = body;

    if (!operator_id) {
      return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
    }

    // Validate hours (cap at 24)
    const safeHours = Math.min(Math.max(1, Number(hours)), 24);
    const available_until = new Date(Date.now() + safeHours * 60 * 60 * 1000).toISOString();

    // Verify caller owns this operator profile
    const { data: op, error: opErr } = await supabase
      .from('hc_global_operators')
      .select('id, user_id')
      .eq('id', operator_id)
      .maybeSingle();

    if (opErr || !op) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }
    if (op.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Upsert hc_available_now
    const { error: upsertErr } = await supabase
      .from('hc_available_now')
      .upsert({
        operator_id,
        available_until,
        status: 'self_reported',  // truth-safe label
        updated_at: new Date().toISOString(),
      }, { onConflict: 'operator_id' });

    if (upsertErr) {
      console.error('[declare-availability] Upsert error:', upsertErr.message);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Fire hc_event for rank/freshness recalc
    await supabase.from('hc_events').insert({
      event_type: 'profile.updated',
      event_source: 'operator.declare-availability',
      entity_type: 'operator',
      entity_id: operator_id,
      actor_type: 'user',
      actor_id: session.user.id,
      payload_json: { hours: safeHours, available_until },
      idempotency_key: `avail-${operator_id}-${new Date().toDateString()}`,
    });

    return NextResponse.json({ success: true, available_until });
  } catch (err: any) {
    console.error('[declare-availability] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
