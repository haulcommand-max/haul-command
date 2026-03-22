/**
 * HAUL COMMAND — Location Sharing Settings API
 * POST /api/settings/location-sharing
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { operator_id, enabled } = await req.json();
    if (!operator_id) return NextResponse.json({ error: 'Missing operator_id' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    await supabase.from('profiles').update({
      location_sharing_enabled: enabled,
      updated_at: new Date().toISOString(),
    }).eq('id', operator_id);

    // If disabled, remove current location
    if (!enabled) {
      await supabase.from('operator_locations').delete().eq('operator_id', operator_id);
    }

    return NextResponse.json({ ok: true, enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
