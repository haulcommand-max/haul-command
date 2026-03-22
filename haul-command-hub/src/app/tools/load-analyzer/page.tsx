'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════
   LOAD INTELLIGENCE ANALYZER — /tools/load-analyzer
   Avoid bad loads. Every field scored.
   Free: Profit Score only
   Pro: Full 4-section report
   ══════════════════════════════════════════════════════ */

interface AnalysisResult {
  profitScore: number;
  riskScore: number;
  hiddenCosts: string[];
  recommendation: 'accept' | 'negotiate' | 'decline';
  reasoning: string;
  corridorAvgRate: number;
  isPro: boolean;
}

const LOAD_TYPES = [
  'Wind Blade', 'Transformer', 'Modular Building', 'Bridge Beam',
  'Generator', 'Vessel/Tank', 'Construction Equipment', 'Military',
  'Manufacturing Equipment', 'Other Oversize',
];

export default function LoadAnalyzerPage() {
  const [mode, setMode] = useState<'paste' | 'manual'>('manual');
  const [pastedText, setPastedText] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');
  const [loadType, setLoadType] = useState('');
  const [offeredRate, setOfferedRate] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    setLoading(true);
    setError('');
    setResult(null);

    const payload = mode === 'paste'
      ? { pastedText }
      : { origin, destination, width, height, length, weight, loadType, offeredRate };

    try {
      const res = await fetch('/api/tools/load-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 25) return 'text-orange-400';
    return 'text-red-400';
  }

  function getScoreBg(score: number) {
    if (score >= 75) return 'bg-green-500/10 border-green-500/20';
    if (score >= 50) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 25) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  }

  function getRecommendationStyle(rec: string) {
    switch (rec) {
      case 'accept': return { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', label: '✅ ACCEPT', desc: 'This load looks profitable and low-risk.' };
      case 'negotiate': return { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: '⚠️ NEGOTIATE', desc: 'This load has potential but the rate needs adjustment.' };
      case 'decline': return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: '❌ DECLINE', desc: 'Hidden costs and risks make this load unprofitable.' };
      default: return { bg: 'bg-white/5 border-white/10', text: 'text-white', label: 'ANALYZE', desc: '' };
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools/escort-calculator" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Load Analyzer</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              ⚠️ Avoid Bad Loads
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter mb-3">
            Load Intelligence <span className="text-accent">Analyzer</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Paste a load description or enter details manually. Get a profit score, risk assessment, 
            hidden cost breakdown, and accept/decline recommendation — before you commit.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-3">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('paste')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  mode === 'paste' ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                📋 Paste Load Details
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  mode === 'manual' ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                ✏️ Enter Manually
              </button>
            </div>

            {mode === 'paste' ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <label className="block text-white font-semibold text-sm mb-2">
                  Paste Load Description
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the full load posting here... Include origin, destination, dimensions, weight, rate, and any special requirements."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50 min-h-[160px] resize-y"
                />
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Origin</label>
                    <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Houston, TX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Destination</label>
                    <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Dallas, TX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Width (ft)</label>
                    <input value={width} onChange={(e) => setWidth(e.target.value)} type="number" placeholder="12" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Height (ft)</label>
                    <input value={height} onChange={(e) => setHeight(e.target.value)} type="number" placeholder="14" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Length (ft)</label>
                    <input value={length} onChange={(e) => setLength(e.target.value)} type="number" placeholder="80" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Weight (lbs)</label>
                    <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="120000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Load Type</label>
                    <select value={loadType} onChange={(e) => setLoadType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50">
                      <option value="" className="bg-gray-900">Select type</option>
                      {LOAD_TYPES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Offered Rate ($/day)</label>
                    <input value={offeredRate} onChange={(e) => setOfferedRate(e.target.value)} type="number" placeholder="380" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-6 w-full bg-accent text-black py-3.5 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Analyzing Load...' : '🔍 Analyze This Load'}
            </button>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {!result && !loading && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-white font-bold text-lg mb-2">Your Analysis Will Appear Here</h3>
                <p className="text-gray-500 text-sm">Enter load details and click Analyze to get your profit score, risk assessment, and recommendation.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-white font-bold">Analyzing your load...</h3>
                <p className="text-gray-500 text-sm mt-2">Checking corridor rates, jurisdiction requirements, and hidden costs</p>
              </div>
            )}

            {result && (
              <>
                {/* Profit Score — Always visible */}
                <div className={`rounded-2xl border p-6 ${getScoreBg(result.profitScore)}`}>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Profit Score</div>
                  <div className={`text-5xl font-black tabular-nums ${getScoreColor(result.profitScore)}`}>
                    {result.profitScore}<span className="text-lg text-gray-500">/100</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Based on offered rate vs corridor average of ${result.corridorAvgRate}/day
                  </p>
                </div>

                {/* Pro-gated sections */}
                {result.isPro ? (
                  <>
                    {/* Risk Score */}
                    <div className={`rounded-2xl border p-6 ${getScoreBg(100 - result.riskScore)}`}>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Risk Score</div>
                      <div className={`text-4xl font-black tabular-nums ${getScoreColor(100 - result.riskScore)}`}>
                        {result.riskScore}<span className="text-lg text-gray-500">/100</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-2">Higher = more complexity and risk</p>
                    </div>

                    {/* Hidden Costs */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Hidden Costs</div>
                      {result.hiddenCosts.length > 0 ? (
                        <ul className="space-y-2">
                          {result.hiddenCosts.map((cost, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-red-400 mt-0.5">💰</span>
                              <span className="text-gray-300">{cost}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-green-400 text-sm">No significant hidden costs detected</p>
                      )}
                    </div>

                    {/* Recommendation */}
                    <div className={`rounded-2xl border p-6 ${getRecommendationStyle(result.recommendation).bg}`}>
                      <div className={`text-2xl font-black mb-2 ${getRecommendationStyle(result.recommendation).text}`}>
                        {getRecommendationStyle(result.recommendation).label}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.reasoning}</p>
                    </div>
                  </>
                ) : (
                  /* Pro gate */
                  <div className="bg-gradient-to-b from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-3">🔒</div>
                    <h3 className="text-white font-bold text-lg mb-2">Unlock Full Report</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Get Risk Score, Hidden Costs breakdown, and Accept/Negotiate/Decline recommendation with specific reasoning.
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

        {/* Trust */}
        <div className="mt-12 bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 text-center">
          <p className="text-gray-600 text-[10px]">
            Analysis is based on corridor rate benchmarks, dimensional complexity scoring, and jurisdiction-specific compliance data.
            Always verify requirements with state DOT before movement.
          </p>
        </div>
      </main>
    </>
  );
}
