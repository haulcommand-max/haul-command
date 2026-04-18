import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';

// ═══════════════════════════════════════════════════════════════
// CATEGORY DIRECTORY PAGE — /directory/category/[slug]
// Canonical page for each service category.
// Generates crawlable HTML for map-pack indexing.
// Pulls real operator data from hc_places + hc_global_operators.
// ═══════════════════════════════════════════════════════════════

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ country?: string; state?: string; page?: string }>;
}

const CATEGORY_META: Record<
  string,
  { label: string; description: string; supabaseKey: string; keywords: string[] }
> = {
  'pilot-car-operators': {
    label: 'Pilot Car & Escort Operators',
    description:
      'Find verified pilot car and escort vehicle operators for oversize load transport. Lead car, chase car, high-pole, and multi-vehicle escort teams.',
    supabaseKey: 'pilot_car',
    keywords: ['pilot car', 'escort vehicle', 'oversize load escort', 'lead car', 'chase car'],
  },
  'freight-brokers': {
    label: 'Heavy Haul Freight Brokers',
    description:
      'Connect with licensed heavy haul freight brokers and dispatchers specializing in oversize, overweight, and specialized load transport arrangements.',
    supabaseKey: 'freight_broker',
    keywords: ['heavy haul broker', 'oversize freight broker', 'OW/OS dispatch', 'specialized cargo broker'],
  },
  'heavy-haul-carriers': {
    label: 'Heavy Haul Carriers',
    description:
      'Verified heavy haul carriers operating lowboy, RGN, double-drop, and specialized transport equipment for oversized and overweight cargo.',
    supabaseKey: 'heavy_haul_carrier',
    keywords: ['heavy haul carrier', 'lowboy transport', 'RGN carrier', 'overweight cargo', 'specialized transport'],
  },
  'permit-services': {
    label: 'OS/OW Permit Services',
    description:
      'Licensed permit agents and services for oversize/overweight load permits. Multi-jurisdiction permit filing, routing, and compliance management.',
    supabaseKey: 'permit_services',
    keywords: ['oversize permit', 'overweight permit', 'OS/OW permit agent', 'multi-state permit', 'route survey'],
  },
  'equipment-rentals': {
    label: 'Heavy Haul Equipment Rentals',
    description:
      'Specialized heavy haul equipment rental providers: hydraulic trailers, modular trailers, lowboys, and escort vehicle rentals for oversize transport.',
    supabaseKey: 'equipment_rental',
    keywords: ['heavy haul equipment rental', 'hydraulic trailer rental', 'lowboy rental', 'escort vehicle rental'],
  },
  'training-certification': {
    label: 'Training & Certification',
    description:
      'Pilot car operator training programs, escort vehicle certification courses, and heavy haul compliance training by state and country.',
    supabaseKey: 'training',
    keywords: ['pilot car training', 'escort vehicle certification', 'heavy haul training', 'OS/OW compliance'],
  },
};

const PAGE_SIZE = 36;

export async function generateStaticParams() {
  return Object.keys(CATEGORY_META).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) return {};
  return {
    title: `${meta.label} Directory | Haul Command`,
    description: meta.description,
    alternates: { canonical: `https://haulcommand.com/directory/category/${slug}` },
    keywords: meta.keywords,
  };
}

export const revalidate = 3600; // ISR — revalidate every hour

export default async function CategoryDirectoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const meta = CATEGORY_META[slug];
  if (!meta) notFound();

  const country = (sp.country ?? 'us').toUpperCase();
  const state = sp.state?.toUpperCase();
  const page = Math.max(parseInt(sp.page ?? '1'), 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createClient();

  // Query hc_places by category key
  let placesQuery = supabase
    .from('hc_places')
    .select('id, slug, name, locality, admin1_code, country_code, phone, claim_status, demand_score', {
      count: 'exact',
    })
    .eq('status', 'published')
    .eq('is_search_indexable', true)
    .eq('surface_category_key', meta.supabaseKey)
    .eq('country_code', country);

  if (state) placesQuery = placesQuery.eq('admin1_code', state);

  placesQuery = placesQuery
    .order('demand_score', { ascending: false, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data: places, count: total } = await placesQuery;

  const operators = (places ?? []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    city: p.locality,
    state: p.admin1_code,
    country: p.country_code,
    claimed: p.claim_status === 'claimed',
    demandScore: p.demand_score ?? 0,
  }));

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Directory', item: 'https://haulcommand.com/directory' },
      { '@type': 'ListItem', position: 2, name: meta.label, item: `https://haulcommand.com/directory/category/${slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SchemaGenerator type="BreadcrumbList" data={breadcrumbSchema} />

      {/* Header */}
      <section className="py-10 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <Link href="/directory" className="hover:text-amber-400 transition-colors">Directory</Link>
            <span>/</span>
            <span className="text-gray-400">{meta.label}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{meta.label}</h1>
              <p className="text-gray-500 max-w-2xl">{meta.description}</p>
              <p className="text-sm text-gray-600 mt-2">
                {(total ?? 0).toLocaleString()} verified providers · Browse by location below
              </p>
            </div>
          </div>

          {/* Country / State filter chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {['US', 'CA', 'AU', 'GB', 'NZ'].map((cc) => (
              <Link
                key={cc}
                href={`/directory/category/${slug}?country=${cc.toLowerCase()}`}
                className={`px-3 py-1.5 border rounded-full text-xs font-bold transition-colors ${
                  country === cc
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'
                }`}
              >
                {cc}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Operator Grid */}
        {operators.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map((op) => (
                <Link
                  key={op.id}
                  href={`/directory/profile/${op.slug ?? op.id}`}
                  className="group flex flex-col gap-2 p-5 bg-white/5 border border-white/8 rounded-2xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-snug">
                      {op.name}
                    </p>
                    {op.claimed ? (
                      <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-md">
                        Verified
                      </span>
                    ) : (
                      <span className="shrink-0 px-1.5 py-0.5 bg-white/8 border border-white/10 text-white/30 text-[10px] font-bold rounded-md">
                        Unclaimed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {[op.city, op.state, op.country].filter(Boolean).join(', ')}
                  </p>
                  {!op.claimed && (
                    <p className="text-xs text-amber-500/70 mt-1">
                      Is this your business?{' '}
                      <span className="font-bold text-amber-500 group-hover:underline">Claim it free →</span>
                    </p>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link
                    href={`/directory/category/${slug}?country=${country.toLowerCase()}&page=${page - 1}${state ? `&state=${state}` : ''}`}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages} · {(total ?? 0).toLocaleString()} total
                </span>
                {page < totalPages && (
                  <Link
                    href={`/directory/category/${slug}?country=${country.toLowerCase()}&page=${page + 1}${state ? `&state=${state}` : ''}`}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:border-white/20"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">
              No {meta.label.toLowerCase()} listed in this region yet.
            </p>
            <Link
              href="/claim"
              className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-colors"
            >
              List Your Business Free →
            </Link>
          </div>
        )}

        {/* Cross-category links */}
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/5" />
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.25em]">Browse Other Categories</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(CATEGORY_META)
              .filter(([s]) => s !== slug)
              .map(([s, m]) => (
                <Link
                  key={s}
                  href={`/directory/category/${s}`}
                  className="group p-4 bg-white/5 border border-white/8 rounded-2xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{m.label}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{m.keywords[0]}</p>
                </Link>
              ))}
          </div>
        </section>

        {/* Claim CTA */}
        <div className="mt-12 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
          <p className="font-bold text-white mb-2">Are you a {meta.label.toLowerCase()} provider?</p>
          <p className="text-sm text-gray-400 mb-4">
            Claim your free Haul Command profile and get found by brokers and carriers searching for {meta.keywords[0]} services.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/claim"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors"
            >
              Claim Free Listing
            </Link>
            <Link
              href="/directory"
              className="px-6 py-2.5 border border-white/20 text-white text-sm rounded-xl hover:border-white/40 transition-colors"
            >
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
