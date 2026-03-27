import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:'Equipment Exchange — Buy & Sell Pilot Car Equipment |',
  description:
    'Verified peer-to-peer marketplace for pilot car equipment. Escort vehicles, height poles, light bars, and safety gear. Every seller is Haul Command verified.',
};

const CATEGORIES = [
  { icon: '🚗', name: 'Escort Vehicles', count: 847, avgPrice: '$28,500' },
  { icon: '📡', name: 'Height Poles', count: 423, avgPrice: '$1,200' },
  { icon: '💡', name: 'Light Bars & Strobes', count: 612, avgPrice: '$480' },
  { icon: '📻', name: 'Radio & Comms', count: 289, avgPrice: '$340' },
  { icon: '🛡️', name: 'Safety Equipment', count: 334, avgPrice: '$220' },
  { icon: '🔧', name: 'Parts & Accessories', count: 718, avgPrice: '$95' },
];

const MOCK_LISTINGS = [
  { title: '2019 Ford F-250 — Pilot Car Rigged', price: '$24,500', location: 'Houston, TX', badge: 'Verified Seller', tag: '🔥 Hot', img: '🚗' },
  { title: 'Arrow Board — 48"x96" LED', price: '$3,200', location: 'Atlanta, GA', badge: 'Verified Seller', tag: 'New', img: '🟡' },
  { title: '35ft Telescoping Height Pole Kit', price: '$1,850', location: 'Dallas, TX', badge: 'Verified Seller', tag: null, img: '📡' },
  { title: 'Whelen 4-Corner LED Strobe Kit', price: '$580', location: 'Phoenix, AZ', badge: 'Verified Seller', tag: 'Reduced', img: '💡' },
  { title: '2021 Chevrolet Silverado 2500 — Escort Config', price: '$31,000', location: 'Denver, CO', badge: 'Verified Seller', tag: '🔥 Hot', img: '🚗' },
  { title: 'CB Radio + Antenna + Mount Bundle', price: '$190', location: 'Nashville, TN', badge: 'Verified Seller', tag: null, img: '📻' },
];

export default function EquipmentExchangePage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Equipment Exchange</span>
        </nav>

        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Verified Sellers Only · 8% Commission</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
            The Only Marketplace<br />
            <span className="text-orange-400">Built for Pilot Car Ops</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Buy and sell escort vehicles, height poles, light bars, and safety gear with operators you
            already know. Every seller is Haul Command verified. No scams. No strangers. No Craigslist.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/exchange/list" className="bg-orange-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20">
              List Equipment →
            </Link>
            <Link href="/exchange/browse" className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors">
              Browse All Listings
            </Link>
          </div>
        </header>

        {/* Why This Exists */}
        <section className="mb-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter mb-3">Operators Trade Equipment via Facebook Posts. We Fix That.</h2>
              <p className="text-gray-400 text-sm mb-4">
                Right now, when an escort operator wants to sell their old truck or buy a height pole,
                they post in a Facebook group and hope for the best. No verification, no built-in payment
                protection, no trust layer.
              </p>
              <p className="text-gray-400 text-sm">
                Haul Command Exchange gives every transaction built-in trust — because every seller already
                has a verified profile, ratings, and transaction history on the platform.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { before: '📱 Random Facebook post', after: '✅ Verified platform listing', type: 'before_after' },
                { before: '🤞 Hope they\'re legit', after: '🔒 Verified seller profile', type: 'before_after' },
                { before: '💸 Venmo + pray', after: '🛡️ Platform escrow protection', type: 'before_after' },
                { before: '📊 No price intel', after: '📈 Market price benchmarks', type: 'before_after' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-red-400 flex-1">{item.before}</span>
                  <span className="text-gray-700">→</span>
                  <span className="text-green-400 flex-1 text-right">{item.after}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Browse by Category</h2>
          <p className="text-gray-500 text-sm mb-6">3,000+ listings from verified operators across 120 countries</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(c => (
              <Link
                key={c.name}
                href={`/exchange/browse?category=${c.name.toLowerCase().replace(/ /g, '-')}`}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center hover:border-orange-500/20 transition-all group"
              >
                <div className="text-3xl mb-2">{c.icon}</div>
                <div className="text-white text-xs font-bold group-hover:text-orange-400 transition-colors">{c.name}</div>
                <div className="text-accent text-[10px] font-bold mt-0.5">{c.count} listings</div>
                <div className="text-gray-600 text-[9px]">avg {c.avgPrice}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Listings Preview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-white tracking-tighter">Recent Listings</h2>
            <Link href="/exchange/browse" className="text-accent text-sm hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_LISTINGS.map((l, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-orange-500/20 transition-all group">
                <div className="h-32 bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center text-6xl">
                  {l.img}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm leading-tight">{l.title}</h3>
                    {l.tag && (
                      <span className="text-[9px] font-black bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">{l.tag}</span>
                    )}
                  </div>
                  <div className="text-accent font-black text-lg mb-2">{l.price}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500 text-xs">{l.location}</div>
                    <div className="text-green-400 text-[10px] font-bold">{l.badge} ✓</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seller Economics */}
        <section className="mb-12 bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/15 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-4">Economics for Everyone</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <div className="text-orange-400 font-bold text-sm mb-2">For Sellers</div>
              <ul className="space-y-2">
                {[
                  '8% commission on sale — only when it sells',
                  'Listing is free and unlimited',
                  'Payment protected by platform escrow',
                  'Your verified reputation makes buyers trust you',
                ].map(s => <li key={s} className="flex gap-2 text-xs text-gray-400"><span className="text-green-400">✓</span>{s}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-orange-400 font-bold text-sm mb-2">For Buyers</div>
              <ul className="space-y-2">
                {[
                  'Every seller is Haul Command verified',
                  'Earnings & performance history visible',
                  'Escrow holds payment until confirmed delivery',
                  'Market price benchmarks on every listing',
                ].map(s => <li key={s} className="flex gap-2 text-xs text-gray-400"><span className="text-green-400">✓</span>{s}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">List Your Equipment. Free.</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Post unlimited listings. We only take 8% when it sells. Price your gear with real market intellignece from 3,000+ comparable sales.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/exchange/list" className="bg-orange-500 text-white px-10 py-4 rounded-xl font-black text-base hover:bg-orange-400 transition-colors">
              List Now — Free →
            </Link>
            <Link href="/exchange/browse" className="bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors">
              Browse Listings
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
