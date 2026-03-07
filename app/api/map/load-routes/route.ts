import { NextRequest, NextResponse } from 'next/server';

// Contract-only stub: returns empty FC until load routes are wired from PostGIS
export async function GET(req: NextRequest) {
    const bbox = req.nextUrl.searchParams.get('bbox');
    if (!bbox) return NextResponse.json({ error: 'bbox required' }, { status: 400 });

    // TODO: Wire to PostGIS query on loads table with origin/dest coordinates
    // SELECT load_id, origin_lat, origin_lng, dest_lat, dest_lng, urgency, rate_amount
    // FROM loads WHERE status = 'open'
    //   AND ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326) && ...

    return NextResponse.json({ type: 'FeatureCollection', features: [] });
}
