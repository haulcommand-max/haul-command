// components/map/LiveOperatorMap.tsx
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Live Operator Map
// Shows real-time operator positions from both phone GPS and Motive.
// Dot colors: green=moving, gold=stationary, grey=recently offline.
// Filter toggle for GPS-only operators.
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';

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
    const interval = setInterval(fetchPositions, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPositions]);

  const filtered = showGPSOnly
    ? positions.filter(p => p.source === 'phone_gps' || p.source === 'motive')
    : positions;

  const now = Date.now();

  function getDotStyle(pos: OperatorPosition) {
    const age = now - new Date(pos.updated_at).getTime();
    const isRecent = age < 5 * 60 * 1000; // 5 minutes
    const isMoving = (pos.speed || 0) > 2;

    if (!isRecent) return { bg: '#666', border: '#444', opacity: 0.5 };
    if (isMoving) return { bg: '#22c55e', border: '#16a34a', opacity: 1 };
    return { bg: '#eab308', border: '#ca8a04', opacity: 0.85 };
  }

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
          <button
            onClick={fetchPositions}
            style={{
              background: '#21262d', border: '1px solid #30363d',
              borderRadius: 6, padding: '4px 10px', color: '#c9d1d9',
              fontSize: 11, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, padding: '8px 16px',
        borderBottom: '1px solid #161b22', fontSize: 11, color: '#8b949e',
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
      <div style={{
        height: 500,
        background: '#0a0e14',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {loading ? (
          <div style={{ color: '#8b949e', fontSize: 14 }}>Loading map data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8b949e' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>
            <div style={{ fontSize: 14 }}>No operators currently broadcasting</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Operators appear when they toggle "Available"</div>
          </div>
        ) : (
          <div id="hc-live-map" style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* MapLibre GL JS would render here — displaying dots for now */}
            {filtered.map(pos => {
              const dot = getDotStyle(pos);
              // Simple CSS positioning as fallback (real implementation uses MapLibre)
              const x = ((pos.lng + 180) / 360) * 100;
              const y = ((90 - pos.lat) / 180) * 100;
              return (
                <div
                  key={pos.operator_id}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: pos.accuracy < 50 ? 12 : 8,
                    height: pos.accuracy < 50 ? 12 : 8,
                    borderRadius: '50%',
                    background: dot.bg,
                    border: `2px solid ${dot.border}`,
                    opacity: dot.opacity,
                    cursor: 'pointer',
                    transform: 'translate(-50%, -50%)',
                    transition: 'all 0.5s ease',
                    boxShadow: `0 0 6px ${dot.bg}40`,
                  }}
                  title={`${pos.operator_name || pos.operator_id.slice(0, 8)} — ${pos.speed ? `${Math.round(pos.speed)} mph` : 'Stationary'} — ${pos.source}`}
                >
                  {/* Direction arrow */}
                  {pos.heading && pos.speed && pos.speed > 2 && (
                    <div style={{
                      position: 'absolute',
                      top: -8,
                      left: '50%',
                      transform: `translateX(-50%) rotate(${pos.heading}deg)`,
                      fontSize: 8,
                      color: dot.bg,
                    }}>
                      ▲
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Operator List */}
      {filtered.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: 'auto', borderTop: '1px solid #21262d' }}>
          {filtered.map(pos => {
            const dot = getDotStyle(pos);
            const age = Math.round((now - new Date(pos.updated_at).getTime()) / 60000);
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
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: dot.bg, opacity: dot.opacity,
                  }} />
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
                  <span style={{ fontSize: 10 }}>{age}m ago</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
