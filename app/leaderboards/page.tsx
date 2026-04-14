'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Clock, Medal, Star, Trophy, TrendingUp, Zap } from 'lucide-react';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { createClient } from '@/lib/supabase/client';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Static fallback (used only while loading / if DB is empty) â”€â”€â”€
const FALLBACK: LeaderEntry[] = [
  { id: 'f1', rank_position: 1, display_name: 'Apex Heavy Haul', location_label: 'Dallas, TX', country_code: 'US', tier_label: 'Vanguard', jobs_completed: 2450, km_total: 489000, avg_rating: 4.98, review_count: 312, avg_response_min: 2, hc_index_score: 99.8, trust_score: 98, identity_verified: true, claimed: true, badges: ['identity_verified','insurance_verified'], window_days: 30 },
  { id: 'f2', rank_position: 2, display_name: 'Titan Escort Services', location_label: 'Houston, TX', country_code: 'US', tier_label: 'Centurion', jobs_completed: 1890, km_total: 380000, avg_rating: 4.95, review_count: 228, avg_response_min: 4, hc_index_score: 98.5, trust_score: 95, identity_verified: true, claimed: true, badges: ['identity_verified'], window_days: 30 },
  { id: 'f3', rank_position: 3, display_name: 'Pioneer Pilot Cars', location_label: 'Denver, CO', country_code: 'US', tier_label: 'Centurion', jobs_completed: 1650, km_total: 312000, avg_rating: 4.90, review_count: 189, avg_response_min: 5, hc_index_score: 97.2, trust_score: 92, identity_verified: true, claimed: true, badges: [], window_days: 30 },
  { id: 'f4', rank_position: 4, display_name: 'Sentinel Transport Intel', location_label: 'Phoenix, AZ', country_code: 'US', tier_label: 'Sentinel', jobs_completed: 1420, km_total: 267000, avg_rating: 4.88, review_count: 154, avg_response_min: 8, hc_index_score: 95.9, trust_score: 88, identity_verified: false, claimed: true, badges: [], window_days: 30 },
  { id: 'f5', rank_position: 5, display_name: 'Oversize Authority', location_label: 'Atlanta, GA', country_code: 'US', tier_label: 'Sentinel', jobs_completed: 980, km_total: 198000, avg_rating: 4.85, review_count: 97, avg_response_min: 12, hc_index_score: 94.1, trust_score: 84, identity_verified: false, claimed: false, badges: [], window_days: 30 },
];

// â”€â”€ Period config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PERIODS = [
  { days: 30,  label: '30 Days',  abbr: '30D' },
  { days: 90,  label: '90 Days',  abbr: '90D' },
  { days: 180, label: '180 Days', abbr: '180D' },
  { days: 365, label: '1 Year',   abbr: '1Y' },
] as const;

// â”€â”€ Tier styling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TIER: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'Vanguard':  { bg: 'from-amber-500/15 to-amber-900/5', text: 'text-amber-400', border: 'border-amber-500/40', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]' },
  'Centurion': { bg: 'from-gray-400/10 to-gray-700/5',   text: 'text-gray-300',  border: 'border-gray-400/30',  glow: '' },
  'Sentinel':  { bg: 'from-orange-700/10 to-red-900/5',  text: 'text-orange-500', border: 'border-orange-700/30', glow: '' },
  'Rising':    { bg: 'from-emerald-500/10 to-teal-900/5', text: 'text-emerald-400', border: 'border-emerald-500/25', glow: '' },
};
const DEFAULT_TIER = { bg: 'from-white/5 to-transparent', text: 'text-gray-400', border: 'border-white/10', glow: '' };

function getTier(t: string | null) { return t ? (TIER[t] ?? DEFAULT_TIER) : DEFAULT_TIER; }

const gold = '#D4A844';

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LeaderboardsPage() {
  const [activePeriod, setActivePeriod] = useState<30 | 90 | 180 | 365>(30);
  const [leaders, setLeaders] = useState<LeaderEntry[]>(FALLBACK);
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
          // Graceful fallback — filter mock by period tag
          setLeaders(FALLBACK.map(l => ({ ...l, window_days: activePeriod })));
          setIsLive(false);
        }
      } catch {
        if (!cancelled) {
          setLeaders(FALLBACK.map(l => ({ ...l, window_days: activePeriod })));
          setIsLive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activePeriod]);

  const top3   = leaders.slice(0, 3);
  const rest   = leaders.slice(3);
  const leader = leaders[0];

  return (
    <div className=" bg-[#050505] text-white selection:bg-amber-500/30 overflow-hidden font-sans relative">
      {/* Schema */}
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

      {/* Header */}
      <section className="relative pt-24 pb-8 px-6 text-center z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Dominance <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Leaderboards</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-light mb-2">
            Elite heavy haul operators ranked by verified completions, broker trust, and response time.
          </p>
          {isLive
            ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live data · refreshed nightly</span>
            : <span className="inline-flex items-center gap-1.5 text-xs text-amber-500/70 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />Preview rankings — live data activates as operators earn verified completions</span>
          }
        </motion.div>
      </section>

      {/* â”€â”€ Period Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
          {/* â”€â”€ Top 3 Podium â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {top3.length >= 3 && (
            <section className="max-w-7xl mx-auto px-6 pb-16 z-10 relative">
              <div className="flex flex-col md:flex-row justify-center items-end gap-6 h-auto md:h-96">

                {/* Rank 2 */}
                <div className="w-full md:w-1/3 relative z-10 order-2 md:order-1">
                  <div className="bg-white/5 backdrop-blur-3xl border border-gray-400/20 rounded-t-3xl p-6 h-72 flex flex-col justify-between shadow-2xl">
                    <div className="text-center">
                      <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-2xl font-bold">{top3[1].display_name}</h3>
                      <p className="text-gray-400 text-sm">{top3[1].location_label}</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-mono text-gray-300">HC Index: {top3[1].hc_index_score.toFixed(1)}</p>
                      <PeriodStats e={top3[1]} />
                      <div className="inline-block px-3 py-1 bg-gray-400/20 rounded-full text-xs font-semibold text-gray-300">{top3[1].tier_label ?? 'Centurion'}</div>
                    </div>
                  </div>
                </div>

                {/* Rank 1 */}
                <div className="w-full md:w-1/3 relative z-20 order-1 md:order-2">
                  <div className="bg-gradient-to-b from-amber-500/10 to-transparent backdrop-blur-3xl border border-amber-500/40 rounded-t-3xl p-8 h-80 flex flex-col justify-between shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-600 text-white px-4 py-1 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
                      <Star className="w-4 h-4" /> #1 THIS PERIOD
                    </div>
                    <div className="text-center mt-4">
                      <Medal className="w-16 h-16 mx-auto text-amber-400 mb-2 drop-shadow-lg" />
                      <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{top3[0].display_name}</h3>
                      <p className="text-amber-400/80 text-sm mt-1">{top3[0].location_label}</p>
                      {top3[0].identity_verified && <span className="text-xs text-emerald-400 font-semibold">âœ“ Verified</span>}
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-mono text-amber-400 text-xl font-bold">{top3[0].hc_index_score.toFixed(1)} <span className="text-xs text-gray-500">HC INDEX</span></p>
                      <PeriodStats e={top3[0]} gold />
                      <div className="inline-block px-4 py-1.5 bg-amber-500/20 rounded-full text-sm font-bold text-amber-400 shadow-inner">{top3[0].tier_label ?? 'Vanguard'}</div>
                    </div>
                  </div>
                </div>

                {/* Rank 3 */}
                <div className="w-full md:w-1/3 relative z-10 order-3">
                  <div className="bg-white/5 backdrop-blur-3xl border border-orange-700/30 rounded-t-3xl p-6 h-64 flex flex-col justify-between shadow-2xl">
                    <div className="text-center">
                      <Trophy className="w-10 h-10 mx-auto text-orange-600 mb-2" />
                      <h3 className="text-xl font-bold">{top3[2].display_name}</h3>
                      <p className="text-gray-400 text-sm">{top3[2].location_label}</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-mono text-orange-500">HC Index: {top3[2].hc_index_score.toFixed(1)}</p>
                      <PeriodStats e={top3[2]} />
                      <div className="inline-block px-3 py-1 bg-orange-500/20 rounded-full text-xs font-semibold text-orange-500">{top3[2].tier_label ?? 'Centurion'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* â”€â”€ Full Rankings Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <section className="max-w-7xl mx-auto px-6 pb-32 z-10 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white/90">
                Global Rankings <span className="text-amber-400 text-xl font-normal">— Last {activePeriod} Days</span>
              </h2>
              {loading && <span className="text-xs text-gray-500 animate-pulse">Loading...</span>}
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
                      {/* Rank + Name */}
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

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-4 w-full md:w-auto">
                        <StatCell label="Jobs" val={leader.jobs_completed.toLocaleString()} icon={<TrendingUp className="w-3 h-3 text-emerald-400" />} />
                        <StatCell label="Km" val={(leader.km_total / 1000).toFixed(1) + 'K'} icon={<MapPin className="w-3 h-3 text-blue-400" />} />
                        <StatCell
                          label="Response"
                          val={leader.avg_response_min != null ? `${leader.avg_response_min}m` : '—'}
                          icon={<Clock className="w-3 h-3 text-amber-400" />}
                        />
                        <StatCell
                          label="Rating"
                          val={leader.avg_rating != null ? `${leader.avg_rating.toFixed(2)}â˜…` : '—'}
                          icon={<Star className="w-3 h-3 text-amber-500 fill-amber-500/50" />}
                        />
                      </div>

                      {/* Tier badge + HC Index */}
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

            {/* Period context note */}
            <div className="mt-8 text-center text-xs text-gray-600">
              Rankings reflect verified completions, trust score, and response time over the last <strong className="text-gray-400">{activePeriod} days</strong>.
              {!isLive && ' Live rankings activate as operators earn verified completions on the network.'}
              {' '}<a href="/claim" className="text-amber-500 hover:underline">Claim your profile</a> to appear on the leaderboard.
            </div>
          </section>
        </motion.div>
      </AnimatePresence>

      {/* Sponsor slot */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <AdGridSlot zone="leaderboard_sponsor" />
      </section>

      {/* Data Teaser */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <DataTeaserStrip />
      </section>

      {/* No Dead End */}
      <NoDeadEndBlock
        heading="Join the Haul Command Elite Network"
        moves={[
          { href: '/claim', icon: 'âœ“', title: 'Claim Your Profile', desc: 'Get listed and ranked', primary: true, color: gold },
          { href: '/directory', icon: 'ðŸ”', title: 'Browse Directory', desc: 'Find top-ranked operators', primary: true, color: '#22C55E' },
          { href: '/loads', icon: 'ðŸ“‹', title: 'Open Load Board', desc: 'Active loads needing escorts' },
          { href: '/available-now', icon: 'ðŸŸ¢', title: 'Available Now', desc: 'Operators broadcasting live' },
          { href: '/pricing', icon: 'ðŸ’Ž', title: 'Pro Verification', desc: 'Boost your rank visibility' },
          { href: '/roles/pilot-car-operator', icon: 'ðŸš—', title: 'Pilot Car Hub', desc: 'All pilot car resources' },
        ]}
      />

      {/* Internal link mesh */}
      <section className="max-w-7xl mx-auto px-6 pb-20 flex flex-wrap gap-3">
        <a href="/glossary/pilot-car" className="text-xs px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-amber-400 hover:border-amber-500/25 transition-all no-underline">ðŸ“– What Is a Pilot Car?</a>
        <a href="/escort-requirements" className="text-xs px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-amber-400 transition-all no-underline">âš–ï¸ State Escort Rules</a>
        <a href="/tools/escort-calculator" className="text-xs px-4 py-2 rounded-lg border border-amber-500/25 text-amber-400/70 hover:text-amber-400 transition-all no-underline">ðŸ§® Escort Calculator</a>
        <a href="/directory" className="text-xs px-4 py-2 rounded-lg border border-green-500/25 text-green-400/70 hover:text-green-400 transition-all no-underline">ðŸ” Browse Directory</a>
      </section>
    </div>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      {e.avg_rating != null && <span>{e.avg_rating.toFixed(2)}â˜…</span>}
      {e.avg_response_min != null && <span>{e.avg_response_min}m resp.</span>}
    </div>
  );
}