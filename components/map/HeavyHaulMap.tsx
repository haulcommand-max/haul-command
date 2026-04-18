'use client';

/**
 * HeavyHaulMap — Purpose-built map for oversize/overweight load transport.
 *
 * 7 Layers:
 *   1. Base map (Carto dark tiles)
 *   2. Permit route (gold line — ONLY legal path)
 *   3. Clearance warnings (red triangles at low bridges)
 *   4. Weight restrictions (orange markers)
 *   5. Route checkpoints (info/caution markers)
 *   6. Convoy positions (real-time participant tracking)
 *   7. Deviation alerts (red flash when off-route)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClient } from '@supabase/supabase-js';
import type { ConvoyPosition, ClearancePoint, RouteCheckpoint } from '@/lib/routes/types';

interface HeavyHaulMapProps {
  loadId?: string;
  showPermitRoute?: boolean;
  loadDimensions?: { width_m: number; height_m: number; length_m: number; weight_kg: number };
  mode: 'operator' | 'broker' | 'dispatch' | 'public';
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  showHud?: boolean;
}

const MAP_STYLE = process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ?? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const POSITION_UPDATE_INTERVAL = 15_000;

export default function HeavyHaulMap({
  loadId,
  showPermitRoute = true,
  loadDimensions,
  mode,
  className = '',
  initialCenter = [-95.7, 37.0],
  initialZoom = 4.5,
  showHud = true,
}: HeavyHaulMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [convoy, setConvoy] = useState<ConvoyPosition[]>([]);
  const [deviationAlert, setDeviationAlert] = useState<string | null>(null);
  const [clearanceAlert, setClearanceAlert] = useState<{ name: string; clearance_m: number; load_height_m: number } | null>(null);
  const [stats, setStats] = useState({ clearances: 0, checkpoints: 0, convoySize: 0 });

  // ── Map initialization ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      pitch: mode === 'operator' ? 45 : 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // ── Source: Permit Route ──
      map.addSource('permit-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ── Source: Clearance warnings ──
      map.addSource('clearances', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ── Source: Weight restrictions ──
      map.addSource('weight-restrictions', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ── Source: Route checkpoints ──
      map.addSource('checkpoints', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ── Source: Convoy positions ──
      map.addSource('convoy', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ── Source: Deviation alerts ──
      map.addSource('deviations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ── Source: Global Dispatch Fleet ──
      map.addSource('global-dispatch-fleet', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // ═══════════════ LAYERS ═══════════════

      // Layer 2: Permit route — gold line
      map.addLayer({
        id: 'permit-route-glow',
        type: 'line',
        source: 'permit-route',
        paint: {
          'line-color': '#F1A91B',
          'line-width': 12,
          'line-opacity': 0.15,
          'line-blur': 8,
        },
      });
      map.addLayer({
        id: 'permit-route-line',
        type: 'line',
        source: 'permit-route',
        paint: {
          'line-color': '#F1A91B',
          'line-width': 4,
          'line-opacity': 0.85,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });

      // Layer 3: Clearance warnings — red warning circles
      map.addLayer({
        id: 'clearance-markers',
        type: 'circle',
        source: 'clearances',
        paint: {
          'circle-color': [
            'match', ['get', 'risk_level'],
            'blocked', '#dc2626',
            'danger', '#ef4444',
            'tight', '#f97316',
            '#fbbf24'
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            5, 4, 10, 8, 15, 14
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      });

      // Layer 4: Weight restrictions — orange squares
      map.addLayer({
        id: 'weight-markers',
        type: 'circle',
        source: 'weight-restrictions',
        paint: {
          'circle-color': '#f97316',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.85,
        },
      });

      // Layer 5: Route checkpoints — info markers
      map.addLayer({
        id: 'checkpoint-markers',
        type: 'circle',
        source: 'checkpoints',
        paint: {
          'circle-color': [
            'match', ['get', 'severity'],
            'critical', '#dc2626',
            'warning', '#f97316',
            'caution', '#fbbf24',
            '#3b82f6'
          ],
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.85,
        },
      });

      // Layer 6: Convoy positions — distinct role icons
      map.addLayer({
        id: 'convoy-markers',
        type: 'circle',
        source: 'convoy',
        paint: {
          'circle-color': [
            'match', ['get', 'role'],
            'lead_pilot', '#F1A91B',
            'rear_pilot', '#F1A91B',
            'load_driver', '#22c55e',
            'supervisor', '#3b82f6',
            '#F1A91B'
          ],
          'circle-radius': [
            'match', ['get', 'role'],
            'load_driver', 12,
            8
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 1,
        },
      });

      // Layer 7: Deviation alerts — pulsing red circles
      map.addLayer({
        id: 'deviation-pulse',
        type: 'circle',
        source: 'deviations',
        paint: {
          'circle-color': 'rgba(239, 68, 68, 0.2)',
          'circle-radius': 25,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ef4444',
          'circle-opacity': 0.8,
        },
      });
      map.addLayer({
        id: 'deviation-core',
        type: 'circle',
        source: 'deviations',
        paint: {
          'circle-color': '#ef4444',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 1,
        },
      });

      // Layer 8: Global Dispatch Fleet (when no loadId)
      map.addLayer({
        id: 'dispatch-fleet-markers',
        type: 'circle',
        source: 'global-dispatch-fleet',
        paint: {
          'circle-color': [
            'match', ['get', 'status'],
            'available', '#22c55e',
            'repositioning', '#8B5CF6',
            '#F1A91B'
          ],
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      });

      // ── Tooltips ──
      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '280px' });

      // Clearance tooltip
      map.on('mouseenter', 'clearance-markers', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties ?? {};
        const posted = p.clearance_posted_m ? `${Number(p.clearance_posted_m).toFixed(1)}m (${(Number(p.clearance_posted_m) * 3.281).toFixed(0)}ft)` : 'Unknown';
        const actual = p.clearance_actual_m ? `${Number(p.clearance_actual_m).toFixed(1)}m (${(Number(p.clearance_actual_m) * 3.281).toFixed(0)}ft)` : '';
        const risk = p.risk_level === 'blocked' ? '🚫 BLOCKED' : p.risk_level === 'danger' ? '⚠️ DANGER' : '⚠️ TIGHT';
        popup.setLngLat((f.geometry as any).coordinates)
          .setHTML(`<div style="padding:8px;font-size:12px;"><strong>${risk}</strong><br/>Type: ${p.obstacle_type ?? 'Bridge'}<br/>Posted: ${posted}${actual ? `<br/>Actual: ${actual}` : ''}<br/>Road: ${p.road_name ?? 'Unknown'}<br/><span style="font-size:10px;color:#888">Margin: ${p.margin_m ?? '?'}m</span></div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'clearance-markers', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

      // Convoy tooltip
      map.on('mouseenter', 'convoy-markers', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties ?? {};
        const roleLabel = ({ lead_pilot: '🟡 Lead Pilot', rear_pilot: '🟡 Rear Pilot', load_driver: '🟢 Load Driver', supervisor: '🔵 Supervisor' } as Record<string, string>)[p.role] ?? p.role;
        popup.setLngLat((f.geometry as any).coordinates)
          .setHTML(`<div style="padding:8px;font-size:12px;"><strong>${p.display_name ?? 'Operator'}</strong><br/>${roleLabel}<br/>Speed: ${p.speed_kmh ? `${Number(p.speed_kmh).toFixed(0)} km/h` : 'Stopped'}<br/>${p.on_permit_route === 'false' ? '<span style="color:#ef4444;font-weight:bold">⚠ OFF ROUTE</span>' : '<span style="color:#22c55e">✓ On Route</span>'}</div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'convoy-markers', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

      // Dispatch fleet tooltip
      map.on('mouseenter', 'dispatch-fleet-markers', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties ?? {};
        popup.setLngLat((f.geometry as any).coordinates)
          .setHTML(`<div style="padding:8px;font-size:12px;"><strong>${p.id ?? 'Operator'}</strong><br/>Status: ${p.status}<br/>Battery: ${p.battery_pct}%</div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'dispatch-fleet-markers', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

      // Checkpoint tooltip
      map.on('mouseenter', 'checkpoint-markers', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties ?? {};
        const verified = Number(p.verified_count ?? 0) >= 3 ? '✅ Confirmed' : `${p.verified_count ?? 0} reports`;
        popup.setLngLat((f.geometry as any).coordinates)
          .setHTML(`<div style="padding:8px;font-size:12px;"><strong>${p.name ?? p.checkpoint_type}</strong><br/>Type: ${p.checkpoint_type}<br/>Severity: ${p.severity}<br/>${verified}<br/><span style="font-size:10px;color:#888">${p.description ?? ''}</span></div>`)
          .addTo(map);
      });
      map.on('mouseleave', 'checkpoint-markers', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, mode]);

  // ── Load convoy data + permit route ──────────────────────────────────────
  useEffect(() => {
    if (!loadId || !mapRef.current) return;
    const map = mapRef.current;

    async function loadConvoyData() {
      try {
        const res = await fetch(`/api/routes/convoy/${loadId}`);
        if (!res.ok) return;
        const data = await res.json();

        // Set permit route
        if (data.permit_route?.route_geojson && showPermitRoute) {
          const routeSrc = map.getSource('permit-route') as mapboxgl.GeoJSONSource | undefined;
          if (routeSrc) {
            routeSrc.setData({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: data.permit_route.route_geojson,
                properties: { permit_number: data.permit_route.permit_number },
              }],
            });
          }
        }

        // Set convoy positions
        const convoyData = data.convoy ?? [];
        setConvoy(convoyData);
        setStats(prev => ({ ...prev, convoySize: convoyData.length }));

        const convoySrc = map.getSource('convoy') as mapboxgl.GeoJSONSource | undefined;
        if (convoySrc) {
          convoySrc.setData({
            type: 'FeatureCollection',
            features: convoyData.map((c: ConvoyPosition) => ({
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
              properties: {
                role: c.role,
                display_name: c.display_name,
                speed_kmh: c.speed_kmh,
                on_permit_route: String(c.on_permit_route),
              },
            })),
          });
        }

        // Set deviations
        const deviations = data.active_deviations ?? [];
        const devSrc = map.getSource('deviations') as mapboxgl.GeoJSONSource | undefined;
        if (devSrc) {
          devSrc.setData({
            type: 'FeatureCollection',
            features: deviations.map((d: any) => ({
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [d.deviation_lng, d.deviation_lat] },
              properties: { distance_m: d.distance_from_route_m, severity: d.severity },
            })),
          });
        }

        if (deviations.length > 0) {
          setDeviationAlert(`${deviations.length} deviation${deviations.length > 1 ? 's' : ''} detected`);
        } else {
          setDeviationAlert(null);
        }
      } catch { /* retry next interval */ }
    }

    // Load initially
    const waitForMap = setInterval(() => {
      if (map.loaded()) {
        clearInterval(waitForMap);
        loadConvoyData();
      }
    }, 200);

    // Refresh every 15 seconds
    const interval = setInterval(loadConvoyData, POSITION_UPDATE_INTERVAL);

    // Supabase Realtime for instant convoy updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const channel = supabase
      .channel(`convoy-${loadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'convoy_positions', filter: `load_id=eq.${loadId}` }, () => {
        loadConvoyData();
      })
      .subscribe();

    return () => {
      clearInterval(waitForMap);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadId, showPermitRoute]);

  // ── Load Global Dispatch Fleet ───────────────────────────────────────────
  useEffect(() => {
    if (loadId || mode !== 'dispatch' || !mapRef.current) return;
    const map = mapRef.current;
    
    async function loadGlobalFleet() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data } = await supabase
        .from('escort_presence')
        .select('escort_id, status, last_lat, last_lng, battery_pct')
        .gt('last_heartbeat_at', new Date(Date.now() - 6 * 3600_000).toISOString())
        .not('last_lat', 'is', null)
        .not('last_lng', 'is', null)
        .limit(300);

      const fleetSrc = map.getSource('global-dispatch-fleet') as mapboxgl.GeoJSONSource | undefined;
      if (fleetSrc && data) {
        fleetSrc.setData({
          type: 'FeatureCollection',
          features: data.map((c) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.last_lng, c.last_lat] },
            properties: {
              id: c.escort_id,
              status: c.status,
              battery_pct: c.battery_pct
            },
          })),
        });
      }
    }

    const waitForMap = setInterval(() => {
      if (map.loaded()) {
        clearInterval(waitForMap);
        loadGlobalFleet();
      }
    }, 200);

    const interval = setInterval(loadGlobalFleet, POSITION_UPDATE_INTERVAL);

    return () => {
      clearInterval(waitForMap);
      clearInterval(interval);
    };
  }, [loadId, mode]);

  // ── Load clearance & checkpoint data (based on map viewport) ─────────────
  const loadHazardData = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    const center = map.getCenter();
    const bounds = map.getBounds();
    const radiusM = Math.round(
      Math.sqrt(
        Math.pow((bounds.getNorth() - bounds.getSouth()) * 111320, 2) +
        Math.pow((bounds.getEast() - bounds.getWest()) * 111320 * Math.cos(center.lat * Math.PI / 180), 2)
      ) / 2
    );

    const heightM = loadDimensions?.height_m ?? 4.5;

    try {
      const res = await fetch(`/api/routes/clearances?lat=${center.lat}&lng=${center.lng}&radius_m=${Math.min(radiusM, 50000)}&min_height_m=${heightM}`);
      if (!res.ok) return;
      const data = await res.json();

      const clearanceSrc = map.getSource('clearances') as mapboxgl.GeoJSONSource | undefined;
      if (clearanceSrc) {
        clearanceSrc.setData({
          type: 'FeatureCollection',
          features: (data.clearances ?? []).map((c: any) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
            properties: {
              clearance_posted_m: c.clearance_posted_m,
              clearance_actual_m: c.clearance_actual_m,
              obstacle_type: c.obstacle_type,
              road_name: c.road_name,
              risk_level: c.risk_level,
              margin_m: c.margin_m,
              verified: c.verified_by_count >= 3,
            },
          })),
        });
        setStats(prev => ({ ...prev, clearances: data.warning_count ?? 0 }));
      }
    } catch { /* non-critical */ }
  }, [loadDimensions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMoveEnd = () => loadHazardData();
    map.on('moveend', onMoveEnd);

    // Load initially after map is ready
    const timer = setTimeout(loadHazardData, 1000);

    return () => {
      map.off('moveend', onMoveEnd);
      clearTimeout(timer);
    };
  }, [loadHazardData]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} className={className}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label="Haul Command Heavy Haul Route Map" />

      {/* ── Deviation Alert Banner ── */}
      {deviationAlert && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'rgba(239, 68, 68, 0.95)', color: '#fff',
          padding: '12px 20px', textAlign: 'center',
          fontWeight: 900, fontSize: 14,
          animation: 'pulse 1s ease-in-out infinite',
          zIndex: 100,
        }}>
          🚨 ROUTE DEVIATION — {deviationAlert}
        </div>
      )}

      {/* ── Clearance Approach Alert ── */}
      {clearanceAlert && (
        <div style={{
          position: 'absolute', top: deviationAlert ? 48 : 0, left: 0, right: 0,
          background: 'rgba(249, 115, 22, 0.95)', color: '#fff',
          padding: '12px 20px', textAlign: 'center',
          fontWeight: 900, fontSize: 14, zIndex: 99,
        }}>
          ⚠️ LOW CLEARANCE AHEAD — {clearanceAlert.name}: {clearanceAlert.clearance_m.toFixed(1)}m | Your load: {clearanceAlert.load_height_m.toFixed(1)}m
        </div>
      )}

      {/* ── HUD Panel ── */}
      {showHud && (
        <>
          {/* Desktop HUD */}
          <div style={{
            position: 'absolute', top: deviationAlert ? 60 : 16, left: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
            pointerEvents: 'auto', zIndex: 50,
          }} className="hh-hud-desktop">
            {/* Permit Route Label */}
            {loadId && (
              <div style={{
                background: 'rgba(10,15,25,0.92)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(241,169,27,0.3)', borderRadius: 12,
                padding: '10px 16px', color: '#F1A91B',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
              }}>
                PERMITTED ROUTE — DEVIATION = VIOLATION
              </div>
            )}

            {/* Stats */}
            <div style={{
              background: 'rgba(10,15,25,0.92)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '12px 16px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <StatBlock label="Clearance Warnings" value={String(stats.clearances)} color={stats.clearances > 0 ? '#ef4444' : '#22c55e'} />
                <StatBlock label="Checkpoints" value={String(stats.checkpoints)} color="#3b82f6" />
                <StatBlock label="Convoy Size" value={String(stats.convoySize)} color="#F1A91B" />
              </div>
            </div>

            {/* Legend */}
            <div style={{
              background: 'rgba(10,15,25,0.92)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              padding: '10px 14px', fontSize: 10, color: '#94a3b8',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <LegendRow color="#F1A91B" label="Permitted Route" />
                <LegendRow color="#ef4444" label="Low Clearance Warning" />
                <LegendRow color="#f97316" label="Weight Restriction" />
                <LegendRow color="#3b82f6" label="Checkpoint / Weigh Station" />
                <LegendRow color="#22c55e" label="Load Vehicle" />
              </div>
            </div>
          </div>

          {/* Convoy Panel (right side) */}
          {convoy.length > 0 && (
            <div style={{
              position: 'absolute', top: deviationAlert ? 60 : 16, right: 16,
              width: 220, background: 'rgba(10,15,25,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '12px 14px', zIndex: 50,
            }} className="hh-hud-desktop">
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                🚛 Convoy ({convoy.length})
              </div>
              {convoy.map((c) => (
                <div key={c.operator_id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: c.on_permit_route ? '#22c55e' : '#ef4444',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f5f5f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.display_name ?? 'Unknown'}
                    </div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>
                      {c.role.replace('_', ' ')} · {c.speed_kmh ? `${Math.round(c.speed_kmh)} km/h` : 'Stopped'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobile HUD */}
          <div className="hh-hud-mobile" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(10,15,25,0.95)', backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(241,169,27,0.15)',
            padding: '10px 16px calc(10px + env(safe-area-inset-bottom))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            zIndex: 50,
          }}>
            <MobileStat value={String(stats.clearances)} label="Clearances" color={stats.clearances > 0 ? '#ef4444' : '#22c55e'} />
            <MobileStat value={String(stats.convoySize)} label="Convoy" color="#F1A91B" />
            <MobileStat value={deviationAlert ? 'OFF' : 'ON'} label="Route" color={deviationAlert ? '#ef4444' : '#22c55e'} />
          </div>

          <style>{`
            .hh-hud-desktop { display: flex; }
            .hh-hud-mobile { display: none !important; }
            @media (max-width: 767px) {
              .hh-hud-desktop { display: none !important; }
              .hh-hud-mobile { display: flex !important; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──
function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
      <div style={{ fontSize: 8, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}

function MobileStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}
