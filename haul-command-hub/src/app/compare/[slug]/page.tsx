import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

const VS_COMPARISONS = [
  { slug: 'pilot-car-loads', competitor: 'Pilot Car Loads', strengths: ['57-country global coverage vs US-only', 'ELD-verified operator profiles', 'Rate intelligence with real market data', 'Corridor sponsorship & premium placements', 'AI-powered load matching (coming)', 'Full escrow & QuickPay payment system'] },
  { slug: 'truckstop-heavy-haul', competitor: 'Truckstop Heavy Haul', strengths: ['Niche focus on oversize/heavy haul only', 'Real-time ELD tracking via Motive integration', 'Escort-specific compliance data per state', 'Free operator listings with verified upgrades', 'Heavy haul corridor intelligence', 'Purpose-built for pilot car operators'] },
  { slug: 'oversize-io', competitor: 'Oversize.io', strengths: ['Larger operator directory (7,300+ operators)', 'Multi-country coverage (57 countries)', 'Integrated payment & escrow system', 'Programmatic advertising platform', 'Developer API for third-party integration', 'Live vehicle tracking via ELD'] },
  { slug: 'heavy-haul-load-board', competitor: 'Heavy Haul Load Boards', strengths: ['Dedicated to oversize & escort matching', 'Not a general freight board — no LTL noise', 'Escort requirement data per jurisdiction', 'Rate intelligence from verified market data', 'Operator safety scores from ELD data', 'Corridor-level market analytics'] },
];

export async function generateStaticParams() {
  return VS_COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comp = VS_COMPARISONS.find((c) => c.slug === slug);
  const name = comp?.competitor || slug;
  return {
    title: `Haul Command vs ${name} — Heavy Haul Platform Comparison`,
    description: `Compare Haul Command with ${name}. See why operators choose HC for oversize load coverage, escort matching, and corridor intelligence across 57 countries.`,
  };
}

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comp = VS_COMPARISONS.find((c) => c.slug === slug) || { competitor: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), strengths: [] };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/compare" className="hover:text-accent">Compare</Link>
          <span className="mx-2">›</span>
          <span className="text-white">vs {comp.competitor}</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
          Haul Command <span className="text-accent">vs</span> {comp.competitor}
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl">
          See how Haul Command compares for heavy haul and oversize load operations. We built HC specifically for the escort and pilot car industry.
        </p>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 py-3 pr-4 font-medium">Feature</th>
                <th className="text-center text-accent py-3 px-4 font-bold">Haul Command</th>
                <th className="text-center text-gray-500 py-3 pl-4 font-medium">{comp.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Global coverage (57 countries)', true, false],
                ['ELD-verified operator profiles', true, false],
                ['Real-time vehicle tracking', true, false],
                ['Escort requirement database', true, false],
                ['Rate intelligence', true, false],
                ['Corridor analytics', true, false],
                ['Escrow payments', true, false],
                ['QuickPay factoring', true, false],
                ['Developer API', true, false],
                ['Free operator listing', true, true],
                ['Advertising platform', true, false],
                ['Safety score leaderboard', true, false],
              ].map(([feature, hc, them]) => (
                <tr key={feature as string} className="border-b border-white/5">
                  <td className="text-white py-3 pr-4">{feature as string}</td>
                  <td className="text-center py-3 px-4">{hc ? <span className="text-green-400 font-bold">✓</span> : <span className="text-gray-600">✗</span>}</td>
                  <td className="text-center py-3 pl-4">{them ? <span className="text-gray-400">✓</span> : <span className="text-gray-600">✗</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why HC */}
        {comp.strengths.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Why operators choose Haul Command</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comp.strengths.map((s, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex items-start gap-3">
                  <span className="text-accent text-lg mt-0.5">✦</span>
                  <p className="text-gray-300 text-sm">{s}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to switch?</h2>
          <p className="text-gray-400 text-sm mb-6">Join 7,300+ operators already on Haul Command. Free to list, paid to dominate.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/claim" className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
              Claim Your Listing — Free
            </Link>
            <Link href="/pricing" className="border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/5 transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
