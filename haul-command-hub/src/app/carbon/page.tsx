import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carbon Reports for Heavy Haul Transport — Haul Command',
  description:
    'Certified Scope 3 carbon emission reports for every oversize load move through Haul Command. ESG-ready documentation for Fortune 500 shippers, banks, and project owners.',
};

const REPORT_TIERS = [
  {
    name: 'Per-Move Report',
    price: '$49',
    period: 'per report',
    desc: 'Single move carbon report with route, vehicle, load weight, and certified emission calculation.',
    features: ['Route-specific CO₂e calculation', 'Vehicle type & fuel factor', 'Load weight adjustment', 'PDF certificate', 'JSON data export'],
    tag: null,
  },
  {
    name: 'Project Bundle',
    price: '$25',
    period: 'per move (50+ moves)',
    desc: 'Carbon reporting for a full project — wind farm, giga-factory, or infrastructure build.',
    features: ['All Per-Move features', 'Project roll-up report', 'Quarterly summary', 'GHG Protocol compliant', 'Audit-ready documentation'],
    tag: 'Most Popular',
  },
  {
    name: 'Enterprise ESG',
    price: 'Custom',
    period: 'annual subscription',
    desc: 'Continuous carbon monitoring across all loads with API integration to your ESG platform.',
    features: ['All Project features', 'Real-time API access', 'Scope 3 dashboard', 'CDP submission ready', 'Dedicated account manager'],
    tag: 'Best Value',
  },
];

const WHO_PAYS = [
  { icon: '🏭', name: 'Equipment OEMs', desc: 'Caterpillar, Siemens, Liebherr — shipping equipment globally with Scope 3 obligations' },
  { icon: '⚡', name: 'Energy Companies', desc: 'Shell, Saudi Aramco, BP — moving infrastructure under mandatory carbon reporting' },
  { icon: '🏗️', name: 'Project Developers', desc: 'Wind farm, solar, and giga-factory builders with lender ESG requirements' },
  { icon: '🏦', name: 'Financial Institutions', desc: 'Infrastructure banks requiring Scope 3 data from project portfolios' },
  { icon: '🌍', name: 'Governments', desc: 'Public sector infrastructure projects with carbon budget mandates' },
  { icon: '🔬', name: 'Mining Companies', desc: 'Rio Tinto, BHP, Glencore — moving equipment under ESG investor pressure' },
];

export default function CarbonReportsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Carbon Reports</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">📊 GHG Protocol Compliant · ISO 14064</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Scope 3 Carbon Reports<br />
            <span className="text-green-400">for Every Move</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Every oversize load through Haul Command generates precise transport data — route, distance,
            vehicle, load weight. We turn that into a certified Scope 3 emission report your ESG team
            actually needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/carbon/order"
              className="bg-green-500 text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
            >
              Order a Report →
            </Link>
            <Link
              href="#pricing"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </header>

        {/* The Data We Have */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-4">
                We Already Have<br /><span className="text-green-400">All the Data</span>
              </h2>
              <p className="text-gray-400 mb-6">
                Generating a carbon report normally requires collecting data from multiple sources —
                route documentation, vehicle specs, fuel records, load manifests. For every job that
                runs through Haul Command, we already have all of it.
              </p>
              <div className="space-y-3">
                {[
                  { field: 'Route Distance', source: 'GPS-verified actual route', icon: '🛣️' },
                  { field: 'Vehicle Type & Age', source: 'Operator profile & Motive ELD', icon: '🚗' },
                  { field: 'Load Weight & Dimensions', source: 'Permit documentation', icon: '⚖️' },
                  { field: 'Fuel Type', source: 'Operator fleet profile', icon: '⛽' },
                  { field: 'Escort Vehicle Count', source: 'Job dispatch records', icon: '🚛' },
                  { field: 'Job Timestamps', source: 'Supabase verified records', icon: '🕐' },
                ].map(item => (
                  <div key={item.field} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 py-2.5">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-white text-sm font-bold">{item.field}</div>
                      <div className="text-gray-500 text-xs">Source: {item.source}</div>
                    </div>
                    <span className="ml-auto text-green-400 text-xs font-bold">✓ Available</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-green-500/20 rounded-2xl p-6 sm:p-8">
              <div className="text-green-400 text-xs font-black uppercase tracking-widest mb-4">Sample Report Output</div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="text-white">Houston, TX → Midland, TX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance (GPS actual)</span>
                  <span className="text-white">341 mi · 549 km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Escort vehicles</span>
                  <span className="text-white">2 × Ford F-250 (2022)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Load weight</span>
                  <span className="text-white">186,000 lbs</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-gray-500">Escort vehicle emissions</span>
                  <span className="text-green-400 font-bold">0.41 tCO₂e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GHG Protocol category</span>
                  <span className="text-white">Scope 3, Cat. 9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Calculation method</span>
                  <span className="text-white">DEFRA / EPA</span>
                </div>
                <div className="border-t border-green-500/20 pt-3">
                  <div className="text-green-400 font-black text-center text-sm">✓ Certified by Haul Command</div>
                  <div className="text-gray-600 text-[10px] text-center mt-1">Certificate ID: HC-CRB-240324-001</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Pays */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Who Needs This</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Scope 3 reporting is now mandatory or imminently mandatory for large corporations in most of your 120 countries</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHO_PAYS.map(w => (
              <div key={w.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-green-500/20 transition-all">
                <div className="text-3xl mb-2">{w.icon}</div>
                <h3 className="text-white font-bold text-sm mb-1">{w.name}</h3>
                <p className="text-gray-500 text-xs">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Pricing</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Pay per move, bundle for projects, or go API for enterprise ESG</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REPORT_TIERS.map((t, i) => (
              <div key={t.name} className={`rounded-2xl p-6 border relative ${
                i === 1 ? 'border-green-500/30 bg-green-500/5' : 'border-white/[0.08] bg-white/[0.03]'
              }`}>
                {t.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    {t.tag}
                  </div>
                )}
                <div className="text-white font-black text-lg mb-1">{t.name}</div>
                <div className="text-green-400 font-black text-3xl mb-0.5">{t.price}</div>
                <div className="text-gray-500 text-xs mb-4">{t.period}</div>
                <p className="text-gray-400 text-xs mb-4">{t.desc}</p>
                <ul className="space-y-2 mb-6">
                  {t.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/carbon/order"
                  className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-colors ${
                    i === 1
                      ? 'bg-green-500 text-black hover:bg-green-400'
                      : 'bg-white/[0.06] text-white border border-white/[0.1] hover:border-green-500/30'
                  }`}
                >
                  {t.price === 'Custom' ? 'Contact Sales' : 'Order Now'}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue Trajectory */}
        <section className="mb-16 bg-gradient-to-r from-green-500/5 to-transparent border border-green-500/10 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Revenue Grows Automatically</h2>
          <p className="text-gray-400 text-sm mb-4">
            Carbon reporting regulations tighten every year in every jurisdiction. CSRD in Europe, SEC rules in the US,
            equivalent mandates in Australia, the UK, and Singapore. Every Fortune 500 company shipping equipment through
            your 120 countries will need this data.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { period: 'Year 1', est: '$50K/mo', driver: 'Early enterprise pilots' },
              { period: 'Year 3', est: '$500K/mo', driver: 'EU CSRD, SEC rules live' },
              { period: 'Year 10', est: '$2M/mo', driver: 'Global mandate coverage' },
            ].map(p => (
              <div key={p.period} className="text-center">
                <div className="text-green-400 font-black text-lg">{p.est}</div>
                <div className="text-white text-xs font-bold">{p.period}</div>
                <div className="text-gray-600 text-[10px]">{p.driver}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Order Your First Report Free</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            First carbon report is on us. See exactly what your shippers get — and what you can
            charge for it on every future move.
          </p>
          <Link
            href="/carbon/order"
            className="inline-flex bg-green-500 text-black px-10 py-4 rounded-xl font-black text-base hover:bg-green-400 transition-colors"
          >
            Get Free Sample Report →
          </Link>
        </div>
      </main>
    </>
  );
}
