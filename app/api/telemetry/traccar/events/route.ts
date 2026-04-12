import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Haul Command Traccar Event Webhook Receiver
// Traccar pushes real-time events: ignition on/off, SOS button press,
// speed threshold violations, and geofence enter/exit.
// These feed into the Trust Score, dispatch alerts, and compliance audit trail.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TRACCAR_WEBHOOK_SECRET = process.env.TRACCAR_WEBHOOK_SECRET || '';

type TraccarEventType = 'deviceOnline' | 'deviceOffline' | 'ignitionOn' | 'ignitionOff'
    | 'alarm' | 'sos' | 'speedLimit' | 'geofenceEnter' | 'geofenceExit'
    | 'hardAcceleration' | 'hardBraking' | 'hardCornering';

interface TraccarEvent {
    id: number;
    type: TraccarEventType;
    deviceId: number;
    positionId: number;
    geofenceId?: number;
    maintenanceId?: number;
    serverTime: string;
    attributes: Record<string, any>;
}

interface TraccarPosition {
    latitude: number;
    longitude: number;
    speed: number; // knots
    course: number;
    address?: string;
    attributes: Record<string, any>;
}

interface TraccarWebhookPayload {
    event: TraccarEvent;
    device: { id: number; name: string; uniqueId: string; status: string };
    position?: TraccarPosition;
}

export async function POST(request: Request) {
    try {
        // Validate webhook secret
        const authHeader = request.headers.get('authorization');
        if (TRACCAR_WEBHOOK_SECRET && authHeader !== `Bearer ${TRACCAR_WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload: TraccarWebhookPayload = await request.json();
        const { event, device, position } = payload;

        if (!event || !device) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Classify severity and determine action
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let dispatchAlert = false;
        let trustScoreImpact = 0; // positive = good, negative = bad

        switch (event.type) {
            case 'sos':
                severity = 'critical';
                dispatchAlert = true;
                // SOS button pressed — this is a real emergency. Page dispatch immediately.
                break;

            case 'speedLimit':
                severity = 'warning';
                trustScoreImpact = -2; // Speeding with an oversize load is a major safety violation
                break;

            case 'hardBraking':
            case 'hardAcceleration':
            case 'hardCornering':
                severity = 'warning';
                trustScoreImpact = -1; // Aggressive driving degrades trust score
                break;

            case 'ignitionOn':
            case 'ignitionOff':
                severity = 'info';
                // Useful for HOS tracking: ignition on = shift start, off = shift end
                break;

            case 'geofenceEnter':
            case 'geofenceExit':
                severity = 'info';
                // Traccar's own geofences (supplementary to Mapbox Geofencing)
                break;

            case 'deviceOnline':
            case 'deviceOffline':
                severity = 'info';
                break;

            default:
                severity = 'info';
        }

        // Log the event to the telemetry table
        const { error: insertError } = await supabase
            .from('hc_telemetry_events')
            .insert({
                device_id: device.uniqueId,
                device_name: device.name,
                event_type: event.type,
                severity,
                latitude: position?.latitude || null,
                longitude: position?.longitude || null,
                speed_knots: position?.speed || null,
                speed_mph: position?.speed ? Math.round(position.speed * 1.15078) : null,
                address: position?.address || null,
                raw_payload: payload,
                trust_score_impact: trustScoreImpact,
                dispatch_alert: dispatchAlert,
                created_at: event.serverTime || new Date().toISOString(),
            });

        if (insertError) {
            console.error('[Traccar Events] Insert error:', insertError.message);
        }

        // If dispatch alert triggered, insert a notification
        if (dispatchAlert) {
            await supabase.from('hc_notifications').insert({
                type: 'sos_alert',
                title: `🚨 SOS: ${device.name}`,
                body: `Emergency SOS triggered by ${device.name} at ${position?.address || `${position?.latitude}, ${position?.longitude}`}`,
                severity: 'critical',
                metadata: {
                    device_id: device.uniqueId,
                    lat: position?.latitude,
                    lng: position?.longitude,
                },
            });
        }

        return NextResponse.json({
            success: true,
            event_type: event.type,
            severity,
            dispatch_alert: dispatchAlert,
            trust_score_impact: trustScoreImpact,
        });

    } catch (error) {
        console.error('[Traccar Events] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
