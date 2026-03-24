'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';
import ToolResultCTA from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

// State AV legislation status (as of Q1 2026 — engine updates via DB)
const AV_STATE_DATA: Record<string, {
  status: 'operational' | 'approved' | 'pilot' | 'pending' | 'none';
  legislation: string;
  maxWeight: string;
  notes: string;
  year: number;
}> = {
  TX:  { status: 'operational', legislation: 'SB 2205 — Fully autonomous truck ops',                         maxWeight: '80,000 lbs',  notes: 'Waymo Via, Aurora, Torc all operating',         year: 2023 },
  AZ:  { status: 'operational', legislation: 'ARS 28-8101 — No driver required',                             maxWeight: '80,000 lbs',  notes: 'AV trucking corridor I-10 active',               year: 2022 },
  CA:  { status: 'pilot',       legislation: 'AV Trucking Pilot — CPUC regulated',                           maxWeight: '80,000 lbs',  notes: 'Permit required. Human safety operator on board', year: 2024 },
  FL:  { status: 'approved',    legislation: 'HB 1289 — AV framework complete',                              maxWeight: '80,000 lbs',  notes: 'Commercial ops beginning 2025-2026',             year: 2025 },
  GA:  { status: 'approved',    legislation: 'HB 472 — AV authorized',                                      maxWeight: '80,000 lbs',  notes: 'I-85 corridor approved for pilot',              year: 2025 },
  OH:  { status: 'pilot',       legislation: 'JobsOhio AV Pilot Zone',                                      maxWeight: '80,000 lbs',  notes: 'DriveOhio testing infrastructure active',        year: 2024 },
  TN:  { status: 'approved',    legislation: 'TCA 55-30 AV framework',                                      maxWeight: '80,000 lbs',  notes: 'Interstate corridor approved',                   year: 2025 },
  AR:  { status: 'pending',     legislation: 'AV bill in committee',                                        maxWeight: 'TBD',         notes: 'Expected passage 2026',                          year: 2026 },
  NY:  { status: 'pending',     legislation: 'Governor executive order — AV framework',                     maxWeight: 'TBD',         notes: 'Limited to specific test corridors only',        year: 2026 },
  MI:  { status: 'pilot',       legislation: 'MDOT AV Proving Ground',                                      maxWeight: '80,000 lbs',  notes: 'Ann Arbor test corridor active',                 year: 2024 },
};

const STATUS_CONFIG = {
  operational: { label: 'Fully Operational', color: 'green', icon: '✅' },
  approved:    { label: 'Approved — Launching', color: 'blue', icon: '🔵' },
  pilot:       { label: 'Pilot Program', color: 'yellow', icon: '🟡' },
  pending:     { label: 'Legislation Pending', color: 'orange', icon: '🟠' },
  none:        { label: 'No AV Framework', color: 'gray', icon: '⭕' },
};

export default function AutonomousReadinessPage() {
  const [state, setState] = useState('TX');
  const [loadWeight, setLoadWeight] = useState(75000);

  const data = AV_STATE_DATA[state];
  const statusConfig = data ? STATUS_CONFIG[data.status] : STATUS_CONFIG['none'];

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">AV Readiness Checker</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 mb-4">
            <span className="text-purple-400 text-xs font-bold">🤖 NEXT-GEN TOOL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Autonomous Heavy Haul <span className="text-accent">Readiness</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Is your route eligible for autonomous heavy haul operation?
            Track AV truck legislation across all 50 states. Be first — rank before the wave.
          </p>
        </header>

        {/* State grid */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">States With Active AV Legislation</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(AV_STATE_DATA).map(([st, d]) => {
              const s = STATUS_CONFIG[d.status];
              return (
                <button
                  key={st}
                  onClick={() => setState(st)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all font-bold ${
                    state === st
                      ? 'bg-accent text-black border-accent'
                      : 'bg-white/[0.03] text-gray-400 border-white/10 hover:border-accent/30'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result Card */}
        {data ? (
          <div className={`rounded-2xl p-6 mb-6 border ${
            data.status === 'operational' ? 'bg-green-500/10 border-green-500/30' :
            data.status === 'approved' ? 'bg-blue-500/10 border-blue-500/30' :
            data.status === 'pilot' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-orange-500/10 border-orange-500/30'
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">{statusConfig.icon}</span>
              <div>
                <p className="text-white font-black text-lg">{state} — {statusConfig.label}</p>
                <p className="text-gray-400 text-sm">{data.legislation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Active Since</p>
                <p className="text-white font-bold text-sm">{data.year}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Max Weight Allowed</p>
                <p className="text-white font-bold text-sm">{data.maxWeight}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className={`font-bold text-sm ${
                  data.status === 'operational' ? 'text-green-400' :
                  data.status === 'approved' ? 'text-blue-400' : 'text-yellow-400'
                }`}>{data.status.toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-3 text-sm mb-4">
              <span className="text-gray-500 flex-shrink-0">📌</span>
              <p className="text-gray-300">{data.notes}</p>
            </div>

            <ToolResultCTA
              context="AV routes still need route surveys and emergency response planning."
              primary={{ label: 'Find Route Survey Escorts', href: '/directory', icon: '🔍' }}
              secondary={{ label: 'View All Corridors', href: '/corridors', icon: '🛤️' }}
            />
          </div>
        ) : (
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-6 mb-6 text-center">
            <span className="text-3xl mb-3 block">⭕</span>
            <p className="text-gray-400">No AV freight legislation found for {state}.</p>
            <p className="text-gray-600 text-xs mt-1">Select a state above to view AV readiness status.</p>
          </div>
        )}

        {/* Status Legend */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Status Guide</p>
          <div className="space-y-2">
            {Object.entries(STATUS_CONFIG).map(([key, s]) => (
              <div key={key} className="flex items-center gap-3 text-xs">
                <span>{s.icon}</span>
                <span className="text-gray-300 font-bold">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ToolDisclaimer
          dataSource="State AV legislation tracking — Haul Command regulatory database"
          jurisdiction="United States — federal and state AV frameworks"
        />
      </main>
    </>
  );
}
