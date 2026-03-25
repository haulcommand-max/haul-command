/**
 * POST /api/stripe/checkout
 * GET  /api/stripe/checkout?plan=...&interval=...
 *
 * Creates a Stripe Checkout session using REAL Stripe price IDs.
 * Unified handler for all subscription plans + one-time purchases.
 *
 * Stripe Products (live):
 *   Basic  → $29/mo (price_1TDDWXRiV0LOCA36ZtcV4tjs) | $278/yr (price_1TDGZlRiV0LOCA36XCdlvtMt)
 *   Pro    → $79/mo (price_1TDDWYRiV0LOCA36urpGznvy) | $758/yr (price_1TDGZmRiV0LOCA36BnUWRUJ0)
 *   Elite  → $199/mo (price_1TDDWYRiV0LOCA36vSf66upr) | $1908/yr (price_1TDGZnRiV0LOCA36qIEHV3Tg)
 *   Broker → $149/mo (price_1TDGZnRiV0LOCA366WNx1EUF) | $1430/yr (price_1TDGZoRiV0LOCA36qvviObj4)
 *   Load Boost → $14 one-time (price_1TDGZpRiV0LOCA36F8yt0svI)
 */

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// Price Map — maps plan+interval to actual Stripe price IDs
// ═══════════════════════════════════════════════════════════════

interface PlanConfig {
  name: string;
  monthPriceId?: string;
  yearPriceId?: string;
  onetimePriceId?: string;
  mode: 'subscription' | 'payment';
}

const PLANS: Record<string, PlanConfig> = {
  basic: {
    name: 'Haul Command Basic',
    monthPriceId: 'price_1TDDWXRiV0LOCA36ZtcV4tjs',
    yearPriceId: 'price_1TDGZlRiV0LOCA36XCdlvtMt',
    mode: 'subscription',
  },
  verified: {
    name: 'Haul Command Basic',
    monthPriceId: 'price_1TDDWXRiV0LOCA36ZtcV4tjs',
    yearPriceId: 'price_1TDGZlRiV0LOCA36XCdlvtMt',
    mode: 'subscription',
  },
  pro: {
    name: 'Haul Command Pro',
    monthPriceId: 'price_1TDDWYRiV0LOCA36urpGznvy',
    yearPriceId: 'price_1TDGZmRiV0LOCA36BnUWRUJ0',
    mode: 'subscription',
  },
  elite: {
    name: 'Haul Command Elite',
    monthPriceId: 'price_1TDDWYRiV0LOCA36vSf66upr',
    yearPriceId: 'price_1TDGZnRiV0LOCA36qIEHV3Tg',
    mode: 'subscription',
  },
  brand_defense: {
    name: 'Haul Command Elite',
    monthPriceId: 'price_1TDDWYRiV0LOCA36vSf66upr',
    yearPriceId: 'price_1TDGZnRiV0LOCA36qIEHV3Tg',
    mode: 'subscription',
  },
  broker: {
    name: 'Broker Seat',
    monthPriceId: 'price_1TDGZnRiV0LOCA366WNx1EUF',
    yearPriceId: 'price_1TDGZoRiV0LOCA36qvviObj4',
    mode: 'subscription',
  },
  boost: {
    name: 'Load Boost',
    onetimePriceId: 'price_1TDGZpRiV0LOCA36F8yt0svI',
    mode: 'payment',
  },
  corridor_sponsor: {
    name: 'Corridor Sponsor',
    monthPriceId: 'price_1TEgPTRiV0LOCA36JnQcDrD1',
    mode: 'subscription',
  },
  directory_featured: {
    name: 'Directory Featured',
    monthPriceId: 'price_1TEgPTRiV0LOCA365xw8STTa',
    mode: 'subscription',
  },
};

async function createCheckoutSession(request: NextRequest, method: 'GET' | 'POST') {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
    if (method === 'GET') return NextResponse.redirect(`${siteUrl}/pricing?error=stripe_not_configured`);
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') ?? 'pro';
  const interval = searchParams.get('interval') ?? 'year';

  let body: Record<string, string> = {};
  if (method === 'POST') {
    body = await request.json().catch(() => ({}));
  }
  const operatorId = body.operatorId ?? searchParams.get('operator_id') ?? 'unknown';
  const email = body.email ?? searchParams.get('email');

  const planConfig = PLANS[plan];
  if (!planConfig) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
    if (method === 'GET') return NextResponse.redirect(`${siteUrl}/pricing`);
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
  const isOneTime = planConfig.mode === 'payment';

  // Determine the correct Stripe price ID
  let priceId: string;
  if (isOneTime) {
    priceId = planConfig.onetimePriceId!;
  } else if (interval === 'month' && planConfig.monthPriceId) {
    priceId = planConfig.monthPriceId;
  } else {
    priceId = planConfig.yearPriceId ?? planConfig.monthPriceId!;
  }

  // Build Stripe API request using real price IDs
  const params = new URLSearchParams();
  params.append('mode', planConfig.mode);
  params.append('success_url', `${siteUrl}/onboarding/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${siteUrl}/pricing?error=cancelled`);
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  params.append('metadata[operator_id]', operatorId);
  params.append('metadata[plan]', plan);
  params.append('metadata[interval]', interval);
  params.append('metadata[type]', 'subscription_checkout');
  if (email) params.append('customer_email', email);
  if (!isOneTime) params.append('subscription_data[metadata][plan]', plan);

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe checkout error:', session);
      if (method === 'GET') return NextResponse.redirect(`${siteUrl}/pricing?error=checkout_failed`);
      return NextResponse.json({ error: session.error?.message ?? 'Stripe error' }, { status: 500 });
    }

    if (method === 'GET' && session.url) {
      return NextResponse.redirect(session.url);
    }
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    if (method === 'GET') return NextResponse.redirect(`${siteUrl}/pricing?error=checkout_failed`);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return createCheckoutSession(request, 'POST');
}

export async function GET(request: NextRequest) {
  return createCheckoutSession(request, 'GET');
}
