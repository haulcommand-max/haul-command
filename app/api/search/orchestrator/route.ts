import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import Typesense from 'typesense';
import { createClient } from '@supabase/supabase-js';

// Initialization
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const tsClient = new Typesense.Client({
  nodes: [{ host: process.env.TYPESENSE_HOST!, port: Number(process.env.TYPESENSE_PORT) || 8108, protocol: process.env.TYPESENSE_PROTOCOL || 'http' }],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 5
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { 
      query,
      filters = {},
      country_code,
      family = 'profiles' // profiles, glossary, regulations, tools
    } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const tsCollectionMap: Record<string, string> = {
      'profiles': 'hc_profiles',
      'glossary': 'hc_glossary',
      'regulations': 'hc_regulations',
      'tools': 'hc_tools'
    };
    const collection = tsCollectionMap[family] || 'hc_profiles';

    // 1. FAST PATH: Execute Typesense Lexical/Facet Search
    let tsFilterStr = Object.entries(filters)
      .map(([k, v]) => `${k}:=${v}`)
      .join(' && ');
    if (country_code) {
      tsFilterStr = tsFilterStr ? `${tsFilterStr} && country_code:=${country_code}` : `country_code:=${country_code}`;
    }

    const tsResponse = await tsClient.collections(collection).documents().search({
      q: query,
      query_by: family === 'profiles' ? 'display_name,services,certifications' :
                family === 'glossary' ? 'canonical_term,synonyms' :
                family === 'regulations' ? 'title,rule_type' : 'tool_name,tool_family',
      filter_by: tsFilterStr || undefined,
      per_page: 20
    });

    const isStrongLexicalHit = tsResponse.found > 3 && tsResponse.hits?.[0]?.text_match_info?.score > 50;

    if (isStrongLexicalHit) {
      // Strong lexical intent, return immediately for speed (Typesense First Rule)
      return NextResponse.json({
        source: 'typesense',
        query,
        results: tsResponse.hits.map(h => h.document),
        semanticExpanded: false
      });
    }

    // 2. AMBIGUOUS/WEAK PATH: Fallback to Pinecone Semantic Expansion
    // Embed the incoming query (Assume we have an internal embedder or call OpenAI)
    // Stubbing the embedding array here since real API call depends on selected provider
    const queryEmbedding = new Array(1536).fill(0.1); 

    const pineconeIndex = pinecone.Index('antigravity');
    const pcNamespace = family === 'profiles' ? 'hc_entities_semantic' : 'hc_content_rag';

    const pcResponse = await pineconeIndex.namespace(pcNamespace).query({
      topK: 15,
      vector: queryEmbedding,
      includeMetadata: true,
      filter: country_code ? { country_code: { $eq: country_code } } : undefined
    });

    if (pcResponse.matches.length === 0) {
      return NextResponse.json({
        source: 'typesense_only_weak',
        query,
        results: tsResponse.hits?.map(h => h.document) || [],
        semanticExpanded: false
      });
    }

    // 3. MERGE & HYDRATE: Rerank Pinecone hits and hydrate from Supabase
    const pineconeRecordIds = pcResponse.matches
        .filter(m => m.score && m.score > 0.70) // Confidence threshold
        .map(m => m.metadata?.entity_id || m.metadata?.page_id || m.id);

    let finalHydratedResults = [];
    if (pineconeRecordIds.length > 0) {
      const { data: dbRecords } = await supabase
        .from(family === 'profiles' ? 'entities' : family === 'glossary' ? 'glossary_terms' : 'seo_pages')
        .select('*')
        .in('id', pineconeRecordIds);
      
      finalHydratedResults = dbRecords || [];
    }

    // Merging logic: Combine TS and PC results, prioritizing high-trust PC results
    const combinedSet = new Map();
    tsResponse.hits?.forEach(h => combinedSet.set(h.document.id, h.document));
    finalHydratedResults.forEach(r => {
      // Basic manual schema mapping from Supabase back to response formatting
      // In production, we project this exactly like TS documents
      combinedSet.set(r.id, r);
    });

    return NextResponse.json({
      source: 'merged_semantic',
      query,
      results: Array.from(combinedSet.values()),
      semanticExpanded: true,
      semanticMatchesCount: finalHydratedResults.length
    });

  } catch (error) {
    console.error('Search Orchestrator Error:', error);
    return NextResponse.json({ error: 'Internal search failure' }, { status: 500 });
  }
}
