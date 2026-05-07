import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log raw event immediately
  await supabase.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    payload: event,
    created_at: new Date().toISOString(),
  })

  // Process async (don't await so we return 200 fast)
  processEvent(event).catch(console.error)

  return NextResponse.json({ received: true })
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase.from('hc_payments').upsert({
        stripe_payment_intent_id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: 'succeeded',
        operator_id: pi.metadata.operator_id ?? null,
        metadata: pi.metadata,
        created_at: new Date().toISOString(),
      }, { onConflict: 'stripe_payment_intent_id' })

      await supabase.from('hc_pay_ledger').insert({
        stripe_payment_intent_id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        type: pi.metadata.type ?? 'payment',
        operator_id: pi.metadata.operator_id ?? null,
        created_at: new Date().toISOString(),
      })
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase.from('hc_payments').upsert({
        stripe_payment_intent_id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: 'failed',
        operator_id: pi.metadata.operator_id ?? null,
        metadata: pi.metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_payment_intent_id' })
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('stripe_subscriptions').upsert({
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await supabase.from('hc_stripe_accounts').upsert({
        stripe_account_id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_account_id' })
      break
    }
  }
}
