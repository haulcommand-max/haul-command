import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/map/load-routes
 * Returns active loads as GeoJSON FeatureCollection for map overlay.
 * Query: bbox=minLng,minLat,maxLng,maxLat
 */
export async function GET(req: NextRequest) {
    const bbox = req.nextUrl.searchParams.get('bbox');
    if (!bbox) return NextResponse.json({ error: 'bbox required' }, { status: 400 });

    const parts = bbox.split(',').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
        return NextResponse.json({ error: 'bbox must be minLng,minLat,maxLng,maxLat' }, { status: 400 });
    }

    const [minLng, minLat, maxLng, maxLat] = parts;
    const supabase = getSupabaseAdmin();

    const { data: loads, error } = await supabase
        .from('hc_loads')
        .select(`
            id, origin_lat, origin_lng, dest_lat, dest_lng,
            urgency_level, load_classification, escort_count_required,
            permit_required, height_pole_required, requested_start_date,
            special_instructions, created_at
        `)
        .eq('status', 'open')
        .gte('origin_lat', minLat)
        .lte('origin_lat', maxLat)
        .gte('origin_lng', minLng)
        .lte('origin_lng', maxLng)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error('[load-routes] DB error:', error.message);
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
    }

    const features = (loads || []).map((load: any) => {
        const hasRoute = load.origin_lat && load.origin_lng && load.dest_lat && load.dest_lng;
        return {
            type: 'Feature' as const,
            geometry: hasRoute
                ? { type: 'LineString' as const, coordinates: [[load.origin_lng, load.origin_lat], [load.dest_lng, load.dest_lat]] }
                : { type: 'Point' as const, coordinates: [load.origin_lng || 0, load.origin_lat || 0] },
            properties: {
                load_id: load.id,
                urgency: load.urgency_level,
                classification: load.load_classification,
                escorts_needed: load.escort_count_required,
                permit_required: load.permit_required,
                height_pole_required: load.height_pole_required,
                start_date: load.requested_start_date,
                special_instructions: load.special_instructions,
                created_at: load.created_at,
            },
        };
    });

    return NextResponse.json({ type: 'FeatureCollection', features });
}
