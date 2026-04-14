/**
 * lib/redis.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Upstash Redis edge cache for Haul Command.
 * Used for: operator profiles, corridor data, active dispatch counts,
 *           rate-limited endpoint responses, hot leaderboard data.
 *
 * Free tier: 10K commands/day — upgrade at upstash.com as needed.
 */

import { Redis } from '@upstash/redis';

// ── Singleton client ─────────────────────────────────────────────────────────
// Gracefully no-ops if env vars aren't set (dev environment safety)
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'development') {
      // Suppress in dev — redis is optional locally
      return null;
    }
    console.warn('[redis] UPSTASH_REDIS_REST_URL or TOKEN not set — caching disabled.');
    return null;
  }

  if (!_redis) {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

export const redis = getRedis();

// ── Generic cache helper ─────────────────────────────────────────────────────
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300,
): Promise<T> {
  const r = getRedis();
  if (r) {
    const cached = await r.get<T>(key);
    if (cached !== null) return cached;
  }

  const data = await fetcher();

  if (r && data !== null && data !== undefined) {
    await r.set(key, data, { ex: ttlSeconds });
  }
  return data;
}

// ── Domain-specific helpers ──────────────────────────────────────────────────

/** Cache operator profile for 5 minutes */
export async function getCachedOperator(
  id: string,
  fetcher: () => Promise<unknown>,
) {
  return withCache(`operator:${id}`, fetcher, 300);
}

/** Cache corridor data for 1 hour */
export async function getCachedCorridor(
  corridorId: string,
  fetcher: () => Promise<unknown>,
) {
  return withCache(`corridor:${corridorId}`, fetcher, 3600);
}

/** Cache platform KPIs (active escorts, open loads) for 30 seconds */
export async function getCachedKPIs(fetcher: () => Promise<unknown>) {
  return withCache('stats:platform_kpis', fetcher, 30);
}

/** Cache leaderboard for 2 minutes */
export async function getCachedLeaderboard(
  boardKey: string,
  fetcher: () => Promise<unknown>,
) {
  return withCache(`leaderboard:${boardKey}`, fetcher, 120);
}

/** Invalidate a cache key (call after mutations) */
export async function bust(key: string) {
  const r = getRedis();
  if (!r) return;
  await r.del(key);
}

/** Rate limit check — returns { allowed, remaining, reset } */
export async function rateLimit(
  identifier: string,
  limit = 60,
  windowSeconds = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  const r = getRedis();
  if (!r) return { allowed: true, remaining: limit };

  const key     = `rl:${identifier}`;
  const current = await r.incr(key);
  if (current === 1) await r.expire(key, windowSeconds);

  return {
    allowed:   current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
