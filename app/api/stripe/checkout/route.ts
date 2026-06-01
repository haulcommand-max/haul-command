import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICE_IDS, type StripePriceKey } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSiteUrl } from '@/lib/site-url';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in route handlers */ },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const SPONSOR_METADATA_KEYS = [
  'zone',
  'country',
  'corridor',
  'role',
  'category',
  'source',
  'recommendedCampaignId',
] as const;

function cleanMetadataValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.replace(/[^\w .:/?#=&-]/g, '').trim();
  return clean ? clean.slice(0, 120) : undefined;
}

function sanitizeSponsorMetadata(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object') return {};
  const source = input as Record<string, unknown>;
  const metadata: Record<string, string> = {};
  for (const key of SPONSOR_METADATA_KEYS) {
    const clean = cleanMetadataValue(source[key]);
    if (clean) metadata[`sponsor_${key}`] = clean;
  }
  return metadata;
}

const SPONSOR_PRICE_KEYS = new Set<StripePriceKey>([
  'corridor_sponsor_monthly',
  'territory_sponsor_monthly',
  'cpc_deposit',
  'founding_sponsor_bronze',
  'founding_sponsor_silver',
  'founding_sponsor_gold',
]);

function isSponsorPriceKey(priceKey: StripePriceKey): boolean {
  return SPONSOR_PRICE_KEYS.has(priceKey);
}

function resolveSponsorZone(priceKey: StripePriceKey, metadata: Record<string, string>): string {
  if (metadata.sponsor_zone) return metadata.sponsor_zone;
  if (priceKey === 'corridor_sponsor_monthly') return 'corridor';
  if (priceKey === 'territory_sponsor_monthly') return 'territory';
  if (priceKey === 'cpc_deposit') return 'cpc';
  return 'founding_sponsor';
}

function resolveSponsorGeo(metadata: Record<string, string>): string {
  return (
    metadata.sponsor_corridor ||
    metadata.sponsor_country ||
    metadata.sponsor_role ||
    metadata.sponsor_category ||
    'global'
  );
}

const rowId = (row: unknown) => (row && typeof row === 'object' && 'id' in row ? String(row.id) : undefined);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceKey, mode, successUrl, cancelUrl, sponsorContext } = body as {
      priceKey: StripePriceKey;
      mode?: 'subscription' | 'payment';
      successUrl?: string;
      cancelUrl?: string;
      sponsorContext?: unknown;
    };

    if (!priceKey || !STRIPE_PRICE_IDS[priceKey]) {
      return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
    }
    const stripeBlockReason = getStripeCheckoutBlockReason();
    if (stripeBlockReason) {
      return NextResponse.json(
        { error: 'Checkout is temporarily unavailable.', reason: stripeBlockReason },
        { status: 503 }
      );
    }

    const priceId = STRIPE_PRICE_IDS[priceKey];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured. Set the STRIPE_PRICE_* env var.' },
        { status: 500 }
      );
    }

    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!isEmailConfirmed(user)) {
      return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
    }

    const stripe = getStripe();

    // Check if user already has a Stripe customer
    let customerId: string | undefined;
    if (user.email) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      }
    }

    const isSubscription = priceKey.includes('monthly') || priceKey.includes('yearly');
    const checkoutMode = mode || (isSubscription ? 'subscription' : 'payment');

    const origin = getSiteUrl();
    const sponsorMetadata = sanitizeSponsorMetadata(sponsorContext);
    const sponsorCheckout = isSponsorPriceKey(priceKey);
    let sponsorOrderId: string | undefined;
    let sponsorZone: string | undefined;
    let sponsorGeo: string | undefined;

    if (sponsorCheckout) {
      sponsorZone = resolveSponsorZone(priceKey, sponsorMetadata);
      sponsorGeo = resolveSponsorGeo(sponsorMetadata);

      const { data: pendingOrder, error: pendingOrderError } = await getSupabaseAdmin()
        .from('sponsorship_orders' as never)
        .insert({
          user_id: user.id,
          product_key: priceKey,
          geo_key: sponsorGeo,
          zone: sponsorZone,
          geo: sponsorGeo,
          status: 'pending',
        } as never)
        .select('id')
        .single();

      sponsorOrderId = rowId(pendingOrder);
      if (pendingOrderError || !sponsorOrderId) {
        return NextResponse.json(
          { error: pendingOrderError?.message ?? 'Unable to reserve sponsor order' },
          { status: 500 }
        );
      }
    }

    const stripeMetadata = {
      user_id: user.id,
      price_key: priceKey,
      ...sponsorMetadata,
      ...(sponsorCheckout && sponsorOrderId && sponsorZone && sponsorGeo
        ? {
            sponsor_order_id: sponsorOrderId,
            sponsor_zone: sponsorZone,
            sponsor_geo: sponsorGeo,
            sponsor_product_key: priceKey,
            order_id: sponsorOrderId,
            product_key: priceKey,
            geo_key: sponsorGeo,
          }
        : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      ...(customerId ? { customer: customerId } : {
        customer_email: user.email || undefined,
      }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/pricing?canceled=true`,
      metadata: stripeMetadata,
      ...(checkoutMode === 'subscription' ? {
        subscription_data: {
          metadata: stripeMetadata,
        },
        allow_promotion_codes: true,
      } : {}),
    });

    if (sponsorOrderId) {
      await getSupabaseAdmin()
        .from('sponsorship_orders' as never)
        .update({
          stripe_checkout_session_id: session.id,
          stripe_customer_id: (session.customer as string | null) ?? customerId ?? null,
        } as never)
        .eq('id' as never, sponsorOrderId);
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('[Stripe Checkout Error]', err);
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
