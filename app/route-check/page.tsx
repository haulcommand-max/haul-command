'use client';

import React, { useState, useRef, useTransition, useEffect } from 'react';
import { Globe, Truck, Map, Navigation, AlertTriangle, ShieldCheck, Zap, Send, Loader2 } from 'lucide-react';
import { AdGridSponsorSlot } from '@/app/_components/directory/AdGridSponsorSlot';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface LoadProfile {
  weight: string;
  width: string;
  height: string;
  length: string;
}

interface RouteQuery {
  origin: string;
  destination: string;
  notes: string;
}

interface SubmitResult {
  corridorSlug?: string;
  corridorName?: string;
  message: string;
  status: 'ok' | 'no_match' | 'error';
}

// â”€â”€â”€ Server action wrapper (API route) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function submitRouteRequest(query: RouteQuery, _load: LoadProfile): Promise<SubmitResult> {
  try {
    const res = await fetch('/api/route-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originText: query.origin,
        destinationText: query.destination,
        notes: query.notes,
        requesterRole: 'broker',
      }),
    });
    if (!res.ok) return { status: 'error', message: 'Server error. Try again.' };
    return await res.json();
  } catch {
    return { status: 'error', message: 'Network error. Try again.' };
  }
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function RouteIntelDashboard() {
  const [load, setLoad] = useState<LoadProfile>({ weight: '124,000', width: '14.5', height: '15.2', length: '95' });
  const [query, setQuery] = useState<RouteQuery>({ origin: '', destination: '', notes: '' });
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pre-fill from query params (?origin=...&dest=...&corridor=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('origin') || params.get('q') || '';
    const dest = params.get('dest') || '';
    if (origin || dest) setQuery(q => ({ ...q, origin, destination: dest }));
  }, []);

  function handleLoadChange(field: keyof LoadProfile, value: string) {
    setLoad(prev => ({ ...prev, [field]: value }));
  }

  function handleQueryChange(field: keyof RouteQuery, value: string) {
    setQuery(prev => ({ ...prev, [field]: value }));
    setResult(null);
  }

  function handleAnalyze() {
    if (!query.origin.trim() || !query.destination.trim()) return;
    startTransition(async () => {
      const res = await submitRouteRequest(query, load);
      setResult(res);
    });
  }

  const gold = '#D4A844';

  return (
    <div className=" bg-[#020202] text-white font-sans overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full z-0" />

      {/* Header */}

      <main className="relative z-10 max-w-screen-2xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Load Profile + Route Query */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Load Profile */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> LOAD PROFILE
            </h3>
            <div className="space-y-3">
              {([
                { label: 'Gross Weight (LBS)', field: 'weight' as const },
                { label: 'Width (FT)', field: 'width' as const },
                { label: 'Height (FT)', field: 'height' as const },
                { label: 'Length (FT)', field: 'length' as const },
              ]).map(({ label, field }) => (
                <div key={field} className="bg-black/40 border border-white/5 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1 font-mono uppercase">{label}</div>
                  <input
                    id={`load-${field}`}
                    type="text"
                    value={load[field]}
                    onChange={e => handleLoadChange(field, e.target.value)}
                    className="w-full bg-transparent text-xl font-bold font-mono text-white/90 outline-none focus:text-white"
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Route Query */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4" style={{ color: gold }} /> ROUTE CHECK
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="route-origin" className="text-xs text-gray-500 font-mono uppercase block mb-1">Origin</label>
                <input
                  id="route-origin"
                  type="text"
                  value={query.origin}
                  onChange={e => handleQueryChange('origin', e.target.value)}
                  placeholder="City, state, or port"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label htmlFor="route-destination" className="text-xs text-gray-500 font-mono uppercase block mb-1">Destination</label>
                <input
                  id="route-destination"
                  type="text"
                  value={query.destination}
                  onChange={e => handleQueryChange('destination', e.target.value)}
                  placeholder="City, state, or facility"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label htmlFor="route-notes" className="text-xs text-gray-500 font-mono uppercase block mb-1">Notes (optional)</label>
                <input
                  id="route-notes"
                  type="text"
                  value={query.notes}
                  onChange={e => handleQueryChange('notes', e.target.value)}
                  placeholder="Load type, special requirements"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                id="route-analyze-btn"
                onClick={handleAnalyze}
                disabled={isPending || !query.origin || !query.destination}
                className="w-full mt-2 py-3 flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: gold, color: '#000' }}
                aria-label="Analyze Route"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isPending ? 'Analyzing...' : 'ANALYZE ROUTE'}
              </button>
            </div>

            {/* Result card */}
            {result && (
              <div className={`mt-4 p-3 rounded-xl border text-sm ${
                result.status === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : result.status === 'no_match'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}>
                <p className="font-semibold mb-1">{result.message}</p>
                {result.corridorSlug && (
                  <a
                    href={`/corridors/${result.corridorSlug}`}
                    className="underline font-bold text-xs"
                  >
                    View {result.corridorName ?? result.corridorSlug} Corridor â†’
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Hazard Feed */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> HAUL COMMAND WAZE
            </h3>
            <div className="space-y-3">
              {[
                { event: 'Low Bridge Clearance', dist: '12mi ahead', loc: 'I-40 East', crit: true },
                { event: 'Active Work Zone', dist: '45mi ahead', loc: 'US-87 North', crit: false },
                { event: 'Weight Station Open', dist: '60mi ahead', loc: 'I-35', crit: false },
              ].map((hz, idx) => (
                <div key={idx} className={`p-3 border rounded-xl bg-black/40 ${hz.crit ? 'border-red-500/30' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-semibold ${hz.crit ? 'text-red-400' : 'text-gray-200'}`}>{hz.event}</span>
                    <span className="text-xs font-mono text-gray-500">{hz.dist}</span>
                  </div>
                  <div className="text-xs text-gray-400">{hz.loc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Map */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex-1 w-full bg-[#0a0f18] border border-blue-500/20 rounded-3xl overflow-hidden relative shadow-2xl min-h-[480px]">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-color-dodge filter brightness-50 contrast-125 grayscale"
              style={{ backgroundImage: "url('https://maps.wikimedia.org/osm-intl/9/127/198.png')" }}
            />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 10,90 Q 40,50 60,30 T 90,10" fill="none" stroke="rgba(59,130,246,0.8)" strokeWidth="0.5" strokeDasharray="1,1" />
              <circle cx="10" cy="90" r="1.5" fill="#3B82F6" className="animate-pulse" />
              <circle cx="90" cy="10" r="1.5" fill="#10B981" />
              <circle cx="50" cy="40" r="1" fill="#EF4444" className="animate-ping" />
            </svg>
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button aria-label="Map view" className="bg-black/60 p-2 rounded-lg border border-white/10 hover:bg-black text-white"><Map className="w-5 h-5" /></button>
              <button aria-label="Navigation view" className="bg-black/60 p-2 rounded-lg border border-white/10 hover:bg-black text-white"><Navigation className="w-5 h-5" /></button>
            </div>
            <div className="absolute bottom-4 inset-x-4">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-2xl">
                <div>
                  <div className="text-xs text-gray-400 font-mono mb-1">SELECTED CORRIDOR</div>
                  <div className="text-lg font-bold">
                    {query.origin && query.destination
                      ? `${query.origin} â†’ ${query.destination}`
                      : 'Texas Triangle: Dallas to Houston'}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono mb-1">TOTAL DISTANCE</div>
                    <div className="text-lg font-bold text-blue-400">239 MI</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono mb-1">EST. DURATION</div>
                    <div className="text-lg font-bold text-amber-400">4h 15m</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Jurisdiction Rules */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex-1">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> JURISDICTION RULES
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="text-emerald-400 font-bold mb-1">Texas DOT</div>
                <div className="text-sm text-gray-300">Permit accepted natively. Superload provisions active for 120k+ lbs.</div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="text-amber-400 font-bold mb-1">Pilot Car Requirements</div>
                <div className="text-sm text-gray-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>1 Front Escort (width &gt; 14&apos;)</li>
                    <li>1 Rear Escort (length &gt; 90&apos;)</li>
                    <li>Height Pole required (height &gt; 15&apos;)</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                <div className="text-gray-200 font-bold mb-1 flex items-center justify-between">
                  Curfew Restrictions <Zap className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-sm font-mono text-gray-400">No travel within Houston city limits 6AMâ€“9AM, 4PMâ€“7PM.</div>
              </div>

              <div className="mt-4">
                <AdGridSponsorSlot regionName="Corridor Coverage" type="route_survey_driver" countryCode="US" />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}