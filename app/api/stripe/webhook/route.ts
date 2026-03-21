import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export const runtime = 'nodejs';

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const priceKey = session.metadata?.price_key;

        if (userId && userId !== 'anonymous') {
          await supabase.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string || null,
            price_key: priceKey || null,
            status: 'active',
            current_period_start: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          // Update user profile tier
          const tier = priceKey?.includes('elite') ? 'elite' : priceKey?.includes('pro') ? 'pro' : 'free';
          await supabase.from('profiles').update({
            subscription_tier: tier,
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Use (invoice as any) to handle Stripe SDK version differences
        // where 'subscription' may be removed from the Invoice type
        const subId = (invoice as any).subscription as string;
        if (subId) {
          await supabase.from('user_subscriptions')
            .update({
              status: 'active',
              current_period_start: invoice.period_start
                ? new Date(invoice.period_start * 1000).toISOString()
                : new Date().toISOString(),
              current_period_end: invoice.period_end
                ? new Date(invoice.period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status;
        await supabase.from('user_subscriptions')
          .update({
            status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        // Downgrade profile tier
        const { data: subRecord } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single();

        if (subRecord?.user_id) {
          await supabase.from('profiles').update({
            subscription_tier: 'free',
            updated_at: new Date().toISOString(),
          }).eq('id', subRecord.user_id);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
