/**
 * ═══════════════════════════════════════════════════════════════
 * SECURITY MIDDLEWARE — Anti-Scrape + Rate Limiting + Honeytokens
 * 
 * Layered defense:
 *   L1 — Partial data exposure (mask PII unless authenticated)
 *   L2 — Rate limiting per IP/token
 *   L3 — Honeytoken detection
 *   L4 — Behavioral fingerprint scoring
 *   L5 — Query obfuscation (no SELECT *)
 *   L6 — API key segmentation
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';

// ── RATE LIMITER (In-Memory — swap to Upstash for production) ──

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;    // per window
  windowMs: number;       // window duration in ms
  keyExtractor?: (req: NextRequest) => string;
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): { allowed: boolean; remaining: number; resetAt: number } => {
    const key = config.keyExtractor
      ? config.keyExtractor(req)
      : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    const now = Date.now();
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
      return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
    }

    bucket.count++;
    const allowed = bucket.count <= config.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - bucket.count),
      resetAt: bucket.resetAt,
    };
  };
}

// Default rate limiter: 100 requests per minute per IP
export const defaultRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 60_000,
});

// Strict rate limiter: 20 requests per minute (sensitive endpoints)
export const strictRateLimit = rateLimit({
  maxRequests: 20,
  windowMs: 60_000,
});

// ── PII MASKING ─────────────────────────────────────────────

export function maskPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-${digits.slice(-4)}`;
}

export function maskEmail(email: string | null): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  return `${local[0]}***@${domain}`;
}

export interface MaskConfig {
  fields: string[];          // fields to mask
  revealWhen: 'authenticated' | 'claimed' | 'paid' | 'never';
}

export function maskRecord(
  record: Record<string, unknown>,
  config: MaskConfig,
  isAuthenticated: boolean,
  isClaimed: boolean,
  isPaid: boolean,
): Record<string, unknown> {
  const shouldReveal =
    config.revealWhen === 'authenticated' ? isAuthenticated :
    config.revealWhen === 'claimed' ? isClaimed :
    config.revealWhen === 'paid' ? isPaid :
    false;

  if (shouldReveal) return record;

  const masked = { ...record };
  for (const field of config.fields) {
    if (field === 'phone' && typeof masked[field] === 'string') {
      masked[field] = maskPhone(masked[field] as string);
    } else if (field === 'email' && typeof masked[field] === 'string') {
      masked[field] = maskEmail(masked[field] as string);
    } else if (masked[field]) {
      masked[field] = '***';
    }
  }
  return masked;
}

// ── HONEYTOKEN SYSTEM ───────────────────────────────────────

export interface Honeytoken {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tracking_hash: string;
  created_at: string;
}

export function generateHoneytoken(seed?: string): Honeytoken {
  const id = randomUUID();
  const hash = createHash('sha256')
    .update(id + (seed || ''))
    .digest('hex')
    .slice(0, 12);

  // Phone with unique tracking number  
  const trackingPhone = `555-${hash.slice(0, 3).toUpperCase()}-${hash.slice(3, 7).toUpperCase()}`;

  return {
    id,
    name: `T. Operator ${hash.slice(0, 4).toUpperCase()}`,
    email: `ht-${hash}@honeytrap.haulcommand.com`,
    phone: trackingPhone,
    company: `Sentinel Logistics ${hash.slice(0, 4).toUpperCase()}`,
    tracking_hash: hash,
    created_at: new Date().toISOString(),
  };
}

export function isHoneytoken(email: string): boolean {
  return email.endsWith('@honeytrap.haulcommand.com');
}

export function detectScrapeFromHoneytoken(
  contactedEmail: string,
): { isScrape: boolean; trackingHash?: string } {
  if (!isHoneytoken(contactedEmail)) return { isScrape: false };
  const hash = contactedEmail.split('@')[0].replace('ht-', '');
  return { isScrape: true, trackingHash: hash };
}

// ── BEHAVIORAL FINGERPRINT ──────────────────────────────────

export interface BehaviorSignals {
  requestsPerMinute: number;
  uniquePathsPerMinute: number;
  hasMouseEvents: boolean;
  hasScrollEvents: boolean;
  avgTimeBetweenRequests: number;
  userAgent: string;
}

export function scoreBotProbability(signals: BehaviorSignals): number {
  let score = 0;

  // High request rate
  if (signals.requestsPerMinute > 60) score += 0.3;
  if (signals.requestsPerMinute > 120) score += 0.2;

  // Too many unique paths (scraping crawl pattern)
  if (signals.uniquePathsPerMinute > 30) score += 0.2;

  // No human interaction signals
  if (!signals.hasMouseEvents) score += 0.1;
  if (!signals.hasScrollEvents) score += 0.05;

  // Suspiciously fast requests
  if (signals.avgTimeBetweenRequests < 200) score += 0.15;

  // Known bot user agents
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'headless', 'phantom', 'selenium'];
  const ua = signals.userAgent.toLowerCase();
  if (botPatterns.some(p => ua.includes(p))) score += 0.5;

  return Math.min(1.0, score);
}

// ── DATA WATERMARKING ───────────────────────────────────────

export function watermarkRecord(
  record: Record<string, unknown>,
  viewerId: string,
): Record<string, unknown> {
  const hash = createHash('sha256')
    .update(`${viewerId}:${record.id}:${Date.now()}`)
    .digest('hex')
    .slice(0, 8);

  return {
    ...record,
    _wm: hash,    // invisible watermark — if this shows up elsewhere, we trace it
    _ts: Date.now(),
  };
}

// ── SERVER-SIDE QUERY GUARD ─────────────────────────────────

export interface QueryGuard {
  maxPageSize: number;
  allowedFields: string[];
  sortableFields: string[];
  defaultSort: { field: string; dir: 'asc' | 'desc' };
}

export function sanitizeQueryParams(
  params: Record<string, string | undefined>,
  guard: QueryGuard,
): {
  page: number;
  pageSize: number;
  sort: { field: string; dir: 'asc' | 'desc' };
  fields: string[];
} {
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const pageSize = Math.min(
    guard.maxPageSize,
    Math.max(1, parseInt(params.pageSize || '25', 10) || 25),
  );

  const sortField = guard.sortableFields.includes(params.sort || '')
    ? params.sort!
    : guard.defaultSort.field;

  const sortDir = params.dir === 'asc' ? 'asc' as const : 'desc' as const;

  // Never allow SELECT * — only whitelisted fields
  const requestedFields = (params.fields || '').split(',').filter(Boolean);
  const fields = requestedFields.length > 0
    ? requestedFields.filter(f => guard.allowedFields.includes(f))
    : guard.allowedFields;

  return { page, pageSize, sort: { field: sortField, dir: sortDir }, fields };
}

// ── API KEY SEGMENTATION ────────────────────────────────────

export type ApiKeyTier = 'public' | 'authenticated' | 'admin' | 'service';

export function resolveApiKeyTier(req: NextRequest): ApiKeyTier {
  // Service key — header only, never in client
  const serviceKey = req.headers.get('x-hc-service-key');
  if (serviceKey === process.env.HC_SERVICE_KEY) return 'service';

  // Admin — check for admin session
  const adminToken = req.headers.get('x-hc-admin-token');
  if (adminToken === process.env.HC_ADMIN_TOKEN) return 'admin';

  // Authenticated — has valid auth cookie/header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return 'authenticated';

  return 'public';
}

export function tierQueryLimit(tier: ApiKeyTier): number {
  switch (tier) {
    case 'service': return 1000;
    case 'admin': return 500;
    case 'authenticated': return 100;
    case 'public': return 25;
  }
}

// ── SECURE API WRAPPER ──────────────────────────────────────

export function createSecureHandler(config: {
  rateLimit?: ReturnType<typeof rateLimit>;
  requiredTier?: ApiKeyTier;
  queryGuard?: QueryGuard;
  maskConfig?: MaskConfig;
}) {
  return {
    checkAccess(req: NextRequest): NextResponse | null {
      // Rate limit
      if (config.rateLimit) {
        const result = config.rateLimit(req);
        if (!result.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                'X-RateLimit-Remaining': '0',
              },
            },
          );
        }
      }

      // Tier check
      if (config.requiredTier) {
        const tier = resolveApiKeyTier(req);
        const tierOrder: ApiKeyTier[] = ['public', 'authenticated', 'admin', 'service'];
        if (tierOrder.indexOf(tier) < tierOrder.indexOf(config.requiredTier)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 },
          );
        }
      }

      return null; // access granted
    },
  };
}
