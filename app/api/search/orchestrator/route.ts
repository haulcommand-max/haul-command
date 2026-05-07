import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTypesenseSearch, OPERATORS_COLLECTION } from '@/lib/typesense/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TYPESENSE_COLLECTIONS: Record<string, string> = {
  profiles: OPERATORS_COLLECTION,
  operators: OPERATORS_COLLECTION,
  directory: OPERATORS_COLLECTION,
  glossary: 'hc_glossary',
  regulations: 'hc_regulations',
  tools: 'hc_tools',
  loads: 'hc_loads',
};

const TYPESENSE_QUERY_BY: Record<string, string> = {
  profiles: 'company_name,bio,city,state,role_subtypes,service_categories,service_states,service_corridors',
  operators: 'company_name,bio,city,state,role_subtypes,service_categories,service_states,service_corridors',
  directory: 'company_name,bio,city,state,role_subtypes,service_categories,service_states,service_corridors',
  glossary: 'canonical_term,synonyms,definition,summary',
  regulations: 'title,rule_type,summary,content,country_code',
  tools: 'tool_name,tool_family,description',
  loads: 'origin_city,destination_city,origin_state,destination_state,equipment_type,commodity,notes',
};

function typesenseConfigured() {
  return Boolean(
    (process.env.NEXT_PUBLIC_TYPESENSE_HOST || process.env.TYPESENSE_HOST) &&
    (process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || process.env.TYPESENSE_ADMIN_KEY || process.env.TYPESENSE_API_KEY)
  );
}

function buildTypesenseFilter(filters: Record<string, unknown>, countryCode?: string, roleContext?: string) {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(filters || {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      const safeValues = value.map(v => String(v).replace(/`/g, '')).join(',');
      parts.push(`${key}:=[${safeValues}]`);
    } else {
      parts.push(`${key}:=${String(value).replace(/`/g, '')}`);
    }
  }

  if (countryCode) parts.push(`country_code:=${countryCode}`);
  if (roleContext) parts.push(`role_subtypes:=${roleContext}`);

  return parts.length > 0 ? parts.join(' && ') : undefined;
}

async function searchTypesense(options: {
  query: string;
  family: string;
  filters: Record<string, unknown>;
  country_code?: string;
  role_context?: string;
  limit: number;
}) {
  if (!typesenseConfigured()) {
    return { source: 'typesense_disabled', results: [], found: 0, error: null as string | null };
  }

  try {
    const client = getTypesenseSearch();
    const collection = TYPESENSE_COLLECTIONS[options.family] || TYPESENSE_COLLECTIONS.profiles;
    const queryBy = TYPESENSE_QUERY_BY[options.family] || TYPESENSE_QUERY_BY.profiles;
    const filterBy = buildTypesenseFilter(options.filters, options.country_code, options.role_context);

    const response = await client.collections(collection).documents().search({
      q: options.query,
      query_by: queryBy,
      filter_by: filterBy,
      per_page: options.limit,
      num_typos: 1,
    });

    return {
      source: 'typesense',
      results: (response.hits ?? []).map(hit => hit.document),
      found: response.found ?? 0,
      error: null as string | null,
    };
  } catch (error: any) {
    console.warn('[search/orchestrator] Typesense search failed; falling back to Supabase HC Vector', error?.message || error);
    return { source: 'typesense_error', results: [], found: 0, error: error?.message || 'Typesense search failed' };
  }
}

async function searchSupabaseVector(options: {
  query: string;
  index_name?: string;
  country_code?: string;
  role_context?: string;
  limit: number;
}) {
  let vectorQuery = supabase
    .from('hc_vector')
    .select('id, vector_id, index_name, content_type, content, country_code, role_context, corridor_key, source_url, metadata, confidence_score')
    .textSearch('content', options.query, { type: 'websearch', config: 'english' })
    .eq('is_active', true)
    .limit(options.limit);

  if (options.index_name) vectorQuery = vectorQuery.eq('index_name', options.index_name);
  if (options.country_code) vectorQuery = vectorQuery.eq('country_code', options.country_code);
  if (options.role_context) vectorQuery = vectorQuery.eq('role_context', options.role_context);

  const { data, error } = await vectorQuery;
  if (error) throw error;
  return data || [];
}

async function searchOperatorsFallback(query: string, countryCode?: string) {
  let operatorQuery = supabase
    .from('hc_operators')
    .select('id, company_name, state, city, phone, trust_score, profile_completeness, country_code')
    .or(`company_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(5);

  if (countryCode) operatorQuery = operatorQuery.eq('country_code', countryCode);

  const { data } = await operatorQuery;
  return data || [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      index_name,
      country_code,
      role_context,
      family = 'profiles',
      filters = {},
      limit = 10,
      include_semantic = true,
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // Typesense stays as the fast lexical/faceted search layer for hero search and directory UX.
    // Supabase HC Vector replaces Pinecone for semantic/RAG expansion and content intelligence.
    const typesense = await searchTypesense({
      query,
      family,
      filters,
      country_code,
      role_context,
      limit,
    });

    let vectorResults: any[] = [];
    let vectorError: string | null = null;

    if (include_semantic) {
      try {
        vectorResults = await searchSupabaseVector({
          query,
          index_name: index_name || family,
          country_code,
          role_context,
          limit,
        });
      } catch (error: any) {
        vectorError = error?.message || 'HC Vector search failed';
        console.warn('[search/orchestrator] HC Vector fallback failed', vectorError);
      }
    }

    const operatorFallback = family === 'profiles' || family === 'operators' || family === 'directory'
      ? await searchOperatorsFallback(query, country_code)
      : [];

    return NextResponse.json({
      query,
      source: typesense.results.length > 0 ? 'typesense_plus_hc_vector' : 'hc_vector_fallback',
      results: typesense.results,
      semantic_results: vectorResults,
      operators: operatorFallback,
      total: typesense.results.length + vectorResults.length + operatorFallback.length,
      engines: {
        typesense: {
          enabled: typesenseConfigured(),
          found: typesense.found,
          error: typesense.error,
        },
        supabase_hc_vector: {
          enabled: true,
          count: vectorResults.length,
          error: vectorError,
        },
        pinecone: {
          enabled: false,
          replaced_by: 'supabase_hc_vector',
        },
      },
    });

  } catch (err) {
    console.error('Search orchestrator error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const index_name = searchParams.get('index_name') || undefined;
  const country_code = searchParams.get('country_code') || undefined;
  const role_context = searchParams.get('role_context') || undefined;
  const family = searchParams.get('family') || 'profiles';
  const limit = Number(searchParams.get('limit') || 10);
  const include_semantic = searchParams.get('include_semantic') !== 'false';

  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ query, index_name, country_code, role_context, family, limit, include_semantic }),
  }));
}
