import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

// Extracted from Supabase Plan: 20260220_directory_elite_and_store.sql
// Renders the paid/premium directory storefront for Elite tier operators.

export const metadata: Metadata = {
  title: 'Verified Profile Upgrades | Haul Command',
  description: 'Upgrade a Haul Command directory profile with better proof, service-area detail, media, and sponsor visibility without inventing rank, reviews, or verification.',
  alternates: {
    canonical: 'https://www.haulcommand.com/directory/elite',
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function DirectoryEliteStore() {
  return (
    <div className="bg-hc-gray-900  pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Haul Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-yellow-400 to-yellow-600">Profile Upgrades</span>
          </h1>
          <p className="text-xl text-hc-gray-400 max-w-2xl mx-auto">
            Paid profile upgrades can improve proof presentation, service-area detail, media, and sponsor visibility.
            Haul Command does not sell fake rank, fake verification, fake reviews, or invented market scarcity.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-black border border-hc-yellow-400/50 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-hc-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">PROFILE PROOF</div>
            <h3 className="text-xl font-bold text-white mb-1 mt-2">Verified proof review</h3>
            <p className="text-sm text-hc-gray-400 mb-4">For claimed providers with real documents, equipment, media, and service-area updates.</p>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-hc-gray-500">Trust display</span>
                <span className="text-green-400 font-bold">Evidence-backed</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-hc-gray-500">Public fields</span>
                <span className="text-white font-medium">Owner reviewed</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-hc-gray-500">Capabilities</span>
                <span className="text-white font-medium">Only if supplied</span>
              </div>
            </div>

            <Link href="/claim?intent=profile-upgrade&source=directory-elite" className="block w-full bg-hc-gray-800 hover:bg-hc-gray-700 text-hc-yellow-400 border border-hc-gray-700 font-bold py-3 rounded transition-colors text-center">
              Start profile upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
