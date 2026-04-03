/**
 * lib/corridors/corridor-page-generator.ts
 * Haul Command — Corridor OS Page Generator
 *
 * Generates hc_corridor_pages stubs for every active corridor that is missing pages.
 * Run via: scripts/generate-corridor-pages.ts (cron / admin RPC)
 *
 * Page types generated per corridor:
 *   overview, rates, requirements, escorts, credentialed_workers
 *
 * Safe to run repeatedly — uses upsert with (corridor_id, page_type) unique key.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PAGE_TYPES = [
  'overview',
  'rates',
  'requirements',
  'escorts',
  'credentialed_workers',
] as const;

type PageType = typeof PAGE_TYPES[number];

interface CorridorRow {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  country_code: string;
  origin_city_name: string | null;
  origin_region_code: string | null;
  destination_city_name: string | null;
  destination_region_code: string | null;
  corridor_score: number;
  seo_priority_score: number;
  escort_count: number | null;
  permit_count: number | null;
  credential_count: number | null;
}

interface GeneratedPage {
  corridor_id: string;
  page_type: PageType;
  slug: string;
  canonical_url: string;
  title_tag: string;
  meta_description: string;
  h1: string;
  schema_type: string;
  indexable: boolean;
  publish_status: 'draft' | 'ready' | 'published';
  internal_link_score: number;
}

function buildPageMeta(corridor: CorridorRow, pageType: PageType): Omit<GeneratedPage, 'corridor_id' | 'page_type'> {
  const origin = corridor.origin_city_name || corridor.origin_region_code || 'Origin';
  const dest = corridor.destination_city_name || corridor.destination_region_code || 'Destination';
  const name = corridor.name;
  const short = corridor.short_name || `${origin}–${dest}`;

  const base = `https://haulcommand.com/corridors/${corridor.slug}`;
  const score = corridor.seo_priority_score || 50;

  const configs: Record<PageType, {
    slugSuffix: string;
    title: string;
    description: string;
    h1: string;
    schema: string;
    linkScore: number;
  }> = {
    overview: {
      slugSuffix: '',
      title: `${name} — Heavy Haul Escort & Permit Guide | Haul Command`,
      description: `Complete escort requirements, permit costs, operator coverage, and real rate data for the ${name}. Updated regularly by Haul Command.`,
      h1: `${name}: Escort, Permit & Operator Guide`,
      schema: 'Service',
      linkScore: 90,
    },
    rates: {
      slugSuffix: '/rates',
      title: `${short} Escort Rates & Pricing | Haul Command`,
      description: `Current escort vehicle and pilot car rates for the ${name}. See median, min, and max pricing from live market observations.`,
      h1: `${short} Escort Rates`,
      schema: 'PriceSpecification',
      linkScore: 75,
    },
    requirements: {
      slugSuffix: '/requirements',
      title: `${short} Permit & Escort Requirements | Haul Command`,
      description: `State-by-state permit requirements, escort rules, and curfew restrictions for the ${name}. Referenced to official DOT sources.`,
      h1: `${short} Permit & Escort Requirements`,
      schema: 'GovernmentService',
      linkScore: 85,
    },
    escorts: {
      slugSuffix: '/escorts',
      title: `Find Escort Operators on the ${short} | Haul Command`,
      description: `Find verified pilot car and escort vehicle operators available on the ${name}. Filter by certification, equipment, and availability.`,
      h1: `Escort Operators — ${short}`,
      schema: 'ItemList',
      linkScore: 70,
    },
    credentialed_workers: {
      slugSuffix: '/credentialed-workers',
      title: `Credentialed Workers on the ${short} | Haul Command`,
      description: `Find TWIC-card holders, PEVO-certified operators, and other credentialed workers available on the ${name}.`,
      h1: `Credentialed Workers — ${short}`,
      schema: 'ItemList',
      linkScore: 65,
    },
  };

  const cfg = configs[pageType];
  const pageSlug = `${corridor.slug}${cfg.slugSuffix}`;

  // Determine publish status: flagship corridors publish immediately, others start as 'ready'
  const publishStatus: 'ready' | 'published' =
    corridor.corridor_score >= 70 ? 'published' : 'ready';

  // Skip pages when there's no data to populate them
  const indexable =
    pageType === 'overview' ||
    (pageType === 'rates') ||
    (pageType === 'requirements' && (corridor.permit_count || 0) > 0) ||
    (pageType === 'escorts' && (corridor.escort_count || 0) > 0) ||
    (pageType === 'credentialed_workers' && (corridor.credential_count || 0) > 0);

  return {
    slug: pageSlug,
    canonical_url: `${base}${cfg.slugSuffix}`,
    title_tag: cfg.title,
    meta_description: cfg.description,
    h1: cfg.h1,
    schema_type: cfg.schema,
    indexable,
    publish_status: publishStatus,
    internal_link_score: cfg.linkScore,
  };
}

export async function generateCorridorPages(
  options: { dryRun?: boolean; limit?: number } = {},
): Promise<{ total: number; created: number; skipped: number; errors: number }> {
  const { dryRun = false, limit = 500 } = options;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch active corridors with their page count
  const { data: corridors, error } = await supabase
    .from('hc_corridor_public_v1')
    .select(
      'id, slug, name, short_name, country_code, origin_city_name, origin_region_code, destination_city_name, destination_region_code, corridor_score, seo_priority_score, escort_count, permit_count, credential_count'
    )
    .order('corridor_score', { ascending: false })
    .limit(limit);

  if (error || !corridors) {
    console.error('[corridor-page-generator] Failed to fetch corridors:', error);
    return { total: 0, created: 0, skipped: 0, errors: 1 };
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const corridor of corridors as CorridorRow[]) {
    const stagingPages: GeneratedPage[] = PAGE_TYPES.map(pt => ({
      corridor_id: corridor.id,
      page_type: pt,
      ...buildPageMeta(corridor, pt),
    }));

    if (dryRun) {
      console.log('[DRY RUN] Would upsert pages for:', corridor.slug, stagingPages.map(p => p.page_type));
      created += stagingPages.length;
      continue;
    }

    const { error: upsertError, count } = await supabase
      .from('hc_corridor_pages')
      .upsert(stagingPages, {
        onConflict: 'corridor_id,page_type',
        ignoreDuplicates: false, // update existing stubs with new metadata
        count: 'exact',
      });

    if (upsertError) {
      console.error('[corridor-page-generator] Upsert error for', corridor.slug, upsertError);
      errors++;
    } else {
      created += count ?? stagingPages.length;
    }
  }

  console.log(`[corridor-page-generator] Done — corridors: ${corridors.length}, pages: ${created}, skipped: ${skipped}, errors: ${errors}`);
  return { total: corridors.length, created, skipped, errors };
}

// ─── Demand signal writer ──────────────────────────────────────────────────────
// Call this from API routes to record real user demand signals against corridors.

export async function recordCorridorDemandSignal({
  corridorId,
  signalType,
  count = 1,
  countryCode,
  regionCode,
}: {
  corridorId: string;
  signalType: string;
  count?: number;
  countryCode?: string;
  regionCode?: string;
}): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { error } = await supabase.from('hc_corridor_demand_signals').insert({
    corridor_id: corridorId,
    signal_type: signalType,
    signal_count: count,
    window_days: 30,
    country_code: countryCode,
    region_code: regionCode,
  });
  if (error) console.error('[demand-signal]', error);
  return !error;
}

// ─── Route-request matcher ─────────────────────────────────────────────────────
// Looks up the best corridor match for a free-text route request.
// Used by the route-check form to resolve a query to a corridor and record demand.

export async function resolveRouteToCorridorId(originText: string, destinationText: string): Promise<string | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // fuzzy match on corridor name using trigram index
  const query = `${originText} ${destinationText}`;
  const { data } = await supabase
    .from('hc_corridor_public_v1')
    .select('id, name')
    .textSearch('name', query, { type: 'websearch', config: 'english' })
    .order('corridor_score', { ascending: false })
    .limit(1)
    .single();

  return data?.id ?? null;
}
