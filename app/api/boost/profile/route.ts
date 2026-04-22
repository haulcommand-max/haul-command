import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

// POST /api/boost/profile
// Boost operator profile to top of directory ($49/month)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { listing_id } = await req.json();
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

    const pi = await stripe.paymentIntents.create({
      amount: 4900,
      currency: 'usd',
      metadata: {
        type: 'profile_boost',
        listing_id,
        user_id: user.id,
        platform: 'haul_command',
      },
      description: `Directory Featured — 30 days top placement`,
    });

    const boostExpiry = new Date(Date.now() + 30 * 86400000).toISOString();
    await supabase
      .from('hc_global_operators')
      .update({
        featured: true,
        featured_expires_at: boostExpiry,
      })
      .eq('id', listing_id);

    return NextResponse.json({
      client_secret: pi.client_secret,
      featured_expires_at: boostExpiry,
    });
  } catch (error: any) {
    console.error('Profile boost error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
