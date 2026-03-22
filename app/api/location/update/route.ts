/**
 * HAUL COMMAND — Operator Location Update API
 * POST /api/location/update
 *
 * Accepts GPS position from phone or Motive.
 * Upserts to operator_locations table.
 * Only stores if operator is currently available.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operator_id, lat, lng, accuracy, heading, speed, timestamp, source } = body;

    if (!operator_id || lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Only store if operator is available (check profile)
    const { data: profile } = await supabase
      .from('profiles')
      .select('availability_status')
      .eq('id', operator_id)
      .single();

    if (!profile || profile.availability_status !== 'available') {
      return NextResponse.json({ error: 'Operator not available' }, { status: 403 });
    }

    // Upsert location
    const { error } = await supabase.from('operator_locations').upsert({
      operator_id,
      lat,
      lng,
      accuracy: accuracy ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
      source: source ?? 'phone',
      updated_at: timestamp ?? new Date().toISOString(),
    }, { onConflict: 'operator_id' });

    if (error) {
      console.error('[Location] Upsert error:', error.message);
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Location] Error:', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
