import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-02-25.clover' as any,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { providerId, amountCents } = await req.json();

    if (!providerId || !amountCents) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Verify eligibility
    const { data: provider, error } = await supabase
      .from('hc_provider_best_public_record')
      .select('stripe_account_id, quickpay_eligible, stripe_onboarding_complete')
      .eq('provider_id', providerId)
      .single();

    if (error || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    if (!provider.quickpay_eligible || !provider.stripe_onboarding_complete) {
      return NextResponse.json({ error: 'Provider not configured for QuickPay' }, { status: 403 });
    }

    // 2. Determine fees (e.g. 5% for instant payout)
    const feeCents = Math.round(amountCents * 0.05);
    const payoutCents = amountCents - feeCents;

    // 3. Prevent duplicate requests (would lock funds in production, keeping simple for demo)
    
    // 4. Create Transfer (requires sufficient platform balance)
    // Note: If payments are held on the platform account, we transfer to the connected account.
    // Assuming funds are available on the connect platform via destination charges.
    const transfer = await stripe.transfers.create({
      amount: payoutCents,
      currency: 'usd',
      destination: provider.stripe_account_id,
      description: 'Haul Command QuickPay Advance',
    });

    // 5. Trigger Instant Payout from the Connected Account balance
    // This pushes the freshly transferred amount immediately to their debit card or bank (if supported).
    let payoutId = null;
    let payoutStatus = 'transferred_only';
    
    // We attempt an instant payout on their behalf if they have an eligible debit card attached
    try {
        const payout = await stripe.payouts.create(
            {
              amount: payoutCents,
              currency: 'usd',
              method: 'instant', // requires eligible card
            },
            {
              stripeAccount: provider.stripe_account_id,
            }
          );
        payoutId = payout.id;
        payoutStatus = payout.status;
    } catch (poErr: any) {
        console.warn('Instant payout failed (card might not support it), funds reflect in balance:', poErr.message);
        payoutStatus = 'failed_instant_payout_fallback_to_standard';
    }

    // 6. Log transaction
    await supabase.from('hc_quickpay_transactions').insert({
      provider_id: providerId,
      stripe_account_id: provider.stripe_account_id,
      amount_cents: amountCents,
      fee_cents: feeCents,
      status: payoutStatus,
      stripe_payout_id: payoutId || transfer.id
    });

    return NextResponse.json({ 
        success: true, 
        payoutCents, 
        feeCents, 
        status: payoutStatus 
    });

  } catch (err: any) {
    console.error('QuickPay error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
