import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { supabaseMiddleware } from './lib/supabase/middleware'
import { getStripeCheckoutBlockReason, isProductionRuntime } from './lib/launch/production-guards'
import { scheduleRequestLog } from './lib/observability/request-log'

const sensitiveApiPrefixes = [
  '/api/search',
  '/api/claim',
  '/api/claims',
  '/api/contact',
  '/api/stripe',
  '/api/checkout',
  '/api/billing',
  '/api/livekit',
  '/api/agents',
  '/api/reviews',
  '/api/review',
  '/api/intake',
  '/api/loads/create',
  '/api/loads/ingest',
  '/api/loads/post',
  '/api/ai',
  '/api/admin',
  '/api/intelligence',
  '/api/data',
  '/api/routes',
  '/api/v1/loads',
  '/api/v1/entities',
  '/api/v1/workflows',
  '/api/v1/seo',
];

const fallbackBuckets = new Map<string, { count: number; resetAt: number }>();
const CANONICAL_PUBLIC_HOST = 'www.haulcommand.com';

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

function isAdminOrCommandPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/hq' || pathname.startsWith('/hq/');
}

function hostWithoutPort(request: NextRequest) {
  return (request.headers.get('host') || '').split(':')[0].toLowerCase();
}

function isGeneratedVercelHost(request: NextRequest) {
  return hostWithoutPort(request).endsWith('.vercel.app');
}

function withCanonicalHostPolicy(request: NextRequest, response: NextResponse) {
  if (!isGeneratedVercelHost(request)) return response;

  const canonicalUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${CANONICAL_PUBLIC_HOST}`);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Link', `<${canonicalUrl.toString()}>; rel="canonical"`);
  return response;
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

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  scheduleRequestLog(request, event);

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
        return withCanonicalHostPolicy(request, NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'x-ratelimit-remaining': '0' } },
        ));
      }
    }

    return withCanonicalHostPolicy(request, NextResponse.next());
  }

  if (!isAdminOrCommandPath(request.nextUrl.pathname)) {
    return withCanonicalHostPolicy(request, NextResponse.next());
  }

  // First, run the existing supabase auth middleware to sync cookies
  const { res, user, supabase } = await supabaseMiddleware(request);

  // Check if this is a Command/admin route.
  if (isAdminOrCommandPath(request.nextUrl.pathname)) {
    // If no user is logged in, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
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

  return withCanonicalHostPolicy(request, res);
}

// Keep the proxy on public/app routes so request_log does not go blind again.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|css|js|map|woff|woff2|ttf|otf)$).*)',
  ],
}
