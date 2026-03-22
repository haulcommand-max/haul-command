'use client';

import { useEffect, useState } from 'react';

interface MotiveData {
  connected: boolean;
  vehicles: Array<{ make: string; model: string; year: string; unit: string }>;
  hosAvailable: number | null; // hours remaining
  lastLocation: { lat: number; lng: number; speed: number; updatedAt: string } | null;
  lastInspection: { status: 'safe' | 'unsafe'; date: string; defects: number } | null;
}

export function FleetIntelligenceSection({ profileId }: { profileId: string }) {
  const [data, setData] = useState<MotiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/motive/fleet-data?profile_id=${profileId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) return <div className="animate-pulse h-40 bg-gray-800/50 rounded-xl" />;
  if (!data || !data.connected) return <MotiveConnectCTA />;

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Fleet Intelligence</h3>
          <p className="text-emerald-400 text-xs font-medium">ELD Verified • Real-time data from Motive</p>
        </div>
      </div>

      {/* Vehicles */}
      {data.vehicles.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Vehicles</p>
          {data.vehicles.map((v, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800/60 rounded-lg px-4 py-3">
              <span className="text-amber-400 font-mono text-sm">#{v.unit}</span>
              <span className="text-white text-sm">{v.year} {v.make} {v.model}</span>
            </div>
          ))}
        </div>
      )}

      {/* HOS */}
      {data.hosAvailable !== null && (
        <div className="bg-gray-800/60 rounded-lg px-4 py-3">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Hours Available Today</p>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${data.hosAvailable > 4 ? 'text-emerald-400' : data.hosAvailable > 1 ? 'text-amber-400' : 'text-red-400'}`}>
              {data.hosAvailable.toFixed(1)}h
            </span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div className={`h-2 rounded-full ${data.hosAvailable > 4 ? 'bg-emerald-500' : data.hosAvailable > 1 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (data.hosAvailable / 11) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Last Location */}
      {data.lastLocation && (
        <div className="bg-gray-800/60 rounded-lg px-4 py-3">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Last Known Position</p>
          <p className="text-white text-sm">{data.lastLocation.lat.toFixed(4)}, {data.lastLocation.lng.toFixed(4)}</p>
          <p className="text-gray-500 text-xs">{data.lastLocation.speed > 0 ? `Moving at ${data.lastLocation.speed} mph` : 'Stationary'} • {new Date(data.lastLocation.updatedAt).toLocaleTimeString()}</p>
        </div>
      )}

      {/* Last Inspection */}
      {data.lastInspection && (
        <div className="bg-gray-800/60 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.lastInspection.status === 'safe' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {data.lastInspection.status === 'safe'
              ? <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            }
          </div>
          <div>
            <p className="text-white text-sm font-medium">Last Inspection: {data.lastInspection.status === 'safe' ? 'Passed' : 'Failed'}</p>
            <p className="text-gray-500 text-xs">{data.lastInspection.date} • {data.lastInspection.defects} defect{data.lastInspection.defects !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function MotiveConnectCTA() {
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800/80 border border-dashed border-gray-600 rounded-2xl p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
      <h4 className="text-white font-semibold mb-1">Connect Your ELD</h4>
      <p className="text-gray-400 text-sm mb-4">Operators with ELD verification get 3× more load offers</p>
      <a href="/api/motive/connect" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
        Connect Motive
      </a>
    </section>
  );
}
