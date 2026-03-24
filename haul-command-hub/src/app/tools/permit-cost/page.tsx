'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer, { TOOL_DISCLAIMERS } from '@/components/hc/ToolDisclaimer';
import ToolResultCTA, { TOOL_CTAS } from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

// State permit cost database (approximate fee schedules)
const STATE_PERMIT_DATA: Record<string, { single: number; multi: number; superload: number; leadDays: number }> = {
  TX: { single: 60,  multi: 90,  superload: 500,  leadDays: 3 },
  FL: { single: 40,  multi: 60,  superload: 250,  leadDays: 2 },
  CA: { single: 16,  multi: 48,  superload: 1000, leadDays: 10 },
  OH: { single: 30,  multi: 75,  superload: 300,  leadDays: 3 },
  PA: { single: 35,  multi: 100, superload: 400,  leadDays: 5 },
  GA: { single: 20,  multi: 40,  superload: 200,  leadDays: 2 },
  IL: { single: 35,  multi: 75,  superload: 350,  leadDays: 3 },
  WA: { single: 39,  multi: 78,  superload: 500,  leadDays: 5 },
  OR: { single: 27,  multi: 54,  superload: 300,  leadDays: 3 },
  NC: { single: 25,  multi: 50,  superload: 250,  leadDays: 3 },
  NY: { single: 50,  multi: 100, superload: 600,  leadDays: 7 },
  AZ: { single: 15,  multi: 30,  superload: 200,  leadDays: 2 },
  CO: { single: 20,  multi: 40,  superload: 250,  leadDays: 3 },
  TN: { single: 25,  multi: 50,  superload: 200,  leadDays: 2 },
  MI: { single: 100, multi: 200, superload: 800,  leadDays: 5 },
};

const US_STATES = Object.keys(STATE_PERMIT_DATA).sort();
const ALL_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

interface RouteState {
  state: string;
  include: boolean;
}

export default function PermitCostPage() {
  const [routeStates, setRouteStates] = useState<RouteState[]>(
    ALL_STATES.slice(0, 5).map((s) => ({ state: s, include: s === 'TX' || s === 'FL' }))
  );
  const [isSuperload, setIsSuperload] = useState(false);
  const [result, setResult] = useState<{
    totalCost: number;
    byState: Array<{ state: string; cost: number; leadDays: number }>;
    maxLeadDays: number;
  } | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>(['TX', 'FL', 'GA']);

  function toggleState(state: string) {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  }

  function calculate() {
    const byState = selectedStates.map((st) => {
      const data = STATE_PERMIT_DATA[st] ?? { single: 30, multi: 60, superload: 300, leadDays: 3 };
      return {
        state: st,
        cost: isSuperload ? data.superload : data.single,
        leadDays: isSuperload ? data.leadDays * 3 : data.leadDays,
      };
    });
    setResult({
      totalCost: byState.reduce((a, b) => a + b.cost, 0),
      byState,
      maxLeadDays: Math.max(...byState.map((s) => s.leadDays)),
    });
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
          <span className="text-white">Permit Cost Estimator</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold">FREE TOOL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Total Permit <span className="text-accent">Cost Estimator</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Select every state on your route. Get total permit costs and lead times instantly.
            Stop quoting jobs blind.
          </p>
        </header>

        {/* Load Type */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsSuperload(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${!isSuperload ? 'bg-accent text-black border-accent' : 'bg-white/[0.03] text-gray-400 border-white/10'}`}
          >
            📋 Standard Oversize
          </button>
          <button
            onClick={() => setIsSuperload(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${isSuperload ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-white/[0.03] text-gray-400 border-white/10'}`}
          >
            🚨 Superload
          </button>
        </div>

        {/* State Selector */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Select States On Your Route</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_STATES.map((st) => (
              <button
                key={st}
                onClick={() => toggleState(st)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  selectedStates.includes(st)
                    ? 'bg-accent text-black border-accent font-bold'
                    : 'bg-white/[0.03] text-gray-500 border-white/10 hover:border-accent/30'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600">{selectedStates.length} states selected</p>
        </div>

        <button
          onClick={calculate}
          disabled={selectedStates.length === 0}
          className="w-full bg-accent text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          Calculate Total Permit Cost →
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total Est. Cost</p>
                <p className="text-accent font-black text-2xl">${result.totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">States</p>
                <p className="text-white font-black text-2xl">{selectedStates.length}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Max Lead Time</p>
                <p className="text-white font-black text-2xl">{result.maxLeadDays}d</p>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] grid grid-cols-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <span>State</span>
                <span className="text-center">Est. Permit Fee</span>
                <span className="text-right">Lead Time</span>
              </div>
              {result.byState.map((s) => (
                <div key={s.state} className="px-4 py-3 border-b border-white/[0.04] grid grid-cols-3 text-sm">
                  <span className="text-white font-bold">{s.state}</span>
                  <span className="text-center text-accent font-bold">${s.cost}</span>
                  <span className="text-right text-gray-400">{s.leadDays} days</span>
                </div>
              ))}
            </div>

            {isSuperload && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <span className="flex-shrink-0">🚨</span>
                <p>Superload permits require 60–90 day lead times in most states. Apply immediately. Police escort required in most jurisdictions.</p>
              </div>
            )}

            <ToolResultCTA {...TOOL_CTAS.escortResult()} />
          </div>
        )}

        <ToolDisclaimer {...TOOL_DISCLAIMERS.permitCost} />
      </main>
    </>
  );
}
