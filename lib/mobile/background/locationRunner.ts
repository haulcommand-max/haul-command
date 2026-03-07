/**
 * Haul Command — Background Location Runner
 *
 * Core logic for pinging location from background task context.
 * Requires a valid Supabase access token (stored securely per platform).
 */

import { Geolocation } from '@capacitor/geolocation';
import { createClient } from '@supabase/supabase-js';

export type PingPayload = {
    lat: number;
    lng: number;
    accuracy_m?: number;
    altitude_m?: number;
    speed_mps?: number;
    heading_deg?: number;
    is_moving?: boolean;
    device_id?: string;
    session_id?: string;
    occurred_at?: string;
};

/**
 * Execute a single location ping in background context.
 * Must run with a valid Supabase session token.
 */
export async function pingLocationNow(args: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    accessToken: string;
    deviceId?: string;
    sessionId?: string;
}) {
    const supabase = createClient(args.supabaseUrl, args.supabaseAnonKey, {
        global: {
            headers: { Authorization: `Bearer ${args.accessToken}` },
        },
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 15000,
    });

    const payload: PingPayload = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy ?? undefined,
        altitude_m: pos.coords.altitude ?? undefined,
        speed_mps: pos.coords.speed ?? undefined,
        heading_deg: pos.coords.heading ?? undefined,
        is_moving: (pos.coords.speed ?? 0) > 0.5,
        device_id: args.deviceId,
        session_id: args.sessionId,
        occurred_at: new Date(pos.timestamp).toISOString(),
    };

    const { data, error } = await supabase.rpc('hc_ping_location', {
        p_lat: payload.lat,
        p_lng: payload.lng,
        p_accuracy_m: payload.accuracy_m ?? null,
        p_altitude_m: payload.altitude_m ?? null,
        p_speed_mps: payload.speed_mps ?? null,
        p_heading_deg: payload.heading_deg ?? null,
        p_is_moving: payload.is_moving ?? true,
        p_source: 'background',
        p_device_id: payload.device_id ?? null,
        p_session_id: payload.session_id ?? null,
        p_occurred_at: payload.occurred_at ?? null,
    });

    if (error) throw new Error(error.message);
    return data;
}
