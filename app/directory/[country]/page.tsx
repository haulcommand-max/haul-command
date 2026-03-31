import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryGrid } from '@/components/directory/CategoryGrid';

interface Props {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ q?: string; state?: string; page?: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  // Tier A — Gold (10)
  us: 'United States', ca: 'Canada', au: 'Australia', gb: 'United Kingdom',
  nz: 'New Zealand', za: 'South Africa', de: 'Germany', nl: 'Netherlands',
  ae: 'UAE', br: 'Brazil',
  // Tier B — Blue (18)
  ie: 'Ireland', se: 'Sweden', no: 'Norway', dk: 'Denmark', fi: 'Finland',
  be: 'Belgium', at: 'Austria', ch: 'Switzerland', es: 'Spain', fr: 'France',
  it: 'Italy', pt: 'Portugal', sa: 'Saudi Arabia', qa: 'Qatar', mx: 'Mexico',
  'in': 'India', id: 'Indonesia', th: 'Thailand',
  // Tier C — Silver (26)
  pl: 'Poland', cz: 'Czech Republic', sk: 'Slovakia', hu: 'Hungary', si: 'Slovenia',
  ee: 'Estonia', lv: 'Latvia', lt: 'Lithuania', hr: 'Croatia', ro: 'Romania',
  bg: 'Bulgaria', gr: 'Greece', tr: 'Turkey', kw: 'Kuwait', om: 'Oman',
  bh: 'Bahrain', sg: 'Singapore', my: 'Malaysia', jp: 'Japan', kr: 'South Korea',
  cl: 'Chile', ar: 'Argentina', co: 'Colombia', pe: 'Peru', vn: 'Vietnam', ph: 'Philippines',
  // Tier D — Slate (25)
  uy: 'Uruguay', pa: 'Panama', cr: 'Costa Rica', il: 'Israel', ng: 'Nigeria',
  eg: 'Egypt', ke: 'Kenya', ma: 'Morocco', rs: 'Serbia', ua: 'Ukraine',
  kz: 'Kazakhstan', tw: 'Taiwan', pk: 'Pakistan', bd: 'Bangladesh', mn: 'Mongolia',
  tt: 'Trinidad and Tobago', jo: 'Jordan', gh: 'Ghana', tz: 'Tanzania', ge: 'Georgia',
  az: 'Azerbaijan', cy: 'Cyprus', is: 'Iceland', lu: 'Luxembourg', ec: 'Ecuador',
  // Tier E — Copper (41)
  bo: 'Bolivia', py: 'Paraguay', gt: 'Guatemala', do: 'Dominican Republic',
  hn: 'Honduras', sv: 'El Salvador', ni: 'Nicaragua', jm: 'Jamaica',
  gy: 'Guyana', sr: 'Suriname', ba: 'Bosnia and Herzegovina', me: 'Montenegro',
  mk: 'North Macedonia', al: 'Albania', md: 'Moldova', iq: 'Iraq',
  na: 'Namibia', ao: 'Angola', mz: 'Mozambique', et: 'Ethiopia',
  ci: "Côte d'Ivoire", sn: 'Senegal', bw: 'Botswana', zm: 'Zambia', ug: 'Uganda',
  cm: 'Cameroon', kh: 'Cambodia', lk: 'Sri Lanka', uz: 'Uzbekistan', la: 'Laos',
  np: 'Nepal', dz: 'Algeria', tn: 'Tunisia', mt: 'Malta', bn: 'Brunei',
  rw: 'Rwanda', mg: 'Madagascar', pg: 'Papua New Guinea', tm: 'Turkmenistan',
  kg: 'Kyrgyzstan', mw: 'Malawi',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const PAGE_SIZE = 48;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  const countryName = COUNTRY_NAMES[country] ?? country.toUpperCase();
  return {
    title: `${countryName} Escort Operators | Haul Command`,
    description: `Find verified pilot car and heavy haul escort operators in ${countryName}. Browse all operators, filter by state/region, and contact directly.`,
  };
}

export default async function CountryDirectoryPage({ params, searchParams }: Props) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toLowerCase();
  const countryName = COUNTRY_NAMES[country];
  if (!countryName) notFound();

  const isUS = country === 'us';
  const supabase = createClient();
  const sp = await searchParams;
  const page = Math.max(parseInt(sp.page ?? '1'), 1);
  const q = sp.q ?? '';
  const stateFilter = sp.state?.toUpperCase() ?? '';
  const offset = (page - 1) * PAGE_SIZE;

  // Build query on listings (single source of truth)
  let query = supabase
    .from('listings')
    .select('id, full_name, city, state, country_code, rating, review_count, claimed, services, rank_score, featured, slug', { count: 'exact' })
    .eq('active', true);

  if (isUS) {
    // US: filter by state column (all rows have state set)
    if (stateFilter) query = query.eq('state', stateFilter);
    // Only include rows that have a US state code (are actual US listings)
    else query = query.in('state', US_STATES);
  } else {
    query = query.eq('country_code', country);
  }

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,city.ilike.%${q}%,bio.ilike.%${q}%`);
  }

  query = query
    .order('featured', { ascending: false, nullsFirst: false })
    .order('rank_score', { ascending: false, nullsFirst: false })
    .order('claimed', { ascending: false, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data: operators, count: total, error } = await query;

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-red-400">Error loading operators: {error.message}</p>
      </div>
    );
  }

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  // Per-state breakdown for US sidebar
  let stateCounts: Record<string, number> = {};
  if (isUS && !stateFilter) {
    const { data: statData } = await supabase
      .from('listings')
      .select('state')
      .eq('active', true)
      .in('state', US_STATES);
    for (const row of statData ?? []) {
      const s = row.state?.toUpperCase();
      if (s) stateCounts[s] = (stateCounts[s] || 0) + 1;
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <section className="py-10 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <Link aria-label="Navigation Link" href="/directory" className="hover:text-amber-400 transition-colors">Directory</Link>
            <span>/</span>
            <span className="text-gray-400">{countryName}</span>
            {stateFilter && (
              <>
                <span>/</span>
                <span className="text-gray-400">{stateFilter}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">
                {stateFilter ? `${stateFilter} Escort Operators` : `${countryName} Escort & Pilot Car Operators`}
              </h1>
              <p className="text-gray-500 mt-1">
                {(total ?? 0).toLocaleString()} operators found{stateFilter ? ` in ${stateFilter}` : ''}
              </p>
            </div>
            {/* Search */}
            <form method="GET" className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search operators..."
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40"
              />
              {stateFilter && <input type="hidden" name="state" value={stateFilter} />}
              <button aria-label="Interactive Button" type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Grid (places & operators) */}
        {!stateFilter && !q && (
          <div className="mb-10">
            <CategoryGrid country={country} region="all" regionName={countryName} />
          </div>
        )}

        <div className="flex gap-8">
          {/* State sidebar for US */}
          {isUS && !stateFilter && Object.keys(stateCounts).length > 0 && (
            <aside className="hidden lg:block w-48 flex-shrink-0">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filter by State</h2>
              <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                {US_STATES.filter(s => stateCounts[s]).sort((a, b) => (stateCounts[b] || 0) - (stateCounts[a] || 0)).map(s => (
                  <Link aria-label="Navigation Link"
                    key={s}
                    href={`/directory/us/${s.toLowerCase()}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm transition-colors"
                  >
                    <span className="text-gray-300">{s}</span>
                    <span className="text-xs text-gray-600">{(stateCounts[s] || 0).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {/* Main grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile state scroll */}
            {isUS && !stateFilter && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-6 lg:hidden">
                {US_STATES.filter(s => stateCounts[s]).map(s => (
                  <Link aria-label="Navigation Link"
                    key={s}
                    href={`/directory/us/${s.toLowerCase()}`}
                    className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:border-amber-500/30 transition-colors"
                  >
                    {s} ({stateCounts[s]})
                  </Link>
                ))}
              </div>
            )}

            {operators && operators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {operators.map((op: any) => (
                  <div
                    key={op.id}
                    className={`p-5 border rounded-xl transition-all hover:border-amber-500/30 ${
                      op.featured ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {op.full_name || 'Escort Operator'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {op.city && `${op.city}, `}{op.state}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {op.featured && (
                          <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded">★</span>
                        )}
                        {op.claimed && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">✓</span>
                        )}
                      </div>
                    </div>
                    {op.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-amber-400 text-xs">{'★'.repeat(Math.min(Math.round(op.rating), 5))}</span>
                        <span className="text-xs text-gray-500">{op.rating.toFixed(1)}</span>
                        {op.review_count > 0 && (
                          <span className="text-xs text-gray-700">({op.review_count})</span>
                        )}
                      </div>
                    )}
                    {op.services?.length > 0 && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-1">
                        {op.services.slice(0, 3).join(' · ')}
                      </p>
                    )}
                    {/* Claim pressure */}
                    {!op.claimed && (
                      <div className="text-xs text-gray-700 mb-3">
                        <Link aria-label="Navigation Link" href={`/claim/${op.id}`} className="text-amber-500 hover:underline">
                          Unclaimed — Is this you? →
                        </Link>
                      </div>
                    )}
                    <div className="relative">
                      <div className="blur-sm text-xs text-gray-600 select-none">📞 Contact info hidden</div>
                      <div className="absolute inset-0 flex items-center">
                        <Link aria-label="Navigation Link"
                          href="/auth/register"
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors"
                        >
                          Sign up to contact
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                {q ? (
                  <>
                    <p className="text-gray-500">
                      No operators found for &quot;{q}&quot;
                    </p>
                    <Link aria-label="Navigation Link" href={`/directory/${country}`} className="text-amber-400 text-sm hover:underline mt-2 inline-block">
                      Clear search
                    </Link>
                  </>
                ) : (
                  <div className="max-w-lg mx-auto">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center text-xl">
                      🌍
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {countryName} — Part of Our 120-Country Network
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                      Haul Command is actively onboarding escort and pilot car operators in {countryName}.
                      {' '}Be the first to claim your profile and get listed for free.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Link
                        href="/claim"
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors"
                      >
                        Claim Your Profile
                      </Link>
                      <Link
                        href="/auth/register"
                        className="px-6 py-2.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg text-sm transition-colors"
                      >
                        Sign Up Free
                      </Link>
                    </div>
                    <div className="mt-8 flex justify-center gap-6 text-xs text-gray-600">
                      <Link href="/tools" className="hover:text-amber-400 transition-colors">🛠 Free Tools</Link>
                      <Link href="/glossary" className="hover:text-amber-400 transition-colors">📖 Glossary</Link>
                      <Link href="/regulations" className="hover:text-amber-400 transition-colors">📋 Regulations</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link aria-label="Navigation Link"
                    href={`/directory/${country}?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${stateFilter ? `&state=${stateFilter}` : ''}`}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20 transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages} · {(total ?? 0).toLocaleString()} operators
                </span>
                {page < totalPages && (
                  <Link aria-label="Navigation Link"
                    href={`/directory/${country}?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${stateFilter ? `&state=${stateFilter}` : ''}`}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20 transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
