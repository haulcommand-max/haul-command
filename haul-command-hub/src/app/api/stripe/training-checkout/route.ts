/**
 * POST /api/stripe/training-checkout
 * Training Academy enrollment — replace alert() with actual Stripe checkout.
 * Supports course_id, price_usd, and student_email.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { course_id, course_name, price_usd, email } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
    const amount = Math.round((price_usd || 49) * 100); // default $49

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${siteUrl}/training/${course_id || 'enrolled'}?success=true`);
    params.append('cancel_url', `${siteUrl}/training/${course_id || ''}?cancelled=true`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `HC Training: ${course_name || 'Pilot Car Certification Course'}`);
    params.append('line_items[0][price_data][unit_amount]', amount.toString());
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[type]', 'training_enrollment');
    params.append('metadata[course_id]', course_id || 'default');
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
    console.error('[Training Checkout] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
