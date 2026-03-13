/**
 * HAUL COMMAND COMMS — Type Definitions
 *
 * Core types for the push-to-talk convoy communications system.
 * Transport: LiveKit WebRTC media (audio) + Supabase Realtime (signaling/control).
 */

// ── Channel & Role Types ─────────────────────────────────────────────────────

export type CommsChannelType =
    | 'job_channel'
    | 'convoy_channel'
    | 'lead_rear_private'
    | 'escort_only'
    | 'emergency';

export type CommsRole = 'lead' | 'rear' | 'escort' | 'driver' | 'observer';

export type CommsPlan = 'road_ready' | 'fast_lane';

/**
 * Ephemeral session state — NEVER persisted in Postgres.
 * Computed from transport health + Supabase Presence.
 */
export type CommsStatus = 'online' | 'nearby_only' | 'no_comms';

export type QuickCallType =
    | 'stop'
    | 'hold'
    | 'clear'
    | 'low_wire'
    | 'breakdown'
    | 'lane_move'
    | 'permit_issue';

export type PTTState = 'idle' | 'requesting' | 'talking' | 'blocked';

export type DeviceRoute = 'speaker' | 'earpiece' | 'wired_headset';

export type CommsEventType =
    | 'ptt_started'
    | 'ptt_stopped'
    | 'channel_joined'
    | 'channel_left'
    | 'quick_call_sent'
    | 'emergency_broadcast_sent';

// ── Data Structures ──────────────────────────────────────────────────────────

export interface CommsChannel {
    id: string;
    channel_type: CommsChannelType;
    source_id: string | null; // job/load FK
    display_name: string;
    livekit_room_name: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
}

export interface CommsMember {
    channel_id: string;
    user_id: string;
    display_name: string;
    role: CommsRole;
    is_muted: boolean;
    joined_at: string;
    left_at: string | null;
}

export interface QuickCall {
    id: string;
    channel_id: string;
    sender_id: string;
    sender_name: string;
    call_type: QuickCallType;
    sent_at: string;
}

export interface CommsPreferences {
    user_id: string;
    plan: CommsPlan;
    auto_join_job_channel: boolean;
    device_route: DeviceRoute;
    favorite_channel_ids: string[];
}

export interface CommsEvent {
    id: string;
    event_type: CommsEventType;
    channel_id: string | null;
    user_id: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

// ── Presence (ephemeral, via Supabase Realtime) ──────────────────────────────

export interface CommsPresenceMember {
    user_id: string;
    display_name: string;
    talking: boolean;
}

// ── Transport Abstraction ────────────────────────────────────────────────────

export type TransportConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export interface ICommsTransport {
    connect(roomName: string, token: string): Promise<void>;
    disconnect(): Promise<void>;
    startTransmit(): Promise<void>;
    stopTransmit(): Promise<void>;
    isSpeaking(): boolean;
    onRemoteAudio(cb: (userId: string, speaking: boolean) => void): void;
    onConnectionStateChange(cb: (state: TransportConnectionState) => void): void;
}

// ── Token Response ───────────────────────────────────────────────────────────

export interface CommsTokenResponse {
    token: string;
    room: string;
    wsUrl: string;
}
