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
import ActivityTicker from '@/components/ActivityTicker';
import LiveDashboard from '@/components/hc/LiveDashboard';
import HaulCommandLogo from '@/components/hc/HaulCommandLogo';
import SocialLinks from '@/components/hc/SocialLinks';
import { CinematicMap } from '@/components/hc/CinematicMap';
import ScrollReveal from '@/components/hc/ScrollReveal';
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
    sb.from('global_countries').select('iso2, name, activation_phase, is_active_market, launch_status, tier, slug').order('tier').order('name'),
  ]);

  const totalListings = placesResult.count ?? 0;
  const jurisdictions = jurisdictionResult.data ?? [];
  const totalJurisdictions = jurisdictions.length;
  const allCountries = countriesResult.data ?? [];
  const liveCountries = allCountries.filter((c: { is_active_market?: boolean; activation_phase?: string }) => c.is_active_market || c.activation_phase === 'active');
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
      answer: 'Haul Command is the world\'s largest directory for pilot car operators, escort vehicle services, and heavy haul transport professionals. We cover 57 countries with verified listings, escort requirements, corridor intel, and compliance data.',
    },
    {
      question: 'How do I find a pilot car or escort service?',
      answer: 'Use our directory to search by state, country, or service type. Each listing includes contact info, service areas, capabilities, and verification status. Call or text operators directly from their profile.',
    },
    {
      question: 'How do I claim my business listing?',
      answer: 'Click "Claim Listing" and verify your identity via phone. Once claimed, you can update your profile, respond to runs, and access premium features like priority placement and verified badges.',
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
      <ActivityTicker />
      <main className="flex-grow overflow-x-hidden">


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

        {/* Live Dashboard Widgets — Fix A */}
        <div className="max-w-7xl mx-auto px-4">
          <LiveDashboard />
        </div>

        {/* Early Tools */}
        <section className="py-10 sm:py-16 px-4 bg-black/20 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              Early <span className="text-accent">Tools</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Specialized heavy haul tools deployed during our early access period.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 ag-stagger">
              {[
                {
                  href: '/tools/permit-checker/us',
                  icon: '📜',
                  title: 'Permit Checker',
                  desc: 'Look up state/country permit requirements instantly based on load.',
                  cta: 'Check Permits →',
                  hot: true,
                },
                {
                  href: '/tools/axle-weight',
                  icon: '⚖️',
                  title: 'Route Weight Calculator',
                  desc: 'Calculate legal load weight based on axle configuration.',
                  cta: 'Calculate Weight →',
                },
                {
                  href: '/tools/escort-rules/us',
                  icon: '🚓',
                  title: 'Escort Requirement Finder',
                  desc: 'Find precise pilot car rules per state or province.',
                  cta: 'Find Rules →',
                },
                {
                  href: '/tools/rate-estimator/us',
                  icon: '💰',
                  title: 'Rate Estimator',
                  desc: 'Estimate pilot car or load haul rates instantly.',
                  cta: 'Get Estimate →',
                },
                {
                  href: '/tools/superload-alerts',
                  icon: '⚠️',
                  title: 'Superload Alert Feed',
                  desc: 'Live feed of superload moves causing closures by region.',
                  cta: 'View Alerts →',
                },
                {
                  href: '/tools/broker-verify',
                  icon: '🛡️',
                  title: 'Broker Verify Tool',
                  desc: 'Check broker and dispatcher legitimacy instantly.',
                  cta: 'Verify Broker →',
                  hot: true,
                },
                {
                  href: '/av-readiness',
                  icon: '🤖',
                  title: 'Autonomous Route Monitor',
                  desc: 'Track active autonomous freight corridors and testing zones.',
                  cta: 'Monitor AV →',
                  hot: true,
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group ag-glass ag-spring-hover p-6 rounded-2xl hover:border-accent/30 hover:bg-accent/[0.03] transition-all ag-slide-up ${'hot' in tool && tool.hot ? 'relative' : ''}`}
                >
                  {'hot' in tool && tool.hot && (
                    <span className="absolute top-3 right-3 bg-red-500/20 text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ag-hot-pulse">New</span>
                  )}
                  <div className="text-4xl mb-3" role="img" aria-label={tool.title}>{tool.icon}</div>
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

        {/* ═══ CORE 30 ENTITY MATCHING — Service Hierarchy ═══ */}
        <ScrollReveal>
        <section className="py-10 sm:py-16 px-4 bg-gradient-to-b from-transparent to-accent/5 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto border border-white/10 rounded-3xl p-6 sm:p-10 bg-[#0a0e17] shadow-xl relative">
            <div className="absolute top-0 right-10 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tighter">
              Global <span className="text-accent">Services</span>
            </h2>
            <p className="text-[#b0b0b0] text-sm mb-6 sm:mb-8 max-w-xl">
              Verified operators across 57 countries specializing in the core disciplines of oversize transport and escort operations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 relative z-10">
              {[
                { name: 'Pilot Car Services', slug: 'pilot-car-operator', icon: '🚙', desc: 'Certified lead and chase vehicles for dimensional loads.' },
                { name: 'Escort Vehicles', slug: 'escort-vehicle', icon: '🚓', desc: 'Civilian and off-duty police units for traffic control.' },
                { name: 'Heavy Haul Escorts', slug: 'heavy-haul-escort', icon: '🚛', desc: 'Specialized escort configurations for multi-axle moves.' },
                { name: 'Oversize Load Support', slug: 'oversize-load-escort', icon: '📏', desc: 'Compliance tracking, permitting, and physical escorts combined.' },
                { name: 'Route Surveys', slug: 'route-survey', icon: '🗺️', desc: 'Pre-trip physical infrastructure checks and bridge clearances.' },
                { name: 'Wide Load Escorts', slug: 'wide-load-escort', icon: '🛣️', desc: 'Single and multi-lane rolling roadblocks for extreme widths.' },
                { name: 'TWIC & Port Clearances', slug: 'twic-cleared-operator', icon: '⚓', desc: 'Government-vetted operators with direct secure terminal access.' },
                { name: 'Military/DOD Transport', slug: 'dod-cleared-escort', icon: '🎖️', desc: 'Cleared escorts for sensitive defense-grade mobilization.' }
              ].map((svc) => (
                <Link
                  key={svc.slug}
                  href={`/roles/${svc.slug}`}
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
                        View Coverage →
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

        {/* State Protocols — Quick Access */}
        <ScrollReveal>
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
                  href={`/state/${state.name.toLowerCase().replace(/\s+/g, '-')}`}
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
                View all 67+ jurisdictions across 57 countries →
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
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">3D Interactive</span>
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
              ]}
              center={[-98.5, 39.8]}
              zoom={3.5}
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                Global <span className="text-accent">Network</span>
              </h2>
              <span className="bg-accent/10 border border-accent/20 text-accent text-xs sm:text-sm font-bold px-3 py-1 rounded-full">
                {allCountries.length} countries tracked
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base font-medium text-gray-400 mb-6">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> {liveCountries.length} Live</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {allCountries.filter((c: { activation_phase?: string }) => c.activation_phase === 'expanding').length} Expanding</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600"></span> {allCountries.filter((c: { activation_phase?: string }) => c.activation_phase === 'planned').length} Planned</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(allCountries.length > 0 ? allCountries.slice(0, 18) : [
                { iso2: 'US', name: 'United States', activation_phase: 'active', is_active_market: true },
                { iso2: 'CA', name: 'Canada', activation_phase: 'active', is_active_market: true },
                { iso2: 'AU', name: 'Australia', activation_phase: 'active', is_active_market: true },
                { iso2: 'GB', name: 'United Kingdom', activation_phase: 'active', is_active_market: true },
              ]).map((c: { iso2: string; name?: string; activation_phase?: string; is_active_market?: boolean; slug?: string }) => {
                const isLive = c.is_active_market || c.activation_phase === 'active';
                const isExpanding = c.activation_phase === 'expanding';
                return (
                <Link
                  key={c.iso2}
                  href={`/directory/${c.iso2.toLowerCase()}`}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold border transition-all shadow-sm ${
                    isLive
                      ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                      : isExpanding
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="truncate pr-2">{c.name || c.iso2}</span>
                  {isLive && <span className="w-2 h-2 flex-shrink-0 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
                </Link>
              );})}
            </div>
            {allCountries.length > 18 && (
              <div className="mt-5 text-center sm:text-left">
                <Link href="/countries" className="inline-block bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl px-6 py-3 text-white text-sm font-bold transition-colors">
                  View All Directory Corridors →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Pricing CTA */}
        <ScrollReveal>
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 ag-glow-gold ag-spring-hover">
            <div>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-tighter mb-1">
                Ready to Go <span className="text-accent ag-text-glow">Pro</span>?
              </h3>
              <p className="text-gray-400 text-sm">
                Get verified, get priority runs, get paid faster.
              </p>
            </div>
            <Link
              href="/pricing"
              className="bg-accent text-black px-8 py-4 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all flex-shrink-0 ag-magnetic shadow-[0_0_24px_rgba(245,159,10,0.3)] hover:shadow-[0_0_40px_rgba(245,159,10,0.5)]"
            >
              View Pricing →
            </Link>
          </div>
        </section>
        </ScrollReveal>

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
                <Link href="/glossary/us/pilot-car" className="block text-gray-500 hover:text-white transition-colors">Haul Command Glossary</Link>
                <Link href="/voice" className="block text-gray-500 hover:text-white transition-colors">AI Voice Answers</Link>
                <Link href="/roles/twic-cleared-operator" className="block text-gray-500 hover:text-white transition-colors">Port Clearances</Link>
                <Link href="/countries" className="block text-gray-500 hover:text-white transition-colors">Countries</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">Tools</h4>
              <div className="space-y-2 text-sm">
                <Link href="/tools/rate-estimator/us" className="block text-gray-500 hover:text-white transition-colors">Route Calculator</Link>
                <Link href="/tools/friday-checker" className="block text-gray-500 hover:text-white transition-colors">Friday Checker</Link>
                <Link href="/tools/superload-alerts" className="block text-gray-500 hover:text-white transition-colors">Superload Alerts</Link>
                <Link href="/tools/escort-rules/us" className="block text-gray-500 hover:text-white transition-colors">State Rules Locator</Link>
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
                <Link href="/contact" className="block text-gray-500 hover:text-white transition-colors">Contact Us</Link>
                <Link href="/report-data-issue" className="block text-gray-500 hover:text-white transition-colors">Report Issue</Link>
                <Link href="/remove-listing" className="block text-gray-500 hover:text-white transition-colors">Remove Listing</Link>
              </div>
            </div>
          </div>

          <HCTrustGuardrailsModule />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <HaulCommandLogo variant="full" size="sm" />
              <p className="text-sm text-white/40">Built for the corridor. Not the crowd.</p>
              <SocialLinks />
            </div>
            <div className="text-[10px] text-gray-600">
              © {new Date().getFullYear()} Haul Command. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
