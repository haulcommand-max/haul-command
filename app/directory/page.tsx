import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Global Escort Operator Directory — 57 Countries | Haul Command',
  description: 'Find verified pilot car and escort operators across 57 countries. Real-time availability, corridor rankings, and escrow-protected bookings.',
  openGraph: {
    title: 'Global Escort Operator Directory — 57 Countries',
    description: 'Find verified pilot car and escort operators across 57 countries. Real-time availability, corridor rankings, and escrow-protected bookings.',
    type: 'website',
  },
};

// Full 57 country list with flag emojis
const COUNTRIES = [
  // Tier A — Gold
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
  // Tier B — Blue
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
  // Tier C — Silver
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
  // Tier D — Slate
  { code: 'uy', name: 'Uruguay', flag: '🇺🇾', tier: 'D' },
  { code: 'pa', name: 'Panama', flag: '🇵🇦', tier: 'D' },
  { code: 'cr', name: 'Costa Rica', flag: '🇨🇷', tier: 'D' },
];

async function getCountryOperatorCounts() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('directory_listings')
      .select('country_code')
      .not('country_code', 'is', null);
    
    const counts: Record<string, number> = {};
    if (data) {
      for (const row of data) {
        const cc = (row.country_code || '').toLowerCase();
        counts[cc] = (counts[cc] || 0) + 1;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

async function getTopOperators() {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('directory_listings')
      .select('id, name, company_name, country_code, corridors, verified, rating, city, state')
      .eq('status', 'active')
      .order('rating', { ascending: false })
      .limit(12);
    return data || [];
  } catch {
    return [];
  }
}

export default async function DirectoryPage() {
  const [countryCounts, topOperators] = await Promise.all([
    getCountryOperatorCounts(),
    getTopOperators(),
  ]);

  const totalOperators = Object.values(countryCounts).reduce((a, b) => a + b, 0) || 7745;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="relative py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Global Escort Operator Directory — 57 Countries
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            {totalOperators.toLocaleString()} verified pilot car and escort operators across 57 countries.
            Real-time availability, corridor rankings, and escrow-protected bookings.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form action="/directory" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search by name, company, corridor, or country..."
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-lg"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <div><span className="text-amber-400 font-bold text-xl">{totalOperators.toLocaleString()}</span><br/>Operators Tracked</div>
            <div><span className="text-amber-400 font-bold text-xl">57</span><br/>Countries</div>
            <div><span className="text-amber-400 font-bold text-xl">219+</span><br/>Active Corridors</div>
          </div>
        </div>
      </section>

      {/* Country Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Browse by Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {COUNTRIES.map((country) => {
            const count = countryCounts[country.code] || 0;
            return (
              <Link
                key={country.code}
                href={`/directory/${country.code}`}
                className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 hover:bg-white/10 transition-all text-center"
              >
                <span className="text-3xl block mb-2">{country.flag}</span>
                <span className="font-medium text-sm block">{country.name}</span>
                <span className="text-xs text-gray-500">
                  {count > 0 ? `${count} operators` : 'Coming soon'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top Operators */}
      {topOperators.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Top Operators Globally</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topOperators.map((op: any) => (
              <div
                key={op.id}
                className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{op.name || op.company_name || 'Operator'}</h3>
                    <p className="text-xs text-gray-500">
                      {op.city && `${op.city}, `}{op.state && `${op.state} · `}
                      {(op.country_code || '').toUpperCase()}
                    </p>
                  </div>
                  {op.verified && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                {op.corridors && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    Corridors: {Array.isArray(op.corridors) ? op.corridors.slice(0, 3).join(', ') : op.corridors}
                  </p>
                )}
                {op.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-amber-400">{'★'.repeat(Math.round(op.rating))}</span>
                    <span className="text-xs text-gray-500">{op.rating.toFixed(1)}</span>
                  </div>
                )}
                {/* Contact info gated */}
                <div className="relative">
                  <div className="blur-sm text-xs text-gray-500 select-none">
                    📞 (555) 123-4567 · 📧 operator@example.com
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/auth/register"
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors"
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

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Are you an escort operator?</h2>
        <p className="text-gray-400 mb-6">
          Claim your free listing and start receiving load offers from brokers across 57 countries.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/claim"
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
          >
            Claim Your Listing
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
          >
            Sign Up Free
          </Link>
        </div>
      </section>
    </div>
  );
}
