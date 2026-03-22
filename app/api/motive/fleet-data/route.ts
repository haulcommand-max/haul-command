/**
 * HAUL COMMAND — Motive Fleet Data API
 * GET /api/motive/fleet-data?profile_id=xxx
 *
 * Returns Motive data for an operator profile:
 * - vehicles, HOS availability, last location, last DVIR
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get('profile_id');
  if (!profileId) return NextResponse.json({ connected: false });

  const supabase = getSupabaseAdmin();

  // Check for Motive connection
  const { data: conn } = await supabase
    .from('motive_connections')
    .select('id, motive_company_id')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .maybeSingle();

  if (!conn) return NextResponse.json({ connected: false });

  // Fetch vehicles
  const { data: vehicles } = await supabase
    .from('motive_vehicles')
    .select('make, model, year, unit_number')
    .eq('connection_id', conn.id)
    .eq('status', 'active')
    .limit(10);

  // Fetch latest HOS summary
  const { data: hos } = await supabase
    .from('motive_hos_events')
    .select('drive_remaining_seconds')
    .eq('connection_id', conn.id)
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch last location
  const { data: loc } = await supabase
    .from('motive_locations')
    .select('lat, lon, speed, synced_at')
    .eq('connection_id', conn.id)
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch last DVIR
  const { data: dvir } = await supabase
    .from('motive_webhook_events')
    .select('raw_data, occurred_at')
    .eq('company_id', conn.motive_company_id)
    .in('event_type', ['dvir.created', 'dvir.updated'])
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    connected: true,
    vehicles: (vehicles || []).map(v => ({
      make: v.make || 'Unknown', model: v.model || '', year: v.year || '',
      unit: v.unit_number || '',
    })),
    hosAvailable: hos?.drive_remaining_seconds != null
      ? hos.drive_remaining_seconds / 3600 : null,
    lastLocation: loc ? {
      lat: loc.lat, lng: loc.lon, speed: loc.speed || 0,
      updatedAt: loc.synced_at,
    } : null,
    lastInspection: dvir ? {
      status: (dvir.raw_data as any)?.status === 'unsafe' ? 'unsafe' : 'safe',
      date: dvir.occurred_at,
      defects: (dvir.raw_data as any)?.defects?.length || 0,
    } : null,
  });
}
