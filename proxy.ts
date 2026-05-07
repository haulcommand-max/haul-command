import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseMiddleware } from './lib/supabase/middleware'
import { getStripeCheckoutBlockReason, isProductionRuntime } from './lib/launch/production-guards'

const sensitiveApiPrefixes = [
  '/api/search',
  '/api/claim',
  '/api/claims',
  '/api/contact',
  '/api/stripe',
  '/api/checkout',
  '/api/billing',
  '/api/livekit',
  '/api/reviews',
  '/api/review',
  '/api/intake',
  '/api/loads/create',
  '/api/loads/ingest',
  '/api/loads/post',
  '/api/ai',
  '/api/intelligence',
  '/api/data',
];

const fallbackBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isSensitiveApi(pathname: string) {
  return sensitiveApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function strictFallbackRateLimit(request: NextRequest) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = isProductionRuntime() ? 30 : 120;
  const key = `${getClientIp(request)}:${request.nextUrl.pathname}`;
  const existing = fallbackBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    fallbackBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  existing.count += 1;
  return { allowed: existing.count <= limit, remaining: Math.max(0, limit - existing.count) };
}

export async function proxy(request: NextRequest) {
  if (isSensitiveApi(request.nextUrl.pathname)) {
    const stripeBlockReason = getStripeCheckoutBlockReason();
    const isPaymentPath =
      request.nextUrl.pathname.startsWith('/api/stripe') ||
      request.nextUrl.pathname.startsWith('/api/checkout') ||
      request.nextUrl.pathname.startsWith('/api/billing');

    if (isPaymentPath && stripeBlockReason) {
      return NextResponse.json(
        { error: 'Checkout is temporarily unavailable.', reason: stripeBlockReason },
        { status: 503 },
      );
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      const fallback = strictFallbackRateLimit(request);
      if (!fallback.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'x-ratelimit-remaining': '0' } },
        );
      }
    }

    return NextResponse.next();
  }

  // First, run the existing supabase auth middleware to sync cookies
  const { res, user, supabase } = await supabaseMiddleware(request);

  // Check if this is a Command /hq route
  if (request.nextUrl.pathname.startsWith('/hq')) {
    // If no user is logged in, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login?next=/hq', request.url));
    }

    // Role-based verification (must be a system administrator or explicit HQ team)
    // Verify the user's role against your profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist or isn't a system_admin
    if (!profile || profile.role !== 'system_admin') {
      // Force redirect non-administrative users away from the Command Layer
      return NextResponse.redirect(new URL('/next-moves?error=unauthorized_hq', request.url));
    }
  }

  return res;
}

// Only match /hq routes for strict execution context.
export const config = {
  matcher: [
    '/hq/:path*',
    '/api/search/:path*',
    '/api/claim/:path*',
    '/api/claims/:path*',
    '/api/contact/:path*',
    '/api/stripe/:path*',
    '/api/checkout/:path*',
    '/api/billing/:path*',
    '/api/livekit/:path*',
    '/api/reviews/:path*',
    '/api/review/:path*',
    '/api/intake/:path*',
    '/api/loads/create',
    '/api/loads/ingest',
    '/api/loads/post',
    '/api/ai/:path*',
    '/api/intelligence/:path*',
    '/api/data/:path*',
  ],
}
