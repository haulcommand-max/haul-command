'use client';

/**
 * LiveVehicleMap — Real-time pilot position map using Google Maps.
 *
 * Renders a styled dark map with pilot markers (Motive-verified = green,
 * phone-reported = blue), auto-refreshes every 30s, and centers on the
 * user's current position if GPS is available.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface Pilot {
  id: string;
  source: 'motive' | 'phone';
  lat: number;
  lng: number;
  heading: number | null;
  speed_mph: number | null;
  distance_miles: number;
  driver_name: string | null;
  vehicle_number: string | null;
  hos_hours_remaining: number | null;
  provider_id: string | null;
  recorded_at: string;
  verified: boolean;
}

interface LiveVehicleMapProps {
  /** Center lat — if not provided, uses US center */
  centerLat?: number;
  /** Center lng */
  centerLng?: number;
  /** Search radius in miles */
  radiusMiles?: number;
  /** Auto-refresh interval in seconds (0 = disabled) */
  refreshInterval?: number;
  /** Max height of the map container */
  height?: string;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function headingToCompass(heading: number | null): string {
  if (heading == null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(heading / 45) % 8];
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h`;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function LiveVehicleMap({
  centerLat,
  centerLng,
  radiusMiles = 75,
  refreshInterval = 30,
  height = '600px',
}: LiveVehicleMapProps) {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const mapRef = useRef<HTMLDivElement>(null);

  // Use user position if no center provided
  const lat = centerLat ?? userPos?.lat ?? 39.83;
  const lng = centerLng ?? userPos?.lng ?? -98.58;

  // Get user position
  useEffect(() => {
    if (centerLat && centerLng) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // Fail silently, use default
        { timeout: 10000 },
      );
    }
  }, [centerLat, centerLng]);

  // Fetch nearby pilots
  const fetchPilots = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius_miles: String(radiusMiles),
        limit: '50',
      });
      const res = await fetch(`/api/vehicles/nearby?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPilots(data.pilots || []);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusMiles]);

  useEffect(() => {
    fetchPilots();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPilots, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchPilots, refreshInterval]);

  // ─── Stats ───────────────────────────────────────────────────

  const motiveCount = pilots.filter((p) => p.source === 'motive').length;
  const phoneCount = pilots.filter((p) => p.source === 'phone').length;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-white text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Pilot Tracker
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {motiveCount} ELD
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {phoneCount} GPS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-600">
            Updated {timeAgo(lastRefresh.toISOString())}
          </span>
          <button
            onClick={fetchPilots}
            className="text-[10px] text-accent hover:text-white transition-colors font-medium"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Map Area — CSS-based dot map (no external map API required) */}
      <div ref={mapRef} className="relative" style={{ height }}>
        {/* Dark map background */}
        <div className="absolute inset-0 bg-[#0d1117]">
          {/* Grid lines for visual reference */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Center crosshair (user position) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-4 h-4 rounded-full bg-accent/30 border-2 border-accent animate-ping" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white/20" />
          </div>

          {/* Pilot markers — positioned relative to center based on lat/lng offset */}
          {pilots.map((pilot) => {
            // Convert lat/lng to pixel offset from center
            const pxPerMile = 4; // Approximate pixel scale
            const offsetX = (pilot.lng - lng) * 69 * Math.cos((lat * Math.PI) / 180) * pxPerMile;
            const offsetY = (lat - pilot.lat) * 69 * pxPerMile;

            return (
              <button
                key={pilot.id}
                onClick={() => setSelectedPilot(selectedPilot?.id === pilot.id ? null : pilot)}
                className="absolute z-20 group"
                style={{
                  top: `calc(50% + ${offsetY}px)`,
                  left: `calc(50% + ${offsetX}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={pilot.driver_name || pilot.vehicle_number || pilot.id}
              >
                {/* Outer glow */}
                <div
                  className={`w-6 h-6 rounded-full ${
                    pilot.verified
                      ? 'bg-green-500/20 group-hover:bg-green-500/40'
                      : 'bg-blue-500/20 group-hover:bg-blue-500/40'
                  } transition-all flex items-center justify-center`}
                >
                  {/* Core dot */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      pilot.verified ? 'bg-green-500' : 'bg-blue-500'
                    } border border-white/20`}
                  />
                </div>
                {/* Speed label on hover */}
                <div className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  {pilot.distance_miles.toFixed(1)} mi
                  {pilot.speed_mph != null && ` · ${Math.round(pilot.speed_mph)} mph`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="text-accent text-sm font-bold animate-pulse">Scanning AO…</div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Radius indicator */}
        <div className="absolute bottom-3 left-3 z-20 text-[10px] text-gray-500 bg-black/60 px-2 py-1 rounded">
          {radiusMiles} mi radius · {pilots.length} pilots visible
        </div>
      </div>

      {/* Selected Pilot Detail Panel */}
      {selectedPilot && (
        <div className="px-5 py-4 border-t border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedPilot.verified ? 'bg-green-500/10' : 'bg-blue-500/10'
              }`}>
                <span className="text-accent text-sm font-bold">
                  {selectedPilot.vehicle_number?.slice(0, 2) || '🚛'}
                </span>
              </div>
              <div>
                <div className="text-white text-sm font-medium flex items-center gap-2">
                  {selectedPilot.driver_name || selectedPilot.vehicle_number || `Pilot ${selectedPilot.id.slice(-4)}`}
                  {selectedPilot.verified && (
                    <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                      ELD Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                  <span>{selectedPilot.distance_miles.toFixed(1)} mi away</span>
                  {selectedPilot.speed_mph != null && (
                    <span>
                      {Math.round(selectedPilot.speed_mph)} mph {headingToCompass(selectedPilot.heading)}
                    </span>
                  )}
                  {selectedPilot.hos_hours_remaining != null && (
                    <span className={selectedPilot.hos_hours_remaining < 2 ? 'text-red-400' : 'text-green-400'}>
                      {selectedPilot.hos_hours_remaining.toFixed(1)}h HOS
                    </span>
                  )}
                  <span>Updated {timeAgo(selectedPilot.recorded_at)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedPilot(null)}
              className="text-gray-600 hover:text-white text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pilot List (scrollable) */}
      {pilots.length > 0 && (
        <div className="border-t border-white/[0.04] max-h-[240px] overflow-y-auto">
          <div className="divide-y divide-white/[0.03]">
            {pilots.slice(0, 15).map((pilot) => (
              <button
                key={pilot.id}
                onClick={() => setSelectedPilot(pilot)}
                className={`w-full px-5 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left ${
                  selectedPilot?.id === pilot.id ? 'bg-accent/[0.05]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${pilot.verified ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <div>
                    <div className="text-white text-xs font-medium">
                      {pilot.driver_name || pilot.vehicle_number || `Pilot ${pilot.id.slice(-4)}`}
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2">
                      {pilot.speed_mph != null && <span>{Math.round(pilot.speed_mph)} mph {headingToCompass(pilot.heading)}</span>}
                      <span>{timeAgo(pilot.recorded_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-accent font-black text-xs tabular-nums">
                  {pilot.distance_miles.toFixed(1)} mi
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && pilots.length === 0 && (
        <div className="px-5 py-8 text-center text-gray-500 text-sm">
          No pilots on standby in this AO right now.
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-2 bg-white/[0.01] text-[10px] text-gray-600 text-center border-t border-white/[0.04]">
        🟢 ELD Verified via Motive · 🔵 Phone GPS · Positions refresh every {refreshInterval}s
      </div>
    </div>
  );
}
