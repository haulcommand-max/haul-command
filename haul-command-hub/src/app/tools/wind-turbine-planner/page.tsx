'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';
import ToolResultCTA, { TOOL_CTAS } from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

// Wind turbine specific routing data
const TURBINE_SPECS = [
  { label: 'Standard Blade (150ft)', lengthFt: 150, weightLbs: 25000, escorts: 2, police: false },
  { label: 'Large Blade (200ft)',    lengthFt: 200, weightLbs: 35000, escorts: 3, police: true  },
  { label: 'XL Blade (250ft)',       lengthFt: 250, weightLbs: 45000, escorts: 4, police: true  },
  { label: 'XXL Blade (300ft+)',     lengthFt: 300, weightLbs: 60000, escorts: 5, police: true  },
  { label: 'Nacelle (std)',          lengthFt: 40,  weightLbs: 110000, escorts: 2, police: false },
  { label: 'Tower Section',          lengthFt: 85,  weightLbs: 80000, escorts: 2, police: false },
];

export default function WindTurbinePage() {
  const [spec, setSpec] = useState(0);
  const [state, setState] = useState('TX');
  const [result, setResult] = useState<typeof TURBINE_SPECS[0] & {
    isSuperload: boolean;
    specialRouting: boolean;
    estimatedCost: number;
  } | null>(null);

  const WIND_STATES = ['TX', 'IA', 'OK', 'KS', 'CA', 'IL', 'MN', 'CO', 'ND', 'OR'];

  function calculate() {
    const selected = TURBINE_SPECS[spec];
    const isSuperload = selected.lengthFt > 200 || selected.weightLbs > 100000;
    const specialRouting = selected.lengthFt > 150; // blade runners + turning radius analysis
    const estimatedCost = 
      (selected.escorts * 800) +           // escort vehicles per day
      (selected.police ? 2000 : 0) +       // police escort
      (isSuperload ? 3000 : 800) +          // permits
      (specialRouting ? 5000 : 0);          // route survey + blade runner

    setResult({ ...selected, isSuperload, specialRouting, estimatedCost });
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
          <span className="text-white">Wind Turbine Transport Planner</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-4">
            <span className="text-green-400 text-xs font-bold">🌬️ EMERGING INDUSTRY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Wind Turbine <span className="text-accent">Transport Planner</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Blades are now 300+ feet long. Specialized routing, blade runner requirements, 
            escort configurations, and cost estimates for wind energy transport.
          </p>
        </header>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <div className="mb-5">
            <label className="block text-xs text-gray-400 font-bold mb-3">Component Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TURBINE_SPECS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSpec(i)}
                  className={`text-sm px-4 py-3 rounded-xl border transition-all text-left ${
                    spec === i
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : 'bg-white/[0.03] text-gray-400 border-white/10 hover:border-accent/20'
                  }`}
                >
                  <div className="font-bold">{s.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {s.lengthFt}ft · {(s.weightLbs/1000).toFixed(0)}K lbs · {s.escorts} escorts
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs text-gray-400 font-bold mb-2">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
            >
              {WIND_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-accent text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            Plan Transport →
          </button>
        </div>

        {result && (
          <div className="space-y-4 mb-6">
            <div className={`rounded-2xl p-6 border ${result.isSuperload ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <p className={`text-xl font-black mb-4 ${result.isSuperload ? 'text-red-300' : 'text-green-400'}`}>
                {result.isSuperload ? '🚨 SUPERLOAD CLASSIFICATION' : '✅ STANDARD OVERSIZE'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Escorts Required</p>
                  <p className="text-white font-bold text-lg">{result.escorts}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Police Escort</p>
                  <p className={`font-bold text-lg ${result.police ? 'text-red-300' : 'text-green-400'}`}>
                    {result.police ? 'Required' : 'No'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Blade Runner</p>
                  <p className={`font-bold text-lg ${result.specialRouting ? 'text-yellow-300' : 'text-gray-400'}`}>
                    {result.specialRouting ? 'Required' : 'No'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Est. Cost/Day</p>
                  <p className="text-accent font-bold text-lg">${result.estimatedCost.toLocaleString()}</p>
                </div>
              </div>

              {result.specialRouting && (
                <div className="flex items-start gap-2 text-xs text-yellow-300 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mb-4">
                  <span className="flex-shrink-0">⚠️</span>
                  <p>Turning radius analysis required. Route survey and advance notice to utility companies for power line clearance. Blade runner attachment may be needed at turns.</p>
                </div>
              )}

              <ToolResultCTA
                context="Need specialized escorts for this wind turbine transport?"
                primary={{ label: 'Find Heavy Haul Escorts', href: '/directory', icon: '🔍' }}
                secondary={{ label: 'Post This Transport', href: '/loads', icon: '📦' }}
              />
            </div>
          </div>
        )}

        <ToolDisclaimer
          dataSource="FHWA oversize transport guidelines and state DOT blade transport policies"
          jurisdiction="United States — state-specific rules apply"
        />
      </main>
    </>
  );
}
