import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/* ══════════════════════════════════════════════════════
   /api/fleet/positions
   Returns live vehicle positions from Motive telematics
   ══════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('motive_vehicle_positions')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[fleet] Supabase error:', error.message);
      return NextResponse.json({ positions: [], source: 'error' });
    }

    // Normalize shape for frontend
    const positions = (data || []).map(row => ({
      id: row.id,
      vehicle_id: row.vehicle_id || row.vehicle_number || `V-${row.id?.slice(0, 6)}`,
      driver_name: row.driver_name || (row.driver_first_name ? `${row.driver_first_name || ''} ${row.driver_last_name || ''}`.trim() : 'Unknown Driver'),
      vehicle_type: row.vehicle_type || 'unknown',
      latitude: row.latitude || row.lat || 0,
      longitude: row.longitude || row.lng || row.lon || 0,
      speed_mph: row.speed_mph || row.speed || 0,
      heading: row.heading || row.bearing || 0,
      last_updated: row.last_updated || row.updated_at || row.created_at || new Date().toISOString(),
      status: row.status || (row.speed_mph > 0 ? 'active' : (Date.now() - new Date(row.last_updated || row.updated_at).getTime() > 3600000) ? 'offline' : 'idle'),
    }));

    return NextResponse.json({ positions, source: 'supabase' });
  } catch (err) {
    console.error('[fleet] Unexpected error:', err);
    return NextResponse.json({ positions: [], source: 'error' });
  }
}
