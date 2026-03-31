import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import { getCanonicalStats } from '@/lib/hc-loaders/stats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Country Command Center — Haul Command',
  description: 'Internal dashboard for 120-country expansion scoring, domination tracking, and activation readiness.',
};

/* ─── Tier Config (Weighted Expansion Model) ──────────────── */
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; text: string; multiplier: number; targetCountries: number }> = {
  A: { label: 'Gold', color: '#f59f0a', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', multiplier: 1.0, targetCountries: 10 },
  B: { label: 'Blue', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', multiplier: 0.6, targetCountries: 18 },
  C: { label: 'Silver', color: '#94a3b8', bg: 'bg-slate-400/10', border: 'border-slate-400/30', text: 'text-slate-300', multiplier: 0.35, targetCountries: 26 },
  D: { label: 'Slate', color: '#64748b', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', multiplier: 0.2, targetCountries: 25 },
  E: { label: 'Copper', color: '#b45309', bg: 'bg-orange-800/10', border: 'border-orange-800/30', text: 'text-orange-700', multiplier: 0.1, targetCountries: 41 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  seed_only: { label: 'Seed', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  activation_ready: { label: 'Ready', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  expansion_now: { label: 'Expanding', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  dominate_now: { label: 'Dominating', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  monetize_now: { label: 'Monetizing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

/* ─── Country type from DB ───────────────────────────────── */
interface CountryRow {
  country_code: string;
  country_name: string;
  tier: string;
  status: string;
  country_domination_score: number;
  next_recommended_action: string | null;
  country_market_score_snapshot?: {
    alive_profile_score: number;
    seo_indexation_visibility_score: number;
    claim_conversion_score: number;
    listing_density_score: number;
    supply_liquidity_score: number;
    monetization_readiness_score: number;
  }[] | null;
}

export default async function CommandCenterPage() {
  const sb = supabaseServer();

  const [countriesResult, liveStats] = await Promise.all([
    sb
      .from('country_market')
      .select(`
        country_code, country_name, tier, status, country_domination_score, next_recommended_action,
        country_market_score_snapshot ( alive_profile_score, seo_indexation_visibility_score, claim_conversion_score, listing_density_score, supply_liquidity_score, monetization_readiness_score )
      `)
      .order('country_domination_score', { ascending: false }),
    getCanonicalStats(),
  ]);

  const { data: countries, error } = countriesResult;
  const rows: CountryRow[] = (countries as CountryRow[] | null) ?? [];

  // Aggregate stats
  const totalCountries = rows.length || 120;
  const activating = rows.filter(r => r.status === 'activation_ready').length;
  const expanding = rows.filter(r => r.status === 'expansion_now').length;
  const dominating = rows.filter(r => r.status === 'dominate_now').length;
  const monetizing = rows.filter(r => r.status === 'monetize_now').length;
  const avgScore = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + (r.country_domination_score ?? 0), 0) / rows.length)
    : 0;

  // Tier distribution
  const tierCounts: Record<string, number> = {};
  for (const r of rows) {
    const t = r.tier || 'E';
    tierCounts[t] = (tierCounts[t] ?? 0) + 1;
  }

  // Calculate global entity targets using tier-weighted model
  const basePerCountry = 25944; // non-US average
  const globalTargetEntities = 3_300_000;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full overflow-x-hidden">

        {/* ═══ HEADER ═══ */}
        <section className="relative py-12 sm:py-16 px-4 border-b border-white/5 bg-[#05080f]">
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <nav className="text-xs text-gray-500 mb-6">
              <Link href="/" className="hover:text-accent">Home</Link>
              <span className="mx-2">›</span>
              <Link href="/dashboard" className="hover:text-accent">Dashboard</Link>
              <span className="mx-2">›</span>
              <span className="text-white">Command Center</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-1">
                  Country <span className="text-accent">Command Center</span>
                </h1>
                <p className="text-gray-500 text-sm">
                  120-Country Expansion Scoring · Tier-Weighted Density Model · {globalTargetEntities.toLocaleString()} Entity Target
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 text-xs font-bold">LIVE</span>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Countries', value: String(totalCountries), accent: true },
                { label: 'Avg Score', value: String(avgScore) },
                { label: 'Activating', value: String(activating), color: 'text-cyan-400' },
                { label: 'Expanding', value: String(expanding), color: 'text-blue-400' },
                { label: 'Dominating', value: String(dominating), color: 'text-emerald-400' },
                { label: 'Monetizing', value: String(monetizing), color: 'text-amber-400' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                  <div className={`text-2xl font-black ${s.accent ? 'text-accent' : s.color || 'text-white'} ag-tick`}>
                    {s.value}
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TIER HEATMAP — Density Strip ═══ */}
        <section className="py-8 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              Tier Distribution <span className="text-gray-500 text-sm font-normal">· Weighted Density Model</span>
            </h2>

            {/* Visual Heatmap Strip */}
            <div className="flex w-full h-10 rounded-xl overflow-hidden mb-4">
              {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
                const count = tierCounts[tier] ?? cfg.targetCountries;
                const pct = Math.max((count / totalCountries) * 100, 3);
                return (
                  <div
                    key={tier}
                    className="relative flex items-center justify-center text-[10px] font-black transition-all hover:opacity-90"
                    style={{ width: `${pct}%`, backgroundColor: cfg.color + '33' }}
                    title={`Tier ${tier} (${cfg.label}): ${count} countries · ${cfg.multiplier}x density`}
                  >
                    <span style={{ color: cfg.color }}>{tier}</span>
                  </div>
                );
              })}
            </div>

            {/* Tier Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
                const count = tierCounts[tier] ?? 0;
                const entityTarget = Math.round(basePerCountry * cfg.multiplier * (count || cfg.targetCountries));
                return (
                  <div key={tier} className={`${cfg.bg} ${cfg.border} border rounded-xl p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs ${cfg.text}`}
                        style={{ backgroundColor: cfg.color + '22' }}>
                        {tier}
                      </div>
                      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 space-y-0.5">
                      <div>{count || cfg.targetCountries} countries · {cfg.multiplier}x</div>
                      <div>~{entityTarget.toLocaleString()} entities</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ COUNTRY LEADERBOARD ═══ */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              Country Leaderboard <span className="text-gray-500 text-sm font-normal">· by Domination Score</span>
            </h2>

            {rows.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm mb-3">
                  No country data loaded yet. Run the migration and seed scripts to populate.
                </p>
                <code className="text-[10px] text-gray-600 bg-white/[0.03] px-3 py-1 rounded font-mono">
                  supabase migration push
                </code>
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((country, idx) => {
                  const tierCfg = TIER_CONFIG[country.tier] || TIER_CONFIG.E;
                  const statusCfg = STATUS_CONFIG[country.status] || STATUS_CONFIG.seed_only;
                  const snapshot = Array.isArray(country.country_market_score_snapshot)
                    ? country.country_market_score_snapshot[0]
                    : null;
                  const score = country.country_domination_score ?? 0;

                  return (
                    <div
                      key={country.country_code}
                      className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/15 transition-all group"
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Rank */}
                        <div className="w-8 text-center flex-shrink-0">
                          <span className={`font-black text-lg ${idx < 3 ? 'text-accent ag-rank-glow' : 'text-gray-600'}`}>
                            {idx + 1}
                          </span>
                        </div>

                        {/* Country Info */}
                        <div className="flex-1 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">{country.country_name}</span>
                            <span className="font-mono text-[9px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {country.country_code}
                            </span>
                          </div>
                          {country.next_recommended_action && (
                            <p className="text-[10px] text-gray-600 mt-0.5 truncate max-w-[300px]">
                              Next: {country.next_recommended_action}
                            </p>
                          )}
                        </div>

                        {/* Tier Badge */}
                        <div className={`${tierCfg.bg} ${tierCfg.border} border rounded-lg px-2 py-1 flex-shrink-0`}>
                          <span className={`text-[9px] font-black ${tierCfg.text}`}>
                            TIER {country.tier} · {tierCfg.label}
                          </span>
                        </div>

                        {/* Status Chip */}
                        <div className={`${statusCfg.bg} rounded-full px-2.5 py-1 flex-shrink-0`}>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Score Bar */}
                        <div className="w-24 sm:w-32 flex-shrink-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] text-gray-600">Score</span>
                            <span className="text-[10px] font-mono text-white font-bold">{score}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-blue-500' : score >= 25 ? 'bg-amber-500' : 'bg-gray-600'
                              }`}
                              style={{ width: `${Math.min(score, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Sub-Scores */}
                        {snapshot && (
                          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                            {[
                              { label: 'Alive', value: snapshot.alive_profile_score },
                              { label: 'SEO', value: snapshot.seo_indexation_visibility_score },
                              { label: 'Claims', value: snapshot.claim_conversion_score },
                            ].map((sub) => (
                              <div key={sub.label} className="text-center">
                                <div className="text-[10px] font-mono text-gray-400">{sub.value ?? '—'}</div>
                                <div className="text-[8px] text-gray-600">{sub.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ═══ GLOBAL ENTITY TARGET ═══ */}
        <section className="py-8 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <h3 className="text-white font-bold text-base mb-4">
                Global Entity Target <span className="text-gray-500 font-normal text-sm">· Tier-Weighted Model</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Live Verified Operators', value: liveStats.total_real_operators.toLocaleString(), pct: `${liveStats.active_countries} countries`, desc: 'Real data — hc_real_operators', isLive: true },
                  { label: 'US Anchor Target', value: '1,566,000', pct: '47.5%', desc: 'Expansion goal (not yet seeded)', isLive: false },
                  { label: '56-Country Target', value: '1,452,900', pct: '44%', desc: '~25,944 avg/country (planned)', isLive: false },
                  { label: 'Global Target', value: '3.3M', pct: '100%', desc: 'Long-term expansion goal', isLive: false },
                ].map((item) => (
                  <div key={item.label} className={`bg-white/[0.02] border ${item.isLive ? 'border-emerald-500/30' : 'border-white/[0.06]'} rounded-xl p-4`}>
                    <div className={`font-black text-xl mb-1 ${item.isLive ? 'text-emerald-400' : 'text-accent'}`}>{item.value}</div>
                    <div className="text-white text-xs font-bold flex items-center gap-1.5">
                      {item.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />}
                      {item.label}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-1">{item.desc}</div>
                    <div className="text-[9px] text-gray-500 font-mono mt-0.5">{item.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
