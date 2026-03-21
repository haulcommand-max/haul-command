interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const tiers: Record<string, RateLimitConfig> = {
  free: { maxRequests: 100, windowMs: 3600000 },
  starter: { maxRequests: 1000, windowMs: 3600000 },
  professional: { maxRequests: 5000, windowMs: 3600000 },
  enterprise: { maxRequests: 50000, windowMs: 3600000 },
};

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(apiKey: string, tier: string = 'free'): { allowed: boolean; remaining: number; resetAt: number } {
  const config = tiers[tier] || tiers.free;
  const now = Date.now();
  const entry = requestCounts.get(apiKey);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(apiKey, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
