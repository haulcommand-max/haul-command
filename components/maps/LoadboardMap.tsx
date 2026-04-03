'use client';
/**
 * Haul Command — Loadboard Map Component (Mapbox GL)
 *
 * Real interactive map replacing the static SVG.
 * Fetches escort positions and load routes as GeoJSON from API.
 *
 * Requires: npm install react-map-gl mapbox-gl
 * And env: NEXT_PUBLIC_MAPBOX_TOKEN
 */

'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
// @ts-expect-error — react-map-gl v7 ships its own types; external @types are stale
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import type { GeoJSONFeatureCollection, BBox } from '@/lib/contracts/map';
import { MapboxDataSource } from '@/lib/mobile/MapboxDataSource';
import 'mapbox-gl/dist/mapbox-gl.css';

// ─── Design tokens (match load board dark theme) ──────────
const T = {
    gold: '#f5b942',
    green: '#27d17f',
    red: '#f87171',
    blue: '#3ba4ff',
} as const;

// ─── Props ────────────────────────────────────────────────
export type LoadboardMapProps = {
    initialViewState?: {
        longitude: number;
        latitude: number;
        zoom: number;
    };
    mapboxToken?: string;
    onEscortClick?: (userId: string) => void;
    onLoadClick?: (loadId: string) => void;
    /** Interval (ms) to auto-refresh escort positions */
    refreshInterval?: number;
    /** Force data source mode */
    dataSourceMode?: 'rpc' | 'api' | 'auto';
};

// ─── Layer styles ─────────────────────────────────────────
const ESCORT_CIRCLE_LAYER: any = {
    id: 'escorts-circle',
    type: 'circle',
    paint: {
        'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            4, 4,
            10, 8,
            14, 12,
        ],
        'circle-color': [
            'case',
            ['get', 'is_moving'], T.green,
            T.gold,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#0a0f16',
        'circle-opacity': ['coalesce', ['get', 'opacity'], 1],
    },
};

const ROUTE_LINE_LAYER: any = {
    id: 'load-routes-line',
    type: 'line',
    paint: {
        'line-color': [
            'match', ['get', 'urgency'],
            'hot', T.red,
            'warm', T.gold,
            T.blue,
        ],
        'line-width': 2.5,
        'line-opacity': 0.65,
        'line-dasharray': [4, 3],
    },
};

const ROUTE_ENDPOINT_LAYER: any = {
    id: 'load-routes-endpoints',
    type: 'circle',
    paint: {
        'circle-radius': 4,
        'circle-color': T.gold,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0a0f16',
    },
};

// ─── Component ────────────────────────────────────────────
export function LoadboardMap({
    initialViewState = { longitude: -98.5, latitude: 39.8, zoom: 4 },
    mapboxToken,
    onEscortClick,
    onLoadClick,
    refreshInterval = 30_000,
    dataSourceMode = 'auto',
}: LoadboardMapProps) {
    const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    const mapRef = useRef<any>(null);
    const [escorts, setEscorts] = useState<GeoJSONFeatureCollection | null>(null);
    const [routes, setRoutes] = useState<GeoJSONFeatureCollection | null>(null);
    const [sourceInfo, setSourceInfo] = useState<string>('');
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Memoize the data source so it persists across renders
    const dataSource = useMemo(
        () => new MapboxDataSource({ mode: dataSourceMode }),
        [dataSourceMode]
    );

    const fetchData = useCallback(async () => {
        const map = mapRef.current?.getMap?.() ?? mapRef.current;
        if (!map) return;
        const b = map.getBounds?.();
        if (!b) return;
        const bbox: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];

        try {
            const [escortResult, routeResult] = await Promise.allSettled([
                dataSource.fetchEscorts(bbox),
                dataSource.fetchLoadRoutes(bbox),
            ]);

            if (escortResult.status === 'fulfilled') {
                const data = escortResult.value.data;
                setEscorts(data);
                setSourceInfo(`${escortResult.value.source} (${escortResult.value.durationMs}ms)`);

                // Center clusters if data is sparse to avoid corner-bunching
                if (data.features.length > 0 && data.features.length <= 25 && map && !refreshTimer.current) {
                    try {
                        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
                        let valid = false;
                        for (const f of data.features) {
                            if (f.geometry?.type === 'Point' && f.geometry.coordinates) {
                                const [lng, lat] = f.geometry.coordinates as [number, number];
                                if (lng < minLng) minLng = lng;
                                if (lat < minLat) minLat = lat;
                                if (lng > maxLng) maxLng = lng;
                                if (lat > maxLat) maxLat = lat;
                                valid = true;
                            }
                        }
                        if (valid && minLng !== Infinity) {
                            // Only fitBounds if points are somewhat close (prevent snapping full globe)
                            if (Math.abs(maxLng - minLng) < 60 && Math.abs(maxLat - minLat) < 40) {
                                map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 8, duration: 1500 });
                            }
                        }
                    } catch {
                        /* Ignore bounds error */
                    }
                }
            }
            if (routeResult.status === 'fulfilled') {
                setRoutes(routeResult.value);
            }
        } catch {
            // Network error — keep stale data
        }
    }, [dataSource]);

    const handleLoad = useCallback(() => {
        fetchData();
        // Auto-refresh
        if (refreshTimer.current) clearInterval(refreshTimer.current);
        refreshTimer.current = setInterval(fetchData, refreshInterval);
    }, [fetchData, refreshInterval]);

    const handleClick = useCallback(
        (e: any) => {
            const features = e.features;
            if (!features?.length) return;
            const f = features[0];
            if (f.layer.id === 'escorts-circle' && onEscortClick) {
                onEscortClick(f.properties.user_id || f.properties.profile_id);
            }
            if (f.layer.id === 'load-routes-line' && onLoadClick) {
                onLoadClick(f.properties.load_id);
            }
        },
        [onEscortClick, onLoadClick]
    );

    if (!token) {
        return (
            <div
                style={{
                    background: '#0b0f14',
                    color: '#8fa3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 500,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 14,
                }}
            >
                Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 'clamp(420px, 70vh, 780px)', borderRadius: 16, overflow: 'hidden' }}>
            <Map
                ref={mapRef}
                initialViewState={initialViewState}
                mapboxAccessToken={token}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                onLoad={handleLoad}
                onMoveEnd={fetchData}
                onClick={handleClick}
                interactiveLayerIds={['escorts-circle', 'load-routes-line']}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {routes && (
                    <Source id="load-routes" type="geojson" data={routes as any}>
                        <Layer {...ROUTE_LINE_LAYER} />
                    </Source>
                )}

                {escorts && (
                    <Source id="escorts" type="geojson" data={escorts as any}>
                        <Layer {...ESCORT_CIRCLE_LAYER} />
                    </Source>
                )}
            </Map>
        </div>
    );
}
