/**
 * POST /api/routes/permit/attach — Attach a permit route to a load
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { haversineDistance } from '@/lib/routes/geo-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { load_id, route_geojson, permit_number, valid_from, valid_until, travel_windows, load_dimensions, country_code } = body;

    if (!load_id || !route_geojson) {
      return NextResponse.json({ error: 'load_id and route_geojson required' }, { status: 400 });
    }

    const supabase = createClient();

    // Extract origin and destination from the route GeoJSON
    const coords = route_geojson.type === 'MultiLineString'
      ? route_geojson.coordinates.flat()
      : route_geojson.coordinates;

    const origin = coords[0];
    const destination = coords[coords.length - 1];

    // Calculate total distance
    let totalDistanceKm = 0;
    for (let i = 1; i < coords.length; i++) {
      totalDistanceKm += haversineDistance(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]) / 1000;
    }

    // Insert permit route
    const { data: permitRoute, error: insertError } = await supabase
      .from('permit_routes')
      .insert({
        load_id,
        country_code: country_code ?? 'US',
        origin_lat: origin[1],
        origin_lng: origin[0],
        destination_lat: destination[1],
        destination_lng: destination[0],
        route_geojson,
        total_distance_km: Math.round(totalDistanceKm * 10) / 10,
        permit_number: permit_number ?? null,
        valid_from: valid_from ?? null,
        valid_until: valid_until ?? null,
        travel_windows: travel_windows ?? null,
        load_dimensions: load_dimensions ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to attach permit route', detail: insertError.message }, { status: 500 });
    }

    // Scan for clearance warnings along the permit route
    const clearanceWarnings: Array<{ id: string; lat: number; lng: number; clearance_m: number; obstacle_type: string; road_name: string | null }> = [];
    const loadHeight = load_dimensions?.height_m ?? 4.5;

    // Sample every 10th coordinate for efficiency
    for (let i = 0; i < coords.length; i += Math.max(1, Math.floor(coords.length / 50))) {
      const [lng, lat] = coords[i];
      const { data: nearby } = await supabase
        .from('clearance_points')
        .select('id, lat, lng, clearance_posted_m, clearance_actual_m, obstacle_type, road_name')
        .gte('lat', lat - 0.002)
        .lte('lat', lat + 0.002)
        .gte('lng', lng - 0.002)
        .lte('lng', lng + 0.002)
        .limit(20);

      for (const p of nearby ?? []) {
        const effectiveClearance = p.clearance_actual_m ?? p.clearance_posted_m;
        if (!effectiveClearance) continue;
        const dist = haversineDistance(lat, lng, p.lat, p.lng);
        if (dist > 100) continue;
        if (effectiveClearance < loadHeight + 0.3) {
          if (!clearanceWarnings.some(w => w.id === p.id)) {
            clearanceWarnings.push({
              id: p.id,
              lat: p.lat,
              lng: p.lng,
              clearance_m: effectiveClearance,
              obstacle_type: p.obstacle_type,
              road_name: p.road_name,
            });
          }
        }
      }
    }

    return NextResponse.json({
      permit_route: permitRoute,
      clearance_warnings: clearanceWarnings,
      total_distance_km: Math.round(totalDistanceKm * 10) / 10,
      warning_count: clearanceWarnings.length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to attach permit route', detail: String(err) }, { status: 500 });
  }
}
