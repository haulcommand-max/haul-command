import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser, buildPushPayload } from '@/lib/notifications/push-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // ── checkout.session.completed → activate AdGrid slot
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const slotId = session.metadata?.adgrid_slot_id;

    if (slotId) {
      await supabase
        .from('hc_adgrid_slots')
        .update({
          status: 'active',
          advertiser_email: session.customer_details?.email ?? null,
          advertiser_name: session.customer_details?.name ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId);
    }

    // Notify purchaser — payment_confirmed push
    const userId = session.metadata?.user_id;
    if (userId) {
      await sendPushToUser(buildPushPayload(userId, 'payment_confirmed', {
          title: '💳 Payment confirmed',
          body: 'Your Haul Command purchase is active. Thank you!',
          deepLink: '/notifications',
          dedupKey: `payment_confirmed:${session.id}`,
          dedupWindowHrs: 0,
        })
      );
    }
  }

  // ── payment_intent.payment_failed → recovery push
  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const userId = intent.metadata?.user_id;

    if (userId) {
      await sendPushToUser(
        buildPushPayload(userId, 'payment_failed', {
          title: '⚠️ Payment failed',
          body: 'We couldn’t process your payment. Tap to update your billing details.',
          deepLink: '/account/billing',
          dedupKey: `payment_failed:${userId}`,
          dedupWindowHrs: 6,
        })
      );
    }

    // Also enqueue SMS fallback (surgical — payment failure justifies it)
    if (userId) {
      await supabase.from('hc_notif_jobs').insert({
        event_type: 'payment_failed',
        mode: 'single',
        payload: {
          userId,
          eventType: 'payment_failed',
          channel: 'sms',
          title: 'Payment failed',
          body: 'Haul Command: Your payment failed. Update billing at haulcommand.com/account/billing',
          dedupKey: `payment_failed_sms:${userId}`,
          dedupWindowHrs: 6,
        },
        scheduled_at: new Date(Date.now() + 30 * 60_000).toISOString(), // 30min delay after push
      });
    }
  }

  // ── invoice.payment_failed (subscriptions)
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const userId = invoice.metadata?.user_id;
    if (userId) {
      await sendPushToUser(
        buildPushPayload(userId, 'payment_failed', {
          title: '⚠️ Subscription payment failed',
          body: 'Your Haul Command subscription payment failed. Tap to update billing.',
          deepLink: '/account/billing',
          dedupKey: `invoice_failed:${userId}:${invoice.id}`,
          dedupWindowHrs: 6,
        })
      );
    }
  }

  return NextResponse.json({ received: true });
}
