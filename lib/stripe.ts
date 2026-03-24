import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/**
 * Map internal tier IDs → Stripe price IDs.
 * Env vars override, but defaults work with test-mode prices.
 *
 * Current Stripe products:
 *   prod_UBahzQaRTdqdIN = "Haul Command Basic"  → Escort Pro   ($29/mo)
 *   prod_UBahEdk8IbPj5O = "Haul Command Pro"    → Escort Elite ($79/mo)
 *   prod_UBahC4YYBNOj75 = "Haul Command Elite"  → Legacy ($199/mo)
 *   prod_UBdrS6D733sJnF = "Broker Seat"          → $149/mo
 *   prod_UBdrf1TVSNl2aT = "Load Boost"           → $14 one-time
 */
export const STRIPE_PRICE_IDS = {
  // Escort / Operator tiers
  escort_pro_monthly:   process.env.STRIPE_PRICE_ESCORT_PRO_MONTHLY   || 'price_1TDDWXRiV0LOCA36ZtcV4tjs',
  escort_pro_yearly:    process.env.STRIPE_PRICE_ESCORT_PRO_YEARLY    || 'price_1TDGZlRiV0LOCA36XCdlvtMt',
  escort_elite_monthly: process.env.STRIPE_PRICE_ESCORT_ELITE_MONTHLY || 'price_1TDDWYRiV0LOCA36urpGznvy',
  escort_elite_yearly:  process.env.STRIPE_PRICE_ESCORT_ELITE_YEARLY  || 'price_1TDGZmRiV0LOCA36BnUWRUJ0',
  // Broker tiers
  broker_seat_monthly:  process.env.STRIPE_PRICE_BROKER_SEAT_MONTHLY  || 'price_1TDGZnRiV0LOCA366WNx1EUF',
  broker_seat_yearly:   process.env.STRIPE_PRICE_BROKER_SEAT_YEARLY   || 'price_1TDGZoRiV0LOCA36qvviObj4',
  // One-time
  load_boost:           process.env.STRIPE_PRICE_LOAD_BOOST           || 'price_1TDGZpRiV0LOCA36F8yt0svI',
  // HC Certified Training (one-time payments / annual subscriptions)
  hc_certified:         process.env.STRIPE_PRICE_HC_CERTIFIED         || '',
  av_ready:             process.env.STRIPE_PRICE_AV_READY             || '',
  hc_elite:             process.env.STRIPE_PRICE_HC_ELITE             || '',
} as const;

export type StripePriceKey = keyof typeof STRIPE_PRICE_IDS;
