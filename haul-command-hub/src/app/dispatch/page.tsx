'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Load {
  id: string;
  origin: string;
  destination: string;
  origin_state: string;
  service_type: string;
  distance_miles: number;
  urgency: string;
  status: string;
  recommended_price_mid: number;
  surge_active: boolean;
  created_at: string;
}

interface DispatchMatch {
  operatorName: string;
  score: number;
  recommendedPrice: { low: number; mid: number; high: number };
  phone?: string;
  hcTrustNumber?: string;
}

const URGENCY_COLOR: Record<string, string> = {
  same_day: 'text-red-400 border-red-500/30 bg-red-500/10',
  high:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  normal:   'text-blue-400 border-blue-500/30 bg-blue-500/10',
  low:      'text-gray-400 border-gray-500/30 bg-gray-500/10',
};

const SERVICE_ICONS: Record<string, string> = {
  lead_chase:    '🚗',
  height_pole:   '📏',
  bucket_truck:  '🚛',
  route_survey:  '🗺️',
  police_escort: '🚔',
};

export default function LiveDispatchPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [matches, setMatches] = useState<DispatchMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [postForm, setPostForm] = useState({ origin: '', destination: '', originState: '', serviceType: 'lead_chase', distanceMiles: '', urgency: 'normal' });
  const [posting, setPosting] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (msg: string) => setEvents(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 19)]);

  // Real-time subscription to loads
  useEffect(() => {
    // Initial load
    supabase.from('hc_loads').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setLoads(data); });

    const channel = supabase.channel('loads_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hc_loads' }, payload => {
        setLoads(prev => [payload.new as Load, ...prev.slice(0, 29)]);
        addEvent(`New load: ${(payload.new as Load).origin} → ${(payload.new as Load).destination}`);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hc_loads' }, payload => {
        setLoads(prev => prev.map(l => l.id === payload.new.id ? payload.new as Load : l));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const findMatches = useCallback(async (load: Load) => {
    setSelectedLoad(load);
    setMatchLoading(true);
    setMatches([]);
    addEvent(`Dispatch agent running for ${load.origin} → ${load.destination}...`);

    try {
      const res = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: load.origin,
          destination: load.destination,
          originState: load.origin_state ?? 'TX',
          serviceType: load.service_type,
          distanceMiles: load.distance_miles,
          urgency: load.urgency,
        }),
      });
      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
        addEvent(`✅ ${data.match_count} operators matched${data.surge_active ? ' 🔥 SURGE ACTIVE' : ''}`);
      }
    } catch {
      addEvent('❌ Dispatch failed');
    } finally {
      setMatchLoading(false);
    }
  }, []);

  const postLoad = async () => {
    if (!postForm.origin || !postForm.destination || !postForm.distanceMiles) return;
    setPosting(true);
    addEvent('Posting new load...');

    try {
      const res = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          distanceMiles: Number(postForm.distanceMiles),
        }),
      });
      const data = await res.json();
      if (data.success) {
        addEvent(`✅ Load posted. ${data.match_count} immediate matches found.`);
        setPostForm({ origin: '', destination: '', originState: '', serviceType: 'lead_chase', distanceMiles: '', urgency: 'normal' });
        if (data.matches?.length > 0) setMatches(data.matches);
      }
    } catch {
      addEvent('❌ Post failed');
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-16 pb-24 min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                ⚡ Live <span className="text-yellow-400">Dispatch</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">Real-time load matching powered by the Haul Command AI fleet</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold">LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Post Load Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4">Post a Load</h2>
                <div className="space-y-3">
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
                    placeholder="Origin city"
                    value={postForm.origin}
                    onChange={e => setPostForm(p => ({ ...p, origin: e.target.value }))}
                  />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
                    placeholder="Destination city"
                    value={postForm.destination}
                    onChange={e => setPostForm(p => ({ ...p, destination: e.target.value }))}
                  />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
                    placeholder="Origin state (e.g. TX)"
                    value={postForm.originState}
                    onChange={e => setPostForm(p => ({ ...p, originState: e.target.value }))}
                  />
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/50"
                    value={postForm.serviceType}
                    onChange={e => setPostForm(p => ({ ...p, serviceType: e.target.value }))}
                  >
                    <option value="lead_chase">🚗 Lead/Chase Escort</option>
                    <option value="height_pole">📏 Height Pole</option>
                    <option value="bucket_truck">🚛 Bucket Truck</option>
                    <option value="route_survey">🗺️ Route Survey</option>
                    <option value="police_escort">🚔 Police Escort</option>
                  </select>
                  <input
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
                    placeholder="Distance (miles)"
                    value={postForm.distanceMiles}
                    onChange={e => setPostForm(p => ({ ...p, distanceMiles: e.target.value }))}
                  />
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/50"
                    value={postForm.urgency}
                    onChange={e => setPostForm(p => ({ ...p, urgency: e.target.value }))}
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="same_day">🔴 SAME DAY</option>
                  </select>
                  <button
                    onClick={postLoad}
                    disabled={posting}
                    className="w-full bg-yellow-400 text-black font-black py-3 rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-50"
                  >
                    {posting ? 'Dispatching...' : '⚡ Find Operators Now'}
                  </button>
                </div>
              </div>

              {/* Event Feed */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">System Feed</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {events.length === 0 && <p className="text-gray-700 text-xs">Waiting for events...</p>}
                  {events.map((e, i) => (
                    <p key={i} className="text-xs text-gray-400 font-mono">{e}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Load Stream */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Open Loads</h2>
              {loads.length === 0 && (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-center text-gray-600 text-sm">
                  No open loads. Post one to get started.
                </div>
              )}
              {loads.map(load => (
                <button
                  key={load.id}
                  onClick={() => findMatches(load)}
                  className={`w-full text-left bg-white/[0.02] border rounded-2xl p-4 hover:border-yellow-400/30 transition-all ${
                    selectedLoad?.id === load.id ? 'border-yellow-400/50 bg-yellow-400/5' : 'border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-bold text-sm">{load.origin} → {load.destination}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {SERVICE_ICONS[load.service_type]} {load.service_type.replace('_', ' ')} • {load.distance_miles} mi
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${URGENCY_COLOR[load.urgency]}`}>
                      {load.urgency.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {load.recommended_price_mid && (
                    <p className="text-yellow-400 text-xs font-bold">
                      Est. ${load.recommended_price_mid.toLocaleString()}
                      {load.surge_active && ' 🔥'}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Match Panel */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">AI Matches</h2>
              {!selectedLoad && (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-center text-gray-600 text-sm">
                  Select a load to find operators.
                </div>
              )}
              {matchLoading && (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-center">
                  <div className="w-6 h-6 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Dispatcher agent running...</p>
                </div>
              )}
              {!matchLoading && matches.length > 0 && (
                <div className="space-y-3">
                  {matches.map((m, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-bold text-sm">{m.operatorName}</p>
                          {m.hcTrustNumber && (
                            <p className="text-yellow-400/60 text-xs font-mono">{m.hcTrustNumber}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Match Score</p>
                          <p className={`font-black text-lg ${m.score >= 80 ? 'text-green-400' : m.score >= 60 ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {m.score}
                          </p>
                        </div>
                      </div>
                      <p className="text-yellow-400 text-sm font-bold mb-3">
                        ${m.recommendedPrice.low.toLocaleString()} – ${m.recommendedPrice.high.toLocaleString()}
                      </p>
                      {m.phone && (
                        <div className="flex gap-2">
                          <a
                            href={`tel:${m.phone}`}
                            className="flex-1 text-center text-xs font-bold bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 text-green-400 py-2 rounded-xl transition-colors"
                          >
                            📞 Call
                          </a>
                          <a
                            href={`sms:${m.phone}`}
                            className="flex-1 text-center text-xs font-bold bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 py-2 rounded-xl transition-colors"
                          >
                            💬 Text
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  <Link
                    href="/directory"
                    className="block text-center text-xs text-gray-500 hover:text-yellow-400 transition-colors py-2"
                  >
                    Browse all operators →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
