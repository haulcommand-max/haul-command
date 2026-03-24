import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-18.acacia' as any });

const INSTANT_PAYOUT_FEE_RATE = 0.015; // 1.5%

// POST /api/connect/payout
// Initiates a payout from the operator's Connect balance to their bank
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount_cents, method } = await req.json();
    if (!amount_cents || !method) {
      return NextResponse.json({ error: 'amount_cents and method required' }, { status: 400 });
    }
    if (!['standard', 'instant'].includes(method)) {
      return NextResponse.json({ error: 'method must be standard or instant' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({ error: 'No connected account' }, { status: 400 });
    }
    if (!profile.stripe_connect_payouts_enabled) {
      return NextResponse.json({ error: 'Payouts not yet enabled — complete account setup' }, { status: 400 });
    }

    // Calculate fee for instant payouts
    const feeAmount = method === 'instant'
      ? Math.ceil(amount_cents * INSTANT_PAYOUT_FEE_RATE)
      : 0;
    const netAmount = amount_cents - feeAmount;

    // Create payout on Connect account
    const payout = await stripe.payouts.create(
      {
        amount: netAmount,
        currency: 'usd',
        method: method === 'instant' ? 'instant' : 'standard',
        metadata: {
          platform: 'haul_command',
          user_id: user.id,
          payout_type: method,
        },
        statement_descriptor: 'HAUL COMMAND PAY',
      },
      { stripeAccount: profile.stripe_connect_account_id }
    );

    // Record in our DB
    await supabase.from('operator_payouts').insert({
      operator_id: user.id,
      amount: amount_cents / 100,
      fee: feeAmount / 100,
      net_amount: netAmount / 100,
      payout_method: method,
      stripe_payout_id: payout.id,
      status: 'processing',
    });

    return NextResponse.json({
      payout_id: payout.id,
      amount_cents,
      fee_cents: feeAmount,
      net_cents: netAmount,
      method,
      estimated_arrival: method === 'instant' ? 'Within 30 minutes' : '2 business days',
    });
  } catch (error: any) {
    console.error('Payout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
