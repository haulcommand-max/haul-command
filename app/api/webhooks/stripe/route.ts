import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser, buildPushPayload } from '@/lib/notifications/push-service';

// ══════════════════════════════════════════════════════════════
// /api/webhooks/stripe — UNIFIED STRIPE WEBHOOK
//
// Handles ALL Stripe lifecycle events for Haul Command:
//   checkout.session.completed  → AdGrid activation + plan upgrade
//   customer.subscription.*     → plan tier sync (free/basic/pro/elite)
//   invoice.payment_succeeded   → renewal confirmation
//   invoice.payment_failed      → recovery push + SMS fallback
//   payment_intent.payment_failed → recovery push
//
// All events logged to stripe_events for audit trail.
// ══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Map Stripe price IDs to plan tiers
const PRICE_TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_HC_BASIC_MONTHLY ?? '']: 'basic',
  [process.env.STRIPE_PRICE_HC_BASIC_ANNUAL ?? '']: 'basic',
  [process.env.STRIPE_PRICE_HC_PRO_MONTHLY ?? '']: 'pro',
  [process.env.STRIPE_PRICE_HC_PRO_ANNUAL ?? '']: 'pro',
  [process.env.STRIPE_PRICE_HC_ELITE_MONTHLY ?? '']: 'elite',
  [process.env.STRIPE_PRICE_HC_ELITE_ANNUAL ?? '']: 'elite',
};

function resolveTierFromSubscription(sub: Stripe.Subscription): string {
  for (const item of (sub as any).items?.data ?? []) {
    const priceId = item.price?.id ?? item.plan?.id;
    if (priceId && PRICE_TIER_MAP[priceId]) return PRICE_TIER_MAP[priceId];
  }
  // Fallback: check metadata
  return (sub as any).metadata?.tier ?? 'basic';
}

async function resolveUserIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    return customer.metadata?.supabase_user_id ?? null;
  } catch {
    return null;
  }
}

async function syncUserPlan(userId: string, tier: string, subscriptionId: string, status: string) {
  const isActive = status === 'active' || status === 'trialing';
  const planTier = isActive ? tier : 'free';

  // Update profiles table
  await supabase
    .from('profiles')
    .update({
      plan: planTier,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Also update operators table if it references this user
  await supabase
    .from('operators')
    .update({
      plan: planTier,
      stripe_subscription_id: subscriptionId,
    })
    .eq('user_id', userId);

  console.log(`[StripeWebhook] 🔄 Plan sync: user=${userId} tier=${planTier} sub=${subscriptionId} status=${status}`);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // ── Audit trail: log every event to stripe_events ──
  await supabase.from('stripe_events').upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    data: event.data.object as any,
    processed: false,
    created_at: new Date().toISOString(),
  }, { onConflict: 'stripe_event_id' });

  try {
    switch (event.type) {

      // ── checkout.session.completed ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // AdGrid slot activation
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

        // Subscription checkout → upgrade user plan immediately
        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.user_id;
          const tier = session.metadata?.tier ?? 'basic';
          if (userId) {
            await syncUserPlan(userId, tier, session.subscription as string, 'active');
          }
        }

        // Notify purchaser
        const userId = session.metadata?.user_id;
        if (userId) {
          await sendPushToUser(buildPushPayload(userId, 'payment_confirmed', {
            title: '💳 Payment confirmed',
            body: 'Your Haul Command purchase is active. Thank you!',
            deepLink: '/notifications',
            dedupKey: `payment_confirmed:${session.id}`,
            dedupWindowHrs: 0,
          }));
        }
        break;
      }

      // ── customer.subscription.created ──
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id
          ?? await resolveUserIdFromCustomer(sub.customer as string);
        if (userId) {
          const tier = resolveTierFromSubscription(sub);
          await syncUserPlan(userId, tier, sub.id, sub.status);
          await sendPushToUser(buildPushPayload(userId, 'subscription_activated', {
            title: '🎉 Welcome to Haul Command ' + tier.charAt(0).toUpperCase() + tier.slice(1),
            body: 'Your subscription is now active. Unlock your full potential.',
            deepLink: '/app/operator',
            dedupKey: `sub_created:${sub.id}`,
            dedupWindowHrs: 0,
          }));
        }
        break;
      }

      // ── customer.subscription.updated ──
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id
          ?? await resolveUserIdFromCustomer(sub.customer as string);
        if (userId) {
          const tier = resolveTierFromSubscription(sub);
          await syncUserPlan(userId, tier, sub.id, sub.status);
        }
        break;
      }

      // ── customer.subscription.deleted ──
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id
          ?? await resolveUserIdFromCustomer(sub.customer as string);
        if (userId) {
          await syncUserPlan(userId, 'free', sub.id, 'canceled');
          await sendPushToUser(buildPushPayload(userId, 'subscription_cancelled', {
            title: '📋 Subscription ended',
            body: 'Your Haul Command subscription has ended. Resubscribe anytime.',
            deepLink: '/pricing',
            dedupKey: `sub_deleted:${sub.id}`,
            dedupWindowHrs: 0,
          }));
        }
        break;
      }

      // ── invoice.payment_succeeded ──
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;
        if (subId) {
          // Refresh subscription to get latest tier
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            const userId = sub.metadata?.user_id
              ?? await resolveUserIdFromCustomer(sub.customer as string);
            if (userId) {
              const tier = resolveTierFromSubscription(sub);
              await syncUserPlan(userId, tier, sub.id, 'active');
            }
          } catch (e: any) {
            console.warn('[StripeWebhook] Could not refresh sub for invoice:', e.message);
          }
        }
        break;
      }

      // ── invoice.payment_failed ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const userId = invoice.metadata?.user_id;
        if (userId) {
          await sendPushToUser(buildPushPayload(userId, 'payment_failed', {
            title: '⚠️ Subscription payment failed',
            body: 'Your Haul Command subscription payment failed. Tap to update billing.',
            deepLink: '/account/billing',
            dedupKey: `invoice_failed:${userId}:${invoice.id}`,
            dedupWindowHrs: 6,
          }));
        }
        break;
      }

      // ── payment_intent.payment_failed ──
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const userId = intent.metadata?.user_id;
        if (userId) {
          await sendPushToUser(buildPushPayload(userId, 'payment_failed', {
            title: '⚠️ Payment failed',
            body: 'We couldn\u2019t process your payment. Tap to update your billing details.',
            deepLink: '/account/billing',
            dedupKey: `payment_failed:${userId}`,
            dedupWindowHrs: 6,
          }));

          // SMS fallback — payment failure justifies it
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
            scheduled_at: new Date(Date.now() + 30 * 60_000).toISOString(),
          });
        }
        break;
      }

      default:
        // Recorded in stripe_events for audit, no action needed
        break;
    }

    // Mark event as processed
    await supabase
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

  } catch (err: any) {
    console.error('[StripeWebhook] Processing error:', err.message);
    await supabase
      .from('stripe_events')
      .update({ processed: false, error: err.message })
      .eq('stripe_event_id', event.id);
  }

  return NextResponse.json({ received: true });
}
