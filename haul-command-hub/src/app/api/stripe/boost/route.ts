/**
 * POST /api/stripe/boost
 *
 * Load Boost — $14 one-time purchase.
 * Uses the real Stripe price ID for Load Boost product.
 * Pushes the operator's load to the top of the feed for 24 hours.
 */

import { NextRequest, NextResponse } from 'next/server';

const BOOST_PRICE_ID = 'price_1TDGZpRiV0LOCA36F8yt0svI'; // Load Boost $14

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { load_id, corridor, email, operator_id } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${siteUrl}/loads?boosted=${load_id || 'true'}`);
    params.append('cancel_url', `${siteUrl}/loads`);
    params.append('line_items[0][price]', BOOST_PRICE_ID);
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[type]', 'load_boost');
    params.append('metadata[load_id]', load_id || 'unknown');
    params.append('metadata[corridor]', corridor || 'unknown');
    params.append('metadata[operator_id]', operator_id || 'unknown');
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
      return NextResponse.json({ error: session.error?.message ?? 'Stripe error' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Load Boost] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
