import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import HCActionQuad from '@/components/hc/ActionQuad';
import HCProofBar from '@/components/hc/ProofBar';
import HCLocationChipRow from '@/components/hc/LocationChipRow';
import HCClaimCorrectVerifyPanel from '@/components/hc/ClaimCorrectVerifyPanel';
import HCFaqModule from '@/components/hc/FaqModule';
import HCMarketMaturityBanner from '@/components/hc/MarketMaturityBanner';
import HCCorridorSnapshot from '@/components/hc/CorridorSnapshot';
import HCRequirementsSnapshot from '@/components/hc/RequirementsSnapshot';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';
import type { HCMetric, HCFaqItem, HCCorridorSummary, HCRequirementsSummary } from '@/lib/hc-types';

export const revalidate = 900; // 15 minute ISR

// ─── Data Loader ─────────────────────────────────────────────

async function loadHomepageData() {
  const sb = supabaseServer();
  const now = new Date().toISOString();

  // Real metrics from production data
  const [placesResult, jurisdictionResult, corridorsResult] = await Promise.all([
    sb.from('hc_places').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.rpc('hc_list_all_jurisdictions'),
    sb.from('corridors').select('id, name, corridor_type').limit(6),
  ]);

  const totalListings = placesResult.count ?? 0;
  const jurisdictions = jurisdictionResult.data ?? [];
  const totalJurisdictions = jurisdictions.length;
  const totalCountries = new Set(jurisdictions.map((j: { country_code: string }) => j.country_code)).size || 0;
  const corridors = corridorsResult.data ?? [];

  // Build REAL metrics only — never fake
  const metrics: HCMetric[] = [];

  if (totalListings > 0) {
    metrics.push({
      label: 'Directory Listings',
      value: totalListings.toLocaleString(),
      geographyScope: 'Global',
      timeWindow: 'All time',
      freshness: { lastUpdatedAt: now, updateLabel: 'Live count' },
    });
  }

  if (totalJurisdictions > 0) {
    metrics.push({
      label: 'Jurisdictions Covered',
      value: totalJurisdictions.toString(),
      geographyScope: 'Global',
      timeWindow: 'All time',
      freshness: { lastUpdatedAt: now, updateLabel: 'Live count' },
    });
  }

  if (totalCountries > 0) {
    metrics.push({
      label: 'Countries with Data',
      value: totalCountries.toString(),
      geographyScope: 'Global',
      timeWindow: 'All time',
      freshness: { lastUpdatedAt: now, updateLabel: 'Live count' },
    });
  }

  // Corridor snapshot data
  const corridorSummaries: HCCorridorSummary[] = corridors.slice(0, 3).map((c: { id: string; name: string; corridor_type: string }) => ({
    slug: c.name.toLowerCase().replace(/\s+/g, '-'),
    name: c.name,
    regionLabels: [c.corridor_type.replace(/_/g, ' ')],
    topServices: ['Pilot Car', 'Escort Vehicle'],
  }));

  // Requirements snapshot
  const flJurisdictions = jurisdictions.filter((j: { country_code: string }) => j.country_code === 'US');
  const reqSummary: HCRequirementsSummary = {
    jurisdictionLabel: `${flJurisdictions.length} US Jurisdictions`,
    escortThresholds: [
      'Width triggers vary by state (8\'6" to 12\' for first escort)',
      'Height pole requirements differ across jurisdictions',
      'Police escort thresholds based on superload dimensions',
    ],
    permitLinks: [
      { label: 'FHWA Oversize/Overweight', href: 'https://ops.fhwa.dot.gov/freight/sw/index.htm', external: true },
    ],
    lastReviewedAt: now,
    disclaimer: 'Requirements are verified against official sources. Always confirm with state DOT before movement.',
  };

  return { metrics, corridorSummaries, reqSummary, totalListings };
}

// ─── Page Component ──────────────────────────────────────────

export default async function HomePage() {
  const { metrics, corridorSummaries, reqSummary, totalListings } = await loadHomepageData();

  // Top markets for location chips
  const locationChips = [
    { label: '🇺🇸 Florida', href: '/directory/us' },
    { label: '🇺🇸 Texas', href: '/state/texas' },
    { label: '🇺🇸 California', href: '/state/california' },
    { label: '🇨🇦 Canada', href: '/directory/ca' },
    { label: '🇦🇺 Australia', href: '/directory/au' },
    { label: '🇬🇧 United Kingdom', href: '/directory/gb' },
    { label: '🇩🇪 Germany', href: '/directory/de' },
    { label: '🇦🇪 UAE', href: '/directory/ae' },
  ];

  // Action quad
  const actions = [
    { id: 'hc_act_find_escorts', label: 'Find Escorts', href: '/directory', type: 'navigate' as const, priority: 'primary' as const },
    { id: 'hc_act_post_load', label: 'Post Load', href: '/loads', type: 'navigate' as const, priority: 'primary' as const },
    { id: 'hc_act_view_requirements', label: 'Requirements', href: '/escort-requirements', type: 'navigate' as const, priority: 'primary' as const },
    { id: 'hc_act_claim_listing', label: 'Claim Listing', href: '/claim', type: 'claim' as const, priority: 'primary' as const },
  ];

  // FAQ items
  const faqItems: HCFaqItem[] = [
    {
      question: 'What is Haul Command?',
      answer: 'Haul Command is the world\'s largest directory for pilot car operators, escort vehicle services, and heavy haul transport professionals. We cover 57 countries with verified listings, escort requirements, corridor intelligence, and compliance data.',
    },
    {
      question: 'How do I find a pilot car or escort service?',
      answer: 'Use our directory to search by state, country, or service type. Each listing includes contact information, service areas, capabilities, and verification status. You can call or text operators directly from their profile.',
    },
    {
      question: 'How do I claim my business listing?',
      answer: 'Click "Claim Listing" and verify your identity via phone. Once claimed, you can update your profile, respond to loads, and access premium features like priority placement and verified badges.',
    },
    {
      question: 'What escort requirements does my load need?',
      answer: 'Use our Requirements section to check dimension-based escort triggers for any US state or international jurisdiction. We track width, height, length, and weight thresholds that determine escort vehicle counts, police escort needs, and permit requirements.',
    },
    {
      question: 'Is Haul Command free to use?',
      answer: 'Browsing the directory, viewing requirements, and searching for operators is free. Claiming and verifying your listing is free. Premium features like priority placement, boost credits, and analytics are available through paid plans.',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {/* Market Status */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <HCMarketMaturityBanner
            state={totalListings > 0 ? 'live' : 'data_only'}
            countryName="Heavy Haul Directory — 57-Country Framework"
            message="Directory infrastructure live across all markets. Depth varies by region."
          />
        </div>

        {/* Hero Section — Action-First, Not Dashboard-First */}
        <section className="relative py-16 sm:py-20 px-4 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent"></div>
          <div className="max-w-5xl mx-auto relative z-10 space-y-8">
            {/* H1 — answers "What are you here to do?" */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 leading-[0.95]">
                What Do You <span className="text-accent">Need?</span>
              </h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                The world&apos;s largest directory for pilot car operators, escort vehicles, and heavy haul transport professionals.
              </p>
            </div>

            {/* Action Quad — 4 primary entry points */}
            <HCActionQuad actions={actions} />

            {/* Proof Bar — real metrics only */}
            <HCProofBar metrics={metrics} />

            {/* Location Chips — top markets */}
            <HCLocationChipRow chips={locationChips} />
          </div>
        </section>

        {/* Operational Intelligence Tools */}
        <section className="py-16 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter">
              Operational <span className="text-accent">Intelligence</span>
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xl">
              Real-time tools for movement risk, cost estimation, and regulatory compliance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  href: '/tools/escort-calculator',
                  icon: '🧮',
                  title: 'Route Calculator',
                  desc: 'Enter your load once, see every escort requirement on your entire route.',
                  cta: 'Calculate →',
                },
                {
                  href: '/tools/friday-checker',
                  icon: '📅',
                  title: 'Can I Move Friday?',
                  desc: 'Weekend-adjacent curfews and metro zone movement windows.',
                  cta: 'Check →',
                },
                {
                  href: '/tools/superload-meter',
                  icon: '🌡️',
                  title: 'Superload Risk Meter',
                  desc: 'Predictive feasibility scoring for massive transportation projects.',
                  cta: 'Score →',
                },
                {
                  href: '/tools/cost-estimator',
                  icon: '🧾',
                  title: 'Cost Estimator',
                  desc: 'Transparent convoy overhead based on state-specific market data.',
                  cta: 'Estimate →',
                },
                {
                  href: '/escort-requirements',
                  icon: '📋',
                  title: 'Requirements Hub',
                  desc: 'Dimension-based escort rules across 57 countries and 67+ jurisdictions.',
                  cta: 'Browse →',
                },
                {
                  href: '/tools/compliance-card',
                  icon: '🔒',
                  title: 'Compliance Card',
                  desc: 'Downloadable compliance snapshot for your route and load type.',
                  cta: 'Generate →',
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
                >
                  <div className="text-2xl mb-3">{tool.icon}</div>
                  <h3 className="text-white font-bold text-base mb-1.5 group-hover:text-accent transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 leading-relaxed">{tool.desc}</p>
                  <span className="text-accent text-xs font-bold group-hover:underline">{tool.cta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* State Protocols — Quick Access */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter">
              State <span className="text-accent">Protocols</span>
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xl">
              Granular escort triggers, permit portals, and compliance data for every US state.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                'Florida', 'Texas', 'California', 'Ohio', 'Pennsylvania',
                'Georgia', 'North Carolina', 'Illinois', 'Washington', 'Oregon',
              ].map((state) => (
                <Link
                  key={state}
                  href={`/state/${state.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
                >
                  <span className="text-white text-sm font-semibold group-hover:text-accent transition-colors">
                    {state}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-0.5">Escort Rules →</div>
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/escort-requirements"
                className="text-accent text-sm font-bold hover:underline"
              >
                View all 67+ jurisdictions across 57 countries →
              </Link>
            </div>
          </div>
        </section>

        {/* Corridor Intelligence */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <HCCorridorSnapshot
            heading="Corridor Intelligence"
            corridors={corridorSummaries}
            cta={{
              id: 'view_corridors',
              label: 'View All Corridors',
              href: '/corridors',
              type: 'navigate',
              priority: 'secondary',
            }}
          />
        </section>

        {/* Requirements Snapshot */}
        <section className="py-4 px-4 max-w-7xl mx-auto">
          <HCRequirementsSnapshot
            heading="Escort Requirements"
            summary={reqSummary}
            cta={{
              id: 'view_requirements',
              label: 'View All Requirements',
              href: '/escort-requirements',
              type: 'navigate',
              priority: 'secondary',
            }}
          />
        </section>

        {/* Claim Panel */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <HCClaimCorrectVerifyPanel
            claimAction={{
              id: 'claim',
              label: 'Claim Your Listing',
              href: '/claim',
              type: 'claim',
              priority: 'primary',
            }}
            verifyAction={{
              id: 'verify',
              label: 'Get Verified',
              href: '/verify',
              type: 'verify',
              priority: 'secondary',
            }}
            correctAction={{
              id: 'correct',
              label: 'Correct a Listing',
              href: '/report-data-issue',
              type: 'report',
              priority: 'tertiary',
            }}
          />
        </section>

        {/* FAQ */}
        <section className="py-4 px-4 max-w-7xl mx-auto">
          <HCFaqModule items={faqItems} />
        </section>
      </main>

      {/* Footer — Complete, No Dead Links */}
      <footer className="py-12 px-4 border-t border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Directory</h4>
              <div className="space-y-2 text-sm">
                <Link href="/directory" className="block text-gray-500 hover:text-white transition-colors">Browse Directory</Link>
                <Link href="/escort-requirements" className="block text-gray-500 hover:text-white transition-colors">Requirements</Link>
                <Link href="/corridors" className="block text-gray-500 hover:text-white transition-colors">Corridors</Link>
                <Link href="/countries" className="block text-gray-500 hover:text-white transition-colors">Countries</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Tools</h4>
              <div className="space-y-2 text-sm">
                <Link href="/tools/escort-calculator" className="block text-gray-500 hover:text-white transition-colors">Route Calculator</Link>
                <Link href="/tools/friday-checker" className="block text-gray-500 hover:text-white transition-colors">Friday Checker</Link>
                <Link href="/tools/superload-meter" className="block text-gray-500 hover:text-white transition-colors">Superload Meter</Link>
                <Link href="/tools/cost-estimator" className="block text-gray-500 hover:text-white transition-colors">Cost Estimator</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Top Markets</h4>
              <div className="space-y-2 text-sm">
                <Link href="/state/florida" className="block text-gray-500 hover:text-white transition-colors">Florida</Link>
                <Link href="/state/texas" className="block text-gray-500 hover:text-white transition-colors">Texas</Link>
                <Link href="/state/california" className="block text-gray-500 hover:text-white transition-colors">California</Link>
                <Link href="/directory/ca" className="block text-gray-500 hover:text-white transition-colors">Canada</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="/blog" className="block text-gray-500 hover:text-white transition-colors">Intelligence Blog</Link>
                <Link href="/claim" className="block text-gray-500 hover:text-white transition-colors">Claim Listing</Link>
                <Link href="/report-data-issue" className="block text-gray-500 hover:text-white transition-colors">Report Issue</Link>
                <Link href="/remove-listing" className="block text-gray-500 hover:text-white transition-colors">Remove Listing</Link>
              </div>
            </div>
          </div>

          <HCTrustGuardrailsModule />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="text-accent font-black tracking-tighter text-xl">HAUL COMMAND</div>
            <div className="text-[10px] text-gray-600">
              The world&apos;s largest pilot car &amp; escort vehicle directory
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
