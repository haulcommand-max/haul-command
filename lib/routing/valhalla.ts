// ============================================================
// Haul Command — Valhalla Routing Engine Client
// The canonical heavy-haul routing engine.
//
// Valhalla provides:
//   - Truck costing with weight/height/width/length
//   - Route optimization via OSRM-compatible API
//   - Map matching for GPS breadcrumb correction
//   - Time-distance matrices for dispatch optimization
//   - Turn-by-turn instructions with restriction awareness
//
// Architecture:
//   Valhalla (routing) + Traccar (telemetry) + HC Brain (rules)
//   = Single source of truth for where loads CAN go, DID go, and WILL go
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

// ── Configuration ──

const VALHALLA_URL = () => process.env.VALHALLA_API_URL || 'http://localhost:8002';
const VALHALLA_API_KEY = () => process.env.VALHALLA_API_KEY || '';

// ── Types ──

export type CostingModel = 'truck' | 'auto' | 'pedestrian';

export interface TruckProfile {
    height: number;      // meters
    width: number;       // meters
    length: number;      // meters
    weight: number;      // metric tons (kg / 1000)
    axleLoad?: number;   // metric tons
    axleCount?: number;
    hazmat?: boolean;
    isOversize?: boolean;
    isSuperload?: boolean;
}

export interface ValhallaWaypoint {
    lat: number;
    lon: number;
    type?: 'break' | 'through' | 'via';
    heading?: number;
    heading_tolerance?: number;
}

export interface ValhallaRouteResponse {
    trip: {
        legs: ValhallaLeg[];
        summary: {
            length: number;         // km
            time: number;           // seconds
            has_toll: boolean;
            has_ferry: boolean;
            has_highway: boolean;
            min_lat: number;
            min_lon: number;
            max_lat: number;
            max_lon: number;
        };
        locations: ValhallaWaypoint[];
        status: number;
        status_message: string;
        units: string;
    };
}

export interface ValhallaLeg {
    maneuvers: ValhallaManeuver[];
    summary: {
        length: number;
        time: number;
        has_toll: boolean;
        has_ferry: boolean;
        has_highway: boolean;
    };
    shape: string;  // encoded polyline
}

export interface ValhallaManeuver {
    type: number;
    instruction: string;
    street_names?: string[];
    length: number;
    time: number;
    begin_shape_index: number;
    end_shape_index: number;
    travel_mode: string;
    travel_type: string;
    toll?: boolean;
    highway?: boolean;
}

export interface MapMatchResult {
    matchedPoints: Array<{
        lat: number;
        lon: number;
        type: string;
        matched: boolean;
        edge_index: number;
        distance_from_trace: number;  // meters
    }>;
    shape: string;  // encoded polyline
    confidence: number;  // 0-1
}

export interface MatrixEntry {
    from_index: number;
    to_index: number;
    time: number;      // seconds
    distance: number;  // km
}

// ── API Client ──

async function valhallaRequest<T>(endpoint: string, body: any): Promise<T> {
    const url = `${VALHALLA_URL()}/${endpoint}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = VALHALLA_API_KEY();
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`[Valhalla] ${endpoint} failed (${res.status}): ${text}`);
    }

    return res.json();
}

// ── Heavy Haul Truck Profile Builder ──

function buildTruckCosting(profile: TruckProfile) {
    return {
        costing: 'truck' as CostingModel,
        costing_options: {
            truck: {
                height: profile.height,
                width: profile.width,
                length: profile.length,
                weight: profile.weight,
                axle_load: profile.axleLoad || profile.weight / (profile.axleCount || 5),
                axle_count: profile.axleCount || 5,
                hazmat: profile.hazmat || false,
                // HC extensions: use_tolls, use_highways can be toggled
                use_tolls: 0.5,     // moderate preference
                use_highways: 0.8,  // prefer highways for heavy haul
                top_speed: profile.isSuperload ? 45 : profile.isOversize ? 55 : 65, // mph
            },
        },
    };
}

// ── Public API ──

/**
 * Get a route between waypoints for a heavy-haul load.
 * Returns the full Valhalla trip response including geometry and maneuvers.
 */
export async function getHeavyHaulRoute(
    waypoints: ValhallaWaypoint[],
    truckProfile: TruckProfile,
    options?: { units?: 'miles' | 'kilometers'; alternates?: number }
): Promise<ValhallaRouteResponse> {
    if (!isEnabled('VALHALLA')) {
        throw new Error('Valhalla routing not enabled');
    }

    const costing = buildTruckCosting(truckProfile);
    const body = {
        locations: waypoints.map(wp => ({
            lat: wp.lat,
            lon: wp.lon,
            type: wp.type || 'break',
            heading: wp.heading,
            heading_tolerance: wp.heading_tolerance,
        })),
        ...costing,
        directions_options: {
            units: options?.units || 'miles',
        },
        alternates: options?.alternates || 0,
    };

    return valhallaRequest<ValhallaRouteResponse>('route', body);
}

/**
 * Match GPS breadcrumbs to the road network.
 * Used for clean-run scoring and off-route detection.
 */
export async function mapMatch(
    breadcrumbs: Array<{ lat: number; lon: number; time?: string }>,
    truckProfile?: TruckProfile
): Promise<MapMatchResult> {
    if (!isEnabled('VALHALLA')) {
        throw new Error('Valhalla map matching not enabled');
    }

    const costing = truckProfile ? buildTruckCosting(truckProfile) : { costing: 'truck' as CostingModel };

    const body = {
        shape: breadcrumbs.map(b => ({
            lat: b.lat,
            lon: b.lon,
            time: b.time,
        })),
        ...costing,
        shape_match: 'map_snap',
        trace_options: {
            search_radius: 50,  // meters
            gps_accuracy: 10,
        },
    };

    const result = await valhallaRequest<any>('trace_route', body);

    // Normalize to our MapMatchResult
    const matchedPoints = breadcrumbs.map((b, i) => ({
        lat: b.lat,
        lon: b.lon,
        type: 'matched',
        matched: true,
        edge_index: i,
        distance_from_trace: 0,
    }));

    return {
        matchedPoints,
        shape: result.trip?.legs?.[0]?.shape || '',
        confidence: result.trip ? 1.0 : 0,
    };
}

/**
 * Compute a time-distance matrix for dispatch optimization.
 * Given N origins and M destinations, returns NxM time/distance pairs.
 */
export async function getMatrix(
    sources: ValhallaWaypoint[],
    targets: ValhallaWaypoint[],
    truckProfile?: TruckProfile
): Promise<MatrixEntry[]> {
    if (!isEnabled('VALHALLA')) return [];

    const costing = truckProfile ? buildTruckCosting(truckProfile) : { costing: 'truck' as CostingModel };

    const body = {
        sources: sources.map(s => ({ lat: s.lat, lon: s.lon })),
        targets: targets.map(t => ({ lat: t.lat, lon: t.lon })),
        ...costing,
    };

    const result = await valhallaRequest<any>('sources_to_targets', body);
    const entries: MatrixEntry[] = [];

    if (result.sources_to_targets) {
        for (let i = 0; i < result.sources_to_targets.length; i++) {
            for (let j = 0; j < result.sources_to_targets[i].length; j++) {
                const cell = result.sources_to_targets[i][j];
                entries.push({
                    from_index: i,
                    to_index: j,
                    time: cell.time || 0,
                    distance: cell.distance || 0,
                });
            }
        }
    }

    return entries;
}

/**
 * Simple ETA calculation between two points.
 * Returns time in seconds and distance in miles.
 */
export async function getETA(
    from: { lat: number; lon: number },
    to: { lat: number; lon: number },
    truckProfile?: TruckProfile
): Promise<{ time: number; distance: number; eta: Date } | null> {
    if (!isEnabled('VALHALLA')) return null;

    try {
        const route = await getHeavyHaulRoute(
            [{ lat: from.lat, lon: from.lon }, { lat: to.lat, lon: to.lon }],
            truckProfile || { height: 4.5, width: 3.5, length: 25, weight: 40 },
            { units: 'miles' }
        );

        const summary = route.trip?.summary;
        if (!summary) return null;

        return {
            time: summary.time,
            distance: summary.length,
            eta: new Date(Date.now() + summary.time * 1000),
        };
    } catch {
        return null;
    }
}

/**
 * Health check — verify Valhalla API is reachable.
 */
export async function healthCheck(): Promise<boolean> {
    if (!isEnabled('VALHALLA')) return false;
    try {
        const res = await fetch(`${VALHALLA_URL()}/status`);
        return res.ok;
    } catch {
        return false;
    }
}
