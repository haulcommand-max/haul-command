import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MapPin, Phone, Shield, Star, Truck, Clock, Search, ChevronRight, Globe, Zap } from 'lucide-react';
import { NativeAdCard } from '@/components/ads/NativeAdCard';
import { EmailSubscribe } from '@/components/blog/EmailSubscribe';
import { ShareButton } from '@/components/social/ShareButton';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { PostLoadCTA, OperatorsNeededCTA, ClaimListingCTA } from '@/components/seo/ConversionCTAs';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { GeoAuthorityFloor } from '@/components/seo/GeoAuthorityFloor';
import { GeoMarketplaceHero } from '@/components/seo/GeoMarketplaceHero';
import { StaticRadarMap } from '@/components/seo/StaticRadarMap';
import { CitySponsorshipCTA } from '@/components/monetization/CitySponsorshipCTA';
import { DirectoryActivityFeed } from '@/components/social/DirectoryActivityFeed';
import SocialProofBanner from '@/components/social/SocialProofBanner';
import { AdGridCurfewHotelBooking } from '@/components/ads/AdGridCurfewHotelBooking';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { TakeoverSponsorBanner } from '@/components/ads/TakeoverSponsorBanner';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';

// ── Top 50 US cities for programmatic generation ──
const TOP_US_CITIES: Record<string, { name: string; state: string; stateCode: string; lat: number; lng: number }> = {
  'houston-tx': { name: 'Houston', state: 'Texas', stateCode: 'TX', lat: 29.76, lng: -95.37 },
  'dallas-tx': { name: 'Dallas', state: 'Texas', stateCode: 'TX', lat: 32.78, lng: -96.80 },
  'san-antonio-tx': { name: 'San Antonio', state: 'Texas', stateCode: 'TX', lat: 29.42, lng: -98.49 },
  'austin-tx': { name: 'Austin', state: 'Texas', stateCode: 'TX', lat: 30.27, lng: -97.74 },
  'los-angeles-ca': { name: 'Los Angeles', state: 'California', stateCode: 'CA', lat: 34.05, lng: -118.24 },
  'san-francisco-ca': { name: 'San Francisco', state: 'California', stateCode: 'CA', lat: 37.77, lng: -122.42 },
  'san-diego-ca': { name: 'San Diego', state: 'California', stateCode: 'CA', lat: 32.72, lng: -117.16 },
  'phoenix-az': { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ', lat: 33.45, lng: -112.07 },
  'chicago-il': { name: 'Chicago', state: 'Illinois', stateCode: 'IL', lat: 41.88, lng: -87.63 },
  'miami-fl': { name: 'Miami', state: 'Florida', stateCode: 'FL', lat: 25.76, lng: -80.19 },
  'orlando-fl': { name: 'Orlando', state: 'Florida', stateCode: 'FL', lat: 28.54, lng: -81.38 },
  'tampa-fl': { name: 'Tampa', state: 'Florida', stateCode: 'FL', lat: 27.95, lng: -82.46 },
  'jacksonville-fl': { name: 'Jacksonville', state: 'Florida', stateCode: 'FL', lat: 30.33, lng: -81.66 },
  'atlanta-ga': { name: 'Atlanta', state: 'Georgia', stateCode: 'GA', lat: 33.75, lng: -84.39 },
  'denver-co': { name: 'Denver', state: 'Colorado', stateCode: 'CO', lat: 39.74, lng: -104.99 },
  'seattle-wa': { name: 'Seattle', state: 'Washington', stateCode: 'WA', lat: 47.61, lng: -122.33 },
  'portland-or': { name: 'Portland', state: 'Oregon', stateCode: 'OR', lat: 45.52, lng: -122.68 },
  'las-vegas-nv': { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV', lat: 36.17, lng: -115.14 },
  'nashville-tn': { name: 'Nashville', state: 'Tennessee', stateCode: 'TN', lat: 36.16, lng: -86.78 },
  'memphis-tn': { name: 'Memphis', state: 'Tennessee', stateCode: 'TN', lat: 35.15, lng: -90.05 },
  'charlotte-nc': { name: 'Charlotte', state: 'North Carolina', stateCode: 'NC', lat: 35.23, lng: -80.84 },
  'raleigh-nc': { name: 'Raleigh', state: 'North Carolina', stateCode: 'NC', lat: 35.78, lng: -78.64 },
  'new-york-ny': { name: 'New York', state: 'New York', stateCode: 'NY', lat: 40.71, lng: -74.01 },
  'philadelphia-pa': { name: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', lat: 39.95, lng: -75.17 },
  'pittsburgh-pa': { name: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA', lat: 40.44, lng: -79.99 },
  'detroit-mi': { name: 'Detroit', state: 'Michigan', stateCode: 'MI', lat: 42.33, lng: -83.05 },
  'indianapolis-in': { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN', lat: 39.77, lng: -86.16 },
  'columbus-oh': { name: 'Columbus', state: 'Ohio', stateCode: 'OH', lat: 39.96, lng: -82.99 },
  'cleveland-oh': { name: 'Cleveland', state: 'Ohio', stateCode: 'OH', lat: 41.50, lng: -81.69 },
  'kansas-city-mo': { name: 'Kansas City', state: 'Missouri', stateCode: 'MO', lat: 39.10, lng: -94.58 },
  'st-louis-mo': { name: 'St. Louis', state: 'Missouri', stateCode: 'MO', lat: 38.63, lng: -90.20 },
  'oklahoma-city-ok': { name: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK', lat: 35.47, lng: -97.52 },
  'tulsa-ok': { name: 'Tulsa', state: 'Oklahoma', stateCode: 'OK', lat: 36.15, lng: -95.99 },
  'new-orleans-la': { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA', lat: 29.95, lng: -90.07 },
  'baton-rouge-la': { name: 'Baton Rouge', state: 'Louisiana', stateCode: 'LA', lat: 30.45, lng: -91.19 },
  'minneapolis-mn': { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', lat: 44.98, lng: -93.27 },
  'milwaukee-wi': { name: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', lat: 43.04, lng: -87.91 },
  'salt-lake-city-ut': { name: 'Salt Lake City', state: 'Utah', stateCode: 'UT', lat: 40.76, lng: -111.89 },
  'albuquerque-nm': { name: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', lat: 35.08, lng: -106.65 },
  'birmingham-al': { name: 'Birmingham', state: 'Alabama', stateCode: 'AL', lat: 33.52, lng: -86.80 },
  'richmond-va': { name: 'Richmond', state: 'Virginia', stateCode: 'VA', lat: 37.54, lng: -77.44 },
  'norfolk-va': { name: 'Norfolk', state: 'Virginia', stateCode: 'VA', lat: 36.85, lng: -76.29 },
  'louisville-ky': { name: 'Louisville', state: 'Kentucky', stateCode: 'KY', lat: 38.25, lng: -85.76 },
  'sacramento-ca': { name: 'Sacramento', state: 'California', stateCode: 'CA', lat: 38.58, lng: -121.49 },
  'el-paso-tx': { name: 'El Paso', state: 'Texas', stateCode: 'TX', lat: 31.76, lng: -106.45 },
  'midland-tx': { name: 'Midland', state: 'Texas', stateCode: 'TX', lat: 31.99, lng: -102.08 },
  'boise-id': { name: 'Boise', state: 'Idaho', stateCode: 'ID', lat: 43.62, lng: -116.21 },
  'omaha-ne': { name: 'Omaha', state: 'Nebraska', stateCode: 'NE', lat: 41.26, lng: -95.94 },
  'des-moines-ia': { name: 'Des Moines', state: 'Iowa', stateCode: 'IA', lat: 41.59, lng: -93.62 },
  'little-rock-ar': { name: 'Little Rock', state: 'Arkansas', stateCode: 'AR', lat: 34.75, lng: -92.29 },
};

// ── Static generation ──
export async function generateStaticParams() {
  return Object.keys(TOP_US_CITIES).map((slug) => ({ slug }));
}

// ── Dynamic metadata ──
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = TOP_US_CITIES[slug];
  if (!city) return { title: 'Pilot Car Near You | Haul Command' };

  const title = `Pilot Car & Escort Vehicle Services Near ${city.name}, ${city.stateCode} | Haul Command`;
  const description = `Find verified pilot car operators, escort vehicle providers, and oversize load escorts near ${city.name}, ${city.state}. Real-time availability, instant booking, trust-verified providers. Haul Command covers 120 countries.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.haulcommand.com/near/${slug}`,
      siteName: 'Haul Command',
      type: 'website',
    },
    alternates: { canonical: `https://www.haulcommand.com/near/${slug}` },
  };
}

// ── FAQ data for structured markup ──
function getFAQs(cityName: string, stateCode: string, stateName: string) {
  return [
    {
      question: `How do I find a pilot car near ${cityName}, ${stateCode}?`,
      answer: `Use the Haul Command directory to search for verified pilot car operators near ${cityName}, ${stateName}. Filter by availability, trust score, and service type. You can also call operators directly or request quotes through the platform.`,
    },
    {
      question: `How much does a pilot car cost in ${stateName}?`,
      answer: `Pilot car rates in ${stateName} typically range from $1.50–$3.00/mile depending on route complexity, load dimensions, and local requirements. Use Haul Command's rate calculator for corridor-specific pricing intelligence.`,
    },
    {
      question: `Do I need a pilot car for oversize loads in ${stateName}?`,
      answer: `${stateName} has specific escort vehicle requirements based on load width, height, length, and weight. Loads exceeding certain thresholds require one or more pilot cars. Check the ${stateName} escort requirements page on Haul Command for exact thresholds.`,
    },
    {
      question: `How do I become a pilot car operator in ${stateName}?`,
      answer: `Requirements vary by state. In ${stateName}, you typically need proper vehicle equipment (flags, signs, lights), insurance, and may need state-specific certification. Claim your profile on Haul Command to start receiving job opportunities.`,
    },
    {
      question: `What services do escort vehicle providers offer near ${cityName}?`,
      answer: `Escort vehicle providers near ${cityName} offer pilot car services, high pole operations, route surveys, rear chase escorts, and police escort coordination. Many operators on Haul Command offer multiple services and are available for same-day dispatch.`,
    },
  ];
}

export default async function NearCityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Handle old radius format first
  const radiusMatch = slug.match(/^(.+)-(\d+)-miles$/);
  if (radiusMatch) {
    // Redirect to new format or handle
    const citySlug = radiusMatch[1];
    const radius = radiusMatch[2];
    // For now, show the city page without radius
  }

  const city = TOP_US_CITIES[slug];
  if (!city) notFound();

  // Get real operator counts
  const supabase = createClient();
  const { count: operatorCount } = await supabase
    .from('hc_global_operators')
    .select('*', { count: 'estimated', head: true })
    .ilike('state', city.stateCode);

  // Get nearby cities from same state
  const stateKey = city.stateCode.toLowerCase();
  const nearbyCities = Object.entries(TOP_US_CITIES)
    .filter(([s, c]) => c.stateCode === city.stateCode && s !== slug)
    .map(([s, c]) => ({ slug: s, ...c }));

  const faqs = getFAQs(city.name, city.stateCode, city.state);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Pilot Car Services Near ${city.name}`,
    description: `Verified pilot car and escort vehicle operators near ${city.name}, ${city.state}. Real-time availability and instant booking through Haul Command.`,
    url: `https://www.haulcommand.com/near/${slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.stateCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.lat,
      longitude: city.lng,
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
      geoRadius: '80467', // 50 miles in meters
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text font-display">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs text-hc-subtle">
          <Link href="/" className="hover:text-hc-gold-400 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/directory" className="hover:text-hc-gold-400 transition-colors">Directory</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/united-states/${city.stateCode.toLowerCase()}`} className="hover:text-hc-gold-400 transition-colors">{city.state}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-hc-gold-500 font-bold">{city.name}</span>
        </nav>

        {/* ── GeoMarketplaceHero — above-fold conversion hero ── */}
        <GeoMarketplaceHero
          cityName={city.name}
          regionName={city.state}
          activeDrivers={operatorCount || 3}
          activeLoads={Math.max(5, Math.floor(Math.random() * 15) + 3)}
          supplyGapScore={0.6}
        />

        {/* ── Hero ── */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-full text-xs font-bold text-hc-gold-500 uppercase tracking-[0.2em]">
            <MapPin className="w-3.5 h-3.5" />
            {city.name}, {city.stateCode}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-[-0.03em] leading-none">
            Pilot Car & Escort Services
            <br />
            <span className="text-hc-gold-500">Near {city.name}</span>
          </h1>
          <p className="text-lg text-hc-muted max-w-2xl mx-auto">
            Find verified pilot car operators, escort vehicle providers, and oversize load escorts
            near {city.name}, {city.state}. Real-time availability. Instant booking. Trust-verified.
          </p>
        </div>

        {/* ── Quick Stats Bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Truck, label: 'Operators in ' + city.stateCode, value: operatorCount?.toLocaleString() || '—' },
            { icon: Globe, label: 'Countries Covered', value: '120' },
            { icon: Shield, label: 'Trust Verified', value: '✓' },
            { icon: Zap, label: 'Dispatch', value: 'Real-Time' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-4 bg-hc-surface border border-hc-border rounded-2xl hover:border-hc-gold-500/30 transition-colors">
              <stat.icon className="w-5 h-5 text-hc-gold-500 mb-2" />
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-[10px] text-hc-muted uppercase tracking-[0.15em] font-bold text-center">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── CTA Section ── */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link
            href={`/directory?state=${city.stateCode}`}
            className="px-8 py-4 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold text-sm uppercase tracking-widest rounded-xl transition-all hover:shadow-gold-sm"
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search {city.stateCode} Operators
          </Link>
          <Link
            href="/available-now"
            className="px-8 py-4 bg-hc-surface border border-hc-gold-500/30 text-hc-gold-500 font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-hc-gold-500/5 transition-all"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Available Now
          </Link>
        </div>

        {/* ── Radar Map — visual authority signal ── */}
        <StaticRadarMap
          cityName={city.name}
          state={city.stateCode}
          radiusMiles={50}
          activeDrivers={operatorCount || 3}
        />

        {/* ── Services Available ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hc-border" />
            <h2 className="text-xs font-black text-hc-muted uppercase tracking-[0.25em]">Services Near {city.name}</h2>
            <div className="h-px flex-1 bg-hc-border" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'Pilot Car', desc: 'Lead & follow escort vehicles', slug: 'pilot-car' },
              { name: 'High Pole', desc: 'Height clearance verification', slug: 'high-pole' },
              { name: 'Route Survey', desc: 'Pre-move route assessment', slug: 'route-survey' },
              { name: 'Rear Chase', desc: 'Trailing escort protection', slug: 'rear-chase' },
              { name: 'Oversize Escort', desc: 'Wide load escort teams', slug: 'escort-vehicle' },
              { name: 'Bucket Truck', desc: 'Utility line lifting', slug: 'bucket-truck' },
            ].map(svc => (
              <Link
                key={svc.slug}
                href={`/directory?state=${city.stateCode}&service=${svc.slug}`}
                className="group p-5 bg-hc-surface border border-hc-border rounded-2xl hover:border-hc-gold-500/40 hover:shadow-gold-sm transition-all"
              >
                <h3 className="text-sm font-bold text-white group-hover:text-hc-gold-400 transition-colors">{svc.name}</h3>
                <p className="text-xs text-hc-muted mt-1">{svc.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Requirements & Compliance with AI Answer Block ── */}
        <section className="p-8 bg-hc-surface border border-hc-gold-500/20 rounded-2xl space-y-4">
          <StaticAnswerBlock
            question={`Do you need a pilot car for oversize loads in ${city.state}?`}
            answer={`${city.state} has specific regulations for pilot car and escort vehicle operations. Requirements typically include proper vehicle equipment (flags, signs, amber lights), insurance coverage, and may require state-specific certification or training. Load dimensions that trigger escort requirements vary by width, height, length, and weight.`}
            confidence="verified_but_review_due"
            source={`${city.stateCode} DOT`}
            sourceUrl={`/requirements/${city.stateCode.toLowerCase()}/escort-vehicle-rules`}
            ctaLabel={`View ${city.stateCode} Requirements`}
            ctaUrl={`/requirements/${city.stateCode.toLowerCase()}/escort-vehicle-rules`}
          />
          <Link
            href={`/requirements?state=${city.stateCode}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-hc-elevated text-hc-gold-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-hc-gold-500/10 transition-all"
          >
            View {city.stateCode} Requirements
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* ── Live Market Data — GeoAuthorityFloor ── */}
        <GeoAuthorityFloor
          citySlug={slug}
          cityName={city.name}
          stateName={city.state}
        />

        {/* ── Nearby Cities ── */}
        {nearbyCities.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-hc-border" />
              <h2 className="text-xs font-black text-hc-muted uppercase tracking-[0.25em]">Nearby Cities in {city.state}</h2>
              <div className="h-px flex-1 bg-hc-border" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {nearbyCities.map(nc => (
                <Link
                  key={nc.slug}
                  href={`/near/${nc.slug}`}
                  className="group flex items-center justify-between p-4 bg-hc-surface border border-hc-border rounded-2xl hover:border-hc-gold-500/40 hover:shadow-gold-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-hc-elevated flex items-center justify-center group-hover:bg-hc-gold-500/10 transition-colors">
                      <MapPin className="w-4 h-4 text-hc-gold-500" />
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-hc-gold-400 transition-colors">{nc.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-hc-subtle group-hover:text-hc-gold-500 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ Section (SEO snippets) ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hc-border" />
            <h2 className="text-xs font-black text-hc-muted uppercase tracking-[0.25em]">Frequently Asked Questions</h2>
            <div className="h-px flex-1 bg-hc-border" />
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-hc-surface border border-hc-border rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-hc-elevated/50 transition-colors">
                  <h3 className="text-sm font-bold text-white pr-4">{faq.question}</h3>
                  <ChevronRight className="w-4 h-4 text-hc-subtle group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 pt-0">
                  <p className="text-sm text-hc-muted leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Claim CTA ── */}
        <section className="p-8 bg-gradient-to-br from-hc-gold-500/10 to-hc-gold-500/5 border border-hc-gold-500/20 rounded-2xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Are you a pilot car operator near {city.name}?
          </h2>
          <p className="text-sm text-hc-muted max-w-lg mx-auto">
            Claim your free profile on Haul Command to appear in searches, receive job opportunities,
            and build your verified reputation in the heavy haul industry.
          </p>
          <Link
            href="/claim"
            className="inline-block px-8 py-4 bg-hc-gold-500 text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-hc-gold-400 transition-all hover:shadow-gold-sm"
          >
            Claim Your Profile — Free
          </Link>
        </section>

        {/* ── AdGrid Placement: near-me-bottom (inline) ── */}
        <NativeAdCard
          placementId="near-me-bottom"
          surface="near_me"
          variant="inline"
          jurisdiction={city.stateCode}
        />

        {/* ── Email Capture (event: lead_capture / near_me_page) ── */}
        <EmailSubscribe
          title={`Get ${city.name} Corridor Alerts`}
          description={`Be first to know when high-paying loads move through ${city.name}, ${city.stateCode}. Free signup.`}
          ctaText="Get Alerts"
          source={`near_me_${city.stateCode.toLowerCase()}`}
        />

        {/* ── Share (event: share_intent / near_me) ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-hc-subtle">Know an operator in this area? Share this page.</span>
          <ShareButton
            title={`Pilot Car Services Near ${city.name}, ${city.stateCode}`}
            text={`Find verified pilot car and escort services near ${city.name} on Haul Command.`}
            context="directory"
          />
        </div>

        {/* ── Conversion CTAs — from SEO arsenal ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PostLoadCTA corridorName={`${city.name}, ${city.stateCode}`} variant="card" />
          <OperatorsNeededCTA surfaceName={`${city.name}, ${city.stateCode}`} />
        </div>

        {/* ── AdGrid — Near Me Bottom ── */}
        <AdGridSlot zone="near_me_bottom" />

        {/* ── Cross-links (SEO interlinking) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { href: '/directory', label: 'Full Directory' },
            { href: '/glossary', label: 'Glossary (280+ terms)' },
            { href: '/rates', label: 'Rate Intelligence' },
            { href: '/training', label: 'Training & Certification' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="p-4 bg-hc-surface border border-hc-border rounded-2xl text-xs font-bold text-hc-subtle uppercase tracking-widest hover:text-hc-gold-500 hover:border-hc-gold-500/30 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Snippet Injector — featured snippet capture ── */}
        <SnippetInjector
          blocks={['definition', 'faq', 'cost_range', 'regulation_summary']}
          term="pilot car"
          geo={city.state}
          country="US"
        />

        {/* ── Social Proof Banner — perceived value ── */}
        <SocialProofBanner />

        {/* ── Live Activity Feed — social gravity ── */}
        <div className="flex justify-center">
          <DirectoryActivityFeed />
        </div>

        {/* ── City Sponsorship CTA — monetization ── */}
        <CitySponsorshipCTA
          cityName={city.name}
          regionName={city.state}
          pricePerMonth={149}
        />

        {/* ── Curfew Hotel Booking — "Sleep Here" widget ── */}
        <AdGridCurfewHotelBooking
          sunset_time="18:45"
          minutes_to_sunset={38}
          location={`${city.name}, ${city.stateCode}`}
          offers={[
            {
              id: 'hotel-1',
              name: `${city.name} Truck Inn`,
              type: 'hotel',
              distance_miles: 2.3,
              price_night: 89,
              rating: 4.2,
              amenities: ['Truck Parking', 'Wi-Fi', 'Laundry'],
              accepts_crypto: false,
              book_url: `/near/${slug}/lodging`,
            },
            {
              id: 'yard-1',
              name: `${city.stateCode} Secure Staging Yard`,
              type: 'staging_yard',
              distance_miles: 4.8,
              price_night: 45,
              rating: 4.5,
              amenities: ['24/7 Security', 'Power Hookup'],
              accepts_crypto: true,
              book_url: `/near/${slug}/yards`,
            },
          ]}
        />
      </div>

      {/* ── City Launch Sponsor ── */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <TakeoverSponsorBanner
          level="city"
          territory={city.name}
          pricePerMonth={199}
        />
      </div>

      {/* ── Data Teaser Strip ── */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-8">
        <DataTeaserStrip geo={city.name} />
      </div>
    </div>
  );
}
