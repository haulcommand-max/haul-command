import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

/**
 * Haul Command — Stripe Connect 85/15 Revenue Split Engine
 * 
 * Multi-party payment flow:
 *   Client pays → Stripe deducts fees → 85% goes to escort provider → 15% to HC platform
 * 
 * Integrated with the Surge Pricing Engine for dynamic rate adjustment.
 * 
 * Revenue split is enforced at Stripe level via application_fee_amount:
 *   - Platform fee = 15% of final price (after surge)
 *   - Provider payout = 85% of final price (after Stripe's ~2.9% + 30¢)
 * 
 * Hardened with:
 *   - Input validation and sanitization
 *   - Minimum price floor ($50) to prevent abuse
 *   - Maximum surge cap (2.5x) for price protection
 *   - Metadata logging for audit trail
 *   - Currency-aware amount handling
 */

const PLATFORM_FEE_RATE = 0.15; // 15% platform fee
const MIN_PRICE_USD = 50;       // Minimum job price
const MAX_SURGE = 2.5;          // Maximum surge multiplier
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const body = await req.json();

    const {
      escortStripeAccountId,
      basePriceUsd,
      regionCode,
      loadDescription,
      jobId,
      customerId,
      disableSurge,
      currency = 'usd',
    } = body;

    // ── Validate Inputs ──────────────────────────────────────
    if (!escortStripeAccountId || typeof escortStripeAccountId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid escortStripeAccountId' }, { status: 400 });
    }
    if (!basePriceUsd || typeof basePriceUsd !== 'number' || basePriceUsd < MIN_PRICE_USD) {
      return NextResponse.json({
        error: `basePriceUsd must be a number >= $${MIN_PRICE_USD}`,
      }, { status: 400 });
    }
    if (!regionCode || typeof regionCode !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid regionCode' }, { status: 400 });
    }

    // ── 1. Fetch Surge Multiplier ────────────────────────────
    let multiplier = 1.0;
    let surgeSource = 'default';

    if (!disableSurge) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: surgeData } = await supabase
          .from('hc_market_surge')
          .select('surge_multiplier')
          .eq('region_code', regionCode)
          .single();

        if (surgeData) {
          const rawMultiplier = parseFloat(surgeData.surge_multiplier);
          multiplier = Math.min(MAX_SURGE, Math.max(0.85, rawMultiplier || 1.0));
          surgeSource = 'database';
        }
      }
    }

    // ── 2. Calculate Amounts in Cents ─────────────────────────
    const finalPriceUsd = basePriceUsd * multiplier;
    const finalPriceCents = Math.round(finalPriceUsd * 100);
    const platformFeeCents = Math.round(finalPriceCents * PLATFORM_FEE_RATE);
    const providerPayoutCents = finalPriceCents - platformFeeCents;

    // ── 3. Build Checkout Session ─────────────────────────────
    const surgeLabel = multiplier > 1.0
      ? `⚡ SURGE ${Math.round((multiplier - 1) * 100)}% — High Demand Area`
      : '';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{
        price_data: {
          currency,
          product_data: {
            name: `Pilot Car Command Dispatch — ${regionCode.toUpperCase()}`,
            description: [
              loadDescription || 'Oversize Transport Escort Service',
              surgeLabel,
            ].filter(Boolean).join(' | '),
          },
          unit_amount: finalPriceCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: escortStripeAccountId,
        },
        metadata: {
          platform: 'haul-command',
          split_model: '85-15',
          region_code: regionCode,
          surge_multiplier: String(multiplier),
          base_price_usd: String(basePriceUsd),
          final_price_usd: String(finalPriceUsd),
          platform_fee_usd: String(platformFeeCents / 100),
          provider_payout_usd: String(providerPayoutCents / 100),
          ...(jobId ? { job_id: String(jobId) } : {}),
          ...(customerId ? { customer_id: String(customerId) } : {}),
        },
      },
      success_url: `${SITE_URL}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/dashboard`,
      metadata: {
        platform: 'haul-command',
        region_code: regionCode,
        surge_multiplier: String(multiplier),
      },
    });

    // ── 4. Log transaction attempt (optional) ──────────────────
    const supabase = getSupabase();
    if (supabase && jobId) {
      await supabase.from('hc_payment_log').insert({
        job_id: jobId,
        checkout_session_id: session.id,
        region_code: regionCode,
        base_price_usd: basePriceUsd,
        surge_multiplier: multiplier,
        final_price_usd: finalPriceUsd,
        platform_fee_usd: platformFeeCents / 100,
        provider_payout_usd: providerPayoutCents / 100,
        escort_stripe_account: escortStripeAccountId,
        status: 'checkout_created',
      }).catch(() => {}); // Non-blocking log
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      pricing: {
        basePriceUsd,
        surgeMultiplier: multiplier,
        surgeSource,
        finalPriceUsd: Math.round(finalPriceUsd * 100) / 100,
        platformFeeUsd: Math.round(platformFeeCents) / 100,
        providerPayoutUsd: Math.round(providerPayoutCents) / 100,
        splitModel: '85/15',
        currency: currency.toUpperCase(),
      },
    });

  } catch (err: any) {
    console.error('Stripe Connect checkout error:', err);
    return NextResponse.json(
      { error: err.message, code: err.code || 'STRIPE_ERROR' },
      { status: err.statusCode || 500 }
    );
  }
}
