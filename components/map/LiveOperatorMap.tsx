'use client';

// components/map/LiveOperatorMap.tsx
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Live Operator Map (100x Upgraded)
// Shows real-time operator positions from both phone GPS and Motive.
// Dot colors: green=moving, gold=stationary, grey=recently offline.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createClient } from '@supabase/supabase-js';

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ??
  'https://demotiles.maplibre.org/style.json';

interface OperatorPosition {
  operator_id: string;
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  source: 'phone_gps' | 'motive' | 'traccar';
  updated_at: string;
  operator_name?: string;
  eld_verified?: boolean;
}

export default function LiveOperatorMap() {
  const [positions, setPositions] = useState<OperatorPosition[]>([]);
  const [showGPSOnly, setShowGPSOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/location/live-positions');
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Initial Map Setup
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-95.7, 37.0],
      zoom: 3.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('operators', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Operator Dots Layer
      map.addLayer({
        id: 'operator-dots',
        type: 'circle',
        source: 'operators',
        paint: {
          'circle-color': [
            'match',
            ['get', 'status_color'],
            'green', '#22c55e',
            'gold', '#eab308',
            '#666666'
          ],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3, 10, 8],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0d1117',
          'circle-opacity': 0.9,
        },
      });

      // Operator Halo Layer (for moving targets)
      map.addLayer({
        id: 'operator-halo',
        type: 'circle',
        source: 'operators',
        filter: ['==', ['get', 'status_color'], 'green'],
        paint: {
          'circle-color': '#22c55e',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 6, 10, 20],
          'circle-stroke-width': 0,
          'circle-opacity': 0.2,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      
      map.on('mouseenter', 'operator-dots', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties;
        const name = p.operator_name || p.operator_id.slice(0, 8);
        const speed = p.speed ? `${Math.round(p.speed)} mph` : 'Stationary';
        
        popup.setLngLat((f.geometry as any).coordinates)
            .setHTML(`<div style="padding:4px;font-size:12px;background:#0d1117;color:#fff;">
                <strong>${name}</strong><br/>
                <span style="color:#8b949e;font-size:10px;">${speed} · ${p.source}</span>
            </div>`)
            .addTo(map);
      });
      map.on('mouseleave', 'operator-dots', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      // Initialize Supabase Realtime
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Listen to presence heartbeat changes
      const channel = supabase.channel('operator-heartbeats')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_operator_heartbeats' }, (payload) => {
          setPositions(prev => {
            const newPos = payload.new as any;
            const updated = prev.filter(p => p.operator_id !== newPos.operator_id);
            updated.push({
              operator_id: newPos.operator_id,
              lat: newPos.lat,
              lng: newPos.lng,
              accuracy: newPos.accuracy || 10,
              heading: newPos.heading || null,
              speed: newPos.speed || 0,
              source: newPos.source_system || 'phone_gps',
              updated_at: newPos.captured_at || new Date().toISOString(),
              operator_name: newPos.operator_id,
            });
            return updated;
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_operator_heartbeats' }, (payload) => {
          setPositions(prev => {
            const newPos = payload.new as any;
            const updated = prev.filter(p => p.operator_id !== newPos.operator_id);
            updated.push({
              operator_id: newPos.operator_id,
              lat: newPos.lat,
              lng: newPos.lng,
              accuracy: newPos.accuracy || 10,
              heading: newPos.heading || null,
              speed: newPos.speed || 0,
              source: newPos.source_system || 'phone_gps',
              updated_at: newPos.captured_at || new Date().toISOString(),
              operator_name: newPos.operator_id,
            });
            return updated;
          });
        })
        .subscribe();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const filtered = useMemo(() => {
    return showGPSOnly
      ? positions.filter(p => p.source === 'phone_gps' || p.source === 'motive')
      : positions;
  }, [positions, showGPSOnly]);

  // Update map source when positions change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const src = map.getSource('operators') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      const now = Date.now();
      const features = filtered.map(pos => {
        const age = now - new Date(pos.updated_at).getTime();
        const isRecent = age < 5 * 60 * 1000;
        const isMoving = (pos.speed || 0) > 2;
        let color = 'grey';
        if (isRecent) color = isMoving ? 'green' : 'gold';

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pos.lng, pos.lat] },
          properties: {
            ...pos,
            status_color: color,
          }
        };
      });
      src.setData({ type: 'FeatureCollection', features: features as any });
    }
  }, [filtered]);

  const now = Date.now();

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #21262d',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid #21262d',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#e0e0e6' }}>
            🗺️ Live Operator Map
          </h3>
          <span style={{ fontSize: 11, color: '#8b949e' }}>
            {filtered.length} operator{filtered.length !== 1 ? 's' : ''} visible
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer', fontSize: 12, color: '#c9d1d9',
          }}>
            <input
              type="checkbox"
              checked={showGPSOnly}
              onChange={e => setShowGPSOnly(e.target.checked)}
              style={{ accentColor: '#22c55e' }}
            />
            🛰️ Live GPS Only
          </label>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, padding: '8px 16px',
        borderBottom: '1px solid #21262d', fontSize: 11, color: '#8b949e',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          Available + Moving
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
          Available + Stationary
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#666' }} />
          Recently Offline
        </span>
      </div>

      {/* Map Container */}
      <div style={{ height: 500, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(13,17,23,0.8)', zIndex: 10, color: '#8b949e'
          }}>
            Loading map data...
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Operator List */}
      {filtered.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: 'auto', borderTop: '1px solid #21262d' }}>
          {filtered.map(pos => {
            const age = Math.round((now - new Date(pos.updated_at).getTime()) / 60000);
            const isRecent = age < 5;
            const isMoving = (pos.speed || 0) > 2;
            const dotColor = isRecent ? (isMoving ? '#22c55e' : '#eab308') : '#666';

            return (
              <div
                key={pos.operator_id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 16px', borderBottom: '1px solid #161b22',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                  <span style={{ color: '#c9d1d9' }}>
                    {pos.operator_name || pos.operator_id.slice(0, 12)}
                  </span>
                  {pos.eld_verified && (
                    <span style={{
                      fontSize: 9, padding: '1px 4px', borderRadius: 3,
                      background: '#22c55e15', color: '#22c55e', fontWeight: 700,
                    }}>ELD</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#8b949e' }}>
                  <span>{pos.speed ? `${Math.round(pos.speed)} mph` : 'Stationary'}</span>
                  <span style={{ fontSize: 10 }}>{pos.source}</span>
                  <span style={{ fontSize: 10 }}>{age < 1 ? '< 1m' : `${age}m`} ago</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
