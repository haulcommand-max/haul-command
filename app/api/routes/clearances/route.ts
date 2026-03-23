/**
 * GET /api/routes/clearances — Get clearance points near a location
 * Query: lat, lng, radius_m, min_height_m (load height)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { haversineDistance, classifyClearanceRisk } from '@/lib/routes/geo-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') ?? '');
    const lng = parseFloat(url.searchParams.get('lng') ?? '');
    const radiusM = parseFloat(url.searchParams.get('radius_m') ?? '5000');
    const minHeightM = parseFloat(url.searchParams.get('min_height_m') ?? '4.5');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
    }

    const supabase = createClient();

    // Calculate bounding box
    const latDelta = (radiusM / 111320);
    const lngDelta = latDelta / Math.cos(lat * Math.PI / 180);

    const { data: clearances, error } = await supabase
      .from('clearance_points')
      .select('*')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by actual distance and classify risk
    const results = (clearances ?? [])
      .map(c => {
        const dist = haversineDistance(lat, lng, c.lat, c.lng);
        const effectiveClearance = c.clearance_actual_m ?? c.clearance_posted_m;
        const marginM = effectiveClearance ? effectiveClearance - minHeightM : null;
        return {
          ...c,
          distance_m: Math.round(dist),
          effective_clearance_m: effectiveClearance,
          margin_m: marginM != null ? Math.round(marginM * 100) / 100 : null,
          risk_level: marginM != null ? classifyClearanceRisk(marginM) : 'safe',
        };
      })
      .filter(c => c.distance_m <= radiusM)
      .sort((a, b) => (a.margin_m ?? 999) - (b.margin_m ?? 999));

    // Separate into warnings and safe
    const warnings = results.filter(c => c.risk_level !== 'safe');
    const safe = results.filter(c => c.risk_level === 'safe');

    return NextResponse.json({
      clearances: results,
      warnings,
      total: results.length,
      warning_count: warnings.length,
      blocked_count: results.filter(c => c.risk_level === 'blocked').length,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Clearance query failed', detail: String(err) }, { status: 500 });
  }
}
