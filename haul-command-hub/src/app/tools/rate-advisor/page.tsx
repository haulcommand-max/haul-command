'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════
   PRICING INTELLIGENCE — /tools/rate-advisor
   "What should I charge?" — the exact phrase operators search for
   Free: rate range only
   Pro: full breakdown with negotiation strategy
   ══════════════════════════════════════════════════════ */

interface RateResult {
  rateLow: number;
  rateMid: number;
  rateHigh: number;
  negotiateCeiling: number;
  corridorStatus: 'hot' | 'warm' | 'cool';
  reasons: string[];
  isPro: boolean;
}

const CORRIDORS = [
  'I-10 Texas Triangle', 'I-95 East Coast', 'I-5 West Coast', 'I-40 Cross Country',
  'I-20 Southern Corridor', 'I-70 Midwest', 'I-80 Northern Route', 'I-35 Central',
  'Oklahoma Wind Belt', 'Gulf Coast Industrial', 'Great Lakes Loop', 'Pacific Northwest',
];

const LOAD_TYPES = [
  'Wind Blade', 'Transformer', 'Modular Building', 'Bridge Beam',
  'Construction Equipment', 'Generator', 'Military', 'Standard Oversize',
];

export default function RateAdvisorPage() {
  const [corridor, setCorridor] = useState('');
  const [loadType, setLoadType] = useState('');
  const [distance, setDistance] = useState('');
  const [runDate, setRunDate] = useState('');
  const [result, setResult] = useState<RateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdvise() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/tools/rate-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corridor, loadType, distance, runDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Advisory failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Hit a snag — try again');
    } finally {
      setLoading(false);
    }
  }

  const statusStyles = {
    hot: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: '🔥 HOT', desc: 'High demand, low supply — push your rate' },
    warm: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: '🟡 WARM', desc: 'Normal market conditions' },
    cool: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', label: '❄️ COOL', desc: 'Surplus supply — competitive rates' },
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools/escort-calculator" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Rate Advisor</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter mb-3">
            What Should I <span className="text-accent">Charge?</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Stop leaving money on the table. Get corridor-specific rate recommendations based on current market conditions, 
            load complexity, and supply/demand signals.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Corridor</label>
                <select value={corridor} onChange={(e) => setCorridor(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50">
                  <option value="" className="bg-gray-900">Select corridor</option>
                  {CORRIDORS.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Load Type</label>
                <select value={loadType} onChange={(e) => setLoadType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50">
                  <option value="" className="bg-gray-900">Select type</option>
                  {LOAD_TYPES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Distance (miles)</label>
                <input value={distance} onChange={(e) => setDistance(e.target.value)} type="number" placeholder="250" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Date of Run</label>
                <input value={runDate} onChange={(e) => setRunDate(e.target.value)} type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>

            <button
              onClick={handleAdvise}
              disabled={loading || !corridor}
              className="mt-6 w-full bg-accent text-black py-3.5 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Checking Rates...' : '💰 Get Rate Recommendation'}
            </button>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {!result && !loading && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-white font-bold text-lg mb-2">Rate Intelligence</h3>
                <p className="text-gray-500 text-sm">Select your corridor and load type to see what you should charge based on current market conditions.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center animate-pulse">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-white font-bold">Analyzing corridor conditions...</h3>
              </div>
            )}

            {result && (
              <>
                {/* Corridor Status */}
                <div className={`rounded-2xl border p-6 ${statusStyles[result.corridorStatus].bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Corridor Status</div>
                      <div className={`text-3xl font-black ${statusStyles[result.corridorStatus].text}`}>
                        {statusStyles[result.corridorStatus].label}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      result.corridorStatus === 'hot' ? 'bg-red-400' : 
                      result.corridorStatus === 'warm' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`} />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{statusStyles[result.corridorStatus].desc}</p>
                </div>

                {/* Rate Range — Always visible */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Recommended Rate Range</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Low</div>
                      <div className="text-2xl font-black text-gray-400">${result.rateLow}</div>
                      <div className="text-[10px] text-gray-600">/day</div>
                    </div>
                    <div className="border-x border-white/5">
                      <div className="text-xs text-accent mb-1">Target</div>
                      <div className="text-3xl font-black text-accent">${result.rateMid}</div>
                      <div className="text-[10px] text-accent/60">/day</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">High</div>
                      <div className="text-2xl font-black text-gray-400">${result.rateHigh}</div>
                      <div className="text-[10px] text-gray-600">/day</div>
                    </div>
                  </div>
                </div>

                {/* Pro-gated: Negotiate ceiling + reasons */}
                {result.isPro ? (
                  <>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Negotiate Up To</div>
                      <div className="text-4xl font-black text-green-400">${result.negotiateCeiling}<span className="text-lg text-gray-500">/day</span></div>
                      <p className="text-gray-400 text-xs mt-2">Maximum rate the market will bear on this corridor right now</p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Why This Rate</div>
                      <ul className="space-y-2">
                        {result.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-accent mt-0.5">→</span>
                            <span className="text-gray-300">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-b from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-3">🔒</div>
                    <h3 className="text-white font-bold text-lg mb-2">Unlock Negotiation Strategy</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Get the maximum negotiate-up-to price, 3 specific reasons behind the recommendation, and corridor supply/demand signals.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-block bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
                    >
                      Go Pro — $79/mo
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-12 bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 text-center">
          <p className="text-gray-600 text-[10px]">
            Rate recommendations are based on historical corridor data, seasonal patterns, and supply/demand signals.
            Actual rates may vary based on specific load requirements and market conditions.
          </p>
        </div>
      </main>
    </>
  );
}
