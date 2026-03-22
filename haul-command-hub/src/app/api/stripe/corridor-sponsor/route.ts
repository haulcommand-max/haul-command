/**
 * POST /api/stripe/corridor-sponsor
 * Corridor Sponsor — $199/month sponsorship of a corridor page.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { corridor_slug, corridor_name, email, operator_id } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', `${siteUrl}/corridors/${corridor_slug || ''}?sponsored=true`);
    params.append('cancel_url', `${siteUrl}/corridors/${corridor_slug || ''}`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Corridor Sponsor — ${corridor_name || corridor_slug || 'Route'}`);
    params.append('line_items[0][price_data][recurring][interval]', 'month');
    params.append('line_items[0][price_data][unit_amount]', '19900');
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[type]', 'corridor_sponsor');
    params.append('metadata[corridor_slug]', corridor_slug || '');
    params.append('metadata[operator_id]', operator_id || '');
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
    console.error('[Corridor Sponsor] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
