import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type DataPurchaseMetadata = {
  type?: string;
  entitlement_kind?: string;
  product_id?: string;
  product_type?: string;
  country_code?: string;
  corridor_code?: string;
  region_code?: string;
  user_id?: string;
  email?: string;
  data_product_source?: string;
};

function isDataPurchase(metadata: DataPurchaseMetadata) {
  return metadata.type === 'data_purchase' || metadata.entitlement_kind === 'data_product';
}

function subscriptionExpiry() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

async function activateDataPurchase(session: Stripe.Checkout.Session) {
  const metadata = (session.metadata || {}) as DataPurchaseMetadata;
  if (!isDataPurchase(metadata)) return { skipped: true, reason: 'not_data_purchase' };

  const productId = metadata.product_id;
  const productType = metadata.product_type || 'enterprise_feed';
  const countryCode = metadata.country_code || 'ALL';
  const corridorCode = metadata.corridor_code || null;
  const regionCode = metadata.region_code || null;
  const userId = metadata.user_id || null;
  const email = metadata.email || session.customer_email || session.customer_details?.email || null;

  if (!productId) return { skipped: true, reason: 'missing_product_id' };

  const supabase = getSupabaseAdmin();
  const mode = session.mode;
  const isSubscription = mode === 'subscription';
  const amountTotal = session.amount_total || 0;

  if (userId) {
    const { error } = await supabase.from('data_purchases').upsert({
      user_id: userId,
      product_id: productId,
      product_type: productType,
      country_code: countryCode,
      corridor_code: corridorCode || null,
      stripe_session_id: session.id,
      status: 'active',
      purchased_at: new Date().toISOString(),
      expires_at: isSubscription ? subscriptionExpiry() : null,
      metadata: {
        email,
        region_code: regionCode,
        amount_cents: amountTotal,
        stripe_customer: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripe_subscription: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        source: metadata.data_product_source || 'data_marketplace',
      },
    }, {
      onConflict: 'user_id,product_id,country_code',
      ignoreDuplicates: false,
    });

    if (error) throw error;
  }

  await supabase.from('data_product_export_events').insert({
    user_id: userId,
    email,
    event_type: 'data_purchase_activated',
    product_id: productId,
    country_code: countryCode,
    properties: {
      stripe_session_id: session.id,
      stripe_mode: session.mode,
      amount_total: amountTotal,
      corridor_code: corridorCode,
      region_code: regionCode,
      has_user_id: Boolean(userId),
    },
  });

  return { activated: true, productId, userId, email };
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_DATA_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Local/dev fallback only. Production should always set STRIPE_DATA_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET.
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await activateDataPurchase(session);
      return NextResponse.json({ received: true, result });
    }

    return NextResponse.json({ received: true, ignored: event.type });
  } catch (err: any) {
    console.error('[Data Stripe Webhook Error]', err);
    return NextResponse.json({ error: err?.message || 'Webhook failed' }, { status: 400 });
  }
}
