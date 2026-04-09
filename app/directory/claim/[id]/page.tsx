import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Wire claim flow to Supabase — replaces mock data with real unclaimed listing query.

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClaimDirectoryProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the unclaimed listing from the directory
  const { data: listing, error } = await supabase
    .from('directory_listings')
    .select('id, company_name, city, state, country, status, slug')
    .eq('id', id)
    .single();

  // If not found or already claimed, 404
  if (error || !listing || listing.status === 'claimed') {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-hc-gray-900 text-hc-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-black border border-hc-gray-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-white">Claim Your Profile</h1>
        <p className="text-hc-gray-400 mb-8">
          Verify your identity to take control of the <span className="font-bold text-hc-yellow-400">{listing.company_name}</span> listing
          {listing.city && listing.state ? ` in ${listing.city}, ${listing.state}` : ''} in the Haul Command authority directory.
        </p>

        <form className="space-y-6" action="/api/directory/claim" method="POST">
          <input type="hidden" name="directoryId" value={listing.id} />
          
          <div>
            <label className="block text-xs uppercase text-hc-gray-500 font-bold tracking-widest mb-2">Claimant Name / Title</label>
            <input type="text" name="claimantName" required className="w-full bg-hc-gray-900 border border-hc-gray-700 rounded p-3 focus:border-hc-yellow-400 outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase text-hc-gray-500 font-bold tracking-widest mb-2">Official Company Email</label>
            <input type="email" name="workEmail" required className="w-full bg-hc-gray-900 border border-hc-gray-700 rounded p-3 focus:border-hc-yellow-400 outline-none transition-colors" />
            <p className="text-[10px] text-hc-gray-500 mt-2">Must match the domain registered on the FMCSA / State business registry.</p>
          </div>

          <div>
            <label className="block text-xs uppercase text-hc-gray-500 font-bold tracking-widest mb-2">DOT / ABN Number</label>
            <input type="text" name="taxId" required className="w-full bg-hc-gray-900 border border-hc-gray-700 rounded p-3 focus:border-hc-yellow-400 outline-none transition-colors" />
          </div>

          <div className="pt-4 border-t border-hc-gray-800">
            <button type="submit" className="w-full bg-hc-yellow-400 hover:bg-yellow-500 text-black font-extrabold py-4 rounded transition-all shadow-lg hover:shadow-yellow-400/20">
              Submit Claim Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
