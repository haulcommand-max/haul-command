import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { slug } = await params;
  const [origin, destination] = slug.split('-');
  const { data: corridor } = await supabase
    .from('corridors')
    .select('origin_state, destination_state, load_count, operator_count, intel_content')
    .eq('origin_state', origin?.toUpperCase())
    .eq('destination_state', destination?.toUpperCase())
    .single();

  if (!corridor) return { title: 'Corridor Intel — Haul Command' };

  return {
    title: `${corridor.origin_state} to ${corridor.destination_state} Escort Corridor Intel | Haul Command`,
    description: `Heavy haul escort intelligence for the ${corridor.origin_state}→${corridor.destination_state} corridor. Permit requirements, escort regulations, operator density, and real traffic data.`,
  };
}

export default async function CorridorIntelPage({ params }: Props) {
  const supabase = createClient();
  const { slug } = await params;
  const [origin, destination] = slug.split('-');

  if (!origin || !destination) notFound();

  const { data: corridor } = await supabase
    .from('corridors')
    .select('*, intel_content, intel_generated_at')
    .eq('origin_state', origin.toUpperCase())
    .eq('destination_state', destination.toUpperCase())
    .single();

  if (!corridor) notFound();

  // Nearby operators
  const { data: operators } = await supabase
    .from('listings')
    .select('id, full_name, state, city, rating, review_count, claimed, services')
    .or(`state.eq.${origin.toUpperCase()},state.eq.${destination.toUpperCase()}`)
    .eq('active', true)
    .order('rating', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <section className="py-12 px-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <a href="/corridors" className="text-xs text-gray-600 hover:text-amber-400">Corridors</a>
            <span className="text-gray-800">/</span>
            <span className="text-xs text-gray-400">{corridor.origin_state} → {corridor.destination_state}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {corridor.origin_state} → {corridor.destination_state} Escort Corridor
          </h1>
          <p className="text-gray-400">
            Heavy haul escort intelligence, permit requirements, and operator availability
          </p>
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="text-amber-400 font-bold">{corridor.load_count ?? 0}</span>
              <span className="text-gray-600 ml-1">loads posted</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold">{corridor.operator_count ?? 0}</span>
              <span className="text-gray-600 ml-1">active escorts</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main intel */}
          <div className="md:col-span-2">
            {corridor.intel_content ? (
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-p:text-gray-400 prose-p:leading-relaxed
                prose-strong:text-white prose-a:text-amber-400">
                <div dangerouslySetInnerHTML={{ __html:
                  corridor.intel_content
                    .replace(/^## /gm, '<h2>')
                    .replace(/\n/g, '</h2>\n')
                    .replace(/###/g, '<h3>')
                    || corridor.intel_content
                }} />
              </div>
            ) : (
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                <p className="text-gray-400">Corridor intel is being generated. Check back soon.</p>
                <a href="/route-check" className="text-amber-400 text-sm hover:underline mt-2 inline-block">
                  Use Route Check for instant answers →
                </a>
              </div>
            )}

            {/* Route Check CTA */}
            <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="font-bold text-white mb-1">Have a specific question about this corridor?</p>
              <p className="text-sm text-gray-400 mb-3">Use the free Route Check tool for instant AI answers on permits, escorts, and curfews.</p>
              <a
                href={`/route-check?q=${encodeURIComponent(`Oversize load regulations from ${corridor.origin_state} to ${corridor.destination_state}`)}&state=${origin.toUpperCase()}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl inline-block transition-colors"
              >
                Check This Corridor →
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Find operators */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm mb-3">Escort Operators on This Corridor</h2>
              {operators?.length ? (
                <div className="space-y-2">
                  {operators.map(op => (
                    <a
                      key={op.id}
                      href={`/directory/${op.id}`}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium text-white">{op.full_name}</p>
                        <p className="text-xs text-gray-600">{op.city}, {op.state}</p>
                      </div>
                      {op.rating && (
                        <span className="text-xs text-amber-400">★ {op.rating}</span>
                      )}
                    </a>
                  ))}
                  <a
                    href={`/directory?state=${origin.toUpperCase()}`}
                    className="block text-center text-xs text-amber-400 hover:underline mt-2"
                  >
                    View all {corridor.origin_state} operators →
                  </a>
                </div>
              ) : (
                <a href="/directory" className="text-xs text-amber-400 hover:underline">
                  Browse escort operator directory →
                </a>
              )}
            </div>

            {/* Post a load */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm mb-2">Need an Escort on This Corridor?</h2>
              <p className="text-xs text-gray-500 mb-3">Post a load and get responses from verified operators in minutes.</p>
              <a
                href="/loads/new"
                className="w-full block text-center py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors"
              >
                Post a Load
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
