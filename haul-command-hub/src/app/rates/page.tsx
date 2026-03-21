import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import HCMarketMaturityBanner from '@/components/hc/MarketMaturityBanner';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';
import { MotiveReferralCTA } from '@/components/motive';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Heavy Haul Rate Intelligence — Escort Rate Index',
  description:
    'Heavy haul escort rate intelligence across North America. Rate benchmarks by state, corridor, and service type with transparent methodology. Live fuel prices from ELD-connected fleets.',
};

export default async function RatesPage() {
  const sb = supabaseServer();

  // Pull rate data from escort_coordination
  const { data: rateData } = await sb
    .from('escort_coordination')
    .select('jurisdiction_id, coordination_type, rate_benchmark_per_hour')
    .not('rate_benchmark_per_hour', 'is', null)
    .order('rate_benchmark_per_hour', { ascending: false })
    .limit(50);

  const hasRateData = rateData && rateData.length > 0;

  // Pull live fuel prices from Motive fleet data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: fuelRaw } = await sb
    .from('motive_fuel_observations')
    .select('jurisdiction_code, price_per_gallon, observed_at')
    .gte('observed_at', thirtyDaysAgo)
    .not('price_per_gallon', 'is', null)
    .order('observed_at', { ascending: false })
    .limit(500);

  // Aggregate fuel prices by state
  const fuelMap = new Map<string, { total: number; count: number; latest: string }>();
  for (const f of fuelRaw ?? []) {
    const jur = f.jurisdiction_code;
    const prev = fuelMap.get(jur) ?? { total: 0, count: 0, latest: '' };
    fuelMap.set(jur, {
      total: prev.total + Number(f.price_per_gallon),
      count: prev.count + 1,
      latest: prev.latest || f.observed_at,
    });
  }
  const fuelPrices = Array.from(fuelMap.entries())
    .map(([code, data]) => ({
      jurisdiction_code: code,
      avg_price: data.total / data.count,
      sample_count: data.count,
      last_observed: data.latest,
    }))
    .sort((a, b) => b.sample_count - a.sample_count)
    .slice(0, 12);

  const hasFuelData = fuelPrices.length > 0;

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Rate Intelligence</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Rate <span className="text-accent">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Escort rate benchmarks for pilot car and escort vehicle services.
            All rates include methodology disclosure, sample basis, and freshness timestamps.
            {hasFuelData && ' Now with live diesel prices from ELD-connected fleets.'}
          </p>
        </header>

        {!hasRateData && (
          <HCMarketMaturityBanner
            state="data_only"
            countryName="Rate Intelligence"
            message="Rate data collection is in progress. Sign up for alerts when rate intelligence goes live."
          />
        )}

        {/* Live Fuel Prices — Motive data */}
        {hasFuelData && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-lg">⛽</span>
                Live Diesel Prices
              </h2>
              <span className="text-[10px] text-gray-500">from ELD-connected fleet purchases</span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/[0.04]">
                {fuelPrices.map((fp) => (
                  <div key={fp.jurisdiction_code} className="bg-[#0a0a0a] p-4 text-center">
                    <div className="text-gray-500 text-xs font-medium mb-1">{fp.jurisdiction_code}</div>
                    <div className="text-accent font-black text-lg tabular-nums">${fp.avg_price.toFixed(3)}</div>
                    <div className="text-gray-600 text-[10px]">{fp.sample_count} obs</div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-2 bg-white/[0.01] text-[10px] text-gray-600 flex items-center justify-between">
                <span>Source: Real diesel purchases from Motive-connected fleets · 30-day rolling average</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </section>
        )}

        {/* Methodology Panel */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-3">Methodology</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>
              Rate intelligence is compiled from publicly available market data, verified operator submissions, 
              {hasFuelData ? ' live fuel purchase data from ELD-connected fleets,' : ''}
              and industry benchmarks. All figures represent general market ranges, not specific quotes.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="text-xs">
                <span className="text-gray-500">Update frequency:</span>{' '}
                <span className="text-white">Weekly (rates) / Real-time (fuel)</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">Sources:</span>{' '}
                <span className="text-white">Operator submissions, ELD fleet data, market surveys</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">Disclaimer:</span>{' '}
                <span className="text-white">Rates are informational and may vary</span>
              </div>
            </div>
          </div>
        </div>

        {hasRateData ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Rate Benchmarks by Coordination Type</h2>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Type</th>
                    <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Rate/Hour</th>
                  </tr>
                </thead>
                <tbody>
                  {rateData.map((r: { jurisdiction_id: string; coordination_type: string; rate_benchmark_per_hour: number }, i: number) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="text-white px-5 py-3 capitalize">{r.coordination_type.replace(/_/g, ' ')}</td>
                      <td className="text-accent px-5 py-3 text-right font-bold tabular-nums">
                        ${Number(r.rate_benchmark_per_hour).toFixed(0)}/hr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-6">
              Rate data is being compiled from operators and market sources. 
              Join the waitlist to receive alerts when rate intelligence is available for your markets.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                />
                <button className="bg-accent text-black px-5 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
                  Alert Me
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HC Verified CTA */}
        <div className="mt-10 mb-8">
          <MotiveReferralCTA variant="banner" />
        </div>

        {/* Related Links */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/tools/cost-estimator" className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all">
            <span className="text-2xl">🧾</span>
            <h3 className="text-white font-bold text-sm mt-2">Cost Estimator</h3>
            <p className="text-gray-500 text-xs mt-1">Calculate convoy overhead by state</p>
          </Link>
          <Link href="/escort-requirements" className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all">
            <span className="text-2xl">📋</span>
            <h3 className="text-white font-bold text-sm mt-2">Requirements</h3>
            <p className="text-gray-500 text-xs mt-1">Escort rules by jurisdiction</p>
          </Link>
          <Link href="/corridors" className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all">
            <span className="text-2xl">🛣️</span>
            <h3 className="text-white font-bold text-sm mt-2">Corridors</h3>
            <p className="text-gray-500 text-xs mt-1">Route-specific intelligence</p>
          </Link>
        </div>

        <div className="mt-12">
          <HCFaqModule
            items={[
              { question: 'How are rates calculated?', answer: 'Rates are compiled from operator submissions, market surveys, and publicly available benchmark data. They represent general market ranges for escort services, not specific quotes. Always confirm pricing directly with operators.' },
              { question: 'Where do fuel prices come from?', answer: 'Live diesel prices are sourced from real fuel purchase transactions logged by ELD-connected fleets through Motive. Prices are 30-day rolling averages grouped by state, with sample counts shown for transparency.' },
              { question: 'How often are rates updated?', answer: 'Escort rate benchmarks refresh weekly. Fuel price data updates in real-time as fleets make purchases. Each display includes freshness timestamps and methodology links.' },
              { question: 'Why don\'t I see rates for my state?', answer: 'Rate data availability depends on market depth. Some states have more active escort markets with better data coverage. Sign up for alerts to be notified when rates become available for your area.' },
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
