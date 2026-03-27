import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertise on Haul Command — Reach the Heavy Haul Industry',
  description: 'Self-serve advertising for equipment OEMs, fleet suppliers, insurance providers, and permit services. Reach 7,335+ operators and 50k+ monthly searches across 120 countries.',
};

/* ══════════════════════════════════════════════════════
   ADVERTISE LANDING PAGE — /advertise
   Converts advertisers into self-serve campaign buyers
   ══════════════════════════════════════════════════════ */

const STATS = [
  { value: '7,335+', label: 'Operators Tracked' },
  { value: '50k+', label: 'Monthly Searches' },
  { value: '120', label: 'Countries' },
  { value: '$4.20', label: 'Avg. CPM' },
];

const AD_FORMATS = [
  {
    icon: '🏢',
    name: 'Sponsored Listing',
    price: 'From $25/day',
    desc: 'Boost your operator listing to the top of search results. Appear first when brokers search for escort services.',
    features: ['Priority placement in directory', 'Gold verified badge', 'Click-to-call prominence'],
  },
  {
    icon: '🖼️',
    name: 'Banner Ad',
    price: 'From $25/day',
    desc: 'Display your brand across directory, load board, and corridor pages. Multiple sizes and positions available.',
    features: ['Header, sidebar, and inline placements', 'Responsive design', 'Click tracking'],
  },
  {
    icon: '🛤️',
    name: 'Corridor Sponsor',
    price: 'From $50/day',
    desc: 'Exclusive sponsorship of a corridor page. Your brand front and center for all corridor traffic.',
    features: ['Exclusive single-sponsor placement', 'Brand logo on corridor map', 'Rate intelligence integration'],
  },
  {
    icon: '📊',
    name: 'Data Sponsor',
    price: 'From $100/day',
    desc: 'Sponsor rate intelligence, requirements, or analytics pages. Reach decision-makers researching compliance.',
    features: ['Sponsor badge on data pages', 'Thought leadership positioning', 'Lead capture integration'],
  },
];

const AUDIENCE_SEGMENTS = [
  { emoji: '🚛', name: 'Pilot Car Operators', count: '7,335+', desc: 'Independent escort vehicle operators across all US states and 120 countries' },
  { emoji: '📋', name: 'Freight Brokers', count: '2,500+', desc: 'Brokers sourcing pilot car and escort services for oversize loads' },
  { emoji: '🏗️', name: 'Project Managers', count: '1,200+', desc: 'Construction and energy project managers moving heavy equipment' },
  { emoji: '📦', name: 'Logistics Teams', count: '800+', desc: 'Corporate logistics teams managing specialized transport' },
];

export default function AdvertisePage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 sm:py-16 overflow-x-hidden">
        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            AdGrid Self-Serve
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Reach the Heavy Haul<br />
            <span className="text-accent">Industry</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Put your brand in front of pilot car operators, freight brokers, and logistics teams 
            across the largest oversize load network in the world.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/advertise/create"
              className="bg-accent text-black px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
            >
              Create Your Campaign →
            </Link>
            <Link
              href="/advertise/dashboard"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-accent font-black text-2xl ag-tick">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ad Formats */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 text-center">Ad Formats</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Choose the format that matches your goals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ag-stagger">
            {AD_FORMATS.map(ad => (
              <div key={ad.name} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 ag-card-hover ag-slide-up">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{ad.icon}</span>
                  <div>
                    <h3 className="text-white font-bold text-base">{ad.name}</h3>
                    <span className="text-accent text-xs font-bold">{ad.price}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{ad.desc}</p>
                <ul className="space-y-1.5">
                  {ad.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Audience */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 text-center">Who You&apos;ll Reach</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Targeted access to every segment of the heavy haul industry</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUDIENCE_SEGMENTS.map(seg => (
              <div key={seg.name} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex items-start gap-4">
                <span className="text-3xl">{seg.emoji}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm">{seg.name}</h3>
                    <span className="text-accent text-[10px] font-bold">{seg.count}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{seg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-2xl sm:text-3xl mb-3">Ready to Grow?</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Create your first campaign in under 2 minutes. No minimum spend. Pay only for the visibility you want.
          </p>
          <Link
            href="/advertise/create"
            className="inline-flex bg-accent text-black px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
          >
            Create Campaign — Starting at $25/day →
          </Link>
        </div>
      </main>
    </>
  );
}
