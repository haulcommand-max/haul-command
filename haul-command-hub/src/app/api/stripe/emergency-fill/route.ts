/**
 * POST /api/stripe/emergency-fill
 * Emergency Fill — $25 one-time payment for urgent load coverage.
 * Shows on unfilled loads older than 2 hours.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { load_id, corridor, email } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${siteUrl}/loads?emergency_filled=${load_id || 'true'}`);
    params.append('cancel_url', `${siteUrl}/loads?cancelled=true`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Emergency Fill — ${corridor || 'Load Coverage'}`);
    params.append('line_items[0][price_data][unit_amount]', '2500');
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[type]', 'emergency_fill');
    params.append('metadata[load_id]', load_id || 'unknown');
    params.append('metadata[corridor]', corridor || 'unknown');
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
    console.error('[Emergency Fill] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
