import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elite Providers — Top 1% Verified Operators | Haul Command',
  description: 'Direct access to the top 1% of heavy haul fleets and pilot car operators. All elite providers maintain a 98+ Trust Score and zero compliance violations.',
  alternates: { canonical: 'https://www.haulcommand.com/directory/elite' },
};

export const revalidate = 3600;

interface EliteOperator {
  id: string;
  company_name: string;
  city: string;
  state: string;
  slug: string;
  trust_score: number;
  fleet_size: number;
  capabilities: string[];
  is_sponsor: boolean;
  tier: string;
}

export default async function DirectoryEliteStore() {
  const supabase = await createClient();

  // Query operators with elite/sponsor status, ordered by trust score
  const { data: operators } = await supabase
    .from('directory_listings')
    .select('id, company_name, city, state, slug, trust_score, fleet_size, capabilities, is_sponsor, tier')
    .or('tier.eq.elite,is_sponsor.eq.true')
    .order('trust_score', { ascending: false })
    .limit(24);

  const eliteOperators: EliteOperator[] = (operators || []) as EliteOperator[];

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

        {eliteOperators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-hc-gray-500 text-lg mb-4">Elite provider applications are now open.</p>
            <Link
              href="/upgrade"
              className="inline-block bg-hc-yellow-400 hover:bg-yellow-500 text-black font-extrabold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-yellow-400/20"
            >
              Apply for Elite Status →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eliteOperators.map((op) => (
              <div
                key={op.id}
                className="bg-black border border-hc-yellow-400/50 rounded-xl p-6 shadow-2xl relative overflow-hidden hover:border-hc-yellow-400 transition-colors"
              >
                {op.is_sponsor && (
                  <div className="absolute top-0 right-0 bg-hc-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                    ELITE SPONSOR
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1 mt-2">{op.company_name}</h3>
                <p className="text-sm text-hc-gray-400 mb-4">
                  {op.city && op.state ? `Based in ${op.city}, ${op.state}` : 'Nationwide'}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-hc-gray-500">Trust Rank</span>
                    <span className="text-green-400 font-bold">
                      {op.trust_score ? `${op.trust_score.toFixed(1)} / 100` : '—'}
                    </span>
                  </div>
                  {op.fleet_size > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-hc-gray-500">Fleet Size</span>
                      <span className="text-white font-medium">{op.fleet_size} Vehicles</span>
                    </div>
                  )}
                  {op.capabilities && op.capabilities.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-hc-gray-500">Capabilities</span>
                      <span className="text-white font-medium text-right max-w-[180px] truncate">
                        {op.capabilities.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/directory/profile/${op.slug || op.id}`}
                  className="block w-full text-center bg-hc-gray-800 hover:bg-hc-gray-700 text-hc-yellow-400 border border-hc-gray-700 font-bold py-3 rounded transition-colors"
                >
                  View Verified Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
