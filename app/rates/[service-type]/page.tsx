import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight, DollarSign } from 'lucide-react';

// /rates/[service-type] — Service-type rate pages
// e.g. /rates/pilot-car, /rates/height-pole, /rates/route-survey

interface Props { params: Promise<{ 'service-type': string }>; }

const SERVICE_META: Record<string, {
  name: string; shortName: string; icon: string;
  description: string; factors: string[];
  relatedCalc?: string; relatedDir?: string;
}> = {
  'pilot-car': {
    name: 'Pilot Car / PEVO Rates', shortName: 'Pilot Car', icon: '🚗',
    description: 'Day rates and per-mile benchmarks for pilot car and PEVO escort services across all 50 US states and 120 countries.',
    factors: ['State certification requirements (affects supply)', 'Load dimensions and complexity', 'Route technicality (mountain vs flat)', 'Day of week — Friday premium 30-45%', 'Night move surcharges', 'Deadhead / repositioning distance'],
    relatedCalc: '/tools/escort-cost-calculator', relatedDir: '/directory?category=pilot-car',
  },
  'height-pole': {
    name: 'Height Pole Operator Rates', shortName: 'Height Pole', icon: '📏',
    description: 'Pricing for height pole operators and high-clearance escort specialists. Height pole setups command significant premiums above standard pilot car rates.',
    factors: ['Equipment rental component (pole setup cost)', 'Crew requirements — often 2 operators', 'Utility coordination requirements', 'Bridge/overpass clearance complexity', 'Night move requirements', 'Multi-state certification needs'],
    relatedCalc: '/tools/escort-cost-calculator', relatedDir: '/directory?category=height-pole',
  },
  'route-survey': {
    name: 'Route Survey Pricing', shortName: 'Route Survey', icon: '🗺️',
    description: 'Day rates and per-mile costs for professional route surveys. Route surveys are typically required for superloads and loads exceeding standard oversize dimensions.',
    factors: ['Survey distance and complexity', 'Overnight requirements', 'Report/documentation deliverables', 'Engineering certification requirements', 'Expedited turnaround premium', 'Multi-state / cross-country routes'],
    relatedCalc: '/tools/permit-cost-calculator', relatedDir: '/directory?category=route-survey',
  },
  'bucket-truck': {
    name: 'Bucket Truck / Utility Escort Rates', shortName: 'Bucket Truck', icon: '🔧',
    description: 'Pricing for bucket truck and utility escort services. Required when loads are near overhead lines, require line lifts, or operate near utility infrastructure.',
    factors: ['Utility company coordination', 'Line lift requirements and duration', 'Crew size (operator + ground crew)', 'Equipment type (aerial lift capacity)', 'Notice requirements to utilities', 'Permit requirements per state'],
    relatedDir: '/directory?category=bucket-truck',
  },
  'police-escort': {
    name: 'Police Escort Coordination Rates', shortName: 'Police Escort', icon: '🚔',
    description: 'Cost guidance for police escort requirements. Police escort fees vary dramatically by state — from flat fees to hourly rates, with lead times ranging from 24 hours to 6 weeks.',
    factors: ['State-specific escort requirement triggers', 'Hourly vs flat-rate billing by jurisdiction', 'Advance booking lead time requirements', 'Overtime and weekend premium rates', 'Number of officers required', 'Private escort coordinator fees'],
    relatedDir: '/directory?category=police-escort',
  },
  'night-moves': {
    name: 'Night Move Premium Rates', shortName: 'Night Moves', icon: '🌙',
    description: 'Night move surcharges are standard across the industry. Most states restrict oversize moves to daylight hours, making night move approvals a premium service.',
    factors: ['Night move permit surcharge (state-specific)', 'Operator overtime premium (typically 1.5x)', 'Additional lighting requirements', 'Reduced route availability', 'Police escort likelihood increases', 'Detention risk if daylight deadline missed'],
    relatedCalc: '/tools/escort-cost-calculator',
  },
  'deadhead': {
    name: 'Deadhead / Repositioning Rates', shortName: 'Deadhead', icon: '↩️',
    description: 'Deadhead and repositioning pay for escort operators. Standard industry practice is to compensate for empty return miles, though rates are lower than loaded escort rates.',
    factors: ['Distance of repositioning run', 'Whether escort needed for return (uncommon)', 'Multi-day layover inclusion', 'Alternative load availability', 'Fuel cost component', 'Market demand for the region'],
    relatedDir: '/directory?category=pilot-car',
  },
  'detention': {
    name: 'Wait Time / Detention Rates', shortName: 'Detention', icon: '⏱️',
    description: 'Detention and wait time compensation for escort operators. Industry standard is to begin billing after a defined free period (typically 30-60 minutes).',
    factors: ['Free time before billing starts (30-60 min standard)', 'Hourly detention rate (typically $30-75/hr)', 'Whether multi-hour wait triggers day rate', 'Bridge inspection delays', 'Police coordination delays', 'Staging and pre-move delay compensation'],
    relatedCalc: '/tools/escort-cost-calculator',
  },
};

const COUNTRY_RATES: Record<string, { name: string; flag: string; symbol: string; range: string }[]> = {
  'pilot-car': [
    { name: 'United States', flag: '🇺🇸', symbol: '$', range: '350–650/day · $1.00–3.00/mi' },
    { name: 'Canada', flag: '🇨🇦', symbol: 'C$', range: '500–800/day' },
    { name: 'Australia', flag: '🇦🇺', symbol: 'A$', range: '600–1,000/day' },
    { name: 'United Kingdom', flag: '🇬🇧', symbol: '£', range: '300–550/day' },
    { name: 'Germany', flag: '🇩🇪', symbol: '€', range: '350–650/day' },
    { name: 'UAE', flag: '🇦🇪', symbol: 'AED', range: '1,500–2,500/day' },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'service-type': serviceType } = await params;
  const meta = SERVICE_META[serviceType];
  if (!meta) return { title: 'Rate Index | Haul Command' };
  return {
    title: `${meta.name} 2026 — Market Benchmarks | Haul Command`,
    description: meta.description,
    alternates: { canonical: `https://www.haulcommand.com/rates/${serviceType}` },
  };
}

export default async function ServiceTypeRatesPage({ params }: Props) {
  const { 'service-type': serviceType } = await params;
  const meta = SERVICE_META[serviceType];
  if (!meta) notFound();

  const globalRates = COUNTRY_RATES[serviceType] || COUNTRY_RATES['pilot-car'];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#C6923A]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/rates" className="hover:text-[#C6923A]">Rate Index</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700">{meta.icon} {meta.shortName}</span>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <span className="inline-block px-2.5 py-1 bg-[#F1A91B]/10 text-[#C6923A] text-xs font-bold uppercase tracking-widest rounded-md mb-3">Rate Guide</span>
        <h1 className="text-3xl font-black text-gray-900 mb-3">{meta.name} — 2026</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">{meta.description}</p>

        {/* US rate CTA + global overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link href={`/rates/us`} className="bg-[#0B0F14] text-white rounded-2xl p-6 hover:bg-[#1a2332] transition-colors group">
            <p className="text-xs text-[#C6923A] font-bold uppercase tracking-widest mb-2">United States — All 50 States</p>
            <p className="text-3xl font-black text-[#F1A91B] mb-1">$350–$650</p>
            <p className="text-gray-400 text-sm mb-4">Typical day rate range</p>
            <span className="text-[#F1A91B] text-sm font-bold group-hover:underline">View state-by-state rates →</span>
          </Link>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Rate Drivers</p>
            <div className="space-y-2">
              {meta.factors.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-[#F1A91B] font-bold shrink-0 mt-0.5">✓</span>{f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global rates */}
        <h2 className="text-xl font-black text-gray-900 mb-4">Global Market Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          {globalRates.map(c => (
            <Link key={c.name} href={`/rates/${c.name.toLowerCase().replace(/\s+/g, '-').replace('united-', '')}`}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
              <span className="text-2xl">{c.flag}</span>
              <div>
                <p className="font-bold text-sm text-gray-800 group-hover:text-[#C6923A]">{c.name}</p>
                <p className="text-xs text-[#C6923A] font-semibold">{c.symbol}{c.range}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* All rate factors */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h2 className="font-black text-gray-900 mb-3">All {meta.shortName} Rate Factors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meta.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-[#F1A91B] font-bold mt-0.5">✓</span>{f}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {meta.relatedDir && (
            <Link href={meta.relatedDir} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-white font-bold text-sm rounded-xl transition-colors">
              Find {meta.shortName} Operators →
            </Link>
          )}
          {meta.relatedCalc && (
            <Link href={meta.relatedCalc} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-[#F1A91B]/40 text-gray-700 hover:text-[#C6923A] font-semibold text-sm rounded-xl transition-colors">
              Estimate My Cost →
            </Link>
          )}
          <Link href="/rates" className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:border-[#F1A91B]/40 text-gray-700 hover:text-[#C6923A] font-semibold text-sm rounded-xl transition-colors">
            ← Full Rate Index
          </Link>
        </div>
      </main>
    </div>
  );
}
