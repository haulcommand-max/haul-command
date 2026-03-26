import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

// POST /api/connect/onboard
// Creates a Stripe Connect Express account for an operator and returns the onboarding link
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarded, full_name, email')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    let connectAccountId = profile.stripe_connect_account_id;

    // Create account if not exists
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          platform: 'haul_command',
          user_id: user.id,
        },
      });

      connectAccountId = account.id;
      await supabase
        .from('profiles')
        .update({ stripe_connect_account_id: connectAccountId })
        .eq('id', user.id);
    }

    // Create onboarding link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${siteUrl}/dashboard/earnings?refresh=1`,
      return_url: `${siteUrl}/dashboard/earnings?onboarded=1`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url, account_id: connectAccountId });
  } catch (error: any) {
    console.error('Connect onboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
