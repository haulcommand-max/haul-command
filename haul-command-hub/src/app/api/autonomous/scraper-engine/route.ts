import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Autonomous Scraper Engine — Crawl-Enrich-Load Pipeline
 * 
 * POST /api/autonomous/scraper-engine
 * 
 * Multi-stage autonomous pipeline for logistics data ingestion:
 * 
 *   Stage 1: CRAWL  — Receive raw operator data from external crawlers
 *   Stage 2: ENRICH — AI-powered entity normalization & classification
 *   Stage 3: LOAD   — Deduplicated upsert into hc_places + scoring
 *   Stage 4: INDEX  — Queue for embedding generation (pgvector)
 * 
 * Sources:
 *   - Google Maps scraper agents
 *   - SERP results
 *   - State DOT permit databases
 *   - Direct API feeds (Motive, ELDs)
 *   - Manual CSV uploads
 * 
 * Protected by CRON_SECRET bearer token.
 */

const ENRICHMENT_PROMPT = `You are the Haul Command logistics entity resolver.

Given a scraped business listing, extract and normalize:
1. canonical_name: Clean business name (remove Inc., LLC, etc. suffix duplication)
2. service_categories: Array from [pilot_car, escort_vehicle, route_survey, bucket_truck, height_pole, police_escort, tow_truck, crane_service, rigging, heavy_haul_carrier, specialized_transport, permit_service, flagging]
3. coverage_states: Array of US state codes or country codes they likely serve
4. verification_tier: "verified" (has DOT#/MC#), "claimed" (has website), "unclaimed" (scraped only)
5. confidence: 0-100 quality confidence score

Return ONLY valid JSON. No markdown.`;

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

// ─── Types ───────────────────────────────────────────────────

interface RawOperator {
  name: string;
  phone?: string;
  email?: string;
  website?: string | null;
  address?: string;
  lat?: number;
  lng?: number;
  locality?: string;
  admin1_code?: string;
  country_code?: string;
  category?: string;
  source?: string;           // e.g. 'google_maps', 'serp', 'dot_db', 'manual'
  dot_number?: string;
  mc_number?: string;
  usdot_number?: string;
  raw_description?: string;
}

interface EnrichedOperator extends RawOperator {
  canonical_name: string;
  service_categories: string[];
  coverage_states: string[];
  verification_tier: string;
  confidence: number;
  hc_trust_number: string;
  slug: string;
}

// ─── HC Trust Number Generator ───────────────────────────────

function generateHCNumber(countryCode: string, adminCode: string): string {
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HC-${countryCode.toUpperCase()}-${adminCode.toUpperCase()}-${rand}${ts}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
}

// ─── Stage 2: AI Enrichment ──────────────────────────────────

async function enrichOperator(
  genai: GoogleGenerativeAI,
  op: RawOperator,
): Promise<Partial<EnrichedOperator>> {
  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const context = [
      `Name: ${op.name}`,
      op.category ? `Category: ${op.category}` : '',
      op.address ? `Address: ${op.address}` : '',
      op.locality ? `City: ${op.locality}` : '',
      op.admin1_code ? `State: ${op.admin1_code}` : '',
      op.country_code ? `Country: ${op.country_code}` : '',
      op.website ? `Website: ${op.website}` : '',
      op.raw_description ? `Description: ${op.raw_description}` : '',
      op.dot_number ? `DOT#: ${op.dot_number}` : '',
      op.mc_number ? `MC#: ${op.mc_number}` : '',
    ].filter(Boolean).join('\n');

    const result = await model.generateContent(`${ENRICHMENT_PROMPT}\n\nListing:\n${context}`);
    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[Scraper Engine] AI enrichment failed for:', op.name, err);
  }
  
  // Fallback enrichment without AI
  return {
    canonical_name: op.name,
    service_categories: [op.category || 'pilot_car'],
    coverage_states: op.admin1_code ? [op.admin1_code] : [],
    verification_tier: op.dot_number ? 'verified' : op.website ? 'claimed' : 'unclaimed',
    confidence: op.dot_number ? 70 : op.website ? 50 : 30,
  };
}

// ─── Stage 3: Deduplication & Upsert ─────────────────────────

async function deduplicateAndLoad(
  supabase: any,
  enriched: EnrichedOperator,
): Promise<'inserted' | 'updated' | 'duplicate' | 'error'> {
  try {
    // Multi-signal deduplication
    // 1. Phone match (strongest signal)
    if (enriched.phone) {
      const cleanPhone = enriched.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 7) {
        const { data: phoneMatch } = await supabase
          .from('hc_places')
          .select('id, name, slug')
          .ilike('phone', `%${cleanPhone.slice(-7)}%`)
          .limit(1)
          .maybeSingle();

        if (phoneMatch) {
          // Update existing record with new data
          await supabase
            .from('hc_places')
            .update({
              website: enriched.website || undefined,
              surface_category_key: enriched.service_categories[0],
              updated_at: new Date().toISOString(),
              source_system: `autonomous_scraper_${enriched.source || 'unknown'}`,
            })
            .eq('id', phoneMatch.id);
          return 'updated';
        }
      }
    }

    // 2. Name + location fuzzy match
    const { data: nameMatch } = await supabase
      .from('hc_places')
      .select('id')
      .ilike('name', `%${enriched.canonical_name.substring(0, 20)}%`)
      .eq('admin1_code', enriched.admin1_code || '')
      .limit(1)
      .maybeSingle();

    if (nameMatch) {
      return 'duplicate';
    }

    // 3. Insert new record
    const { error } = await supabase.from('hc_places').insert({
      slug: enriched.slug,
      name: enriched.canonical_name,
      phone: enriched.phone || null,
      email: enriched.email || null,
      website: enriched.website || null,
      lat: enriched.lat || null,
      lng: enriched.lng || null,
      locality: enriched.locality || null,
      admin1_code: enriched.admin1_code || null,
      country_code: (enriched.country_code || 'US').toUpperCase(),
      surface_category_key: enriched.service_categories?.[0] || 'pilot_car',
      claim_status: enriched.verification_tier === 'verified' ? 'verified' : 'unclaimed',
      status: 'published',
      hc_trust_number: enriched.hc_trust_number,
      source_system: `autonomous_scraper_${enriched.source || 'unknown'}`,
      updated_at: new Date().toISOString(),
    });

    return error ? 'error' : 'inserted';
  } catch {
    return 'error';
  }
}

// ─── API ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { operators, source, enrichWithAI = true } = body as {
      operators: RawOperator[];
      source?: string;
      enrichWithAI?: boolean;
    };

    if (!operators || !Array.isArray(operators) || operators.length === 0) {
      return NextResponse.json({ error: 'operators array required' }, { status: 400 });
    }

    if (operators.length > 500) {
      return NextResponse.json({ error: 'Max 500 operators per batch' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const genai = enrichWithAI ? getGemini() : null;
    const stats = { inserted: 0, updated: 0, duplicates: 0, errors: 0, enriched: 0 };
    const failedNames: string[] = [];

    for (const op of operators) {
      // Stage 1: Normalize raw input
      const normalized: RawOperator = {
        ...op,
        source: op.source || source || 'unknown',
        country_code: (op.country_code || 'US').toUpperCase(),
        admin1_code: (op.admin1_code || '').toUpperCase(),
      };

      // Stage 2: AI enrichment
      let enrichment: Partial<EnrichedOperator> = {};
      if (genai && enrichWithAI) {
        enrichment = await enrichOperator(genai, normalized);
        stats.enriched++;
        // Rate limit
        await new Promise(r => setTimeout(r, 100));
      } else {
        enrichment = {
          canonical_name: normalized.name,
          service_categories: [normalized.category || 'pilot_car'],
          coverage_states: normalized.admin1_code ? [normalized.admin1_code] : [],
          verification_tier: normalized.dot_number ? 'verified' : 'unclaimed',
          confidence: 40,
        };
      }

      const enriched: EnrichedOperator = {
        ...normalized,
        canonical_name: enrichment.canonical_name || normalized.name,
        service_categories: enrichment.service_categories || ['pilot_car'],
        coverage_states: enrichment.coverage_states || [],
        verification_tier: enrichment.verification_tier || 'unclaimed',
        confidence: enrichment.confidence || 30,
        hc_trust_number: generateHCNumber(
          normalized.country_code || 'US',
          normalized.admin1_code || 'XX'
        ),
        slug: slugify(`${enrichment.canonical_name || normalized.name}-${normalized.locality || 'unknown'}`),
      };

      // Stage 3: Deduplicate and load
      const result = await deduplicateAndLoad(supabase, enriched);

      switch (result) {
        case 'inserted': stats.inserted++; break;
        case 'updated': stats.updated++; break;
        case 'duplicate': stats.duplicates++; break;
        case 'error': stats.errors++; failedNames.push(op.name); break;
      }
    }

    // Stage 4: Queue embedding generation for new records
    if (stats.inserted > 0) {
      // Non-blocking: trigger embedding pipeline
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ table: 'dictionary', batchSize: 20 }),
      }).catch(() => {}); // Fire and forget
    }

    return NextResponse.json({
      success: true,
      pipeline: 'crawl-enrich-load',
      stats,
      latencyMs: Date.now() - startTime,
      ...(failedNames.length > 0 ? { failedOperators: failedNames.slice(0, 10) } : {}),
    });
  } catch (err: any) {
    console.error('[Scraper Engine] Pipeline error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Haul Command Autonomous Scraper Engine',
    version: '2.0',
    pipeline: ['CRAWL', 'ENRICH (AI)', 'DEDUPLICATE', 'LOAD', 'INDEX (pgvector)'],
    endpoint: '/api/autonomous/scraper-engine',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
    maxBatchSize: 500,
    sources: ['google_maps', 'serp', 'dot_db', 'motive', 'manual', 'csv'],
    schema: {
      required: ['operators'],
      properties: {
        operators: {
          type: 'array',
          items: {
            name: 'string (required)',
            phone: 'string',
            email: 'string',
            website: 'string | null',
            address: 'string',
            lat: 'number',
            lng: 'number',
            locality: 'string',
            admin1_code: 'string (e.g. TX, CA)',
            country_code: 'string (default: US)',
            category: 'string',
            source: 'string',
            dot_number: 'string',
            mc_number: 'string',
            raw_description: 'string',
          },
        },
        source: 'string (global source tag)',
        enrichWithAI: 'boolean (default: true)',
      },
    },
  });
}
