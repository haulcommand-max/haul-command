import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle, Download, TrendingUp, Clock, Truck, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: '2026 Pilot Car Rate Guide — PEVO Per-Mile, Day Rate & Specialty | Haul Command',
  description: 'Official 2026 pilot car (PEVO) rate guide. Regional per-mile rates, day rates, height pole, deadhead, cancellation, night move, and wait time benchmarks sourced from industry data.',
  alternates: { canonical: 'https://haulcommand.com/rates/guide/pilot-car' },
  openGraph: {
    title: '2026 Pilot Car Rate Guide | Haul Command',
    description: 'Regional per-mile and day rates for pilot car operators. Southeast, Midwest, Northeast, Southwest, West Coast benchmarks.',
    type: 'article',
  },
};

async function getRates() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('hc_rates_public')
    .select('surface_key, surface_type, jurisdiction_slug, rate_low, rate_mid, rate_high, currency_code')
    .like('surface_key', '%pilot-car%')
    .eq('country_slug', 'us')
    .order('surface_key');
  return data || [];
}

const REGIONS = [
  { slug: 'southeast',  label: 'Southeast',   states: 'FL, GA, AL, MS, SC, NC, TN, AR, LA' },
  { slug: 'midwest',    label: 'Midwest',      states: 'OH, IN, IL, MI, WI, MN, IA, MO, KS, NE, SD, ND' },
  { slug: 'northeast',  label: 'Northeast',    states: 'NY, PA, NJ, CT, MA, RI, VT, NH, ME, MD, DE' },
  { slug: 'southwest',  label: 'Southwest',    states: 'TX, OK, NM, AZ, CO, UT, NV' },
  { slug: 'west-coast', label: 'West Coast',   states: 'CA, OR, WA, ID, MT, WY, AK' },
];

export default async function PilotCarRateGuidePage() {
  const rates = await getRates();
  const get = (key: string) => rates.find(r => r.surface_key === key);

  return (
    <div className="min-h-screen text-white">
      {/* HERO */}
      <section className="pt-24 pb-16 px-4 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full border border-[#C6923A]/40 bg-[#C6923A]/10 text-xs font-bold text-[#C6923A] tracking-widest uppercase">2026 Edition</span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-gray-400">Updated April 2026</span>
            <span className="px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-xs font-bold text-green-400">Live DB Data</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Pilot Car Rate Guide<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6923A] to-[#F1A91B]">2026 Benchmarks</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-8">
            Rates vary by region, demand, and load complexity. Use ranges, not fixed numbers. <strong className="text-white">Price the job, not just the miles.</strong>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/rates/guide" className="px-5 py-2.5 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-all">← All Rate Guides</Link>
            <Link href="/rates/guide/oversize-support" className="px-5 py-2.5 border border-[#C6923A]/30 rounded-xl text-sm font-semibold text-[#C6923A] hover:bg-[#C6923A]/10 transition-all">Oversize Support Rates →</Link>
            <Link href="/tools/rate-lookup" className="px-5 py-2.5 bg-[#F1A91B] text-black rounded-xl text-sm font-bold hover:bg-[#D4951A] transition-all">Rate Calculator</Link>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            <strong className="text-yellow-400">Disclaimer:</strong> Rates are estimates and subject to change based on specific load dimensions, route conditions, and regulatory requirements. Final pricing requires detailed project assessment. This guide is for informational purposes only and is not a binding contract.
          </p>
        </div>
      </div>

      {/* BASE ESCORT — PER MILE */}
      <section className="max-w-5xl mx-auto px-4 py-10" id="base">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-6 h-6 text-[#F1A91B]" />
          <h2 className="text-2xl font-black text-white">Base Escort Service — Lead / Chase (PEVO)</h2>
        </div>
        <p className="text-gray-400 text-sm mb-8">Standard PEVO escort. Short runs cost more per mile because setup, staging, and downtime are the same.</p>

        {/* Per-mile table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Region</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Low</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Typical</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">High</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold hidden md:table-cell">States</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((region) => {
                const r = get(`pilot-car-per-mile-${region.slug}`);
                return (
                  <tr key={region.slug} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{region.label}</td>
                    <td className="py-4 px-4 text-center text-gray-300">${r?.rate_low?.toFixed(2) ?? '—'}/mi</td>
                    <td className="py-4 px-4 text-center font-black text-[#F1A91B] text-base">${r?.rate_mid?.toFixed(2) ?? '—'}/mi</td>
                    <td className="py-4 px-4 text-center text-gray-300">${r?.rate_high?.toFixed(2) ?? '—'}/mi</td>
                    <td className="py-4 px-4 text-xs text-gray-500 hidden md:table-cell">{region.states}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Day rate + short move cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'pilot-car-day-rate-national', label: 'Day Rate', unit: '/day', icon: Clock },
            { key: 'pilot-car-short-move-minimum', label: 'Mini / Short Move Minimum', unit: ' min', icon: TrendingUp },
          ].map(({ key, label, unit, icon: Icon }) => {
            const r = get(key);
            return (
              <div key={key} className="hc-card-on-texture rounded-xl p-5">
                <Icon className="w-5 h-5 text-[#C6923A] mb-3" />
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</div>
                <div className="text-2xl font-black text-white">
                  ${r?.rate_low?.toFixed(0)} – ${r?.rate_high?.toFixed(0)}<span className="text-base font-semibold text-gray-400">{unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HEIGHT POLE */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]" id="height-pole">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-[#F1A91B]" />
          <h2 className="text-2xl font-black text-white">Height Pole & Specialized Escort</h2>
        </div>
        <p className="text-gray-400 text-sm mb-8">Applies to height pole, complex routing, and utility-heavy corridors.</p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Region</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Low</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Typical</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">High</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.filter(r => ['southeast','midwest','northeast','west-coast'].includes(r.slug)).map((region) => {
                const r = get(`height-pole-per-mile-${region.slug}`);
                const label = region.slug === 'midwest' ? 'Midwest / Northeast' : region.label;
                if (region.slug === 'northeast') return null;
                return (
                  <tr key={region.slug} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{label}</td>
                    <td className="py-4 px-4 text-center text-gray-300">${r?.rate_low?.toFixed(2) ?? '—'}/mi</td>
                    <td className="py-4 px-4 text-center font-black text-[#F1A91B] text-base">${r?.rate_mid?.toFixed(2) ?? '—'}/mi</td>
                    <td className="py-4 px-4 text-center text-gray-300">${r?.rate_high?.toFixed(2) ?? '—'}/mi</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="hc-card-on-texture rounded-xl p-5 inline-block">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Height Pole Day Rate</div>
          {(() => { const r = get('height-pole-day-rate-national'); return (
            <div className="text-2xl font-black text-white">${r?.rate_low?.toFixed(0)} – ${r?.rate_high?.toFixed(0)}<span className="text-base font-semibold text-gray-400">/day</span></div>
          ); })()}
        </div>
      </section>

      {/* ADDITIONAL COSTS */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]" id="additional">
        <h2 className="text-2xl font-black text-white mb-6">Additional Rate Factors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'pilot-car-layover-day',             label: 'Layover Day',                    unit: '/day'  },
            { key: 'pilot-car-cancellation-after-dispatch', label: 'Cancellation After Dispatch', unit: ''     },
            { key: 'pilot-car-deadhead-per-mile',       label: 'Deadhead / Repositioning',       unit: '/mi'  },
            { key: 'pilot-car-wait-time-hourly',        label: 'Wait Time / Detention',          unit: '/hr'  },
            { key: 'pilot-car-night-move-per-mile',     label: 'Night Move Premium',             unit: '/mi'  },
            { key: 'pilot-car-night-move-day-add',      label: 'Night Move Day Add-on',          unit: '/day' },
          ].map(({ key, label, unit }) => {
            const r = get(key);
            return (
              <div key={key} className="hc-card-on-texture rounded-xl p-5">
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{label}</div>
                <div className="text-xl font-black text-white">
                  ${r?.rate_low?.toFixed(r.rate_low < 5 ? 2 : 0)}{r?.rate_high !== r?.rate_low ? ` – $${r?.rate_high?.toFixed(r.rate_high < 5 ? 2 : 0)}` : ''}<span className="text-sm font-semibold text-gray-400">{unit}</span>
                </div>
                {key === 'pilot-car-cancellation-after-dispatch' && (
                  <div className="text-xs text-gray-500 mt-1">+ hotel if staged</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* COSTS NEW ESCORTS FORGET */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]">
        <div className="hc-glass-panel rounded-2xl p-8">
          <h3 className="text-xl font-black text-white mb-4">⚠️ Costs New Escorts Often Forget to Price In</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {['Tire & Suspension Wear', 'Insurance Increases', 'Downtime Between Jobs', 'Equipment Maintenance'].map(c => (
              <div key={c} className="text-center p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="text-sm font-semibold text-gray-300">{c}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm italic">"If your pricing only covers gas, you're not profitable — you're just busy."</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-white/[0.06]">
        <div className="text-center">
          <h3 className="text-2xl font-black text-white mb-3">Ready to Get Properly Paid?</h3>
          <p className="text-gray-400 mb-6">Claim your free listing, set your rates, and get found by brokers across 120 countries.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/claim" className="px-8 py-3 bg-[#F1A91B] text-black font-black rounded-xl hover:bg-[#D4951A] transition-all">Claim Your Free Listing</Link>
            <Link href="/directory" className="px-8 py-3 border border-white/10 text-white font-semibold rounded-xl hover:border-white/20 hover:bg-white/5 transition-all">Browse Directory</Link>
            <Link href="/rates/guide/oversize-support" className="px-8 py-3 border border-[#C6923A]/30 text-[#C6923A] font-semibold rounded-xl hover:bg-[#C6923A]/10 transition-all">Oversize Support Rates →</Link>
          </div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="max-w-5xl mx-auto px-4 pb-16 border-t border-white/[0.06] pt-8">
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/rate-lookup', label: 'Rate Lookup Tool' },
            { href: '/escort-requirements', label: 'Escort Requirements by State' },
            { href: '/tools/escort-calculator', label: 'Escort Count Calculator' },
            { href: '/training', label: 'Get PEVO Certified' },
            { href: '/glossary', label: 'Heavy Haul Glossary' },
            { href: '/corridors', label: 'Active Corridors' },
            { href: '/rates/guide/oversize-support', label: 'Oversize Support Rates' },
            { href: '/directory', label: 'Find Escort Operators' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-300 hover:text-[#C6923A] hover:border-[#C6923A]/30 transition-all">{link.label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
