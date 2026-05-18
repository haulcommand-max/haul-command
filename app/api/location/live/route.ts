/**
 * HAUL COMMAND — Live Operator Positions API
 * GET /api/location/live
 *
 * Returns live operator presence updated in last 5 minutes.
 * Raw GPS coordinates are not exposed from this public route.
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
      operator_id, updated_at,
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
    display_name: row.profiles?.display_name,
    company_name: row.profiles?.company_name,
    updated_at: row.updated_at,
    live_signal: true,
  }));

  return NextResponse.json({
    operators,
    count: operators.length,
    privacy: 'raw_live_coordinates_suppressed',
  });
}
