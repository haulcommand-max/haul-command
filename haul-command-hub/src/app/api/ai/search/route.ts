import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * pgvector AI Search — Semantic Search Engine
 * 
 * POST /api/ai/search
 * 
 * Full-stack semantic search across the Haul Command knowledge graph:
 *   - Dictionary terms & glossary (768-dim embeddings)
 *   - Regulations database (768-dim embeddings)
 *   - Provider directory (canonical: directory_listings)
 *   - Load board
 * 
 * Architecture:
 *   1. Embed user query via Gemini text-embedding-004
 *   2. Cosine similarity search against pgvector columns
 *   3. Merge results with keyword fallback
 *   4. Rank by hybrid score (semantic + keyword + recency)
 *   5. Return typed, paginated results
 * 
 * Embedding model: Gemini text-embedding-004 (768 dimensions)
 * Requires: pgvector extension enabled in Supabase
 */

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_MATCH_THRESHOLD = 0.65;
const DEFAULT_RESULT_LIMIT = 20;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getGemini() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

// ─── Embedding Generation ────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  const genai = getGemini();
  if (!genai) return null;

  try {
    const model = genai.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('[AI Search] Embedding generation failed:', err);
    return null;
  }
}

// ─── Search Types ────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: 'dictionary' | 'regulation' | 'provider' | 'load' | 'page';
  title: string;
  snippet: string;
  score: number;
  url?: string;
  metadata?: Record<string, any>;
}

interface SearchRequest {
  query: string;
  types?: string[];       // Filter to specific result types
  country?: string;       // Filter by country code
  limit?: number;
  threshold?: number;     // Minimum similarity threshold
  hybrid?: boolean;       // Enable hybrid keyword+semantic search (default: true)
}

// ─── Semantic Search Across Tables ───────────────────────────

async function searchDictionary(
  supabase: any,
  embedding: number[],
  threshold: number,
  limit: number,
  country?: string,
): Promise<SearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('match_dictionary_terms', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.term_id,
      type: 'dictionary' as const,
      title: row.term,
      snippet: row.definition?.substring(0, 200) + '...',
      score: Math.round(row.similarity * 100) / 100,
      url: `/dictionary/term/${row.term_id}`,
    }));
  } catch {
    return [];
  }
}

async function searchRegulations(
  supabase: any,
  embedding: number[],
  threshold: number,
  limit: number,
  country?: string,
): Promise<SearchResult[]> {
  try {
    const { data, error } = await supabase.rpc('match_regulations' as any, {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: threshold,
      match_count: limit,
      ...(country ? { country_filter: country.toUpperCase() } : {}),
    });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      type: 'regulation' as const,
      title: row.title || row.requirement_name,
      snippet: row.description?.substring(0, 200) || row.requirement_text?.substring(0, 200) || '',
      score: Math.round(row.similarity * 100) / 100,
      url: row.country_code ? `/requirements/${row.country_code.toLowerCase()}` : '/requirements',
      metadata: {
        country: row.country_code,
        category: row.category,
      },
    }));
  } catch {
    return [];
  }
}

async function keywordSearchProviders(
  supabase: any,
  query: string,
  limit: number,
  country?: string,
): Promise<SearchResult[]> {
  try {
    // Real operators from hc_public_operators (verified data)
    let q = supabase
      .from('hc_public_operators')
      .select('id, slug, name, city, state_code, country_code, entity_type')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,entity_type.ilike.%${query}%`)
      .limit(limit);

    if (country) {
      q = q.eq('country_code', country.toUpperCase());
    }

    const { data, error } = await q;
    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      type: 'provider' as const,
      title: row.name,
      snippet: `${row.entity_type?.replace(/_/g, ' ')} in ${row.city}, ${row.state_code} (${row.country_code})`,
      score: 0.7,
      url: `/place/${row.slug}`,
      metadata: {
        country: row.country_code,
        state: row.state_code,
      },
    }));
  } catch {
    return [];
  }
}

async function keywordSearchLoads(
  supabase: any,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  try {
    const { data, error } = await supabase
      .from('hc_loads')
      .select('id, origin, destination, service_type, distance_miles, urgency, status, created_at')
      .or(`origin.ilike.%${query}%,destination.ilike.%${query}%,service_type.ilike.%${query}%`)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      type: 'load' as const,
      title: `${row.origin} → ${row.destination}`,
      snippet: `${row.service_type?.replace(/_/g, ' ')} • ${row.distance_miles} mi • ${row.urgency}`,
      score: 0.65,
      url: '/dispatch',
      metadata: {
        serviceType: row.service_type,
        urgency: row.urgency,
        distanceMiles: row.distance_miles,
      },
    }));
  } catch {
    return [];
  }
}

// ─── API Endpoints ───────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    name: 'Haul Command AI Search',
    version: '1.0',
    description: 'Semantic search across the HC knowledge graph using pgvector embeddings.',
    endpoint: '/api/ai/search',
    method: 'POST',
    capabilities: {
      embeddingModel: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      searchTypes: ['dictionary', 'regulation', 'provider', 'load'],
      hybridSearch: true,
    },
    schema: {
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Natural language search query' },
        types: { type: 'array', items: 'string', description: 'Filter result types' },
        country: { type: 'string', description: 'Filter by country code (e.g. US, DE)' },
        limit: { type: 'number', description: 'Max results per type (default: 20)' },
        threshold: { type: 'number', description: 'Min similarity score 0-1 (default: 0.65)' },
        hybrid: { type: 'boolean', description: 'Enable hybrid keyword+semantic (default: true)' },
      },
    },
  });
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body: SearchRequest = await req.json();
    const { query, types, country, hybrid = true } = body;
    const limit = Math.min(body.limit ?? DEFAULT_RESULT_LIMIT, 50);
    const threshold = body.threshold ?? DEFAULT_MATCH_THRESHOLD;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be a string with at least 2 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Search service unavailable' },
        { status: 503 }
      );
    }

    const allResults: SearchResult[] = [];
    const searchTypes = types || ['dictionary', 'regulation', 'provider', 'load'];

    // 1. Generate embedding for semantic search
    const embedding = await generateEmbedding(query);
    const hasEmbedding = embedding !== null && embedding.length === EMBEDDING_DIMENSIONS;

    // 2. Run searches in parallel
    const searches: Promise<SearchResult[]>[] = [];

    if (searchTypes.includes('dictionary') && hasEmbedding) {
      searches.push(searchDictionary(supabase, embedding!, threshold, limit, country));
    }

    if (searchTypes.includes('regulation') && hasEmbedding) {
      searches.push(searchRegulations(supabase, embedding!, threshold, limit, country));
    }

    if (hybrid || !hasEmbedding) {
      // Keyword fallback / hybrid enrichment
      if (searchTypes.includes('provider')) {
        searches.push(keywordSearchProviders(supabase, query, limit, country));
      }
      if (searchTypes.includes('load')) {
        searches.push(keywordSearchLoads(supabase, query, Math.min(limit, 10)));
      }
    }

    const results = await Promise.allSettled(searches);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    }

    // 3. Deduplicate by id + type
    const seen = new Set<string>();
    const deduped = allResults.filter(r => {
      const key = `${r.type}:${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 4. Sort by score descending
    deduped.sort((a, b) => b.score - a.score);

    // 5. Group by type for structured response
    const grouped: Record<string, SearchResult[]> = {};
    for (const r of deduped) {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      query,
      totalResults: deduped.length,
      embeddingUsed: hasEmbedding,
      hybridMode: hybrid,
      latencyMs,
      results: deduped.slice(0, limit),
      grouped,
      meta: {
        embeddingModel: hasEmbedding ? EMBEDDING_MODEL : 'none',
        threshold,
        searchTypes,
        ...(country ? { countryFilter: country } : {}),
      },
    });
  } catch (err: any) {
    console.error('[AI Search] Error:', err);
    return NextResponse.json(
      { error: 'Search failed', details: err.message },
      { status: 500 }
    );
  }
}
