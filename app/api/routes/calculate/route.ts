/**
 * POST /api/routes/calculate
 * Heavy haul route calculator with clearance/weight/checkpoint intelligence.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { RouteCalculationRequest, ClearanceWarning, WeightRestriction, RouteCheckpoint } from '@/lib/routes/types';
import { sampleRoutePoints, haversineDistance, classifyClearanceRisk } from '@/lib/routes/geo-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: RouteCalculationRequest = await req.json();
    const { origin, destination, load_dimensions, country_code } = body;

    if (!origin || !destination || !load_dimensions) {
      return NextResponse.json({ error: 'Missing origin, destination, or load_dimensions' }, { status: 400 });
    }

    const supabase = createClient();

    // Step 1: Generate a base route using straight-line sampling
    // In production, this would call HERE/Valhalla/ORS for a real road route.
    // For now, generate a realistic set of waypoints along the path.
    const routeCoords = generateBaseRoute(origin, destination);
    const routeGeojson: GeoJSON.LineString = {
      type: 'LineString',
      coordinates: routeCoords,
    };

    // Calculate total distance
    let totalDistanceKm = 0;
    for (let i = 1; i < routeCoords.length; i++) {
      totalDistanceKm += haversineDistance(
        routeCoords[i - 1][1], routeCoords[i - 1][0],
        routeCoords[i][1], routeCoords[i][0]
      ) / 1000;
    }

    // Step 2: Sample points along the route to check for hazards
    const samplePoints = sampleRoutePoints(routeCoords, 500);

    // Step 3: Query clearance points near the route
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

    // Step 4: Query weight restrictions near the route
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

    // Step 6: Build risk summary
    const blockedClearances = clearanceWarnings.filter(w => w.risk_level === 'blocked').length;
    const overallRisk = blockedClearances > 0 ? 'blocked'
      : (clearanceWarnings.length > 3 || weightWarnings.length > 0) ? 'high'
      : clearanceWarnings.length > 0 ? 'moderate'
      : 'low';

    // Step 7: Estimated duration (heavy haul averages 45-55 mph highway, 25-35 mph city)
    const avgSpeedKmh = load_dimensions.width_m > 4.5 ? 50 : load_dimensions.weight_kg > 80000 ? 55 : 65;
    const estimatedDurationHours = Math.round((totalDistanceKm / avgSpeedKmh) * 100) / 100;

    return NextResponse.json({
      route_geojson: routeGeojson,
      total_distance_km: Math.round(totalDistanceKm * 10) / 10,
      estimated_duration_hours: estimatedDurationHours,
      clearance_warnings: clearanceWarnings,
      weight_warnings: weightWarnings,
      checkpoints_on_route: checkpointsOnRoute,
      suggested_travel_windows: [
        { day: 'mon', start_hour: 6, end_hour: 18 },
        { day: 'tue', start_hour: 6, end_hour: 18 },
        { day: 'wed', start_hour: 6, end_hour: 18 },
        { day: 'thu', start_hour: 6, end_hour: 18 },
        { day: 'fri', start_hour: 6, end_hour: 18 },
      ],
      risk_summary: {
        total_clearance_warnings: clearanceWarnings.length,
        blocked_clearances: blockedClearances,
        weight_violations: weightWarnings.length,
        checkpoint_count: checkpointsOnRoute.length,
        overall_risk: overallRisk,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Route calculation failed', detail: String(err) }, { status: 500 });
  }
}

/**
 * Generate base route waypoints between two points.
 * In production, replace with HERE/Valhalla API call.
 */
function generateBaseRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number[][] {
  const steps = 50;
  const coords: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + t * (destination.lat - origin.lat);
    const lng = origin.lng + t * (destination.lng - origin.lng);
    // Add slight curve to simulate road routing
    const curve = Math.sin(t * Math.PI) * 0.02;
    coords.push([lng + curve, lat]);
  }
  return coords;
}
