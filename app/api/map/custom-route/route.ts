import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, destination, width, height, weight } = body;

        if (!origin || !destination) {
            return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
        }

        // Generate a slightly curved mock route between origin and destination
        const [origLng, origLat] = origin;
        const [destLng, destLat] = destination;
        
        // Midpoint rough calculation with a small curve to simulate a path avoiding something
        const midLng = (origLng + destLng) / 2;
        const midLat = (origLat + destLat) / 2 + 0.5; // push route north

        const geojson = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {
                        route_id: `custom_os_route_${Date.now()}`,
                        source_basis: 'preview_geometry_only',
                        confidence_label: 'unverified_preview',
                        restrictions_avoided: null,
                        clearance_guaranteed: false,
                        requires_routeintel_verification: true,
                        load_specs: { width, height, weight },
                        urgency: 'warm',
                        disclaimer: 'Preview geometry is not a permitted or clearance-verified route. Run RouteIntel or obtain jurisdiction approval before dispatch.',
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [origLng, origLat],
                            [midLng, midLat],
                            [destLng, destLat]
                        ]
                    }
                }
            ]
        };

        return NextResponse.json(geojson);
    } catch (error) {
        console.error('[Custom Route Engine] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
