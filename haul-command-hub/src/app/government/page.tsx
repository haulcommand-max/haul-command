import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Government & DOT Data Partnerships — Haul Command',
  description:
    'Permit intelligence, infrastructure stress reporting, and oversize freight analytics for transport ministries, state DOTs, and infrastructure agencies across 57 countries.',
};

const DATA_PRODUCTS = [
  {
    icon: '🛣️',
    title: 'Traffic Impact Analysis',
    desc: 'Before approving new permits, understand how similar loads have historically moved through those routes — volume, frequency, seasonal patterns, and infrastructure impact.',
    price: 'From $15K/year',
    customers: 'State DOTs, Transport ministries',
  },
  {
    icon: '🌉',
    title: 'Infrastructure Stress Reports',
    desc: 'Which bridges and roads are carrying the most oversize load traffic? Identify infrastructure investment priorities from actual job data, not estimates.',
    price: 'From $25K/year',
    customers: 'Infrastructure agencies, FHWA, national transport authorities',
  },
  {
    icon: '📊',
    title: 'Permit Processing Benchmarks',
    desc: 'How does your jurisdiction\'s processing time compare to peers? Actionable efficiency data that governments use for budget justification and reform.',
    price: 'From $10K/year',
    customers: 'Transport ministries, efficiency offices',
  },
  {
    icon: '💰',
    title: 'Economic Impact Data',
    desc: 'The total value of oversize freight that moved through your jurisdiction — for policy arguments, tourism boards, and economic development offices.',
    price: 'From $20K/year',
    customers: 'Economic agencies, planning departments',
  },
  {
    icon: '🌍',
    title: 'Cross-Border Corridor Intelligence',
    desc: 'Volume, timing, and compliance patterns for international corridors. Supports trade facilitation agreements and border crossing optimization.',
    price: 'From $40K/year',
    customers: 'Customs authorities, multilateral trade bodies',
  },
  {
    icon: '📡',
    title: 'Real-Time Permit API',
    desc: 'White-label permit intelligence API that lets transport authorities integrate Haul Command data directly into their own permit processing systems.',
    price: 'Custom Enterprise',
    customers: 'DOTs building digital permit infrastructure',
  },
];

const CASE_TYPES = [
  { jurisdiction: 'State DOT (US)', contract: '$50K–$250K/year', term: 'Auto-renewing', note: 'Traffic impact + infrastructure reports' },
  { jurisdiction: 'National Transport Ministry', contract: '$100K–$500K/year', term: '3-year contracts', note: 'Full data suite, cross-border' },
  { jurisdiction: 'Infrastructure Agency', contract: '$25K–$100K/year', term: '2-year contracts', note: 'Bridge stress, route analytics' },
  { jurisdiction: 'Multilateral Body (EU, AfDB)', contract: '$200K–$2M/year', term: 'Program contracts', note: 'Regional corridor intelligence' },
];

export default function GovernmentPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Government Partnerships</span>
        </nav>

        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">🏛️ 57 Countries · Government Grade Data</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Think of Governments<br />
            <span className="text-blue-400">as Customers</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            The world's most comprehensive oversize load intelligence database — built from actual jobs,
            actual permits, and actual GPS data across 57 countries. Transport ministries,
            DOTs, and infrastructure agencies will pay for this. Permanently.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="mailto:government@haulcommand.com"
              className="bg-blue-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-blue-400 transition-colors"
            >
              Contact Government Sales →
            </Link>
            <Link
              href="#data-products"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              View Data Products
            </Link>
          </div>
        </header>

        {/* The Proposition */}
        <section className="mb-16 bg-blue-500/5 border border-blue-500/15 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-4">What Haul Command Has That No Government Can Build</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { stat: '57 countries', desc: 'Cross-border data that no single country\'s permit system can provide' },
              { stat: 'Real GPS data', desc: 'Actual route paths and timestamps, not permit applications or estimates' },
              { stat: '12-month trend', desc: 'Seasonal patterns, peak corridors, and infrastructure stress accumulation over time' },
              { stat: 'Operator-level', desc: 'Performance data on individual operators that permit offices never see' },
            ].map(item => (
              <div key={item.stat} className="flex gap-4 items-start">
                <div className="text-blue-400 font-black text-sm mt-0.5 flex-shrink-0 min-w-[100px]">{item.stat}</div>
                <div className="text-gray-400 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue Reality */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">The Compounding Government Revenue Model</h2>
          <p className="text-gray-400 text-sm mb-8">Government contracts are large, slow to win, and permanent once signed. One DOT contract is worth more than 100 enterprise subscriptions.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['Jurisdiction Type', 'Annual Contract', 'Term', 'What\'s Included'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CASE_TYPES.map((c, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{c.jurisdiction}</td>
                    <td className="px-4 py-3 text-accent font-black">{c.contract}</td>
                    <td className="px-4 py-3 text-gray-400">{c.term}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-gray-600 text-xs px-4">
            Target: 10 governments at an average of $200K/year = $2M ARR. Zero marginal cost after data infrastructure is built.
          </div>
        </section>

        {/* Data Products */}
        <section id="data-products" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Government Data Products</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Priced for government procurement cycles. Every product comes with onboarding, custom reporting, and a dedicated government account manager.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DATA_PRODUCTS.map(d => (
              <div key={d.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-blue-500/20 transition-all">
                <div className="text-3xl mb-3">{d.icon}</div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-bold text-base">{d.title}</h3>
                  <span className="text-accent font-black text-xs ml-2 flex-shrink-0 text-right">{d.price}</span>
                </div>
                <p className="text-gray-400 text-xs mb-3 leading-relaxed">{d.desc}</p>
                <div className="text-blue-400 text-[10px] font-bold">{d.customers}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue Trajectory */}
        <section className="mb-16 bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/10 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-4">25-Year Revenue Trajectory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { period: 'Year 3', est: '$100K/mo', path: '3–5 government contracts signed · US + EU focus' },
              { period: 'Year 10', est: '$3M/mo', path: '20+ governments · Cross-border corridor specialization' },
              { period: 'Year 25', est: '$50M+/mo', path: 'Standard infrastructure for global permit intelligence' },
            ].map(p => (
              <div key={p.period} className="text-center">
                <div className="text-blue-400 font-black text-2xl mb-1">{p.est}</div>
                <div className="text-white font-bold text-sm">{p.period}</div>
                <div className="text-gray-500 text-xs mt-1">{p.path}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Talk to Our Government Team</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Government sales cycles are long. Starting the conversation now is how contracts get signed in 18 months.
            Our team speaks procurement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="mailto:government@haulcommand.com" className="bg-blue-500 text-white px-10 py-4 rounded-xl font-black text-base hover:bg-blue-400 transition-colors">
              Request Government Demo →
            </Link>
            <Link href="/enterprise" className="bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors">
              View Enterprise Plans
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">ISO 27001 data security · SOC 2 Type II in progress · GDPR compliant</p>
        </div>
      </main>
    </>
  );
}
