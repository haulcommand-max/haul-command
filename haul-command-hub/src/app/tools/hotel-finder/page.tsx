import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import HotelFinderClient from './HotelFinderClient';

export const metadata: Metadata = {
  title: 'Trucker & Pilot Car Hotel Finder — Discounted Rates by State | Haul Command',
  description:
    'Find truck-friendly hotels with pilot car discounts, free parking, and truck parking near major interstates. Search by state, city, or highway. 45+ verified locations across 20+ states.',
  openGraph: {
    title: 'Trucker & Pilot Car Hotel Finder | Haul Command',
    description: 'Discounted hotel rates for pilot car operators and heavy haul truckers. Free parking, pet friendly, near major corridors.',
  },
};

export default function HotelFinderPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Hotel Finder</span>
        </nav>

        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="text-accent text-xs font-bold">FREE · NO ACCOUNT REQUIRED</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            Trucker & Pilot Car <span className="text-accent">Hotel Finder</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Verified hotels with special pilot car rates, truck parking, and convoy-friendly amenities.
            Search by state, city, or interstate — and stop paying rack rate.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              45+ verified hotels
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              20+ states covered
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Pilot car discounts
            </div>
          </div>
        </header>

        <HotelFinderClient />

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-black text-xl tracking-tighter mb-1">
              Own a hotel near a <span className="text-accent">major corridor</span>?
            </h3>
            <p className="text-gray-400 text-sm">
              List your property and reach thousands of pilot car operators and heavy haul drivers every month.
            </p>
          </div>
          <Link
            href="/pricing"
            className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors flex-shrink-0"
          >
            Get Listed →
          </Link>
        </div>
      </main>
    </>
  );
}
