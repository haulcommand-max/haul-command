/**
 * HAUL COMMAND — Upstash Redis client + Rate Limiter
 * Serverless Redis for caching, rate limiting, and queues.
 */
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ── Redis Client ──
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// ── Rate Limiters ──

/** API rate limit: 60 requests per minute per IP */
export const apiRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'hc:rl:api',
});

/** Search rate limit: 30 searches per minute per IP */
export const searchRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'hc:rl:search',
});

/** AI agent rate limit: 10 per minute per user */
export const aiRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'hc:rl:ai',
});

/** Claim rate limit: 5 per hour per IP */
export const claimRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'hc:rl:claim',
});

// ── Cache Helpers ──

/** Cache with TTL (seconds) */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try { return await redis.get<T>(key); } catch { return null; }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try { await redis.set(key, value, { ex: ttlSeconds }); } catch { /* silent */ }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
    } catch { /* silent */ }
}

/** Cache-through pattern */
export async function cacheLookup<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await cacheGet<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await cacheSet(key, fresh, ttl);
    return fresh;
}
