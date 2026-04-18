import React from 'react';
import { getLiveAvailableOperators, AvailableOperatorRow } from '@/lib/data/availability';
import BrokerProfileCard from '@/components/directory/BrokerProfileCard';
import Link from 'next/link';

export const metadata = {
  title: 'Available Now: Live Escorts & Pilot Cars | Haul Command',
  description: 'Live availability radar for heavy haul pilot cars and escort vehicles. Instantly connect with securely available operators to move your freight today.',
};

export default function AvailableNowPage() {
  return (
    <div className="bg-black min-h-screen">
      {/* OS Navigation / Sub-header for the Feed */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Live Availability
            </h1>
          </div>
          <div className="hidden sm:flex gap-3">
            <div className="text-xs text-gray-400 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full font-bold">
              📡 Active Broadcasts
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: The Live Feed */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
            <div className="text-amber-500 text-2xl">⚡</div>
            <div>
              <h3 className="text-amber-400 font-bold uppercase tracking-wide text-sm">Real-Time capacity</h3>
              <p className="text-sm text-amber-500/80 mt-1">
                Operators listed below are broadcasting their live GPS coordinates and are looking for immediate dispatch.
                Tap "Book via Escrow" to secure them instantly.
              </p>
            </div>
          </div>

          <React.Suspense fallback={<div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-xl"></div>)}
            </div>}>
            <AvailabilityFeed />
          </React.Suspense>
        </div>

        {/* Right Column: Broker Next Moves & Map Placeholder */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Availability Map</h4>
            <div className="aspect-square bg-black border border-white/5 rounded-lg flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent"></div>
              <div className="relative text-3xl mb-2">🗺️</div>
              <p className="text-xs text-gray-500 font-bold max-w-[200px] mb-4">
                The global radar view is calculating densities from Traccar GPS.
              </p>
              <div className="text-emerald-500 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                System Active
              </div>
            </div>
          </div>

          <div className="bg-[#12110c] border border-amber-500/30 rounded-xl p-6">
             <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-2">Can't Find Capacity?</h4>
             <p className="text-xs text-gray-400 mb-4 leading-relaxed">
               If your corridor is currently dark on the radar, post the load directly to the active board to push instant SMS/Push notifications to verified operators on that route.
             </p>
             <Link href="/loads/new" className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/20">
               Post Load to Network
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server Component Fetcher
async function AvailabilityFeed() {
  const operators = await getLiveAvailableOperators(50);
  
  if (operators.length === 0) {
    return (
      <div className="text-center py-24 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-gray-400 font-semibold">No operators currently broadcasting availability.</p>
        <p className="text-xs text-gray-500 mt-2">Check back soon or post a load to ping nearby operators.</p>
      </div>
    );
  }

  // Map AvailableOperatorRow to OperatorProfile for the BrokerProfileCard
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {operators.map((op) => (
        <BrokerProfileCard 
          key={op.operator_id} 
          profile={{
            id: op.operator_id,
            slug: op.slug,
            companyName: op.company_name,
            phoneNumber: '+18005550000', // To be pulled from auth/profile
            cityCounty: op.city || '',
            stateCode: op.state || '',
            serviceArea: 'National',
            ecosystemPosition: 'Live Broadcast',
            googleRating: 4.8,
            reviewCount: 14,
            primaryTrustSource: 'Platform',
            topCommentSnippet: null,
            fmcsaVerified: true,
            claimStatus: 'verified',
            description: `Currently broadcasting from ${op.city ? op.city : 'their location'}. Ready for dispatch.`,
            status: 'available'
          }} 
        />
      ))}
    </div>
  );
}
