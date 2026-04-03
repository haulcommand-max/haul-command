'use client';
// components/motive/FleetIntelligencePanel.tsx
// ═══════════════════════════════════════════════════════════════
// Motive Data Panel — shows on operator profile/dashboard
// Vehicles, HOS status, last location, inspection status.
// Shows "Connect Motive" CTA if not connected.
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';

interface MotiveVehicle {
  motive_id: number;
  number: string;
  make: string;
  model: string;
  year: string;
  status: string;
  fuel_type: string;
}

interface MotiveLocation {
  vehicle_motive_id: number;
  lat: number;
  lon: number;
  speed: number;
  bearing: number;
  fuel_percent: number;
  located_at: string;
}

interface FleetData {
  connected: boolean;
  connect_url?: string;
  vehicles?: MotiveVehicle[];
  locations?: MotiveLocation[];
  hos?: {
    hours_driven_today: number;
    hours_remaining: number;
    status: 'available' | 'limited' | 'exhausted';
  };
  vehicle_count?: number;
  driver_count?: number;
}

export default function FleetIntelligencePanel({ profileId }: { profileId: string }) {
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/motive/fleet-data?profile_id=${profileId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ connected: false }))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24 }}>
        <div style={{ color: '#8b949e', textAlign: 'center' }}>Loading fleet data...</div>
      </div>
    );
  }

  if (!data?.connected) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #161b22 0%, #1a1f2b 100%)',
        border: '1px solid #30363d', borderRadius: 12, padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>📡</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#e0e0e6' }}>Connect Your ELD</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8b949e' }}>
              Operators with ELD verification get <span style={{ color: '#00ff88', fontWeight: 600 }}>3x more load offers</span>
            </p>
          </div>
        </div>
        <a
          href={data?.connect_url || `/api/motive/connect?profile_id=${profileId}`}
          style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 8,
            background: 'linear-gradient(90deg, #22c55e, #16a34a)', color: '#fff',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            transition: 'transform 0.2s',
          }}
        >
          ⚡ Connect Motive
        </a>
        <p style={{ fontSize: 11, color: '#8b949e', marginTop: 12 }}>
          Supports Motive (KeepTruckin) • Real-time location, HOS, vehicle data
        </p>
      </div>
    );
  }

  const hosColor = data.hos?.status === 'available' ? '#00ff88' :
                   data.hos?.status === 'limited' ? '#ffcc00' : '#ff4444';

  return (
    <div style={{
      background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛰️</span>
          <h3 style={{ margin: 0, fontSize: 16, color: '#e0e0e6' }}>Fleet Intelligence</h3>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            background: '#22c55e22', color: '#22c55e', textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>ELD VERIFIED</span>
        </div>
        <span style={{ fontSize: 11, color: '#8b949e' }}>
          {data.vehicle_count} vehicle{data.vehicle_count !== 1 ? 's' : ''} •
          {data.driver_count} driver{data.driver_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* HOS Status */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16,
      }}>
        <div style={{ background: '#0d1117', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>HOS Remaining</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: hosColor }}>{data.hos?.hours_remaining || 0}h</div>
          <div style={{ fontSize: 10, color: hosColor, textTransform: 'uppercase' }}>{data.hos?.status}</div>
        </div>
        <div style={{ background: '#0d1117', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>Driven Today</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e6' }}>{data.hos?.hours_driven_today || 0}h</div>
        </div>
        <div style={{ background: '#0d1117', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>Vehicles</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#00ccff' }}>{data.vehicle_count}</div>
        </div>
      </div>

      {/* Vehicles */}
      {data.vehicles && data.vehicles.length > 0 && (
        <div>
          <h4 style={{ fontSize: 13, color: '#8b949e', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Fleet Vehicles
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.vehicles.slice(0, 5).map((v) => (
              <div key={v.motive_id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: '#0d1117', borderRadius: 6,
              }}>
                <span style={{ fontSize: 13 }}>
                  🚛 {v.year} {v.make} {v.model}
                  {v.number && <span style={{ color: '#8b949e', marginLeft: 8 }}>#{v.number}</span>}
                </span>
                <span style={{
                  padding: '2px 6px', borderRadius: 4, fontSize: 10,
                  background: v.status === 'active' ? '#22c55e22' : '#ff444422',
                  color: v.status === 'active' ? '#22c55e' : '#ff4444',
                }}>
                  {v.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Known Location */}
      {data.locations && data.locations.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 13, color: '#8b949e', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Last Known Position
          </h4>
          <div style={{ padding: '10px 12px', background: '#0d1117', borderRadius: 6, fontSize: 13 }}>
            📍 {data.locations[0].lat.toFixed(4)}, {data.locations[0].lon.toFixed(4)}
            <span style={{ color: '#8b949e', marginLeft: 8 }}>
              {data.locations[0].speed ? `${Math.round(data.locations[0].speed)} mph` : 'Stationary'}
            </span>
            <span style={{ color: '#8b949e', marginLeft: 8, fontSize: 11 }}>
              {data.locations[0].located_at ? new Date(data.locations[0].located_at).toLocaleString() : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
