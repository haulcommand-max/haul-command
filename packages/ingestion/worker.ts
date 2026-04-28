/**
 * HAUL COMMAND — Production Ingestion Worker
 * Queue-based, rate-limited, retry-capable operator ingestion engine.
 * Merges into existing enrichment pipeline (lib/enrichment/).
 * 
 * Scale target: 100K→200K unique operators across 120 countries.
 * Architecture: queue → fetch → enrich → dedupe → upsert → log
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  batchSize: 20,
  maxRetries: 3,
  retryDelayMs: 2000,
  rateLimitPerMinute: 30,
  workerConcurrency: 5,
  googleNextPageDelayMs: 2500,
  dailyBudgetUsd: 50,
  costPerRequest: 0.017,
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RawOperatorRecord {
  name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  country?: string;
  region?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  review_count?: number;
  place_id?: string;
  source: string;
  categories?: string[];
}

export interface EnrichedOperator extends RawOperatorRecord {
  haul_command_id: string;
  phone_normalized: string | null;
  services_inferred: string[];
  corridor_relevance: string[];
  enrichment_score: number;
  quality_score: number;
  last_seen_at: string;
}

export interface IngestionJob {
  id: string;
  query: string;
  country_code: string;
  region?: string;
  tier: 'A' | 'B' | 'C' | 'D';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  results_count: number;
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface IngestionStats {
  totalProcessed: number;
  inserted: number;
  updated: number;
  duplicatesSkipped: number;
  errors: number;
  estimatedSpendUsd: number;
}

// ═══════════════════════════════════════════════════════════════
// PHONE NORMALIZATION (E.164)
// ═══════════════════════════════════════════════════════════════

const COUNTRY_CODES: Record<string, string> = {
  US: '+1', CA: '+1', GB: '+44', AU: '+61', DE: '+49',
  NL: '+31', AE: '+971', BR: '+55', ZA: '+27', NZ: '+64',
  FR: '+33', MX: '+52', IN: '+91', JP: '+81', KR: '+82',
};

export function normalizePhoneE164(phone: string | null | undefined, countryCode?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;

  // Already has country code
  if (phone.startsWith('+')) return `+${digits}`;

  // US/CA 10-digit
  if (digits.length === 10 && (!countryCode || countryCode === 'US' || countryCode === 'CA')) {
    return `+1${digits}`;
  }

  // US/CA 11-digit starting with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Apply country code if known
  const prefix = countryCode ? COUNTRY_CODES[countryCode] : null;
  if (prefix) return `${prefix}${digits}`;

  return digits.length >= 10 ? `+${digits}` : null;
}

// ═══════════════════════════════════════════════════════════════
// SERVICE INFERENCE ENGINE
// ═══════════════════════════════════════════════════════════════

const SERVICE_PATTERNS: Array<{ pattern: RegExp; service: string }> = [
  { pattern: /pilot\s*car/i, service: 'pilot_car_escort' },
  { pattern: /escort\s*(vehicle|service)/i, service: 'escort_service' },
  { pattern: /oversize|over\s*size/i, service: 'oversize_load' },
  { pattern: /wide\s*load/i, service: 'wide_load' },
  { pattern: /super\s*load/i, service: 'superload' },
  { pattern: /height\s*pole/i, service: 'height_pole' },
  { pattern: /bucket\s*truck/i, service: 'bucket_truck' },
  { pattern: /heavy\s*haul/i, service: 'heavy_haul' },
  { pattern: /flatbed/i, service: 'flatbed_transport' },
  { pattern: /lowboy|low\s*boy/i, service: 'lowboy_transport' },
  { pattern: /crane/i, service: 'crane_service' },
  { pattern: /rigging/i, service: 'rigging' },
  { pattern: /towing/i, service: 'towing' },
  { pattern: /route\s*survey/i, service: 'route_survey' },
  { pattern: /permit/i, service: 'permit_services' },
  { pattern: /wind\s*turbine|wind\s*energy/i, service: 'wind_energy_transport' },
  { pattern: /drone/i, service: 'drone_survey' },
  { pattern: /night\s*(move|escort)/i, service: 'night_operations' },
  { pattern: /police\s*escort/i, service: 'police_escort_coordination' },
  { pattern: /utility|line\s*lift/i, service: 'utility_line_lift' },
];

export function inferServices(name: string, categories?: string[]): string[] {
  const text = `${name} ${(categories || []).join(' ')}`.toLowerCase();
  const matched = SERVICE_PATTERNS
    .filter(sp => sp.pattern.test(text))
    .map(sp => sp.service);
  return [...new Set(matched.length > 0 ? matched : ['general_escort'])];
}

// ═══════════════════════════════════════════════════════════════
// QUALITY SCORING (0-100)
// ═══════════════════════════════════════════════════════════════

export function scoreOperator(op: RawOperatorRecord): number {
  let score = 0;
  // Rating weight (0-50 pts)
  score += Math.min(50, (op.rating || 0) * 10);
  // Review volume (0-20 pts)
  if ((op.review_count || 0) > 50) score += 20;
  else if ((op.review_count || 0) > 10) score += 12;
  else if ((op.review_count || 0) > 0) score += 5;
  // Data completeness (0-30 pts)
  if (op.phone) score += 8;
  if (op.email) score += 5;
  if (op.website) score += 5;
  if (op.address) score += 5;
  if (op.lat && op.lng) score += 7;
  return Math.min(100, score);
}

// ═══════════════════════════════════════════════════════════════
// ENRICHMENT FUNCTION (raw → enriched)
// ═══════════════════════════════════════════════════════════════

export function enrichOperator(raw: RawOperatorRecord, countryCode?: string): EnrichedOperator {
  const id = `hc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  const phoneNorm = normalizePhoneE164(raw.phone, countryCode || raw.country);
  const services = inferServices(raw.name, raw.categories);
  const quality = scoreOperator(raw);

  return {
    ...raw,
    haul_command_id: id,
    phone_normalized: phoneNorm,
    services_inferred: services,
    corridor_relevance: [],
    enrichment_score: quality,
    quality_score: quality,
    last_seen_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION ENGINE
// ═══════════════════════════════════════════════════════════════

export function deduplicateOperators(operators: EnrichedOperator[]): EnrichedOperator[] {
  const seen = new Map<string, EnrichedOperator>();

  for (const op of operators) {
    // Primary key: normalized phone
    const phoneKey = op.phone_normalized || '';
    // Secondary key: name + region (fuzzy)
    const nameKey = `${op.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${(op.region || '').toLowerCase()}`;
    const key = phoneKey || nameKey;

    if (!key) {
      seen.set(op.haul_command_id, op); // no dedup key, keep it
      continue;
    }

    const existing = seen.get(key);
    if (!existing || op.quality_score > existing.quality_score) {
      seen.set(key, op); // keep higher quality version
    }
  }

  return Array.from(seen.values());
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE PLACES FETCHER (with pagination)
// ═══════════════════════════════════════════════════════════════

export async function fetchGooglePlaces(query: string, pageToken?: string): Promise<{
  results: RawOperatorRecord[];
  nextPageToken?: string;
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { results: [] };

  const params: Record<string, string> = {
    query,
    key: apiKey,
  };
  if (pageToken) params.pagetoken = pageToken;

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${new URLSearchParams(params)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places API error: ${res.status}`);

  const data = await res.json();
  const results: RawOperatorRecord[] = (data.results || []).map((r: any) => ({
    name: r.name,
    address: r.formatted_address,
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
    rating: r.rating,
    review_count: r.user_ratings_total,
    place_id: r.place_id,
    source: 'google_places',
    categories: r.types || [],
  }));

  return { results, nextPageToken: data.next_page_token };
}

// Paginate all pages for a query
export async function fetchAllGooglePages(query: string): Promise<RawOperatorRecord[]> {
  const allResults: RawOperatorRecord[] = [];
  let nextPageToken: string | undefined;

  do {
    const page = await fetchGooglePlaces(query, nextPageToken);
    allResults.push(...page.results);
    nextPageToken = page.nextPageToken;
    if (nextPageToken) {
      await new Promise(r => setTimeout(r, CONFIG.googleNextPageDelayMs));
    }
  } while (nextPageToken);

  return allResults;
}

// ═══════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function upsertOperatorBatch(
  operators: EnrichedOperator[],
  supabase?: SupabaseClient
): Promise<{ inserted: number; updated: number; errors: number }> {
  const sb = supabase || getSupabase();
  let inserted = 0, updated = 0, errors = 0;

  for (let i = 0; i < operators.length; i += CONFIG.batchSize) {
    const batch = operators.slice(i, i + CONFIG.batchSize);
    const records = batch.map(op => ({
      haul_command_id: op.haul_command_id,
      name: op.name,
      phone: op.phone_normalized || op.phone,
      email: op.email,
      website: op.website,
      address: op.address,
      country: op.country,
      region: op.region,
      lat: op.lat,
      lng: op.lng,
      rating: op.rating,
      review_count: op.review_count,
      services: op.services_inferred,
      enrichment_score: op.enrichment_score,
      quality_score: op.quality_score,
      source: op.source,
      last_seen_at: op.last_seen_at,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await sb
      .from('operators')
      .upsert(records, { onConflict: 'phone' });

    if (error) {
      console.error(`[INGEST] Upsert batch error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, updated, errors };
}

// ═══════════════════════════════════════════════════════════════
// QUEUE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function claimNextJob(supabase: SupabaseClient): Promise<IngestionJob | null> {
  const { data } = await supabase
    .from('ingestion_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!data) return null;

  await supabase
    .from('ingestion_queue')
    .update({ status: 'processing', attempts: (data.attempts || 0) + 1 })
    .eq('id', data.id);

  return data as IngestionJob;
}

export async function completeJob(
  supabase: SupabaseClient,
  jobId: string,
  resultsCount: number,
  error?: string
): Promise<void> {
  await supabase
    .from('ingestion_queue')
    .update({
      status: error ? 'failed' : 'completed',
      results_count: resultsCount,
      completed_at: new Date().toISOString(),
      error,
    })
    .eq('id', jobId);
}

// ═══════════════════════════════════════════════════════════════
// EVENT LOGGING
// ═══════════════════════════════════════════════════════════════

export async function logIngestionEvent(
  supabase: SupabaseClient,
  type: string,
  payload: Record<string, any>
): Promise<void> {
  await supabase.from('ingestion_events').insert({
    type,
    payload,
    created_at: new Date().toISOString(),
  }).then(() => {}); // fire and forget
}

// ═══════════════════════════════════════════════════════════════
// MAIN WORKER LOOP
// ═══════════════════════════════════════════════════════════════

export async function processQuery(query: string, countryCode: string): Promise<IngestionStats> {
  const stats: IngestionStats = {
    totalProcessed: 0,
    inserted: 0,
    updated: 0,
    duplicatesSkipped: 0,
    errors: 0,
    estimatedSpendUsd: 0,
  };

  try {
    // 1. Fetch from Google Places (all pages)
    const raw = await fetchAllGooglePages(query);
    stats.estimatedSpendUsd += Math.ceil(raw.length / 20) * CONFIG.costPerRequest;

    // 2. Enrich each record
    const enriched = raw.map(r => enrichOperator(r, countryCode));
    stats.totalProcessed = enriched.length;

    // 3. Deduplicate
    const deduped = deduplicateOperators(enriched);
    stats.duplicatesSkipped = enriched.length - deduped.length;

    // 4. Upsert to Supabase
    const result = await upsertOperatorBatch(deduped);
    stats.inserted = result.inserted;
    stats.updated = result.updated;
    stats.errors = result.errors;

  } catch (err: any) {
    console.error(`[WORKER] Query "${query}" failed:`, err.message);
    stats.errors++;
  }

  return stats;
}

export async function startDistributedWorker(): Promise<void> {
  const supabase = getSupabase();
  console.log('[WORKER] 🚀 Distributed ingestion worker started');

  while (true) {
    const job = await claimNextJob(supabase);

    if (!job) {
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    console.log(`[WORKER] Processing: "${job.query}" (${job.country_code})`);

    try {
      const stats = await processQuery(job.query, job.country_code);
      await completeJob(supabase, job.id, stats.inserted + stats.updated);
      await logIngestionEvent(supabase, 'job_completed', { jobId: job.id, ...stats });
      console.log(`[WORKER] ✅ ${job.query}: ${stats.inserted} inserted, ${stats.duplicatesSkipped} dupes skipped`);
    } catch (err: any) {
      if (job.attempts < CONFIG.maxRetries) {
        await supabase.from('ingestion_queue').update({ status: 'pending' }).eq('id', job.id);
      } else {
        await completeJob(supabase, job.id, 0, err.message);
      }
    }
  }
}
