import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle, TrendingUp, MapPin, Zap, Radio, ArrowRight, BarChart3 } from 'lucide-react';

type CorridorShortageRow = {
  id: string | number;
  name: string | null;
  slug: string | null;
  state_from: string | null;
  state_to: string | null;
  demand_score: number | null;
  operator_count: number | null;
};

type StateShortageRow = {
  state_code: string;
  state_name: string;
  supply_score: number | null;
  demand_score: number | null;
  shortage_index: number | null;
};

export const metadata: Metadata = {
  title: 'Escort Shortage Index 2026 — Where Pilot Cars Are Scarce | Haul Command',
  description: 'Pilot car and escort shortage signals by corridor and region where Haul Command has verified data. Sparse markets are labeled instead of filled with fake scarcity.',
  alternates: { canonical: 'https://www.haulcommand.com/shortage-index' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Escort Shortage Index — Haul Command',
    description: 'Which corridors have verified demand and available escort context right now.',
  },
};

async function getShortageData() {
  const supabase = await createClient();

  const [corridors, states] = await Promise.all([
    supabase
      .from('hc_corridors')
      .select('id, name, slug, state_from, state_to, demand_score, operator_count')
      .order('demand_score', { ascending: false })
      .limit(20),
    supabase
      .from('hc_rm_radar_us_states')
      .select('state_code, state_name, supply_score, demand_score, shortage_index')
      .order('shortage_index', { ascending: false })
      .limit(15),
  ]);

  return {
    corridors: corridors.error ? [] : (corridors.data || []),
    states: states.error ? [] : (states.data || []),
  };
}

const SHORTAGE_COLORS = {
  critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', label: 'Critical' },
  high:     { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', label: 'High' },
  moderate: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Moderate' },
  low:      { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400', label: 'Low' },
};

function getShortageLevel(demand: number, supply: number): keyof typeof SHORTAGE_COLORS {
  const ratio = supply > 0 ? demand / supply : 10;
  if (ratio > 4) return 'critical';
  if (ratio > 2.5) return 'high';
  if (ratio > 1.5) return 'moderate';
  return 'low';
}

export default async function ShortageIndexPage() {
  const { corridors, states } = await getShortageData();

  const topCorridors = (corridors as CorridorShortageRow[]).filter((corridor) => (
    typeof corridor.demand_score === 'number'
    && typeof corridor.operator_count === 'number'
    && corridor.operator_count > 0
  ));
  const topStates = (states as StateShortageRow[]).filter((state) => (
    typeof state.demand_score === 'number'
    && typeof state.supply_score === 'number'
    && typeof state.shortage_index === 'number'
  ));

  return (
    <div className="min-h-screen text-white">
      {/* HERO */}
      <section className="pt-24 pb-12 px-4 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live Signal Data
            </span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-gray-400">Updated Daily</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Escort Shortage Index<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6923A] to-[#F1A91B]">2026 Live Data</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-8">
            Which corridors have verified demand and available pilot car context right now. Sparse markets are labeled conservatively instead of filled with fake scarcity.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/available-now" className="flex items-center gap-2 px-5 py-2.5 bg-[#F1A91B] text-black font-black rounded-xl hover:bg-[#D4951A] transition-all text-sm">
              <Radio className="w-4 h-4" /> See Who&apos;s Available Now
            </Link>
            <Link href="/directory" className="px-5 py-2.5 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-all">Find Operators →</Link>
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            <strong className="text-blue-400">Methodology:</strong> Shortage Index = (demand signals ÷ available operator capacity) per corridor over a rolling 30-day window. Signals sourced from load board activity, broker search volume, availability broadcasts, and operator location data. Demand scores normalized 0–100.
          </p>
        </div>
      </div>

      {/* TOP SHORTAGE CORRIDORS */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#F1A91B]" />
            <h2 className="text-2xl font-black text-white">Highest Demand Corridors</h2>
          </div>
          <Link href="/corridors" className="text-sm font-semibold text-[#C6923A] hover:text-[#F1A91B] transition-colors">All corridors →</Link>
        </div>

        <div className="space-y-3">
          {topCorridors.length > 0 ? topCorridors.slice(0, 10).map((corridor, i) => {
            const demand = Number(corridor.demand_score ?? 0);
            const supply = Number(corridor.operator_count ?? 0);
            const level = getShortageLevel(demand, supply);
            const colors = SHORTAGE_COLORS[level];
            const ratio = supply > 0 ? (demand / supply).toFixed(1) : '∞';

            return (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${colors.border} ${colors.bg} group hover:opacity-90 transition-all`}>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-gray-500 w-5 text-right">{i + 1}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{corridor.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {corridor.state_from && corridor.state_to ? `${corridor.state_from} → ${corridor.state_to}` : 'Multi-state'}
                      <span className="mx-2 text-gray-600">·</span>
                      {supply} operators in network
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Demand/Supply</div>
                    <div className={`text-lg font-black ${colors.text}`}>{ratio}×</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${colors.bg} ${colors.border} border ${colors.text}`}>{colors.label}</div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Demand</div>
                    <div className="text-sm font-black text-white">{demand}</div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-6">
              <h3 className="text-xl font-black text-white">No verified corridor shortage rows are ready yet</h3>
              <p className="mt-2 text-sm leading-6 text-[#fff7e8]">
                Haul Command is still collecting enough corridor demand, availability, and operator signals to publish a ranked shortage list. Use the actions below to search supply or broadcast availability without inventing demand.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* STATE SHORTAGE TABLE */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-[#F1A91B]" />
          <h2 className="text-2xl font-black text-white">State-Level Shortage Index</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">State</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Demand</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Supply</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Shortage Index</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Level</th>
              </tr>
            </thead>
            <tbody>
              {topStates.length > 0 ? topStates.map((state, i) => {
                const level = getShortageLevel(state.demand_score, state.supply_score);
                const colors = SHORTAGE_COLORS[level];
                return (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/escort-requirements/${state.state_code.toLowerCase()}`} className="font-bold text-white hover:text-[#F1A91B] transition-colors">
                        {state.state_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{state.demand_score}</td>
                    <td className="py-3 px-4 text-center text-gray-300">{state.supply_score}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full ${level === 'critical' ? 'bg-red-500' : level === 'high' ? 'bg-orange-500' : level === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, Number(state.shortage_index ?? 0))}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${colors.text}`}>{state.shortage_index ?? 'n/a'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} border ${colors.border} ${colors.text}`}>{colors.label}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-sm text-gray-400">
                    State-level shortage signals are not verified yet. This table stays empty until real supply and demand rows exist.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* OPERATORS CTA */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]">
        <div className="hc-glass-panel rounded-2xl p-8 text-center">
          <Zap className="w-10 h-10 text-[#F1A91B] mx-auto mb-4" />
          <h3 className="text-2xl font-black text-white mb-3">Work Is Waiting in These Corridors</h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            If you&apos;re a pilot car operator in a shortage corridor, you have leverage. Claim your free listing to get found by brokers actively searching your lanes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/claim" className="px-8 py-3 bg-[#F1A91B] text-black font-black rounded-xl hover:bg-[#D4951A] transition-all">Claim Your Free Listing</Link>
            <Link href="/available-now" className="px-8 py-3 border border-white/10 text-white font-semibold rounded-xl hover:border-white/20 transition-all">Broadcast Availability</Link>
          </div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="max-w-5xl mx-auto px-4 pb-16 border-t border-white/[0.06] pt-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Related Intelligence</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/corridors', label: 'All Active Corridors' },
            { href: '/rates/guide/pilot-car', label: 'Pilot Car Rate Guide 2026' },
            { href: '/directory', label: 'Operator Directory' },
            { href: '/available-now', label: 'Available Now' },
            { href: '/tools/escort-calculator', label: 'Escort Count Calculator' },
            { href: '/escort-requirements', label: 'Requirements by State' },
            { href: '/training', label: 'Get PEVO Certified' },
            { href: '/market-data', label: 'Market Data' },
            { href: '/blog', label: 'Industry Intelligence' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-300 hover:text-[#C6923A] hover:border-[#C6923A]/30 transition-all">{link.label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
