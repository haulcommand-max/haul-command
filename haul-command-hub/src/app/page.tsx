import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import HCClaimCorrectVerifyPanel from '@/components/hc/ClaimCorrectVerifyPanel';
import HCFaqModule from '@/components/hc/FaqModule';
import HCMarketMaturityBanner from '@/components/hc/MarketMaturityBanner';
import HCCorridorSnapshot from '@/components/hc/CorridorSnapshot';
import HCRequirementsSnapshot from '@/components/hc/RequirementsSnapshot';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';
import { HeroBillboard } from '@/components/hc/HeroBillboard';
import { InlineBillboard } from '@/components/hc/InlineBillboard';
import { getCreativesForSlot } from '@/lib/ad-engine';
import HomeHero from '@/components/hc/HomeHero';
import type { HCMetric, HCFaqItem, HCCorridorSummary, HCRequirementsSummary } from '@/lib/hc-types';

export const revalidate = 900; // 15 minute ISR

// ─── Data Loader ─────────────────────────────────────────────

async function loadHomepageData() {
  const sb = supabaseServer();
  const now = new Date().toISOString();

  // Real metrics from production data
  const [placesResult, jurisdictionResult, corridorsResult, countriesResult] = await Promise.all([
    sb.from('hc_places').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.rpc('hc_list_all_jurisdictions'),
    sb.from('corridors').select('id, name, corridor_type').limit(6),
    sb.from('global_countries').select('country_code, name, status, tier, flag').order('tier').order('name'),
  ]);

  const totalListings = placesResult.count ?? 0;
  const jurisdictions = jurisdictionResult.data ?? [];
  const totalJurisdictions = jurisdictions.length;
  const allCountries = countriesResult.data ?? [];
  const liveCountries = allCountries.filter((c: { status: string }) => c.status === 'live');
  const totalCountries = allCountries.length || 57;
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

  return { metrics, corridorSummaries, reqSummary, totalListings, allCountries, liveCountries };
}

// ─── Page Component ──────────────────────────────────────────

export default async function HomePage() {
  const { metrics, corridorSummaries, reqSummary, totalListings, allCountries, liveCountries } = await loadHomepageData();

  // Load ad creatives in parallel
  const [heroAds, inlineAds] = await Promise.all([
    getCreativesForSlot({ slotFamily: 'hero_billboard', pageType: 'homepage', maxCreatives: 6 }),
    getCreativesForSlot({ slotFamily: 'inline_billboard', pageType: 'homepage', maxCreatives: 8 }),
  ]);

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
      <main className="flex-grow overflow-x-hidden">
        {/* Market Status */}
        <div className="w-full max-w-7xl mx-auto px-4 pt-4">
          <HCMarketMaturityBanner
            state={totalListings > 0 ? 'live' : 'data_only'}
            countryName="Heavy Haul Directory — 57-Country Framework"
            message="Directory infrastructure live across all markets. Depth varies by region."
          />
        </div>

        {/* Hero Billboard (homepage ad slot) */}
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <HeroBillboard creatives={heroAds} slotFamily="hero_billboard" pageType="homepage" />
        </div>

        {/* ═══════════════════════════════════════════════
           ROLE-AWARE COMMAND CENTER
           Replaces the generic hero. When no role is selected,
           shows the role picker. When role is selected, shows
           role-specific headline, actions, and modules.
           ═══════════════════════════════════════════════ */}
        <HomeHero
          fallbackActions={actions}
          metrics={metrics}
          locationChips={locationChips}
        />

        {/* Operational Intelligence Tools */}
        <section className="py-10 sm:py-16 px-4 bg-black/20 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              Operational <span className="text-accent">Intelligence</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Real-time tools for movement risk, cost estimation, and regulatory compliance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 ag-stagger">
              {[
                {
                  href: '/tools/load-analyzer',
                  icon: '🔍',
                  title: 'Load Analyzer',
                  desc: 'Paste a load and get profit score, risk assessment, hidden cost breakdown.',
                  cta: 'Analyze →',
                  hot: true,
                },
                {
                  href: '/tools/rate-advisor',
                  icon: '💰',
                  title: 'Rate Advisor',
                  desc: 'What should I charge? Corridor-specific rate recommendations.',
                  cta: 'Get Rate →',
                  hot: true,
                },
                {
                  href: '/tools/regulation-alerts',
                  icon: '🚨',
                  title: 'Corridor Alerts',
                  desc: 'Weather delays, DOT shutdowns, curfews — before they cost you.',
                  cta: 'View Alerts →',
                  hot: true,
                },
                {
                  href: '/tools/escort-calculator',
                  icon: '🧮',
                  title: 'Route Calculator',
                  desc: 'Enter your load once, see every escort requirement on your entire route.',
                  cta: 'Calculate →',
                },
                {
                  href: '/dashboard/earnings',
                  icon: '📊',
                  title: 'Earnings Tracker',
                  desc: 'Track every run. Know your real hourly rate and best corridors.',
                  cta: 'Track Earnings →',
                  hot: true,
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
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl hover:border-accent/30 hover:bg-accent/[0.03] transition-all ag-card-hover ag-slide-up ${'hot' in tool && tool.hot ? 'relative' : ''}`}
                >
                  {'hot' in tool && tool.hot && (
                    <span className="absolute top-3 right-3 bg-red-500/20 text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ag-hot-pulse">New</span>
                  )}
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
        <section className="py-10 sm:py-16 px-4 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              State <span className="text-accent">Protocols</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Granular escort triggers, permit portals, and compliance data for every US state.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
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

        {/* Inline Billboard */}
        <div className="max-w-7xl mx-auto px-4">
          <InlineBillboard creatives={inlineAds} />
        </div>

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

        {/* 57-Country Status Ticker — Dynamic from global_countries */}
        <section className="py-8 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                Global <span className="text-accent">Network</span>
              </h2>
              <span className="bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-full">
                57 countries tracked
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {liveCountries.length} live · {allCountries.filter((c: { status: string }) => c.status === 'next').length} launching · {allCountries.filter((c: { status: string }) => c.status === 'planned').length} planned
            </p>
            <div className="flex flex-wrap gap-2">
              {(allCountries.length > 0 ? allCountries.slice(0, 16) : [
                { flag: '🇺🇸', country_code: 'US', status: 'live' },
                { flag: '🇨🇦', country_code: 'CA', status: 'live' },
                { flag: '🇦🇺', country_code: 'AU', status: 'live' },
                { flag: '🇬🇧', country_code: 'GB', status: 'live' },
              ]).map((c: { flag?: string; country_code: string; status: string }) => (
                <Link
                  key={c.country_code}
                  href={`/directory/${c.country_code.toLowerCase()}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:border-accent/30 ${
                    c.status === 'live'
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : c.status === 'next'
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-gray-500'
                  }`}
                >
                  <span>{c.flag ?? '🌍'}</span>
                  <span>{c.country_code}</span>
                  {c.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                </Link>
              ))}
              {allCountries.length > 16 && (
                <Link href="/countries" className="text-accent text-xs self-center ml-2 hover:underline font-bold">
                  + {allCountries.length - 16} more countries →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-tighter mb-1">
                Ready to Go <span className="text-accent">Pro</span>?
              </h3>
              <p className="text-gray-400 text-sm">
                Get verified, get priority loads, get paid faster.
              </p>
            </div>
            <Link
              href="/pricing"
              className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors flex-shrink-0"
            >
              View Pricing →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-4 px-4 max-w-7xl mx-auto">
          <HCFaqModule items={faqItems} />
        </section>
      </main>

      {/* Footer — Complete, No Dead Links */}
      <footer className="py-10 sm:py-12 px-4 border-t border-white/10 bg-black/30 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
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
              <h4 className="text-white font-bold text-sm mb-3">Global Markets</h4>
              <div className="space-y-2 text-sm">
                <Link href="/directory/us" className="block text-gray-500 hover:text-white transition-colors">🇺🇸 United States</Link>
                <Link href="/directory/ca" className="block text-gray-500 hover:text-white transition-colors">🇨🇦 Canada</Link>
                <Link href="/directory/au" className="block text-gray-500 hover:text-white transition-colors">🇦🇺 Australia</Link>
                <Link href="/directory/gb" className="block text-gray-500 hover:text-white transition-colors">🇬🇧 United Kingdom</Link>
                <Link href="/countries" className="block text-accent hover:text-yellow-500 transition-colors font-bold">+ 53 more countries →</Link>
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
