// app/api/location/sync-breadcrumbs/route.ts
// Batch upload offline GPS breadcrumbs from IndexedDB

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { breadcrumbs } = await request.json();

    if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
      return NextResponse.json({ error: 'No breadcrumbs' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const rows = breadcrumbs.map((b: any) => ({
      operator_id: b.operator_id,
      lat: b.lat,
      lng: b.lng,
      accuracy: b.accuracy || null,
      heading: b.heading || null,
      speed: b.speed || null,
      recorded_at: b.timestamp || b.queued_at,
    }));

    const { error } = await supabase
      .from('gps_breadcrumbs')
      .insert(rows);

    if (error) {
      console.error('[Breadcrumb Sync] Error:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    return NextResponse.json({ synced: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
