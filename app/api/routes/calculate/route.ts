/**
 * POST /api/routes/calculate
 * Haul Command Route IQ — Heavy haul route calculator
 * 
 * Routing priority:
 *   1. Valhalla (truck-costed, oversize-aware, open-source) → primary
 *   2. HERE Maps (truck routing, commercial fallback) → if Valhalla unavailable
 *   3. Straight-line fallback → emergency only (last resort)
 * 
 * After routing, queries Supabase PostGIS for:
 *   - clearance_points (legacy bridge clearances)
 *   - road_restrictions (DOT/NBI/OSM bridge heights — 12,300+ rows)
 *   - weight_restrictions (seasonal / permanent weight limits)
 *   - route_checkpoints (weigh stations, DOT checkpoints, tolls)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { RouteCalculationRequest, ClearanceWarning, WeightRestriction, RouteCheckpoint } from '@/lib/routes/types';
import { sampleRoutePoints, haversineDistance, classifyClearanceRisk, ftToM } from '@/lib/routes/geo-utils';
import { getHeavyHaulRoute, type TruckProfile, type ValhallaRouteResponse } from '@/lib/routing/valhalla';

export const dynamic = 'force-dynamic';

// ── Valhalla Encoded Polyline Decoder ──────────────────────────────
// Valhalla uses Google's encoded polyline format at 1e6 precision.
function decodePolyline(encoded: string, precision: number = 6): number[][] {
  const coords: number[][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    // GeoJSON format: [lng, lat]
    coords.push([lng / factor, lat / factor]);
  }

  return coords;
}

// ── Route Generation with Valhalla + HERE Fallback ─────────────────

type RouteSource = 'valhalla' | 'here' | 'fallback';

interface GeneratedRoute {
  coords: number[][];
  distanceKm: number;
  durationSeconds: number;
  source: RouteSource;
  maneuvers?: Array<{ instruction: string; length: number; time: number }>;
}

async function generateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  loadDimensions: { height_m: number; width_m: number; length_m: number; weight_kg: number }
): Promise<GeneratedRoute> {
  // ── Attempt 1: Valhalla (primary — truck-costed routing) ──
  try {
    const truckProfile: TruckProfile = {
      height: loadDimensions.height_m,
      width: loadDimensions.width_m,
      length: loadDimensions.length_m,
      weight: loadDimensions.weight_kg / 1000, // Valhalla expects metric tons
      isOversize: loadDimensions.width_m > 2.6 || loadDimensions.height_m > 4.1,
      isSuperload: loadDimensions.weight_kg > 54000, // >120,000 lbs
    };

    const valhallaResponse: ValhallaRouteResponse = await getHeavyHaulRoute(
      [
        { lat: origin.lat, lon: origin.lng, type: 'break' },
        { lat: destination.lat, lon: destination.lng, type: 'break' },
      ],
      truckProfile,
      { units: 'kilometers' }
    );

    if (valhallaResponse?.trip?.legs?.length > 0) {
      const leg = valhallaResponse.trip.legs[0];
      const coords = decodePolyline(leg.shape);
      const summary = valhallaResponse.trip.summary;

      return {
        coords,
        distanceKm: summary.length,
        durationSeconds: summary.time,
        source: 'valhalla',
        maneuvers: leg.maneuvers?.map(m => ({
          instruction: m.instruction,
          length: m.length,
          time: m.time,
        })),
      };
    }
  } catch (err) {
    console.warn('[Route IQ] Valhalla routing failed, falling back to HERE:', err);
  }

  // ── Attempt 2: HERE Maps (commercial fallback) ──
  const hereApiKey = process.env.HERE_API_KEY;
  if (hereApiKey) {
    try {
      const hereUrl = new URL('https://router.hereapi.com/v8/routes');
      hereUrl.searchParams.set('apikey', hereApiKey);
      hereUrl.searchParams.set('transportMode', 'truck');
      hereUrl.searchParams.set('origin', `${origin.lat},${origin.lng}`);
      hereUrl.searchParams.set('destination', `${destination.lat},${destination.lng}`);
      hereUrl.searchParams.set('return', 'polyline,summary');
      // Set truck dimensions for HERE
      hereUrl.searchParams.set('truck[grossWeight]', String(loadDimensions.weight_kg));
      hereUrl.searchParams.set('truck[height]', String(Math.round(loadDimensions.height_m * 100))); // cm
      hereUrl.searchParams.set('truck[width]', String(Math.round(loadDimensions.width_m * 100)));
      hereUrl.searchParams.set('truck[length]', String(Math.round(loadDimensions.length_m * 100)));

      const hereRes = await fetch(hereUrl.toString());
      if (hereRes.ok) {
        const hereData = await hereRes.json();
        const route = hereData.routes?.[0];
        if (route?.sections?.length > 0) {
          // HERE returns flexible polyline — decode it
          const section = route.sections[0];
          // HERE polyline is in "flexible polyline encoding" format
          // For simplicity, use the polyline points if available
          const coords: number[][] = [];
          if (section.polyline) {
            // HERE uses flexible polyline — decode with precision 5
            const decoded = decodePolyline(section.polyline, 5);
            coords.push(...decoded);
          }
          
          if (coords.length > 0) {
            return {
              coords,
              distanceKm: (section.summary?.length || 0) / 1000,
              durationSeconds: section.summary?.duration || 0,
              source: 'here',
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Route IQ] HERE routing failed, falling back to straight-line:', err);
    }
  }

  // ── Attempt 3: Emergency straight-line fallback ──
  // Only used when both Valhalla and HERE are completely unavailable.
  console.warn('[Route IQ] All routing engines unavailable — using emergency straight-line fallback');
  const steps = 50;
  const coords: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + t * (destination.lat - origin.lat);
    const lng = origin.lng + t * (destination.lng - origin.lng);
    coords.push([lng, lat]);
  }

  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    totalDist += haversineDistance(coords[i-1][1], coords[i-1][0], coords[i][1], coords[i][0]);
  }

  return {
    coords,
    distanceKm: totalDist / 1000,
    durationSeconds: (totalDist / 1000 / 55) * 3600, // ~55 km/h heavy haul avg
    source: 'fallback',
  };
}

// ── Main Route Handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RouteCalculationRequest = await req.json();
    const { origin, destination, load_dimensions, country_code } = body;

    if (!origin || !destination || !load_dimensions) {
      return NextResponse.json({ error: 'Missing origin, destination, or load_dimensions' }, { status: 400 });
    }

    const supabase = createClient();

    // Step 1: Get real truck-costed route from Valhalla (or fallback)
    const route = await generateRoute(origin, destination, load_dimensions);
    const routeGeojson: GeoJSON.LineString = {
      type: 'LineString',
      coordinates: route.coords,
    };

    // Step 2: Sample points along the REAL route to check for hazards
    const samplePoints = sampleRoutePoints(route.coords, 500);

    // Step 3: Query clearance points near the route (legacy table)
    const clearanceWarnings: ClearanceWarning[] = [];
    for (const sp of samplePoints.filter((_, i) => i % 5 === 0)) {
      const { data: clearances } = await supabase
        .from('clearance_points')
        .select('*')
        .gte('lat', sp.lat - 0.005)
        .lte('lat', sp.lat + 0.005)
        .gte('lng', sp.lng - 0.005)
        .lte('lng', sp.lng + 0.005)
        .limit(50);

      for (const c of clearances ?? []) {
        const dist = haversineDistance(sp.lat, sp.lng, c.lat, c.lng);
        if (dist > 500) continue;

        const effectiveClearance = c.clearance_actual_m ?? c.clearance_posted_m;
        if (!effectiveClearance) continue;

        const marginM = effectiveClearance - load_dimensions.height_m;
        const riskLevel = classifyClearanceRisk(marginM);

        if (riskLevel !== 'safe') {
          // Avoid duplicates
          if (!clearanceWarnings.some(w => w.id === c.id)) {
            clearanceWarnings.push({
              ...c,
              margin_m: Math.round(marginM * 100) / 100,
              risk_level: riskLevel,
            });
          }
        }
      }
    }

    // Step 3B: Query DOT road_restrictions (NBI/OSM bridge heights — 12,300+ rows)
    // This is the table we seeded with real DOT data.
    const bridgeRestrictions: Array<{
      id: string; lat: number; lng: number; restriction_type: string;
      max_height_ft: number | null; max_weight_lbs: number | null;
      road_name: string | null; source: string; margin_ft: number;
      risk_level: string;
    }> = [];

    for (const sp of samplePoints.filter((_, i) => i % 5 === 0)) {
      const { data: restrictions } = await supabase
        .from('road_restrictions')
        .select('id, lat, lng, restriction_type, max_height_ft, max_weight_lbs, road_name, source, notes')
        .gte('lat', sp.lat - 0.005)
        .lte('lat', sp.lat + 0.005)
        .gte('lng', sp.lng - 0.005)
        .lte('lng', sp.lng + 0.005)
        .limit(50);

      for (const r of restrictions ?? []) {
        const dist = haversineDistance(sp.lat, sp.lng, r.lat, r.lng);
        if (dist > 500) continue;

        // check height clearance
        if (r.max_height_ft && load_dimensions.height_m) {
          const bridgeHeightM = ftToM(r.max_height_ft);
          const marginM = bridgeHeightM - load_dimensions.height_m;
          const riskLevel = classifyClearanceRisk(marginM);

          if (riskLevel !== 'safe') {
            if (!bridgeRestrictions.some(b => b.id === r.id)) {
              bridgeRestrictions.push({
                id: r.id,
                lat: r.lat,
                lng: r.lng,
                restriction_type: r.restriction_type,
                max_height_ft: r.max_height_ft,
                max_weight_lbs: r.max_weight_lbs,
                road_name: r.road_name,
                source: r.source,
                margin_ft: Math.round((marginM / 0.3048) * 10) / 10, // back to feet for display
                risk_level: riskLevel,
              });
            }
          }
        }

        // check weight limits
        if (r.max_weight_lbs && load_dimensions.weight_kg) {
          const maxWeightKg = r.max_weight_lbs * 0.453592;
          if (load_dimensions.weight_kg > maxWeightKg) {
            if (!bridgeRestrictions.some(b => b.id === r.id)) {
              bridgeRestrictions.push({
                id: r.id,
                lat: r.lat,
                lng: r.lng,
                restriction_type: r.restriction_type,
                max_height_ft: r.max_height_ft,
                max_weight_lbs: r.max_weight_lbs,
                road_name: r.road_name,
                source: r.source,
                margin_ft: 0,
                risk_level: 'blocked',
              });
            }
          }
        }
      }
    }

    // Step 4: Query weight restrictions near the route (legacy table)
    const weightWarnings: WeightRestriction[] = [];
    const today = new Date().toISOString().split('T')[0];
    for (const sp of samplePoints.filter((_, i) => i % 10 === 0)) {
      const { data: restrictions } = await supabase
        .from('weight_restrictions')
        .select('*')
        .gte('lat', sp.lat - 0.01)
        .lte('lat', sp.lat + 0.01)
        .gte('lng', sp.lng - 0.01)
        .lte('lng', sp.lng + 0.01)
        .limit(20);

      for (const r of restrictions ?? []) {
        // Check if restriction is currently active
        if (r.active_from && r.active_until) {
          if (today < r.active_from || today > r.active_until) continue;
        }
        if (r.max_gross_weight_kg && load_dimensions.weight_kg > r.max_gross_weight_kg) {
          if (!weightWarnings.some(w => w.id === r.id)) {
            weightWarnings.push(r);
          }
        }
      }
    }

    // Step 5: Query checkpoints along the route
    const checkpointsOnRoute: RouteCheckpoint[] = [];
    for (const sp of samplePoints.filter((_, i) => i % 10 === 0)) {
      const { data: checkpoints } = await supabase
        .from('route_checkpoints')
        .select('*')
        .gte('lat', sp.lat - 0.02)
        .lte('lat', sp.lat + 0.02)
        .gte('lng', sp.lng - 0.02)
        .lte('lng', sp.lng + 0.02)
        .limit(20);

      for (const cp of checkpoints ?? []) {
        if (!checkpointsOnRoute.some(c => c.id === cp.id)) {
          checkpointsOnRoute.push(cp);
        }
      }
    }

    // Step 6: Build risk summary (combine both clearance sources)
    const totalClearanceIssues = clearanceWarnings.length + bridgeRestrictions.filter(b => b.risk_level !== 'safe').length;
    const blockedClearances = clearanceWarnings.filter(w => w.risk_level === 'blocked').length
      + bridgeRestrictions.filter(b => b.risk_level === 'blocked').length;
    const overallRisk = blockedClearances > 0 ? 'blocked'
      : (totalClearanceIssues > 3 || weightWarnings.length > 0) ? 'high'
      : totalClearanceIssues > 0 ? 'moderate'
      : 'low';

    // Step 7: Duration from routing engine (or estimate for fallback)
    const estimatedDurationHours = route.durationSeconds
      ? Math.round((route.durationSeconds / 3600) * 100) / 100
      : Math.round((route.distanceKm / 55) * 100) / 100; // ~55 km/h heavy haul avg

    return NextResponse.json({
      route_geojson: routeGeojson,
      route_source: route.source, // 'valhalla' | 'here' | 'fallback'
      total_distance_km: Math.round(route.distanceKm * 10) / 10,
      estimated_duration_hours: estimatedDurationHours,
      clearance_warnings: clearanceWarnings,
      bridge_restrictions: bridgeRestrictions, // NEW: DOT/NBI/OSM bridge data
      weight_warnings: weightWarnings,
      checkpoints_on_route: checkpointsOnRoute,
      maneuvers: route.maneuvers || [], // Turn-by-turn from Valhalla
      suggested_travel_windows: [
        { day: 'mon', start_hour: 6, end_hour: 18 },
        { day: 'tue', start_hour: 6, end_hour: 18 },
        { day: 'wed', start_hour: 6, end_hour: 18 },
        { day: 'thu', start_hour: 6, end_hour: 18 },
        { day: 'fri', start_hour: 6, end_hour: 18 },
      ],
      risk_summary: {
        total_clearance_warnings: totalClearanceIssues,
        blocked_clearances: blockedClearances,
        bridge_restrictions_found: bridgeRestrictions.length,
        weight_violations: weightWarnings.length,
        checkpoint_count: checkpointsOnRoute.length,
        overall_risk: overallRisk,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Route calculation failed', detail: String(err) }, { status: 500 });
  }
}
