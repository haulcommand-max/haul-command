import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Haul Command Pro Stripe Master Implementation
// Handles multi-party billing + dynamic algorithmic surge pricing

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { escortStripeAccountId, basePriceUsd, regionCode, loadDescription } = await req.json();

    if (!escortStripeAccountId || !basePriceUsd || !regionCode) {
      return NextResponse.json({ error: 'Missing critical dispatch parameters' }, { status: 400 });
    }

    // 1. Calculate Algorithmic Surge dynamically from the Supabase Market state
    const { data: surgeData } = await supabase
      .from('hc_market_surge')
      .select('surge_multiplier')
      .eq('region_code', regionCode)
      .single();
      
    // Default to 1.0 (no surge) if the cron hasn't initialized the region yet
    const multiplier = surgeData ? parseFloat(surgeData.surge_multiplier) : 1.0;
    
    // Stripe requires pennies (cents). Math.round to prevent floating point crashes.
    const finalPriceCents = Math.round(basePriceUsd * multiplier * 100);

    // 2. Stripe Connect Split Logic (85% Escort, 15% Platform Fee unconditionally)
    const platformFeeCents = Math.round(finalPriceCents * 0.15);

    // 3. Create the multi-party Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `Pilot Car Command Dispatch - ${regionCode}`, 
            description: `${multiplier > 1.0 ? '⚡ SURGE ACTIVE: High Demand Area. ' : ''}${loadDescription || 'Oversize Transport Escort'}`
          },
          unit_amount: finalPriceCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: escortStripeAccountId, // Directly wires 85% to the provider
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/success?session_id={CHECKPOINT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    });

    return NextResponse.json({ 
      url: session.url, 
      applied_multiplier: multiplier,
      hauler_payout_estimated: (finalPriceCents - platformFeeCents) / 100,
      hc_revenue: platformFeeCents / 100
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
