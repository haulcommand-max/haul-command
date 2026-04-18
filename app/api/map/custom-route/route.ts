import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, destination, width, height, weight } = body;

        if (!origin || !destination) {
            return NextResponse.json({ error: 'Missing origin or destination' }, { status: 400 });
        }

        // MOCK: Here is where the execution connects to the proprietary 'Custom GPS Engine'
        // That engine applies heavy-haul logic (bridge heights, weight limits) to build a route
        // We simulate returning a Mapbox-compatible FeatureCollection geometry (GeoJSON LineString)

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
                        restrictions_avoided: 3, // example of moat logic applied
                        clearance_guaranteed: height > 13.0,
                        load_specs: { width, height, weight },
                        urgency: 'warm'
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
