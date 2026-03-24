import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Corridor Intelligence Hub — Heavy Haul Escort Routes | Haul Command',
  description: 'Browse heavy haul escort corridors across the US. Permit requirements, escort regulations, operator density, and real load data for 200+ key transport corridors.',
};

export default async function CorridorsPage() {
  const supabase = createClient();

  const { data: corridors } = await supabase
    .from('corridors')
    .select('id, origin_state, destination_state, origin_city, destination_city, load_count, operator_count, intel_generated_at')
    .order('load_count', { ascending: false })
    .limit(100);

  // Group by origin state
  const byState: Record<string, typeof corridors> = {};
  for (const c of corridors ?? []) {
    const key = c.origin_state ?? 'OTHER';
    if (!byState[key]) byState[key] = [];
    byState[key]!.push(c);
  }

  const topStates = Object.keys(byState).sort().slice(0, 20);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4 text-center border-b border-white/5">
        <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
          Route Intelligence
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Corridor Intelligence Hub
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          200+ US heavy haul escort corridors with permit requirements, operator availability,
          and real load activity data.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <a href="/route-check" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors text-sm">
            Use Route Check Tool
          </a>
          <a href="/loads/new" className="px-5 py-2.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors text-sm">
            Post a Load
          </a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {topStates.map(state => (
          <div key={state} className="mb-10">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              From {state}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(byState[state] ?? []).slice(0, 8).map(c => (
                <a
                  key={c.id}
                  href={`/corridors/${c.origin_state?.toLowerCase()}-${c.destination_state?.toLowerCase()}`}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/8 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                      {c.origin_state} → {c.destination_state}
                    </p>
                    {c.intel_generated_at && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" title="Intel available" />
                    )}
                  </div>
                  {(c.origin_city || c.destination_city) && (
                    <p className="text-xs text-gray-600 mb-2">
                      {c.origin_city} → {c.destination_city}
                    </p>
                  )}
                  <div className="flex gap-3 text-xs text-gray-600">
                    {c.load_count > 0 && <span>{c.load_count} loads</span>}
                    {c.operator_count > 0 && <span>{c.operator_count} escorts</span>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {!corridors?.length && (
          <div className="text-center py-16">
            <p className="text-gray-600">Corridor data loading. <a href="/route-check" className="text-amber-400 hover:underline">Use Route Check for instant answers.</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
