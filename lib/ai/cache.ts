/**
 * HAUL COMMAND — RESPONSE CACHE
 * 
 * L1: In-memory (edge-fast, resets on cold start)
 * L2: Upstash Redis (persistent, cross-region)
 * 
 * Cache strategy per brain:
 *   Claude (THINK)  — cache compliance/regulations for 24h, creative never
 *   Gemini (SEE)    — cache meta descriptions for 7 days, ad copy for 1h
 *   OpenAI (ACT)    — cache extraction results for 1h, dispatch never
 * 
 * Cache key = hash(brain + prompt + model)
 */

import { Redis } from '@upstash/redis';
import type { AIResult } from './brain';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

// L1: In-process memory cache (survives within a single serverless invocation warmup)
const L1 = new Map<string, { value: AIResult; expiresAt: number }>();
const L1_MAX_SIZE = 500;

function l1Get(key: string): AIResult | null {
  const entry = L1.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { L1.delete(key); return null; }
  return entry.value;
}

function l1Set(key: string, value: AIResult, ttlSeconds: number) {
  if (L1.size >= L1_MAX_SIZE) {
    // Evict oldest
    const firstKey = L1.keys().next().value;
    if (firstKey) L1.delete(firstKey);
  }
  L1.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function cacheKey(brain: string, model: string, prompt: string): string {
  // Simple deterministic hash
  let hash = 0;
  const str = `${brain}:${model}:${prompt}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hc_ai:${Math.abs(hash).toString(36)}`;
}

export async function cacheGet(brain: string, model: string, prompt: string): Promise<AIResult | null> {
  const key = cacheKey(brain, model, prompt);
  
  // L1 first
  const l1 = l1Get(key);
  if (l1) return l1;

  // L2 Redis
  const redis = getRedis();
  if (!redis) return null;
  
  try {
    const cached = await redis.get<AIResult>(key);
    return cached ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(brain: string, model: string, prompt: string, result: AIResult, ttlSeconds: number) {
  const key = cacheKey(brain, model, prompt);
  l1Set(key, result, ttlSeconds);
  
  const redis = getRedis();
  if (!redis) return;
  
  try {
    await redis.setex(key, ttlSeconds, result);
  } catch { /* non-fatal */ }
}

/**
 * Cache TTLs by feature type (seconds)
 */
export const CACHE_TTL = {
  regulation: 86400 * 7,  // 7 days — regulations don't change often
  meta_description: 86400 * 30, // 30 days — per page, stable
  corridor_intel: 86400 * 3,    // 3 days
  ad_copy: 3600,                // 1 hour
  operator_enrichment: 86400,   // 1 day per operator
  dispatch: 0,                  // Never cache — live data
  fraud_check: 0,               // Never cache — must be fresh
  compliance: 86400 * 7,        // 7 days per regulation
  linkedin_post: 0,             // Never cache — unique each time
  review_analysis: 86400,       // 1 day
  load_parse: 0,                // Never cache — live loads
} as const;
