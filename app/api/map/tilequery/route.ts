import { NextResponse } from 'next/server';

// Haul Command Tilequery Proxy: Infrastructure Intel Engine
// "What bridges are within 2 miles of this coordinate?"
// "What weigh stations are near this route segment?"
// Queries Mapbox's global vector tilesets for infrastructure features
// without Haul Command having to maintain its own bridge/weigh-station database.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface NearbyFeature {
    type: string;
    name?: string;
    distance_meters: number;
    distance_miles: number;
    geometry: any;
    properties: Record<string, any>;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const lng = searchParams.get('lng');
    const lat = searchParams.get('lat');
    const radiusMeters = parseInt(searchParams.get('radius') || '3000'); // default 3km (~2mi)
    const layers = searchParams.get('layers') || ''; // comma-separated layer names
    const limit = parseInt(searchParams.get('limit') || '10');

    // Which tileset to query — default to mapbox's composite tileset
    // For infrastructure: mapbox.mapbox-streets-v8 includes buildings, bridges, roads
    const tileset = searchParams.get('tileset') || 'mapbox.mapbox-streets-v8';

    if (!lng || !lat) {
        return NextResponse.json({
            error: 'Coordinates (lat, lng) required.',
        }, { status: 400 });
    }

    // Build Tilequery URL
    let url = `https://api.mapbox.com/v4/${tileset}/tilequery/${lng},${lat}.json?radius=${radiusMeters}&limit=${limit}&access_token=${MAPBOX_TOKEN}`;

    // Add layer filter if specified
    if (layers) {
        url += `&layers=${layers}`;
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error('[Tilequery] Mapbox returned:', response.status);
            return NextResponse.json({
                error: 'Mapbox Tilequery API request failed.',
            }, { status: 502 });
        }

        const data = await response.json();

        // Transform Mapbox features into Haul Command's infrastructure format
        const features: NearbyFeature[] = (data.features || []).map((f: any) => ({
            type: f.properties?.class || f.properties?.type || 'unknown',
            name: f.properties?.name || f.properties?.name_en || undefined,
            distance_meters: Math.round(f.properties?.tilequery?.distance || 0),
            distance_miles: Math.round(((f.properties?.tilequery?.distance || 0) / 1609.34) * 100) / 100,
            geometry: f.geometry,
            properties: {
                ...f.properties,
                // Remove the tilequery metadata from properties to keep it clean
                tilequery: undefined,
            },
        }));

        // Classify features into categories relevant for heavy haul
        const classified = {
            bridges: features.filter(f => f.type === 'bridge' || f.properties?.structure === 'bridge'),
            tunnels: features.filter(f => f.type === 'tunnel' || f.properties?.structure === 'tunnel'),
            railways: features.filter(f => f.type === 'rail' || f.type === 'railway'),
            buildings: features.filter(f => f.type === 'building'),
            roads: features.filter(f => ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(f.type)),
            other: features.filter(f => !['bridge', 'tunnel', 'rail', 'railway', 'building', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(f.type)),
        };

        // Heavy haul relevance scoring
        const heavyHaulAlerts: string[] = [];
        if (classified.bridges.length > 0) {
            heavyHaulAlerts.push(`⚠️ ${classified.bridges.length} bridge(s) within ${(radiusMeters / 1609.34).toFixed(1)} miles. Verify clearance before proceeding.`);
        }
        if (classified.tunnels.length > 0) {
            heavyHaulAlerts.push(`🚧 ${classified.tunnels.length} tunnel(s) nearby. Oversize loads may be restricted.`);
        }
        if (classified.railways.length > 0) {
            heavyHaulAlerts.push(`🚂 ${classified.railways.length} railway crossing(s) detected. Check grade crossing clearance.`);
        }

        return NextResponse.json({
            success: true,
            query: { lat: parseFloat(lat), lng: parseFloat(lng), radius_meters: radiusMeters },
            total_features: features.length,
            classified,
            heavy_haul_alerts: heavyHaulAlerts,
            // For Custom GPS Engine enrichment
            route_enrichment_ready: true,
        });

    } catch (error) {
        console.error('[Tilequery] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
