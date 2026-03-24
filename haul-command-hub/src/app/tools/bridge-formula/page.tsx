'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer, { TOOL_DISCLAIMERS } from '@/components/hc/ToolDisclaimer';
import ToolResultCTA, { TOOL_CTAS } from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

// Bridge Formula B: W = 500 * (LN / (N-1) + 12N + 36)
// W = max weight, L = axle group length, N = number of axles
function bridgeFormula(axleSpacingFt: number, numAxles: number): number {
  if (numAxles < 2) return 80000;
  const w = 500 * ((axleSpacingFt * numAxles) / (numAxles - 1) + 12 * numAxles + 36);
  return Math.round(Math.min(w, 80000));
}

const AXLE_PRESETS = [
  { label: 'Single Axle', axles: 1, spacing: 0 },
  { label: 'Tandem (2)', axles: 2, spacing: 4 },
  { label: 'Tridem (3)', axles: 3, spacing: 8 },
  { label: 'Quad (4)', axles: 4, spacing: 12 },
  { label: '5-Axle (Legal Max)', axles: 5, spacing: 16 },
  { label: '7-Axle', axles: 7, spacing: 24 },
  { label: '11-Axle Goldhofer', axles: 11, spacing: 40 },
];

export default function BridgeFormulaPage() {
  const [numAxles, setNumAxles] = useState(5);
  const [axleSpacing, setAxleSpacing] = useState(16);
  const [actualWeight, setActualWeight] = useState(80000);
  const [result, setResult] = useState<{ allowed: number; legal: boolean } | null>(null);

  function calculate() {
    const allowed = bridgeFormula(axleSpacing, numAxles);
    setResult({ allowed, legal: actualWeight <= allowed });
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Bridge Formula</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold">FREE TOOL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Bridge Formula <span className="text-accent">Calculator</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Federal Bridge Formula B — instantly check if your axle configuration is legal.
            Replaces ugly government spreadsheets from 1998.
          </p>
        </header>

        {/* Quick Presets */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {AXLE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setNumAxles(p.axles); setAxleSpacing(p.spacing); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  numAxles === p.axles
                    ? 'bg-accent text-black border-accent font-bold'
                    : 'bg-white/[0.03] text-gray-400 border-white/10 hover:border-accent/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Number of Axles</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numAxles}
                onChange={(e) => setNumAxles(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Axle Group Span (ft)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={axleSpacing}
                onChange={(e) => setAxleSpacing(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Actual Weight (lbs)</label>
              <input
                type="number"
                min={0}
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <button
            onClick={calculate}
            className="w-full bg-accent text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            Check Bridge Formula →
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-6 mb-6 border ${result.legal ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{result.legal ? '✅' : '❌'}</span>
              <div>
                <p className={`text-xl font-black ${result.legal ? 'text-green-400' : 'text-red-400'}`}>
                  {result.legal ? 'LEGAL — Within Bridge Formula' : 'OVERWEIGHT — Exceeds Bridge Formula'}
                </p>
                <p className="text-gray-400 text-sm">
                  Formula B limit for {numAxles} axles over {axleSpacing}ft: <strong className="text-white">{result.allowed.toLocaleString()} lbs</strong>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Actual Weight</p>
                <p className="text-white font-bold text-sm">{actualWeight.toLocaleString()} lbs</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Formula Limit</p>
                <p className={`font-bold text-sm ${result.legal ? 'text-green-400' : 'text-red-400'}`}>
                  {result.allowed.toLocaleString()} lbs
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Margin</p>
                <p className={`font-bold text-sm ${result.legal ? 'text-green-400' : 'text-red-400'}`}>
                  {result.legal ? '+' : ''}{(result.allowed - actualWeight).toLocaleString()} lbs
                </p>
              </div>
            </div>
            <ToolResultCTA {...TOOL_CTAS.escortResult()} />
          </div>
        )}

        <ToolDisclaimer {...TOOL_DISCLAIMERS.bridgeFormula} />
      </main>
    </>
  );
}
