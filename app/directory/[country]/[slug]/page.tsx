import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { contractToMetadata } from '@/lib/seo/page-seo-contract';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { AeoAnswerCard } from '@/components/seo/AeoAnswerCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageSeoContractJsonLd } from '@/components/seo/PageSeoContractJsonLd';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { Shield, MapPin, ArrowRight, ChevronRight, Users } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { stateFullName } from '@/lib/geo/state-names';
import { getCountry } from '@/lib/config/country-registry';
import { DirectoryBackgroundShell } from '@/components/directory/DirectoryBackgroundShell';
import {
  buildDirectoryMarketFilterPlan,
  normalizeDirectoryCountry,
  slugifyDirectoryMarket,
  type DirectoryMarketFilterPlan,
  type DirectorySurfaceView,
} from '@/lib/directory/server-query';
import { buildDirectoryMarketSeoContract } from '@/lib/directory/presentation';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import { buildFAQPageJsonLd, buildQAPageJsonLd } from '@/lib/seo/jsonld';
import { getPageSeoContract, metadataFromDbPageSeoContract } from '@/lib/seo/page-seo-contract-db';

//
// /directory/[country]/[slug] — City-level directory page
// SEO-optimized local landing page with operator listings,
// trust signals, sponsor zones, and local proof.
// Designed for "pilot car [city]" and "escort service [city]" intent.
//

interface PageProps {
  params: Promise<{ country: string; slug: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function displayName(op: any) {
  return op.company_name || op.company || op.name || op.display_name || 'Indexed support record';
}

function recordId(op: any) {
  return op.contact_id || op.canonical_entity_id || op.id;
}

function isVerifiedRecord(op: any) {
  const status = String(op.verification_status || '').toLowerCase();
  return Boolean(op.is_verified || status.includes('verified') || status.includes('confirmed'));
}

function isClaimedRecord(op: any) {
  const status = String(op.claim_status || '').toLowerCase();
  return Boolean(op.is_claimed || status === 'claimed' || status === 'approved');
}

function cityClaimHref(country: string, slug: string, listing?: string) {
  const search = new URLSearchParams({
    country,
    market: slug,
    intent: listing ? 'listing-claim' : 'city-market-claim',
    source: 'directory-city',
  });
  if (listing) search.set('listing', listing);
  return `/claim?${search.toString()}`;
}

function rankDirectoryRecord(record: any) {
  return Number(record.rank_score ?? record.confidence_score ?? record.directory_quality_score ?? 0);
}

function normalizeRegionCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

function normalizeMarketText(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function displayRoleFromSlug(slug: string) {
  return String(slug ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type RoleCountryCoverage = {
  role_key: string;
  country_code: string;
  country_tier: string | null;
  page_url: string | null;
  entity_count: number | null;
  claimed_count: number | null;
  verified_count: number | null;
  region_count: number | null;
  index_verdict: string | null;
  coverage_state: string | null;
  primary_cta_label: string | null;
  primary_cta_path: string | null;
  data_as_of: string | null;
};

type DirectoryRoleBrowseRow = {
  role_key: string;
  display_name: string | null;
  role_family: string | null;
  ux_bucket: string | null;
  all_aliases: string[] | null;
  slang_names: string[] | null;
  country_variants: string[] | null;
  role_hub_path: string | null;
  cta_primary: string | null;
  operators: number | null;
  countries_with_supply: number | null;
  claimed: number | null;
  verified: number | null;
  has_supply: boolean | null;
  role_class: string | null;
  monetization_class: string | null;
};

type RoleCountryPageData = {
  coverage: RoleCountryCoverage;
  role: DirectoryRoleBrowseRow;
};

function countryDisplayName(countryCode: string) {
  return getCountry(countryCode.toUpperCase())?.name ?? countryCode.toUpperCase();
}

function roleKeyCandidatesFromSlug(slug: string) {
  const normalized = slugifyDirectoryMarket(slug).replace(/-/g, '_');
  const candidates = new Set([normalized]);
  for (const suffix of ['_operator', '_provider', '_developer', '_service', '_services']) {
    if (normalized.endsWith(suffix)) candidates.add(normalized.slice(0, -suffix.length));
  }
  return [...candidates].filter(Boolean);
}

function roleSlugFromKey(roleKey: string) {
  return slugifyDirectoryMarket(roleKey.replace(/_/g, '-'));
}

async function getRoleCountryPageData(
  supabase: ReturnType<typeof createClient>,
  countryUpper: string,
  slug: string,
): Promise<RoleCountryPageData | null> {
  const canonicalPath = `/directory/${countryUpper.toLowerCase()}/${slugifyDirectoryMarket(slug)}`;
  const coverageSelect = 'role_key, country_code, country_tier, page_url, entity_count, claimed_count, verified_count, region_count, index_verdict, coverage_state, primary_cta_label, primary_cta_path, data_as_of';
  const roleCandidates = roleKeyCandidatesFromSlug(slug);
  const slugFromRoute = slugifyDirectoryMarket(slug);
  let coverage: RoleCountryCoverage | null = null;

  const exactCoverage = await supabase
    .from('hc_role_country_coverage')
    .select(coverageSelect)
    .eq('country_code', countryUpper)
    .eq('page_url', canonicalPath)
    .maybeSingle();

  if (exactCoverage.error) {
    console.warn(`[directory-role-country] Coverage page_url lookup failed for ${canonicalPath}:`, exactCoverage.error.message);
  } else if (exactCoverage.data?.role_key) {
    coverage = exactCoverage.data as RoleCountryCoverage;
  }

  if (!coverage && roleCandidates.length > 0) {
    const roleCoverage = await supabase
      .from('hc_role_country_coverage')
      .select(coverageSelect)
      .eq('country_code', countryUpper)
      .in('role_key', roleCandidates)
      .order('entity_count', { ascending: false, nullsFirst: false })
      .limit(5);

    if (roleCoverage.error) {
      console.warn(`[directory-role-country] Coverage role_key lookup failed for ${countryUpper}/${slug}:`, roleCoverage.error.message);
    } else {
      coverage = ((roleCoverage.data ?? []) as RoleCountryCoverage[])
        .find((row) => slugFromRoute === roleSlugFromKey(row.role_key)) ?? null;
    }
  }

  if (!coverage?.role_key) {
    return null;
  }

  if (slugFromRoute !== roleSlugFromKey(coverage.role_key)) {
    console.warn(
      `[directory-role-country] Ignoring coverage row with non-role slug: ${canonicalPath} -> ${coverage.role_key}`,
    );
    return null;
  }

  const { data: role, error: roleError } = await supabase
    .from('v_hc_directory_role_browse')
    .select('role_key, display_name, role_family, ux_bucket, all_aliases, slang_names, country_variants, role_hub_path, cta_primary, operators, countries_with_supply, claimed, verified, has_supply, role_class, monetization_class')
    .eq('role_key', coverage.role_key)
    .maybeSingle();

  if (roleError || !role?.role_key) {
    return {
      coverage: coverage as RoleCountryCoverage,
      role: {
        role_key: coverage.role_key,
        display_name: displayRoleFromSlug(slug),
        role_family: null,
        ux_bucket: null,
        all_aliases: null,
        slang_names: null,
        country_variants: null,
        role_hub_path: null,
        cta_primary: null,
        operators: null,
        countries_with_supply: null,
        claimed: null,
        verified: null,
        has_supply: null,
        role_class: null,
        monetization_class: null,
      },
    };
  }

  return {
    coverage: coverage as RoleCountryCoverage,
    role: role as DirectoryRoleBrowseRow,
  };
}

async function fetchRoleCountryRecords(
  supabase: ReturnType<typeof createClient>,
  countryUpper: string,
  roleKey: string,
  limit = 36,
) {
  const terms = roleKeyCandidatesFromSlug(roleKey.replace(/_/g, '-'));
  const byPrimaryRole = await supabase
    .from('v_directory_publishable')
    .select('*')
    .eq('country_code', countryUpper)
    .in('role_primary', terms)
    .order('rank_score', { ascending: false, nullsFirst: false })
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (byPrimaryRole.error) {
    console.warn(`[directory-role-country] Primary-role query failed for ${countryUpper}/${roleKey}:`, byPrimaryRole.error.message);
  }

  if ((byPrimaryRole.data?.length ?? 0) > 0) {
    return byPrimaryRole.data ?? [];
  }

  const bySubtype = await supabase
    .from('v_directory_publishable')
    .select('*')
    .eq('country_code', countryUpper)
    .in('entity_subtype', terms)
    .order('rank_score', { ascending: false, nullsFirst: false })
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (bySubtype.error) {
    console.warn(`[directory-role-country] Subtype query failed for ${countryUpper}/${roleKey}:`, bySubtype.error.message);
  }

  if ((bySubtype.data?.length ?? 0) > 0) {
    return bySubtype.data ?? [];
  }

  const byListingSubtype = await supabase
    .from('directory_listings')
    .select('id, canonical_entity_id, name, city, admin1_code, country_code, entity_subtype, primary_role, claim_status, verification_status, rank_score, confidence_score, profile_url')
    .eq('country_code', countryUpper)
    .in('entity_subtype', terms)
    .or('is_visible.is.true,is_visible.is.null')
    .or('opted_out.is.false,opted_out.is.null')
    .order('rank_score', { ascending: false, nullsFirst: false })
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (byListingSubtype.error) {
    console.warn(`[directory-role-country] Listing-subtype query failed for ${countryUpper}/${roleKey}:`, byListingSubtype.error.message);
    return [];
  }

  return byListingSubtype.data ?? [];
}

function buildMarketDirectAnswer(input: {
  cityName: string;
  countryUpper: string;
  marketKind: string;
  opCount: number;
  slug: string;
}) {
  const hasCoverage = input.opCount > 0;
  const marketLabel = `${input.cityName}, ${input.countryUpper}`;
  const question = `Who provides pilot car and heavy haul support in ${marketLabel}?`;

  return {
    question,
    answer: hasCoverage
      ? `Haul Command indexes ${input.opCount} source-backed support record${input.opCount === 1 ? '' : 's'} for the ${input.cityName} ${input.marketKind}. Use the proof, claim, contact, and freshness state on each record before dispatching a move.`
      : `Haul Command does not yet have source-backed support records attached to the ${input.cityName} ${input.marketKind}. The market can still capture demand through claim and support-packet actions, but it should not be treated as verified supply.`,
    confidenceLabel: hasCoverage ? 'Source-backed market records' : 'Sparse market - noindex',
    sourceHref: `/directory?country=${input.countryUpper}&q=${encodeURIComponent(input.cityName)}`,
    ctaHref: hasCoverage
      ? `/loads/post?country=${input.countryUpper}&market=${encodeURIComponent(input.slug)}&intent=city-support`
      : `/claim?country=${input.countryUpper}&market=${encodeURIComponent(input.slug)}&intent=city-market-claim&source=directory-city`,
    ctaLabel: hasCoverage ? 'Build support packet' : 'Claim this market',
  };
}

function buildRoleCountryDirectAnswer(input: {
  roleLabel: string;
  countryName: string;
  countryUpper: string;
  entityCount: number;
  claimedCount: number;
  verifiedCount: number;
  regionCount: number;
  indexVerdict: string;
  coverageState: string;
  canonicalPath: string;
  visibleCount: number;
}) {
  const hasCoverage = input.entityCount > 0;
  const hasVisibleRecords = input.visibleCount > 0;
  const question = `Who provides ${input.roleLabel.toLowerCase()} support in ${input.countryName}?`;

  return {
    question,
    answer: hasVisibleRecords
      ? `Haul Command indexes ${input.entityCount.toLocaleString()} ${input.roleLabel.toLowerCase()} record${input.entityCount === 1 ? '' : 's'} across ${input.countryName}, with coverage signals across ${input.regionCount.toLocaleString()} region${input.regionCount === 1 ? '' : 's'}. Use each record's claim, proof, freshness, and contact state before dispatch.`
      : hasCoverage
        ? `Haul Command has ${input.entityCount.toLocaleString()} ${input.roleLabel.toLowerCase()} coverage signal${input.entityCount === 1 ? '' : 's'} for ${input.countryName}, but no public records are renderable from the directory facade yet. Treat this as a mapped supply cell that still needs profile cleanup before dispatch.`
      : `Haul Command has the ${input.roleLabel} role mapped for ${input.countryName}, but this role-country cell still needs source-backed supply before it should be treated as covered.`,
    confidenceLabel: hasVisibleRecords ? 'Role-country records rendered' : hasCoverage ? 'Mapped coverage - profile cleanup needed' : 'Mapped role - supply gap',
    sourceHref: `${input.canonicalPath}?source=coverage`,
    ctaHref: hasVisibleRecords
      ? `/directory?country=${input.countryUpper}&q=${encodeURIComponent(input.roleLabel)}`
      : `/claim?country=${input.countryUpper}&role=${encodeURIComponent(input.roleLabel)}&intent=role-country-supply`,
    ctaLabel: hasVisibleRecords ? `Search ${input.roleLabel}` : 'Claim or submit supply',
  };
}

async function countDirectoryMarketRecords(
  supabase: ReturnType<typeof createClient>,
  plan: DirectoryMarketFilterPlan,
  countryUpper: string,
) {
  const counts = await Promise.all(
    plan.surfaceViews.map(async (surfaceView: DirectorySurfaceView) => {
      const { count, error } = await supabase
        .from(surfaceView)
        .select('*', { count: 'exact', head: true })
        .eq('country_code', countryUpper)
        .or(plan.locationOrFilter);

      if (error) {
        console.warn(`[directory-city] Count query failed for ${surfaceView}:`, error.message);
        return 0;
      }

      return count ?? 0;
    }),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

async function fetchDirectoryMarketRecords(
  supabase: ReturnType<typeof createClient>,
  plan: DirectoryMarketFilterPlan,
  countryUpper: string,
) {
  const perSurfaceLimit = Math.max(8, Math.ceil(plan.limit / Math.max(plan.surfaceViews.length, 1)));

  const surfaceResults = await Promise.all(
    plan.surfaceViews.map(async (surfaceView: DirectorySurfaceView) => {
      let query = supabase
        .from(surfaceView)
        .select('*', { count: 'exact' })
        .eq('country_code', countryUpper)
        .or(plan.locationOrFilter);

      for (const order of plan.order) {
        query = query.order(order.column, {
          ascending: order.ascending,
          nullsFirst: false,
        });
      }

      const { data, count, error } = await query.limit(perSurfaceLimit);

      if (error) {
        console.warn(`[directory-city] Surface query failed for ${surfaceView}:`, error.message);
        return { records: [], count: 0 };
      }

      return {
        records: (data ?? []).map((record: any) => ({
          ...record,
          source_view: record.source_view || surfaceView,
          contact_id: record.contact_id || record.canonical_entity_id || record.id,
        })),
        count: count ?? data?.length ?? 0,
      };
    }),
  );

  return {
    records: surfaceResults
      .flatMap((result) => result.records)
      .sort((a: any, b: any) => rankDirectoryRecord(b) - rankDirectoryRecord(a))
      .slice(0, plan.limit),
    totalCount: surfaceResults.reduce((sum, result) => sum + result.count, 0),
  };
}

function applyMarketScopeToHcPlacesQuery(query: any, plan: DirectoryMarketFilterPlan) {
  if (plan.scope.type === 'region') {
    return query.eq('admin1_code', plan.scope.code);
  }

  const marketName = plan.scope.name;
  return query.or(`locality.ilike.%${marketName}%,admin2_name.ilike.%${marketName}%,name.ilike.%${marketName}%`);
}

function applyMarketScopeToGlobalOperatorsQuery(query: any, plan: DirectoryMarketFilterPlan) {
  if (plan.scope.type === 'region') {
    return query.eq('admin1_code', plan.scope.code);
  }

  const marketName = plan.scope.name;
  return query.or(`city.ilike.%${marketName}%,service_area.ilike.%${marketName}%,name.ilike.%${marketName}%`);
}

function mapHcPlaceMarketRecord(row: any) {
  return {
    id: row.id,
    contact_id: row.id,
    name: row.name,
    company: row.name,
    slug: row.slug,
    city: row.locality,
    city_inferred: row.locality,
    admin1_code: row.admin1_code,
    state: row.admin1_code,
    country_code: row.country_code,
    lat: row.lat,
    lon: row.lng,
    website: row.website,
    phone_raw: row.phone,
    entity_family: 'support_place',
    entity_subtype: row.surface_category_key,
    role_primary: row.surface_category_key,
    claim_status: row.claim_status,
    verification_status: row.hc_verified ? 'verified' : null,
    confidence_score: row.source_confidence ?? row.demand_score ?? 0,
    rank_score: row.demand_score ?? row.source_confidence ?? 0,
    profile_url: row.slug ? `/directory/dossier/${row.id}` : null,
    source_view: 'hc_places',
  };
}

function mapGlobalOperatorMarketRecord(row: any) {
  return {
    id: row.id,
    contact_id: row.id,
    name: row.name,
    company: row.business_name || row.name,
    slug: row.slug,
    city: row.city,
    city_inferred: row.city,
    admin1_code: row.admin1_code,
    state: row.admin1_code,
    country_code: row.country_code,
    lat: row.lat,
    lon: row.lng,
    phone_raw: row.phone_normalized,
    email: row.email,
    website: row.website_url,
    entity_family: row.entity_family || 'operator',
    entity_subtype: row.role_primary,
    role_primary: row.role_primary,
    claim_status: row.claim_status ?? (row.is_claimed ? 'claimed' : null),
    verification_status: row.verification_status ?? (row.is_verified ? 'verified' : null),
    confidence_score: row.confidence_score ?? row.trust_score ?? 0,
    rank_score: row.trust_score ?? row.confidence_score ?? 0,
    profile_url: row.slug ? `/directory/dossier/${row.id}` : null,
    source_view: 'hc_global_operators',
  };
}

async function fetchDirectoryMarketSourceFallback(
  supabase: ReturnType<typeof createClient>,
  plan: DirectoryMarketFilterPlan,
  countryUpper: string,
) {
  const sourceLimit = Math.max(12, Math.ceil(plan.limit / 2));

  let placesQuery = supabase
    .from('hc_places')
    .select('id,name,slug,surface_category_key,country_code,admin1_code,admin2_name,locality,lat,lng,phone,website,source_confidence,status,is_search_indexable,claim_status,demand_score,hc_verified', { count: 'exact' })
    .eq('status', 'published')
    .eq('is_search_indexable', true)
    .eq('country_code', countryUpper)
    .or('name.ilike.%pilot%,name.ilike.%escort%,surface_category_key.ilike.%pilot%,surface_category_key.ilike.%escort%')
    .order('demand_score', { ascending: false, nullsFirst: false })
    .limit(sourceLimit);

  placesQuery = applyMarketScopeToHcPlacesQuery(placesQuery, plan);

  let operatorsQuery = supabase
    .from('hc_global_operators')
    .select('id,name,business_name,slug,country_code,admin1_code,city,phone_normalized,email,website_url,is_claimed,is_verified,role_primary,confidence_score,trust_score,claim_status,verification_status,entity_family,lat,lng,service_area', { count: 'exact' })
    .eq('country_code', countryUpper)
    .not('admin1_code', 'is', null)
    .not('city', 'is', null)
    .or('name.ilike.%pilot%,name.ilike.%escort%,business_name.ilike.%pilot%,business_name.ilike.%escort%,role_primary.ilike.%pilot%,role_primary.ilike.%escort%')
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(sourceLimit);

  operatorsQuery = applyMarketScopeToGlobalOperatorsQuery(operatorsQuery, plan);

  const [placesResult, operatorsResult] = await Promise.all([placesQuery, operatorsQuery]);

  if (placesResult.error) {
    console.warn(`[directory-city] hc_places fallback failed for ${countryUpper}/${plan.marketName}:`, placesResult.error.message);
  }
  if (operatorsResult.error) {
    console.warn(`[directory-city] hc_global_operators fallback failed for ${countryUpper}/${plan.marketName}:`, operatorsResult.error.message);
  }

  const seen = new Set<string>();
  const records = [
    ...((placesResult.data ?? []) as any[]).map(mapHcPlaceMarketRecord),
    ...((operatorsResult.data ?? []) as any[]).map(mapGlobalOperatorMarketRecord),
  ]
    .filter((record) => {
      const id = recordId(record);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .filter((record) => {
      if (plan.scope.type === 'region') {
        return normalizeRegionCode(record.admin1_code || record.state) === plan.scope.code;
      }
      const market = normalizeMarketText(plan.scope.name);
      return [
        record.city,
        record.city_inferred,
        record.company,
        record.name,
      ].some((value) => normalizeMarketText(value).includes(market));
    })
    .sort((a: any, b: any) => rankDirectoryRecord(b) - rankDirectoryRecord(a))
    .slice(0, plan.limit);

  return {
    records,
    totalCount: (placesResult.count ?? 0) + (operatorsResult.count ?? 0),
  };
}

async function RoleCountryDirectoryPage({
  country,
  slug,
  countryUpper,
  roleCountry,
}: {
  country: string;
  slug: string;
  countryUpper: string;
  roleCountry: RoleCountryPageData;
}) {
  const roleLabel = roleCountry.role.display_name ?? displayRoleFromSlug(slug);
  const countryName = countryDisplayName(countryUpper);
  const canonicalPath = roleCountry.coverage.page_url ?? `/directory/${country.toLowerCase()}/${slug}`;
  const entityCount = Number(roleCountry.coverage.entity_count ?? 0);
  const claimedCount = Number(roleCountry.coverage.claimed_count ?? 0);
  const verifiedCount = Number(roleCountry.coverage.verified_count ?? 0);
  const regionCount = Number(roleCountry.coverage.region_count ?? 0);
  const indexVerdict = roleCountry.coverage.index_verdict ?? 'request_coverage';
  const coverageState = roleCountry.coverage.coverage_state ?? (entityCount > 0 ? 'has_supply' : 'supply_gap');
  const records = await fetchRoleCountryRecords(createClient(), countryUpper, roleCountry.coverage.role_key);
  const visibleCount = records.length;
  const directAnswer = buildRoleCountryDirectAnswer({
    roleLabel,
    countryName,
    countryUpper,
    entityCount,
    claimedCount,
    verifiedCount,
    regionCount,
    indexVerdict,
    coverageState,
    canonicalPath,
    visibleCount,
  });
  const visibleFaqs = [
    {
      question: `How many ${roleLabel.toLowerCase()} records are indexed in ${countryName}?`,
      answer: entityCount > 0
        ? `Haul Command currently tracks ${entityCount.toLocaleString()} ${roleLabel.toLowerCase()} records for ${countryName}, with ${regionCount.toLocaleString()} region signals attached.`
        : `This role is mapped for ${countryName}, but source-backed supply still needs to be attached before the market is treated as covered.`,
    },
    {
      question: `Can I dispatch directly from this ${roleLabel.toLowerCase()} page?`,
      answer: 'Use this page as a discovery and proof screen first. Check claim state, contact path, source freshness, route fit, and any required permits or credentials before dispatch.',
    },
    {
      question: `What should a ${roleLabel.toLowerCase()} provider do next?`,
      answer: `Claim or correct the listing, add service areas and equipment, and attach proof so brokers can evaluate the ${countryName} support market without relying on stale directory data.`,
    },
  ];

  const itemListJsonLd = visibleCount > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${roleLabel} visible records in ${countryName}`,
    description: `${roleLabel} role-country directory records currently rendered for ${countryName}`,
    numberOfItems: visibleCount,
    itemListElement: records.slice(0, 10).map((record: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: displayName(record),
        address: {
          '@type': 'PostalAddress',
          addressLocality: record.city_inferred || record.city,
          addressRegion: record.state_inferred || record.admin1_code || record.state,
          addressCountry: countryUpper,
        },
      },
    })),
  } : null;
  const faqJsonLd = buildFAQPageJsonLd({
    url: `https://www.haulcommand.com${canonicalPath}`,
    faqs: visibleFaqs.map((faq) => ({ ...faq, visible: true })),
  });
  const qaJsonLd = buildQAPageJsonLd({
    url: `https://www.haulcommand.com${canonicalPath}`,
    question: directAnswer.question,
    answer: directAnswer.answer,
    visible: true,
  });

  return (
    <>
      <PageSeoContractJsonLd path={canonicalPath} />
      <JsonLd data={[...(itemListJsonLd ? [itemListJsonLd] : []), ...(qaJsonLd ? [qaJsonLd] : []), ...(faqJsonLd ? [faqJsonLd] : [])]} />
      <ProofStrip variant="bar" />
      <DirectoryBackgroundShell>
        <div style={{ borderBottom: '1px solid #E5E7EB', background: 'var(--hc-graphite)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/directory" style={{ color: '#9ca3af', textDecoration: 'none' }}>Directory</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <Link href={`/directory/${country.toLowerCase()}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>{countryName}</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#C6923A' }}>{roleLabel}</span>
            </nav>

            <div className="inline-flex rounded-full border border-[#C6923A]/30 bg-[#C6923A]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#C6923A]">
              Role-country directory surface
            </div>
            <h1 style={{ margin: '12px 0 8px', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.02em' }}>
              {roleLabel} Directory in <span style={{ color: '#C6923A' }}>{countryName}</span>
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6, maxWidth: 720 }}>
              {entityCount > 0
                ? `${entityCount.toLocaleString()} source-backed ${roleLabel.toLowerCase()} records are mapped for ${countryName}. This page is driven by Supabase role-country coverage, not a city-name guess.`
                : `${roleLabel} is a valid role in the Haul Command taxonomy for ${countryName}, but this market still needs source-backed supply before it is treated as covered.`}
            </p>

            <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { icon: Users, val: entityCount, label: 'Mapped records' },
                { icon: Shield, val: claimedCount, label: 'Claimed' },
                { icon: Shield, val: verifiedCount, label: 'Verified' },
                { icon: MapPin, val: regionCount, label: 'Regions' },
              ].map((stat) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <stat.icon style={{ width: 14, height: 14, color: '#C6923A' }} />
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb' }}>{stat.val.toLocaleString()}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md:!grid-cols-[1fr_320px]">
          <div>
            <div style={{ marginBottom: 16 }}>
              <AeoAnswerCard
                question={directAnswer.question}
                answer={directAnswer.answer}
                confidenceLabel={directAnswer.confidenceLabel}
                sourceLabel="Supabase role-country coverage"
                sourceHref={directAnswer.sourceHref}
                ctaLabel={directAnswer.ctaLabel}
                ctaHref={directAnswer.ctaHref}
                facts={[
                  { label: 'Coverage state', value: coverageState.replace(/_/g, ' ') },
                  { label: 'Index verdict', value: indexVerdict.replace(/_/g, ' ') },
                  { label: 'Data as of', value: roleCountry.coverage.data_as_of ?? 'source-dependent' },
                ]}
              />
            </div>

            {visibleCount === 0 ? (
              <div style={{ background: '#111114', border: '1px solid rgba(241,169,27,0.22)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <MapPin style={{ width: 32, height: 32, color: '#C6923A', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb', marginBottom: 8 }}>Supply gap: {roleLabel} in {countryName}</h2>
                <p style={{ fontSize: 14, color: '#d1d5db', marginBottom: 24 }}>This role-country cell exists in the coverage map, but no renderable public records came back from the directory facade. Claim, submit, or source records to strengthen this market.</p>
                <Link href={`/claim?country=${countryUpper}&role=${encodeURIComponent(roleLabel)}&intent=role-country-supply`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 12, background: '#F1A91B',
                  color: '#111827', fontSize: 15, fontWeight: 900, textDecoration: 'none',
                }}>
                  Add or claim supply <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {records.map((record: any) => (
                  <div key={recordId(record)} style={{
                    background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', margin: 0, lineHeight: 1.3 }}>
                        {displayName(record)}
                      </h3>
                      {record.rank_score && (
                        <span style={{ fontSize: 11, fontWeight: 900, padding: '4px 8px', borderRadius: 8, background: '#FEF9C3', color: '#854D0E', border: '1px solid #FEF08A' }}>
                          {Math.round(Number(record.rank_score))}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                      <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4, color: '#6b7280' }} />
                      {[record.city_inferred || record.city, stateFullName(record.state_inferred || record.admin1_code || record.state)].filter(Boolean).join(', ') || countryName}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                      <Link href={`/directory/dossier/${recordId(record)}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: '#111827', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#f9fafb', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      }}>
                        View Profile
                      </Link>
                      <Link href={`/loads/post?intent=role-country-support&country=${countryUpper}&role=${encodeURIComponent(roleLabel)}&listing=${encodeURIComponent(recordId(record))}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: '#C6923A', border: '1px solid #B45309',
                        color: '#111827', fontSize: 12, fontWeight: 800, textDecoration: 'none',
                      }}>
                        Build packet
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AdGridSlot zone={`role_${countryUpper.toLowerCase()}_${roleCountry.coverage.role_key}_sponsor`} />
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Role-country actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: `/directory?country=${countryUpper}&q=${encodeURIComponent(roleLabel)}`, label: `Search ${roleLabel}` },
                  { href: `/claim?country=${countryUpper}&role=${encodeURIComponent(roleLabel)}`, label: 'Claim or correct a record' },
                  { href: `/loads/post?country=${countryUpper}&role=${encodeURIComponent(roleLabel)}`, label: 'Post a support request' },
                  { href: `/regulations/${country.toLowerCase()}`, label: `${countryName} requirements` },
                  { href: `/directory/${country.toLowerCase()}`, label: `Browse ${countryName}` },
                ].map((link) => (
                  <Link key={link.href} href={link.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 13, color: '#d1d5db', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>FAQ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {visibleFaqs.map((faq) => (
                  <div key={faq.question}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>{faq.question}</h4>
                    <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
          <NoDeadEndBlock
            heading={`Keep building ${roleLabel} coverage in ${countryName}`}
            moves={[
              { href: '/directory', icon: '', title: 'Full Directory', desc: 'Search all support records', primary: true, color: '#0a66c2' },
              { href: `/claim?country=${countryUpper}&role=${encodeURIComponent(roleLabel)}`, icon: '', title: 'Claim / Fix Profile', desc: 'Improve a claimable record', primary: true, color: '#86198F' },
              { href: `/loads/post?country=${countryUpper}&role=${encodeURIComponent(roleLabel)}`, icon: '', title: 'Post Request', desc: 'Create demand signal' },
              { href: '/corridors', icon: '', title: 'Corridors', desc: 'Route intelligence' },
              { href: '/escort-requirements', icon: '', title: 'Requirements', desc: 'Escort rules' },
              { href: '/training', icon: '', title: 'Get Certified', desc: 'HC training program' },
            ]}
          />
        </div>
      </DirectoryBackgroundShell>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { country, slug } = await params;
  const normalizedCountry = normalizeDirectoryCountry(country);
  if (normalizedCountry) {
    const supabase = createClient();
    const roleCountry = await getRoleCountryPageData(supabase, normalizedCountry, slug);
    if (roleCountry) {
      const roleLabel = roleCountry.role.display_name ?? displayRoleFromSlug(slug);
      const marketName = countryDisplayName(normalizedCountry);
      const count = Number(roleCountry.coverage.entity_count ?? 0);
      return generatePageMetadata({
        title: `${marketName} ${roleLabel} Directory`,
        description: count > 0
          ? `Find ${count.toLocaleString()} source-backed ${roleLabel.toLowerCase()} records in ${marketName}. Compare claim state, proof, contact paths, and support actions before dispatch.`
          : `${roleLabel} is mapped for ${marketName}, but Haul Command marks this role-country market as a supply gap until source-backed records are attached.`,
        canonicalPath: roleCountry.coverage.page_url ?? canonicalPath,
        countryCode: normalizedCountry.toLowerCase(),
        noIndex: roleCountry.coverage.index_verdict !== 'index_now',
      });
    }
  }

  const canonicalPath = `/directory/${country}/${slug}`;
  const dbContract = await getPageSeoContract(canonicalPath);
  if (dbContract) return metadataFromDbPageSeoContract(dbContract, canonicalPath);

  const plan = buildDirectoryMarketFilterPlan({ country, slug });
  const countryUpper = plan.countryCode ?? country.toUpperCase();
  const marketName = plan.marketName;
  const supabase = createClient();
  let count = await countDirectoryMarketRecords(supabase, plan, countryUpper);
  if (count === 0) {
    const fallback = await fetchDirectoryMarketSourceFallback(supabase, plan, countryUpper);
    count = fallback.totalCount || fallback.records.length;
  }

  return contractToMetadata(buildDirectoryMarketSeoContract({
    countryCode: countryUpper,
    marketName,
    slug,
    recordCount: count,
    noIndexWhenEmpty: plan.noIndexWhenEmpty,
    marketKind: plan.scope.type === 'region' ? 'region' : plan.scope.type === 'metro' ? 'metro' : 'city',
  }));
}

export default async function CityDirectoryPage({ params }: PageProps) {
  const { country, slug } = await params;
  // Guard: if params resolution fails for any reason, 404 cleanly
  if (!country || !slug) { notFound(); }

  const firstSegmentCountry = normalizeDirectoryCountry(country);
  const secondSegmentCountry = normalizeDirectoryCountry(slug);
  if (!firstSegmentCountry && secondSegmentCountry) {
    const roleQuery = displayRoleFromSlug(country);
    redirect(`/directory?country=${secondSegmentCountry}&q=${encodeURIComponent(roleQuery)}`);
  }

  const plan = buildDirectoryMarketFilterPlan({ country, slug });
  const countryUpper = plan.countryCode ?? country.toUpperCase();

  const supabase = createClient();
  const roleCountry = await getRoleCountryPageData(supabase, countryUpper, slug);
  if (roleCountry) {
    return await RoleCountryDirectoryPage({
      country,
      slug,
      countryUpper,
      roleCountry,
    });
  }

  //  OPERATOR-FIRST RESOLUTION
  // P0 FIX: Check if this slug matches an operator before treating
  // it as a city name. Without this, URLs like
  // /directory/ak/lopez-contracting-nc-pilot-driver render as
  // "Pilot Car Services in Lopez Contracting Nc Pilot Driver"
  // with 0 operators — destroying trust.
  //
  let operatorMatch: any = null;
  try {
    const { data } = await supabase
      .from('v_directory_operators')
      .select('*')
      .eq('slug', slug)
      .eq('country_code', countryUpper)
      .limit(1)
      .maybeSingle();
    operatorMatch = data;

  } catch (e) {
    // Slug doesn't match an operator — fall through to city behavior
  }

  if (operatorMatch) {
    redirect(`/directory/dossier/${recordId(operatorMatch)}`);
  }

  const cityName = plan.marketName;
  const marketKind = plan.scope.type === 'region' ? 'region' : plan.scope.type === 'metro' ? 'metro' : 'city';

  // Fetch public directory records in this market through the directory surface facade.
  let { records: ops, totalCount } = await fetchDirectoryMarketRecords(supabase, plan, countryUpper);
  if (totalCount === 0) {
    const fallback = await fetchDirectoryMarketSourceFallback(supabase, plan, countryUpper);
    ops = fallback.records;
    totalCount = fallback.totalCount;
  }
  const opCount = totalCount || ops.length;

  // If absolutely no operators found, still render the page (SEO value)
  // but show a CTA instead of just 404

  const visibleFaqs = [
    { question: `How many pilot car support records serve ${cityName}?`, answer: opCount > 0 ? `There are currently ${opCount} support records listed in the ${cityName} area. Each record should be judged by its claim, proof, contact, and freshness state.` : `We are actively growing our ${cityName} network. Claim or submit a support record to help build the market.` },
    { question: `How do I book an escort in ${cityName}?`, answer: opCount > 0 ? `Browse the support records listed above, check proof state and availability where present, and build a support packet before dispatching.` : `Once more support records are claimed and improved in ${cityName}, you will be able to compare stronger options. Use our Escort Calculator for estimates in the meantime.` },
    { question: `What does a pilot car cost in ${cityName}?`, answer: `Rates vary by route, load dimensions, and escort requirements. Use our Escort Calculator for instant estimates based on your specific haul.` },
  ];
  const directAnswer = buildMarketDirectAnswer({ cityName, countryUpper, marketKind, opCount, slug });

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pilot car and heavy haul support records in ${cityName}`,
    description: `Claimable and proof-state directory records in the ${cityName} ${marketKind}, ${countryUpper}`,
    numberOfItems: opCount,
    itemListElement: ops.slice(0, 10).map((op: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: displayName(op),
        address: { '@type': 'PostalAddress', addressLocality: op.city_inferred || op.city, addressRegion: op.state_inferred || op.admin1_code || countryUpper, addressCountry: countryUpper },
      },
    })),
  };
  const faqJsonLd = buildFAQPageJsonLd({
    url: `https://www.haulcommand.com/directory/${country}/${slug}`,
    faqs: visibleFaqs.map((faq) => ({ ...faq, visible: true })),
  });
  const qaJsonLd = buildQAPageJsonLd({
    url: `https://www.haulcommand.com/directory/${country}/${slug}`,
    question: directAnswer.question,
    answer: directAnswer.answer,
    visible: true,
  });

  return (
    <>
      <PageSeoContractJsonLd path={`/directory/${country}/${slug}`} />
      <JsonLd data={[jsonLd, ...(qaJsonLd ? [qaJsonLd] : []), ...(faqJsonLd ? [faqJsonLd] : [])]} />
      <ProofStrip variant="bar" />

      <DirectoryBackgroundShell>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #E5E7EB', background: 'var(--hc-graphite)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/directory" style={{ color: '#9ca3af', textDecoration: 'none' }}>Directory</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <Link href={`/directory/${country}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>{countryUpper}</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#C6923A' }}>{cityName}</span>
            </nav>

            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.02em' }}>
              Pilot Car Services in <span style={{ color: '#C6923A' }}>{cityName}</span>
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6, maxWidth: 600 }}>
              {opCount > 0
                ? `${opCount} indexed support records serving the ${cityName} area. Compare proof state, claim status, contact paths, and support actions before dispatch.`
                : `Looking for pilot car operators in ${cityName}? Submit or claim a support record so the market can mature without fake supply.`}
            </p>

            {/* Stats strip */}
            {opCount > 0 && (
              <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                {[
                  { icon: Users, val: opCount, label: 'Records' },
                  { icon: Shield, val: ops.filter(isVerifiedRecord).length, label: 'Proofed' },
                  { icon: Shield, val: ops.filter(isClaimedRecord).length, label: 'Claimed' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <s.icon style={{ width: 14, height: 14, color: '#C6923A' }} />
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb' }}>{s.val}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md:!grid-cols-[1fr_320px]">

          {/* Support record grid */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <AeoAnswerCard
                question={directAnswer.question}
                answer={directAnswer.answer}
                confidenceLabel={directAnswer.confidenceLabel}
                sourceLabel="Haul Command directory facade"
                sourceHref={directAnswer.sourceHref}
                ctaLabel={directAnswer.ctaLabel}
                ctaHref={directAnswer.ctaHref}
                facts={[
                  { label: 'Records', value: opCount },
                  { label: 'Market', value: marketKind },
                  { label: 'Country', value: countryUpper },
                ]}
              />
            </div>
            {ops.length === 0 ? (
              <div style={{ background: '#111114', border: '1px solid rgba(241,169,27,0.22)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <MapPin style={{ width: 32, height: 32, color: '#C6923A', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb', marginBottom: 8 }}>Market Open: {cityName}</h2>
                <p style={{ fontSize: 14, color: '#d1d5db', marginBottom: 24 }}>There are currently no source-backed support records listed in this territory. Claim or submit a listing to open the market with real proof.</p>
                <Link href={cityClaimHref(countryUpper, slug)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 12, background: '#F1A91B',
                  color: '#f9fafb', fontSize: 15, fontWeight: 900, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4)'
                }}>
                  Claim the {cityName} Market <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {ops.map((op: any) => (
                  <div key={recordId(op)} style={{
                    background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0056B3', margin: 0, lineHeight: 1.3 }}>
                          {displayName(op)}
                        </h3>
                      </div>
                      {op.confidence_score && (
                        <span style={{
                          fontSize: 11, fontWeight: 900, padding: '4px 8px', borderRadius: 8,
                          background: op.confidence_score >= 80 ? '#F0FDF4' : op.confidence_score >= 50 ? '#FEF9C3' : '#FEF2F2',
                          color: op.confidence_score >= 80 ? '#15803D' : op.confidence_score >= 50 ? '#854D0E' : '#991B1B',
                          border: `1px solid ${op.confidence_score >= 80 ? '#BBF7D0' : op.confidence_score >= 50 ? '#FEF08A' : '#FECACA'}`,
                        }}>
                          {op.confidence_score}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                      <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4, color: '#6b7280' }} />
                      {[op.city_inferred || op.city, stateFullName(op.state_inferred || op.admin1_code || op.state)].filter(Boolean).join(', ')}
                    </div>

                    {[] && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(Array.isArray([]) ? [] : []).slice(0, 3).map((eq: string) => (
                          <span key={eq} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, background: '#F3F4F6', color: '#374151', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                      <Link href={`/directory/dossier/${recordId(op)}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: 'var(--hc-graphite)', border: '1px solid #D1D5DB',
                        color: '#374151', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      }}>
                        View Profile
                      </Link>
                      <Link href={`/loads/post?intent=city-support&country=${countryUpper}&market=${encodeURIComponent(slug)}&listing=${encodeURIComponent(recordId(op))}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: '#0a66c2', border: '1px solid #004182',
                        color: '#ffffff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      }}>
                        Build support packet
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Claim CTA for operators */}
            <div style={{ marginTop: 24, background: '#FDF4FF', border: '1px solid #F0ABFC', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#86198F', marginBottom: 4 }}>Support {cityName}?</h3>
                <p style={{ fontSize: 13, color: '#A21CAF', margin: 0 }}>Claim your listing, add proof, and make your service areas clearer before brokers compare options.</p>
              </div>
              <Link href={cityClaimHref(countryUpper, slug)} style={{
                padding: '10px 20px', borderRadius: 8, background: '#86198F',
                color: '#ffffff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Start free claim
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AdGridSlot zone={`city_${slug}_sponsor`} />

            {/* Local context */}
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                {cityName} Area Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: `/regulations/${country.toLowerCase()}`, label: 'Country Requirements', icon: '01' },
                  { href: `/corridors?country=${countryUpper}`, label: 'Find Source-Backed Corridors', icon: '02' },
                  { href: `/tools?country=${countryUpper}`, label: 'Heavy Haul Tools', icon: '03' },
                  { href: `/loads/post?country=${countryUpper}&market=${encodeURIComponent(slug)}&intent=city-support`, label: 'Build Support Packet', icon: '04' },
                  { href: `/directory/${country}`, label: `Browse All ${countryUpper}`, icon: '05' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, fontSize: 13, color: '#9ca3af', textDecoration: 'none',
                    transition: 'all 0.15s', background: '#F9FAFB'
                  }} className="hover:bg-gray-100">
                    <span>{l.icon}</span> <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ Section for local SEO */}
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                FAQ
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {visibleFaqs.map((faq, i) => (
                  <div key={i}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>{faq.question}</h4>
                    <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Product Teaser: Market Pulse */}
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Market Pulse
                </h3>
                <span className="bg-[#FEF9C3] text-[#854D0E] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#FDE047]">
                  PRO
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Rate bands, route demand, and corridor sponsor inventory unlock after source-backed market signals are attached.</p>

              <div style={{ opacity: 0.72, userSelect: 'none', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Rate observations', 'Support density', 'Top corridor signals'].map((label) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f9fafb' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 800 }}>Source review</span>
                  </div>
                ))}
              </div>

              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0.4))' }}>
                <Link href={`/pricing?intent=market-pulse&country=${countryUpper}&region=${encodeURIComponent(slug)}`} style={{
                  background: '#C6923A', color: '#ffffff', padding: '10px 20px', borderRadius: 8,
                  fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                  textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }} className="hover:bg-[#B45309] transition-colors">
                  Unlock Pro Data
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* No Dead End */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
          <NoDeadEndBlock
            heading={`Looking for More in ${cityName}?`}
            moves={[
              { href: '/directory', icon: '', title: 'Full Directory', desc: 'Search all support records', primary: true, color: '#0a66c2' },
              { href: '/claim', icon: '', title: 'Claim / Fix Profile', desc: 'Improve a claimable record', primary: true, color: '#86198F' },
              { href: '/available-now', icon: '', title: 'Available Now', desc: 'Availability intake' },
              { href: '/corridors', icon: '', title: 'Corridors', desc: 'Route intelligence' },
              { href: '/escort-requirements', icon: '', title: 'Requirements', desc: 'State escort rules' },
              { href: '/training', icon: '', title: 'Get Certified', desc: 'HC training program' },
            ]}
          />
        </div>
      </DirectoryBackgroundShell>
    </>
  );
}
