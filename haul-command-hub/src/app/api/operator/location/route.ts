/**
 * POST /api/operator/location
 * GET  /api/operator/location?operator_id=...&radius_km=...
 *
 * Handles GPS location updates from operator devices.
 * POST: Upsert operator's current location.
 * GET: List nearby operators for live map/dispatch.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operator_id, lat, lng, accuracy, heading, speed, source } = body;

    if (!operator_id || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Upsert — keep only the latest position per operator
    const { error } = await sb.from('operator_locations').upsert(
      {
        operator_id,
        lat,
        lng,
        accuracy: accuracy ?? null,
        heading: heading ?? null,
        speed: speed ?? null,
        source: source ?? 'phone',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'operator_id' },
    );

    if (error) {
      // If onConflict fails (no unique constraint), fall back to insert
      await sb.from('operator_locations').insert({
        operator_id,
        lat,
        lng,
        accuracy: accuracy ?? null,
        heading: heading ?? null,
        speed: speed ?? null,
        source: source ?? 'phone',
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Location Update] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') ?? '0');
    const lng = parseFloat(searchParams.get('lng') ?? '0');
    const radiusKm = parseFloat(searchParams.get('radius_km') ?? '100');
    const limit = parseInt(searchParams.get('limit') ?? '50');

    const sb = supabaseServer();

    // Simple bounding box query (good enough for prototype)
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const { data, error } = await sb
      .from('operator_locations')
      .select('*')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Only last 5 min
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ operators: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    console.error('[Nearby Operators] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
