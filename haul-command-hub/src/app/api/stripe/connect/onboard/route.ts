import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-02-25.clover' as any,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { providerId } = await req.json();

    if (!providerId) {
      return NextResponse.json({ error: 'Missing providerId' }, { status: 400 });
    }

    // 1. Fetch Provider Profile
    const { data: provider, error } = await supabase
      .from('hc_provider_best_public_record')
      .select('stripe_account_id, email, display_name')
      .eq('provider_id', providerId)
      .single();

    if (error || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    let accountId = provider.stripe_account_id;

    // 2. Create Connect Account if not existing
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', // Express gives operators UI access cleanly via Stripe while hc handles UX
        country: 'US',
        email: provider.email || undefined,
        business_profile: {
            name: provider.display_name,
            url: SITE_URL,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Save the stripe_account_id back to provider
      await supabase
        .from('hc_provider_best_public_record')
        .update({ stripe_account_id: accountId })
        .eq('provider_id', providerId);
    }

    // 3. Generate Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SITE_URL}/api/stripe/connect/refresh?providerId=${providerId}`,
      return_url: `${SITE_URL}/api/stripe/connect/return?providerId=${providerId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('Stripe Connect error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
