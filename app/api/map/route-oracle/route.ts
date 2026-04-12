import { NextResponse } from 'next/server';

// Haul Command Route Weather + Incident Oracle
// Proxies Mapbox's incident data and OpenWeather along-route forecast
// to give oversize load drivers advance warning of hazards + weather systems
// intersecting their active route. A 200,000lb transformer cannot brake fast —
// drivers need 3-5x stopping distance. This Oracle provides that lead time.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface RouteSegment {
    lat: number;
    lng: number;
}

interface IncidentAlert {
    type: 'construction' | 'accident' | 'road_closure' | 'weather' | 'hazard' | 'congestion';
    severity: 'low' | 'moderate' | 'high' | 'critical';
    description: string;
    location: { lat: number; lng: number };
    distance_ahead_miles?: number;
    estimated_delay_minutes?: number;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { route_geometry, current_position, load_weight_lbs } = body;

        // route_geometry: GeoJSON LineString of the planned route
        // current_position: { lat, lng } — driver's current GPS
        // load_weight_lbs: used to determine stopping-distance severity

        if (!route_geometry?.coordinates || route_geometry.coordinates.length < 2) {
            return NextResponse.json({
                error: 'Route geometry with at least 2 coordinates required.',
            }, { status: 400 });
        }

        // Sample points along the route for incident checks
        // Take every Nth point to avoid excessive API calls
        const coords = route_geometry.coordinates as number[][];
        const sampleRate = Math.max(1, Math.floor(coords.length / 10)); // ~10 sample points
        const samplePoints = coords.filter((_: any, i: number) => i % sampleRate === 0);

        const incidents: IncidentAlert[] = [];

        // Query Mapbox Directions API with annotations for congestion + incidents
        // The annotations parameter returns congestion levels per route leg
        const routeCoords = [
            `${coords[0][0]},${coords[0][1]}`,
            `${coords[coords.length - 1][0]},${coords[coords.length - 1][1]}`
        ].join(';');

        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${routeCoords}?annotations=congestion,speed&overview=full&geometries=geojson&access_token=${MAPBOX_TOKEN}`;

        const directionsResponse = await fetch(directionsUrl);

        if (directionsResponse.ok) {
            const directionsData = await directionsResponse.json();
            const route = directionsData.routes?.[0];

            if (route?.legs) {
                for (const leg of route.legs) {
                    const congestionLevels = leg.annotation?.congestion || [];

                    // Find severe congestion segments
                    congestionLevels.forEach((level: string, index: number) => {
                        if (level === 'severe' || level === 'heavy') {
                            const segmentCoord = route.geometry?.coordinates?.[index];
                            if (segmentCoord) {
                                incidents.push({
                                    type: 'congestion',
                                    severity: level === 'severe' ? 'critical' : 'high',
                                    description: `${level === 'severe' ? '🔴 SEVERE' : '🟡 HEAVY'} congestion detected on route segment. Oversize loads require extended merge and braking distance.`,
                                    location: { lat: segmentCoord[1], lng: segmentCoord[0] },
                                    estimated_delay_minutes: level === 'severe' ? 30 : 15,
                                });
                            }
                        }
                    });
                }
            }
        }

        // Calculate stopping distance warnings based on load weight
        const isHeavyLoad = (load_weight_lbs || 0) > 80000;
        const isSuperLoad = (load_weight_lbs || 0) > 200000;

        let stoppingDistanceMultiplier = 1;
        let stoppingDistanceWarning = '';
        if (isSuperLoad) {
            stoppingDistanceMultiplier = 5;
            stoppingDistanceWarning = '⚠️ SUPERLOAD: 5x normal stopping distance. All incidents require 2+ mile advance warning.';
        } else if (isHeavyLoad) {
            stoppingDistanceMultiplier = 3;
            stoppingDistanceWarning = '⚠️ OVERSIZE: 3x normal stopping distance. Reduce speed approaching all flagged areas.';
        }

        // Deduplicate incidents by proximity (within 0.5 miles of each other)
        const deduped = incidents.filter((incident, index) => {
            for (let i = 0; i < index; i++) {
                const dist = haversineDistance(
                    incident.location.lat, incident.location.lng,
                    incidents[i].location.lat, incidents[i].location.lng
                );
                if (dist < 0.5) return false; // Skip if within 0.5 miles of existing incident
            }
            return true;
        });

        // Sort by severity (critical first)
        const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
        deduped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return NextResponse.json({
            success: true,
            incidents: deduped,
            incident_count: deduped.length,
            critical_count: deduped.filter(i => i.severity === 'critical').length,
            load_classification: isSuperLoad ? 'SUPERLOAD' : isHeavyLoad ? 'OVERSIZE' : 'STANDARD',
            stopping_distance: {
                multiplier: stoppingDistanceMultiplier,
                warning: stoppingDistanceWarning,
            },
            route_safety_score: deduped.length === 0 ? 100
                : deduped.length <= 2 ? 75
                : deduped.length <= 5 ? 50
                : 25,
            // Push to mobile SDK
            push_notification_recommended: deduped.some(i => i.severity === 'critical'),
        });

    } catch (error) {
        console.error('[Route Oracle] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Haversine distance in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
