import React from 'react';

// Extracted from Supabase Plan: 20260220_directory_elite_and_store.sql
// Renders the paid/premium directory storefront for Elite tier operators.

export default function DirectoryEliteStore() {
  return (
    <div className="bg-hc-gray-900 min-h-screen pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Haul Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-yellow-400 to-yellow-600">Elite Providers</span>
          </h1>
          <p className="text-xl text-hc-gray-400 max-w-2xl mx-auto">
            Direct access to the top 1% of heavy haul fleets and pilot car operators. 
            All elite providers maintain a 98+ Trust Score and zero compliance violations.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Mock Elite Store Cards */}
          <div className="bg-black border border-hc-yellow-400/50 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-hc-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">ELITE SPONSOR</div>
            <h3 className="text-xl font-bold text-white mb-1 mt-2">Texas Premiere Escorts</h3>
            <p className="text-sm text-hc-gray-400 mb-4">Based in Houston, TX</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-hc-gray-500">Trust Rank</span>
                <span className="text-green-400 font-bold">99.8 / 100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-hc-gray-500">Fleet Size</span>
                <span className="text-white font-medium">12 Vehicles</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-hc-gray-500">Capabilities</span>
                <span className="text-white font-medium">High-Pole, TWIC</span>
              </div>
            </div>

            <button className="w-full bg-hc-gray-800 hover:bg-hc-gray-700 text-hc-yellow-400 border border-hc-gray-700 font-bold py-3 rounded transition-colors">
              View Verified Profile
            </button>
          </div>
          {/* Repeated for other sponsors... */}
        </div>
      </div>
    </div>
  );
}
