import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haul Command Fuel Card — Auto-Categorized Diesel Expenses',
  description:
    'The first fuel card built for pilot car and escort vehicle operators. Auto-categorize purchases, calculate tax deductions, and earn rebates on every gallon.',
};

const FUEL_CARD_FEATURES = [
  { icon: '⛽', title: 'Accepted Everywhere', desc: 'Works at 45,000+ fuel stations across the US and growing internationally. WEX and Fleetcor network.' },
  { icon: '📊', title: 'Auto-Categorized', desc: 'Every fuel purchase automatically categorized and synced to your earnings dashboard alongside job income.' },
  { icon: '🧾', title: 'Tax Deduction Tracking', desc: 'Auto-calculates IRS Schedule C and equivalent international deductions for every fill-up. Tax season = one click.' },
  { icon: '💰', title: 'Rebates Per Gallon', desc: 'Earn cash back on every gallon. More jobs = higher rebate tier. No minimum spend required.' },
  { icon: '🌍', title: 'Global Coverage', desc: 'Regional fuel card partnerships in 57 countries. One card, one dashboard, everywhere you work.' },
  { icon: '📱', title: 'Real-Time Alerts', desc: 'Instant transaction alerts, spending limits, and fraud detection. Full visibility from the Haul Command app.' },
];

const REBATE_TIERS = [
  { tier: 'Operator', jobs: '1–10/mo', rebate: '$0.02', color: 'gray' },
  { tier: 'Pro Operator', jobs: '11–30/mo', rebate: '$0.03', color: 'blue' },
  { tier: 'Elite', jobs: '31+/mo', rebate: '$0.05', color: 'accent' },
];

const CARD_PARTNERS = [
  { name: 'WEX', coverage: 'US & Canada', network: '45,000+ stations' },
  { name: 'Fleetcor', coverage: 'US, Europe, Brazil, AU', network: 'Multi-network' },
  { name: 'Regional Partners', coverage: '57 Countries', network: 'Local networks' },
];

export default function FuelCardPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Fuel Card</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Launching Q2 2025</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            The Fuel Card Built for<br />
            <span className="text-accent">Escort Operators</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Every gallon you buy earns real cash back. Every purchase auto-categorizes for taxes.
            One card that works at 45,000+ stations and syncs directly to your Haul Command earnings dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/fuel-card/apply"
              className="bg-accent text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
            >
              Get Early Access →
            </Link>
            <Link
              href="#rebates"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              See Rebate Tiers
            </Link>
          </div>
        </header>

        {/* The Math */}
        <section className="mb-16 bg-gradient-to-r from-accent/5 to-transparent border border-accent/15 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">The Math Works for You</h2>
          <p className="text-gray-500 text-sm mb-6">At 200 gallons/month, your fuel card pays for itself — and then some.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Gallons/Month', value: '200 gal', sub: 'per operator' },
              { label: 'Elite Rebate Rate', value: '$0.05/gal', sub: 'highest tier' },
              { label: 'Monthly Rebate', value: '$10/mo', sub: 'back in your pocket' },
              { label: 'Annual Cash Back', value: '$120/yr', sub: 'just for fueling up' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-accent font-black text-xl mb-0.5">{s.value}</div>
                <div className="text-white text-xs font-bold">{s.label}</div>
                <div className="text-gray-600 text-[10px]">{s.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-6">
            At 100,000 operators: 20M gallons/month in card volume → $400K–$1M/month platform revenue from rebate share alone.
          </p>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Built Different</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Every other fuel card ignores the escort industry. We built ours for it.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUEL_CARD_FEATURES.map(f => (
              <div key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-accent/20 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rebate Tiers */}
        <section id="rebates" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Rebate Tiers</h2>
          <p className="text-gray-500 text-sm text-center mb-8">More jobs = higher rebate. Automatically upgraded based on your activity.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REBATE_TIERS.map((t, i) => (
              <div key={t.tier} className={`rounded-2xl p-6 border text-center ${
                i === 2
                  ? 'border-accent/40 bg-accent/5'
                  : i === 1
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : 'border-white/[0.08] bg-white/[0.03]'
              }`}>
                {i === 2 && <div className="text-accent text-[10px] font-black uppercase tracking-wider mb-2">Most Popular</div>}
                <div className="text-white font-black text-xl mb-1">{t.tier}</div>
                <div className="text-gray-500 text-xs mb-4">{t.jobs}</div>
                <div className={`font-black text-4xl mb-1 ${i === 2 ? 'text-accent' : i === 1 ? 'text-blue-400' : 'text-gray-300'}`}>
                  {t.rebate}
                </div>
                <div className="text-gray-600 text-xs">per gallon rebate</div>
              </div>
            ))}
          </div>
        </section>

        {/* Card Partners */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-6 text-center">Card Network Partners</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CARD_PARTNERS.map(p => (
              <div key={p.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center hover:border-white/[0.12] transition-all">
                <div className="text-white font-black text-lg mb-1">{p.name}</div>
                <div className="text-accent text-sm font-bold mb-1">{p.network}</div>
                <div className="text-gray-500 text-xs">{p.coverage}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Be First in Line</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            The Haul Command Fuel Card launches Q2 2025. Join the early access list and get a
            <span className="text-accent font-bold"> $0.07/gal rebate rate</span> for your first 90 days.
          </p>
          <Link
            href="/fuel-card/apply"
            className="inline-flex bg-accent text-black px-10 py-4 rounded-xl font-black text-base hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
          >
            Join Early Access →
          </Link>
          <p className="text-gray-600 text-xs mt-4">Available to all Haul Command verified operators · 57 countries</p>
        </div>
      </main>
    </>
  );
}
