import { NextRequest, NextResponse } from 'next/server';
import Typesense from 'typesense';
import { createClient } from '@supabase/supabase-js';

function getTypesenseClient() {
  const host = process.env.TYPESENSE_HOST;
  const apiKey = process.env.TYPESENSE_API_KEY;

  if (!host || !apiKey) return null;

  return new Typesense.Client({
    nodes: [
      {
        host,
        port: Number(process.env.TYPESENSE_PORT) || 8108,
        protocol: process.env.TYPESENSE_PROTOCOL || 'http',
      },
    ],
    apiKey,
    connectionTimeoutSeconds: 5,
  });
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const tsCollectionMap: Record<string, string> = {
  profiles: 'hc_profiles',
  glossary: 'hc_glossary',
  regulations: 'hc_regulations',
  tools: 'hc_tools',
};

const queryByMap: Record<string, string> = {
  profiles: 'display_name,services,certifications',
  glossary: 'canonical_term,synonyms',
  regulations: 'title,rule_type',
  tools: 'tool_name,tool_family',
};

function buildFilterString(filters: Record<string, unknown>, countryCode?: string) {
  const pieces = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:=${String(value)}`);

  if (countryCode) pieces.push(`country_code:=${countryCode}`);
  return pieces.length ? pieces.join(' && ') : undefined;
}

async function supabaseFallbackSearch(params: {
  query: string;
  countryCode?: string;
  family: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const table = params.family === 'glossary'
    ? 'glossary_terms'
    : params.family === 'regulations'
      ? 'seo_pages'
      : params.family === 'tools'
        ? 'seo_pages'
        : 'directory_listings';

  const select = '*';
  let request = supabase.from(table).select(select).limit(20);

  // Conservative text fallback. Exact full-text/vector implementations can be layered on top of Supabase later.
  if (params.family === 'glossary') {
    request = request.ilike('canonical_term', `%${params.query}%`);
  } else if (params.family === 'profiles') {
    request = request.or(`display_name.ilike.%${params.query}%,business_name.ilike.%${params.query}%,services.ilike.%${params.query}%`);
  } else {
    request = request.or(`title.ilike.%${params.query}%,slug.ilike.%${params.query}%`);
  }

  if (params.countryCode) {
    request = request.eq('country_code', params.countryCode);
  }

  const { data, error } = await request;
  if (error) {
    console.warn('[Search Orchestrator] Supabase fallback skipped:', error.message);
    return [];
  }

  return data || [];
}

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      filters = {},
      country_code,
      family = 'profiles',
    } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const collection = tsCollectionMap[family] || tsCollectionMap.profiles;
    const queryBy = queryByMap[family] || queryByMap.profiles;
    const tsClient = getTypesenseClient();

    if (tsClient) {
      try {
        const tsResponse = await tsClient.collections(collection).documents().search({
          q: query,
          query_by: queryBy,
          filter_by: buildFilterString(filters, country_code),
          per_page: 20,
        });

        const typesenseResults = (tsResponse.hits ?? []).map(hit => hit.document);

        if (typesenseResults.length > 0) {
          return NextResponse.json({
            source: 'typesense',
            query,
            results: typesenseResults,
            semanticExpanded: false,
            pineconeRemoved: true,
          });
        }
      } catch (error) {
        console.warn('[Search Orchestrator] Typesense failed, falling back to Supabase:', error);
      }
    }

    const fallbackResults = await supabaseFallbackSearch({
      query,
      countryCode: country_code,
      family,
    });

    return NextResponse.json({
      source: 'supabase_fallback',
      query,
      results: fallbackResults,
      semanticExpanded: false,
      pineconeRemoved: true,
      note: 'Pinecone has been intentionally removed. Supabase/Typesense are the supported search layers.',
    });
  } catch (error) {
    console.error('Search Orchestrator Error:', error);
    return NextResponse.json({ error: 'Internal search failure' }, { status: 500 });
  }
}
