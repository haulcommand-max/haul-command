/**
 * GET /api/routes/convoy/[loadId] — Get all convoy positions for a load
 * POST /api/routes/convoy/[loadId] — Update convoy position (alternative to /position endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ loadId: string }> }
) {
  try {
    const { loadId } = await params;
    const supabase = createClient();

    // Get convoy positions updated within last 2 minutes
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: positions, error } = await supabase
      .from('convoy_positions')
      .select(`
        id, load_id, operator_id, role, lat, lng, speed_kmh, heading_degrees,
        on_permit_route, updated_at,
        profiles!convoy_positions_operator_id_fkey(display_name, full_name, avatar_url)
      `)
      .eq('load_id', loadId)
      .gte('updated_at', twoMinAgo)
      .order('role');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten profile join
    const convoy = (positions ?? []).map((p: any) => ({
      id: p.id,
      load_id: p.load_id,
      operator_id: p.operator_id,
      role: p.role,
      lat: Number(p.lat),
      lng: Number(p.lng),
      speed_kmh: p.speed_kmh ? Number(p.speed_kmh) : null,
      heading_degrees: p.heading_degrees,
      on_permit_route: p.on_permit_route,
      updated_at: p.updated_at,
      display_name: p.profiles?.display_name ?? p.profiles?.full_name ?? 'Unknown',
      avatar_url: p.profiles?.avatar_url ?? null,
    }));

    // Get permit route for this load
    const { data: permitRoute } = await supabase
      .from('permit_routes')
      .select('id, route_geojson, permit_number, total_distance_km, valid_from, valid_until, load_dimensions')
      .eq('load_id', loadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get unresolved deviations
    const { data: deviations } = await supabase
      .from('route_deviations')
      .select('*')
      .eq('load_id', loadId)
      .is('resolved_at', null)
      .order('detected_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      convoy,
      permit_route: permitRoute ?? null,
      active_deviations: deviations ?? [],
      convoy_size: convoy.length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch convoy', detail: String(err) }, { status: 500 });
  }
}
