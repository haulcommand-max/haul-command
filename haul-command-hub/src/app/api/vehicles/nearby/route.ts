/**
 * GET /api/vehicles/nearby
 *
 * Unified nearby pilot feed — merges:
 *   1. Motive ELD vehicle positions (verified, high-quality)
 *   2. Phone GPS operator positions (self-reported)
 *
 * Returns a de-duped, distance-sorted list of nearby pilots.
 *
 * Query params:
 *   lat, lng — center point (required)
 *   radius_miles — search radius (default: 50)
 *   limit — max results (default: 25)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

interface NearbyPilot {
  id: string;
  source: 'motive' | 'phone';
  lat: number;
  lng: number;
  heading: number | null;
  speed_mph: number | null;
  distance_miles: number;
  driver_name: string | null;
  vehicle_number: string | null;
  hos_hours_remaining: number | null;
  provider_id: string | null;
  recorded_at: string;
  verified: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const radiusMiles = parseFloat(searchParams.get('radius_miles') ?? '50');
    const limit = parseInt(searchParams.get('limit') ?? '25');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const sb = supabaseServer();
    const pilots: NearbyPilot[] = [];

    // ─── 1. Motive ELD positions (last 1 hour) ──────────────────
    try {
      const { data: motiveData } = await sb.rpc('hc_nearest_motive_vehicles', {
        p_lat: lat,
        p_lng: lng,
        p_radius_miles: radiusMiles,
        p_limit: limit,
      });

      if (motiveData) {
        for (const v of motiveData) {
          pilots.push({
            id: `motive_${v.motive_vehicle_id}`,
            source: 'motive',
            lat: Number(v.lat),
            lng: Number(v.lng),
            heading: v.heading != null ? Number(v.heading) : null,
            speed_mph: v.speed_mph != null ? Number(v.speed_mph) : null,
            distance_miles: Number(v.distance_miles),
            driver_name: v.driver_name,
            vehicle_number: v.vehicle_number,
            hos_hours_remaining: v.hos_hours_remaining != null ? Number(v.hos_hours_remaining) : null,
            provider_id: v.provider_id,
            recorded_at: v.recorded_at,
            verified: true,
          });
        }
      }
    } catch (err) {
      console.warn('[Nearby Vehicles] Motive RPC failed, falling back to direct query:', err);
      // Fallback: direct table query
      const latDelta = radiusMiles / 69;
      const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: fallbackData } = await sb
        .from('motive_vehicle_positions')
        .select('*')
        .gte('lat', lat - latDelta)
        .lte('lat', lat + latDelta)
        .gte('lng', lng - lngDelta)
        .lte('lng', lng + lngDelta)
        .gte('recorded_at', oneHourAgo)
        .limit(limit);

      if (fallbackData) {
        for (const v of fallbackData) {
          const dLat = ((Number(v.lat) - lat) * Math.PI) / 180;
          const dLng = ((Number(v.lng) - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) * Math.cos((Number(v.lat) * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
          const distMiles = 3959 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          pilots.push({
            id: `motive_${v.motive_vehicle_id}`,
            source: 'motive',
            lat: Number(v.lat),
            lng: Number(v.lng),
            heading: v.heading != null ? Number(v.heading) : null,
            speed_mph: v.speed_mph != null ? Number(v.speed_mph) : null,
            distance_miles: distMiles,
            driver_name: v.driver_name || null,
            vehicle_number: v.vehicle_number || null,
            hos_hours_remaining: v.hos_hours_remaining != null ? Number(v.hos_hours_remaining) : null,
            provider_id: v.provider_id || null,
            recorded_at: v.recorded_at,
            verified: true,
          });
        }
      }
    }

    // ─── 2. Phone GPS positions (last 5 min) ───────────────────
    try {
      const latDelta = radiusMiles / 69;
      const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: phoneData } = await sb
        .from('operator_locations')
        .select('*')
        .gte('lat', lat - latDelta)
        .lte('lat', lat + latDelta)
        .gte('lng', lng - lngDelta)
        .lte('lng', lng + lngDelta)
        .gte('updated_at', fiveMinAgo)
        .limit(limit);

      if (phoneData) {
        // Build set of already-included provider IDs to avoid dups
        const existingProviders = new Set(pilots.map((p) => p.provider_id).filter(Boolean));

        for (const op of phoneData) {
          // Skip if this operator already appears via Motive
          if (existingProviders.has(op.operator_id)) continue;

          const dLat = ((op.lat - lat) * Math.PI) / 180;
          const dLng = ((op.lng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) * Math.cos((op.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
          const distMiles = 3959 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          if (distMiles <= radiusMiles) {
            pilots.push({
              id: `phone_${op.operator_id}`,
              source: 'phone',
              lat: op.lat,
              lng: op.lng,
              heading: op.heading,
              speed_mph: op.speed,
              distance_miles: distMiles,
              driver_name: null,
              vehicle_number: null,
              hos_hours_remaining: null,
              provider_id: op.operator_id,
              recorded_at: op.updated_at,
              verified: false,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[Nearby Vehicles] Phone positions query failed:', err);
    }

    // ─── 3. Sort by distance and limit ──────────────────────────
    pilots.sort((a, b) => a.distance_miles - b.distance_miles);
    const result = pilots.slice(0, limit);

    return NextResponse.json({
      pilots: result,
      count: result.length,
      sources: {
        motive: result.filter((p) => p.source === 'motive').length,
        phone: result.filter((p) => p.source === 'phone').length,
      },
    });
  } catch (err) {
    console.error('[Nearby Vehicles] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
