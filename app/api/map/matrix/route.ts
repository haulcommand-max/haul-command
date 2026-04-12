import { NextResponse } from 'next/server';

// Haul Command Matrix API Proxy: Smart Dispatch Ranking
// Instead of "show escorts within 100 miles" (dumb radius),
// this calls Mapbox Matrix API to get ACTUAL drive times from
// the load origin to all nearby available escorts in ONE call.
// Returns escorts ranked by fastest arrival, not closest pin.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface EscortCandidate {
    id: string;
    name: string;
    lat: number;
    lng: number;
    trust_score?: number;
}

interface RankedEscort extends EscortCandidate {
    drive_time_minutes: number;
    drive_distance_miles: number;
    rank: number;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin_lat, origin_lng, escorts } = body;

        if (!origin_lat || !origin_lng || !escorts || !Array.isArray(escorts) || escorts.length === 0) {
            return NextResponse.json({
                error: 'Requires origin coordinates and an array of escort candidates.',
            }, { status: 400 });
        }

        // Mapbox Matrix API supports up to 25 sources/destinations.
        // We use 1 source (load origin) + up to 24 escort destinations.
        const maxEscorts = escorts.slice(0, 24) as EscortCandidate[];

        // Build the coordinate string: origin first, then all escorts
        const coordinates = [
            `${origin_lng},${origin_lat}`,
            ...maxEscorts.map(e => `${e.lng},${e.lat}`)
        ].join(';');

        // Sources = index 0 (the load origin)
        // Destinations = indices 1..N (the escorts)
        const sources = '0';
        const destinations = maxEscorts.map((_, i) => i + 1).join(';');

        const matrixUrl = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?sources=${sources}&destinations=${destinations}&annotations=duration,distance&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(matrixUrl);

        if (!response.ok) {
            console.error('[Matrix API] Mapbox returned:', response.status, response.statusText);
            return NextResponse.json({
                error: 'Mapbox Matrix API request failed.',
                fallback: 'radius',
            }, { status: 502 });
        }

        const matrixData = await response.json();

        // matrixData.durations[0] = array of drive times from origin to each escort (in seconds)
        // matrixData.distances[0] = array of distances from origin to each escort (in meters)
        const durations = matrixData.durations?.[0] || [];
        const distances = matrixData.distances?.[0] || [];

        // Build the ranked list
        const rankedEscorts: RankedEscort[] = maxEscorts
            .map((escort, index) => ({
                ...escort,
                drive_time_minutes: durations[index] !== null
                    ? Math.round(durations[index] / 60)
                    : 9999,
                drive_distance_miles: distances[index] !== null
                    ? Math.round((distances[index] / 1609.34) * 10) / 10
                    : 9999,
                rank: 0,
            }))
            // Filter out unreachable escorts (null from Matrix API)
            .filter(e => e.drive_time_minutes < 9999)
            // Sort by fastest arrival, then by trust score as tiebreaker
            .sort((a, b) => {
                const timeDiff = a.drive_time_minutes - b.drive_time_minutes;
                if (timeDiff !== 0) return timeDiff;
                return (b.trust_score || 0) - (a.trust_score || 0);
            })
            .map((escort, index) => ({ ...escort, rank: index + 1 }));

        return NextResponse.json({
            success: true,
            origin: { lat: origin_lat, lng: origin_lng },
            total_candidates: escorts.length,
            ranked_count: rankedEscorts.length,
            escorts: rankedEscorts,
            // Metadata for the mobile/web UI
            fastest_arrival: rankedEscorts.length > 0
                ? `${rankedEscorts[0].name} — ${rankedEscorts[0].drive_time_minutes} min`
                : null,
        });

    } catch (error) {
        console.error('[Matrix Dispatch] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
