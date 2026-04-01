import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Oversize Load Regulations by Country | Haul Command',
  description: 'Oversize and overweight load regulations for 120 countries. Permit requirements, escort rules, max dimensions, and DOT authority contacts for heavy haul transport worldwide.',
};

export const dynamic = 'force-dynamic';

export default async function RegulationsPage() {
  const supabase = createClient();

  const { data: pages } = await supabase
    .from('regulation_pages')
    .select('jurisdiction, country_code, generated_at')
    .not('content', 'is', null)
    .order('jurisdiction');

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
        {pages?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pages.map(page => (
              <a
                key={page.jurisdiction}
                href={`/regulations/${encodeURIComponent(page.jurisdiction.toLowerCase().replace(/\s+/g, '-'))}`}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/8 transition-all group"
              >
                <p className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                  {page.jurisdiction}
                </p>
                {page.generated_at && (
                  <p className="text-xs text-gray-700 mt-1">
                    Updated {new Date(page.generated_at).toLocaleDateString()}
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
