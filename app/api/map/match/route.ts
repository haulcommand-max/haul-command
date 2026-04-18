import { NextResponse } from 'next/server';

// Haul Command Map Matching Proxy: GPS Trace Cleaner
// Takes raw, jittery Traccar GPS traces and snaps them to actual road geometries.
// Critical for "Proof of Escort" route reports and Trust Score displays.
// Without this, a pilot car on a rural Texas highway looks like a seismograph.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { coordinates, timestamps } = body;

        // coordinates: array of [lng, lat] pairs from Traccar trace
        // timestamps: optional array of ISO timestamps for each coordinate
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
            return NextResponse.json({
                error: 'At least 2 coordinate pairs required for map matching.',
            }, { status: 400 });
        }

        // Mapbox Map Matching supports up to 100 coordinates per request.
        // For longer traces, we chunk and stitch.
        const MAX_COORDS = 100;
        const chunks: number[][][] = [];
        for (let i = 0; i < coordinates.length; i += MAX_COORDS - 1) {
            // Overlap by 1 point to ensure continuity between chunks  
            chunks.push(coordinates.slice(i, i + MAX_COORDS));
        }

        let matchedGeometry: any[] = [];
        let totalConfidence = 0;
        let matchedSegments = 0;

        for (const chunk of chunks) {
            const coordString = chunk.map((c: number[]) => `${c[0]},${c[1]}`).join(';');

            // Build the Map Matching request
            // profile: driving (not walking/cycling — these are truck/escort routes)
            // geometries: geojson (for direct overlay on Mapbox GL)
            // overview: full (return the complete matched geometry, not simplified)
            const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error('[Map Matching] Mapbox returned:', response.status);
                continue; // Skip failed chunks, try to match the rest
            }

            const data = await response.json();

            if (data.matchings && data.matchings.length > 0) {
                for (const matching of data.matchings) {
                    if (matching.geometry) {
                        matchedGeometry.push(...matching.geometry.coordinates);
                    }
                    totalConfidence += matching.confidence || 0;
                    matchedSegments++;
                }
            }
        }

        if (matchedGeometry.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Could not match GPS trace to road network. Trace may be too sparse or in an unmapped area.',
                fallback: 'raw_trace',
            }, { status: 422 });
        }

        // Deduplicate consecutive identical points from chunk stitching
        const dedupedGeometry = matchedGeometry.filter(
            (coord: number[], i: number) =>
                i === 0 || coord[0] !== matchedGeometry[i - 1][0] || coord[1] !== matchedGeometry[i - 1][1]
        );

        const avgConfidence = matchedSegments > 0
            ? Math.round((totalConfidence / matchedSegments) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            matched_geometry: {
                type: 'LineString',
                coordinates: dedupedGeometry,
            },
            stats: {
                raw_points: coordinates.length,
                matched_points: dedupedGeometry.length,
                confidence_pct: avgConfidence,
                chunks_processed: chunks.length,
            },
            // The matched GeoJSON can be directly added as a source to Mapbox GL JS
            mapbox_source_ready: true,
        });

    } catch (error) {
        console.error('[Map Matching] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
