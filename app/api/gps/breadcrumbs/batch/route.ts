/**
 * HAUL COMMAND — GPS Breadcrumbs Batch Upload API
 * POST /api/gps/breadcrumbs/batch
 *
 * Receives offline-recorded GPS breadcrumbs and inserts to gps_breadcrumbs table.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { breadcrumbs } = await req.json();
    if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
      return NextResponse.json({ error: 'No breadcrumbs' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const rows = breadcrumbs.map((b: any) => ({
      job_id: b.job_id,
      operator_id: b.operator_id,
      lat: b.lat,
      lng: b.lng,
      accuracy: b.accuracy,
      heading: b.heading,
      speed: b.speed,
      recorded_at: b.timestamp,
      source: 'offline_sync',
    }));

    const { error } = await supabase.from('gps_breadcrumbs').insert(rows);

    if (error) {
      console.error('[GPS Breadcrumbs] Insert error:', error.message);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err: any) {
    console.error('[GPS Breadcrumbs] Error:', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
