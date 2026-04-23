import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, DollarSign, Clock, MapPin, Shield, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

// /rates/[support-type] — Specialty support type rate guide
// Covers: height-pole, route-survey, bucket-truck, police-escort,
//         night-moves, multi-day, deadhead, wait-time, detention

interface Props { params: Promise<{ type: string }>; }

const SUPPORT_TYPES: Record<string, {
  title: string; localTerm: string; icon: string;
  description: string; rateType: string;
  low: string; mid: string; high: string; unit: string;
  factors: string[]; relatedHref: string; relatedLabel: string;
  directoryHref: string; seoKeywords: string[];
}> = {
  'height-pole': {
    title: 'Height Pole Escort', localTerm: 'Height Pole Operator',
    icon: '📏', rateType: 'Day Rate',
    description: 'Height pole operators provide specialized equipment to detect and manage overhead utility line clearance for tall oversize loads.',
    low: '$450', mid: '$600', high: '$850', unit: 'per day',
    factors: ['Load height and risk level','Number of lane miles requiring height sensing','Utility coordination required','Night vs day operations','State certification requirements'],
    relatedHref: '/directory?category=height-pole', relatedLabel: 'Find Height Pole Operators',
    directoryHref: '/directory?category=height-pole',
    seoKeywords: ['height pole escort cost', 'height pole operator rates', 'utility clearance escort pricing'],
  },
  'route-survey': {
    title: 'Route Survey / Engineering', localTerm: 'Route Survey Specialist',
    icon: '🗺️', rateType: 'Day Rate or Fixed Project Fee',
    description: 'Route survey specialists conduct pre-move site inspections, measuring bridge clearances, road widths, and identifying obstacles ahead of an oversize move.',
    low: '$500', mid: '$750', high: '$1,200', unit: 'per day',
    factors: ['Route length and complexity','Number of structures to inspect','Permit documentation required','Engineering sign-off required','Urban vs rural routing'],
    relatedHref: '/directory?category=route-survey', relatedLabel: 'Find Route Survey Specialists',
    directoryHref: '/directory?category=route-survey',
    seoKeywords: ['route survey pricing', 'oversize load route survey cost', 'route survey escort rates'],
  },
  'bucket-truck': {
    title: 'Bucket Truck / Utility Escort', localTerm: 'Bucket Truck Operator',
    icon: '🔧', rateType: 'Day Rate',
    description: 'Bucket truck escorts provide temporary wire lifting for loads that exceed standard height clearances, coordinating with utility companies to clear transmission and distribution lines.',
    low: '$600', mid: '$900', high: '$1,400', unit: 'per day',
    factors: ['Number of wire lifts required','Utility company coordination time','Equipment setup complexity','Line voltage risk classification','Multi-crew requirements'],
    relatedHref: '/directory?category=bucket-truck', relatedLabel: 'Find Bucket Truck Operators',
    directoryHref: '/directory?category=bucket-truck',
    seoKeywords: ['bucket truck escort cost', 'utility escort pricing', 'wire lift escort rates'],
  },
  'police-escort': {
    title: 'Police Escort Coordination', localTerm: 'Law Enforcement Escort',
    icon: '🚔', rateType: 'Per Hour or Flat Rate',
    description: 'Some states require law enforcement escorts for loads exceeding specific dimensions or weights. Lead times range from 24 hours to 6+ weeks by jurisdiction.',
    low: '$85', mid: '$150', high: '$350', unit: 'per hour',
    factors: ['State vs local law enforcement requirement','Shift length and overtime rules','Number of officers required','Holiday or weekend premium','Route length and jurisdiction handoff counts'],
    relatedHref: '/escort-requirements?type=police-escort', relatedLabel: 'Check Police Escort Requirements',
    directoryHref: '/directory',
    seoKeywords: ['police escort cost oversize load', 'law enforcement escort rates', 'police escort lead time by state'],
  },
  'night-moves': {
    title: 'Night Move Premiums', localTerm: 'Night Move Escort',
    icon: '🌙', rateType: 'Premium Rate (additive)',
    description: 'Night moves typically carry a 20–50% rate premium due to reduced visibility, additional lighting requirements, and restricted travel windows in many states.',
    low: '+20%', mid: '+35%', high: '+50%', unit: 'above day rate',
    factors: ['State night move permit requirements','Additional lighting equipment','Reduced operator pool availability','Fatigue management protocols','Off-peak corridor demand'],
    relatedHref: '/escort-requirements', relatedLabel: 'Night Move State Requirements',
    directoryHref: '/available-now',
    seoKeywords: ['night move escort premium', 'oversize load night move cost', 'pilot car night move rates'],
  },
  'multi-day': {
    title: 'Multi-Day & Layover Escort', localTerm: 'Multi-Day Support',
    icon: '📅', rateType: 'Day Rate + Expenses',
    description: 'Extended moves spanning multiple days or weeks include daily escort fees plus accommodation, per diem, and vehicle expenses. Some brokers negotiate all-in weekly rates.',
    low: '$350/day', mid: '$475/day', high: '$650/day', unit: 'plus expenses',
    factors: ['Daily escort rate agreement','Per diem / accommodation policy','Equipment deadhead between moves','Cancellation after dispatch rules','Load type and route complexity'],
    relatedHref: '/rates', relatedLabel: 'View Full Rate Index',
    directoryHref: '/directory',
    seoKeywords: ['multi-day escort rates', 'pilot car layover pay', 'extended move escort pricing'],
  },
  'deadhead': {
    title: 'Deadhead / Repositioning Pay', localTerm: 'Deadhead & Repositioning',
    icon: '🔄', rateType: 'Per Mile or Flat Fee',
    description: 'Deadhead pay compensates escorts for traveling to the pick-up location without a load. Standard industry practice is 50–100% of the loaded rate for repositioning mileage.',
    low: '50%', mid: '65%', high: '100%', unit: 'of loaded rate / mile',
    factors: ['One-way distance to load origin','Negotiated deadhead percentage','Fuel and vehicle costs','Market supply and demand','Broker relationship / volume'],
    relatedHref: '/rates', relatedLabel: 'View Full Rate Index',
    directoryHref: '/directory',
    seoKeywords: ['pilot car deadhead pay', 'escort vehicle repositioning rates', 'deadhead pay percentage escort'],
  },
  'wait-time': {
    title: 'Wait Time & Detention Pay', localTerm: 'Wait Time / Detention',
    icon: '⏱️', rateType: 'Per Hour',
    description: 'Wait time and detention fees compensate escorts when a move is delayed beyond the agreed start time. Standard grace period is 30–60 minutes before hourly fees apply.',
    low: '$45', mid: '$75', high: '$125', unit: 'per hour after grace period',
    factors: ['Agreed grace period (30–60 min typical)','Day rate vs hourly breakdown','Load type and cause of delay','Broker agreement terms','State-specific dispute resolution'],
    relatedHref: '/rates', relatedLabel: 'Rate Index',
    directoryHref: '/directory',
    seoKeywords: ['pilot car wait time pay', 'escort detention fees', 'oversize load escort wait time rates'],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'type': type } = await params;
  const info = SUPPORT_TYPES[type];
  if (!info) return { title: 'Rate Guide | Haul Command' };
  return {
    title: `${info.title} Rates & Pricing 2026 | Haul Command`,
    description: `${info.description} View current ${info.title.toLowerCase()} benchmarks, rate factors, and find verified specialists.`,
    keywords: info.seoKeywords,
    alternates: { canonical: `https://www.haulcommand.com/rates/${type}` },
  };
}

export default async function SupportTypeRatePage({ params }: Props) {
  const { 'type': type } = await params;
  const info = SUPPORT_TYPES[type];
  if (!info) notFound();

  // Pull any DB rates for this support type
  const supabase = createClient();
  const { data: dbRates } = await supabase
    .from('hc_rates_public')
    .select('jurisdiction_slug, rate_low, rate_mid, rate_high, currency_code')
    .eq('surface_key', `us_${type.replace(/-/g,'_')}_rate`)
    .limit(5);

  return (
    <div className="min-h-screen min-h-screen">
      {/* Breadcrumb */}
      <nav className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#C6923A]">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/rates" className="hover:text-[#C6923A]">Rate Index</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700">{info.title}</span>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <span className="text-3xl mr-3">{info.icon}</span>
          <h1 className="inline text-3xl font-black text-gray-900">{info.title} — Rates & Pricing 2026</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">{info.description}</p>
        </div>

        {/* Rate cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Market Low', value: info.low, color: '#6B7280' },
            { label: 'Market Mid', value: info.mid, color: '#F1A91B', highlight: true },
            { label: 'Market High', value: info.high, color: '#22C55E' },
          ].map(card => (
            <div key={card.label} className={`rounded-2xl p-6 ${card.highlight ? 'bg-[#0B0F14] text-white' : 'bg-gray-50 border border-gray-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${card.highlight ? 'text-[#C6923A]' : 'text-gray-500'}`}>{card.label}</p>
              <p className="text-3xl font-black" style={{ color: card.highlight ? '#F1A91B' : card.color }}>{card.value}</p>
              <p className={`text-sm mt-1 ${card.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{info.unit}</p>
              {card.highlight && <p className="text-xs text-emerald-400 mt-2 font-semibold">Typical market rate</p>}
            </div>
          ))}
        </div>

        {/* Rate type */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-xl">
          <DollarSign className="w-5 h-5 text-[#F1A91B] shrink-0" />
          <div>
            <p className="font-bold text-gray-900 text-sm">Pricing Structure: {info.rateType}</p>
            <p className="text-xs text-gray-500">Actual rates vary by market, certification, and broker relationship.</p>
          </div>
        </div>

        {/* Rate factors */}
        <div className="mb-8">
          <h2 className="text-xl font-black text-gray-900 mb-4">Factors That Affect {info.localTerm} Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {info.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-[#F1A91B] font-bold text-sm shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-gray-700">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related support types */}
        <div className="mb-8">
          <h2 className="text-xl font-black text-gray-900 mb-4">Related Rate Guides</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SUPPORT_TYPES)
              .filter(([k]) => k !== type)
              .slice(0, 6)
              .map(([k, v]) => (
                <Link key={k} href={`/rates/${k}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-lg text-sm font-medium text-gray-700 hover:text-[#C6923A] transition-all">
                  <span>{v.icon}</span>
                  <span>{v.title}</span>
                </Link>
              ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="bg-[#0B0F14] text-white rounded-2xl p-8">
          <h3 className="text-xl font-black mb-2">Find Verified {info.localTerm}s</h3>
          <p className="text-gray-400 text-sm mb-6">7,700+ verified operators in the Haul Command network. Claim your listing to appear in specialty searches.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={info.directoryHref} className="px-6 py-3 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold rounded-lg text-center transition-colors">
              {info.relatedLabel}
            </Link>
            <Link href="/rates" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg text-center transition-colors">
              ← Full Rate Index
            </Link>
            <Link href="/claim" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-amber-500/20 text-[#C6923A] font-semibold rounded-lg text-center transition-colors">
              Claim Your Listing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
