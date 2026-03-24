import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-18.acacia' as any });

// GET /api/connect/status
// Returns the operator's Connect account status and balance
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarded, stripe_connect_payouts_enabled')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({ connected: false, onboarded: false, payouts_enabled: false });
    }

    // Sync status from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const onboarded = account.details_submitted && !account.requirements?.currently_due?.length;
    const payoutsEnabled = account.payouts_enabled || false;

    // Update profile if changed
    if (onboarded !== profile.stripe_connect_onboarded || payoutsEnabled !== profile.stripe_connect_payouts_enabled) {
      await supabase
        .from('profiles')
        .update({
          stripe_connect_onboarded: onboarded,
          stripe_connect_payouts_enabled: payoutsEnabled,
        })
        .eq('id', user.id);
    }

    // Get balance from Connect account
    const balance = await stripe.balance.retrieve({ stripeAccount: profile.stripe_connect_account_id });
    const availableUSD = balance.available.find(b => b.currency === 'usd')?.amount || 0;
    const pendingUSD = balance.pending.find(b => b.currency === 'usd')?.amount || 0;

    return NextResponse.json({
      connected: true,
      onboarded,
      payouts_enabled: payoutsEnabled,
      account_id: profile.stripe_connect_account_id,
      balance: {
        available_cents: availableUSD,
        pending_cents: pendingUSD,
      },
      requirements: account.requirements,
    });
  } catch (error: any) {
    console.error('Connect status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
