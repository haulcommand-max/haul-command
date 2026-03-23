'use client';

import React from 'react';

interface Vehicle {
  motive_vehicle_id: string;
  vehicle_number?: string;
  driver_name?: string;
  distance_miles: number;
  speed_mph?: number;
  heading?: number;
  hos_hours_remaining?: number;
  recorded_at: string;
}

interface NearbyVehiclesProps {
  vehicles: Vehicle[];
  title?: string;
  maxShow?: number;
}

function headingToCompass(heading: number | undefined | null): string {
  if (heading == null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(heading / 45) % 8];
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h`;
}

/**
 * NearbyVehicles — shows nearby ELD-connected escort vehicles.
 * Powers the load board "Available Near You" section.
 */
export default function NearbyVehicles({ vehicles, title = 'Nearby Pilot Vehicles', maxShow = 8 }: NearbyVehiclesProps) {
  if (!vehicles.length) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-white text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {title}
        </h3>
        <span className="text-[10px] text-gray-500">{vehicles.length} rigs tracked</span>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {vehicles.slice(0, maxShow).map((v) => (
          <div key={v.motive_vehicle_id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                {v.vehicle_number?.slice(0, 2) || '🚛'}
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {v.driver_name || `Vehicle ${v.vehicle_number || v.motive_vehicle_id.slice(-4)}`}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  {v.speed_mph != null && <span>{Math.round(v.speed_mph)} mph {headingToCompass(v.heading)}</span>}
                  {v.hos_hours_remaining != null && (
                    <span className={v.hos_hours_remaining < 2 ? 'text-red-400' : 'text-green-400'}>
                      {v.hos_hours_remaining.toFixed(1)}h HOS
                    </span>
                  )}
                  <span>{getTimeAgo(v.recorded_at)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-accent font-black text-sm tabular-nums">
                {v.distance_miles.toFixed(1)} mi
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-2 bg-white/[0.01] text-[10px] text-gray-600 text-center">
        Positions from verified ELD devices · Refreshes every 15 min
      </div>
    </div>
  );
}
