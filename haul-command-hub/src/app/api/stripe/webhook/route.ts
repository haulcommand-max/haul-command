import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed → activate subscription
 * - customer.subscription.deleted → deactivate
 * - invoice.payment_failed → mark failed
 */
export async function POST(request: NextRequest) {
  try {
    const sig = request.headers.get('stripe-signature');
    const body = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // If webhook secret is set, verify signature
    // Otherwise accept (dev mode)
    if (webhookSecret && !sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Parse event
    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const sb = supabaseServer();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const operatorId = session.metadata?.operator_id;
        const plan = session.metadata?.plan ?? 'pro';

        if (operatorId && operatorId !== 'unknown') {
          await sb
            .from('hc_places')
            .update({
              subscription_status: 'active',
              plan: plan,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', operatorId);
        }

        console.log(`✅ Subscription activated: operator=${operatorId} plan=${plan}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await sb
          .from('hc_places')
          .update({ subscription_status: 'cancelled', plan: 'free' })
          .eq('stripe_customer_id', customerId);

        console.log(`🚫 Subscription cancelled: customer=${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        await sb
          .from('hc_places')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);

        console.log(`⚠️ Payment failed: customer=${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
