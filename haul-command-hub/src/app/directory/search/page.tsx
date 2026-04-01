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

  // Real operators from hc_global_operators
  const { data: results } = await sb
    .from('hc_global_operators')
    .select('id, name, city, admin1_code, country_code, entity_type, slug')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,admin1_code.ilike.%${query}%,entity_type.ilike.%${query}%`)
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
            {results.map((r: any) => (
              <li key={r.id}>
                <Link
                  href={r.slug ? `/directory/${r.country_code?.toLowerCase() ?? 'us'}/${r.slug}` : `/directory/${r.country_code?.toLowerCase() ?? 'us'}`}
                  className="block bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-amber-500/30 hover:bg-amber-500/[0.03] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {categoryIcon(r.entity_type ?? '')}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                        {r.name}
                      </p>
                      <p className="text-sm text-white/50 mt-0.5">
                        {r.city && `${r.city}, `}
                        {r.admin1_code ?? ''}
                        {r.country_code ? ` · ${r.country_code.toUpperCase()}` : ''}
                        {r.entity_type ? ` · ${categoryLabel(r.entity_type)}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
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
