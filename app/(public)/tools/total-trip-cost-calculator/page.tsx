import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Total Trip Cost Calculator — Oversize Load Move Budget | Haul Command',
  description: 'Calculate the complete cost of an oversize load move: permits, pilot cars, fuel, tolls, overnight stops, and detention time. Free. 120 countries.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/total-trip-cost-calculator' },
};

export const dynamic = 'force-dynamic';

export default async function TotalTripCostPage() {
  const supabase = createClient();
  
  // Pull live rate benchmarks for the calculator context
  const { data: rates } = await supabase
    .from('hc_rates_public')
    .select('surface_key, jurisdiction_slug, rate_low, rate_mid, rate_high, currency_code')
    .in('surface_key', ['us_pilot_car_daily', 'us_height_pole_rate', 'us_police_escort_rate', 'us_route_survey_rate', 'us_wait_time_rate'])
    .limit(10);

  const rateMap = (rates ?? []).reduce((acc: Record<string, any>, r) => { acc[r.surface_key] = r; return acc; }, {});
  
  const escortRate = rateMap['us_pilot_car_daily'] ?? { rate_low: 300, rate_mid: 450, rate_high: 650 };
  const heightPoleRate = rateMap['us_height_pole_rate'] ?? { rate_low: 450, rate_mid: 600, rate_high: 850 };
  const policeRate = rateMap['us_police_escort_rate'] ?? { rate_low: 85, rate_mid: 150, rate_high: 350 };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="border-b border-[#F1A91B]/10" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #0f1a24 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-4">
            <Link href="/tools" className="hover:text-white">Tools</Link>
            <span>›</span><span>Cost Intelligence</span>
          </div>
          <h1 className="text-4xl font-black mb-3">Total Trip Cost Calculator</h1>
          <p className="text-gray-400 text-lg max-w-xl">Budget the full cost of an oversize load move — permits, escorts, fuel, tolls, overnight stops — using real market rate benchmarks from our network.</p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Live rate data</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />120 countries</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F1A91B]" />No sign-up required</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Live rate benchmarks from DB */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-xl">Live US Market Rate Benchmarks</h2>
            <Link href="/rates" className="text-xs text-[#C6923A] hover:underline font-semibold">Full rate index →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Pilot Car / Day', low: escortRate.rate_low, mid: escortRate.rate_mid, high: escortRate.rate_high, unit: 'USD/day' },
              { label: 'Height Pole / Day', low: heightPoleRate.rate_low, mid: heightPoleRate.rate_mid, high: heightPoleRate.rate_high, unit: 'USD/day' },
              { label: 'Police Escort', low: policeRate.rate_low, mid: policeRate.rate_mid, high: policeRate.rate_high, unit: 'USD/hr' },
            ].map(r => (
              <div key={r.label} className="p-4 bg-[#0d1117] rounded-xl border border-white/[0.04]">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">{r.label}</div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white">${r.mid}</span>
                  <span className="text-xs text-gray-500 mb-0.5">{r.unit}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">Range: ${r.low} – ${r.high}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost components breakdown */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <h2 className="font-black text-xl mb-5">Trip Cost Components</h2>
          <div className="space-y-3">
            {[
              { component: 'State Permits', typical: '$150–$800 per state', notes: 'Average $300/state for standard OW moves. Superloads can exceed $2,500/state.' },
              { component: 'Pilot Cars (lead + chase)', typical: '$600–$1,400/day', notes: 'Based on 2 escorts at $300–$700/day each. Multi-day moves are more expensive per day.' },
              { component: 'Height Pole Car', typical: '$450–$850/day', notes: 'Required when load exceeds 14.5 ft. Counts toward escort requirement.' },
              { component: 'Fuel Surcharge', typical: '15–20% of escort rate', notes: 'Applied per mile over 150 miles from operator home base.' },
              { component: 'Overnight / Per Diem', typical: '$75–$150/operator/night', notes: 'Hotel + meal allowance for multi-day moves. Usually 1.5–2 nights per 800 miles.' },
              { component: 'Police Escort', typical: '$85–$350/hour', notes: 'Required in certain jurisdictions and for extreme loads (> 16 ft wide).' },
              { component: 'Route Survey', typical: '$500–$1,200', notes: 'Required for superloads and new corridor routes. Usually a one-time fee per move.' },
            ].map(c => (
              <div key={c.component} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 bg-[#0d1117] rounded-xl border border-white/[0.04] items-start">
                <div className="font-bold text-white text-sm">{c.component}</div>
                <div className="text-sm font-bold text-[#F1A91B]">{c.typical}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{c.notes}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Example calculation */}
        <div className="bg-[#111827] border border-[#F1A91B]/20 rounded-2xl p-6 mb-8">
          <h2 className="font-black text-xl mb-2">Example: 1,200-Mile Industrial Equipment Move</h2>
          <p className="text-sm text-gray-400 mb-5">14 ft wide × 85 ft long — crossing TX, LA, MS, AL (4 states, 3 days)</p>
          <div className="space-y-2">
            {[
              { item: 'State permits (4 states × $350 avg)', cost: '$1,400' },
              { item: '2 pilot cars × 3 days × $450/day', cost: '$2,700' },
              { item: 'Fuel surcharges (15% of escort)', cost: '$405' },
              { item: 'Overnight per diem (2 nights × 2 operators)', cost: '$500' },
              { item: 'Height pole car (1 day in TX)', cost: '$600' },
            ].map(l => (
              <div key={l.item} className="flex justify-between text-sm py-1.5 border-b border-white/[0.04]">
                <span className="text-gray-400">{l.item}</span>
                <span className="font-bold text-white">{l.cost}</span>
              </div>
            ))}
            <div className="flex justify-between text-base pt-2 font-black">
              <span className="text-white">Total estimated move cost</span>
              <span className="text-[#F1A91B]">$5,605</span>
            </div>
          </div>
        </div>

        {/* Directory CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/directory" className="flex items-center justify-between p-5 bg-[#111827] hover:bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-2xl transition-all group">
            <div>
              <div className="font-black text-white">Find Escort Operators</div>
              <div className="text-xs text-gray-400 mt-1">7,711+ verified operators in network</div>
            </div>
            <span className="text-[#F1A91B] group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link href="/tools/pilot-car-rate-calculator" className="flex items-center justify-between p-5 bg-[#111827] hover:bg-[#F1A91B]/5 border border-white/[0.08] rounded-2xl transition-all group">
            <div>
              <div className="font-black text-white">Rate Benchmark Tool</div>
              <div className="text-xs text-gray-400 mt-1">Compare rates by state and corridor</div>
            </div>
            <span className="text-[#F1A91B] group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Interlinking grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/tools/escort-count-calculator', label: 'Escort Count', icon: '🚗' },
            { href: '/tools/permit-cost-calculator', label: 'Permit Costs', icon: '📋' },
            { href: '/tools/deadhead-cost-calculator', label: 'Deadhead Cost', icon: '↩️' },
            { href: '/rates', label: 'Rate Index', icon: '💰' },
            { href: '/corridors', label: 'Corridors', icon: '🛣️' },
            { href: '/available-now', label: 'Available Now', icon: '📡' },
            { href: '/glossary', label: 'Glossary', icon: '📖' },
            { href: '/training', label: 'Get Certified', icon: '🎓' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="flex items-center gap-2 p-3 bg-[#111827] hover:bg-[#F1A91B]/5 border border-white/[0.06] hover:border-[#F1A91B]/20 rounded-xl text-xs font-semibold text-gray-400 hover:text-[#F1A91B] transition-all">
              <span>{l.icon}</span>{l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
