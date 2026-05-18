// app/api/location/live-positions/route.ts
// GET: Return all operator positions updated in last 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Get live phone GPS positions
  const { data: livePositions } = await supabase
    .from('operator_locations')
    .select(`
      operator_id
    `)
    .gte('updated_at', fiveMinAgo);

  // Get Motive GPS positions
  const { data: motivePositions } = await supabase
    .from('motive_locations')
    .select(`
      vehicle_motive_id
    `)
    .gte('located_at', fiveMinAgo);

  const positionCount = (livePositions?.length || 0) + (motivePositions?.length || 0);

  return NextResponse.json({
    positions: [],
    count: positionCount,
    sources: {
      phone_gps: livePositions?.length || 0,
      motive: motivePositions?.length || 0,
    },
    privacy: 'raw_live_coordinates_suppressed',
    timestamp: new Date().toISOString(),
  });
}
