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
  // ── Operator / Escort tiers ──────────────────────────────────────────────
  escort_pro_monthly:       process.env.STRIPE_PRICE_ESCORT_PRO_MONTHLY       || 'price_1TDDWXRiV0LOCA36ZtcV4tjs',
  escort_pro_yearly:        process.env.STRIPE_PRICE_ESCORT_PRO_YEARLY        || 'price_1TDGZlRiV0LOCA36XCdlvtMt',
  escort_elite_monthly:     process.env.STRIPE_PRICE_ESCORT_ELITE_MONTHLY     || 'price_1TDDWYRiV0LOCA36urpGznvy',
  escort_elite_yearly:      process.env.STRIPE_PRICE_ESCORT_ELITE_YEARLY      || 'price_1TDGZmRiV0LOCA36BnUWRUJ0',
  // ── Broker tiers ─────────────────────────────────────────────────────────
  broker_seat_monthly:      process.env.STRIPE_PRICE_BROKER_SEAT_MONTHLY      || 'price_1TDGZnRiV0LOCA366WNx1EUF',
  broker_seat_yearly:       process.env.STRIPE_PRICE_BROKER_SEAT_YEARLY       || 'price_1TDGZoRiV0LOCA36qvviObj4',
  // ── One-time boosts ───────────────────────────────────────────────────────
  load_boost:               process.env.STRIPE_PRICE_LOAD_BOOST               || 'price_1TDGZpRiV0LOCA36F8yt0svI',
  // ── Training / Certification ─────────────────────────────────────────────
  hc_certified:             process.env.STRIPE_PRICE_HC_CERTIFIED             || '',
  av_ready:                 process.env.STRIPE_PRICE_AV_READY                 || '',
  hc_elite:                 process.env.STRIPE_PRICE_HC_ELITE                 || '',
  // ── Advertising / Sponsorships ───────────────────────────────────────────
  // Create these in Stripe Dashboard → Products → Add Product
  // then set the env var to the resulting price_... ID
  corridor_sponsor_monthly: process.env.STRIPE_PRICE_CORRIDOR_SPONSOR_MONTHLY || '',  // $199/mo corridor sponsorship
  territory_sponsor_monthly:process.env.STRIPE_PRICE_TERRITORY_SPONSOR_MONTHLY|| '',  // $149-499/mo territory takeover
  cpc_deposit:              process.env.STRIPE_PRICE_CPC_DEPOSIT              || '',  // $50 CPC campaign deposit (one-time)
  // ── Founding Sponsor packages (one-time) ─────────────────────────────────
  founding_sponsor_bronze:  process.env.STRIPE_PRICE_FOUNDING_SPONSOR_BRONZE  || '',  // $299 one-time
  founding_sponsor_silver:  process.env.STRIPE_PRICE_FOUNDING_SPONSOR_SILVER  || '',  // $799 one-time
  founding_sponsor_gold:    process.env.STRIPE_PRICE_FOUNDING_SPONSOR_GOLD    || '',  // $1499 one-time
} as const;

export type StripePriceKey = keyof typeof STRIPE_PRICE_IDS;

/**
 * ─────────────────────────────────────────────────
 * OPUS-02 IDEMPOTENT STRIPE WRAPPERS
 * ─────────────────────────────────────────────────
 * Rule: All Stripe API calls MUST go through these wrappers — no direct SDK usage.
 */

function getTimestampBucket() {
  return Math.floor(Date.now() / 1000 / 300); // 5-minute dedup window
}

export async function createIdempotentPaymentIntent(params: {
  escrowId: string;
  amount: number;
  currency?: string;
  customerId: string;
  action?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
}) {
  const stripe = getStripe();
  const bucket = getTimestampBucket();
  const actionStr = params.action || 'preauth';
  const idempotencyKey = `hc_${params.escrowId}_${actionStr}_${bucket}`;

  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency || 'usd',
    customer: params.customerId,
    capture_method: params.captureMethod || 'manual', // Default to manual for pre-auth
    metadata: {
      escrow_id: params.escrowId,
      ...params.metadata,
    },
  }, {
    idempotencyKey,
  });
}

export async function createIdempotentTransfer(params: {
  escrowId: string;
  amount: number;
  currency?: string;
  destinationAccountId: string;
  action?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  const bucket = getTimestampBucket();
  const actionStr = params.action || 'payout';
  const idempotencyKey = `hc_${params.escrowId}_${actionStr}_${bucket}`;

  return stripe.transfers.create({
    amount: params.amount,
    currency: params.currency || 'usd',
    destination: params.destinationAccountId,
    metadata: {
      escrow_id: params.escrowId,
      ...params.metadata,
    },
  }, {
    idempotencyKey,
  });
}
