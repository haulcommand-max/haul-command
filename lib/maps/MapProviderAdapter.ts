/**
 * lib/maps/MapProviderAdapter.ts
 *
 * Abstraction interface for all map providers used by Haul Command.
 *
 * Architecture rule (locked): HERE is the primary heavy-haul routing engine.
 * This adapter allows provider swaps without touching product logic.
 *
 * Supported today:   HERE
 * Planned (Phase 2): Mapbox, OSM self-hosted
 *
 * Usage:
 *   const adapter = new HereMapAdapter(config);
 *   const route = await adapter.getRoute(origin, destination, options);
 */

// ── Core types ─────────────────────────────────────────────────────────────────

export interface LatLng {
    lat: number;
    lng: number;
}

export interface RouteOptions {
    /** Vehicle type — affects road restrictions and height/weight limits */
    vehicleType?: "truck" | "heavy_haul" | "escort" | "car";
    /** Gross vehicle weight in lbs */
    grossWeightLbs?: number;
    /** Vehicle height in feet */
    heightFt?: number;
    /** Vehicle width in feet */
    widthFt?: number;
    /** Avoid toll roads */
    avoidTolls?: boolean;
    /** Avoid highways */
    avoidHighways?: boolean;
    /** Waypoints along route */
    waypoints?: LatLng[];
}

export interface RouteResult {
    /** Polyline as [lat,lng] pairs */
    polyline: LatLng[];
    /** Total distance in miles */
    distanceMiles: number;
    /** Estimated duration in minutes */
    durationMinutes: number;
    /** Turn-by-turn instructions */
    instructions?: RouteInstruction[];
    /** Provider that computed this route */
    provider: MapProvider;
    /** Raw provider response (for debugging / data exhaust) */
    raw?: unknown;
}

export interface RouteInstruction {
    text: string;
    distanceMiles: number;
    maneuver?: string;
}

export interface GeocodeResult {
    latLng: LatLng;
    formattedAddress: string;
    confidence: number;  // 0–1
    provider: MapProvider;
}

export interface TelemetryEvent {
    event: MapTelemetryEventName;
    provider: MapProvider;
    durationMs?: number;
    corridorSlug?: string;
    zoomLevel?: number;
    metadata?: Record<string, unknown>;
}

// ── Event names (telemetry data moat) ─────────────────────────────────────────

export type MapTelemetryEventName =
    | "route_requested"
    | "route_completed"
    | "route_abandoned"
    | "corridor_viewed"
    | "escort_density_viewed"
    | "map_zoom_level_changed"
    | "reroute_triggered"
    | "overlay_toggled"
    | "geocode_requested";

// ── Provider names ─────────────────────────────────────────────────────────────

export type MapProvider = "HERE" | "Mapbox" | "OSM";

// ── Core interface — implement for each provider ───────────────────────────────

export interface MapProviderAdapter {
    readonly provider: MapProvider;

    /**
     * Compute a heavy-haul route between two points.
     * Returns null on failure — callers must handle gracefully.
     */
    getRoute(
        origin: LatLng,
        destination: LatLng,
        options?: RouteOptions
    ): Promise<RouteResult | null>;

    /**
     * Convert an address string to coordinates.
     */
    geocode(address: string): Promise<GeocodeResult | null>;

    /**
     * Reverse geocode coordinates to a human-readable address.
     */
    reverseGeocode(latLng: LatLng): Promise<GeocodeResult | null>;

    /**
     * Emit a telemetry event to Supabase.
     * Non-blocking — implementations should fire-and-forget.
     */
    trackEvent(event: TelemetryEvent): void;
}

// ── Provider registry — add new entries as providers are implemented ───────────

export const ACTIVE_PROVIDERS: Record<MapProvider, { available: boolean; notes: string }> = {
    HERE: { available: true, notes: "Primary heavy-haul routing engine. System of record." },
    Mapbox: { available: false, notes: "Phase 2 — for tile rendering and geocoding fallback." },
    OSM: { available: false, notes: "Phase 2 — self-hosted tiles for offline/cost reduction." },
};

/**
 * The platform MUST always have a primary routing provider.
 * This constant is the enforced system of record.
 */
export const PRIMARY_ROUTING_PROVIDER: MapProvider = "HERE";
