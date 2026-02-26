import { NextRequest, NextResponse } from 'next/server';
import { captureIntelEvent, type IntelEventType } from '@/lib/intel/capture';

/**
 * POST /api/intel/crowd-report
 *
 * One-tap crowd intelligence submission.
 * Country-specific report types per the thinness plan.
 *
 * Body:
 *   report_type: string (from REPORT_TYPES[country])
 *   country_code: string
 *   region_code?: string
 *   corridor_slug?: string
 *   lat?: number
 *   lng?: number
 *   notes?: string
 *   session_id?: string
 *   profile_id?: string
 */

// ── Country-specific report types ──────────────────────────────────────────
// Ordered by P0 priority per thinness plan

const REPORT_TYPES: Record<string, { types: string[]; labels: Record<string, string> }> = {
    US: {
        types: ['permit_delay', 'low_bridge', 'route_denied', 'police_escort_required', 'construction_closure', 'checkpoint_delay'],
        labels: {
            permit_delay: 'Permit Office Delay',
            low_bridge: 'Low Bridge / Clearance Issue',
            route_denied: 'Route Denied / Reroute Required',
            police_escort_required: 'Police Escort Required',
            construction_closure: 'Construction Closure',
            checkpoint_delay: 'Checkpoint / Weigh Station Delay',
        },
    },
    CA: {
        types: ['permit_delay', 'low_bridge', 'route_denied', 'winter_road_closure', 'checkpoint_delay', 'border_delay'],
        labels: {
            permit_delay: 'Permit Office Delay',
            low_bridge: 'Low Bridge / Clearance Issue',
            route_denied: 'Route Denied / Reroute Required',
            winter_road_closure: 'Winter Road Closure',
            checkpoint_delay: 'Checkpoint Delay',
            border_delay: 'Border Crossing Delay',
        },
    },
    AU: {
        types: ['road_flooded', 'road_closed', 'remote_fuel_gap', 'wind_alert', 'low_bridge', 'mining_corridor_delay'],
        labels: {
            road_flooded: 'Road Flooded / Impassable',
            road_closed: 'Road Closed',
            remote_fuel_gap: 'Remote Fuel Gap Warning',
            wind_alert: 'High Wind / Turbine Movement Risk',
            low_bridge: 'Low Bridge / Clearance Issue',
            mining_corridor_delay: 'Mining Corridor Delay',
        },
    },
    GB: {
        types: ['low_bridge', 'movement_window_blocked', 'police_notification_required', 'urban_restriction', 'route_denied'],
        labels: {
            low_bridge: 'Low Bridge Alert',
            movement_window_blocked: 'Movement Window Blocked',
            police_notification_required: 'Police Notification Required',
            urban_restriction: 'Urban Restriction Zone',
            route_denied: 'Route Denied / Council Restriction',
        },
    },
    NZ: {
        types: ['mountain_pass_risk', 'wind_alert', 'narrow_bridge', 'ferry_delay', 'road_closed'],
        labels: {
            mountain_pass_risk: 'Mountain Pass Risk / Closure',
            wind_alert: 'Severe Wind Alert',
            narrow_bridge: 'Narrow Bridge / Tight Road',
            ferry_delay: 'Ferry Delay / Cancellation',
            road_closed: 'Road Closed',
        },
    },
    SE: {
        types: ['winter_road_risk', 'ice_condition', 'forestry_corridor_delay', 'wind_alert', 'road_closed'],
        labels: {
            winter_road_risk: 'Winter Road Risk',
            ice_condition: 'Ice Condition Warning',
            forestry_corridor_delay: 'Forestry Corridor Delay',
            wind_alert: 'Wind Alert / Turbine Zone',
            road_closed: 'Road Closed',
        },
    },
    NO: {
        types: ['tunnel_clearance', 'road_closed_ice', 'fjord_ferry_delay', 'wind_alert', 'movement_window_blocked'],
        labels: {
            tunnel_clearance: 'Tunnel Clearance Issue',
            road_closed_ice: 'Road Closed / Ice',
            fjord_ferry_delay: 'Fjord Ferry Delay',
            wind_alert: 'Wind / Storm Alert',
            movement_window_blocked: 'Movement Window Blocked',
        },
    },
    AE: {
        types: ['port_exit_delay', 'movement_window_blocked', 'checkpoint_delay', 'heat_risk', 'sandstorm_visibility'],
        labels: {
            port_exit_delay: 'Port Exit Delay',
            movement_window_blocked: 'Movement Window Blocked',
            checkpoint_delay: 'Checkpoint Delay',
            heat_risk: 'Extreme Heat Risk',
            sandstorm_visibility: 'Sandstorm / Low Visibility',
        },
    },
    SA: {
        types: ['heat_risk', 'desert_hazard', 'movement_window_blocked', 'checkpoint_delay', 'sandstorm_visibility'],
        labels: {
            heat_risk: 'Extreme Heat Risk',
            desert_hazard: 'Desert Hazard / Sand',
            movement_window_blocked: 'Movement Window / Holiday Block',
            checkpoint_delay: 'Checkpoint Delay',
            sandstorm_visibility: 'Sandstorm / Low Visibility',
        },
    },
    DE: {
        types: ['bridge_restriction', 'movement_window_blocked', 'route_denied', 'autobahn_restriction', 'permit_delay'],
        labels: {
            bridge_restriction: 'Bridge Engineering Restriction',
            movement_window_blocked: 'Movement Window Blocked',
            route_denied: 'Route Denied / Amendment Required',
            autobahn_restriction: 'Autobahn Restriction',
            permit_delay: 'VEMAGS Permit Delay',
        },
    },
    ZA: {
        types: ['security_concern', 'road_closed', 'payment_delay', 'mining_corridor_delay', 'port_exit_delay'],
        labels: {
            security_concern: 'Security Concern (Zone)',
            road_closed: 'Road Closed / Infrastructure Issue',
            payment_delay: 'Payment Delay Report',
            mining_corridor_delay: 'Mining Corridor Delay',
            port_exit_delay: 'Port Exit Delay',
        },
    },
};

// Map report types → intel event types for capture
const REPORT_TO_EVENT: Record<string, IntelEventType> = {
    permit_delay: 'permit_delay_reported',
    low_bridge: 'low_bridge_clearance',
    route_denied: 'route_denied_reroute',
    police_escort_required: 'police_escort_unexpected',
    checkpoint_delay: 'checkpoint_delay',
    movement_window_blocked: 'movement_window_blocked',
    road_flooded: 'checkpoint_delay',
    road_closed: 'checkpoint_delay',
    wind_alert: 'checkpoint_delay',
    mountain_pass_risk: 'checkpoint_delay',
    tunnel_clearance: 'low_bridge_clearance',
    port_exit_delay: 'checkpoint_delay',
    bridge_restriction: 'low_bridge_clearance',
    security_concern: 'checkpoint_delay',
    desert_hazard: 'checkpoint_delay',
    heat_risk: 'checkpoint_delay',
    sandstorm_visibility: 'checkpoint_delay',
    winter_road_risk: 'checkpoint_delay',
    ice_condition: 'checkpoint_delay',
    road_closed_ice: 'checkpoint_delay',
    narrow_bridge: 'low_bridge_clearance',
    ferry_delay: 'checkpoint_delay',
    fjord_ferry_delay: 'checkpoint_delay',
    border_delay: 'checkpoint_delay',
    construction_closure: 'checkpoint_delay',
    urban_restriction: 'movement_window_blocked',
    police_notification_required: 'police_escort_unexpected',
    remote_fuel_gap: 'checkpoint_delay',
    mining_corridor_delay: 'checkpoint_delay',
    forestry_corridor_delay: 'checkpoint_delay',
    autobahn_restriction: 'movement_window_blocked',
    payment_delay: 'office_slowdown',
};

// ── Anti-spam: per-profile rate limiter (in-memory for now) ────────────────
const rateLimits = new Map<string, { count: number; day: string }>();
const MAX_REPORTS_PER_DAY = 25;

function checkRateLimit(profileId: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const entry = rateLimits.get(profileId);
    if (!entry || entry.day !== today) {
        rateLimits.set(profileId, { count: 1, day: today });
        return true;
    }
    if (entry.count >= MAX_REPORTS_PER_DAY) return false;
    entry.count++;
    return true;
}

// ── GET: returns available report types for a country ──────────────────────
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const country = url.searchParams.get('country')?.toUpperCase() || 'US';
    const config = REPORT_TYPES[country] || REPORT_TYPES.US;

    return NextResponse.json({
        country_code: country,
        report_types: config.types.map((t) => ({
            type: t,
            label: config.labels[t] || t,
        })),
    });
}

// ── POST: submit a crowd report ───────────────────────────────────────────
export async function POST(req: NextRequest) {
    const body = await req.json();

    const { report_type, country_code, region_code, corridor_slug, lat, lng, notes, session_id, profile_id } = body;

    if (!report_type || !country_code) {
        return NextResponse.json({ error: 'report_type and country_code required' }, { status: 400 });
    }

    // Validate report type for country
    const config = REPORT_TYPES[country_code.toUpperCase()] || REPORT_TYPES.US;
    if (!config.types.includes(report_type)) {
        return NextResponse.json({
            error: `Invalid report_type "${report_type}" for ${country_code}`,
            valid_types: config.types,
        }, { status: 400 });
    }

    // Rate limit check
    if (profile_id && !checkRateLimit(profile_id)) {
        return NextResponse.json({ error: 'Rate limit exceeded (25/day)' }, { status: 429 });
    }

    // Map to event type and capture
    const eventType = REPORT_TO_EVENT[report_type] || 'checkpoint_delay';

    await captureIntelEvent({
        eventType,
        countryCode: country_code.toUpperCase(),
        regionCode: region_code || undefined,
        corridorSlug: corridor_slug || undefined,
        payload: {
            original_report_type: report_type,
            label: config.labels[report_type],
            lat: lat || null,
            lng: lng || null,
            notes: notes || null,
            value: 1,
        },
        sessionId: session_id || undefined,
        profileId: profile_id || undefined,
    });

    return NextResponse.json({
        status: 'received',
        report_type,
        country_code: country_code.toUpperCase(),
        message: 'Thank you — your report improves intelligence for all operators',
    });
}
