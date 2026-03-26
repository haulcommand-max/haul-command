import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Embedding Pipeline — Batch Embedder for pgvector
 * 
 * POST /api/ai/embed
 * 
 * Generates and stores 768-dim embeddings for:
 *   - Dictionary terms (hc_dictionary.embedding)
 *   - Regulations (hc_regulations_global.embedding)
 * 
 * Designed to be called by cron or manually to backfill embeddings.
 * Processes in batches to avoid rate limits.
 * 
 * Usage:
 *   POST /api/ai/embed { table: 'dictionary', batchSize: 50 }
 *   POST /api/ai/embed { table: 'regulations', batchSize: 50 }
 */

const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_BATCH_SIZE = 100;
const DEFAULT_BATCH_SIZE = 50;

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

async function generateEmbedding(genai: GoogleGenerativeAI, text: string): Promise<number[] | null> {
  try {
    const model = genai.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('[Embed Pipeline] Failed to embed:', err);
    return null;
  }
}

// ─── Dictionary Embedder ─────────────────────────────────────

async function embedDictionary(
  supabase: any,
  genai: GoogleGenerativeAI,
  batchSize: number,
) {
  // Fetch terms without embeddings
  const { data: terms, error } = await supabase
    .from('hc_dictionary')
    .select('term_id, term, definition')
    .is('embedding', null)
    .limit(batchSize);

  if (error || !terms || terms.length === 0) {
    return { embedded: 0, remaining: 0, error: error?.message };
  }

  let embedded = 0;
  let failed = 0;

  for (const term of terms as any[]) {
    const text = `${term.term}: ${term.definition}`;
    const embedding = await generateEmbedding(genai, text);

    if (embedding) {
      const { error: updateErr } = await supabase
        .from('hc_dictionary')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('term_id', term.term_id);

      if (!updateErr) {
        embedded++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }

    // Rate limiting: 60ms delay between API calls
    await new Promise(r => setTimeout(r, 60));
  }

  // Check remaining
  const { count } = await supabase
    .from('hc_dictionary')
    .select('term_id', { count: 'exact', head: true })
    .is('embedding', null);

  return { embedded, failed, remaining: count ?? 0 };
}

// ─── Regulations Embedder ────────────────────────────────────

async function embedRegulations(
  supabase: any,
  genai: GoogleGenerativeAI,
  batchSize: number,
) {
  const { data: regs, error } = await supabase
    .from('hc_regulations_global')
    .select('id, title, requirement_name, requirement_text, country_code')
    .is('embedding', null)
    .limit(batchSize);

  if (error || !regs || regs.length === 0) {
    return { embedded: 0, remaining: 0, error: error?.message };
  }

  let embedded = 0;
  let failed = 0;

  for (const reg of regs as any[]) {
    const text = [
      reg.title || reg.requirement_name,
      reg.requirement_text,
      reg.country_code ? `Country: ${reg.country_code}` : '',
    ].filter(Boolean).join(' — ');

    const embedding = await generateEmbedding(genai, text);

    if (embedding) {
      const { error: updateErr } = await supabase
        .from('hc_regulations_global')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', reg.id);

      if (!updateErr) {
        embedded++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }

    await new Promise(r => setTimeout(r, 60));
  }

  const { count } = await supabase
    .from('hc_regulations_global')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  return { embedded, failed, remaining: count ?? 0 };
}

// ─── API ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const cronKey = process.env.CRON_SECRET;
    if (cronKey && authHeader !== `Bearer ${cronKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { table, batchSize: rawBatch } = body;
    const batchSize = Math.min(Math.max(rawBatch ?? DEFAULT_BATCH_SIZE, 1), MAX_BATCH_SIZE);

    if (!table || !['dictionary', 'regulations'].includes(table)) {
      return NextResponse.json(
        { error: "table must be 'dictionary' or 'regulations'" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const genai = getGemini();

    if (!supabase || !genai) {
      return NextResponse.json(
        { error: 'Missing Supabase or Gemini configuration' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    let result;

    if (table === 'dictionary') {
      result = await embedDictionary(supabase, genai, batchSize);
    } else {
      result = await embedRegulations(supabase, genai, batchSize);
    }

    return NextResponse.json({
      table,
      ...result,
      batchSize,
      latencyMs: Date.now() - startTime,
      model: EMBEDDING_MODEL,
      dimensions: 768,
    });
  } catch (err: any) {
    console.error('[Embed Pipeline] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Haul Command Embedding Pipeline',
    version: '1.0',
    description: 'Batch generates pgvector embeddings for dictionary and regulations tables.',
    model: EMBEDDING_MODEL,
    dimensions: 768,
    tables: ['dictionary', 'regulations'],
    usage: 'POST /api/ai/embed { table: "dictionary", batchSize: 50 }',
  });
}
