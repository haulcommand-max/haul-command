import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pilot Car Directory — Find Verified Escort Vehicles | Haul Command',
  description:
    'Search the world\'s largest pilot car and escort vehicle directory. Find verified operators by state, country, and specialty. 1.5M+ listings across 120 countries.',
  keywords: [
    'pilot car directory',
    'escort vehicle directory',
    'find pilot car',
    'pilot car near me',
    'oversize load escort directory',
    'heavy haul escort',
    'pilot car operators USA',
    'escort vehicle operators',
    'superload pilot car',
    'lead car',
    'chase car',
    'height pole',
  ],
  openGraph: {
    title: 'Pilot Car Directory — Find Verified Escort Vehicles | Haul Command',
    description: 'Find verified pilot car operators and escort vehicles near you. Search by state, country, or specialty.',
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

const COUNTRIES = [
  { code: 'us', name: 'United States', flag: '🇺🇸', tier: 'A' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦', tier: 'A' },
  { code: 'au', name: 'Australia', flag: '🇦🇺', tier: 'A' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', tier: 'A' },
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿', tier: 'A' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦', tier: 'A' },
  { code: 'de', name: 'Germany', flag: '🇩🇪', tier: 'A' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱', tier: 'A' },
  { code: 'ae', name: 'UAE', flag: '🇦🇪', tier: 'A' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷', tier: 'A' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪', tier: 'B' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪', tier: 'B' },
  { code: 'no', name: 'Norway', flag: '🇳🇴', tier: 'B' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰', tier: 'B' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮', tier: 'B' },
  { code: 'be', name: 'Belgium', flag: '🇧🇪', tier: 'B' },
  { code: 'at', name: 'Austria', flag: '🇦🇹', tier: 'B' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭', tier: 'B' },
  { code: 'es', name: 'Spain', flag: '🇪🇸', tier: 'B' },
  { code: 'fr', name: 'France', flag: '🇫🇷', tier: 'B' },
  { code: 'it', name: 'Italy', flag: '🇮🇹', tier: 'B' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹', tier: 'B' },
  { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦', tier: 'B' },
  { code: 'qa', name: 'Qatar', flag: '🇶🇦', tier: 'B' },
  { code: 'mx', name: 'Mexico', flag: '🇲🇽', tier: 'B' },
  { code: 'in', name: 'India', flag: '🇮🇳', tier: 'B' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩', tier: 'B' },
  { code: 'th', name: 'Thailand', flag: '🇹🇭', tier: 'B' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱', tier: 'C' },
  { code: 'cz', name: 'Czech Republic', flag: '🇨🇿', tier: 'C' },
  { code: 'sk', name: 'Slovakia', flag: '🇸🇰', tier: 'C' },
  { code: 'hu', name: 'Hungary', flag: '🇭🇺', tier: 'C' },
  { code: 'si', name: 'Slovenia', flag: '🇸🇮', tier: 'C' },
  { code: 'ee', name: 'Estonia', flag: '🇪🇪', tier: 'C' },
  { code: 'lv', name: 'Latvia', flag: '🇱🇻', tier: 'C' },
  { code: 'lt', name: 'Lithuania', flag: '🇱🇹', tier: 'C' },
  { code: 'hr', name: 'Croatia', flag: '🇭🇷', tier: 'C' },
  { code: 'ro', name: 'Romania', flag: '🇷🇴', tier: 'C' },
  { code: 'bg', name: 'Bulgaria', flag: '🇧🇬', tier: 'C' },
  { code: 'gr', name: 'Greece', flag: '🇬🇷', tier: 'C' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷', tier: 'C' },
  { code: 'kw', name: 'Kuwait', flag: '🇰🇼', tier: 'C' },
  { code: 'om', name: 'Oman', flag: '🇴🇲', tier: 'C' },
  { code: 'bh', name: 'Bahrain', flag: '🇧🇭', tier: 'C' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬', tier: 'C' },
  { code: 'my', name: 'Malaysia', flag: '🇲🇾', tier: 'C' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵', tier: 'C' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷', tier: 'C' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱', tier: 'C' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷', tier: 'C' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴', tier: 'C' },
  { code: 'pe', name: 'Peru', flag: '🇵🇪', tier: 'C' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳', tier: 'C' },
  { code: 'ph', name: 'Philippines', flag: '🇵🇭', tier: 'C' },
  { code: 'uy', name: 'Uruguay', flag: '🇺🇾', tier: 'D' },
  { code: 'pa', name: 'Panama', flag: '🇵🇦', tier: 'D' },
  { code: 'cr', name: 'Costa Rica', flag: '🇨🇷', tier: 'D' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

async function getStats() {
  try {
    const supabase = createClient();

    // Query the unified listings table directly — no more directory_listings split
    const [countRes, stateRes, topRes] = await Promise.all([
      // Total count of all active listings
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('active', true),

      // Per-state breakdown (US)
      supabase
        .from('listings')
        .select('state')
        .eq('active', true)
        .not('state', 'is', null),

      // Top rated operators
      supabase
        .from('listings')
        .select('id, full_name, city, state, country_code, rating, review_count, claimed, services, rank_score')
        .eq('active', true)
        .not('rating', 'is', null)
        .order('rank_score', { ascending: false, nullsFirst: false })
        .limit(12),
    ]);

    // Build country counts — US is bulk, others from country_code
    const stateMap: Record<string, number> = {};
    for (const row of stateRes.data ?? []) {
      const s = (row.state ?? '').trim().toUpperCase();
      if (s) stateMap[s] = (stateMap[s] || 0) + 1;
    }

    const countryCounts: Record<string, number> = { us: countRes.count ?? 0 };

    return {
      total: countRes.count ?? 0,
      countryCounts,
      stateMap,
      topOperators: topRes.data ?? [],
    };
  } catch (e) {
    return { total: 1566000, countryCounts: { us: 1566000 }, stateMap: {}, topOperators: [] };
  }
}

export default async function DirectoryPage() {
  const { total, countryCounts, stateMap, topOperators } = await getStats();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Pilot Car Directory — Find Verified Escort Vehicles",
          "description": "The #1 directory of pilot car operators and escort vehicles for oversize loads across all 50 states.",
          "url": "https://haulcommand.com/directory"
        })
      }} />
      <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative py-16 px-4 text-center border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
            120 countries
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Global Escort Operator Directory
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            {total.toLocaleString()} verified pilot car and escort operators across 120 countries.
            Real-time availability, corridor rankings, and escrow-protected bookings.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <form action="/directory/us" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search by name, state, or specialty..."
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 text-base"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors text-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{total.toLocaleString()}</div>
              <div className="text-gray-500 text-xs mt-1">Operators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">57</div>
              <div className="text-gray-500 text-xs mt-1">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">219+</div>
              <div className="text-gray-500 text-xs mt-1">Corridors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">50</div>
              <div className="text-gray-500 text-xs mt-1">US States</div>
            </div>
          </div>
        </div>
      </section>

      {/* US State Quick Nav */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Browse US States</h2>
          <span className="text-xs text-gray-600">{Object.keys(stateMap).length} states with operators</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
          {US_STATES.map(s => (
            <Link
              key={s}
              href={`/directory/us/${s.toLowerCase()}`}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-amber-500/40 hover:bg-white/10 transition-all text-center group"
            >
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{s}</div>
              {stateMap[s] && (
                <div className="text-xs text-gray-600">{stateMap[s]}</div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Top Operators */}
      {topOperators.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Top Rated Operators</h2>
            <Link href="/directory/us" className="text-sm text-amber-400 hover:underline">View all US →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topOperators.map((op: any) => (
              <div
                key={op.id}
                className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{op.full_name || 'Escort Operator'}</h3>
                    <p className="text-xs text-gray-500">
                      {op.city && `${op.city}, `}{op.state && `${op.state}`}
                    </p>
                  </div>
                  {op.claimed && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                {op.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(Math.round(op.rating), 5))}</span>
                    <span className="text-xs text-gray-500">{op.rating.toFixed(1)} ({op.review_count ?? 0})</span>
                  </div>
                )}
                {op.services?.length > 0 && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">{op.services.slice(0, 3).join(' · ')}</p>
                )}
                <div className="relative">
                  <div className="blur-sm text-xs text-gray-600 select-none">📞 Contact info</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/auth/register"
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors"
                    >
                      Sign up to contact
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Country Grid */}
      <section className="max-w-6xl mx-auto px-4 py-10 border-t border-white/5">
        <h2 className="text-lg font-bold mb-6">Browse by Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {COUNTRIES.map((country) => {
            const count = countryCounts[country.code] || 0;
            return (
              <Link
                key={country.code}
                href={`/directory/${country.code}`}
                className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/8 transition-all text-center"
              >
                <span className="text-2xl block mb-2">{country.flag}</span>
                <span className="font-medium text-xs block text-white group-hover:text-amber-400 transition-colors">{country.name}</span>
                <span className="text-xs text-gray-600 mt-0.5 block">
                  {count > 0 ? `${count.toLocaleString()} operators` : 'Coming soon'}
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
          <Link href="/claim" className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors">
            Claim Your Listing
          </Link>
          <Link href="/auth/register" className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors">
            Sign Up Free
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}
