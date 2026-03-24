import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Leaderboard — Top Escort Operators by Corridor | Haul Command',
  description: 'See the top-ranked pilot car and escort operators on every corridor. Rankings based on completed runs, response time, acceptance rate, and reviews.',
};

const RANK_STYLES = [
  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', badge: '\ud83e\udd47', label: 'Gold' },
  { bg: 'bg-gray-300/10', border: 'border-gray-400/20', badge: '\ud83e\udd48', label: 'Silver' },
  { bg: 'bg-amber-700/10', border: 'border-amber-700/20', badge: '\ud83e\udd49', label: 'Bronze' },
];

async function getLeaderboardData() {
  try {
    const supabase = createClient();
    
    // Get top operators with ranking data
    const { data: operators } = await supabase
      .from('directory_listings')
      .select('id, name, company_name, country_code, corridors, rating, verified, city, state, response_time_minutes, acceptance_rate, runs_completed')
      .eq('status', 'active')
      .order('rating', { ascending: false })
      .limit(25);

    return operators || [];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const operators = await getLeaderboardData();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Operator Leaderboard
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Top-ranked escort operators by corridor. Rankings based on completed runs, response time, acceptance rate, and reviews.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        {/* Top 3 Featured */}
        {operators.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {operators.slice(0, 3).map((op: any, i: number) => (
              <div
                key={op.id}
                className={`p-6 ${RANK_STYLES[i].bg} border ${RANK_STYLES[i].border} rounded-2xl text-center transition-all hover:scale-105`}
              >
                <span className="text-4xl block mb-2">{RANK_STYLES[i].badge}</span>
                <h3 className="text-xl font-bold">{op.name || op.company_name}</h3>
                <p className="text-sm text-gray-400">
                  {op.city && `${op.city}, `}{(op.country_code || '').toUpperCase()}
                </p>
                {op.verified && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">\u2713 Verified</span>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-amber-400 font-bold">{op.runs_completed || 0}</span><br/>Runs</div>
                  <div><span className="text-amber-400 font-bold">{op.acceptance_rate ? `${op.acceptance_rate}%` : 'N/A'}</span><br/>Accept Rate</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Rankings */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-4 text-xs font-bold text-gray-500 border-b border-white/5">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Operator</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1 text-center">Runs</div>
            <div className="col-span-2 text-center">Response</div>
            <div className="col-span-2 text-center">Rating</div>
          </div>
          {operators.map((op: any, i: number) => (
            <div
              key={op.id}
              className={`grid grid-cols-12 gap-2 p-4 text-sm items-center border-b border-white/5 hover:bg-white/5 transition-colors ${
                i < 3 ? 'bg-amber-500/5' : ''
              }`}
            >
              <div className="col-span-1 font-bold">
                {i < 3 ? RANK_STYLES[i].badge : `#${i + 1}`}
              </div>
              <div className="col-span-4">
                <span className="font-semibold">{op.name || op.company_name}</span>
                {op.verified && (
                  <span className="ml-1 text-amber-400 text-xs">\u2713</span>
                )}
              </div>
              <div className="col-span-2 text-gray-500 text-xs">
                {op.city && `${op.city}, `}{(op.country_code || '').toUpperCase()}
              </div>
              <div className="col-span-1 text-center">{op.runs_completed || 0}</div>
              <div className="col-span-2 text-center text-xs">
                {op.response_time_minutes ? `${op.response_time_minutes} min` : '—'}
              </div>
              <div className="col-span-2 text-center">
                {op.rating ? (
                  <span className="text-amber-400">{'\u2605'.repeat(Math.round(op.rating))} {op.rating.toFixed(1)}</span>
                ) : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-3">Climb the Leaderboard</h3>
          <p className="text-gray-400 mb-6">
            Complete more runs, respond faster, and build your reputation to climb the rankings.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/claim"
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
            >
              Claim Your Spot
            </Link>
            <Link
              href="/directory"
              className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              View Directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
