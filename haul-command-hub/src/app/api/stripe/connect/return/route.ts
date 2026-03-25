import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-02-25.clover' as any,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.redirect(`${SITE_URL}/dashboard?error=Missing+providerId`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch account ID
    const { data: provider } = await supabase
      .from('hc_provider_best_public_record')
      .select('stripe_account_id')
      .eq('provider_id', providerId)
      .single();

    if (!provider?.stripe_account_id) {
       return NextResponse.redirect(`${SITE_URL}/dashboard?error=No+Stripe+Account`);
    }

    // Verify status explicitly with Stripe
    const account = await stripe.accounts.retrieve(provider.stripe_account_id);

    if (account.details_submitted) {
       await supabase
         .from('hc_provider_best_public_record')
         .update({ stripe_onboarding_complete: true, quickpay_eligible: true })
         .eq('provider_id', providerId);

       // Redirect to success UI
       return NextResponse.redirect(`${SITE_URL}/dashboard/financials?onboarding_success=true`);
    }

    // If not submitted fully, drop them back
    return NextResponse.redirect(`${SITE_URL}/dashboard/financials?onboarding_incomplete=true`);

  } catch (err: any) {
    console.error('Return from Stripe error:', err);
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=StripeError`);
  }
}
