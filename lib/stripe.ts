import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' });
  }
  return _stripe;
}

/** Map our internal tier IDs to Stripe price IDs */
export const STRIPE_PRICE_IDS = {
  // Escort / Operator tiers
  escort_pro_monthly: process.env.STRIPE_PRICE_ESCORT_PRO_MONTHLY || '',
  escort_pro_yearly: process.env.STRIPE_PRICE_ESCORT_PRO_YEARLY || '',
  escort_elite_monthly: process.env.STRIPE_PRICE_ESCORT_ELITE_MONTHLY || '',
  escort_elite_yearly: process.env.STRIPE_PRICE_ESCORT_ELITE_YEARLY || '',
  // Broker tiers
  broker_seat_monthly: process.env.STRIPE_PRICE_BROKER_SEAT_MONTHLY || '',
  broker_seat_yearly: process.env.STRIPE_PRICE_BROKER_SEAT_YEARLY || '',
  // One-time
  load_boost: process.env.STRIPE_PRICE_LOAD_BOOST || '',
} as const;

export type StripePriceKey = keyof typeof STRIPE_PRICE_IDS;
