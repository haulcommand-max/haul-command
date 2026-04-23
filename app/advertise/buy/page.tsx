import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ChevronRight, Zap, Target, BarChart2, CheckCircle, Globe, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advertise on Haul Command — AdGrid Sponsor Packages',
  description: 'Reach 7,700+ heavy haul operators and freight brokers. Geo-targeted placements in directory, corridors, and tools. Start for as little as $49/mo.',
  alternates: { canonical: 'https://www.haulcommand.com/advertise/buy' },
};

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: 'mo',
    tag: null,
    description: 'Get found by operators in your region.',
    features: [
      '1 sponsored directory listing',
      'State-level targeting',
      '5,000 guaranteed impressions/mo',
      'Click tracking dashboard',
      'Cancel anytime',
    ],
    cta: 'Start Starter',
    color: '#6B7280',
  },
  {
    id: 'corridor',
    name: 'Corridor Sponsor',
    price: 149,
    period: 'mo',
    tag: 'Most Popular',
    description: 'Own a corridor. Every broker and operator checking that route sees you.',
    features: [
      '1 exclusive corridor banner',
      'Corridor + nearby city targeting',
      '25,000 guaranteed impressions/mo',
      'Featured in corridor intelligence pages',
      'Performance score reports',
      'Priority placement in search',
    ],
    cta: 'Sponsor a Corridor',
    color: '#F1A91B',
  },
  {
    id: 'featured',
    name: 'Featured Profile',
    price: 99,
    period: 'mo',
    tag: null,
    description: 'Gold badge + top placement in directory search results.',
    features: [
      'Featured badge in directory',
      'Top-3 placement in state searches',
      'Claim profile verification',
      '15,000 impressions/mo',
      'Conversion tracking',
    ],
    cta: 'Get Featured',
    color: '#8B5CF6',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    period: 'mo',
    tag: 'Best ROI',
    description: 'Full-network visibility. All zones, all corridors, all roles.',
    features: [
      'All 15,346 inventory slots available',
      'Role-targeted ad delivery (broker / operator / carrier)',
      '100,000+ impressions/mo',
      'Custom creatives (3 variants)',
      'Dedicated account manager',
      'ROI reporting + attribution',
      'Country founding sponsor option',
    ],
    cta: 'Talk to Sales',
    color: '#22C55E',
  },
];

export default async function AdvertisePage() {
  const supabase = createClient();

  // Pull live inventory stats
  const { count: totalSlots } = await supabase
    .from('hc_adgrid_inventory')
    .select('*', { count: 'exact', head: true });

  const { count: availableSlots } = await supabase
    .from('hc_adgrid_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('booked', false);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1A91B]/10 border border-[#F1A91B]/20 rounded-full text-xs font-bold text-[#F1A91B] uppercase tracking-widest mb-6">
          AdGrid — Haul Command Advertising
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
          Reach Heavy Haul<br />
          <span className="text-[#F1A91B]">Decision Makers</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          7,711+ operators and brokers use Haul Command daily. Your brand in front of the right audience at the right moment — corridor searches, permit lookups, rate checks.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-10">
          {[
            { icon: Users, label: '7,711+ operators', value: 'in network' },
            { icon: Globe, label: '120 countries', value: 'global reach' },
            { icon: BarChart2, label: `${availableSlots?.toLocaleString() ?? '15,346'} ad slots`, value: 'available now' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <s.icon className="w-4 h-4 text-[#F1A91B]" />
              <span><strong className="text-white">{s.label}</strong> {s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PACKAGES.map(pkg => (
            <div key={pkg.id} className={`relative bg-[#111827] rounded-2xl border ${pkg.name === 'Corridor Sponsor' ? 'border-[#F1A91B]/40' : 'border-white/[0.08]'} p-6 flex flex-col`}>
              {pkg.tag && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F1A91B] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                  {pkg.tag}
                </div>
              )}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: pkg.color }}>{pkg.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${pkg.price}</span>
                  <span className="text-gray-500 text-sm">/{pkg.period}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{pkg.description}</p>
              </div>
              <ul className="flex-1 space-y-2 mb-6">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: pkg.color }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={pkg.id === 'enterprise' ? '/contact?subject=enterprise-ads' : `/advertise/checkout?plan=${pkg.id}`}
                className="block text-center py-2.5 px-4 rounded-xl text-sm font-bold transition-all"
                style={{ background: pkg.name === 'Corridor Sponsor' ? '#F1A91B' : `${pkg.color}20`, color: pkg.name === 'Corridor Sponsor' ? 'black' : pkg.color, border: `1px solid ${pkg.color}40` }}>
                {pkg.cta} →
              </Link>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-12 p-6 bg-[#111827] rounded-2xl border border-white/[0.06] text-center">
          <p className="text-sm text-gray-400 mb-4">Trusted by permit services, insurance providers, equipment companies, and training platforms targeting the heavy haul industry.</p>
          <div className="flex flex-wrap justify-center gap-8 text-xs text-gray-500">
            {['Real-time analytics', 'Geo-targeted placement', 'Role-aware delivery', 'Cancel anytime', 'No long-term contracts'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-[#F1A91B]" />{t}</span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-10">
          <h2 className="text-xl font-black text-center mb-6">How AdGrid Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', icon: Target, title: 'Choose Your Zone', desc: 'Select corridor, state, country, or role-based targeting for your ad placement.' },
              { step: '02', icon: Zap, title: 'AI Generates Your Ad', desc: 'Our three-framework AI system (Hormozi + Cole Gordon + Billy Gene) creates high-converting copy.' },
              { step: '03', icon: BarChart2, title: 'Track & Optimize', desc: 'Real-time impressions, clicks, leads, and ROI. Swap creatives anytime without losing history.' },
            ].map(s => (
              <div key={s.step} className="bg-[#111827] rounded-xl border border-white/[0.06] p-5">
                <div className="text-xs font-black text-[#F1A91B] mb-2">{s.step}</div>
                <s.icon className="w-5 h-5 text-[#F1A91B] mb-3" />
                <h3 className="font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
