import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { REGULATIONS } from '@/lib/regulations/global-regulations-db';

export const metadata: Metadata = {
  title: 'Oversize Load Regulations by Country | Haul Command',
  description: 'Oversize and overweight load regulations for 120 countries. Permit requirements, escort rules, max dimensions, and DOT authority contacts for heavy haul transport worldwide.',
};

export default async function RegulationsPage() {
  const supabase = createClient();

  // Fetch extended analysis pages
  const { data: dbPages } = await supabase
    .from('regulation_pages')
    .select('jurisdiction, country_code, generated_at')
    .not('content', 'is', null)
    .order('jurisdiction');

  // Create a map for fast lookup of generated dates
  const generatedMap = new Map(
    dbPages?.map(p => [p.jurisdiction.toLowerCase(), p.generated_at]) || []
  );

  // Combine static DB with any additional DB pages (some states/provinces might be in DB but not static)
  const allJurisdictions = new Set([
    ...REGULATIONS.map(r => r.countryName),
    ...(dbPages?.map(p => p.jurisdiction) || [])
  ]);

  const sortedPages = Array.from(allJurisdictions).sort().map(name => {
    return {
      name,
      slug: encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-')),
      generated_at: generatedMap.get(name.toLowerCase())
    };
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4 text-center border-b border-white/5">
        <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
          120 countries
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Oversize Load Regulations
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Permit requirements, escort rules, and DOT authority contacts for heavy haul transport
          across 120 countries. Updated regularly with live data.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {sortedPages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sortedPages.map(page => (
              <a
                key={page.slug}
                href={`/regulations/${page.slug}`}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/8 transition-all group relative overflow-hidden"
              >
                <p className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                  {page.name}
                </p>
                {page.generated_at ? (
                  <p className="text-xs text-green-400/80 mt-1">
                    ✓ Detailed Analysis
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Fast Facts Available
                  </p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Regulation pages are being generated.</p>
            <a href="/route-check" className="text-amber-400 hover:underline">
              Use Route Check for instant answers →
            </a>
          </div>
        )}

        <div className="mt-12 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
          <p className="font-bold text-white mb-2">Need a specific answer right now?</p>
          <p className="text-sm text-gray-400 mb-4">Ask the free Route Check tool. Live AI answers, no login required.</p>
          <a href="/route-check" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors">
            Go to Route Check →
          </a>
        </div>
      </div>
    </div>
  );
}
