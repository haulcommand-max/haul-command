import { supabaseServer } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { categoryLabel, categoryIcon } from '@/lib/directory-helpers';

export const metadata: Metadata = {
  title: 'Search Results — Haul Command Directory',
  description: 'Search the global heavy haul directory for pilot cars, ports, truck stops, and more.',
};

export default async function DirectorySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  if (!query) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-white mb-4">Search Directory</h1>
          <p className="text-white/50">Enter a search term to find listings in the directory.</p>
        </main>
      </>
    );
  }

  const sb = supabaseServer();

  // Real operators from hc_public_operators
  const { data: results } = await sb
    .from('hc_public_operators')
    .select('id, name, city, state_code, country_code, entity_type, slug, claim_status')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,state_code.ilike.%${query}%,entity_type.ilike.%${query}%`)
    .limit(50);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">
          Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-white/50 mb-8">{results?.length ?? 0} listings found</p>

        {!results || results.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/40 mb-4">No listings matched your search.</p>
            <Link
              href="/directory"
              className="text-amber-400 hover:text-amber-300 text-sm font-bold"
            >
              ← Browse the full directory
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {results.map((r: any) => {
              const trustScore = r.claim_status === 'verified' ? 98 : r.claim_status === 'claimed' ? 85 : 45;
              const trustColor = trustScore > 90 ? 'text-green-400 border-green-400/30 bg-green-400/10' : trustScore > 80 ? 'text-accent border-accent/30 bg-accent/10' : 'text-gray-400 border-gray-600 bg-white/5';
              return (
              <li key={r.id}>
                <div
                  className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-amber-500/30 transition-all group"
                >
                  <Link href={r.slug ? `/directory/${r.country_code?.toLowerCase() ?? 'us'}/${r.slug}` : `/directory/${r.country_code?.toLowerCase() ?? 'us'}`} className="flex items-start gap-3 min-w-0 flex-grow">
                    <span className="text-2xl flex-shrink-0 mt-1">
                      {categoryIcon(r.entity_type ?? '')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors truncate">
                          {r.name}
                        </h3>
                        {r.claim_status === 'verified' && (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full" title="Verified Operator">
                              <span>🛡️</span> Verified
                          </span>
                        )}
                        {r.claim_status === 'claimed' && (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full" title="Claimed Operator">
                              <span>✅</span> Claimed
                          </span>
                        )}
                        <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${trustColor}`}>
                            <span>Trust Score:</span> <span>{trustScore}</span>
                        </div>
                      </div>
                      <p className="text-sm text-white/50 mt-0.5">
                        {r.city && `${r.city}, `}
                        {r.state_code ?? ''}
                        {r.country_code ? ` · ${r.country_code.toUpperCase()}` : ''}
                        {r.entity_type ? ` · ${categoryLabel(r.entity_type)}` : ''}
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 flex-shrink-0">
                      <Link
                          href={`/loads?request_provider=${r.id}&slug=${r.slug}`}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all text-center flex items-center justify-center gap-2"
                      >
                          <span>📤</span> Request 
                      </Link>
                      <Link
                          href={`/book/${r.slug}`}
                          className="px-4 py-2 bg-accent text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors text-center flex items-center justify-center gap-2"
                      >
                          <span>⚡</span> Book Now
                      </Link>
                  </div>
                </div>
              </li>
            )})}
          </ul>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/directory"
            className="text-accent text-sm font-bold hover:underline"
          >
            ← Back to Directory
          </Link>
        </div>
      </main>
    </>
  );
}
