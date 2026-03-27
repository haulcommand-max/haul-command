import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import HotelFinderClient from './HotelFinderClient';

export const metadata: Metadata = {
  title:'Trucker Hotel & Truck Stop Finder — Pilot Car Rates + Amenities by State |',
  description:
    'Find truck-friendly hotels with pilot car discounts and truck stops with showers, scales, and WiFi near major interstates. 140+ verified locations across 20+ states.',
  openGraph: {
    title:'Trucker Hotel & Truck Stop Finder |',
    description: 'Discounted hotel rates for pilot car operators and a comprehensive truck stop directory with parking, showers, and scales.',
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
            Lodging & <span className="text-accent">Truck Stop</span> Finder
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Hotels with pilot car rates, truck stops with showers and scales — all searchable by state, city, or interstate.
            Stop paying rack rate. Stop guessing amenities.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              140+ verified locations
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Hotels + Truck Stops
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
