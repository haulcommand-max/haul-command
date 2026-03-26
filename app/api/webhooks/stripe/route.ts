import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Stripe webhook sig verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createClient();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const loadId = pi.metadata.load_id;
        if (loadId) {
          await supabase
            .from('escrow_transactions')
            .update({ status: 'held' })
            .eq('stripe_payment_intent_id', pi.id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from('escrow_transactions')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', pi.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        
        // Find user by stripe customer id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const plan = (sub.items.data[0]?.price?.lookup_key) || 'basic';
          await supabase
            .from('profiles')
            .update({
              plan_tier: plan,
              subscription_status: sub.status,
              stripe_subscription_id: sub.id,
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              plan_tier: 'basic',
              subscription_status: 'canceled',
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        if (customerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (profile) {
            await supabase.from('notifications').insert({
              user_id: profile.id,
              type: 'system',
              title: 'Payment Confirmed',
              body: `Your subscription payment of $${((invoice.amount_paid || 0) / 100).toFixed(2)} was successful.`,
              data: { invoice_id: invoice.id },
            });
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle AdGrid Boost Activation
        if (session.metadata?.type === 'ad_boost' && session.metadata?.boost_id) {
          await supabase
            .from('ad_boosts')
            .update({ 
              status: 'active',
              starts_at: new Date().toISOString()
            })
            .eq('id', session.metadata.boost_id);
            
          console.log(`[Stripe Webhook] Activated AdGrid Boost: ${session.metadata.boost_id}`);
        }

        // Handle Claim / Setup Intent (if needed down the line)
        if (session.metadata?.type === 'tier2_claim' && session.metadata?.profile_id) {
           await supabase
             .from('profiles')
             .update({ is_claimed: true, claim_status: 'verified' })
             .eq('id', session.metadata.profile_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
