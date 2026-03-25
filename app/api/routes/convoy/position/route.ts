/**
 * POST /api/routes/convoy/position — Update operator's convoy position
 * Called every 15 seconds by the mobile app during active jobs.
 * Checks deviation from permit route and triggers alerts if needed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pointToLineDistance, extractLineCoords } from '@/lib/routes/geo-utils';

export const dynamic = 'force-dynamic';

const DEVIATION_THRESHOLD_M = 200; // meters off permit route = deviation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { load_id, operator_id, role, lat, lng, speed_kmh, heading_degrees, accuracy_m } = body;

    if (!load_id || !operator_id || lat == null || lng == null) {
      return NextResponse.json({ error: 'load_id, operator_id, lat, lng required' }, { status: 400 });
    }

    const supabase = createClient();

    // Upsert position
    const { error: upsertError } = await supabase
      .from('convoy_positions')
      .upsert({
        load_id,
        operator_id,
        role: role ?? 'load_driver',
        lat,
        lng,
        speed_kmh: speed_kmh ?? null,
        heading_degrees: heading_degrees ?? null,
        accuracy_m: accuracy_m ?? null,
        on_permit_route: true, // will be updated below if off-route
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'load_id,operator_id',
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update position', detail: upsertError.message }, { status: 500 });
    }

    // Check deviation from permit route
    let deviated = false;
    let distanceFromRoute = 0;

    const { data: permitRoute } = await supabase
      .from('permit_routes')
      .select('route_geojson')
      .eq('load_id', load_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (permitRoute?.route_geojson) {
      const lineCoords = extractLineCoords(permitRoute.route_geojson as GeoJSON.Geometry);
      if (lineCoords.length > 1) {
        distanceFromRoute = pointToLineDistance(lat, lng, lineCoords);

        if (distanceFromRoute > DEVIATION_THRESHOLD_M) {
          deviated = true;

          // Update position to flag off-route
          await supabase
            .from('convoy_positions')
            .update({ on_permit_route: false })
            .eq('load_id', load_id)
            .eq('operator_id', operator_id);

          // Report deviation via API
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com'}/api/routes/deviation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              load_id,
              operator_id,
              deviation_lat: lat,
              deviation_lng: lng,
              distance_from_route_m: distanceFromRoute,
            }),
          }).then(()=>{});
        }
      }
    }

    // Get nearby clearance warnings (within 500m ahead based on heading)
    const upcomingClearances: Array<{ id: string; lat: number; lng: number; clearance_m: number; obstacle_type: string; distance_m: number }> = [];

    const { data: nearbyClearances } = await supabase
      .from('clearance_points')
      .select('id, lat, lng, clearance_posted_m, clearance_actual_m, obstacle_type, road_name')
      .gte('lat', lat - 0.005)
      .lte('lat', lat + 0.005)
      .gte('lng', lng - 0.005)
      .lte('lng', lng + 0.005)
      .limit(20);

    if (permitRoute) {
      const loadDims = (permitRoute as any).load_dimensions;
      const loadHeight = loadDims?.height_m ?? 4.5;

      for (const c of nearbyClearances ?? []) {
        const effectiveClearance = c.clearance_actual_m ?? c.clearance_posted_m;
        if (!effectiveClearance || effectiveClearance > loadHeight + 1) continue;

        const dist = Math.round(
          Math.sqrt(
            Math.pow((c.lat - lat) * 111320, 2) +
            Math.pow((c.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180), 2)
          )
        );

        if (dist < 500) {
          upcomingClearances.push({
            id: c.id,
            lat: c.lat,
            lng: c.lng,
            clearance_m: effectiveClearance,
            obstacle_type: c.obstacle_type,
            distance_m: dist,
          });
        }
      }
    }

    return NextResponse.json({
      updated: true,
      deviated,
      distance_from_route_m: Math.round(distanceFromRoute),
      upcoming_clearances: upcomingClearances.sort((a, b) => a.distance_m - b.distance_m),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Position update failed', detail: String(err) }, { status: 500 });
  }
}
