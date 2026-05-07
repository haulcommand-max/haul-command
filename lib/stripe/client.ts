/**
 * HAUL COMMAND — Stripe Client (Server-Side Only)
 * Lazy-initialized to prevent build-time crashes when STRIPE_SECRET_KEY is missing.
 */
import Stripe from 'stripe';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (!_stripe) {
        const blockReason = getStripeCheckoutBlockReason();
        if (blockReason) {
            throw new Error(`[HC Stripe] Checkout unavailable: ${blockReason}`);
        }
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('[HC Stripe] STRIPE_SECRET_KEY not set');
        }
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia' as any,
            typescript: true,
            appInfo: { name: 'Haul Command', version: '1.0.0' },
        });
    }
    return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripeClient() as any)[prop];
    },
});

export const PLATFORM_FEE_BPS = parseInt(process.env.STRIPE_PLATFORM_FEE_BPS || '600');
export const ESCROW_HOLD_DAYS = parseInt(process.env.STRIPE_ESCROW_HOLD_DAYS || '3');

// ── New exports for HC Pay ────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('stripe_customers').select('stripe_customer_id').eq('user_id', userId).single()
  if (existing?.stripe_customer_id) return existing.stripe_customer_id

  const customer = await getStripeClient().customers.create({
    email, metadata: { hc_user_id: userId },
  })
  await supabase.from('stripe_customers').upsert({
    user_id: userId, stripe_customer_id: customer.id, email,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  return customer.id
}

export async function createNetworkActivationFee(customerId: string, operatorId: string) {
  return getStripeClient().paymentIntents.create({
    amount: 100, currency: 'usd', customer: customerId,
    setup_future_usage: 'off_session',
    metadata: { type: 'network_activation', operator_id: operatorId },
    description: 'Haul Command Network Activation Fee',
  })
}
