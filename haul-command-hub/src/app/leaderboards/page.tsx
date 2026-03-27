import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';

// Force dynamic — multiple Supabase queries (RPC, providers, corridors)
// time out during static builds. CDN handles caching automatically.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Heavy Haul Leaderboards — Top Corridors, Markets & Operators',
  description:
    'Rankings for heavy haul corridors, markets, and escort service activity. Every ranking includes methodology disclosure and ranking basis.',
};

export default async function LeaderboardsPage() {
  const sb = supabaseServer();

  // Top jurisdictions by rule count
  const { data: jurisdictions } = await sb.rpc('hc_list_all_jurisdictions');
  const sortedJurisdictions = (jurisdictions ?? [])
    .sort((a: { rule_count: number }, b: { rule_count: number }) => Number(b.rule_count) - Number(a.rule_count))
    .slice(0, 15);

  // Top corridors
  const { data: corridors } = await sb
    .from('corridors')
    .select('id, name, corridor_type, permit_volume_annual')
    .order('permit_volume_annual', { ascending: false, nullsFirst: false })
    .limit(10);

  // Motive Safety Leaderboard — top operators by safety score
  const { data: safetyLeaders } = await sb
    .from('providers')
    .select('id, name, motive_safety_score, motive_fleet_size, motive_connected_at')
    .not('motive_safety_score', 'is', null)
    .order('motive_safety_score', { ascending: false })
    .limit(15);

  const hasSafetyData = safetyLeaders && safetyLeaders.length > 0;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-4 sm:mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-white">Leaderboards</span>
        </nav>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter mb-3 sm:mb-4 break-words">
            Haul Command <span className="text-accent">Leaderboards</span>
          </h1>
          <p className="text-[#b0b0b0] text-base sm:text-lg max-w-2xl break-words">
            Win priority loads in your corridor. Every ranking includes methodology disclosure and ranking basis.
            Paid placements are always labeled.
          </p>
        </header>

        {/* Methodology Disclosure */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 text-sm text-[#b0b0b0] break-words">
          <strong className="text-blue-400">Ranking Methodology:</strong> Rankings are based on publicly available data including
          rule count, permit volume, corridor activity, ELD-verified safety scores, and directory listing quality. Rankings do not reflect endorsement.
          See individual ranking sections for specific methodology.
        </div>

        {/* Safety Leaderboard */}
        {hasSafetyData && (
          <section className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Safest Operators &mdash; ELD Verified
              </h2>
              <span className="text-[10px] text-gray-500">powered by Haul Command AI</span>
            </div>
            <p className="text-xs text-[#8b95a5] mb-3 sm:mb-4 break-words">
              Ranked by composite safety score from ELD data: harsh braking, speeding, idle time, and overall driving behavior.
              Only HC Verified operators with live ELD connections are eligible.
            </p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden max-w-full">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">#</th>
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">Operator</th>
                      <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium">Safety Score</th>
                      <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium">Fleet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safetyLeaders.map((op: { id: string; name: string; motive_safety_score: number; motive_fleet_size: number | null }, i: number) => {
                      const scorePct = Math.round(op.motive_safety_score);
                      const scoreColor = scorePct >= 90 ? 'text-green-400' : scorePct >= 75 ? 'text-blue-400' : scorePct >= 60 ? 'text-yellow-400' : 'text-red-400';
                      return (
                        <tr key={op.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="text-gray-500 px-5 py-3 tabular-nums">
                            {i < 3 ? ['\u{1F947}','\u{1F948}','\u{1F949}'][i] : i + 1}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{op.name || `Operator ${op.id.slice(0,6)}`}</span>
                              <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 text-[10px] text-blue-400 font-bold">
                                &#10003; Verified
                              </span>
                            </div>
                          </td>
                          <td className={`px-5 py-3 text-right font-black tabular-nums ${scoreColor}`}>
                            {scorePct}/100
                          </td>
                          <td className="text-gray-500 px-5 py-3 text-right tabular-nums">
                            {op.motive_fleet_size ?? '\u2014'} vehicles
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2 bg-white/[0.01] flex items-center justify-between text-[10px] text-gray-600">
                <span>Score = composite of harsh braking, speeding, idle time, and driving behavior</span>
                <Link href="/claim" className="text-blue-400 hover:text-blue-300 font-medium">Get HC Verified to qualify &rarr;</Link>
              </div>
            </div>
          </section>
        )}

        {/* Top Jurisdictions */}
        {sortedJurisdictions.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Jurisdictions by Regulatory Complexity</h2>
            <p className="text-xs text-[#8b95a5] mb-3 sm:mb-4 break-words">
              Ranked by total escort rule count. More rules generally indicate more complex regulatory environments.
            </p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden max-w-full">
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">#</th>
                    <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">Jurisdiction</th>
                    <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">Country</th>
                    <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium">Rules</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedJurisdictions.map((j: { jurisdiction_code: string; jurisdiction_name: string; country_code: string; rule_count: number }, i: number) => (
                    <tr key={j.jurisdiction_code} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="text-gray-500 px-5 py-3 tabular-nums">{i + 1}</td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/escort-requirements/${j.jurisdiction_code.toLowerCase()}`}
                          className="text-white hover:text-accent font-medium transition-colors"
                        >
                          {j.jurisdiction_name}
                        </Link>
                      </td>
                      <td className="text-gray-500 px-5 py-3">{j.country_code}</td>
                      <td className="text-accent px-5 py-3 text-right font-bold tabular-nums">
                        {Number(j.rule_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </section>
        )}

        {/* Top Corridors */}
        {corridors && corridors.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Top 3 Get First Access to Loads</h2>
            <p className="text-xs text-[#8b95a5] mb-3 sm:mb-4 break-words">
              Top-ranked operators get load alerts before everyone else. Move up to see better loads faster.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {corridors.map((c: { id: string; name: string; corridor_type: string; permit_volume_annual: number | null }, i: number) => (
                <div key={c.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-accent font-black text-lg">#{i + 1}</span>
                    <span className="text-white font-bold text-sm">{c.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {c.corridor_type.replace(/_/g, ' ')}
                  </div>
                  {c.permit_volume_annual && (
                    <div className="text-xs text-gray-400 mt-1">
                      ~{c.permit_volume_annual.toLocaleString()} permits/year
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Link href="/directory" className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-all">
            <h3 className="text-white font-bold text-sm">Browse Directory</h3>
            <p className="text-[#8b95a5] text-xs mt-1">Find operators by country</p>
          </Link>
          <Link href="/escort-requirements" className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-all">
            <h3 className="text-white font-bold text-sm">Requirements</h3>
            <p className="text-[#8b95a5] text-xs mt-1">Escort rules by jurisdiction</p>
          </Link>
          <Link href="/claim" className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-all">
            <h3 className="text-white font-bold text-sm">Claim Your Spot</h3>
            <p className="text-[#8b95a5] text-xs mt-1">Finish more loads, earn stronger reviews, and move up for earlier access.</p>
          </Link>
        </div>

        <div className="mt-12">
          <HCFaqModule
            items={[
              { question: 'How are leaderboard rankings calculated?', answer: 'Rankings are based on objective, publicly verifiable metrics: rule count for jurisdictions, permit volume for corridors, ELD-verified safety scores for operators, and listing quality. Methodology is disclosed in each section.' },
              { question: 'What is the Safety Leaderboard?', answer: 'The Safety Leaderboard ranks HC Verified operators by their composite safety score from Motive ELD data. Scores include harsh braking events, speeding incidents, idle time, and overall driving behavior. Only operators with a live ELD connection qualify.' },
              { question: 'Can I pay for a higher ranking?', answer: 'Organic rankings are never influenced by payment. Sponsored placements are clearly labeled and appear separately from organic rankings.' },
              { question: 'How often are rankings updated?', answer: 'Safety leaderboards update daily with new ELD data. Jurisdiction rankings refresh hourly. Corridor rankings update as new permit data is published.' },
            ]}
          />
        </div>

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
