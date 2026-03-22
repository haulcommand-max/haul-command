'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/* ══════════════════════════════════════════════════════
   OPERATOR EARNINGS TRACKER — /dashboard/earnings
   Daily active usage driver — operators check after every run
   ══════════════════════════════════════════════════════ */

interface Run {
  id: string;
  date: string;
  corridorName: string;
  loadType: string;
  grossRate: number;
  miles: number;
  fuelCost: number;
  hours: number;
  netProfit: number;
}

interface EarningsSummary {
  totalEarningsWeek: number;
  totalEarningsMonth: number;
  totalEarningsYear: number;
  netProfitMonth: number;
  earningsPerHour: number;
  bestCorridor: string;
  bestCorridorRate: number;
  worstCorridor: string;
  worstCorridorRate: number;
  runs: Run[];
}

const DEFAULT_MPG = 8.0;
const DEFAULT_FUEL_PRICE = 3.50;

export default function EarningsTrackerPage() {
  const [mpg, setMpg] = useState(DEFAULT_MPG);
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICE);
  const [runs, setRuns] = useState<Run[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New run form
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCorridor, setNewCorridor] = useState('');
  const [newLoadType, setNewLoadType] = useState('Standard Oversize');
  const [newRate, setNewRate] = useState('');
  const [newMiles, setNewMiles] = useState('');
  const [newHours, setNewHours] = useState('');

  useEffect(() => {
    // Load from localStorage for now — would connect to Supabase in production
    const stored = localStorage.getItem('hc_operator_runs');
    if (stored) {
      const parsed = JSON.parse(stored);
      setRuns(parsed);
      calculateSummary(parsed);
    }
  }, []);

  function calculateSummary(allRuns: Run[]) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const weekRuns = allRuns.filter(r => new Date(r.date) >= weekAgo);
    const monthRuns = allRuns.filter(r => new Date(r.date) >= monthAgo);
    const yearRuns = allRuns.filter(r => new Date(r.date) >= yearAgo);

    const totalEarningsWeek = weekRuns.reduce((s, r) => s + r.grossRate, 0);
    const totalEarningsMonth = monthRuns.reduce((s, r) => s + r.grossRate, 0);
    const totalEarningsYear = yearRuns.reduce((s, r) => s + r.grossRate, 0);
    const netProfitMonth = monthRuns.reduce((s, r) => s + r.netProfit, 0);
    const totalHoursMonth = monthRuns.reduce((s, r) => s + r.hours, 0);
    const earningsPerHour = totalHoursMonth > 0 ? netProfitMonth / totalHoursMonth : 0;

    // Best/worst corridor by avg net profit
    const corridorMap = new Map<string, { total: number; count: number }>();
    allRuns.forEach(r => {
      const entry = corridorMap.get(r.corridorName) || { total: 0, count: 0 };
      entry.total += r.netProfit;
      entry.count += 1;
      corridorMap.set(r.corridorName, entry);
    });

    let bestCorridor = 'N/A', bestCorridorRate = 0;
    let worstCorridor = 'N/A', worstCorridorRate = Infinity;

    corridorMap.forEach((v, k) => {
      const avg = v.total / v.count;
      if (avg > bestCorridorRate) { bestCorridorRate = avg; bestCorridor = k; }
      if (avg < worstCorridorRate) { worstCorridorRate = avg; worstCorridor = k; }
    });

    if (worstCorridorRate === Infinity) worstCorridorRate = 0;

    setSummary({
      totalEarningsWeek,
      totalEarningsMonth,
      totalEarningsYear,
      netProfitMonth,
      earningsPerHour,
      bestCorridor,
      bestCorridorRate: Math.round(bestCorridorRate),
      worstCorridor,
      worstCorridorRate: Math.round(worstCorridorRate),
      runs: allRuns,
    });
  }

  function handleAddRun() {
    const miles = parseFloat(newMiles) || 0;
    const fuelCost = miles > 0 ? (miles / mpg) * fuelPrice : 0;
    const grossRate = parseFloat(newRate) || 0;

    const run: Run = {
      id: crypto.randomUUID(),
      date: newDate,
      corridorName: newCorridor || 'Unknown Corridor',
      loadType: newLoadType,
      grossRate,
      miles,
      fuelCost: Math.round(fuelCost * 100) / 100,
      hours: parseFloat(newHours) || 0,
      netProfit: Math.round((grossRate - fuelCost) * 100) / 100,
    };

    const updated = [run, ...runs];
    setRuns(updated);
    localStorage.setItem('hc_operator_runs', JSON.stringify(updated));
    calculateSummary(updated);

    // Reset form
    setNewCorridor('');
    setNewRate('');
    setNewMiles('');
    setNewHours('');
    setShowAddForm(false);
  }

  function deleteRun(id: string) {
    const updated = runs.filter(r => r.id !== id);
    setRuns(updated);
    localStorage.setItem('hc_operator_runs', JSON.stringify(updated));
    calculateSummary(updated);
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Earnings Tracker</span>
        </nav>

        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              Earnings <span className="text-accent">Tracker</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xl">
              Track every run. See your real numbers. Know which corridors make you money and which ones don&apos;t.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors flex-shrink-0"
          >
            + Log a Run
          </button>
        </header>

        {/* Settings Bar */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">MPG:</span>
            <input value={mpg} onChange={(e) => setMpg(parseFloat(e.target.value) || 8)} type="number" step="0.5" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-accent/50" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">Fuel $/gal:</span>
            <input value={fuelPrice} onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 3.50)} type="number" step="0.10" className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-accent/50" />
          </div>
        </div>

        {/* Add Run Form */}
        {showAddForm && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 mb-8">
            <h3 className="text-white font-bold text-sm mb-4">Log a New Run</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Date</label>
                <input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Corridor</label>
                <input value={newCorridor} onChange={(e) => setNewCorridor(e.target.value)} placeholder="I-10 Texas" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Rate ($/day)</label>
                <input value={newRate} onChange={(e) => setNewRate(e.target.value)} type="number" placeholder="380" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Miles</label>
                <input value={newMiles} onChange={(e) => setNewMiles(e.target.value)} type="number" placeholder="250" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Hours</label>
                <input value={newHours} onChange={(e) => setNewHours(e.target.value)} type="number" step="0.5" placeholder="8" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div className="flex items-end">
                <button onClick={handleAddRun} className="w-full bg-accent text-black py-2 rounded-lg font-bold text-xs hover:bg-yellow-500 transition-colors">
                  Save Run
                </button>
              </div>
            </div>
            {newMiles && parseFloat(newMiles) > 0 && (
              <p className="text-gray-500 text-[10px] mt-2">
                Est. fuel cost: ${((parseFloat(newMiles) / mpg) * fuelPrice).toFixed(2)} ({mpg} MPG × ${fuelPrice}/gal)
              </p>
            )}
          </div>
        )}

        {/* Summary Cards */}
        {summary && runs.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'This Week', value: `$${summary.totalEarningsWeek.toLocaleString()}`, sub: 'gross' },
                { label: 'This Month', value: `$${summary.totalEarningsMonth.toLocaleString()}`, sub: `$${summary.netProfitMonth.toLocaleString()} net` },
                { label: 'This Year', value: `$${summary.totalEarningsYear.toLocaleString()}`, sub: 'gross' },
                { label: '$/Hour (Net)', value: `$${summary.earningsPerHour.toFixed(0)}`, sub: 'this month' },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
                  <div className="text-2xl font-black text-accent tabular-nums mt-1">{s.value}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Corridor Intelligence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Best Corridor</div>
                <div className="text-white font-bold text-lg">{summary.bestCorridor}</div>
                <div className="text-green-400 font-black text-sm tabular-nums">${summary.bestCorridorRate}/run avg net</div>
              </div>
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Worst Corridor</div>
                <div className="text-white font-bold text-lg">{summary.worstCorridor}</div>
                <div className="text-red-400 font-black text-sm tabular-nums">${summary.worstCorridorRate}/run avg net</div>
                <p className="text-[10px] text-gray-600 mt-1">Consider repositioning to higher-yield corridors</p>
              </div>
            </div>
          </>
        )}

        {/* Run History */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Run History</h2>
          {runs.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-white font-bold text-lg mb-2">No Runs Logged Yet</h3>
              <p className="text-gray-500 text-sm mb-4">Start tracking your earnings by logging your first run.</p>
              <button onClick={() => setShowAddForm(true)} className="bg-accent text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
                + Log Your First Run
              </button>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-gray-500 text-xs px-4 py-3 font-medium">Date</th>
                      <th className="text-left text-gray-500 text-xs px-4 py-3 font-medium">Corridor</th>
                      <th className="text-right text-gray-500 text-xs px-4 py-3 font-medium">Rate</th>
                      <th className="text-right text-gray-500 text-xs px-4 py-3 font-medium">Fuel</th>
                      <th className="text-right text-gray-500 text-xs px-4 py-3 font-medium">Net</th>
                      <th className="text-right text-gray-500 text-xs px-4 py-3 font-medium">$/hr</th>
                      <th className="text-center text-gray-500 text-xs px-4 py-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.slice(0, 20).map(r => (
                      <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="text-gray-400 px-4 py-3 tabular-nums">{r.date}</td>
                        <td className="text-white px-4 py-3 font-medium">{r.corridorName}</td>
                        <td className="text-accent px-4 py-3 text-right tabular-nums font-bold">${r.grossRate}</td>
                        <td className="text-red-400 px-4 py-3 text-right tabular-nums">-${r.fuelCost.toFixed(0)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${r.netProfit.toFixed(0)}
                        </td>
                        <td className="text-gray-400 px-4 py-3 text-right tabular-nums">
                          {r.hours > 0 ? `$${(r.netProfit / r.hours).toFixed(0)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deleteRun(r.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
