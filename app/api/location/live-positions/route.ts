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
      operator_id,
      lat,
      lng,
      accuracy,
      heading,
      speed,
      source,
      updated_at
    `)
    .gte('updated_at', fiveMinAgo);

  // Get Motive GPS positions
  const { data: motivePositions } = await supabase
    .from('motive_locations')
    .select(`
      vehicle_motive_id,
      lat,
      lon,
      speed,
      bearing,
      located_at,
      connection_id
    `)
    .gte('located_at', fiveMinAgo);

  // Merge both sources (deduplicate by operator — prefer Motive for connected ops)
  const positions = [
    ...(livePositions || []).map((p: any) => ({
      operator_id: p.operator_id,
      lat: p.lat,
      lng: p.lng,
      accuracy: p.accuracy || 100,
      heading: p.heading,
      speed: p.speed,
      source: p.source || 'phone_gps',
      updated_at: p.updated_at,
      eld_verified: false,
    })),
    ...(motivePositions || []).map((p: any) => ({
      operator_id: `motive_${p.vehicle_motive_id}`,
      lat: p.lat,
      lng: p.lon,
      accuracy: 10,
      heading: p.bearing,
      speed: p.speed,
      source: 'motive' as const,
      updated_at: p.located_at,
      eld_verified: true,
    })),
  ];

  return NextResponse.json({
    positions,
    count: positions.length,
    timestamp: new Date().toISOString(),
  });
}
