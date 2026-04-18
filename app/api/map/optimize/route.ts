import { NextResponse } from 'next/server';

// Haul Command Optimization API Proxy: The Multi-Stop Solver
// "Uber Pool" logic for escort vehicles.
// Given a pilot car with 3 jobs today, returns the optimal sequence
// to minimize deadhead (empty) miles between jobs.
// Uses Mapbox Optimization API v1.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Job {
    id: string;
    name: string;
    pickup: { lat: number; lng: number; address?: string };
    delivery: { lat: number; lng: number; address?: string };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { driver_location, jobs } = body;

        // driver_location: { lat, lng } — where the driver is NOW
        // jobs: array of Job objects with pickup/delivery coordinates
        if (!driver_location || !jobs || !Array.isArray(jobs) || jobs.length < 2) {
            return NextResponse.json({
                error: 'Driver location and at least 2 jobs required for optimization.',
            }, { status: 400 });
        }

        // Mapbox Optimization API supports up to 12 coordinates.
        // Build coordinate list: driver start + all pickups + all deliveries
        const allCoords: { lng: number; lat: number; type: string; jobId: string }[] = [
            { lng: driver_location.lng, lat: driver_location.lat, type: 'start', jobId: 'driver' },
        ];

        const maxJobs = jobs.slice(0, 5) as Job[]; // Cap at 5 jobs (11 coords + start = 12 max)

        for (const job of maxJobs) {
            allCoords.push({ lng: job.pickup.lng, lat: job.pickup.lat, type: 'pickup', jobId: job.id });
            allCoords.push({ lng: job.delivery.lng, lat: job.delivery.lat, type: 'delivery', jobId: job.id });
        }

        const coordString = allCoords.map(c => `${c.lng},${c.lat}`).join(';');

        // source=first (driver starts at their current location)
        // roundtrip=false (don't need to return to start)
        const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordString}?source=first&roundtrip=false&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('[Optimization API] Mapbox returned:', response.status);
            return NextResponse.json({
                error: 'Mapbox Optimization API request failed.',
            }, { status: 502 });
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Could not optimize route. Jobs may be unreachable.',
                mapbox_code: data.code,
            }, { status: 422 });
        }

        const trip = data.trips[0];
        const optimizedWaypoints = data.waypoints || [];

        // Map the waypoint order back to our job IDs
        const waypointOrder = optimizedWaypoints.map((wp: any, index: number) => ({
            original_index: index,
            optimized_index: wp.waypoint_index,
            coordinate: allCoords[index],
            name: wp.name || allCoords[index]?.type,
        }));

        // Calculate total savings
        const totalDistanceMiles = Math.round((trip.distance / 1609.34) * 10) / 10;
        const totalDurationMinutes = Math.round(trip.duration / 60);

        return NextResponse.json({
            success: true,
            optimized_route: {
                geometry: trip.geometry,
                total_distance_miles: totalDistanceMiles,
                total_duration_minutes: totalDurationMinutes,
                waypoint_order: waypointOrder,
            },
            jobs_optimized: maxJobs.length,
            savings_estimate: {
                note: 'Compare against naive sequential ordering to calculate actual deadhead reduction.',
            },
            // Direct overlay on Mapbox GL JS
            mapbox_source_ready: true,
        });

    } catch (error) {
        console.error('[Optimization API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
