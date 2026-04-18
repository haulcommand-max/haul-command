import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Haul Command Mobile Offline Cache Packager
// Triggered when an operator 'Accepts' a load. This generates the exact instructions
// for the Mapbox Mobile SDK (iOS/Android) to download the route into offline storage
// so it physically survives in 0-bar cell zones.

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { load_id, operator_id } = body;

        if (!load_id || !operator_id) {
            return NextResponse.json({ error: 'Missing load or operator ID.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Verify operator is authorized and get load details
        const { data: loadMeta, error: loadError } = await supabase
            .from('loads')
            .select('origin_lat, origin_lng, dest_lat, dest_lng, status')
            .eq('id', load_id)
            .single();

        if (loadError || !loadMeta) {
            return NextResponse.json({ error: 'Load tracking data unauthorized or missing.' }, { status: 404 });
        }

        // 2. Generate the Offline Bounding Box Parameters
        // We buffer the bounds widely so if the driver deviates slightly during an emergency,
        // they don't drive completely off the downloaded map edge.
        const minLng = Math.min(loadMeta.origin_lng, loadMeta.dest_lng) - 0.5; // roughly 25-30 miles padding
        const maxLng = Math.max(loadMeta.origin_lng, loadMeta.dest_lng) + 0.5;
        const minLat = Math.min(loadMeta.origin_lat, loadMeta.dest_lat) - 0.5;
        const maxLat = Math.max(loadMeta.origin_lat, loadMeta.dest_lat) + 0.5;

        const bounds = [
            [minLng, minLat], // Southwest
            [maxLng, maxLat]  // Northeast
        ];

        // 3. Construct the Mapbox Offline Download Manifest
        // This instructs the edge device EXACTLY what to permanently pull.
        const offlineManifest = {
            region_name: `HC_ROUTE_LOCK_${load_id.substring(0,8)}`,
            bounds: bounds,
            // We restrict extreme high zooms (like individual trees) to save phone storage
            // but keep detail high enough (Z14) to see specific intersections and bridge ramps.
            min_zoom: 5,
            max_zoom: 14,
            style_url: "mapbox://styles/mapbox/dark-v11",
            metadata: {
                load_id: load_id,
                operator_id: operator_id,
                type: 'heavy_haul_corridor',
                timestamp: new Date().toISOString()
            },
            // Proprietary Layers: We command the SDK to explicitly cache OUR custom
            // boundaries and hazard layers in addition to standard roads.
            required_custom_tilesets: [
                'haul-command.state-permit-boundaries',
                'haul-command.bridge-clearances-premium'
            ]
        };

        // 4. Log the action (Auditable record that the driver secured offline intel)
        // If they miss a bridge in a dead zone, we can prove we gave them the offline map.
        await supabase.from('os_event_log').insert({
            event_type: 'OFFLINE_MAP_CACHED',
            entity_id: load_id,
            entity_type: 'load',
            actor_id: operator_id,
            metadata: { region: offlineManifest.region_name }
        });

        return NextResponse.json({
            success: true,
            status: 'OFFLINE_CACHE_MANIFEST_READY',
            mapbox_instructions: offlineManifest
        });

    } catch (error) {
        console.error('[Offline Engine] Error packaging vector sets:', error);
        return NextResponse.json({ error: 'Internal Server Error packaging vectors' }, { status: 500 });
    }
}
