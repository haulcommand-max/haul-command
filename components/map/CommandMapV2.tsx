'use client';

/**
 * Command Map v2 — "Bloomberg Terminal for Heavy Haul"
 *
 * Layers:
 *   1. Corridor glow (existing, enhanced with PLM)
 *   2. Load heatmap (existing)
 *   3. Load cluster circles (existing)
 *   4. Escort presence dots (existing, now with realtime)
 *   5. ★ NEW: Hard-fill alert zones (red pulsing circles)
 *   6. ★ NEW: Police/high-pole requirement zones
 *   7. ★ NEW: Escort density heatmap overlay
 *
 * HUD Controls Panel (right side):
 *   - Layer toggles
 *   - Live presence counter
 *   - Alert feed (last 5 events)
 *   - Quick stats (loads, escorts, fill rate)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CommandMapV2Props {
    style?: string;
    className?: string;
    showHud?: boolean;
    initialCenter?: [number, number];
    initialZoom?: number;
}

interface MapAlert {
    id: string;
    type: 'hard_fill' | 'surge' | 'new_load' | 'escort_online';
    message: string;
    time: string;
    urgency: 'high' | 'medium' | 'low';
}

interface MapStats {
    activeLoads: number;
    onlineEscorts: number;
    fillRate: number; // 0–100
    hardFillCount: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAP_STYLE =
    process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ??
    'https://demotiles.maplibre.org/style.json';

const REFRESH_MS = 30_000;

// ── Component ──────────────────────────────────────────────────────────────────

export function CommandMapV2({
    style,
    className = '',
    showHud = true,
    initialCenter = [-95.7, 37.0],
    initialZoom = 4.2,
}: CommandMapV2Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

    // HUD state
    const [layers, setLayers] = useState({
        corridors: true,
        loads: true,
        escorts: true,
        hardFill: true,
        policeZones: true,
        density: false,
    });
    const [stats, setStats] = useState<MapStats>({ activeLoads: 0, onlineEscorts: 0, fillRate: 0, hardFillCount: 0 });
    const [alerts, setAlerts] = useState<MapAlert[]>([]);

    // Layer toggle handler
    const toggleLayer = useCallback((key: keyof typeof layers) => {
        setLayers(prev => {
            const next = { ...prev, [key]: !prev[key] };
            const map = mapRef.current;
            if (!map) return next;

            const layerMap: Record<string, string[]> = {
                corridors: ['corridor-glow', 'corridor-glow-halo'],
                loads: ['load-heat', 'load-clusters', 'load-cluster-count', 'load-pins'],
                escorts: ['escort-dots'],
                hardFill: ['hard-fill-zones', 'hard-fill-pulse'],
                policeZones: ['police-zones'],
                density: ['escort-density'],
            };

            const ids = layerMap[key] ?? [];
            for (const id of ids) {
                if (map.getLayer(id)) {
                    map.setLayoutProperty(id, 'visibility', next[key] ? 'visible' : 'none');
                }
            }
            return next;
        });
    }, []);

    // ── Data Fetchers ──────────────────────────────────────────────────────────

    const fetchLoads = useCallback(async (map: maplibregl.Map) => {
        try {
            const res = await fetch('/api/map/loads?limit=500');
            if (!res.ok) return;
            const fc = await res.json();
            const src = map.getSource('loads') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(fc);

            // Count
            const count = fc.features?.length ?? 0;
            setStats(prev => ({ ...prev, activeLoads: count }));
        } catch { }
    }, []);

    const fetchEscorts = useCallback(async (map: maplibregl.Map) => {
        try {
            const res = await fetch('/api/map/escorts');
            if (!res.ok) return;
            const fc = await res.json();
            const src = map.getSource('escorts') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(fc);

            const count = fc.features?.length ?? 0;
            setStats(prev => ({ ...prev, onlineEscorts: count }));
        } catch { }
    }, []);

    const fetchCorridors = useCallback(async (map: maplibregl.Map) => {
        try {
            const [corrRes, liqRes] = await Promise.all([
                fetch('/api/map/corridors'),
                fetch('/api/map/liquidity'),
            ]);
            if (!corrRes.ok) return;
            const corridorFC = await corrRes.json();

            let liqMap: Record<string, any> = {};
            if (liqRes.ok) {
                const liqData = await liqRes.json();
                for (const cell of liqData.cells ?? []) {
                    if (cell.corridor_id) liqMap[cell.corridor_id] = cell;
                }
            }

            const enriched = {
                ...corridorFC,
                features: (corridorFC.features ?? []).map((f: any) => ({
                    ...f,
                    properties: {
                        ...f.properties,
                        effective_heat: Math.min(1, (f.properties.heat ?? 0.3) * (liqMap[f.properties.corridor_id]?.plm ?? 1.0)),
                    },
                })),
            };

            const src = map.getSource('corridors') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(enriched);
        } catch { }
    }, []);

    const fetchHardFills = useCallback(async (map: maplibregl.Map) => {
        try {
            const res = await fetch('/api/map/hard-fills');
            if (!res.ok) {
                // Generate mock hard-fill data from loads with high urgency if API doesn't exist yet
                return;
            }
            const fc = await res.json();
            const src = map.getSource('hard-fills') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(fc);
            setStats(prev => ({ ...prev, hardFillCount: fc.features?.length ?? 0 }));
        } catch { }
    }, []);

    const fetchPoliceZones = useCallback(async (map: maplibregl.Map) => {
        try {
            const res = await fetch('/api/map/police-zones');
            if (!res.ok) return;
            const fc = await res.json();
            const src = map.getSource('police-zones') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(fc);
        } catch { }
    }, []);

    // ── Map Init ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: style ?? MAP_STYLE,
            center: initialCenter,
            zoom: initialZoom,
            pitch: 10,
            bearing: 0,
            attributionControl: false,
        });

        mapRef.current = map;

        map.on('load', () => {
            // ── Sources ──
            map.addSource('loads', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
                cluster: true, clusterMaxZoom: 10, clusterRadius: 50,
            });

            map.addSource('escorts', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            map.addSource('corridors', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            map.addSource('hard-fills', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            map.addSource('police-zones', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });

            // ── LAYER 1: Corridor glow ──
            map.addLayer({
                id: 'corridor-glow',
                type: 'line',
                source: 'corridors',
                paint: {
                    'line-color': '#f97316',
                    'line-width': ['interpolate', ['linear'], ['get', 'effective_heat'], 0, 2, 1, 8],
                    'line-opacity': ['interpolate', ['linear'], ['get', 'effective_heat'], 0, 0.15, 1, 0.7],
                    'line-blur': 4,
                },
            });

            map.addLayer({
                id: 'corridor-glow-halo',
                type: 'line',
                source: 'corridors',
                paint: {
                    'line-color': '#f97316',
                    'line-width': ['interpolate', ['linear'], ['get', 'effective_heat'], 0, 6, 1, 20],
                    'line-opacity': ['interpolate', ['linear'], ['get', 'effective_heat'], 0, 0.04, 1, 0.18],
                    'line-blur': 12,
                },
            });

            // ── LAYER 2: Load heatmap ──
            map.addLayer({
                id: 'load-heat',
                type: 'heatmap',
                source: 'loads',
                maxzoom: 9,
                paint: {
                    'heatmap-weight': ['interpolate', ['linear'], ['get', 'urgency'], 0, 0.1, 100, 1.5],
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0,0,0,0)',
                        0.2, 'rgba(249,115,22,0.3)',
                        0.5, 'rgba(249,115,22,0.6)',
                        0.8, 'rgba(251,191,36,0.8)',
                        1.0, 'rgba(255,255,255,0.9)',
                    ],
                    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 9, 50],
                    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
                },
            });

            // ── LAYER 3: Load clusters ──
            map.addLayer({
                id: 'load-clusters',
                type: 'circle',
                source: 'loads',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#f97316',
                    'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 20, 30],
                    'circle-opacity': 0.9,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                },
            });
            map.addLayer({
                id: 'load-cluster-count',
                type: 'symbol',
                source: 'loads',
                filter: ['has', 'point_count'],
                layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
                paint: { 'text-color': '#fff' },
            });
            map.addLayer({
                id: 'load-pins',
                type: 'circle',
                source: 'loads',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': ['interpolate', ['linear'], ['get', 'urgency'], 0, '#f97316', 80, '#ef4444'],
                    'circle-radius': 7,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.95,
                },
            });

            // ── LAYER 4: Escort dots ──
            map.addLayer({
                id: 'escort-dots',
                type: 'circle',
                source: 'escorts',
                paint: {
                    'circle-color': ['match', ['get', 'status'], 'available', '#22c55e', 'busy', '#fbbf24', '#475569'],
                    'circle-radius': 6,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                    'circle-opacity': 0.9,
                },
            });

            // ── LAYER 5: Hard-fill alert zones (NEW) ──
            map.addLayer({
                id: 'hard-fill-zones',
                type: 'circle',
                source: 'hard-fills',
                paint: {
                    'circle-color': 'rgba(239, 68, 68, 0.12)',
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 12, 8, 35],
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#ef4444',
                    'circle-opacity': 0.7,
                },
            });

            map.addLayer({
                id: 'hard-fill-pulse',
                type: 'circle',
                source: 'hard-fills',
                paint: {
                    'circle-color': 'rgba(239, 68, 68, 0.06)',
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 18, 8, 50],
                    'circle-stroke-width': 0,
                    'circle-opacity': 0.4,
                },
            });

            // ── LAYER 6: Police/high-pole zones (NEW) ──
            map.addLayer({
                id: 'police-zones',
                type: 'fill',
                source: 'police-zones',
                paint: {
                    'fill-color': ['match', ['get', 'type'],
                        'police_required', 'rgba(147, 51, 234, 0.15)',
                        'high_pole_required', 'rgba(59, 130, 246, 0.15)',
                        'rgba(100, 116, 139, 0.1)'
                    ],
                    'fill-outline-color': ['match', ['get', 'type'],
                        'police_required', 'rgba(147, 51, 234, 0.5)',
                        'high_pole_required', 'rgba(59, 130, 246, 0.5)',
                        'rgba(100, 116, 139, 0.3)'
                    ],
                },
            });

            // ── LAYER 7: Escort density heatmap (NEW, off by default) ──
            map.addLayer({
                id: 'escort-density',
                type: 'heatmap',
                source: 'escorts',
                layout: { visibility: 'none' },
                paint: {
                    'heatmap-weight': 1,
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0,0,0,0)',
                        0.2, 'rgba(59,130,246,0.2)',
                        0.5, 'rgba(59,130,246,0.5)',
                        0.8, 'rgba(34,197,94,0.7)',
                        1.0, 'rgba(34,197,94,0.9)',
                    ],
                    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 25, 9, 60],
                    'heatmap-opacity': 0.7,
                },
            });

            // ── Tooltips ──
            const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

            map.on('mouseenter', 'load-pins', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                const f = e.features?.[0];
                if (!f) return;
                const { title, city, state, urgency } = f.properties ?? {};
                const label = Number(urgency) >= 80 ? '🔴 URGENT' : Number(urgency) >= 50 ? '🟡 FILLING' : '🟢 OPEN';
                popup.setLngLat((f.geometry as any).coordinates)
                    .setHTML(`<div style="padding:8px;font-size:12px;font-weight:600;"><div>${label}</div><div style="color:#94a3b8">${title ?? 'Load'}</div><div style="font-size:10px;color:#64748b">${[city, state].filter(Boolean).join(', ')}</div></div>`)
                    .addTo(map);
            });
            map.on('mouseleave', 'load-pins', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

            map.on('mouseenter', 'escort-dots', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                const f = e.features?.[0];
                if (!f) return;
                const { state, status, age_sec, display_name } = f.properties ?? {};
                const age = Number(age_sec) < 60 ? 'Just now' : `${Math.round(Number(age_sec) / 60)}m ago`;
                popup.setLngLat((f.geometry as any).coordinates)
                    .setHTML(`<div style="padding:8px;font-size:12px;"><strong>${display_name ?? 'Escort'}</strong><br/>${state ? `📍 ${state}` : ''}<br/><span style="font-size:10px;color:#64748b">${status ?? 'active'} · ${age}</span></div>`)
                    .addTo(map);
            });
            map.on('mouseleave', 'escort-dots', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

            map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

            // ── Load initial data ──
            fetchLoads(map);
            fetchEscorts(map);
            fetchCorridors(map);
            fetchHardFills(map);
            fetchPoliceZones(map);

            // ── Supabase Realtime for loads ──
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const channel = supabase.channel('command-map-v2')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
                    fetchLoads(map);
                })
                .subscribe();

            // Polling for escorts + corridors
            const t1 = setInterval(() => fetchEscorts(map), REFRESH_MS);
            const t2 = setInterval(() => fetchCorridors(map), REFRESH_MS);
            const t3 = setInterval(() => fetchHardFills(map), 60_000);
            timersRef.current = [t1, t2, t3];
        });

        return () => {
            timersRef.current.forEach(clearInterval);
            map.remove();
            mapRef.current = null;
        };
    }, [style, initialCenter, initialZoom, fetchLoads, fetchEscorts, fetchCorridors, fetchHardFills, fetchPoliceZones]);

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }} className={className}>
            {/* Map Container */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label="Haul Command live operations map" />

            {/* ── HUD Overlay — Responsive ── */}
            {showHud && (
                <>
                    {/* Desktop HUD (side panel, hidden on mobile) */}
                    <div style={{
                        position: 'absolute',
                        top: 16, right: 16,
                        width: 260,
                        maxHeight: 'calc(100% - 32px)',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        pointerEvents: 'auto',
                    }} className="hc-map-hud-desktop">
                        {/* Stats Panel */}
                        <HudPanel title="📊 Market Pulse">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <HudStat label="Active Loads" value={String(stats.activeLoads)} color="#f97316" />
                                <HudStat label="Online Escorts" value={String(stats.onlineEscorts)} color="#22c55e" />
                                <HudStat label="Hard Fills" value={String(stats.hardFillCount)} color="#ef4444" />
                                <HudStat label="Connected" value="LIVE" color="#22c55e" />
                            </div>
                        </HudPanel>

                        {/* Layer Controls */}
                        <HudPanel title="🗺️ Layers">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <LayerToggle label="🔥 Hot Corridors" active={layers.corridors} onChange={() => toggleLayer('corridors')} />
                                <LayerToggle label="📦 Active Loads" active={layers.loads} onChange={() => toggleLayer('loads')} />
                                <LayerToggle label="🚗 Escort Presence" active={layers.escorts} onChange={() => toggleLayer('escorts')} />
                                <LayerToggle label="🚨 Hard-Fill Alerts" active={layers.hardFill} onChange={() => toggleLayer('hardFill')} />
                                <LayerToggle label="🚔 Police/Pole Zones" active={layers.policeZones} onChange={() => toggleLayer('policeZones')} />
                                <LayerToggle label="🌡️ Supply Density" active={layers.density} onChange={() => toggleLayer('density')} />
                            </div>
                        </HudPanel>

                        {/* Legend */}
                        <HudPanel title="📋 Legend">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <LegendItem color="#f97316" label="Load / Hot corridor" />
                                <LegendItem color="#22c55e" label="Escort (available)" />
                                <LegendItem color="#fbbf24" label="Escort (busy)" />
                                <LegendItem color="#ef4444" label="Hard-fill zone" />
                                <LegendItem color="#9333ea" label="Police escort required" />
                                <LegendItem color="#3b82f6" label="High pole required" />
                            </div>
                        </HudPanel>
                    </div>

                    {/* Mobile HUD (bottom bar, hidden on desktop) */}
                    <div className="hc-map-hud-mobile" style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        background: 'rgba(10, 15, 25, 0.95)',
                        backdropFilter: 'blur(16px) saturate(1.5)',
                        borderTop: '1px solid rgba(249,115,22,0.15)',
                        padding: '10px 16px calc(10px + env(safe-area-inset-bottom))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        gap: 4,
                        pointerEvents: 'auto',
                        zIndex: 10,
                    }}>
                        <MobileHudStat value={String(stats.activeLoads)} label="Loads" color="#f97316" />
                        <MobileHudStat value={String(stats.onlineEscorts)} label="Escorts" color="#22c55e" />
                        <MobileHudStat value={String(stats.hardFillCount)} label="Hard Fill" color="#ef4444" />
                        <MobileHudStat value="LIVE" label="Status" color="#22c55e" />
                    </div>

                    {/* Responsive CSS */}
                    <style>{`
                        .hc-map-hud-desktop { display: flex; }
                        .hc-map-hud-mobile { display: none !important; }
                        @media (max-width: 767px) {
                            .hc-map-hud-desktop { display: none !important; }
                            .hc-map-hud-mobile { display: flex !important; }
                        }
                    `}</style>
                </>
            )}
        </div>
    );
}

// ── HUD Sub-Components ─────────────────────────────────────────────────────────

function HudPanel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(30, 41, 59, 0.8)',
            borderRadius: 14,
            padding: '14px 16px',
            backdropFilter: 'blur(12px)',
        }}>
            <div style={{
                fontSize: 10, fontWeight: 800, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 10,
            }}>{title}</div>
            {children}
        </div>
    );
}

function HudStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
        </div>
    );
}

function LayerToggle({ label, active, onChange }: { label: string; active: boolean; onChange: () => void }) {
    return (
        <button aria-label="Interactive Button" onClick={onChange} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8,
            background: active ? 'rgba(249,115,22,0.08)' : 'transparent',
            border: `1px solid ${active ? 'rgba(249,115,22,0.3)' : 'rgba(30,41,59,0.5)'}`,
            color: active ? '#fb923c' : '#64748b',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            width: '100%', textAlign: 'left',
            transition: 'all 0.2s',
        }}>
            <div style={{
                width: 14, height: 14, borderRadius: 4,
                background: active ? '#f97316' : '#1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#fff', fontWeight: 900,
                transition: 'all 0.2s',
            }}>{active ? '✓' : ''}</div>
            {label}
        </button>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{label}</span>
        </div>
    );
}

function MobileHudStat({ value, label, color }: { value: string; label: string; color: string }) {
    return (
        <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color, fontFeatureSettings: '"tnum"', lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{label}</div>
        </div>
    );
}

export default CommandMapV2;
