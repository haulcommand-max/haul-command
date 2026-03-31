import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { getCanonicalStats } from '@/lib/hc-loaders/stats';
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
import ActivityTicker from '@/components/ActivityTicker';
import LiveDashboard from '@/components/hc/LiveDashboard';
import { CinematicMap } from '@/components/hc/CinematicMap';
import ScrollReveal from '@/components/hc/ScrollReveal';
import type { HCMetric, HCFaqItem, HCCorridorSummary, HCRequirementsSummary } from '@/lib/hc-types';

export const revalidate = 900; // 15 minute ISR

// ─── Data Loader ─────────────────────────────────────────────

async function loadHomepageData() {
  const sb = supabaseServer();
  const now = new Date().toISOString();

  // ONE canonical source of truth — get_canonical_stats() RPC
  // directory_listings is quarantined (654K synthetic rows).
  // Only hc_real_operators counts are shown publicly.
  const [stats, jurisdictionResult, corridorsResult, countriesResult] = await Promise.all([
    getCanonicalStats(),
    sb.rpc('hc_list_all_jurisdictions').then(r => r, () => ({ data: [] })),
    sb.from('corridors').select('id, name, corridor_type').limit(6).then(r => r, () => ({ data: [] })),
    sb.from('global_countries').select('iso2, name, activation_phase, is_active_market, launch_status, tier, slug').order('tier').order('name').then(r => r, () => ({ data: [] })),
  ]);

  const totalListings = stats.total_real_operators;
  const jurisdictions = jurisdictionResult.data ?? [];
  const totalJurisdictions = stats.jurisdictions;
  const allCountries = countriesResult.data ?? [];
  const liveCountries = allCountries.filter((c: { is_active_market?: boolean; activation_phase?: string }) => c.is_active_market || c.activation_phase === 'active');
  const corridors = corridorsResult.data ?? [];

  // Build metrics — ONLY from canonical real data. No fake fallbacks.
  const metrics: HCMetric[] = [];

  metrics.push({
    label: 'Verified Operators',
    value: totalListings.toLocaleString(),
    geographyScope: 'Global',
    timeWindow: 'All time',
    freshness: { lastUpdatedAt: now, updateLabel: 'Verified data' },
  });

  // Show only countries with REAL verified operator data
  metrics.push({
    label: 'Countries with Verified Data',
    value: stats.active_countries.toLocaleString(),
    geographyScope: 'Global',
    timeWindow: 'All time',
    freshness: { lastUpdatedAt: now, updateLabel: 'Live data' },
  });

  if (totalJurisdictions > 0) {
    metrics.push({
      label: 'Jurisdictions Covered',
      value: totalJurisdictions.toLocaleString(),
      geographyScope: 'Global',
      timeWindow: 'All time',
      freshness: { lastUpdatedAt: now, updateLabel: 'Regulatory data' },
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

  // Top markets for location chips — Tier A priority
  const locationChips = [
    { label: '🇺🇸 United States', href: '/directory/us' },
    { label: '🇨🇦 Canada', href: '/directory/ca' },
    { label: '🇦🇺 Australia', href: '/directory/au' },
    { label: '🇬🇧 United Kingdom', href: '/directory/gb' },
    { label: '🇩🇪 Germany', href: '/directory/de' },
    { label: '🇦🇪 UAE', href: '/directory/ae' },
    { label: '🇧🇷 Brazil', href: '/directory/br' },
    { label: '🇿🇦 South Africa', href: '/directory/za' },
  ];

  // Single dominant CTA — Find Operators is the primary action
  const actions = [
    { id: 'hc_act_find_operators', label: 'Find Operators', href: '/directory', type: 'navigate' as const, priority: 'primary' as const },
    { id: 'hc_act_post_load', label: 'Post a Load', href: '/inbox?post=true', type: 'navigate' as const, priority: 'primary' as const },
    { id: 'hc_act_view_requirements', label: 'Requirements', href: '/escort-requirements', type: 'navigate' as const, priority: 'primary' as const },
    { id: 'hc_act_claim_profile', label: 'Claim Profile', href: '/claim', type: 'claim' as const, priority: 'primary' as const },
  ];

  // FAQ items — updated for 120-country global scope
  const faqItems: HCFaqItem[] = [
    {
      question: 'What is Haul Command?',
      answer: 'Haul Command is the global operating system for the heavy haul, oversize transport, and escort vehicle industry. We connect shippers, brokers, and operators across 120 countries with verified directory data, route intelligence, escort requirements, and compliance tools.',
    },
    {
      question: 'How do I find a pilot car or escort operator?',
      answer: 'Use our directory to search by country, state, or service type. Each operator profile includes contact info, service areas, capabilities, and verification status. Contact operators directly from their profile.',
    },
    {
      question: 'How do I claim my operator profile?',
      answer: 'Click "Claim Profile" and verify your identity via phone. Once claimed, you can update your profile, respond to loads, and access premium features like priority placement and verified badges.',
    },
    {
      question: 'What escort requirements does my load need?',
      answer: 'Use our Requirements tool to check dimension-based escort triggers for any US state or international jurisdiction. We track width, height, length, and weight thresholds that determine escort counts, police escort needs, and permit requirements.',
    },
    {
      question: 'Is Haul Command free to use?',
      answer: 'Browsing the directory, viewing requirements, and searching for operators is free. Claiming and verifying your profile is free. Premium features like priority placement, boost credits, and analytics are available through paid plans.',
    },
  ];

  // Tier A priority countries for the Global Network section
  const tierAPriority = ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'];
  const sortedCountries = allCountries.length > 0 
    ? [...allCountries].sort((a: { iso2: string; tier?: string }, b: { iso2: string; tier?: string }) => {
        const aIdx = tierAPriority.indexOf(a.iso2);
        const bIdx = tierAPriority.indexOf(b.iso2);
        if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
        if (aIdx >= 0) return -1;
        if (bIdx >= 0) return 1;
        const tierOrder = ['A', 'B', 'C', 'D', 'E'];
        return (tierOrder.indexOf(a.tier || 'E')) - (tierOrder.indexOf(b.tier || 'E'));
      })
    : [
        { iso2: 'US', name: 'United States', activation_phase: 'active', is_active_market: true, tier: 'A' },
        { iso2: 'CA', name: 'Canada', activation_phase: 'active', is_active_market: true, tier: 'A' },
        { iso2: 'AU', name: 'Australia', activation_phase: 'active', is_active_market: true, tier: 'A' },
        { iso2: 'GB', name: 'United Kingdom', activation_phase: 'active', is_active_market: true, tier: 'A' },
        { iso2: 'DE', name: 'Germany', activation_phase: 'active', is_active_market: true, tier: 'A' },
        { iso2: 'AE', name: 'UAE', activation_phase: 'active', is_active_market: true, tier: 'A' },
        { iso2: 'BR', name: 'Brazil', activation_phase: 'expanding', is_active_market: false, tier: 'A' },
        { iso2: 'ZA', name: 'South Africa', activation_phase: 'expanding', is_active_market: false, tier: 'A' },
      ];

  return (
    <>
      <Navbar />
      <ActivityTicker />
      <main className="flex-grow overflow-x-hidden">

        {/* Hero Billboard (homepage ad slot) */}
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <HeroBillboard creatives={heroAds} slotFamily="hero_billboard" pageType="homepage" />
        </div>

        {/* ═══════════════════════════════════════════════
           ROLE-AWARE COMMAND CENTER
           ═══════════════════════════════════════════════ */}
        <HomeHero
          fallbackActions={actions}
          metrics={metrics}
          locationChips={locationChips}
        />

        {/* Live Dashboard Widgets */}
        <div className="max-w-7xl mx-auto px-4">
          <LiveDashboard />
        </div>

        {/* ═══ OPERATOR TOOLS ═══ */}
        <section className="py-10 sm:py-16 px-4 bg-black/20 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              Operator <span className="text-accent">Tools</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Purpose-built intelligence tools for heavy haul professionals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 ag-stagger">
              {[
                {
                  href: '/tools/permit-checker/us',
                  icon: '📜',
                  title: 'Permit Checker',
                  desc: 'Look up state-by-state permit requirements based on load dimensions.',
                  cta: 'Check Permits →',
                  hot: true,
                },
                {
                  href: '/tools/escort-rules/us',
                  icon: '🚓',
                  title: 'Escort Requirement Finder',
                  desc: 'Find exact pilot car and escort rules per state or country.',
                  cta: 'Find Rules →',
                },
                {
                  href: '/tools/rate-estimator/us',
                  icon: '💰',
                  title: 'Rate Estimator',
                  desc: 'Estimate pilot car and heavy haul escort rates by route.',
                  cta: 'Get Estimate →',
                },
                {
                  href: '/tools/axle-weight',
                  icon: '⚖️',
                  title: 'Axle Weight Calculator',
                  desc: 'Calculate legal load weight based on axle configuration and bridge formula.',
                  cta: 'Calculate Weight →',
                },
                {
                  href: '/tools/superload-alerts',
                  icon: '⚠️',
                  title: 'Superload Alert Feed',
                  desc: 'Live feed of superload movements causing closures by region.',
                  cta: 'View Alerts →',
                },
                {
                  href: '/tools/broker-verify',
                  icon: '🛡️',
                  title: 'Broker Verify',
                  desc: 'Instantly verify broker and dispatcher legitimacy via FMCSA records.',
                  cta: 'Verify Broker →',
                  hot: true,
                },
                {
                  href: '/tools/cost-calculator',
                  icon: '📊',
                  title: 'Load Profit Calculator',
                  desc: 'Calculate true profit per load including fuel, tolls, and deadhead.',
                  cta: 'Calculate Profit →',
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group ag-glass ag-spring-hover p-6 rounded-2xl hover:border-accent/30 hover:bg-accent/[0.03] transition-all ag-slide-up ${'hot' in tool && tool.hot ? 'relative' : ''}`}
                >
                  {'hot' in tool && tool.hot && (
                    <span className="absolute top-3 right-3 bg-accent/20 text-accent text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                  )}
                  <div className="text-4xl mb-3" role="img" aria-label={tool.title}>{tool.icon}</div>
                  <h3 className="text-white font-bold text-base mb-1.5 group-hover:text-accent transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 leading-relaxed">{tool.desc}</p>
                  <span className="text-accent text-xs font-bold group-hover:underline">{tool.cta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SERVICE DIRECTORY — Distinct Categories Only ═══ */}
        <ScrollReveal>
        <section className="py-10 sm:py-16 px-4 bg-gradient-to-b from-transparent to-accent/5 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto border border-white/10 rounded-3xl p-6 sm:p-10 bg-[#0a0e17] shadow-xl relative">
            <div className="absolute top-0 right-10 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              Global <span className="text-accent">Services</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Verified operators across 120 countries specializing in every discipline of oversize transport.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 relative z-10">
              {[
                { name: 'Pilot Car Operators', slug: 'pilot-car-operator', icon: '🚗', desc: 'Certified lead and chase vehicles for all dimensional loads.' },
                { name: 'High Pole Escorts', slug: 'high-pole', icon: '📐', desc: 'Height pole operators verifying bridge and overhead clearances.' },
                { name: 'Steermen', slug: 'steerman', icon: '🕹️', desc: 'Certified rear steer operators for superloads requiring tillers.' },
                { name: 'Route Surveyors', slug: 'route-survey', icon: '🗺️', desc: 'Pre-trip infrastructure checks, bridge clearances, and road analysis.' },
                { name: 'Heavy Towing & Rotators', slug: 'heavy-towing', icon: '🏗️', desc: 'Heavy-duty recovery, rotator operations, and emergency response.' },
                { name: 'Freight Brokers', slug: 'freight-broker', icon: '📋', desc: 'Specialized heavy haul brokerage with FMCSA-verified authority.' },
                { name: 'TWIC Port Clearances', slug: 'twic-cleared-operator', icon: '⚓', desc: 'Government-vetted operators with secure maritime terminal access.' },
                { name: 'Military / DoD Transport', slug: 'dod-cleared-escort', icon: '🎖️', desc: 'STRAC-cleared escorts for sensitive defense mobilization.' },
              ].map((svc) => (
                <Link
                  key={svc.slug}
                  href={`/services/${svc.slug}`}
                  className="group block p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-accent/[0.05] hover:border-accent/30 transition-all ag-slide-up"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{svc.icon}</div>
                    <div>
                      <h3 className="text-white font-bold text-lg group-hover:text-accent transition-colors mb-2">
                        {svc.name}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {svc.desc}
                      </p>
                      <div className="mt-4 text-xs font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        View Operators →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-gray-400 text-sm">Need a specific configuration?</span>
              <Link href="/directory" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-lg text-sm font-bold transition-colors">
                Search All Operators
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ═══ COMPLIANCE REGULATIONS — Global, not just US ═══ */}
        <ScrollReveal>
        <section className="py-10 sm:py-16 px-4 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              Escort <span className="text-accent">Regulations</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Granular escort triggers, permit portals, and compliance data across 120 countries.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {[
                { name: 'Florida', icon: '🌴' },
                { name: 'Texas', icon: '⛽' },
                { name: 'California', icon: '🌉' },
                { name: 'Ohio', icon: '🏭' },
                { name: 'Pennsylvania', icon: '🏗️' },
                { name: 'Georgia', icon: '🍑' },
                { name: 'North Carolina', icon: '🌲' },
                { name: 'Illinois', icon: '🏙️' },
                { name: 'Washington', icon: '🌧️' },
                { name: 'Oregon', icon: '🦫' },
              ].map((state) => (
                <Link
                  key={state.name}
                  href={`/escort-requirements?state=${encodeURIComponent(state.name.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="group ag-glass ag-spring-hover rounded-xl px-4 py-4 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{state.icon}</span>
                    <span className="text-white text-sm font-semibold group-hover:text-accent transition-colors">
                      {state.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 ml-8">Escort Rules · Permits · Thresholds →</div>
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/escort-requirements"
                className="text-accent text-sm font-bold hover:underline"
              >
                View all jurisdictions across 120 countries →
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* Inline Billboard */}
        <div className="max-w-7xl mx-auto px-4">
          <InlineBillboard creatives={inlineAds} />
        </div>

        {/* ═══ CINEMATIC MAP — Route Intelligence ═══ */}
        <ScrollReveal>
        <section className="py-10 sm:py-16 px-4 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter">
                Route <span className="text-accent">Intelligence</span>
              </h2>
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Interactive</span>
            </div>
            <CinematicMap
              markers={[
                { lng: -81.38, lat: 28.54, label: 'Orlando FL Hub', type: 'staging' },
                { lng: -97.74, lat: 30.27, label: 'Austin TX Corridor', type: 'corridor' },
                { lng: -118.24, lat: 34.05, label: 'Los Angeles CA', type: 'operator' },
                { lng: -95.37, lat: 29.76, label: 'Houston TX', type: 'staging' },
                { lng: -84.39, lat: 33.75, label: 'Atlanta GA', type: 'operator' },
                { lng: -87.63, lat: 41.88, label: 'Chicago IL', type: 'corridor' },
                { lng: -122.33, lat: 47.61, label: 'Seattle WA', type: 'operator' },
                { lng: -73.99, lat: 40.73, label: 'New York NY', type: 'border' },
                { lng: -0.12, lat: 51.51, label: 'London UK', type: 'operator' },
                { lng: 55.27, lat: 25.20, label: 'Dubai UAE', type: 'staging' },
                { lng: 153.02, lat: -27.47, label: 'Brisbane AU', type: 'operator' },
                { lng: -46.63, lat: -23.55, label: 'São Paulo BR', type: 'corridor' },
              ]}
              center={[-30, 20]}
              zoom={1.8}
              className="min-h-[350px] sm:min-h-[450px]"
            />
            <div className="mt-4 text-center">
              <Link href="/map" className="text-accent text-sm font-bold hover:underline ag-magnetic inline-block">Explore Full Interactive Map →</Link>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* Corridor Intelligence */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <HCCorridorSnapshot
            heading="Corridor Intel"
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

        {/* Claim Panel — unified terminology */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <HCClaimCorrectVerifyPanel
            claimAction={{
              id: 'claim',
              label: 'Claim Profile',
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
              label: 'Correct a Profile',
              href: '/report-data-issue',
              type: 'report',
              priority: 'tertiary',
            }}
          />
        </section>

        {/* ═══ 120-COUNTRY GLOBAL NETWORK — Priority-Sorted ═══ */}
        <section className="py-8 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                Global <span className="text-accent">Network</span>
              </h2>
              <span className="bg-accent/10 border border-accent/20 text-accent text-xs sm:text-sm font-bold px-3 py-1 rounded-full">
                {allCountries.length || 120} countries
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base font-medium text-gray-400 mb-6">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> {liveCountries.length} Live Markets</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> {allCountries.filter((c: { activation_phase?: string }) => c.activation_phase === 'expanding').length} Expanding</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-600"></span> {allCountries.filter((c: { activation_phase?: string }) => c.activation_phase === 'planned').length} Planned</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sortedCountries.slice(0, 24).map((c: { iso2: string; name?: string; activation_phase?: string; is_active_market?: boolean; slug?: string; tier?: string }) => {
                const isLive = c.is_active_market || c.activation_phase === 'active';
                const isExpanding = c.activation_phase === 'expanding';
                const isTierA = tierAPriority.includes(c.iso2);
                return (
                <Link
                  key={c.iso2}
                  href={`/directory/${c.iso2.toLowerCase()}`}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold border transition-all shadow-sm ${
                    isTierA
                      ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 ring-1 ring-accent/10'
                      : isLive
                      ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                      : isExpanding
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="truncate pr-2">{c.name || c.iso2}</span>
                  {isTierA && <span className="text-[8px] font-black text-accent/70 uppercase">Gold</span>}
                  {!isTierA && isLive && <span className="w-2 h-2 flex-shrink-0 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
                </Link>
              );
              })}
            </div>
            {(allCountries.length > 24 || allCountries.length === 0) && (
              <div className="mt-5 text-center sm:text-left">
                <Link href="/countries" className="inline-block bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl px-6 py-3 text-white text-sm font-bold transition-colors">
                  View All {allCountries.length || 120} Countries →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ═══ PRO UPGRADE — Specific Value Props ═══ */}
        <ScrollReveal>
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 ag-glow-gold ag-spring-hover">
            <div>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-tighter mb-2">
                Upgrade to <span className="text-accent ag-text-glow">Pro</span>
              </h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>✓ Priority placement in search results</li>
                <li>✓ Verified badge on your operator profile</li>
                <li>✓ Real-time load alerts in your coverage area</li>
                <li>✓ Analytics dashboard with view & lead tracking</li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="bg-accent text-black px-8 py-4 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all flex-shrink-0 ag-magnetic shadow-[0_0_24px_rgba(245,159,10,0.3)] hover:shadow-[0_0_40px_rgba(245,159,10,0.5)]"
            >
              View Plans & Pricing →
            </Link>
          </div>
        </section>
        </ScrollReveal>

        {/* ═══ MANAGED SERVICES — Direct Revenue ═══ */}
        <ScrollReveal>
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-2">
            Managed <span className="text-accent">Services</span>
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xl">
            Skip the complexity. We handle the hard parts so you can focus on moving freight.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/pricing#managed-services"
              className="group bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.1] rounded-2xl p-6 hover:border-accent/30 transition-all shadow-xl border-l-4 border-l-accent"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">🎫</span>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-accent transition-colors">Managed Permit Procurement</h3>
                  <p className="text-gray-400 text-sm mb-3">Turnkey application, DOT follow-up, and delivery for any state.</p>
                  <div className="flex items-center justify-between">
                    <p className="text-accent font-black text-xl">$65<span className="text-gray-500 text-xs font-normal ml-1">per permit</span></p>
                    <span className="bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold group-hover:bg-accent group-hover:text-black transition-colors">Start Order →</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              href="/pricing#managed-services"
              className="group bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.1] rounded-2xl p-6 hover:border-accent/30 transition-all shadow-xl border-l-4 border-l-accent"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">🚀</span>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-accent transition-colors">Full-Service Escort Dispatch</h3>
                  <p className="text-gray-400 text-sm mb-3">We source, vet, and dispatch certified pilot cars for your route.</p>
                  <div className="flex items-center justify-between">
                    <p className="text-accent font-black text-xl">$150<span className="text-gray-500 text-xs font-normal ml-1">per load</span></p>
                    <span className="bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold group-hover:bg-accent group-hover:text-black transition-colors">Start Order →</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
        </ScrollReveal>

        {/* ═══ INTELLIGENCE HUB — Blog Cards + Leaderboard Trust ═══ */}
        <ScrollReveal>
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-1">
                Intelligence <span className="text-accent">Hub</span>
              </h2>
              <p className="text-gray-400 text-sm">Expert analysis trusted by the heavy haul industry.</p>
            </div>
            <Link href="/blog" className="text-accent text-sm font-bold hover:underline hidden sm:block">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: '🔄', title: 'Pilot Car Reciprocity', desc: 'Which states honor out-of-state certifications and which require re-testing.', href: '/blog/pilot-car-reciprocity-map' },
              { icon: '🚔', title: 'Police Escort Lead Times', desc: 'Median wait times by state and strategies to cut scheduling delays.', href: '/blog/police-escort-scheduling' },
              { icon: '💰', title: 'Friday Move Premiums', desc: 'Why Friday loads cost 15-40% more and how to negotiate the premium.', href: '/blog/friday-premium-analysis' },
              { icon: '🌍', title: 'Global Escort Standards', desc: 'How escort requirements differ across US, EU, AU, and Gulf markets.', href: '/blog/international-escort-standards' },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 hover:bg-accent/[0.03] transition-all"
              >
                <span className="text-2xl mb-2 block">{card.icon}</span>
                <h3 className="text-white font-bold text-sm mb-1 group-hover:text-accent transition-colors">{card.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
                <span className="mt-3 block text-accent text-xs font-bold group-hover:underline">Read Analysis →</span>
              </Link>
            ))}
          </div>
          {/* Leaderboard Trust Strip */}
          <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <span className="text-white font-bold text-sm">Operator Leaderboard</span>
                <span className="text-gray-500 text-xs ml-2">ELD-verified rankings by response time, coverage area, and compliance score.</span>
              </div>
            </div>
            <Link href="/leaderboards" className="text-accent text-sm font-bold hover:underline whitespace-nowrap">
              View Rankings →
            </Link>
          </div>
        </section>
        </ScrollReveal>

        {/* ═══ DEVELOPER / API MONETIZATION ═══ */}
        <ScrollReveal>
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Developer API</span>
              </div>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-tighter mb-2">
                Build on <span className="text-purple-400">Haul Command</span> Data
              </h3>
              <p className="text-gray-400 text-sm max-w-lg">
                5 production APIs: Directory Search, Escort Requirements, Rate Intelligence, Route Planning, and 
                Voice. Power your logistics platform with the industry&apos;s deepest heavy haul dataset.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <Link
                href="/developers"
                className="bg-purple-500 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-purple-400 transition-colors"
              >
                View API Docs →
              </Link>
              <span className="text-gray-600 text-[10px]">From $99/mo · 10K calls included</span>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* FAQ */}
        <section className="py-4 px-4 max-w-7xl mx-auto">
          <HCFaqModule items={faqItems} />
        </section>
      </main>

      {/* 
        FOOTER IS RENDERED BY layout.tsx via <Footer /> component.
        DO NOT add a second footer here.
      */}
    </>
  );
}
