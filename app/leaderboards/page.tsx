'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Clock, Medal, Star, Trophy, TrendingUp, Zap, CheckCircle, Search, ClipboardList, Circle, Gem, Car } from 'lucide-react';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { createClient } from '@/lib/supabase/client';

interface LeaderEntry {
  id: string;
  rank_position: number;
  display_name: string;
  location_label: string | null;
  country_code: string | null;
  tier_label: string | null;
  jobs_completed: number;
  km_total: number;
  avg_rating: number | null;
  review_count: number;
  avg_response_min: number | null;
  hc_index_score: number;
  trust_score: number | null;
  identity_verified: boolean | null;
  claimed: boolean | null;
  badges: string[] | null;
  window_days: number;
}

const PERIODS = [
  { days: 30, label: '30 Days', abbr: '30D' },
  { days: 90, label: '90 Days', abbr: '90D' },
  { days: 180, label: '180 Days', abbr: '180D' },
  { days: 365, label: '1 Year', abbr: '1Y' },
] as const;

const TIER: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Vanguard: { bg: 'from-amber-500/15 to-amber-900/5', text: 'text-amber-400', border: 'border-amber-500/40', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]' },
  Centurion: { bg: 'from-gray-400/10 to-gray-700/5', text: 'text-gray-300', border: 'border-gray-400/30', glow: '' },
  Sentinel: { bg: 'from-orange-700/10 to-red-900/5', text: 'text-orange-500', border: 'border-orange-700/30', glow: '' },
  Rising: { bg: 'from-emerald-500/10 to-teal-900/5', text: 'text-emerald-400', border: 'border-emerald-500/25', glow: '' },
};
const DEFAULT_TIER = { bg: 'from-white/5 to-transparent', text: 'text-gray-400', border: 'border-white/10', glow: '' };

function getTier(t: string | null) {
  return t ? (TIER[t] ?? DEFAULT_TIER) : DEFAULT_TIER;
}

const gold = '#D4A844';

export default function LeaderboardsPage() {
  const [activePeriod, setActivePeriod] = useState<30 | 90 | 180 | 365>(30);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('v_leaderboard_latest')
          .select('*')
          .eq('window_days', activePeriod)
          .order('rank_position', { ascending: true })
          .limit(20);

        if (!cancelled && !error && data && data.length > 0) {
          setLeaders(data as LeaderEntry[]);
          setIsLive(true);
        } else if (!cancelled) {
          setLeaders([]);
          setIsLive(false);
        }
      } catch {
        if (!cancelled) {
          setLeaders([]);
          setIsLive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activePeriod]);

  const top3 = leaders.slice(0, 3);

  return (
    <div className="bg-[#050505] text-white selection:bg-amber-500/30 overflow-hidden font-sans relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: 'Heavy Haul Operator Leaderboards | Haul Command', url: 'https://www.haulcommand.com/leaderboards', description: 'Rankings of top-performing heavy haul and pilot car operators — 30, 90, 180, and 365-day windows. Ranked by verified escort runs, broker trust score, and response time.' },
          { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: 'Leaderboards', item: 'https://www.haulcommand.com/leaderboards' },
          ]},
        ],
      })}} />

      <div className="absolute top-0 inset-x-0 h-96 bg-amber-500/10 blur-[150px] -z-10 rounded-full" />

      <section className="relative pt-24 pb-8 px-6 text-center z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Dominance <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Leaderboards</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light mb-2">
            Elite heavy haul operators ranked by verified completions, broker trust, and response time.
          </p>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live data · refreshed nightly</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-500/70 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />Rankings activate after verified completions</span>
          )}
        </motion.div>
      </section>

      <section className="flex justify-center gap-2 px-6 pb-8 z-10 relative">
        <div className="inline-flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setActivePeriod(p.days as 30 | 90 | 180 | 365)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                activePeriod === p.days
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePeriod}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <section className="max-w-7xl mx-auto px-6 pb-32 text-center text-sm text-gray-500 animate-pulse">
              Loading leaderboard data...
            </section>
          ) : leaders.length === 0 ? (
            <section className="max-w-4xl mx-auto px-6 pb-32 text-center z-10 relative">
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 md:p-14">
                <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-5" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Rankings Activate After Verified Completions</h2>
                <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Claim your profile and complete verified jobs to appear here. Haul Command will not show fake companies, fake rankings, or preview operators as live leaderboard data.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a href="/claim" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-black no-underline hover:bg-amber-400 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Claim Your Profile
                  </a>
                  <a href="/load-board" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white no-underline hover:bg-white/10 transition-colors">
                    <ClipboardList className="w-4 h-4" /> Open Load Board
                  </a>
                </div>
              </div>
            </section>
          ) : (
            <>
              {top3.length >= 3 && (
                <section className="max-w-7xl mx-auto px-6 pb-16 z-10 relative">
                  <div className="flex flex-col md:flex-row justify-center items-end gap-6 h-auto md:h-96">
                    <PodiumCard entry={top3[1]} rank={2} className="order-2 md:order-1 h-72 border-gray-400/20" iconClassName="text-gray-400" />
                    <div className="w-full md:w-1/3 relative z-20 order-1 md:order-2">
                      <div className="bg-gradient-to-b from-amber-500/10 to-transparent backdrop-blur-3xl border border-amber-500/40 rounded-t-3xl p-8 h-80 flex flex-col justify-between shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-600 text-white px-4 py-1 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                          <Star className="w-4 h-4" /> #1 THIS PERIOD
                        </div>
                        <div className="text-center mt-4">
                          <Medal className="w-16 h-16 mx-auto text-amber-400 mb-2 drop-shadow-lg" />
                          <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{top3[0].display_name}</h3>
                          <p className="text-amber-400/80 text-sm mt-1">{top3[0].location_label}</p>
                          {top3[0].identity_verified && <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold"><CheckCircle className="w-3 h-3" /> Verified</span>}
                        </div>
                        <div className="text-center space-y-2">
                          <p className="font-mono text-amber-400 text-xl font-bold">{top3[0].hc_index_score.toFixed(1)} <span className="text-xs text-gray-500">HC INDEX</span></p>
                          <PeriodStats e={top3[0]} gold />
                          <div className="inline-block px-4 py-1.5 bg-amber-500/20 rounded-full text-sm font-bold text-amber-400 shadow-inner">{top3[0].tier_label ?? 'Vanguard'}</div>
                        </div>
                      </div>
                    </div>
                    <PodiumCard entry={top3[2]} rank={3} className="order-3 h-64 border-orange-700/30" iconClassName="text-orange-600" />
                  </div>
                </section>
              )}

              <section className="max-w-7xl mx-auto px-6 pb-32 z-10 relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white/90">
                    Global Rankings <span className="text-amber-400 text-xl font-normal">— Last {activePeriod} Days</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {leaders.map((leader, i) => {
                    const tier = getTier(leader.tier_label);
                    return (
                      <motion.div
                        key={`${leader.id}-${activePeriod}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.4) }}
                        className={`group relative overflow-hidden bg-gradient-to-r ${tier.bg} border ${tier.border} backdrop-blur-xl rounded-2xl p-5 transition-all duration-300 ${tier.glow}`}
                      >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:via-amber-500/30 transition-colors duration-500" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-5 w-full md:w-2/5">
                            <span className="text-4xl font-black text-white/10 group-hover:text-white/20 transition-colors w-10 text-center tabular-nums shrink-0">
                              {leader.rank_position}
                            </span>
                            <div>
                              <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2 flex-wrap">
                                {leader.display_name}
                                {leader.identity_verified && <Shield className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Identity Verified" />}
                                {leader.claimed && <Zap className="w-4 h-4 text-amber-400 shrink-0" aria-label="Claimed" />}
                              </h4>
                              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                                {leader.location_label && <><MapPin className="w-3 h-3 shrink-0" />{leader.location_label}</>}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 w-full md:w-auto">
                            <StatCell label="Jobs" val={leader.jobs_completed.toLocaleString()} icon={<TrendingUp className="w-3 h-3 text-emerald-400" />} />
                            <StatCell label="Km" val={(leader.km_total / 1000).toFixed(1) + 'K'} icon={<MapPin className="w-3 h-3 text-blue-400" />} />
                            <StatCell label="Response" val={leader.avg_response_min != null ? `${leader.avg_response_min}m` : '—'} icon={<Clock className="w-3 h-3 text-amber-400" />} />
                            <StatCell label="Rating" val={leader.avg_rating != null ? `${leader.avg_rating.toFixed(2)}★` : '—'} icon={<Star className="w-3 h-3 text-amber-500 fill-amber-500/50" />} />
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className={`px-3 py-1 rounded-lg border ${tier.border} ${tier.text} bg-black/30 text-xs font-bold`}>
                              {leader.tier_label ?? 'Operator'}
                            </div>
                            <p className="text-xs font-mono text-gray-500">
                              HC <span className={tier.text}>{leader.hc_index_score.toFixed(1)}</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-8 text-center text-xs text-gray-600">
                  Rankings reflect verified completions, trust score, and response time over the last <strong className="text-gray-400">{activePeriod} days</strong>. <a href="/claim" className="text-amber-500 hover:underline">Claim your profile</a> to appear on the leaderboard.
                </div>
              </section>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <AdGridSlot zone="leaderboard_sponsor" />
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <DataTeaserStrip />
      </section>

      <NoDeadEndBlock
        heading="Join the Haul Command Elite Network"
        moves={[
          { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: 'Get listed and ranked', primary: true, color: gold },
          { href: '/directory', icon: <Search className="h-4 w-4" />, title: 'Browse Directory', desc: 'Find top-ranked operators', primary: true, color: '#22C55E' },
          { href: '/load-board', icon: <ClipboardList className="h-4 w-4" />, title: 'Open Load Board', desc: 'Active loads needing escorts' },
          { href: '/available-now', icon: <Circle className="h-4 w-4 fill-green-400 text-green-400" />, title: 'Available Now', desc: 'Operators broadcasting live' },
          { href: '/pricing', icon: <Gem className="h-4 w-4" />, title: 'Pro Verification', desc: 'Boost your rank visibility' },
          { href: '/roles/pilot-car-operator', icon: <Car className="h-4 w-4" />, title: 'Pilot Car Hub', desc: 'All pilot car resources' },
        ]}
      />

      <section className="max-w-7xl mx-auto px-6 pb-20 flex flex-wrap gap-3">
        <a href="/glossary/pilot-car" className="text-xs px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all no-underline">What Is a Pilot Car?</a>
        <a href="/escort-requirements" className="text-xs px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-amber-400 transition-all no-underline">State Escort Rules</a>
        <a href="/tools/escort-calculator" className="text-xs px-4 py-2 rounded-lg border border-amber-500/25 text-amber-400/70 hover:text-amber-400 transition-all no-underline">Escort Calculator</a>
        <a href="/directory" className="text-xs px-4 py-2 rounded-lg border border-green-500/25 text-green-400/70 hover:text-green-400 transition-all no-underline">Browse Directory</a>
      </section>
    </div>
  );
}

function PodiumCard({ entry, rank, className, iconClassName }: { entry: LeaderEntry; rank: number; className?: string; iconClassName?: string }) {
  return (
    <div className="w-full md:w-1/3 relative z-10">
      <div className={`bg-white/5 backdrop-blur-3xl border rounded-t-3xl p-6 flex flex-col justify-between shadow-2xl ${className ?? ''}`}>
        <div className="text-center">
          <Trophy className={`w-12 h-12 mx-auto mb-2 ${iconClassName ?? 'text-gray-400'}`} />
          <h3 className="text-2xl font-bold">{entry.display_name}</h3>
          <p className="text-gray-400 text-sm">{entry.location_label}</p>
        </div>
        <div className="text-center space-y-1">
          <p className="font-mono text-gray-300">HC Index: {entry.hc_index_score.toFixed(1)}</p>
          <PeriodStats e={entry} />
          <div className="inline-block px-3 py-1 bg-gray-400/20 rounded-full text-xs font-semibold text-gray-300">#{rank} · {entry.tier_label ?? 'Operator'}</div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, val, icon }: { label: string; val: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1 flex items-center justify-center gap-1">{icon}{label}</p>
      <p className="text-sm font-mono font-medium text-white/80">{val}</p>
    </div>
  );
}

function PeriodStats({ e, gold }: { e: LeaderEntry; gold?: boolean }) {
  const c = gold ? 'text-amber-300' : 'text-gray-400';
  return (
    <div className={`flex justify-center gap-3 text-xs ${c} my-1`}>
      <span>{e.jobs_completed.toLocaleString()} jobs</span>
      {e.avg_rating != null && <span>{e.avg_rating.toFixed(2)}★</span>}
      {e.avg_response_min != null && <span>{e.avg_response_min}m resp.</span>}
    </div>
  );
}
