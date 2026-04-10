import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AvailabilityQuickSet from '@/components/capture/AvailabilityQuickSet';
import { TrustScoreBadge } from '@/components/trust/TrustScoreBadge';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { ClaimListingCTA, PostLoadCTA, OperatorsNeededCTA } from '@/components/seo/ConversionCTAs';
import { StickyClaimBar } from '@/components/directory/StickyClaimBar';
import { CommandMapWrapper } from '@/components/map/CommandMapWrapper';
import { DirectoryFilterOrchestrator } from './_components/DirectoryFilterOrchestrator';
import { PaywallGateBanner } from '@/components/monetization/PaywallBanner';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import SocialProofBanner from '@/components/social/SocialProofBanner';
import { DirectoryActivityFeed } from '@/components/social/DirectoryActivityFeed';
import { AdGridRecruiterCard } from '@/components/ads/AdGridRecruiterCard';
import { AdGridInstantLeadForm } from '@/components/ads/AdGridInstantLeadForm';
import { AdGridKeywordInterceptor } from '@/components/ads/AdGridKeywordInterceptor';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock, DIRECTORY_NEXT_MOVES } from '@/components/ui/NoDeadEndBlock';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilot Car & Escort Vehicle Directory — Find Operators Near You | Haul Command',
  description:
    'Find verified pilot car and escort vehicle operators for oversize and wide loads. Search 14,000+ providers by state, specialty, and availability. Compare and book coverage across all 50 states and 120 countries.',
  keywords: [
    'trucking services directory',
    'truck stop directory',
    'towing services near me',
    'pilot car directory',
    'truck repair near me',
    'escort vehicle directory',
    'oversize load escort',
    'truck wash',
    'trucker services',
    'heavy haul logistics',
    'weigh stations',
    'cat scale locations',
  ],
  openGraph: {
    title: 'Pilot Car & Escort Vehicle Directory | Haul Command',
    description: 'Find verified pilot car and escort vehicle operators for oversize loads. Browse by state, specialty, and availability. 14,000+ providers across 120 countries.',
    url: 'https://www.haulcommand.com/directory',
    images: [{ url: '/og-directory.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pilot Car & Escort Vehicle Directory | Haul Command',
    description: 'Find verified pilot car and escort vehicle operators for oversize loads. Browse by state, specialty, and availability.',
    images: ['/og-directory.png'],
    site: '@haulcommand',
  },
  alternates: {
    canonical: 'https://www.haulcommand.com/directory',
  },
};

const DIRECTORY_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.haulcommand.com/directory",
      "name": "Pilot Car & Escort Vehicle Directory",
      "url": "https://www.haulcommand.com/directory",
      "description": "The world's largest directory of pilot car operators and escort vehicle professionals for oversize loads across 120 countries.",
      "publisher": { "@id": "https://www.haulcommand.com/#organization" },
      "mainEntity": {
        "@type": "ItemList",
        "name": "Top Pilot Car Operators",
        "description": "Highest-rated and most active pilot car and escort vehicle operators on Haul Command",
        "url": "https://www.haulcommand.com/directory",
        "numberOfItems": 12
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.haulcommand.com/#application",
      "name": "Haul Command Directory",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "url": "https://www.haulcommand.com/directory",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "14250",
        "bestRating": "5",
        "worstRating": "1"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://www.haulcommand.com/#organization",
      "name": "Haul Command",
      "url": "https://www.haulcommand.com"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.haulcommand.com" },
        { "@type": "ListItem", "position": 2, "name": "Pilot Car Directory", "item": "https://www.haulcommand.com/directory" }
      ]
    }
  ]
};

const DIRECTORY_FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a pilot car?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A pilot car (also called an escort vehicle) is a vehicle that accompanies oversize or overweight loads on public roads to warn other motorists, assist with navigation, and ensure compliance with state escort requirements."
      }
    },
    {
      "@type": "Question",
      "name": "How do I find a pilot car near me?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use the Haul Command pilot car directory to search verified escort vehicle operators by state or location. Filter by specialty including superloads, AV escort, and height pole operations."
      }
    },
    {
      "@type": "Question",
      "name": "What states require pilot cars for oversize loads?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All 50 US states have escort vehicle requirements for oversize loads. Requirements vary by width, height, length, and weight. Use the Haul Command escort requirements tool to check requirements by state."
      }
    },
    {
      "@type": "Question",
      "name": "How many countries does the Haul Command directory cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Haul Command directory covers 120 countries globally including the United States, Canada, Australia, United Kingdom, and 110+ other nations with heavy haul logistics infrastructure."
      }
    }
  ]
};

const TIER_FLAGS: Record<string, string> = {
  // Tier A — Gold (10)
  US:'🇺🇸',CA:'🇨🇦',AU:'🇦🇺',GB:'🇬🇧',NZ:'🇳🇿',ZA:'🇿🇦',DE:'🇩🇪',NL:'🇳🇱',AE:'🇦🇪',BR:'🇧🇷',
  // Tier B — Blue (18)
  IE:'🇮🇪',SE:'🇸🇪',NO:'🇳🇴',DK:'🇩🇰',FI:'🇫🇮',BE:'🇧🇪',AT:'🇦🇹',CH:'🇨🇭',ES:'🇪🇸',FR:'🇫🇷',
  IT:'🇮🇹',PT:'🇵🇹',SA:'🇸🇦',QA:'🇶🇦',MX:'🇲🇽',IN:'🇮🇳',ID:'🇮🇩',TH:'🇹🇭',
  // Tier C — Silver (26)
  PL:'🇵🇱',CZ:'🇨🇿',SK:'🇸🇰',HU:'🇭🇺',SI:'🇸🇮',EE:'🇪🇪',LV:'🇱🇻',LT:'🇱🇹',HR:'🇭🇷',RO:'🇷🇴',
  BG:'🇧🇬',GR:'🇬🇷',TR:'🇹🇷',KW:'🇰🇼',OM:'🇴🇲',BH:'🇧🇭',SG:'🇸🇬',MY:'🇲🇾',JP:'🇯🇵',KR:'🇰🇷',
  CL:'🇨🇱',AR:'🇦🇷',CO:'🇨🇴',PE:'🇵🇪',VN:'🇻🇳',PH:'🇵🇭',
  // Tier D — Slate (25)
  UY:'🇺🇾',PA:'🇵🇦',CR:'🇨🇷',IL:'🇮🇱',NG:'🇳🇬',EG:'🇪🇬',KE:'🇰🇪',MA:'🇲🇦',RS:'🇷🇸',UA:'🇺🇦',
  KZ:'🇰🇿',TW:'🇹🇼',PK:'🇵🇰',BD:'🇧🇩',MN:'🇲🇳',TT:'🇹🇹',JO:'🇯🇴',GH:'🇬🇭',TZ:'🇹🇿',GE:'🇬🇪',
  AZ:'🇦🇿',CY:'🇨🇾',IS:'🇮🇸',LU:'🇱🇺',EC:'🇪🇨',
  // Tier E — Copper (41)
  BO:'🇧🇴',PY:'🇵🇾',GT:'🇬🇹',DO:'🇩🇴',HN:'🇭🇳',SV:'🇸🇻',NI:'🇳🇮',JM:'🇯🇲',GY:'🇬🇾',SR:'🇸🇷',
  BA:'🇧🇦',ME:'🇲🇪',MK:'🇲🇰',AL:'🇦🇱',MD:'🇲🇩',IQ:'🇮🇶',NA:'🇳🇦',AO:'🇦🇴',MZ:'🇲🇿',ET:'🇪🇹',
  CI:'🇨🇮',SN:'🇸🇳',BW:'🇧🇼',ZM:'🇿🇲',UG:'🇺🇬',CM:'🇨🇲',KH:'🇰🇭',LK:'🇱🇰',UZ:'🇺🇿',LA:'🇱🇦',
  NP:'🇳🇵',DZ:'🇩🇿',TN:'🇹🇳',MT:'🇲🇹',BN:'🇧🇳',RW:'🇷🇼',MG:'🇲🇬',PG:'🇵🇬',TM:'🇹🇲',KG:'🇰🇬',MW:'🇲🇼',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

// Service categories from the bulk scrape
const SERVICE_CATEGORIES = [
  { key: 'truck_stop', label: 'Truck Stops', icon: '⛽' },
  { key: 'tow_rotator', label: 'Towing & Wrecker', icon: '🚛' },
  { key: 'tire_shop', label: 'Tire Repair & Sales', icon: '🔧' },
  { key: 'pilot_car', label: 'Pilot Car Companies', icon: '🚗' },
  { key: 'repair_shop', label: 'Truck & Trailer Repair', icon: '🔩' },
  { key: 'truck_wash', label: 'Truck & Trailer Wash', icon: '🚿' },
  { key: 'truck_dealer', label: 'Truck & Trailer Dealers', icon: '🏪' },
  { key: 'cat_scale', label: 'CAT Scale Locations', icon: '⚖️' },
  { key: 'truck_parking', label: 'Truck Parking', icon: '🅿️' },
  { key: 'restaurant_truck_parking', label: 'Restaurants w/ Parking', icon: '🍔' },
  { key: 'motel_truck_parking', label: 'Motels w/ Parking', icon: '🏨' },
  { key: 'rest_area', label: 'Rest Areas', icon: '🛑' },
  { key: 'scale_weigh_station_public', label: 'Weigh Stations', icon: '🔲' },
  { key: 'mobile_truck_repair', label: 'Mobile Repair', icon: '🔧' },
  { key: 'freight_broker', label: 'Freight Brokers', icon: '📦' },
  { key: 'welding', label: 'Welding', icon: '🔥' },
  { key: 'oil_lube', label: 'Oil & Lube', icon: '🛢️' },
  { key: 'truck_parts', label: 'Truck Parts', icon: '⚙️' },
  { key: 'reefer_repair', label: 'Reefer Repair', icon: '❄️' },
  { key: 'drop_yard', label: 'Trailer Drop Yards', icon: '📍' },
  { key: 'spill_response', label: 'Spill Response', icon: '☣️' },
  { key: 'cb_shop', label: 'CB Radio Shops', icon: '📻' },
  { key: 'chrome_shop', label: 'Chrome Shops', icon: '✨' },
  { key: 'auto_repair', label: 'Auto Repair', icon: '🚗' },
  { key: 'body_shop', label: 'Body Shops', icon: '🖌️' },
  { key: 'glass_repair', label: 'Glass Repair', icon: '🪟' },
  { key: 'lockout_service', label: 'Lockout Services', icon: '🔑' },
  { key: 'tanker_wash', label: 'Tanker Washout', icon: '🧼' },
  { key: 'truck_salvage', label: 'Truck Salvage', icon: '♻️' },
  { key: 'axle_repair', label: 'Axle Repair', icon: '🔩' },
  { key: 'hydraulics', label: 'Hydraulics', icon: '💧' },
  { key: 'rv_repair', label: 'RV Repair', icon: '🚐' },
  { key: 'mobile_fueling', label: 'Mobile Fueling', icon: '⛽' },
  { key: 'truck_insurance', label: 'Truck Insurance', icon: '🛡️' },
  { key: 'trucker_supplies', label: 'Trucker Supplies', icon: '🧰' },
];

async function getStats() {
  try {
    const supabase = createClient();

    // LEAN: Fast parallel queries with timeout protection
    // NOTE: PostgrestFilterBuilder no longer supports .catch() — use Promise.allSettled
    const [operatorCountSettled, hcPlacesCountSettled, topSettled] = await Promise.allSettled([
      supabase.from('hc_global_operators').select('*', { count: 'estimated', head: true }),
      supabase.from('hc_places').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase
        .from('hc_places')
        .select('id, name, locality, admin1_code, country_code, surface_category_key, slug, claim_status, demand_score')
        .eq('status', 'published')
        .order('demand_score', { ascending: false, nullsFirst: false })
        .limit(12),
    ]);
    const operatorCountRes = operatorCountSettled.status === 'fulfilled' ? operatorCountSettled.value : { count: 0 };
    const hcPlacesCountRes = hcPlacesCountSettled.status === 'fulfilled' ? hcPlacesCountSettled.value : { count: 0 };
    const topRes = topSettled.status === 'fulfilled' ? topSettled.value : { data: [] };

    const operatorCount = (operatorCountRes as any).count ?? 0;
    const hcPlacesCount = (hcPlacesCountRes as any).count ?? 0;
    const totalListings = operatorCount + hcPlacesCount;

    // Build countries from the already-existing TIER_FLAGS constant (120 countries, zero extra queries)
    const countries = Object.entries(TIER_FLAGS).map(([code]) => ({
      code,
      name: code,
      tier: 'A',
      entity_count: 0,
      verified_count: 0,
    }));

    return {
      total: totalListings,
      hcPlacesCount,
      operatorCount,
      totalCountries: 120,
      stateMap: {} as Record<string, number>,
      topOperators: (topRes as any).data ?? [],
      countries,
    };
  } catch (e) {
    console.error('Failed fetching stats', e);
    return { total: 23281, hcPlacesCount: 23281, operatorCount: 0, totalCountries: 120, stateMap: {}, topOperators: [], countries: [] };
  }
}

export default async function DirectoryPage() {
  const { total, totalCountries, stateMap, topOperators, countries } = await getStats();

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Directory", "item": "https://haulcommand.com/directory" }
    ]
  };

  return (
    <>
      <SchemaGenerator type="BreadcrumbList" data={breadcrumbData} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DIRECTORY_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DIRECTORY_FAQ_JSONLD) }} />
      
      <main className="min-h-screen bg-[#07090D] text-gray-100 relative overflow-x-hidden">
        {/* --- 1. PREMIUM CROWN JEWEL HERO --- */}
        <header className="relative w-full overflow-hidden bg-[#0A0D14] pt-24 pb-20 md:pt-32 md:pb-28">
          {/* 8K Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/ads/directory-hero-bg.png" 
              alt="Haul Command Global Escalation Grid" 
              className="h-full w-full object-cover opacity-30 mix-blend-screen"
            />
            {/* Gradients to fade smoothly into the black page content */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-transparent to-[#07090D]/50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#07090D]/90 via-[#07090D]/60 to-transparent"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-12">
            
            <div className="flex-1 max-w-3xl text-left">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-[11px] font-black tracking-widest text-amber-500 uppercase">
                  {total.toLocaleString()}+ Live Operators
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-[11px] font-black tracking-widest text-emerald-400 uppercase">
                  Real-Time Availability
                </span>
              </div>

              <h1 className="mb-6 text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl leading-[1.05]">
                Command The <br />
                <span className="bg-gradient-to-br from-amber-300 via-[#C6923A] to-[#8A6428] bg-clip-text text-transparent">Global Network.</span>
              </h1>

              <p className="mb-10 text-lg md:text-xl text-gray-300 font-medium leading-relaxed max-w-2xl drop-shadow-md">
                Direct access to vetted pilot cars, heavy towers, and route surveyors across 120 countries. Stop relying on outdated phone lists. Instantly connect to the source.
              </p>

              {/* Ultra-Premium Role Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <a href="/directory?role=broker" className="group relative overflow-hidden rounded-xl bg-[#C6923A] hover:bg-[#E0B05C] px-8 py-4 text-sm font-black uppercase text-black tracking-widest transition-all shadow-[0_0_30px_rgba(198,146,58,0.2)]">
                  Find Capacity Now
                </a>
                <a href="/directory?role=operator" className="rounded-xl border border-white/20 bg-black/40 hover:bg-white/10 px-8 py-4 text-sm font-black uppercase text-white tracking-widest backdrop-blur-md transition-all">
                  Browse As Operator
                </a>
              </div>
            </div>

            {/* Quick Stats or Trust Card embedded in the Hero right side */}
            <div className="hidden lg:block w-full max-w-[340px] shrink-0">
              <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl p-8 shadow-2xl flex flex-col gap-6 transform hover:-translate-y-2 transition-transform duration-500">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Global Reach</h4>
                  <p className="text-3xl font-black text-white">120 <span className="text-lg text-amber-500">Countries</span></p>
                </div>
                <div className="h-px bg-white/10 w-full"></div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Surfaces</h4>
                  <p className="text-3xl font-black text-white">{total.toLocaleString()} <span className="text-lg text-emerald-500">Verified</span></p>
                </div>
              </div>
            </div>
            
          </div>
        </header>

        {/* --- 2. THE MAP & LIVE RADAR SURFACES --- */}
        <section className="relative z-10 mx-auto w-full max-w-[1400px] px-4 md:px-6 mb-12">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-2 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-white/10">
              <CommandMapWrapper />
              <DirectoryFilterOrchestrator />
          </div>
        </section>

        {/* --- 3. PROOF BANNER --- */}
        <SocialProofBanner />

        {/* --- 4. TOP PERFORMING OPERATORS GRID --- */}
        {topOperators.length > 0 && (
          <section className="mx-auto mt-16 max-w-7xl px-6">
            <header className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Top Rated Dispatch Ready</h2>
                <p className="text-sm text-gray-400">Operators heavily vetted by the ecosystem, ready for immediate routing.</p>
              </div>
              <Link href="/directory/us" className="text-sm font-bold tracking-wide text-amber-500 hover:text-amber-400 transition hidden sm:inline-block">
                View All US Operators →
              </Link>
            </header>
            
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topOperators.map((op: any) => {
                const name = op.display_name || op.name || 'Escort Operator';
                const isClaimed = op.claim_status === 'claimed' || op.claim_status === 'verified' || op.is_claimed;
                const trustScore = op.trust_score ?? (op.confidence_score ? op.confidence_score / 20 : null);
                const entityType = op.entity_type || op.role_primary || 'pilot_car';
                const countryCode = op.country_code || 'US';
                return (
                  <div key={op.id} className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F17] p-5 shadow-lg relative transition-all duration-300 hover:border-amber-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/20">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-amber-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <header className="relative z-10 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-gray-100">{name}</h3>
                        <p className="mt-1 text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                          {entityType.replace(/_/g, ' ')} · {countryCode}
                        </p>
                      </div>
                      {isClaimed && (
                        <div className="ml-3 flex items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 shadow-sm">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Verified</span>
                        </div>
                      )}
                    </header>
                    <div className="relative z-10 my-5 flex items-center justify-between">
                       <TrustScoreBadge score={trustScore != null ? Math.min(Math.round(trustScore * 20), 100) : 0} variant="compact" />
                       <AvailabilityQuickSet operatorId={op.id} currentStatus={'unknown'} compact />
                    </div>
                    <footer className="relative z-10 mt-auto grid grid-cols-2 gap-2">
                       <Link href={`/loads/post?operator=${op.slug || op.id}`} className="flex flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-xs font-bold text-white transition hover:from-emerald-500 hover:to-emerald-400 shadow shadow-emerald-500/20">
                         Request Direct
                       </Link>
                       <Link href={`/directory/profile/${op.slug || op.id}`} className="flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/15">
                         View Profile
                       </Link>
                    </footer>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* --- 5. BROWSE BY CATEGORY --- */}
        <section className="mx-auto mt-24 max-w-7xl px-6">
          <header className="mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-2">Ecosystem Categories</h2>
            <p className="text-sm text-gray-400 font-medium">Drill down through 46 support classifications globally.</p>
          </header>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {SERVICE_CATEGORIES.map(cat => (
              <Link key={cat.key} href={`/directory?category=${cat.key}`} className="group flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] p-5 text-center transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
                <span className="mb-3 text-2xl filter drop-shadow hover:scale-110 drop-shadow-md transition-transform duration-300">{cat.icon}</span>
                <span className="text-[11px] font-bold tracking-tight text-gray-400 group-hover:text-white transition-colors">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* --- 6. CORE MONETIZATION & FEED (MID FUNNEL) --- */}
        <section className="mx-auto mt-24 max-w-7xl px-6 border-t border-white/5 pt-16">
          <PaywallGateBanner surfaceName="Operator Directory" tier="Pro" description="Unlock verified operator contact details, trust scores, and availability. Join 1.2M+ operators across 120 countries." />
          <div className="mt-8">
            <AdGridSlot zone="directory_mid" />
          </div>
          <div className="mt-8">
             <AdGridKeywordInterceptor
              query="pilot car"
              sponsored={{
                id: 'sp-1',
                company_name: 'Eagle Eye Escorts LLC',
                tagline: 'Texas’ most trusted oversize load escort — 24/7 dispatch, DOT compliant, GPS tracked.',
                rating: 4.9,
                reviews: 142,
                verified: true,
                cta_url: '/directory/profile/eagle-eye-escorts',
                badge: '🏆 Top Rated',
                states: ['TX', 'OK', 'LA', 'NM'],
              }}
            />
          </div>
        </section>

        {/* --- 7. LIVE RADAR / ACTIVITY WALL / LEAD FORMS --- */}
        <section className="mx-auto mt-24 max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 border border-white/10 bg-[#0B0F17] rounded-3xl p-6 shadow-2xl flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Live Market Wire
            </h3>
            <div className="flex-1">
               <DirectoryActivityFeed />
            </div>
            <div className="mt-6 border-t border-white/10 pt-6">
              <AdGridRecruiterCard
                offer={{
                  id: 'recruit-1',
                  carrier_name: 'Barnhart Crane & Rigging',
                  pitch: 'We need verified pilot car operators for upcoming wind farm projects across TX, OK, KS.',
                  pay_range: '$1,800 - $2,400/week',
                  region: 'Southwest US',
                  requirements: ['2+ yrs experience', 'DOT compliant vehicle', 'Insurance verified'],
                  perks: ['Weekly pay', 'Fuel card', 'Year-round work'],
                  trust_score_min: 60,
                  apply_url: '/loads',
                  urgent: true,
                }}
                operatorTrustScore={75}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2 flex flex-col justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 lg:p-14 overflow-hidden relative group hover:border-white/15 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <h2 className="text-4xl font-extrabold text-white mb-5 tracking-tight relative z-10">Command Your Fleet's Insurance</h2>
              <p className="text-lg text-gray-400 mb-10 max-w-xl font-medium relative z-10">Protect your runs and lock down compliance instantly. Access heavy haul insurance built strictly for the oversized sector.</p>
              <div className="relative z-10 block w-full">
                <AdGridInstantLeadForm
                  adId="insurance-lead-1"
                  advertiserName="National Truck Insurance"
                  serviceName="Pilot Car Insurance — $89/mo"
                  variant="inline"
                />
              </div>
          </div>
        </section>

        {/* --- 8. STATE AND COUNTRY QUICK NAV --- */}
        <section className="mx-auto mt-24 max-w-7xl px-6">
           <header className="mb-6 flex items-center justify-between">
             <h2 className="text-2xl font-extrabold text-white">Coverage Maps</h2>
             <span className="text-xs font-bold text-amber-500 tracking-wider uppercase border border-amber-500/20 bg-amber-500/10 px-3 py-1 rounded-full">120 Markets Active</span>
           </header>
           
           <h3 className="mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-10 border-b border-white/10 pb-2">United States Focus</h3>
           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
             {US_STATES.map(s => (
               <Link key={s} href={`/directory/us/${s.toLowerCase()}`}
                 className="flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-gray-300 transition hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-400 hover:shadow-lg">
                 {s}
               </Link>
             ))}
           </div>

           <h3 className="mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-12 border-b border-white/10 pb-2">Global Jurisdictions</h3>
           <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 mt-4">
            {countries.map((country) => {
              const flag = TIER_FLAGS[country.code?.toUpperCase()] || '🌐';
              return (
                <Link key={country.code} href={`/directory/${country.code?.toLowerCase()}`} className="group flex flex-col items-center rounded-2xl border border-white/5 bg-[#0a0c10] p-4 transition-all hover:border-amber-500/30 hover:bg-white/5 hover:shadow-lg">
                  <span className="mb-2 text-3xl drop-shadow">{flag}</span>
                  <span className="text-[11px] font-bold text-gray-300 group-hover:text-amber-400 uppercase tracking-wide">{country.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* --- 9. SEO & STATIC ENGINE BLOCKS --- */}
        <section className="mx-auto mt-24 max-w-4xl px-6 border-t border-white/5 pt-16">
          <div className="rounded-3xl border border-white/10 bg-[#0B0F17] p-8 mb-6 shadow-xl">
            <StaticAnswerBlock question="What is the Haul Command directory?" answer="Haul Command is the world's largest directory of trucking service providers, including over 23,000 businesses across 46+ categories like pilot car operators, towing, truck repair, truck stops, and weigh stations. It covers 120 countries and offers verified operator profiles, trust scoring, and instant booking." source="Haul Command" sourceUrl="https://www.haulcommand.com/about" lastVerified="2026-04-03" confidence="verified_current" ctaLabel="Search the Directory" ctaUrl="/directory" />
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#0B0F17] p-8 shadow-xl">
            <StaticAnswerBlock question="How do I find a pilot car near me?" answer="Use Haul Command's directory to search by city, state, or ZIP code. Filter results by service type, availability, trust score, and equipment. You can contact operators directly, request quotes, or post a load for instant matching with verified escort vehicle providers." source="Haul Command" sourceUrl="https://www.haulcommand.com/near/houston-tx" lastVerified="2026-04-03" confidence="verified_current" ctaLabel="Find Operators Near You" ctaUrl="/near/houston-tx" />
          </div>
        </section>

        {/* --- 10. SYSTEM FOOTER WRAPPERS --- */}
        <section className="mx-auto mt-24 max-w-7xl px-6 pt-10">
          <AdGridSlot zone="directory_bottom" />
          
          <div className="mt-16 rounded-[2rem] bg-gradient-to-tr from-amber-500 to-yellow-600 p-1 lg:p-14 text-center text-amber-950 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-black/10"></div>
             <div className="relative z-10 bg-gradient-to-br from-[#07090D] to-[#0A0D14] rounded-[1.8rem] p-12 lg:p-16 text-white border border-amber-500/20 shadow-inner">
               <h2 className="mb-4 text-3xl md:text-5xl font-extrabold tracking-tight">Are you an escort operator?</h2>
               <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-gray-400">
                 Claim your free profile and instantly connect to the global routing grid. Receive direct dispatch requests across 120 countries.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link href="/claim" className="w-full sm:w-auto rounded-xl bg-amber-500 px-8 py-4 text-sm font-bold text-amber-950 transition hover:bg-amber-400 uppercase tracking-widest shadow-lg shadow-amber-500/20">
                   Claim Your Profile
                 </Link>
                 <Link href="/auth/register" className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/10 uppercase tracking-widest">
                   Create Free Account
                 </Link>
               </div>
             </div>
          </div>
          
          <div className="my-16">
            <SnippetInjector blocks={['definition', 'faq', 'cost_range', 'steps']} term="pilot car" geo="United States" country="US" />
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <ClaimListingCTA entityId="new" variant="card" />
              <PostLoadCTA variant="card" />
              <OperatorsNeededCTA surfaceName="underserved areas" operatorsNeeded={100} />
            </div>
          </div>
           
           <DataTeaserStrip />
           
           <div className="mt-16 mb-16">
             <UrgentMarketSponsor marketKey="us-all" geo="the US heavy haul market" />
           </div>
        </section>

        <section className="border-t border-white/5 bg-black/40 pt-16 pb-32">
          <div className="max-w-7xl mx-auto px-6">
            <NoDeadEndBlock moves={DIRECTORY_NEXT_MOVES} />
          </div>
        </section>
        
        <ProofStrip variant="bar" />
        <StickyClaimBar context="root" claimHref="/claim" suggestHref="/claim" />

      </main>
    </>
  );
}
