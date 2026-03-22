// app/api/motive/fleet-data/route.ts
// ═══════════════════════════════════════════════════════════════
// GET /api/motive/fleet-data?profile_id=xxx
// Returns Motive fleet data for an operator's profile page:
// vehicles, HOS status, last location, inspection status.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get('profile_id');
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check if operator has Motive connected
  const { data: connection } = await supabase
    .from('motive_connections')
    .select('id, status, connected_at, last_synced_at')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .single();

  if (!connection) {
    return NextResponse.json({
      connected: false,
      connect_url: `/api/motive/connect?profile_id=${profileId}&return_url=/dashboard/operator`,
    });
  }

  // Fetch all Motive data in parallel
  const [vehiclesRes, driversRes, locationsRes, hosRes] = await Promise.all([
    supabase
      .from('motive_vehicles')
      .select('motive_id, number, status, year, make, model, vin, license_plate, fuel_type')
      .eq('connection_id', connection.id)
      .order('number'),
    supabase
      .from('motive_drivers')
      .select('motive_id, first_name, last_name, status, license_number, cycle')
      .eq('connection_id', connection.id),
    supabase
      .from('motive_locations')
      .select('vehicle_motive_id, lat, lon, speed, bearing, fuel_percent, engine_hours, located_at')
      .eq('connection_id', connection.id)
      .order('located_at', { ascending: false }),
    supabase
      .from('motive_hos_events')
      .select('driver_motive_id, status, start_time, end_time, duration, occurred_at')
      .eq('connection_id', connection.id)
      .order('occurred_at', { ascending: false })
      .limit(10),
  ]);

  // Calculate HOS hours remaining (simplified — 11h drive, 14h on-duty per day)
  const hosEvents = hosRes.data || [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayDriving = hosEvents
    .filter((e: any) => e.status === 'driving' && new Date(e.occurred_at) >= todayStart)
    .reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
  const hoursUsed = todayDriving / 3600;
  const hoursRemaining = Math.max(0, 11 - hoursUsed);

  return NextResponse.json({
    connected: true,
    connection: {
      connected_at: connection.connected_at,
      last_synced_at: connection.last_synced_at,
    },
    vehicles: vehiclesRes.data || [],
    drivers: driversRes.data || [],
    locations: locationsRes.data || [],
    hos: {
      events: hosEvents,
      hours_driven_today: Math.round(hoursUsed * 10) / 10,
      hours_remaining: Math.round(hoursRemaining * 10) / 10,
      status: hoursRemaining > 4 ? 'available' : hoursRemaining > 1 ? 'limited' : 'exhausted',
    },
    vehicle_count: vehiclesRes.data?.length || 0,
    driver_count: driversRes.data?.length || 0,
  });
}
