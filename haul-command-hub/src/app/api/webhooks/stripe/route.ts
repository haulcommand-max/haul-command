/**
 * POST /api/webhooks/stripe
 * GET  /api/webhooks/stripe
 *
 * Canonical webhook URL — redirects to /api/stripe/webhook
 * This is the URL configured in the Stripe Dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Forward to the actual handler
  const url = new URL('/api/stripe/webhook', request.url);
  const body = await request.text();
  
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: Object.fromEntries(request.headers.entries()),
    body,
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
