/**
 * HAUL COMMAND — Live Operator Positions API
 * GET /api/location/live
 *
 * Returns all operator positions updated in last 5 minutes.
 * Used by the map to render live dots.
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('operator_locations')
    .select(`
      operator_id, lat, lng, speed, heading, accuracy, source, updated_at,
      profiles!inner(display_name, company_name)
    `)
    .gte('updated_at', fiveMinAgo)
    .limit(500);

  if (error) {
    console.error('[Live Locations] Error:', error.message);
    return NextResponse.json({ operators: [] });
  }

  const operators = (data || []).map((row: any) => ({
    operator_id: row.operator_id,
    lat: row.lat,
    lng: row.lng,
    speed: row.speed,
    heading: row.heading,
    accuracy: row.accuracy,
    source: row.source,
    updated_at: row.updated_at,
    display_name: row.profiles?.display_name,
    company_name: row.profiles?.company_name,
  }));

  return NextResponse.json({ operators, count: operators.length });
}
