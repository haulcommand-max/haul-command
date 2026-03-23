'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ══════════════════════════════════════════════════════
   FLEET TRACKING MAP — /map/fleet
   Live Motive telematics visualization
   Queries motive_vehicle_positions from Supabase
   ══════════════════════════════════════════════════════ */

interface VehiclePosition {
  id: string;
  vehicle_id: string;
  driver_name: string;
  vehicle_type: 'hauler' | 'pilot_car' | 'escort' | 'unknown';
  latitude: number;
  longitude: number;
  speed_mph: number;
  heading: number;
  last_updated: string;
  status: 'active' | 'idle' | 'offline';
}

const DEMO_VEHICLES: VehiclePosition[] = [
  { id: 'v1', vehicle_id: 'TRK-001', driver_name: 'Jake Rodriguez', vehicle_type: 'hauler', latitude: 29.7604, longitude: -95.3698, speed_mph: 62, heading: 270, last_updated: new Date().toISOString(), status: 'active' },
  { id: 'v2', vehicle_id: 'PC-012', driver_name: 'Sarah Mitchell', vehicle_type: 'pilot_car', latitude: 29.7620, longitude: -95.3550, speed_mph: 64, heading: 270, last_updated: new Date().toISOString(), status: 'active' },
  { id: 'v3', vehicle_id: 'TRK-005', driver_name: 'Marcus Webb', vehicle_type: 'hauler', latitude: 32.7767, longitude: -96.7970, speed_mph: 0, heading: 0, last_updated: new Date(Date.now() - 3600000).toISOString(), status: 'idle' },
  { id: 'v4', vehicle_id: 'PC-034', driver_name: 'Lisa Chen', vehicle_type: 'pilot_car', latitude: 30.2672, longitude: -97.7431, speed_mph: 55, heading: 180, last_updated: new Date().toISOString(), status: 'active' },
  { id: 'v5', vehicle_id: 'ESC-002', driver_name: 'Tommy Davis', vehicle_type: 'escort', latitude: 33.4484, longitude: -112.0740, speed_mph: 48, heading: 90, last_updated: new Date().toISOString(), status: 'active' },
  { id: 'v6', vehicle_id: 'TRK-009', driver_name: 'Ray Thompson', vehicle_type: 'hauler', latitude: 35.1495, longitude: -90.0490, speed_mph: 0, heading: 0, last_updated: new Date(Date.now() - 7200000).toISOString(), status: 'offline' },
  { id: 'v7', vehicle_id: 'PC-022', driver_name: 'Maria Gonzalez', vehicle_type: 'pilot_car', latitude: 27.9506, longitude: -82.4572, speed_mph: 71, heading: 45, last_updated: new Date().toISOString(), status: 'active' },
  { id: 'v8', vehicle_id: 'TRK-011', driver_name: 'Chris Walker', vehicle_type: 'hauler', latitude: 36.1627, longitude: -86.7816, speed_mph: 58, heading: 90, last_updated: new Date().toISOString(), status: 'active' },
];

const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  hauler: { emoji: '🚛', color: '#f59f0a' },
  pilot_car: { emoji: '🚗', color: '#22c55e' },
  escort: { emoji: '🚨', color: '#3b82f6' },
  unknown: { emoji: '📍', color: '#6b7280' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
  idle: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  offline: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
};

export default function FleetMapPage() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>(DEMO_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch live positions from API
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet/positions');
      const data = await res.json();
      if (data.positions?.length) {
        setVehicles(data.positions);
      }
    } catch {
      // Keep demo data on error
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    // Refresh every 15 seconds for near-real-time
    refreshInterval.current = setInterval(fetchPositions, 15000);
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [fetchPositions]);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (filterType !== 'all' && v.vehicle_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return v.driver_name.toLowerCase().includes(q) || v.vehicle_id.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const idleCount = vehicles.filter(v => v.status === 'idle').length;
  const offlineCount = vehicles.filter(v => v.status === 'offline').length;

  function timeAgo(isoDate: string) {
    const diff = Date.now() - new Date(isoDate).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  const selected = vehicles.find(v => v.id === selectedVehicle);

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full overflow-x-hidden">
        <div className="flex h-[calc(100vh-80px)]">
          {/* ── Sidebar ── */}
          <div className={`${sidebarOpen ? 'w-80 lg:w-96' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/[0.06] bg-black/40 backdrop-blur flex flex-col`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-black text-lg">Fleet Tracker</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs font-bold">LIVE</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                  <div className="text-green-400 font-black text-lg">{activeCount}</div>
                  <div className="text-gray-500 text-[10px]">Active</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                  <div className="text-yellow-400 font-black text-lg">{idleCount}</div>
                  <div className="text-gray-500 text-[10px]">Idle</div>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2 text-center">
                  <div className="text-gray-400 font-black text-lg">{offlineCount}</div>
                  <div className="text-gray-500 text-[10px]">Offline</div>
                </div>
              </div>

              {/* Search */}
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search driver or vehicle..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/40 mb-2"
              />

              {/* Filter Chips */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All', icon: '📡' },
                  { id: 'hauler', label: 'Haulers', icon: '🚛' },
                  { id: 'pilot_car', label: 'Pilots', icon: '🚗' },
                  { id: 'escort', label: 'Escorts', icon: '🚨' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                      filterType === f.id ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle List */}
            <div className="flex-1 overflow-y-auto">
              {filteredVehicles.map(v => {
                const icon = TYPE_ICONS[v.vehicle_type] || TYPE_ICONS.unknown;
                const statusStyle = STATUS_COLORS[v.status] || STATUS_COLORS.offline;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`w-full text-left px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all ${
                      selectedVehicle === v.id ? 'bg-accent/[0.05] border-l-2 border-l-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{icon.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-white text-sm font-bold truncate">{v.driver_name}</div>
                          <div className="text-gray-500 text-[10px] font-mono">{v.vehicle_id}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="flex items-center gap-1 justify-end">
                          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span className={`text-[10px] font-bold ${statusStyle.text}`}>
                            {v.status.toUpperCase()}
                          </span>
                        </div>
                        {v.status === 'active' && (
                          <div className="text-accent text-xs font-bold tabular-nums">{v.speed_mph} mph</div>
                        )}
                        <div className="text-gray-600 text-[10px]">{timeAgo(v.last_updated)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Map Area ── */}
          <div className="flex-1 relative">
            {/* Toggle sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur border border-white/10 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
            >
              {sidebarOpen ? '◀ Hide' : '▶ Fleet'}
            </button>

            {/* Map Container — CSS Grid Map */}
            <div ref={mapRef} className="w-full h-full bg-[#0d1117] relative overflow-hidden">
              {/* Grid background */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }} />

              {/* US Outline SVG background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg viewBox="0 0 960 600" className="w-full max-w-5xl" fill="none" stroke="rgba(245,159,10,0.3)" strokeWidth="1">
                  <path d="M150,400 L200,350 L250,320 L300,310 L350,300 L400,280 L450,260 L500,250 L550,240 L600,250 L650,260 L700,280 L750,290 L800,300 L850,320" />
                </svg>
              </div>

              {/* Vehicle Markers */}
              {filteredVehicles.map(v => {
                const icon = TYPE_ICONS[v.vehicle_type] || TYPE_ICONS.unknown;
                // Simple projection: map lat/lng to viewport %
                const x = ((v.longitude + 125) / 55) * 100; // rough US bounds
                const y = ((50 - v.latitude) / 25) * 100;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                    style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
                  >
                    {/* Pulse ring for active */}
                    {v.status === 'active' && (
                      <span className="absolute inset-0 w-8 h-8 rounded-full animate-ping opacity-30 -m-1" style={{ backgroundColor: icon.color }} />
                    )}
                    <span className={`relative flex items-center justify-center w-8 h-8 rounded-full text-lg shadow-lg ${
                      selectedVehicle === v.id ? 'ring-2 ring-accent scale-125' : ''
                    }`} style={{ backgroundColor: `${icon.color}20`, border: `2px solid ${icon.color}` }}>
                      {icon.emoji}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 whitespace-nowrap">
                      <div className="bg-black/90 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-xs">
                        <div className="text-white font-bold">{v.driver_name}</div>
                        <div className="text-gray-400">{v.vehicle_id} · {v.speed_mph} mph</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Selected Vehicle Detail Popup */}
              {selected && (
                <div className="absolute bottom-4 right-4 z-30 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 ag-slide-up">
                  <button onClick={() => setSelectedVehicle(null)} className="absolute top-3 right-3 text-gray-500 hover:text-white text-sm">✕</button>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{TYPE_ICONS[selected.vehicle_type]?.emoji || '📍'}</span>
                    <div>
                      <div className="text-white font-black">{selected.driver_name}</div>
                      <div className="text-gray-500 text-xs font-mono">{selected.vehicle_id}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-500 text-[10px] uppercase mb-1">Speed</div>
                      <div className="text-accent font-black text-xl">{selected.speed_mph} <span className="text-xs text-gray-500">mph</span></div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-500 text-[10px] uppercase mb-1">Heading</div>
                      <div className="text-white font-bold text-xl">{selected.heading}°</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-500 text-[10px] uppercase mb-1">Latitude</div>
                      <div className="text-white font-mono text-xs">{selected.latitude.toFixed(4)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-gray-500 text-[10px] uppercase mb-1">Longitude</div>
                      <div className="text-white font-mono text-xs">{selected.longitude.toFixed(4)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]?.bg} ${STATUS_COLORS[selected.status]?.text}`}>
                      {selected.status.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-[10px]">Updated {timeAgo(selected.last_updated)}</span>
                  </div>
                </div>
              )}

              {/* Map Legend */}
              <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur border border-white/10 rounded-xl p-3 space-y-1.5">
                {Object.entries(TYPE_ICONS).filter(([k]) => k !== 'unknown').map(([type, icon]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-sm">{icon.emoji}</span>
                    <span className="text-gray-400 text-[10px] capitalize">{type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
