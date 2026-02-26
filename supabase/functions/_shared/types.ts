// ============================================================================
// NAVIXY INTELLIGENCE LAYER — SHARED TYPES
// Common interfaces for all Navixy webhook handlers and intelligence systems.
// ============================================================================

/** Navixy tracker location update webhook payload */
export interface NavixyLocationUpdate {
    tracker_id: string;
    lat: number;
    lng: number;
    speed: number;         // km/h from Navixy (we convert to mph)
    heading: number;       // 0-360
    altitude: number;
    satellites: number;
    timestamp: string;     // ISO 8601
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
}

/** Navixy harsh event webhook payload */
export interface NavixyHarshEvent {
    tracker_id: string;
    event_type: 'harsh_brake' | 'harsh_accel' | 'collision' | 'rollover' | 'harsh_turn';
    event_id: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    g_force?: number;
    timestamp: string;
    video_available: boolean;
    tracker_label?: string;
}

/** Navixy geofence event webhook payload */
export interface NavixyGeofenceEvent {
    tracker_id: string;
    event_type: 'entered' | 'exited';
    geofence_id: string;
    geofence_name: string;
    lat: number;
    lng: number;
    speed: number;
    timestamp: string;
}

/** Navixy ignition event webhook payload */
export interface NavixyIgnitionEvent {
    tracker_id: string;
    event_type: 'ignition_on' | 'ignition_off';
    lat: number;
    lng: number;
    timestamp: string;
    geofence_id?: string;
    geofence_name?: string;
}

/** Standard response from intelligence functions */
export interface IntelligenceResponse {
    success: boolean;
    system: string;
    event_id?: string;
    alert_sent?: boolean;
    message: string;
    data?: Record<string, unknown>;
}

/** Deflection calculation result */
export interface DeflectionResult {
    deflection_inches: number;
    exceeds_threshold: boolean;
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    speed_mph: number;
    pole_height_ft: number;
    pole_stiffness: number;
}

/** VAPI outbound call request */
export interface VapiCallRequest {
    phone_number: string;    // E.164 format
    assistant_id: string;
    message: string;
    metadata?: Record<string, unknown>;
}

/** Evidence packet artifact */
export interface EvidenceArtifact {
    type: 'video' | 'speed_log' | 'gps_trail' | 'photo' | 'pdf';
    url: string;
    captured_at: string;
    metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// BRIDGE ENGINEERING MODULE TYPES (System 0d)
// ---------------------------------------------------------------------------

/** Bridge Engineering: Input for Bridge Formula Calculator */
export interface BridgeFormulaInput {
    axle_count: number;
    spacings_ft: number[];     // Distance between axle N and N+1
    weights_lbs: number[];     // Weight on each axle
    route_polyline?: string;   // Optional: Check specific route
    check_type: 'standard' | 'superload';
}

/** Bridge Engineering: Result of Formula B check */
export interface BridgeFormulaResult {
    is_compliant: boolean;
    total_weight_lbs: number;
    total_wheelbase_ft: number;
    max_formula_weight_lbs: number;

    // Violation details
    failed_groups: Array<{
        axles: string;         // e.g. "1-3"
        actual_weight: number;
        allowed_weight: number;
        formula_code: string;  // "Formula B" or state specific
    }>;

    // Route Analysis (if polyline provided)
    route_status?: {
        total_bridges: number;
        failed_bridges: Array<{
            asset_id: string;
            name: string;
            limit_lbs: number;
            rating_code: string;
        }>;
    };
}

/** Infrastructure Asset (Bridge / Crossing / Tunnel) */
export interface InfrastructureAsset {
    id: string;
    asset_type: 'bridge' | 'railroad_crossing' | 'tunnel';
    asset_ref_id: string;
    name: string;
    location: { lat: number; lng: number };
    state_code: string;
    attributes: Record<string, unknown>; // Flexible JSONB
}

/** Vehicle Schematic Data (for PDF Generation) */
export interface VehicleSchematic {
    vehicle_id: string;
    config_name: string;
    axles: Array<{
        number: number;
        dist_from_front_ft: number;
        weight_lbs: number;
        tire_count: number;
    }>;
    dimensions: {
        width_ft: number;
        length_ft: number;
        height_ft: number;
    };
}
