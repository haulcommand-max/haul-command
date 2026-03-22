// app/api/location/privacy/route.ts
// PUT: Update location sharing preference

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const { operator_id, location_sharing_enabled } = await request.json();

    if (!operator_id) {
      return NextResponse.json({ error: 'Missing operator_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('profiles')
      .update({ location_sharing_enabled })
      .eq('id', operator_id);

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // If sharing disabled, clear their live location
    if (!location_sharing_enabled) {
      await supabase
        .from('operator_locations')
        .delete()
        .eq('operator_id', operator_id);
    }

    return NextResponse.json({ updated: true, location_sharing_enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
