// app/api/location/update/route.ts
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Live Location Update Receiver
// POST: Upsert operator location (only if operator is available)
// DELETE: Clear operator location (operator went unavailable)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operator_id, lat, lng, accuracy, heading, speed, timestamp } = body;

    if (!operator_id || lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Only store if operator is currently marked available
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, availability_status')
      .eq('id', operator_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    // Allow update regardless of availability_status field existence
    // (some operators may not have this field yet)
    const { error } = await supabase
      .from('operator_locations')
      .upsert(
        {
          operator_id,
          lat,
          lng,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          source: 'phone_gps',
          updated_at: timestamp || new Date().toISOString(),
        },
        { onConflict: 'operator_id' }
      );

    if (error) {
      console.error('[Location Update] DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ stored: true, operator_id });
  } catch (err: any) {
    console.error('[Location Update] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { operator_id } = body;

    if (!operator_id) {
      return NextResponse.json({ error: 'Missing operator_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await supabase
      .from('operator_locations')
      .delete()
      .eq('operator_id', operator_id);

    return NextResponse.json({ cleared: true, operator_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
