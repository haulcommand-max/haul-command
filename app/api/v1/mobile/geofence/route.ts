import { NextResponse } from 'next/server';

// Haul Command Geofencing Tripwire Controller
// This endpoint manages geofence boundary sets for the mobile SDK.
// When an operator accepts a load, the system generates state/county jurisdiction
// geofences along the route so the Mapbox Geofencing SDK fires onEnter/onExit
// events at every border crossing — even offline.

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface GeofenceZone {
    id: string;
    name: string;
    type: 'state_border' | 'county_border' | 'restricted_zone' | 'weigh_station' | 'custom';
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    properties: {
        alert_message: string;
        severity: 'info' | 'warning' | 'critical';
        escort_position?: 'front' | 'rear' | 'both';
        speed_limit_oversize?: number;
        requires_permit?: boolean;
    };
    dwell_minutes?: number; // For dwell detection (weigh station timeout alerts)
}

// State-specific oversize escort configuration rules
// This is the proprietary Haul Command intelligence layer — no competitor has this compiled.
const STATE_ESCORT_RULES: Record<string, { escort_position: string; speed_limit_oversize: number; notes: string }> = {
    'CO': { escort_position: 'rear', speed_limit_oversize: 45, notes: 'Colorado requires rear escort for loads >12ft wide. Night moves restricted.' },
    'TX': { escort_position: 'front', speed_limit_oversize: 55, notes: 'Texas requires front escort for loads >14ft wide on non-interstate.' },
    'CA': { escort_position: 'both', speed_limit_oversize: 45, notes: 'California requires front AND rear for superloads >16ft wide.' },
    'WA': { escort_position: 'front', speed_limit_oversize: 50, notes: 'Washington PEVO certification required. Front escort mandatory.' },
    'OR': { escort_position: 'front', speed_limit_oversize: 50, notes: 'Oregon reciprocity with WA PEVO. Front escort required.' },
    'AZ': { escort_position: 'rear', speed_limit_oversize: 55, notes: 'Arizona requires rear escort for loads >12ft wide.' },
    'FL': { escort_position: 'both', speed_limit_oversize: 45, notes: 'Florida requires dual escort for loads >14ft 6in wide.' },
    'GA': { escort_position: 'front', speed_limit_oversize: 55, notes: 'Georgia front escort required, cert mandatory since 2024.' },
    'OK': { escort_position: 'front', speed_limit_oversize: 55, notes: 'Oklahoma requires certified front pilot. Wind energy corridor active.' },
    'MN': { escort_position: 'rear', speed_limit_oversize: 50, notes: 'Minnesota rear escort. Seasonal frost laws affect routing.' },
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { route_states, load_id, load_width_ft, load_height_ft } = body;

        if (!route_states || !Array.isArray(route_states) || route_states.length === 0) {
            return NextResponse.json({ error: 'Route state list required.' }, { status: 400 });
        }

        // Build geofence zones for each state the load will cross
        const geofenceZones: GeofenceZone[] = [];

        for (let i = 0; i < route_states.length; i++) {
            const stateCode = route_states[i].toUpperCase();
            const rules = STATE_ESCORT_RULES[stateCode];

            // Generate the border-crossing alert geofence
            if (i > 0) {
                const prevState = route_states[i - 1].toUpperCase();
                geofenceZones.push({
                    id: `hc_border_${prevState}_${stateCode}_${load_id?.substring(0, 6) || 'gen'}`,
                    name: `${prevState}/${stateCode} State Line`,
                    type: 'state_border',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[]] // Populated at runtime from Mapbox Boundaries tileset
                    },
                    properties: {
                        alert_message: rules
                            ? `⚠️ Entering ${stateCode}. ${rules.notes} Speed limit for oversize: ${rules.speed_limit_oversize} MPH.`
                            : `Entering ${stateCode}. Check local oversize regulations.`,
                        severity: 'critical',
                        escort_position: rules?.escort_position as any || undefined,
                        speed_limit_oversize: rules?.speed_limit_oversize,
                        requires_permit: true,
                    }
                });
            }
        }

        // Add weigh station dwell-detection geofences
        // If the driver sits at a weigh station for 45+ minutes, alert dispatch
        geofenceZones.push({
            id: `hc_dwell_weigh_${load_id?.substring(0, 6) || 'gen'}`,
            name: 'Weigh Station Dwell Monitor',
            type: 'weigh_station',
            geometry: { type: 'Polygon', coordinates: [[]] },
            properties: {
                alert_message: '📍 Driver has been at weigh station for 45+ minutes. Dispatch review recommended.',
                severity: 'warning',
            },
            dwell_minutes: 45, // Mapbox Geofencing SDK onDwell trigger
        });

        // Return the geofence manifest for the mobile SDK to ingest
        return NextResponse.json({
            success: true,
            load_id: load_id,
            geofence_count: geofenceZones.length,
            geofences: geofenceZones,
            sdk_instructions: {
                // The mobile app uses these to configure the Mapbox Geofencing observer
                monitor_events: ['onEnter', 'onExit', 'onDwell'],
                background_monitoring: true,
                offline_capable: true,
                boundaries_tileset: 'mapbox.boundaries-adm1-v4', // US State boundaries
            }
        });

    } catch (error) {
        console.error('[Geofencing Controller] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
