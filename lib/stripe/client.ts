import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Legacy compatibility exports used by lib/marketplace/booking-payment.ts
export const PLATFORM_FEE_BPS = 250 // 2.5%
export const ESCROW_HOLD_DAYS = 3

export function getStripeClient(): Stripe {
  return stripe
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (existing?.stripe_customer_id) return existing.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    metadata: { hc_user_id: userId },
  })

  await supabase.from('stripe_customers').upsert({
    user_id: userId,
    stripe_customer_id: customer.id,
    email,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return customer.id
}

export async function createNetworkActivationFee(
  customerId: string,
  operatorId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: 100,
    currency: 'usd',
    customer: customerId,
    setup_future_usage: 'off_session',
    metadata: {
      type: 'network_activation',
      operator_id: operatorId,
    },
    description: 'Haul Command Network Activation Fee',
  })
}
