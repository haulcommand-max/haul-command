/**
 * ═══════════════════════════════════════════════════════════════
 * /api/operators — Server-Side Operator Directory
 * 
 * REPLACES any client-side supabase.from('operators').select('*')
 * 
 * Security:
 *   - Server-side only (no public key exposure)
 *   - Rate limited (100/min public, 500/min auth)
 *   - PII masked for unauthenticated users
 *   - Watermarked for authenticated users
 *   - Honeytokens injected into results
 *   - Query guard (no SELECT *, max 25 results for public)
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  defaultRateLimit,
  maskRecord,
  watermarkRecord,
  sanitizeQueryParams,
  resolveApiKeyTier,
  tierQueryLimit,
  generateHoneytoken,
  type MaskConfig,
  type QueryGuard,
} from '@/lib/security/anti-scrape-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVER ONLY — never exposed to client
);

const QUERY_GUARD: QueryGuard = {
  maxPageSize: 50,
  allowedFields: [
    'id', 'display_name', 'company_name', 'state', 'country',
    'service_area', 'equipment_types', 'rating', 'verified',
    'badge_level', 'trust_score', 'availability_status',
    'created_at', 'profile_photo_url',
  ],
  sortableFields: ['rating', 'trust_score', 'created_at', 'display_name'],
  defaultSort: { field: 'trust_score', dir: 'desc' },
};

const MASK_CONFIG: MaskConfig = {
  fields: ['phone', 'email', 'address_street'],
  revealWhen: 'authenticated',
};

export async function GET(req: NextRequest) {
  // 1. Rate limit
  const rl = defaultRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  // 2. Resolve tier
  const tier = resolveApiKeyTier(req);
  const maxResults = tierQueryLimit(tier);
  const isAuthenticated = tier !== 'public';

  // 3. Parse & sanitize query params
  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const { page, pageSize, sort, fields } = sanitizeQueryParams(
    { ...searchParams, pageSize: String(Math.min(parseInt(searchParams.pageSize || '25'), maxResults)) },
    QUERY_GUARD,
  );

  // 4. Build Supabase query (server-side only)
  let query = supabase
    .from('operator_profile')
    .select(fields.join(','), { count: 'exact' })
    .order(sort.field, { ascending: sort.dir === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Apply filters
  if (searchParams.state) query = query.eq('service_states', searchParams.state);
  if (searchParams.country) query = query.eq('country_code', searchParams.country);
  if (searchParams.verified === 'true') query = query.eq('verified', true);
  if (searchParams.search) {
    query = query.or(
      `display_name.ilike.%${searchParams.search}%,company_name.ilike.%${searchParams.search}%`,
    );
  }

  const { data: records, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  // 5. Apply PII masking
  let results = (records || []).map(record =>
    maskRecord(record as unknown as Record<string, unknown>, MASK_CONFIG, isAuthenticated, false, false),
  );

  // 6. Watermark for authenticated users (tracking layer)
  if (isAuthenticated) {
    const viewerId = req.headers.get('x-viewer-id') || 'unknown';
    results = results.map(record => watermarkRecord(record, viewerId));
  }

  // 7. Inject honeytoken (1 per page for public, disabled for service)
  if (tier === 'public' && results.length >= 5) {
    const honey = generateHoneytoken();
    const honeyRecord = {
      id: honey.id,
      display_name: honey.name,
      company_name: honey.company,
      state: 'TX',
      country: 'US',
      phone: honey.phone,
      email: honey.email,
      rating: 4.2,
      verified: true,
      badge_level: 'silver',
      trust_score: 78,
      availability_status: 'available',
      created_at: honey.created_at,
      _honey: true, // internal flag — stripped before response
    };

    // Insert at random position
    const pos = Math.floor(Math.random() * results.length);
    results.splice(pos, 0, honeyRecord);
  }

  // 8. Strip internal flags
  results = results.map(r => {
    const { _honey, ...clean } = r as Record<string, unknown> & { _honey?: boolean };
    return clean;
  });

  return NextResponse.json({
    data: results,
    meta: {
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }, {
    headers: {
      'Cache-Control': tier === 'public' ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store',
      'X-RateLimit-Remaining': String(rl.remaining),
    },
  });
}
