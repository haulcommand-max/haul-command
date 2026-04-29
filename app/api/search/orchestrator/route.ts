import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { query, index_name, country_code, role_context, limit = 10 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // HC Vector search — Supabase pgvector replaces Pinecone.
    // Full-text search via Postgres replaces Typesense in this orchestrator.
    let vectorQuery = supabase
      .from('hc_vector')
      .select('id, vector_id, index_name, content_type, content, country_code, role_context, corridor_key, source_url, metadata, confidence_score')
      .textSearch('content', query, { type: 'websearch', config: 'english' })
      .eq('is_active', true)
      .limit(limit);

    if (index_name) vectorQuery = vectorQuery.eq('index_name', index_name);
    if (country_code) vectorQuery = vectorQuery.eq('country_code', country_code);
    if (role_context) vectorQuery = vectorQuery.eq('role_context', role_context);

    const { data: textResults, error: textError } = await vectorQuery;

    if (textError) {
      console.error('HC Vector search error:', textError);
      return NextResponse.json({ error: textError.message }, { status: 500 });
    }

    // Also search operators directory via Postgres fallback.
    let operatorQuery = supabase
      .from('hc_operators')
      .select('id, company_name, state, city, phone, trust_score, profile_completeness')
      .or(`company_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(5);

    if (country_code) operatorQuery = operatorQuery.eq('country_code', country_code);

    const { data: operatorResults } = await operatorQuery;

    return NextResponse.json({
      results: textResults || [],
      operators: operatorResults || [],
      total: (textResults?.length || 0) + (operatorResults?.length || 0),
      source: 'hc_vector',
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
  const limit = Number(searchParams.get('limit') || 10);

  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ query, index_name, country_code, role_context, limit }),
  }));
}
