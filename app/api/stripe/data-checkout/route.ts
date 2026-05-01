import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';
import { HC_15X_DATA_PRODUCTS } from '@/lib/monetization/data-product-15x-catalog';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only route */ },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function getProduct(productId: string) {
  const existing = DATA_PRODUCT_CATALOG.find(product => product.id === productId && product.active);
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      description: existing.description,
      amount: Math.max(0, Math.round(existing.price_usd * 100)),
      mode: existing.purchase_type === 'subscription' ? 'subscription' as const : 'payment' as const,
      productType: existing.type,
      source: 'core_catalog',
    };
  }

  const fifteenX = HC_15X_DATA_PRODUCTS.find(product => product.id === productId);
  if (fifteenX) {
    return {
      id: fifteenX.id,
      name: fifteenX.name,
      description: fifteenX.why_it_sells,
      amount: Math.max(0, Math.round(fifteenX.base_price_usd * 100)),
      mode: fifteenX.purchase_model === 'monthly' ? 'subscription' as const : 'payment' as const,
      productType: 'enterprise_feed',
      source: '15x_catalog',
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.product_id || body.productId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const countryCode = String(body.country_code || body.countryCode || 'ALL').toUpperCase();
    const corridorCode = body.corridor_code || body.corridorCode || null;
    const regionCode = body.region_code || body.regionCode || null;

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const product = getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: 'Unknown or inactive data product' }, { status: 404 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required for data product checkout' }, { status: 400 });
    }

    if (product.amount <= 0) {
      return NextResponse.json({
        error: 'This product is included in a plan or requires account access instead of direct checkout.',
      }, { status: 400 });
    }

    const user = await getSupabaseUser();
    const stripe = getStripe();
    const origin = req.nextUrl.origin;
    const metadata: Record<string, string> = {
      type: 'data_purchase',
      product_id: product.id,
      product_type: product.productType,
      data_product_source: product.source,
      country_code: countryCode,
      corridor_code: corridorCode ? String(corridorCode) : '',
      region_code: regionCode ? String(regionCode) : '',
      email,
      user_id: user?.id || '',
      entitlement_kind: 'data_product',
      source: 'data_marketplace',
    };

    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      payment_method_types: ['card'],
      customer_email: user?.email || email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: product.mode === 'subscription' ? { interval: 'month' } : undefined,
            product_data: {
              name: product.name,
              description: product.description.slice(0, 500),
              metadata,
            },
            unit_amount: product.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/data?success=true&product=${encodeURIComponent(product.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/data?canceled=true&product=${encodeURIComponent(product.id)}`,
      metadata,
      subscription_data: product.mode === 'subscription' ? { metadata } : undefined,
      allow_promotion_codes: true,
    });

    // Signed-in buyers get a pending unlock immediately. The Stripe webhook should flip this to active.
    if (user?.id) {
      const supabase = getSupabaseAdmin();
      await supabase.from('data_purchases').upsert({
        user_id: user.id,
        product_id: product.id,
        product_type: product.productType,
        country_code: countryCode,
        corridor_code: corridorCode || null,
        stripe_session_id: session.id,
        status: 'pending',
        purchased_at: new Date().toISOString(),
        expires_at: product.mode === 'subscription'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        metadata: {
          email,
          amount_cents: product.amount,
          source: product.source,
          region_code: regionCode,
        },
      }, {
        onConflict: 'user_id,product_id,country_code',
        ignoreDuplicates: false,
      });
    }

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[Data Product Checkout Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create data product checkout session' },
      { status: 500 },
    );
  }
}
