'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer, { TOOL_DISCLAIMERS } from '@/components/hc/ToolDisclaimer';
import ToolResultCTA, { TOOL_CTAS } from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

// Axle configurations by trailer type
const TRAILER_CONFIGS: Record<string, { axles: number; baseCapacity: number; label: string }> = {
  rgn: { axles: 2, baseCapacity: 40000, label: 'Removable Gooseneck (RGN)' },
  lowboy: { axles: 3, baseCapacity: 60000, label: '3-Axle Lowboy' },
  lowboy5: { axles: 5, baseCapacity: 80000, label: '5-Axle Lowboy' },
  flatbed: { axles: 2, baseCapacity: 48000, label: 'Flatbed' },
  step_deck: { axles: 2, baseCapacity: 48000, label: 'Step Deck' },
  modular: { axles: 8, baseCapacity: 160000, label: '8-Axle Modular' },
  goldhofer: { axles: 12, baseCapacity: 300000, label: '12-Axle Goldhofer SPMT' },
  goldhofer_large: { axles: 20, baseCapacity: 600000, label: '20-Axle Goldhofer Heavy' },
};

export default function AxleWeightPage() {
  const [trailerType, setTrailerType] = useState('lowboy5');
  const [loadWeight, setLoadWeight] = useState(80000);
  const [tractorWeight, setTractorWeight] = useState(25000);
  const [result, setResult] = useState<{
    totalWeight: number;
    perAxle: number;
    legal: boolean;
    recommendation: string;
    axlesNeeded: number;
  } | null>(null);

  function calculate() {
    const config = TRAILER_CONFIGS[trailerType];
    const trailerWeight = 15000; // avg trailer weight
    const totalWeight = loadWeight + tractorWeight + trailerWeight;
    const perAxle = Math.round(totalWeight / (config.axles + 5)); // +5 for tractor axles
    const legal = perAxle <= 20000 && totalWeight <= config.baseCapacity;
    
    // Recommend how many axles to distribute weight legally
    const axlesNeeded = Math.ceil(totalWeight / 20000);

    let recommendation = '';
    if (!legal && totalWeight > config.baseCapacity) {
      recommendation = `Overweight by ${(totalWeight - config.baseCapacity).toLocaleString()} lbs. Consider adding axles or splitting load.`;
    } else if (!legal) {
      recommendation = `Per-axle weight ${perAxle.toLocaleString()} lbs exceeds 20,000 lb limit. Spread load across more axles.`;
    } else {
      recommendation = `Configuration is within legal limits. Superload permit likely not required.`;
    }

    setResult({ totalWeight, perAxle, legal, recommendation, axlesNeeded });
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
          <span className="text-white">Axle Weight Distribution</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold">FREE TOOL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Axle Weight <span className="text-accent">Distribution</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Enter load weight and trailer type. Instantly see per-axle weight distribution,
            legal status, and recommended configuration.
          </p>
        </header>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          {/* Trailer Type */}
          <div className="mb-5">
            <label className="block text-xs text-gray-400 font-bold mb-3">Trailer Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(TRAILER_CONFIGS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTrailerType(key)}
                  className={`text-xs px-3 py-2.5 rounded-xl border transition-all text-left ${
                    trailerType === key
                      ? 'bg-accent/10 border-accent/40 text-accent'
                      : 'bg-white/[0.03] text-gray-400 border-white/10 hover:border-accent/20'
                  }`}
                >
                  <div className="font-bold">{cfg.label.split('(')[0].trim()}</div>
                  <div className="text-[10px] opacity-60">{cfg.axles} axles · {(cfg.baseCapacity/1000).toFixed(0)}K cap</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Load Weight (lbs)</label>
              <input
                type="number"
                min={0}
                value={loadWeight}
                onChange={(e) => setLoadWeight(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Tractor Weight (lbs)</label>
              <input
                type="number"
                min={0}
                value={tractorWeight}
                onChange={(e) => setTractorWeight(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-accent text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            Calculate Axle Distribution →
          </button>
        </div>

        {result && (
          <div className={`rounded-2xl p-6 mb-6 border ${result.legal ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{result.legal ? '✅' : '⚠️'}</span>
              <p className={`text-xl font-black ${result.legal ? 'text-green-400' : 'text-red-400'}`}>
                {result.legal ? 'LEGAL CONFIGURATION' : 'EXCEEDS LEGAL LIMITS'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Total Weight</p>
                <p className="text-white font-bold text-sm">{result.totalWeight.toLocaleString()} lbs</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Per Axle (avg)</p>
                <p className={`font-bold text-sm ${result.perAxle <= 20000 ? 'text-green-400' : 'text-red-400'}`}>
                  {result.perAxle.toLocaleString()} lbs
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Min Axles Needed</p>
                <p className="text-white font-bold text-sm">{result.axlesNeeded}</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-4">{result.recommendation}</p>
            <ToolResultCTA {...TOOL_CTAS.escortResult()} />
          </div>
        )}

        <ToolDisclaimer {...TOOL_DISCLAIMERS.axleWeight} />
      </main>
    </>
  );
}
