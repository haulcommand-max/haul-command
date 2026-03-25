import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

const VS_COMPARISONS = [
  { slug: 'pilot-car-loads', competitor: 'Pilot Car Loads', strengths: ['57-country global coverage vs US-only', 'ELD-verified operator profiles', 'Rate intelligence with real market data', 'Corridor sponsorship & premium placements', 'AI-powered load matching (coming)', 'Full escrow & QuickPay payment system'] },
  { slug: 'truckstop-heavy-haul', competitor: 'Truckstop Heavy Haul', strengths: ['Niche focus on oversize/heavy haul only', 'Real-time ELD tracking via Motive integration', 'Escort-specific compliance data per state', 'Free operator listings with verified upgrades', 'Heavy haul corridor intelligence', 'Purpose-built for pilot car operators'] },
  { slug: 'oversize-io', competitor: 'Oversize.io', strengths: ['Larger operator directory (7,300+ operators)', 'Multi-country coverage (57 countries)', 'Integrated payment & escrow system', 'Programmatic advertising platform', 'Developer API for third-party integration', 'Live vehicle tracking via ELD'] },
  { slug: 'heavy-haul-load-board', competitor: 'Heavy Haul Load Boards', strengths: ['Dedicated to oversize & escort matching', 'Not a general freight board — no LTL noise', 'Escort requirement data per jurisdiction', 'Rate intelligence from verified market data', 'Operator safety scores from ELD data', 'Corridor-level market analytics'] },
  { slug: 'landstar', competitor: 'Landstar System', strengths: ['Purpose-built for escort & pilot car ops', 'No agent middleman — direct operator connection', 'Hyperlocal corridor intel vs national generalist', 'Escort-specific rate data vs general freight rates', 'Free basic listing vs agent-only model', 'Real-time escort requirement compliance data'] },
  { slug: 'bennett-motor-express', competitor: 'Bennett Motor Express', strengths: ['Independent operator marketplace vs single-carrier', 'Multi-carrier rate comparison in real time', '57-country coverage vs US-only fleet', 'Operator-owned profiles with direct contact', 'No exclusive contracts required', 'Transparent pricing with no hidden dispatch fees'] },
  { slug: 'barnhart-crane', competitor: 'Barnhart Crane & Rigging', strengths: ['Marketplace connecting all escort providers', 'Not limited to one company\'s fleet coverage', 'Rate transparency across multiple operators', 'Lighter loads AND superloads covered', 'Escort booking without crane package required', 'Broader geographic coverage for escort-only jobs'] },
  { slug: 'berger-transfer', competitor: 'Berger Transfer & Storage', strengths: ['Open marketplace vs proprietary carrier network', 'Escort-specific tools (not bundled with warehousing)', 'Real-time availability from independent operators', 'Rate comparison across competing providers', 'No minimum volume requirements', 'Dedicated pilot car & escort vehicle matching'] },
  { slug: 'daseke', competitor: 'Daseke Inc.', strengths: ['Independent operator access vs subsidiary fleet only', 'Transparent per-mile escort rates', 'No corporate overhead passed to shippers', 'Direct operator communication', 'Flexible one-time or standing order booking', 'Escort requirement compliance data per state'] },
  { slug: 'escort-dispatch', competitor: 'Escort Dispatch Services', strengths: ['Self-service booking vs phone-only dispatch', 'Real-time operator availability dashboard', 'Transparent rate comparison across operators', 'Multi-state compliance data built in', 'Digital payment & escrow vs check/COD only', 'Corridor intelligence for route planning'] },
  { slug: 'escort-online', competitor: 'EscortOnline.com', strengths: ['Verified operator profiles with safety scores', 'Rate intelligence with market-rate benchmarks', 'Integrated payment processing & QuickPay', 'Multi-country coverage (57 countries vs US-only)', 'Real-time ELD tracking integration', 'Escort requirement database per jurisdiction'] },
  { slug: 'pilot-car-registry', competitor: 'PilotCarRegistry.com', strengths: ['Active marketplace vs static directory listing', 'ELD-verified real-time availability', 'Integrated booking & payment system', 'Rate intelligence with market context', 'Corridor analytics & demand forecasting', 'Multi-country coverage vs US-only registry'] },
  { slug: 'wide-load-magazine', competitor: 'Wide Load Magazine', strengths: ['Interactive tools vs static editorial content', 'Real-time operator directory with booking', 'Rate calculator with live market data', 'Escort requirement database (not just articles)', 'Operator profiles with direct messaging', 'Revenue-generating platform vs ad-supported magazine'] },
  { slug: 'truck-permits', competitor: 'Truck Permits / Permit Services', strengths: ['Escort + permit combined workflow', 'Automated dimension-based escort requirements', 'Multi-state permit coordination integrated', 'Operator matching alongside permit processing', 'Rate transparency for escort + permit bundles', 'Digital permit document management'] },
  { slug: 'permit-pro', competitor: 'Permit Pro / Permits Plus', strengths: ['Escort matching integrated with permit workflow', 'Automated escort count calculation from dimensions', 'One platform for permits AND escort booking', 'Rate comparison for escort services', 'Multi-jurisdiction compliance in one dashboard', 'Digital document vault for permits & insurance'] },
  { slug: 'transapi-de', competitor: 'TransAPI (Germany)', strengths: ['Broader DACH + EU coverage beyond Germany', 'BF3/BF4 operator certification tracking', 'Multi-language interface (DE, EN, NL, FR)', 'Schwertransport-specific rate intelligence', 'StVO § 29 compliance database', 'Cross-border escort coordination (DACH + Benelux)'] },
  { slug: 'convois-exceptionnels-fr', competitor: 'ConvoisExceptionnels.com (France)', strengths: ['Pan-European coverage vs France-only', 'Multi-language UI for cross-border ops', 'Integrated escort booking & payment', 'Prefectural regulation database', 'Real-time operator availability', 'Cross-border Convoi Exceptionnel coordination'] },
  { slug: 'abnormal-loads-uk', competitor: 'AbnormalLoads.com (UK)', strengths: ['Global coverage (57 countries vs UK-only)', 'ESDAL2-integrated notification tracking', 'STGO category compliance database', 'Integrated payment & escrow system', 'Multi-platform operator profiles', 'Rate intelligence with UK market benchmarks'] },
  { slug: 'heavy-haul-magazine', competitor: 'Heavy Haul Magazine / Publications', strengths: ['Interactive platform vs static publication', 'Real-time operator directory & booking', 'Rate data from live transactions vs survey estimates', 'Escort requirement database vs editorial articles', 'Operator profiles with direct contact', 'Revenue tool for operators vs advertiser-funded media'] },
  { slug: 'overdrive-tonnage', competitor: 'Overdrive / Tonnage', strengths: ['Purpose-built for oversize/escort niche', 'Escort-specific rate intelligence', 'Operator safety scores & verification', 'Integrated booking & payment system', 'Corridor analytics for route planning', 'Not a general trucking platform — 100% escort/pilot car focus'] },
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
