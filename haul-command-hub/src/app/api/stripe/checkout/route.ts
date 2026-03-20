import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for operator subscription plans.
 * Query params: plan (verified|pro|brand_defense), interval (month|year)
 * Body: { operatorId?: string, email?: string }
 */

const PLAN_PRICES: Record<string, { month?: number; year: number; name: string }> = {
  verified: { year: 14900, name: 'Verified Operator' },
  pro: { month: 9900, year: 99000, name: 'Pro Operator' },
  brand_defense: { month: 4900, year: 49000, name: 'Brand Defense' },
};

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan') ?? 'pro';
    const interval = searchParams.get('interval') ?? 'year';
    const body = await request.json().catch(() => ({}));
    const operatorId = body.operatorId ?? 'unknown';
    const email = body.email;

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const unitAmount = interval === 'month' && planConfig.month ? planConfig.month : planConfig.year;
    const recurringInterval = interval === 'month' && planConfig.month ? 'month' : 'year';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    // Create Stripe Checkout session via raw API
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', `${siteUrl}/onboarding/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${siteUrl}/onboarding/plan?error=cancelled`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Haul Command ${planConfig.name}`);
    params.append('line_items[0][price_data][recurring][interval]', recurringInterval);
    params.append('line_items[0][price_data][unit_amount]', unitAmount.toString());
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[operator_id]', operatorId);
    params.append('metadata[plan]', plan);
    params.append('metadata[interval]', recurringInterval);
    if (email) params.append('customer_email', email);

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
      return NextResponse.json({ error: session.error?.message ?? 'Stripe error' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET redirects from pricing page links
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') ?? 'pro';
  const interval = searchParams.get('interval') ?? 'year';

  const planConfig = PLAN_PRICES[plan];
  if (!planConfig) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
    return NextResponse.redirect(`${siteUrl}/pricing`);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
    return NextResponse.redirect(`${siteUrl}/pricing?error=stripe_not_configured`);
  }

  const unitAmount = interval === 'month' && planConfig.month ? planConfig.month : planConfig.year;
  const recurringInterval = interval === 'month' && planConfig.month ? 'month' : 'year';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('success_url', `${siteUrl}/onboarding/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${siteUrl}/onboarding/plan?error=cancelled`);
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product_data][name]', `Haul Command ${planConfig.name}`);
  params.append('line_items[0][price_data][recurring][interval]', recurringInterval);
  params.append('line_items[0][price_data][unit_amount]', unitAmount.toString());
  params.append('line_items[0][quantity]', '1');

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
    if (session.url) {
      return NextResponse.redirect(session.url);
    }
  } catch {
    // fall through
  }

  return NextResponse.redirect(`${siteUrl}/pricing?error=checkout_failed`);
}
