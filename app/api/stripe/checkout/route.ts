import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICE_IDS, type StripePriceKey } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceKey, mode, successUrl, cancelUrl } = body as {
      priceKey: StripePriceKey;
      mode?: 'subscription' | 'payment';
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!priceKey || !STRIPE_PRICE_IDS[priceKey]) {
      return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS[priceKey];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured. Set the STRIPE_PRICE_* env var.' },
        { status: 500 }
      );
    }

    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const stripe = getStripe();

    // Check if user already has a Stripe customer
    let customerId: string | undefined;
    if (user?.email) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      }
    }

    const isSubscription = priceKey.includes('monthly') || priceKey.includes('yearly');
    const checkoutMode = mode || (isSubscription ? 'subscription' : 'payment');

    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      ...(customerId ? { customer: customerId } : {
        customer_email: user?.email || undefined,
      }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user?.id || 'anonymous',
        price_key: priceKey,
      },
      ...(checkoutMode === 'subscription' ? {
        subscription_data: {
          metadata: {
            user_id: user?.id || 'anonymous',
            price_key: priceKey,
          },
        },
        allow_promotion_codes: true,
      } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
