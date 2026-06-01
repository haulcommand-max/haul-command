import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripeClient } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';

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
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function cleanMetadataValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.replace(/[^\w .:/?#=&-]/g, '').trim();
  return clean ? clean.slice(0, 200) : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const stripeBlockReason = getStripeCheckoutBlockReason();
    if (stripeBlockReason) {
      return NextResponse.json(
        { error: 'Payments are temporarily unavailable.', reason: stripeBlockReason },
        { status: 503 },
      );
    }

    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!isEmailConfirmed(user)) {
      return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
    }

    const body = await req.json();
    const amountCents = Number(body.amount_cents ?? body.amount);
    const currency = cleanMetadataValue(body.currency)?.toLowerCase() || 'usd';
    const operatorId = cleanMetadataValue(body.operator_id);
    const loadId = cleanMetadataValue(body.load_id);
    const bookingId = cleanMetadataValue(body.booking_id) || loadId;
    const description = cleanMetadataValue(body.description) || 'Haul Command payment intent';
    const countryCode = cleanMetadataValue(body.country_code)?.toUpperCase();
    const platformFeeCents =
      body.platform_fee_cents == null ? null : Math.max(0, Math.round(Number(body.platform_fee_cents)));

    if (!Number.isInteger(amountCents) || amountCents < 50) {
      return NextResponse.json({ error: 'amount_cents must be an integer of at least 50' }, { status: 400 });
    }

    const metadata = {
      user_id: user.id,
      ...(operatorId ? { operator_id: operatorId } : {}),
      ...(loadId ? { load_id: loadId } : {}),
      ...(bookingId ? { booking_id: bookingId } : {}),
      description,
    };

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      setup_future_usage: 'off_session',
      metadata,
      description,
    });

    const { error } = await getSupabaseAdmin()
      .from('hc_payment_intents')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        booking_id: bookingId ?? null,
        amount_cents: amountCents,
        currency,
        status: paymentIntent.status,
        from_entity_id: user.id,
        to_entity_id: operatorId ?? null,
        platform_fee_cents: platformFeeCents,
        country_code: countryCode ?? null,
        metadata,
      });

    if (error) {
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      } catch {
        // The DB write is the source of truth for this route; log and surface it.
      }
      console.error('[Payments Intent] Supabase insert failed:', error.message);
      return NextResponse.json({ error: 'Unable to record payment intent' }, { status: 500 });
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error: unknown) {
    console.error('[Payments Intent] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment intent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
