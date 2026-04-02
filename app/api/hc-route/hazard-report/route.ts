/**
 * HC Route — Hazard Report API (HC Waze)
 * POST /api/hc-route/hazard-report
 * GET  /api/hc-route/hazard-report?lat=X&lng=Y&radius=50
 *
 * Drivers report and query oversize-specific hazards.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Submit a new hazard report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reporter_id, lat, lng, hazard_type, description, severity, measured_height_ft, measured_width_ft, road_name, direction, photo_urls } = body;

    if (!lat || !lng || !hazard_type) {
      return NextResponse.json({ error: 'lat, lng, and hazard_type are required' }, { status: 400 });
    }

    // Auto-expire temporary hazards
    const tempHazards = ['construction', 'road_closure', 'lane_closure', 'accident', 'police', 'flooding', 'weather', 'school_zone_active', 'weight_station_open'];
    const expiresAt = tempHazards.includes(hazard_type)
      ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
      : null;

    const { data, error } = await supabase.from('hazard_reports').insert({
      reporter_id, lat, lng, hazard_type, description, severity: severity || 'medium',
      measured_height_ft, measured_width_ft, road_name, direction,
      photo_urls: photo_urls || [], is_active: true, expires_at: expiresAt,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If it's a permanent restriction (low bridge, etc.), also create a road_restriction
    const permanentHazards = ['low_bridge', 'low_utility_line', 'narrow_road', 'tight_turn', 'steep_grade'];
    if (permanentHazards.includes(hazard_type)) {
      const restrictionType = hazard_type === 'low_bridge' ? 'bridge_height'
        : hazard_type === 'narrow_road' ? 'road_width'
        : hazard_type === 'steep_grade' ? 'grade'
        : hazard_type === 'low_utility_line' ? 'utility_line'
        : 'turn_radius';

      await supabase.from('road_restrictions').insert({
        lat, lng, road_name, restriction_type: restrictionType,
        max_height_ft: measured_height_ft, max_width_ft: measured_width_ft,
        source: 'crowd_sourced', confidence_score: 0.5, verified: false,
        notes: `Driver report: ${description || hazard_type}`,
      });
    }

    return NextResponse.json({ success: true, hazard: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Query nearby hazards
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') || '0');
  const lng = parseFloat(url.searchParams.get('lng') || '0');
  const radiusMiles = parseFloat(url.searchParams.get('radius') || '25');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  // Convert miles to approximate degrees (1 degree ~ 69 miles)
  const radiusDeg = radiusMiles / 69;

  const { data, error } = await supabase
    .from('hazard_reports')
    .select('*')
    .eq('is_active', true)
    .gte('lat', lat - radiusDeg)
    .lte('lat', lat + radiusDeg)
    .gte('lng', lng - radiusDeg)
    .lte('lng', lng + radiusDeg)
    .order('reported_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ hazards: data, count: data?.length || 0 });
}
