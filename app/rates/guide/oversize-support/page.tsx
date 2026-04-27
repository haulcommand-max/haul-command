import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle, Shield, Wrench, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: '2026 Oversized Load Support Rate Guide — Bucket Truck, Route Survey & Police Escort | Haul Command',
  description: 'Complete 2026 rate guide for oversized load support: bucket truck escorts, route survey engineering, police escort, and optional cost factors by region.',
  alternates: { canonical: 'https://haulcommand.com/rates/guide/oversize-support' },
};

async function getRates() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('hc_rates_public')
    .select('surface_key, surface_type, jurisdiction_slug, country_slug, rate_low, rate_mid, rate_high')
    .like('surface_key', '%bucket-truck%')
    .or('surface_key.like.%route-survey%,surface_key.like.%police-escort%,surface_key.like.%oversize%')
    .order('surface_key');
  return data || [];
}

export default async function OversizeSuportRateGuidePage() {
  const rates = await getRates();
  const get = (key: string) => rates.find(r => r.surface_key === key);

  const REGIONS_US = [
    { slug: 'southeast',  label: 'Southeast' },
    { slug: 'midwest',    label: 'Midwest / Northeast' },
    { slug: 'west-coast', label: 'West Coast / Canada' },
  ];

  const DISTANCE_BANDS = ['0-100mi', '101-300mi', '301-500mi', '500plus'];
  const DISTANCE_LABELS = ['0–100 miles', '101–300 miles', '301–500 miles', '500+ miles'];

  return (
    <div className="min-h-screen text-white">
      {/* HERO */}
      <section className="pt-24 pb-16 px-4 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full border border-[#C6923A]/40 bg-[#C6923A]/10 text-xs font-bold text-[#C6923A] tracking-widest uppercase">2026 Edition</span>
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-gray-400">Operator Resource</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Oversized Load Support<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6923A] to-[#F1A91B]">Rate Guide 2026</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-8">
            Bucket truck escorts, route survey engineering, police escorts, and specialty cost factors by region. Rates vary by region, demand, and load complexity.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/rates/guide" className="px-5 py-2.5 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-all">← All Rate Guides</Link>
            <Link href="/rates/guide/pilot-car" className="px-5 py-2.5 border border-[#C6923A]/30 rounded-xl text-sm font-semibold text-[#C6923A] hover:bg-[#C6923A]/10 transition-all">Pilot Car Rates →</Link>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            <strong className="text-yellow-400">Disclaimer:</strong> Rates are estimates. Final pricing requires detailed project assessment. Not a binding contract.
          </p>
        </div>
      </div>

      {/* BUCKET TRUCK */}
      <section className="max-w-5xl mx-auto px-4 py-10" id="bucket-truck">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="w-6 h-6 text-[#F1A91B]" />
          <h2 className="text-2xl font-black text-white">1. Bucket Truck Escorts (Utility / Line Lift)</h2>
          <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold">⚠ Specialty</span>
        </div>
        <p className="text-gray-400 text-sm mb-8">For loads requiring utility line lifting. Day rates include mobilization.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          {/* Per-mile */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Per-Mile Rates by Region</h3>
            <div className="space-y-3">
              {REGIONS_US.map((region) => {
                const r = get(`bucket-truck-per-mile-${region.slug}`);
                return (
                  <div key={region.slug} className="flex justify-between items-center p-4 hc-card-on-texture rounded-xl">
                    <span className="font-semibold text-white text-sm">{region.label}</span>
                    <span className="font-black text-[#F1A91B]">${r?.rate_low?.toFixed(2)} – ${r?.rate_high?.toFixed(2)}/mi</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Hourly */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Hourly Rates by Region</h3>
            <div className="space-y-3">
              {REGIONS_US.map((region) => {
                const r = get(`bucket-truck-hourly-${region.slug}`);
                return (
                  <div key={region.slug} className="flex justify-between items-center p-4 hc-card-on-texture rounded-xl">
                    <span className="font-semibold text-white text-sm">{region.label}</span>
                    <span className="font-black text-[#F1A91B]">${r?.rate_low?.toFixed(0)} – ${r?.rate_high?.toFixed(0)}/hr</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day rate */}
        {(() => {
          const r = get('bucket-truck-day-rate-national');
          return (
            <div className="hc-card-on-texture rounded-xl p-5 inline-flex gap-4 items-center">
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Day Rate (National)</div>
                <div className="text-2xl font-black text-white">${r?.rate_low?.toFixed(0)} – ${r?.rate_high?.toFixed(0)}<span className="text-base font-semibold text-gray-400">/day</span></div>
              </div>
              <div className="text-xs text-gray-500 max-w-[200px]">Mobilization fees apply.</div>
            </div>
          );
        })()}
      </section>

      {/* ROUTE SURVEY */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]" id="route-survey">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="w-6 h-6 text-[#F1A91B]" />
          <h2 className="text-2xl font-black text-white">2. Route Survey Breakdown (Engineering)</h2>
          <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold">⚠ Engineering</span>
        </div>
        <p className="text-gray-400 text-sm mb-2">Per survey/day. Includes height/bridge clearance, route mapping.</p>
        <p className="text-gray-500 text-xs mb-8">Complexity Factors: Urban Areas/High Traffic, Bridge Structures (Vertical/Weight), Multi-State Coordination.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Distance</th>
                {REGIONS_US.map(r => (
                  <th key={r.slug} className="text-center py-3 px-4 text-gray-400 font-semibold">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISTANCE_BANDS.map((band, i) => (
                <tr key={band} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-bold text-white">{DISTANCE_LABELS[i]}</td>
                  {REGIONS_US.map((region) => {
                    const r = get(`route-survey-${band}-${region.slug}`);
                    const rMid = get(`route-survey-0-100mi-${region.slug}`);
                    const fallback = r || rMid;
                    return (
                      <td key={region.slug} className="py-4 px-4 text-center font-black text-[#F1A91B]">
                        ${fallback?.rate_low?.toFixed(0)} – ${fallback?.rate_high?.toFixed(0)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* POLICE ESCORTS */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]" id="police">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-[#F1A91B]" />
          <h2 className="text-2xl font-black text-white">3. Police Escorts (State & Local)</h2>
          <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold">⚠ Required &gt;17&apos; width</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {[
            { key: 'police-escort-state-hourly', label: 'State Escort', subKey: 'police-escort-state-per-mile', subUnit: '/mi extra' },
            { key: 'police-escort-municipal-hourly', label: 'Local / Municipal', subKey: null, subUnit: null },
          ].map(({ key, label, subKey, subUnit }) => {
            const r = get(key);
            const rs = subKey ? get(subKey) : null;
            return (
              <div key={key} className="hc-card-on-texture rounded-xl p-5">
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{label}</div>
                <div className="text-2xl font-black text-white">${r?.rate_low?.toFixed(0)}{r?.rate_high !== r?.rate_low ? ` – $${r?.rate_high?.toFixed(0)}` : ''}<span className="text-base font-semibold text-gray-400">/hr</span></div>
                {rs && <div className="text-sm text-gray-400 mt-1">+ ${rs.rate_low.toFixed(3)}{subUnit}</div>}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500">Note: Police escort required for loads exceeding 17&apos; width in most jurisdictions. Check state-specific requirements.</p>
      </section>

      {/* OPTIONAL COST FACTORS */}
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-white/[0.06]" id="optional">
        <h2 className="text-2xl font-black text-white mb-6">4. Optional Cost Factors & Safety Premiums</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'oversize-urban-coordination', label: 'Urban Coordination', unit: '' },
            { key: 'oversize-standby-hourly',      label: 'Standby',           unit: '/hr' },
            { key: 'oversize-multi-agency',         label: 'Multi-Agency Coordination', unit: '' },
          ].map(({ key, label, unit }) => {
            const r = get(key);
            return (
              <div key={key} className="hc-card-on-texture rounded-xl p-5">
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{label}</div>
                <div className="text-xl font-black text-white">${r?.rate_low?.toFixed(0)} – ${r?.rate_high?.toFixed(0)}<span className="text-sm font-semibold text-gray-400">{unit}</span></div>
              </div>
            );
          })}
          <div className="hc-card-on-texture rounded-xl p-5">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">After-Hours</div>
            <div className="text-xl font-black text-white">1.25× <span className="text-sm font-semibold text-gray-400">base rate multiplier</span></div>
          </div>
          <div className="hc-card-on-texture rounded-xl p-5">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Weekend / Seasonal</div>
            <div className="text-xl font-black text-white">+10–25%</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-12 border-t border-white/[0.06]">
        <div className="text-center">
          <h3 className="text-2xl font-black text-white mb-3">Need a Route Survey or Bucket Truck Escort?</h3>
          <p className="text-gray-400 mb-6">Find verified specialists across 120 countries in the Haul Command directory.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/directory" className="px-8 py-3 bg-[#F1A91B] text-black font-black rounded-xl hover:bg-[#D4951A] transition-all">Find Specialists</Link>
            <Link href="/tools/route-survey" className="px-8 py-3 border border-white/10 text-white font-semibold rounded-xl hover:border-white/20 hover:bg-white/5 transition-all">Route Survey Tool</Link>
            <Link href="/rates/guide/pilot-car" className="px-8 py-3 border border-[#C6923A]/30 text-[#C6923A] font-semibold rounded-xl hover:bg-[#C6923A]/10 transition-all">Pilot Car Rates →</Link>
          </div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="max-w-5xl mx-auto px-4 pb-16 border-t border-white/[0.06] pt-8">
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/permit-cost-calculator', label: 'Permit Cost Calculator' },
            { href: '/tools/route-complexity',        label: 'Route Complexity Scorer' },
            { href: '/escort-requirements',           label: 'Requirements by State' },
            { href: '/tools/escort-calculator',       label: 'Escort Count Calculator' },
            { href: '/corridors',                     label: 'Active Corridors' },
            { href: '/glossary',                      label: 'Heavy Haul Glossary' },
            { href: '/regulations',                   label: 'Regulations Atlas' },
            { href: '/training',                      label: 'Get Certified' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-300 hover:text-[#C6923A] hover:border-[#C6923A]/30 transition-all">{link.label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
