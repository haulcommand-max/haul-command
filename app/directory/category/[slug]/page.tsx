import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AeoAnswerCard } from '@/components/seo/AeoAnswerCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { DirectoryBackgroundShell } from '@/components/directory/DirectoryBackgroundShell';
import { SITE_URL } from '@/lib/site-url';
import { buildQAPageJsonLd } from '@/lib/seo/jsonld';

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

type CategoryCoverage = {
  category_key: string;
  public_label: string;
  route_slug: string;
  ecosystem_family: string;
  category_intent: string;
  primary_roles: string[] | null;
  entity_subtypes: string[] | null;
  data_sources: string[] | null;
  claim_route: string;
  lead_route: string;
  index_policy: string;
  schema_org_type: string;
  directory_records: number;
  staged_pending_records: number;
  computed_index_state: string;
};

function fallbackCategoryCoverage(slug: string): CategoryCoverage | null {
  const meta = CATEGORY_META[slug];
  if (!meta) return null;

  return {
    category_key: meta.supabaseKey,
    public_label: meta.label,
    route_slug: slug,
    ecosystem_family: 'heavy_haul_support',
    category_intent: meta.description,
    primary_roles: meta.keywords,
    entity_subtypes: [meta.supabaseKey],
    data_sources: ['category_registry_fallback'],
    claim_route: `/claim?category=${slug}`,
    lead_route: `/request-support?category=${slug}`,
    index_policy: 'noindex_until_threshold',
    schema_org_type: 'LocalBusiness',
    directory_records: 0,
    staged_pending_records: 0,
    computed_index_state: 'fallback_needs_registry_payload',
  };
}

function keywordsForCategory(category: CategoryCoverage) {
  return [
    category.public_label.toLowerCase(),
    ...((category.primary_roles ?? []).slice(0, 8).map((role) => role.replace(/_/g, ' '))),
    ...((category.entity_subtypes ?? []).slice(0, 8).map((subtype) => subtype.replace(/_/g, ' '))),
  ];
}

function canIndexCategory(category: CategoryCoverage) {
  if (category.index_policy.includes('never_index') || category.index_policy.includes('manual_review')) {
    return false;
  }

  if (category.index_policy.includes('noindex_until_threshold')) {
    return category.computed_index_state === 'indexable_global';
  }

  return category.computed_index_state === 'indexable_global';
}

function buildCategoryDirectAnswer(input: {
  category: CategoryCoverage;
  country: string;
  state?: string;
  total: number;
  slug: string;
}) {
  const scope = input.state ? `${input.state}, ${input.country}` : input.country;
  const hasCoverage = input.total > 0;
  const question = `Where can I find ${input.category.public_label.toLowerCase()} in ${scope}?`;

  return {
    question,
    answer: hasCoverage
      ? `Haul Command lists ${input.total} source-backed ${input.category.public_label.toLowerCase()} record${input.total === 1 ? '' : 's'} for ${scope}. Use claim state, subtype, confidence, and profile detail before treating any listing as dispatch-ready.`
      : `Haul Command does not yet have source-backed ${input.category.public_label.toLowerCase()} records for ${scope}. The category remains useful for claim, request, and sponsor intent, but sparse coverage should stay gated until real records exist.`,
    confidenceLabel: hasCoverage ? 'Source-backed category coverage' : 'Sparse category coverage',
    sourceHref: `/directory/category/${input.slug}?country=${input.country.toLowerCase()}${input.state ? `&state=${input.state}` : ''}`,
    ctaHref: hasCoverage ? input.category.lead_route : input.category.claim_route,
    ctaLabel: hasCoverage ? 'Request support' : 'Claim this category',
  };
}

async function getCategoryCoverage(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('v_hc_directory_category_coverage')
    .select('*')
    .eq('route_slug', slug)
    .maybeSingle();

  return (data as CategoryCoverage | null) ?? fallbackCategoryCoverage(slug);
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase
    .from('hc_directory_category_registry')
    .select('route_slug')
    .eq('active', true);

  return (data ?? Object.keys(CATEGORY_META).map((slug) => ({ route_slug: slug })))
    .map((category: any) => ({ slug: category.route_slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryCoverage(slug);
  if (!category) {
    return {
      title: `${slug.replace(/-/g, ' ')} Directory | Haul Command`,
      alternates: { canonical: `${SITE_URL}/directory/category/${slug}` },
      robots: { index: false, follow: true },
    };
  }
  const index = canIndexCategory(category);

  return {
    title: `${category.public_label} Directory | Haul Command`,
    description: category.category_intent,
    alternates: { canonical: `${SITE_URL}/directory/category/${slug}` },
    keywords: keywordsForCategory(category),
    robots: {
      index,
      follow: true,
    },
  };
}

export const revalidate = 3600; // ISR — revalidate every hour

export default async function CategoryDirectoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryCoverage(slug);
  if (!category) notFound();

  const country = (sp.country ?? 'us').toUpperCase();
  const state = sp.state?.toUpperCase();
  const page = Math.max(parseInt(sp.page ?? '1'), 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createClient();

  const entitySubtypes = category.entity_subtypes ?? [];
  let total = 0;
  let operators: Array<{
    id: string;
    slug: string | null;
    name: string;
    city: string | null;
    state: string | null;
    country: string | null;
    claimed: boolean;
    demandScore: number;
    label: string | null;
  }> = [];

  if (entitySubtypes.length > 0) {
    let entityQuery = supabase
      .from('v_hc_directory_active')
      .select('id, slug, name, display_name, city, admin1_code, country_code, claim_status, confidence_score, trust_score, public_url, entity_subtype_label', {
        count: 'exact',
      })
      .in('entity_subtype', entitySubtypes)
      .eq('country_code', country);

    if (state) entityQuery = entityQuery.eq('admin1_code', state);

    entityQuery = entityQuery
      .order('trust_score', { ascending: false, nullsFirst: false })
      .order('confidence_score', { ascending: false, nullsFirst: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data: entities, count } = await entityQuery;
    total = count ?? 0;

    operators = (entities ?? []).map((entity: any) => ({
      id: entity.id,
      slug: entity.slug ?? entity.public_url ?? entity.id,
      name: entity.display_name || entity.name || 'Directory listing',
      city: entity.city,
      state: entity.admin1_code,
      country: entity.country_code,
      claimed: entity.claim_status === 'claimed' || entity.claim_status === 'verified',
      demandScore: entity.trust_score ?? entity.confidence_score ?? 0,
      label: entity.entity_subtype_label ?? null,
    }));
  }

  const { data: relatedCategoriesRaw } = await supabase
    .from('v_hc_directory_category_coverage')
    .select('route_slug, public_label, ecosystem_family, directory_records')
    .eq('ecosystem_family', category.ecosystem_family)
    .neq('route_slug', slug)
    .order('directory_records', { ascending: false })
    .limit(8);

  const relatedCategories = (relatedCategoriesRaw ?? []) as Array<{
    route_slug: string;
    public_label: string;
    directory_records: number;
  }>;

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);
  const directAnswer = buildCategoryDirectAnswer({ category, country, state, total, slug });
  const qaJsonLd = buildQAPageJsonLd({
    url: `${SITE_URL}/directory/category/${slug}`,
    question: directAnswer.question,
    answer: directAnswer.answer,
    visible: true,
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Directory', item: `${SITE_URL}/directory` },
      { '@type': 'ListItem', position: 2, name: category.public_label, item: `${SITE_URL}/directory/category/${slug}` },
    ],
  };

  return (
    <DirectoryBackgroundShell>
      <SchemaGenerator type="BreadcrumbList" data={breadcrumbSchema} />
      <JsonLd data={qaJsonLd} />

      {/* Header */}
      <section className="py-10 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <Link href="/directory" className="hover:text-amber-400 transition-colors">Directory</Link>
            <span>/</span>
            <span className="text-gray-400">{category.public_label}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{category.public_label}</h1>
              <p className="text-gray-500 max-w-2xl">{category.category_intent}</p>
              <p className="text-sm text-gray-600 mt-2">
                {(total ?? 0).toLocaleString()} source-backed listings for {country}
                {category.staged_pending_records > 0 ? ` · ${category.staged_pending_records.toLocaleString()} staged records pending` : ''}
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
        <div className="mb-6">
          <AeoAnswerCard
            question={directAnswer.question}
            answer={directAnswer.answer}
            confidenceLabel={directAnswer.confidenceLabel}
            sourceLabel="Haul Command category coverage"
            sourceHref={directAnswer.sourceHref}
            ctaLabel={directAnswer.ctaLabel}
            ctaHref={directAnswer.ctaHref}
            facts={[
              { label: 'Listings', value: total },
              { label: 'Index state', value: canIndexCategory(category) ? 'Indexable' : 'Noindex' },
              { label: 'Scope', value: state ? `${state}, ${country}` : country },
            ]}
          />
        </div>
        {/* Operator Grid */}
        {operators.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map((op) => (
                <Link
                  key={op.id}
                  href={`/directory/dossier/${op.slug ?? op.id}`}
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
                  {op.label ? <p className="text-[11px] text-gray-600">{op.label}</p> : null}
                  {!op.claimed && (
                    <p className="text-xs text-amber-500/70 mt-1">
                      Operate or steward this listing?{' '}
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
              No {category.public_label.toLowerCase()} listed in this region yet.
            </p>
            <Link
              href={category.claim_route}
              className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-colors"
            >
              List Your Business Free →
            </Link>
          </div>
        )}

        <section className="mt-10 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">Coverage gate</p>
          <p className="text-sm text-gray-400">
            Index policy: {category.index_policy}. Current state: {category.computed_index_state}.
            Haul Command keeps thin markets useful through claim, request, and sponsor paths before broad indexation.
          </p>
          <p className="text-xs text-gray-600">
            Public map data may include OpenStreetMap contributors. Listings remain unclaimed until the provider or an approved source verifies them.
          </p>
        </section>

        {/* Cross-category links */}
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/5" />
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.25em]">Browse Other Categories</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedCategories.map((related) => (
                <Link
                  key={related.route_slug}
                  href={`/directory/category/${related.route_slug}`}
                  className="group p-4 bg-white/5 border border-white/8 rounded-2xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{related.public_label}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{related.directory_records.toLocaleString()} global records</p>
                </Link>
              ))}
          </div>
        </section>

        {/* Claim CTA */}
        <div className="mt-12 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
          <p className="font-bold text-white mb-2">Are you the operator, steward, or authorized representative for this category?</p>
          <p className="text-sm text-gray-400 mb-4">
            Claim the right listing type for your business, facility, public asset, or authority reference. Public infrastructure claims require steward or official proof.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={category.claim_route}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors"
            >
              Claim Free Listing
            </Link>
            <Link
              href={category.lead_route}
              className="px-6 py-2.5 border border-white/20 text-white text-sm rounded-xl hover:border-white/40 transition-colors"
            >
              Request Support
            </Link>
          </div>
        </div>
      </div>
    </DirectoryBackgroundShell>
  );
}
