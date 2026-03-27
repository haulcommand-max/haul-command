import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'Haul Command Insurance Marketplace — Pilot Car & Heavy Haul Coverage',
  description:
    'Instant insurance quotes for pilot car operators and escort services. Pre-underwritten with your Haul Command performance data. Northfield, Intact, and specialty heavy haul carriers.',
};

export const revalidate = 3600;

const COVERAGE_TYPES = [
  {
    icon: '🚗',
    name: 'Escort Vehicle Liability',
    desc: 'Commercial auto liability for vehicles used exclusively in escort operations. Admits oversize load escort as primary use — most carriers exclude this.',
    starts: 'From $87/mo',
    min: '$1M per occurrence',
    highlight: true,
  },
  {
    icon: '👷',
    name: 'Occupational Accident',
    desc: 'Income replacement and medical if you\'re injured on the job. Standard workers\' comp doesn\'t cover independent operators — this does.',
    starts: 'From $34/mo',
    min: '$500K benefit',
    highlight: false,
  },
  {
    icon: '📋',
    name: 'Errors & Omissions',
    desc: 'If a broker claims your escort caused a permit violation or route deviation, E&O covers legal defense and settlements.',
    starts: 'From $55/mo',
    min: '$1M policy',
    highlight: false,
  },
  {
    icon: '🏢',
    name: 'General Liability',
    desc: 'Covers property damage and third-party injuries that don\'t involve your vehicle directly. Required by many brokers and project owners.',
    starts: 'From $42/mo',
    min: '$2M per occurrence',
    highlight: false,
  },
  {
    icon: '🌍',
    name: 'International Coverage Rider',
    desc: 'Extends your US/CA coverage when working cross-border or in select international corridors. Available in 22 countries with our carriers.',
    starts: 'From $28/mo',
    min: 'Add-on rider',
    highlight: false,
  },
  {
    icon: '🏗️',
    name: 'Project-Specific Coverage',
    desc: 'Short-term policy for a single project — wind farm build, giga-factory delivery, or multi-state oversize move. No annual commitment.',
    starts: 'From $190/project',
    min: 'Per-project underwriting',
    highlight: false,
  },
];

const CARRIERS = [
  { name: 'Northfield Transportation', specialty: 'US heavy haul & escort specialist', regions: ['US', 'CA'] },
  { name: 'Intact Insurance', specialty: 'Commercial auto + specialty lines', regions: ['CA', 'US'] },
  { name: 'Markel', specialty: 'Specialty transport & excess lines', regions: ['US', 'UK', 'AU'] },
  { name: 'Great American Insurance', specialty: 'Motor carrier & transport specialty', regions: ['US'] },
  { name: 'Regional Carriers', specialty: 'In-country specialty insurers', regions: ['120 countries'] },
];

const WHY_DIFFERENT = [
  {
    icon: '📊',
    title: 'Pre-Underwritten with Your Data',
    desc: 'Normal insurance underwriters guess your risk. We tell them exactly what your safety record, job completion rate, and HSO history is. Lower risk profile = lower premium.',
  },
  {
    icon: '⚡',
    title: 'Instant Quote, Not a Phone Call',
    desc: 'No waiting 3 days for a callback. Your Haul Command profile auto-fills the underwriting form. Quote in 90 seconds.',
  },
  {
    icon: '🛡️',
    title: 'Admits Escort Operations',
    desc: 'Most commercial auto policies contain exclusions for oversize load escort. Every carrier in our marketplace explicitly covers escort vehicle operations as primary use.',
  },
  {
    icon: '🌍',
    title: 'Multi-Country Capability',
    desc: 'Operating in Brazil? Saudi Arabia? Australia? We have carrier relationships in 120 countries and growing. One marketplace, everywhere you work.',
  },
];

export default async function InsurancePage() {
  const sb = supabaseServer();

  // Pull operator count for social proof
  const { count: verifiedCount } = await sb
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .not('motive_connected_at', 'is', null);

  const operatorCount = verifiedCount ?? 0;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Insurance</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">🛡️ Escort-Specific Coverage · 120 countries</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Insurance That Knows<br />
            <span className="text-red-400">Your Industry</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Most insurance carriers either exclude escort vehicle operations entirely or massively overcharge
            because they don't understand it. Haul Command Insurance Marketplace connects you with carriers
            who specialize in oversize transport — and pre-fills your application with your verified
            performance record.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/insurance/quote"
              className="bg-red-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
            >
              Get Instant Quote →
            </Link>
            <Link
              href="#coverage"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              View Coverage Types
            </Link>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
          {[
            { value: `${operatorCount > 0 ? operatorCount.toLocaleString() : '7,335'}+`, label: 'Verified Operators' },
            { value: '5', label: 'Carrier Partners' },
            { value: '57', label: 'Countries' },
            { value: '90s', label: 'Quote Time' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-red-400 font-black text-2xl">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Why Different */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Why This Hits Different</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Standard insurance marketplaces don't have carrier relationships built for escort operations. We do.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_DIFFERENT.map(w => (
              <div key={w.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-red-500/20 transition-all">
                <div className="text-3xl mb-3">{w.icon}</div>
                <h3 className="text-white font-bold text-base mb-2">{w.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How Platform Data Helps */}
        <section className="mb-16 bg-gradient-to-r from-red-500/5 to-transparent border border-red-500/15 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-4">Your Performance Record = Lower Premiums</h2>
          <p className="text-gray-400 text-sm mb-6">
            Traditional underwriting uses vehicle type, years of experience, and past claims. That's all they can see.
            Haul Command data gives underwriters an unprecedented view of your actual operational safety.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { field: 'Job Completion Rate', icon: '✅', impact: 'Lowers liability premium' },
              { field: 'Dispute-Free History', icon: '🕊️', impact: 'Lowers E&O premium' },
              { field: 'Average Route Distance', icon: '🛣️', impact: 'More accurate mileage rating' },
              { field: 'Motive ELD Safety Score', icon: '📡', impact: 'Behavior-based discount' },
            ].map(item => (
              <div key={item.field} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-white text-xs font-bold mb-1">{item.field}</div>
                <div className="text-red-400 text-[10px] font-bold">{item.impact}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage Types */}
        <section id="coverage" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Coverage Types</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Mix and match what you need. All can be quoted in 90 seconds.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COVERAGE_TYPES.map(c => (
              <div key={c.name} className={`rounded-2xl p-6 border transition-all hover:border-red-500/20 relative ${
                c.highlight ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.08] bg-white/[0.03]'
              }`}>
                {c.highlight && (
                  <div className="absolute -top-3 left-4 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Most Needed
                  </div>
                )}
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="text-white font-bold text-sm mb-1">{c.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{c.desc}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-accent font-black text-base">{c.starts}</div>
                    <div className="text-gray-600 text-[10px]">{c.min}</div>
                  </div>
                  <Link
                    href="/insurance/quote"
                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold hover:bg-red-500/20 transition-colors"
                  >
                    Quote →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Carrier Partners */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2 text-center">Carrier Partners</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Multiple carriers compete for your business — you get the best rate</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CARRIERS.map(c => (
              <div key={c.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center hover:border-white/[0.12] transition-all">
                <div className="text-white font-bold text-xs mb-1">{c.name}</div>
                <div className="text-gray-500 text-[10px] mb-2">{c.specialty}</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {c.regions.map(r => (
                    <span key={r} className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Global Opportunity */}
        <section className="mb-16 bg-gradient-to-r from-red-500/5 to-transparent border border-red-500/10 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">$15M+/month at Scale</h2>
          <p className="text-gray-400 text-sm mb-4">
            Insurance is the largest per-operator spend outside of fuel and vehicle payments.
            The average US pilot car operator pays $1,500–$3,000/year in insurance.
            At 100,000 operators — that's $15M–$25M/month in premium volume flowing through the marketplace.
            Our commission on placed policies: 5–12%.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { period: 'Year 2', est: '$150K/mo', note: 'US launch, 2–3 carriers' },
              { period: 'Year 5', est: '$1.5M/mo', note: 'Multi-country, 5+ carriers' },
              { period: 'Year 10', est: '$15M/mo', note: 'Global marketplace standard' },
            ].map(p => (
              <div key={p.period} className="text-center">
                <div className="text-red-400 font-black text-xl mb-0.5">{p.est}</div>
                <div className="text-white text-sm font-bold">{p.period}</div>
                <div className="text-gray-600 text-[10px]">{p.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Get Quoted in 90 Seconds</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Your Haul Command profile pre-fills 70% of the underwriting form. You only answer what we don't already know.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/insurance/quote"
              className="bg-red-500 text-white px-10 py-4 rounded-xl font-black text-base hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
            >
              Get Instant Quote →
            </Link>
            <Link
              href="mailto:insurance@haulcommand.com"
              className="bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors"
            >
              Talk to Coverage Advisor
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">No commitment required · Multi-carrier comparison · 120 countries</p>
        </div>
      </main>
    </>
  );
}
