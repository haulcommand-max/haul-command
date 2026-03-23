/**
 * POST /api/webhooks/stripe
 * GET  /api/webhooks/stripe
 *
 * Canonical webhook URL configured in Stripe Dashboard.
 * Proxies directly to /api/stripe/webhook to keep one source of truth.
 *
 * Uses raw body passthrough to preserve Stripe signature verification.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Read raw body once (needed for signature verification)
  const rawBody = await request.text();

  // Construct internal URL to the real webhook handler
  const targetUrl = new URL('/api/stripe/webhook', request.url);

  // Forward with all original headers (especially stripe-signature)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  const res = await fetch(targetUrl.toString(), {
    method: 'POST',
    headers,
    body: rawBody,
  });

  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'haul-command-stripe-webhook',
    timestamp: new Date().toISOString(),
    handler: '/api/stripe/webhook',
    events: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'payment_intent.succeeded',
    ],
  });
}
