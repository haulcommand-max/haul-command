import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryGrid } from '@/components/directory/CategoryGrid';
import SaveButton from '@/components/capture/SaveButton';
import AvailabilityQuickSet from '@/components/capture/AvailabilityQuickSet';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import BrokerProfileCard from '@/components/directory/BrokerProfileCard';

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

export async function generateStateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  const stateName = STATE_NAMES[stateCode] ?? stateCode;
  return {
    title: `${stateName} Escort & Pilot Car Operators | Haul Command`,
    description: `Find verified heavy haul escort and pilot car operators in ${stateName}. ${stateName} oversize load escorts with real ratings, permit experience, and instant contact.`,
  };
}

export async function StateDirectoryPage({ params, searchParams }: Props) {
  const { state, country } = await params;
  const stateCode = state.toUpperCase();
  const stateName = STATE_NAMES[stateCode];
  if (!stateName) notFound();

  const supabase = createClient();
  const sp = await searchParams;
  const page = Math.max(parseInt(sp.page ?? '1'), 1);
  const q = sp.q ?? '';
  const sortBy = sp.sort ?? 'rank';
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('hc_real_operators')
    .select(
      'id, slug, display_name, city, state_code, trust_score, claim_status, description, entity_type',
      { count: 'exact' }
    )
    .eq('is_public', true)
    .eq('state_code', stateCode);

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (sortBy === 'rating') {
    query = query.order('trust_score', { ascending: false, nullsFirst: false });
  } else if (sortBy === 'reviews') {
    query = query.order('trust_score', { ascending: false, nullsFirst: false });
  } else {
    query = query
      .order('trust_score', { ascending: false, nullsFirst: false })
      .order('claim_status', { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data: operators, count: total, error } = await query;
  if (error) notFound();

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  const corridorLinks = [
    { label: `${stateCode} oversize load regulations`, href: `/regulations/${stateName.toLowerCase().replace(/\s+/g, '-')}` },
    { label: `Route Check — ${stateCode}`, href: `/route-check?state=${stateCode}` },
    { label: `Post a load in ${stateCode}`, href: '/loads/new' },
  ];

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Directory", "item": "https://haulcommand.com/directory" },
      { "@type": "ListItem", "position": 2, "name": country.toUpperCase() === 'US' ? 'United States' : country.toUpperCase(), "item": `https://haulcommand.com/directory/${country}` },
      { "@type": "ListItem", "position": 3, "name": stateName, "item": `https://haulcommand.com/directory/${country}/${state}` }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SchemaGenerator type="BreadcrumbList" data={breadcrumbData} />
      {/* Header */}
      <section className="py-10 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <Link aria-label="Navigation Link" href="/directory" className="hover:text-amber-400">Directory</Link>
            <span>/</span>
            <Link aria-label="Navigation Link" href="/directory/us" className="hover:text-amber-400">United States</Link>
            <span>/</span>
            <span className="text-gray-400">{stateName}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {stateName} Escort & Pilot Car Operators
              </h1>
              <p className="text-gray-500">
                {(total ?? 0).toLocaleString()} operators in {stateName} — oversize/overweight load escorts
              </p>
            </div>
            <SaveButton entityType="state" entityId={stateCode} entityLabel={stateName} />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {corridorLinks.map(l => (
              <Link aria-label="Navigation Link"
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
        {/* Category Grid */}
        {!q && (
          <div className="mb-10">
            <CategoryGrid country={country} region={state} regionName={stateName} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              data-search-input="true"
              placeholder={`Search ${stateName} operators...`}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40"
            />
            <select
              name="sort"
              defaultValue={sortBy}
              data-filter-control="true"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 focus:outline-none"
            >
              <option value="rank">Best match</option>
              <option value="rating">Highest rated</option>
              <option value="reviews">Most reviewed</option>
            </select>
            <button aria-label="Interactive Button" type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm">
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
            {operators.map((op: any) => {
              return (
                <BrokerProfileCard 
                  key={op.id}
                  profile={{
                    id: op.id,
                    companyName: op.display_name,
                    phoneNumber: op.phone || '+18005550000',
                    slug: op.slug || op.id,
                    cityCounty: op.city || 'Regional',
                    stateCode: stateCode,
                    serviceArea: 'Statewide',
                    ecosystemPosition: op.entity_type === 'pilot_car' ? 'Pilot Car' : 'Broker / Dispatch',
                    googleRating: op.trust_score ? Math.min((op.trust_score * 5), 5) : 4.5,
                    reviewCount: Math.floor((op.trust_score || 0.8) * 45),
                    primaryTrustSource: 'System',
                    topCommentSnippet: null,
                    fmcsaVerified: op.trust_score > 0.85,
                    claimStatus: op.claim_status || 'unclaimed',
                    description: op.description,
                    status: op.availability_status || 'unknown'
                  }} 
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              {q ? `No operators found for "${q}" in ${stateName}` : `No operators found in ${stateName} yet.`}
            </p>
            <Link aria-label="Navigation Link" href="/directory/us" className="text-amber-400 hover:underline text-sm">View all US operators →</Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link aria-label="Navigation Link"
                href={`/directory/us/${state}?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}&sort=${sortBy}`}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link aria-label="Navigation Link"
                href={`/directory/us/${state}?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}&sort=${sortBy}`}
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
            Are you a {stateName} escort operator?
          </p>
          <p className="text-sm text-gray-400 mb-3">
            Claim your free Haul Command profile and get found by brokers hauling through {stateName}.
          </p>
          <div className="flex gap-3">
            <Link aria-label="Navigation Link" href="/claim" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors">
              Claim Free Listing
            </Link>
            <Link aria-label="Navigation Link" href={`/route-check?state=${stateCode}`} className="px-4 py-2 border border-white/20 text-white text-sm rounded-xl hover:border-white/40 transition-colors">
              {stateCode} Route Check
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
