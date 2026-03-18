import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import HCMarketMaturityBanner from '@/components/hc/MarketMaturityBanner';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Heavy Haul Corridor Index — Route Intelligence',
  description:
    'Browse heavy haul corridors across North America. Corridor intelligence includes operator availability, rate trends, escort requirements, and route health indicators.',
};

interface Corridor {
  id: string;
  name: string;
  corridor_type: string;
}

export default async function CorridorsPage() {
  const sb = supabaseServer();
  const { data: corridors } = await sb
    .from('corridors')
    .select('id, name, corridor_type')
    .order('name', { ascending: true })
    .limit(100);

  const allCorridors: Corridor[] = corridors ?? [];
  const byType = new Map<string, Corridor[]>();
  
  for (const c of allCorridors) {
    const type = c.corridor_type || 'other';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(c);
  }

  const typeLabels: Record<string, string> = {
    interstate: 'Interstate Corridors',
    cross_border: 'Cross-Border Corridors',
    port_to_inland: 'Port-to-Inland Corridors',
    energy_utility: 'Energy & Utility Corridors',
    resource_extraction: 'Resource Extraction Corridors',
    provincial_highway: 'Provincial Highway Corridors',
    other: 'Other Corridors',
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Corridors</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Corridor <span className="text-accent">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Heavy haul corridors are the arteries of the oversize transport economy.
            Browse corridors to find operators, track rates, and understand escort requirements for every route.
          </p>
        </header>

        {allCorridors.length > 0 ? (
          <div className="space-y-10">
            {Array.from(byType.entries()).map(([type, corrs]) => (
              <section key={type}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  {typeLabels[type] || type.replace(/_/g, ' ')}
                  <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded font-mono">
                    {corrs.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {corrs.map((c) => (
                    <Link
                      key={c.id}
                      href={`/corridor/${c.name.toLowerCase().replace(/\s+/g, '-')}/overview`}
                      className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
                    >
                      <div className="text-white font-bold text-sm group-hover:text-accent transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {c.corridor_type.replace(/_/g, ' ')}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <HCMarketMaturityBanner
              state="data_only"
              countryName="Corridor Intelligence"
              message="Corridor data is being compiled. Check back soon for route intelligence."
            />
            <div className="mt-8 space-y-4">
              <p className="text-gray-400">
                In the meantime, explore escort requirements and operators by state.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/escort-requirements" className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
                  View Requirements
                </Link>
                <Link href="/directory" className="bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                  Browse Directory
                </Link>
                <Link href="/claim" className="bg-white/5 text-gray-300 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/10 transition-colors">
                  Claim Listing
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12">
          <HCFaqModule
            items={[
              { question: 'What is a heavy haul corridor?', answer: 'A corridor is a commonly traveled route for oversize and heavy haul transport. Corridors have specific escort requirements, rate patterns, and operator availability that differ from standard freight routes.' },
              { question: 'How are corridor rankings determined?', answer: 'Corridors are ranked based on activity volume, operator availability, rate data quality, and claim density. Rankings are refreshed regularly and methodology details are available on each corridor page.' },
              { question: 'Can I sponsor a corridor?', answer: 'Corridor sponsorships are available for verified operators who regularly service a route. Contact us for details on priority placement and corridor visibility.' },
            ]}
          />
        </div>

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
