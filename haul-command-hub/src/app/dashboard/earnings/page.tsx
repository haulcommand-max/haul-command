'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

/* ══════════════════════════════════════════════════════
   OPERATOR EARNINGS TRACKER — /dashboard/earnings
   10X Mobile Upgrade: Hero metric, value cards, missed money,
   recommended actions, fixed run cards, Stripe Connect panel.
   ══════════════════════════════════════════════════════ */

// ─── Data Interfaces ─────────────────────────────────
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
  status?: 'completed' | 'pending' | 'dispatched' | 'cancelled';
}

interface EarningsSummary {
  lifetimeEarned: number;
  monthEarned: number;
  pendingPayout: number;
  upcomingPayout: number;
  completedRuns: number;
  upcomingRuns: number;
  missedOpportunities: number;
  roiMultiple: number;
  membershipPaybackDays: number;
  netProfitMonth: number;
  earningsPerHour: number;
  bestCorridor: string;
  bestCorridorRate: number;
  worstCorridor: string;
  worstCorridorRate: number;
}

interface MissedOpportunity {
  id: string;
  type: 'expired_invite' | 'missed_load' | 'incomplete_profile';
  title: string;
  estimatedValue: number;
  timeAgo: string;
  actionLabel: string;
  actionHref: string;
}

interface RecommendedAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
}

// ─── Constants ───────────────────────────────────────
const DEFAULT_MPG = 8.0;
const DEFAULT_FUEL_PRICE = 3.50;
const MEMBERSHIP_COST = 49; // Monthly membership cost

const DEMO_MISSED: MissedOpportunity[] = [
  { id: 'm1', type: 'expired_invite', title: 'I-40 Wind Blade Run — Amarillo to ABQ', estimatedValue: 420, timeAgo: '2h ago', actionLabel: 'View Similar', actionHref: '/loads' },
  { id: 'm2', type: 'missed_load', title: 'I-10 Superload Escort — Houston to LA', estimatedValue: 1200, timeAgo: '1d ago', actionLabel: 'Set Alert', actionHref: '/tools/superload-alerts' },
  { id: 'm3', type: 'incomplete_profile', title: 'Add service radius to match 34% more loads', estimatedValue: 0, timeAgo: '', actionLabel: 'Complete Profile', actionHref: '/claim' },
];

const DEMO_ACTIONS: RecommendedAction[] = [
  { id: 'a1', icon: '📡', title: 'Go Live Now', description: 'You\'re offline. Operators who stay live 8+ hrs/day earn 3.2× more.', href: '/map', priority: 'high' },
  { id: 'a2', icon: '📋', title: 'Complete Your Profile', description: 'Your profile is 72% complete. Adding certs increases matches by 41%.', href: '/claim', priority: 'high' },
  { id: 'a3', icon: '🗺️', title: 'Add Service Radius', description: 'Set your coverage zone so dispatchers can auto-match you to nearby loads.', href: '/claim', priority: 'medium' },
  { id: 'a4', icon: '⚡', title: 'Respond Faster', description: 'Your avg response time is 48 min. Top operators respond in under 15 min.', href: '/inbox', priority: 'medium' },
];

export default function EarningsTrackerPage() {
  const [mpg, setMpg] = useState(DEFAULT_MPG);
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICE);
  const [runs, setRuns] = useState<Run[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [listingClaimed] = useState(true); // Would come from auth/Supabase in production
  const [activeRunMenu, setActiveRunMenu] = useState<string | null>(null);

  // New run form
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCorridor, setNewCorridor] = useState('');
  const [newLoadType, setNewLoadType] = useState('Standard Oversize');
  const [newRate, setNewRate] = useState('');
  const [newMiles, setNewMiles] = useState('');
  const [newHours, setNewHours] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('hc_operator_runs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRuns(parsed);
        calculateSummary(parsed);
      } catch { /* invalid JSON */ }
    }
  }, []);

  function calculateSummary(allRuns: Run[]) {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const monthRuns = allRuns.filter(r => new Date(r.date) >= monthAgo);
    const yearRuns = allRuns.filter(r => new Date(r.date) >= yearAgo);

    const lifetimeEarned = allRuns.reduce((s, r) => s + r.grossRate, 0);
    const monthEarned = monthRuns.reduce((s, r) => s + r.grossRate, 0);
    const netProfitMonth = monthRuns.reduce((s, r) => s + r.netProfit, 0);
    const totalHoursMonth = monthRuns.reduce((s, r) => s + r.hours, 0);
    const earningsPerHour = totalHoursMonth > 0 ? netProfitMonth / totalHoursMonth : 0;

    // ROI calculation
    const monthsActive = Math.max(1, Math.ceil(allRuns.length / 4)); // rough estimate
    const totalCost = monthsActive * MEMBERSHIP_COST;
    const roiMultiple = totalCost > 0 ? Math.round(lifetimeEarned / totalCost) : 0;
    const dailyRate = monthEarned > 0 ? monthEarned / 30 : 0;
    const membershipPaybackDays = dailyRate > 0 ? Math.ceil(MEMBERSHIP_COST / dailyRate) : 0;

    // Corridor intel
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
      lifetimeEarned,
      monthEarned,
      pendingPayout: Math.round(lifetimeEarned * 0.12), // ~12% pending
      upcomingPayout: Math.round(monthEarned * 0.3),
      completedRuns: allRuns.length,
      upcomingRuns: yearRuns.length > 0 ? Math.ceil(yearRuns.length * 0.2) : 0,
      missedOpportunities: 3,
      roiMultiple,
      membershipPaybackDays,
      netProfitMonth,
      earningsPerHour,
      bestCorridor,
      bestCorridorRate: Math.round(bestCorridorRate),
      worstCorridor,
      worstCorridorRate: Math.round(worstCorridorRate),
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
      status: 'completed',
    };
    const updated = [run, ...runs];
    setRuns(updated);
    localStorage.setItem('hc_operator_runs', JSON.stringify(updated));
    calculateSummary(updated);
    setNewCorridor(''); setNewRate(''); setNewMiles(''); setNewHours('');
    setShowAddForm(false);
  }

  function deleteRun(id: string) {
    const updated = runs.filter(r => r.id !== id);
    setRuns(updated);
    localStorage.setItem('hc_operator_runs', JSON.stringify(updated));
    calculateSummary(updated);
    setActiveRunMenu(null);
  }

  const fmtUSD = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`;

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:py-12 overflow-x-hidden pb-24 md:pb-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Earnings</span>
        </nav>

        {/* ═══ HERO: Lifetime Earned ═══ */}
        {listingClaimed ? (
          <section className="relative mb-8 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-green-500/5" />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-accent/70 uppercase tracking-[0.2em] mb-1">Lifetime Earned with Haul Command</p>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white tabular-nums tracking-tight">
                    ${(summary?.lifetimeEarned ?? 0).toLocaleString()}
                  </div>
                  {summary && summary.roiMultiple > 0 && (
                    <p className="text-sm text-green-400 font-bold mt-2 flex items-center gap-1.5">
                      <span className="inline-flex w-5 h-5 rounded-full bg-green-500/20 items-center justify-center text-[10px]">↑</span>
                      Haul Command has paid for itself {summary.roiMultiple}×
                      {summary.membershipPaybackDays > 0 && (
                        <span className="text-gray-500 font-normal ml-1">
                          · Earned membership back in {summary.membershipPaybackDays} days
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-accent text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-colors flex-shrink-0 shadow-lg shadow-accent/20"
                >
                  + Log a Run
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* ═══ UNCLAIMED: Teaser State ═══ */
          <section className="relative mb-8 rounded-2xl overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
            <div className="relative p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl mx-auto mb-4">
                🔒
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Lifetime Earned with Haul Command</p>
              <div className="text-4xl sm:text-5xl font-black text-gray-700 tabular-nums tracking-tight mb-4 select-none">
                $••,•••
              </div>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Claim your listing to track your lifetime earnings, payouts, and completed runs.
              </p>
              <Link
                href="/claim"
                className="inline-block bg-accent text-black px-8 py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
              >
                Claim Your Listing — Free
              </Link>
            </div>
          </section>
        )}

        {/* ═══ VALUE CARDS ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'This Month', value: fmtUSD(summary?.monthEarned ?? 0), sub: 'earned', color: 'text-accent' },
            { label: 'Pending Payout', value: fmtUSD(summary?.pendingPayout ?? 0), sub: 'clearing', color: 'text-yellow-400' },
            { label: 'Upcoming', value: fmtUSD(summary?.upcomingPayout ?? 0), sub: 'scheduled', color: 'text-blue-400' },
            { label: 'Completed Runs', value: String(summary?.completedRuns ?? 0), sub: 'all time', color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{s.label}</div>
              <div className={`text-xl sm:text-2xl font-black tabular-nums mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ═══ SETTINGS BAR ═══ */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">MPG:</span>
            <input value={mpg} onChange={(e) => setMpg(parseFloat(e.target.value) || 8)} type="number" step="0.5" className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-accent/50" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">Fuel $/gal:</span>
            <input value={fuelPrice} onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 3.50)} type="number" step="0.10" className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-accent/50" />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <span className="inline-flex w-2 h-2 rounded-full bg-green-500/60" /> Net = Gross − Fuel
          </div>
        </div>

        {/* ═══ ADD RUN FORM ═══ */}
        {showAddForm && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 sm:p-6 mb-6">
            <h3 className="text-white font-bold text-sm mb-4">Log a New Run</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Date</label>
                <input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Corridor</label>
                <input value={newCorridor} onChange={(e) => setNewCorridor(e.target.value)} placeholder="I-10 Texas" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Rate ($/day)</label>
                <input value={newRate} onChange={(e) => setNewRate(e.target.value)} type="number" placeholder="380" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Miles</label>
                <input value={newMiles} onChange={(e) => setNewMiles(e.target.value)} type="number" placeholder="250" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] mb-1">Hours</label>
                <input value={newHours} onChange={(e) => setNewHours(e.target.value)} type="number" step="0.5" placeholder="8" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
              </div>
              <div className="flex items-end">
                <button onClick={handleAddRun} className="w-full bg-accent text-black py-2.5 rounded-lg font-bold text-xs hover:bg-yellow-500 transition-colors">
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

        {/* ═══ MISSED MONEY MODULE ═══ */}
        {listingClaimed && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-red-400">💸</span> Missed Money
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">{DEMO_MISSED.length}</span>
            </h2>
            <div className="space-y-2">
              {DEMO_MISSED.map(m => (
                <div key={m.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                    m.type === 'expired_invite' ? 'bg-red-500/10 text-red-400' :
                    m.type === 'missed_load' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {m.type === 'expired_invite' ? '⏰' : m.type === 'missed_load' ? '📦' : '👤'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{m.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.estimatedValue > 0 && (
                        <span className="text-red-400 text-[10px] font-bold">~${m.estimatedValue}</span>
                      )}
                      {m.timeAgo && <span className="text-gray-600 text-[10px]">{m.timeAgo}</span>}
                    </div>
                  </div>
                  <Link
                    href={m.actionHref}
                    className="bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-white/10 transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    {m.actionLabel}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ RECOMMENDED ACTIONS ═══ */}
        {listingClaimed && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span>🎯</span> Recommended Next Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACTIONS.map(a => (
                <Link
                  key={a.id}
                  href={a.href}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${
                    a.priority === 'high'
                      ? 'bg-accent/[0.04] border-accent/15 hover:border-accent/30'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-bold group-hover:text-accent transition-colors">{a.title}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">{a.description}</p>
                  </div>
                  {a.priority === 'high' && (
                    <span className="text-[8px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded flex-shrink-0 uppercase">High</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ HAUL COMMAND PAY (Stripe Connect) ═══ */}
        {summary && runs.length > 0 && (
          <>
            <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 blur-3xl rounded-full" />
              <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-5 relative z-10 gap-3">
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                    Haul Command Pay
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                  </h2>
                  <p className="text-gray-400 text-xs mt-1">Stripe Connect Express • Bank: Chase (**** 4242)</p>
                </div>
                {/* Mobile: stack buttons full width. Desktop: side by side */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors w-full sm:w-auto text-center">
                    Standard (2-day)
                  </button>
                  <button className="bg-accent text-black px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-yellow-500 transition-colors w-full sm:w-auto text-center">
                    Instant Payout
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Available</div>
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">$4,250</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Pending Escrow</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-400 tabular-nums">$1,840</div>
                  <div className="text-[10px] text-gray-500 mt-1">3 runs clearing</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Last Withdrawal</div>
                  <div className="text-sm font-bold text-white tabular-nums">$2,100 <span className="text-gray-500 font-normal">→ Chase</span></div>
                  <div className="text-[10px] text-green-400 font-medium mt-1">Cleared Yesterday</div>
                </div>
              </div>
            </div>

            {/* ═══ CORRIDOR INTELLIGENCE ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Best Corridor</div>
                <div className="text-white font-bold">{summary.bestCorridor}</div>
                <div className="text-green-400 font-black text-sm tabular-nums">${summary.bestCorridorRate}/run avg</div>
              </div>
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Worst Corridor</div>
                <div className="text-white font-bold">{summary.worstCorridor}</div>
                <div className="text-red-400 font-black text-sm tabular-nums">${summary.worstCorridorRate}/run avg</div>
              </div>
            </div>
          </>
        )}

        {/* ═══ RUN HISTORY — Mobile-optimized cards ═══ */}
        <section>
          <h2 className="text-sm font-bold text-white mb-3">Run History</h2>
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
            <div className="space-y-2">
              {runs.slice(0, 20).map(r => (
                <div key={r.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 relative">
                  {/* Row 1: Title + Payout */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-white font-bold text-sm truncate">{r.corridorName}</h3>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        {r.date} · {r.loadType} · {r.miles > 0 ? `${r.miles} mi` : ''} {r.hours > 0 ? `· ${r.hours}h` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-accent font-black text-lg tabular-nums">${r.grossRate}</div>
                      <div className={`text-[10px] font-bold tabular-nums ${r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${r.netProfit.toFixed(0)} net
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Action pills — always horizontal, never wrapping */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {r.hours > 0 && (
                      <span className="inline-flex items-center gap-1 bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap flex-shrink-0">
                        ⏱ ${(r.netProfit / r.hours).toFixed(0)}/hr
                      </span>
                    )}
                    {r.fuelCost > 0 && (
                      <span className="inline-flex items-center gap-1 bg-red-500/5 text-red-400 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap flex-shrink-0">
                        ⛽ -${r.fuelCost.toFixed(0)}
                      </span>
                    )}
                    <div className="flex-grow" />
                    <button
                      onClick={() => setActiveRunMenu(activeRunMenu === r.id ? null : r.id)}
                      className="text-gray-600 hover:text-white px-2 py-1 rounded-lg text-xs transition-colors flex-shrink-0"
                    >
                      •••
                    </button>
                  </div>

                  {/* Overflow menu */}
                  {activeRunMenu === r.id && (
                    <div className="absolute right-4 top-12 bg-[#111823] border border-white/10 rounded-xl shadow-2xl z-20 py-1 min-w-[140px]">
                      <button className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        Edit Run
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteRun(r.id)}
                        className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
