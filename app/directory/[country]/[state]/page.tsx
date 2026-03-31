import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryGrid } from '@/components/directory/CategoryGrid';
import { StateComplianceCalculator } from '@/app/(public)/_components/StateComplianceCalculator';
import { AdGridSponsorSlot } from '@/app/_components/directory/AdGridSponsorSlot';
import { TrackedLink, PageViewTracker } from '@/app/_components/TrackedLink';

interface Props {
  params: Promise<{ country: string; state: string }>;
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const PAGE_SIZE = 48;

function StateRateContextBlock({ regionName }: { regionName: string }) {
  return (
    <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider text-amber-500">Market Rate Context</h3>
        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-bold uppercase tracking-widest border border-amber-500/20">Collecting Data</span>
      </div>
      <div className="space-y-4 mt-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm font-medium">Est. Setup / Base</span>
          <span className="text-white font-black text-sm text-[#888]">Aggregating...</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm font-medium">Per-Mile Average</span>
          <span className="text-white font-black text-sm text-[#888]">Aggregating...</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <span className="text-gray-400 text-sm font-medium">Escort Lodging Nightly</span>
          <span className="text-white font-black text-sm text-[#888]">Aggregating...</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed pt-2">
          Haul Command is currently ingesting localized broker settlement data for {regionName}. Rates listed will be drawn entirely from verified historical dispatches and active load boards.
        </p>
      </div>
    </div>
  );
}

function StateHazardIntelBlock({ regionCode, countryCode }: { regionCode: string, countryCode: string }) {
  return (
    <div className="bg-[#0a0a0f] border border-red-500/10 rounded-2xl p-6 relative overflow-hidden h-full shadow-[0_0_15px_rgba(239,68,68,0.02)]">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="font-bold text-red-500 text-sm uppercase tracking-wider">Live Route Hazards</h3>
        <span className="flex h-2 w-2 relative">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </div>
      <div className="relative z-10 space-y-4 mt-6">
        <p className="text-sm text-gray-400 leading-relaxed font-medium">
          Route Hazard Network is initializing. We process cross-referenced bridge strikes, extreme weather cells, and active construction zones for {regionCode} corridors.
        </p>
        <div className="pt-4 border-t border-red-500/10">
            <TrackedLink 
                href={`/sponsor/waitlist?regionName=${regionCode}&type=operator&country=${countryCode}`} 
                className="inline-flex items-center gap-2 mt-2 text-xs font-black text-white bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/20 uppercase tracking-widest transition-colors"
                eventName="alert_interest_click"
                eventParams={{ region_code: regionCode, country_code: countryCode, block_name: 'hazard_intel' }}
            >
                Subscribe to {regionCode} Alerts →
            </TrackedLink>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/5 blur-3xl rounded-full z-0 pointer-events-none"></div>
    </div>
  );
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const regionCode = state.toUpperCase();
  const regionName = STATE_NAMES[regionCode] ?? regionCode;
  return {
    title: `${regionName} Escort & Pilot Car Operators | Haul Command`,
    description: `Find verified heavy haul escort and pilot car operators in ${regionName}. ${regionName} oversize load escorts with real ratings, permit experience, and instant contact.`,
  };
}

export default async function StateDirectoryPage({ params, searchParams }: Props) {
  const { state, country } = await params;
  const regionCode = state.toUpperCase();
  const regionName = STATE_NAMES[regionCode] ?? regionCode;

  const supabase = createClient();
  const sp = await searchParams;
  const page = Math.max(parseInt(sp.page ?? '1'), 1);
  const q = sp.q ?? '';
  const sortBy = sp.sort ?? 'rank';
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('listings')
    .select(
      'id, full_name, city, state, country, rating, review_count, claimed, services, rank_score, featured, bio, slug',
      { count: 'exact' }
    )
    .eq('active', true)
    .eq('state', regionCode);

  if (country && country.toLowerCase() !== 'us') {
    query = query.eq('country', country.toUpperCase());
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,city.ilike.%${q}%,bio.ilike.%${q}%`);
  }

  if (sortBy === 'rating') {
    query = query.order('rating', { ascending: false, nullsFirst: false });
  } else if (sortBy === 'reviews') {
    query = query.order('review_count', { ascending: false, nullsFirst: false });
  } else {
    query = query
      .order('featured', { ascending: false, nullsFirst: false })
      .order('rank_score', { ascending: false, nullsFirst: false })
      .order('claimed', { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data: operators, count: total, error } = await query;
  if (error) notFound();

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  const corridorLinks = [
    { label: `${regionCode} oversize load regulations`, href: `/regulations/${regionName.toLowerCase().replace(/\s+/g, '-')}` },
    { label: `Route Check — ${regionCode}`, href: `/route-check?region=${regionCode}` },
    { label: `Post a load in ${regionCode}`, href: '/loads/new' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <PageViewTracker eventName="state_page_view" params={{ country_code: country, region_code: regionCode }} />
      {/* Header */}
      <section className="py-10 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <Link href="/directory" className="hover:text-amber-400">Directory</Link>
            <span>/</span>
            <Link href={`/directory/${country}`} className="hover:text-amber-400 uppercase">{country}</Link>
            <span>/</span>
            <span className="text-gray-400">{regionName}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {regionName} Escort & Pilot Car Operations
          </h1>
          <p className="text-gray-400 font-medium">
            <span className="text-amber-500 font-bold">{(total ?? 0).toLocaleString()} operators verified.</span> Tap any listing for live confidence scores, real reviews, and 1-click dispatch across {regionName} corridors.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {corridorLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-10 lg:grid lg:grid-cols-3 gap-6 space-y-6 lg:space-y-0">
            {/* Compliance Calculator Hook (Spans 2 cols) */}
            <div className="lg:col-span-2">
              <StateComplianceCalculator regionCode={regionCode} regionName={regionName} />
            </div>

            {/* Context & Intel Stack (Spans 1 col) */}
            <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
              <div className="flex-1">
                <StateRateContextBlock regionName={regionName} />
              </div>
              <div className="flex-1">
                <StateHazardIntelBlock regionCode={regionCode} countryCode={country} />
              </div>
            </div>
        </div>

        {/* Category Grid */}
        {!q && (
          <div className="mb-14">
            <CategoryGrid country={country} region={state} regionName={regionName} />
          </div>
        )}

        <div className="mb-8 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">Top Rated {regionName} Operators</h2>
            <p className="text-sm text-gray-400">Verified pilot cars, heavy repair facilities, and secure drop yards ready for dispatch.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
           <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={`Search ${regionName} operators...`}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40"
            />
            <select
              name="sort"
              defaultValue={sortBy}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 focus:outline-none"
            >
              <option value="rank">Best match</option>
              <option value="rating">Highest rated</option>
              <option value="reviews">Most reviewed</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm">
              Filter
            </button>
          </form>
          <span className="text-xs text-gray-600 ml-auto">
            {(total ?? 0).toLocaleString()} results · Page {page}/{totalPages}
          </span>
        </div>

        {/* Grid */}
        {operators && operators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Native Ads & Organic Start */}
            {page === 1 && !q && <AdGridSponsorSlot regionName={regionName} type="operator" countryCode={country} />}

            {operators.map((op: any) => (
              <Link
                key={op.id}
                href={`/directory/profile/${op.slug || op.id}`}
                className={`block p-5 border rounded-xl transition-all hover:border-amber-500/40 hover:bg-white/[0.06] ${
                  op.featured ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm text-white truncate">{op.full_name || 'Escort Operator'}</h2>
                    <p className="text-xs text-gray-600">{op.city ? `${op.city}, ` : ''}{regionCode}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    {op.featured && <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded">★ Featured</span>}
                    {op.claimed && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">✓ Claimed</span>}
                  </div>
                </div>
                {op.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(Math.round(op.rating), 5))}</span>
                    <span className="text-xs text-gray-500">{op.rating.toFixed(1)}</span>
                    {op.review_count > 0 && <span className="text-xs text-gray-700">({op.review_count} reviews)</span>}
                  </div>
                )}
                {op.bio && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{op.bio}</p>
                )}
                {op.services?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {op.services.slice(0, 3).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-500">{s}</span>
                    ))}
                  </div>
                )}
                {!op.claimed && (
                  <p className="text-xs text-amber-600/70 mb-2">Unclaimed — Claim this listing →</p>
                )}
                <div className="mt-2 text-xs text-amber-400/80 font-semibold">View Profile →</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 bg-black border border-white/10 rounded-2xl text-center px-6">
            <div className="text-4xl mb-4">📍</div>
            <h2 className="text-2xl font-black text-white mb-3">We are tracking coverage in {regionName}</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              {q ? `No operators found for "${q}". ` : ''}
              Haul Command is actively mapping the national heavy haul grid. Be the first verified operator in this region to instantly unlock broker traffic and dominate search.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <TrackedLink 
                href="/claim" 
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-sm rounded-xl transition-all"
                eventName="claim_click"
                eventParams={{ action_context: 'zero_state_claim', region_code: regionCode, country_code: country }}
              >
                Claim {regionName} Coverage
              </TrackedLink>
              <TrackedLink 
                href="/loads/new" 
                className="px-6 py-3.5 border border-amber-500/50 hover:bg-amber-500/10 text-amber-500 font-bold text-sm rounded-xl transition-colors"
                eventName="open_load_waitlist_click"
                eventParams={{ action_context: 'zero_state_post_load', region_code: regionCode, country_code: country }}
              >
                Post an Open Load Waitlist
              </TrackedLink>
              <Link href={`/directory/${country}`} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/10 transition-colors uppercase">
                Browse Nearby Markets
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/directory/${country}/${state}?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}&sort=${sortBy}`}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link
                href={`/directory/${country}/${state}?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}&sort=${sortBy}`}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20"
              >
                Next →
              </Link>
            )}
          </div>
        )}

        {/* SEO footer links */}
        <div className="mt-12 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <p className="font-bold text-white mb-2">
            Are you a {regionName} escort operator?
          </p>
          <p className="text-sm text-gray-400 mb-3">
            Claim your free Haul Command profile and get found by brokers hauling through {regionName}.
          </p>
          <div className="flex gap-3">
            <TrackedLink 
                href="/claim" 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors"
                eventName="claim_click"
                eventParams={{ action_context: 'footer_claim', region_code: regionCode, country_code: country }}
            >
              Claim Free Listing
            </TrackedLink>
            <Link href={`/route-check?region=${regionCode}`} className="px-4 py-2 border border-white/20 text-white text-sm rounded-xl hover:border-white/40 transition-colors">
              {regionCode} Route Check
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
