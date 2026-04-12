/**
 * Haul Command — MapboxDataSource
 *
 * Intelligent data source layer that swaps between:
 *   - RPC (Supabase direct) → fast, native mobile, authenticated
 *   - /api route (proxy)    → web, unauthenticated / server-scoped
 *
 * Decision matrix:
 *   Native + Auth  → RPC (hc_geojson_escorts_in_bbox)
 *   Web + Auth     → RPC (faster than going through /api proxy)
 *   Web + No Auth  → /api/map/escorts (proxy, uses service_role)
 *   Fallback       → /api/map/escorts (always works)
 */

import { createClient } from '@/utils/supabase/client';
import { isNativePlatform } from '@/lib/mobile/platform';
import type { GeoJSONFeatureCollection, BBox } from '@/lib/contracts/map';

// ─── Types ────────────────────────────────────────────────
export type DataSourceMode = 'rpc' | 'api' | 'auto';

export interface MapboxDataSourceOptions {
    /** Force a specific mode instead of auto-detecting */
    mode?: DataSourceMode;
    /** Radius (km) for broker escort visibility (default: 150) */
    loadRadiusKm?: number;
    /** Max results (default: 500) */
    limit?: number;
    /** Custom API base URL */
    apiBase?: string;
    /** State filter for legacy escort_presence fallback */
    stateFilter?: string;
}

interface FetchResult {
    data: GeoJSONFeatureCollection;
    source: 'rpc' | 'api';
    durationMs: number;
}

// ─── Singleton auth state cache ───────────────────────────
let _cachedAuthState: { authenticated: boolean; checkedAt: number } | null = null;
const AUTH_CACHE_TTL = 30_000; // 30s

async function isAuthenticated(): Promise<boolean> {
    if (_cachedAuthState && Date.now() - _cachedAuthState.checkedAt < AUTH_CACHE_TTL) {
        return _cachedAuthState.authenticated;
    }

    try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const authed = !!data.session?.access_token;
        _cachedAuthState = { authenticated: authed, checkedAt: Date.now() };
        return authed;
    } catch {
        _cachedAuthState = { authenticated: false, checkedAt: Date.now() };
        return false;
    }
}

// ─── Resolve mode ─────────────────────────────────────────
async function resolveMode(requested: DataSourceMode): Promise<'rpc' | 'api'> {
    if (requested === 'rpc') return 'rpc';
    if (requested === 'api') return 'api';

    // Auto-detect
    const authed = await isAuthenticated();

    // If authenticated (native or web) → use RPC for role-aware filtering
    if (authed) return 'rpc';

    // Unauthenticated → must use the API proxy (it uses service_role)
    return 'api';
}

// ─── Fetch via RPC ────────────────────────────────────────
async function fetchViaRPC(
    bbox: BBox,
    loadRadiusKm: number,
    limit: number
): Promise<GeoJSONFeatureCollection> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('hc_geojson_escorts_in_bbox', {
        p_min_lng: bbox[0],
        p_min_lat: bbox[1],
        p_max_lng: bbox[2],
        p_max_lat: bbox[3],
        p_load_radius_km: loadRadiusKm,
        p_limit: limit,
    });

    if (error) throw new Error(`RPC error: ${error.message}`);

    return (data as GeoJSONFeatureCollection) ?? {
        type: 'FeatureCollection',
        features: [],
    };
}

// ─── Fetch via API ────────────────────────────────────────
async function fetchViaAPI(
    bbox: BBox,
    apiBase: string,
    limit: number,
    stateFilter?: string
): Promise<GeoJSONFeatureCollection> {
    const params = new URLSearchParams({
        bbox: bbox.join(','),
        limit: String(limit),
    });
    if (stateFilter) params.set('state', stateFilter);

    const res = await fetch(`${apiBase}/api/map/escorts?${params}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    return res.json();
}

// ─── Main data source class ──────────────────────────────
export class MapboxDataSource {
    private options: Required<Omit<MapboxDataSourceOptions, 'stateFilter'>> & { stateFilter?: string };
    private lastFetch: FetchResult | null = null;

    constructor(opts: MapboxDataSourceOptions = {}) {
        this.options = {
            mode: opts.mode ?? 'auto',
            loadRadiusKm: opts.loadRadiusKm ?? 150,
            limit: opts.limit ?? 500,
            apiBase: opts.apiBase ?? '',
            stateFilter: opts.stateFilter,
        };
    }

    /**
     * Fetch escort positions for the given bounding box.
     * Automatically selects the best data source.
     */
    async fetchEscorts(bbox: BBox): Promise<FetchResult> {
        const mode = await resolveMode(this.options.mode);
        const start = performance.now();

        let data: GeoJSONFeatureCollection;
        let actualSource: 'rpc' | 'api' = mode;

        try {
            if (mode === 'rpc') {
                data = await fetchViaRPC(bbox, this.options.loadRadiusKm, this.options.limit);
            } else {
                data = await fetchViaAPI(bbox, this.options.apiBase, this.options.limit, this.options.stateFilter);
            }
        } catch (primaryErr) {
            // Fallback: if RPC fails, try API; if API fails, try RPC
            console.warn(`[data-source] ${mode} failed, falling back:`, primaryErr);
            try {
                if (mode === 'rpc') {
                    data = await fetchViaAPI(bbox, this.options.apiBase, this.options.limit, this.options.stateFilter);
                    actualSource = 'api';
                } else {
                    data = await fetchViaRPC(bbox, this.options.loadRadiusKm, this.options.limit);
                    actualSource = 'rpc';
                }
            } catch (fallbackErr) {
                // Both failed — return empty FC
                console.error('[data-source] Both sources failed:', fallbackErr);
                data = { type: 'FeatureCollection', features: [] };
            }
        }

        const durationMs = Math.round(performance.now() - start);
        this.lastFetch = { data, source: actualSource, durationMs };
        return this.lastFetch;
    }

    /**
     * Fetch load routes for the given bounding box.
     * Always uses API (load routes are currently stub-only via API proxy).
     */
    async fetchLoadRoutes(bbox: BBox): Promise<GeoJSONFeatureCollection> {
        try {
            const params = new URLSearchParams({ bbox: bbox.join(',') });
            const res = await fetch(`${this.options.apiBase}/api/map/load-routes?${params}`);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            return res.json();
        } catch {
            return { type: 'FeatureCollection', features: [] };
        }
    }

    /**
     * Fetch escort positions scoped to a specific load.
     * Uses RLS-enforced RPC: broker sees only assigned escorts with:
     *   - active assignment for this load_id
     *   - can_view_live_location = true
     *   - escort availability ON
     *   - within time window (starts_at..ends_at)
     */
    async fetchEscortsForLoad(
        loadId: string,
        bbox: BBox,
        opts?: { limit?: number; maxAgeSeconds?: number }
    ): Promise<FetchResult> {
        const limit = opts?.limit ?? 200;
        const maxAgeSeconds = opts?.maxAgeSeconds ?? 120;
        const start = performance.now();

        try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc('hc_geojson_escorts_for_load_in_bbox', {
                p_load_id: loadId,
                p_min_lng: bbox[0],
                p_min_lat: bbox[1],
                p_max_lng: bbox[2],
                p_max_lat: bbox[3],
                p_limit: limit,
                p_max_age_seconds: maxAgeSeconds,
            });

            if (error) throw new Error(`RPC error: ${error.message}`);

            const fc = (data as GeoJSONFeatureCollection) ?? { type: 'FeatureCollection', features: [] };
            const durationMs = Math.round(performance.now() - start);
            return { data: fc, source: 'rpc', durationMs };
        } catch (err) {
            console.error('[data-source] fetchEscortsForLoad failed:', err);
            const durationMs = Math.round(performance.now() - start);
            return { data: { type: 'FeatureCollection', features: [] }, source: 'rpc', durationMs };
        }
    }

    /** Get info about the last fetch (source used, latency) */
    getLastFetchInfo(): FetchResult | null {
        return this.lastFetch;
    }

    /** Force clear the auth cache (call after login/logout) */
    invalidateAuthCache(): void {
        _cachedAuthState = null;
    }

    /** Update options (e.g., after entitlements change) */
    setOptions(opts: Partial<MapboxDataSourceOptions>): void {
        if (opts.mode !== undefined) this.options.mode = opts.mode;
        if (opts.loadRadiusKm !== undefined) this.options.loadRadiusKm = opts.loadRadiusKm;
        if (opts.limit !== undefined) this.options.limit = opts.limit;
        if (opts.apiBase !== undefined) this.options.apiBase = opts.apiBase;
        if (opts.stateFilter !== undefined) this.options.stateFilter = opts.stateFilter;
    }

    // ─── HYBRID ARCHITECTURE: Traccar Telemetry & Custom GPS ─────────

    /**
     * Pulls raw Traccar JSON pings and converts them instantly to GeoJSON for Mapbox.
     * Maps Traccar `device_id` to Haul Command `operator_id`.
     */
    async fetchTraccarEscorts(deviceGroup: string = 'live_map'): Promise<GeoJSONFeatureCollection> {
        const start = performance.now();
        try {
            // Note: In production, proxy this via Next.js API to inject Traccar API key
            // This allows us to bypass Mapbox telemetry charges fully.
            const params = new URLSearchParams({ group: deviceGroup });
            const res = await fetch(`${this.options.apiBase}/api/telemetry/traccar/devices?${params}`);
            if (!res.ok) throw new Error(`Traccar API error: ${res.status}`);
            
            const traccarDevices = await res.json();
            
            // Map Traccar output specifically to Mapbox GL Compatible FeatureCollection
            const features = traccarDevices.map((device: any) => ({
                type: 'Feature',
                properties: {
                    user_id: device.uniqueId,
                    is_moving: device.speed > 2.0,
                    heading: device.course,
                    status: device.status,
                },
                geometry: {
                    type: 'Point',
                    coordinates: [device.longitude, device.latitude],
                }
            }));

            this.lastFetch = {
                data: { type: 'FeatureCollection', features },
                source: 'api',
                durationMs: Math.round(performance.now() - start),
            };
            return this.lastFetch.data;
        } catch (err) {
            console.error('[TraccarDataSource] fetchTraccarEscorts failed:', err);
            return { type: 'FeatureCollection', features: [] };
        }
    }

    /**
     * Executes the Haul Command proprietary Heavy-Haul Geofence & Safe-Route Generator.
     * Prevents oversized loads from being routed under low bridges (defeating standard Google Maps limits).
     */
    async fetchCustomSafeRoute(origin: [number, number], destination: [number, number], loadSpecs?: any): Promise<GeoJSONFeatureCollection> {
        try {
            // Calls the internal Custom GPS engine
            const payload = {
                origin,
                destination,
                width: loadSpecs?.width ?? 8.5,
                height: loadSpecs?.height ?? 13.5,
                weight: loadSpecs?.weight ?? 80000
            };
            
            const res = await fetch(`${this.options.apiBase}/api/map/custom-route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) throw new Error(`Custom Routing API error: ${res.status}`);
            const geojson = await res.json();
            return geojson;
        } catch (err) {
            console.error('[CustomGPSDataSource] fetchCustomSafeRoute failed:', err);
            return { type: 'FeatureCollection', features: [] };
        }
    }
}

// ─── Convenience: pre-configured singleton ────────────────
let _defaultSource: MapboxDataSource | null = null;

export function getDefaultMapDataSource(): MapboxDataSource {
    if (!_defaultSource) {
        _defaultSource = new MapboxDataSource({ mode: 'auto' });
    }
    return _defaultSource;
}
