'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer, { TOOL_DISCLAIMERS } from '@/components/hc/ToolDisclaimer';
import ToolResultCTA, { TOOL_CTAS } from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

// State curfew data — travel restriction windows
const CURFEW_DATA: Record<string, {
  weekdayWindow: string;
  weekendRestriction: string;
  nightMovement: boolean;
  maxWidth: string;
  notes: string;
}> = {
  TX: { weekdayWindow: '30 min after sunrise–30 min before sunset', weekendRestriction: 'No movement Fri night–Mon morning for oversize', nightMovement: false, maxWidth: "16'0\"", notes: 'County restrictions apply in some areas' },
  FL: { weekdayWindow: '30 min after sunrise–30 min before sunset', weekendRestriction: 'Restricted Fri noon–Mon 6am for loads >12\'', nightMovement: false, maxWidth: "14'6\"", notes: 'Tourist corridor restrictions apply' },
  CA: { weekdayWindow: '1 hr after sunrise–1 hr before sunset', weekendRestriction: 'No oversize weekends in many metro areas', nightMovement: false, maxWidth: "14'0\"", notes: 'Caltrans district-specific restrictions apply' },
  OH: { weekdayWindow: '30 min after sunrise–30 min before sunset', weekendRestriction: 'Weekend movement restricted for >15\' loads', nightMovement: false, maxWidth: "16'0\"", notes: '' },
  PA: { weekdayWindow: '7am–dusk', weekendRestriction: 'No movement Sat noon–Mon 7am for superloads', nightMovement: false, maxWidth: "14'6\"", notes: 'PennDOT escort required >14\'6\"' },
  GA: { weekdayWindow: '30 min after sunrise–30 min before sunset', weekendRestriction: 'Restricted >14\' on weekends', nightMovement: false, maxWidth: "15'0\"", notes: '' },
  WA: { weekdayWindow: '30 min after sunrise–30 min before sunset', weekendRestriction: 'Restricted in Seattle metro on weekends', nightMovement: false, maxWidth: "14'6\"", notes: 'SR-99 tunnel clearance 13\'6\"' },
};

const BLACKOUT_DATES = [
  'Memorial Day weekend', 'July 4th', 'Labor Day weekend',
  'Thanksgiving week', 'Christmas week', 'New Year\'s',
];

export default function CurfewCalculatorPage() {
  const [state, setState] = useState('TX');
  const [moveDate, setMoveDate] = useState('');
  const [loadWidth, setLoadWidth] = useState('14');
  const [result, setResult] = useState<{
    canMove: boolean;
    window: string;
    restriction: string;
    notes: string;
    isHoliday: boolean;
    warningLevel: 'clear' | 'caution' | 'blocked';
  } | null>(null);

  function calculate() {
    const data = CURFEW_DATA[state] ?? CURFEW_DATA['TX'];
    const dateObj = moveDate ? new Date(moveDate) : new Date();
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const widthFt = parseFloat(loadWidth);

    // Check if holiday (simplified)
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    const isHoliday =
      (month === 6 && day === 4) ||         // July 4th
      (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) || // Thanksgiving
      (month === 11 && day >= 24 && day <= 26) || // Christmas
      (month === 11 && day === 31);          // New Year's Eve

    let canMove = true;
    let restriction = '';
    let warningLevel: 'clear' | 'caution' | 'blocked' = 'clear';

    if (isHoliday) {
      canMove = false;
      restriction = 'Holiday blackout — no oversize movement';
      warningLevel = 'blocked';
    } else if (isWeekend && widthFt > 14) {
      canMove = false;
      restriction = data.weekendRestriction;
      warningLevel = 'blocked';
    } else if (isFriday && widthFt > 14) {
      canMove = true;
      restriction = 'Move before noon Friday to avoid weekend restriction';
      warningLevel = 'caution';
    } else {
      warningLevel = 'clear';
    }

    setResult({
      canMove,
      window: data.weekdayWindow,
      restriction,
      notes: data.notes,
      isHoliday,
      warningLevel,
    });
  }

  const colorMap = {
    clear: 'green',
    caution: 'yellow',
    blocked: 'red',
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Travel Curfew Calculator</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold">FREE TOOL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Travel Curfew <span className="text-accent">Calculator</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Enter your state, date, and load width — instantly see your movement window, weekend
            restrictions, and holiday blackouts.
          </p>
        </header>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              >
                {Object.keys(CURFEW_DATA).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Planned Move Date</label>
              <input
                type="date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Load Width (ft)</label>
              <input
                type="number"
                min={8}
                max={30}
                value={loadWidth}
                onChange={(e) => setLoadWidth(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <button
            onClick={calculate}
            className="w-full bg-accent text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            Check Movement Window →
          </button>
        </div>

        {result && (
          <div className={`rounded-2xl p-6 mb-6 border ${
            result.warningLevel === 'clear' ? 'bg-green-500/10 border-green-500/30' :
            result.warningLevel === 'caution' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">
                {result.warningLevel === 'clear' ? '✅' : result.warningLevel === 'caution' ? '⚠️' : '🚫'}
              </span>
              <p className={`text-xl font-black ${
                result.warningLevel === 'clear' ? 'text-green-400' :
                result.warningLevel === 'caution' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {result.warningLevel === 'clear' ? 'CLEAR TO MOVE' :
                 result.warningLevel === 'caution' ? 'CAUTION — Restrictions Apply' :
                 'MOVEMENT BLOCKED'}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 flex-shrink-0">⏰ Travel Window:</span>
                <span className="text-white">{result.window}</span>
              </div>
              {result.restriction && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">⛔ Restriction:</span>
                  <span className={result.warningLevel === 'blocked' ? 'text-red-300' : 'text-yellow-300'}>
                    {result.restriction}
                  </span>
                </div>
              )}
              {result.notes && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 flex-shrink-0">📌 Note:</span>
                  <span className="text-gray-300">{result.notes}</span>
                </div>
              )}
            </div>

            <ToolResultCTA {...TOOL_CTAS.escortResult(state)} />
          </div>
        )}

        {/* Holiday Blackout Reference */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
          <h2 className="text-white font-bold text-sm mb-3">📅 National Blackout Periods</h2>
          <div className="grid grid-cols-2 gap-2">
            {BLACKOUT_DATES.map((d) => (
              <div key={d} className="text-xs text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {d}
              </div>
            ))}
          </div>
        </div>

        <ToolDisclaimer {...TOOL_DISCLAIMERS.curfew} />
      </main>
    </>
  );
}
