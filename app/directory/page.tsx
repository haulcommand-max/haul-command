import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AvailabilityQuickSet from '@/components/capture/AvailabilityQuickSet';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { DirectorySearchList } from './_components/DirectorySearchList';
import { PaywallGateBanner } from '@/components/monetization/PaywallBanner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Trucking Services Directory — 23,000+ Businesses | Haul Command',
  description:
    'Search 23,000+ trucking service businesses: truck stops, towing, repair shops, pilot cars, tire shops, and 40+ categories across the US. Claim your free listing today.',
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
    title: 'Trucking Services Directory — 23,000+ Businesses | Haul Command',
    description: 'Find truck stops, towing, repair, pilot cars, and 40+ service categories. 23,000+ verified businesses across all 50 states.',
    url: 'https://haulcommand.com/directory',
    images: [{ url: '/og-directory.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://haulcommand.com/directory',
  },
};

const DIRECTORY_JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Pilot Car & Escort Vehicle Directory",
  "url": "https://haulcommand.com/directory",
  "description": "The world's largest directory of pilot car operators and escort vehicle professionals for oversize loads across 120 countries.",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://haulcommand.com" },
      { "@type": "ListItem", "position": 2, "name": "Pilot Car Directory", "item": "https://haulcommand.com/directory" }
    ]
  }
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
  US:'🇺🇸',CA:'🇨🇦',AU:'🇦🇺',GB:'🇬🇧',NZ:'🇳🇿',ZA:'🇿🇦',DE:'🇩🇪',NL:'🇳🇱',AE:'🇦🇪',BR:'🇧🇷',
  IE:'🇮🇪',SE:'🇸🇪',NO:'🇳🇴',DK:'🇩🇰',FI:'🇫🇮',BE:'🇧🇪',AT:'🇦🇹',CH:'🇨🇭',ES:'🇪🇸',FR:'🇫🇷',
  IT:'🇮🇹',PT:'🇵🇹',SA:'🇸🇦',QA:'🇶🇦',MX:'🇲🇽',IN:'🇮🇳',ID:'🇮🇩',TH:'🇹🇭',
  PL:'🇵🇱',CZ:'🇨🇿',SK:'🇸🇰',HU:'🇭🇺',SI:'🇸🇮',EE:'🇪🇪',LV:'🇱🇻',LT:'🇱🇹',HR:'🇭🇷',RO:'🇷🇴',
  BG:'🇧🇬',GR:'🇬🇷',TR:'🇹🇷',KW:'🇰🇼',OM:'🇴🇲',BH:'🇧🇭',SG:'🇸🇬',MY:'🇲🇾',JP:'🇯🇵',KR:'🇰🇷',
  CL:'🇨🇱',AR:'🇦🇷',CO:'🇨🇴',PE:'🇵🇪',VN:'🇻🇳',PH:'🇵🇭',
  UY:'🇺🇾',PA:'🇵🇦',CR:'🇨🇷',IL:'🇮🇱',NG:'🇳🇬',EG:'🇪🇬',KE:'🇰🇪',MA:'🇲🇦',RS:'🇷🇸',UA:'🇺🇦',
  KZ:'🇰🇿',TW:'🇹🇼',PK:'🇵🇰',BD:'🇧🇩',MN:'🇲🇳',TT:'🇹🇹',JO:'🇯🇴',GH:'🇬🇭',TZ:'🇹🇿',GE:'🇬🇪',
  AZ:'🇦🇿',CY:'🇨🇾',IS:'🇮🇸',LU:'🇱🇺',EC:'🇪🇨',
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
      <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative py-16 px-4 text-center border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex gap-2 mb-6">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full">
              {total.toLocaleString()}+ listings
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
              46 categories
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
              120 countries
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Trucking Services Directory
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            {total.toLocaleString()} truck stops, towing services, repair shops, pilot cars, and 40+ service categories across all 50 US states.
            Claim your free business listing today.
          </p>

          {/* Search */}
          <div className="max-w-4xl mx-auto mb-16 text-left">
            <DirectorySearchList />
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{total.toLocaleString()}</div>
              <div className="text-gray-500 text-xs mt-1">Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">46</div>
              <div className="text-gray-500 text-xs mt-1">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">50</div>
              <div className="text-gray-500 text-xs mt-1">US States</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{totalCountries || 120}</div>
              <div className="text-gray-500 text-xs mt-1">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Service Category */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Browse by Service Category</h2>
          <span className="text-xs text-gray-600">46 categories</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {SERVICE_CATEGORIES.map(cat => (
            <Link aria-label={`Browse ${cat.label}`}
              key={cat.key}
              href={`/directory?category=${cat.key}`}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/8 transition-all group"
            >
              <span className="text-xl block mb-1">{cat.icon}</span>
              <span className="text-xs font-medium text-white group-hover:text-amber-400 transition-colors block">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Paywall Gate — mid-funnel, after service category value is shown */}
      <section className="max-w-6xl mx-auto px-4 pb-2">
        <PaywallGateBanner
          surfaceName="Operator Directory"
          tier="Pro"
          description="Unlock verified operator contact details, trust scores, and availability. Join 1.2M+ operators across 120 countries."
        />
      </section>

      {/* US State Quick Nav */}
      <section className="max-w-6xl mx-auto px-4 py-10 border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Browse US States</h2>
          <span className="text-xs text-gray-600">50 states</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
          {US_STATES.map(s => (
            <Link aria-label="Navigation Link"
              key={s}
              href={`/directory/us/${s.toLowerCase()}`}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-amber-500/40 hover:bg-white/10 transition-all text-center group"
            >
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{s}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Operators */}
      {topOperators.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Top Rated Operators</h2>
            <Link aria-label="Navigation Link" href="/directory/us" className="text-sm text-amber-400 hover:underline">View all US →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topOperators.map((op: any) => {
              // Support both legacy (hc_global_operators) and production (DirectoryCard) shapes
              const name = op.display_name || op.name || 'Escort Operator';
              const isClaimed = op.claim_status === 'claimed' || op.claim_status === 'verified' || op.is_claimed;
              const trustScore = op.trust_score ?? (op.confidence_score ? op.confidence_score / 20 : null);
              const entityType = op.entity_type || op.role_primary || 'pilot_car';
              const countryCode = op.country_code || 'US';
              const jobCount = op.completed_jobs_count;
              const responseRate = op.response_rate;

              return (
                <div
                  key={op.id}
                  data-directory-result="true"
                  className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{name}</h3>
                      <p className="text-xs text-gray-500">
                        {countryCode}{op.country_name ? ` · ${op.country_name}` : ''}
                        {op.country_tier ? ` (Tier ${op.country_tier})` : ''}
                      </p>
                    </div>
                    {isClaimed && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex-shrink-0">
                        ✓ {op.claim_status === 'verified' ? 'Verified' : 'Claimed'}
                      </span>
                    )}
                  </div>
                  {trustScore != null && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(Math.round(trustScore), 5))}</span>
                      <span className="text-xs text-gray-500">{trustScore.toFixed(1)} Trust</span>
                      {jobCount != null && jobCount > 0 && (
                        <span className="text-xs text-gray-600 ml-1">· {jobCount} jobs</span>
                      )}
                      {responseRate != null && (
                        <span className="text-xs text-gray-600 ml-1">· {Math.round(responseRate * 100)}% response</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1 capitalize">{entityType.replace(/_/g, ' ')} Services</p>
                  <div className="relative">
                    <div className="blur-sm text-xs text-gray-600 select-none">📞 Contact info</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Link aria-label="Navigation Link"
                        href="/auth/register"
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors"
                      >
                        Sign up to contact
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Status</span>
                    <AvailabilityQuickSet operatorId={op.id} currentStatus={'unknown'} compact />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Country Grid */}
      <section className="max-w-6xl mx-auto px-4 py-10 border-t border-white/5">
        <h2 className="text-lg font-bold mb-6">Browse by Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {countries.map((country) => {
            const flag = TIER_FLAGS[country.code?.toUpperCase()] || '🌐';
            return (
              <Link aria-label="Navigation Link"
                key={country.code}
                href={`/directory/${country.code?.toLowerCase()}`}
                className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/8 transition-all text-center"
              >
                <span className="text-2xl block mb-2">{flag}</span>
                <span className="font-medium text-xs block text-white group-hover:text-amber-400 transition-colors">{country.name}</span>
                <span className="text-xs text-gray-600 mt-0.5 block">
                  {country.entity_count > 0 ? `${country.entity_count.toLocaleString()} operators` : 'Coming soon'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center border-t border-white/5">
        <h2 className="text-2xl font-bold mb-4">Are you an escort operator?</h2>
        <p className="text-gray-400 mb-6">
          Claim your free profile and start receiving load offers from brokers across 120 countries.
        </p>
        <div className="flex justify-center gap-4">
          <Link aria-label="Navigation Link" href="/claim" className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors">
            Claim Your Profile
          </Link>
          <Link aria-label="Navigation Link" href="/auth/register" className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors">
            Sign Up Free
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
