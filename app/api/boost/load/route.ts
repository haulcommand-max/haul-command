import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

// POST /api/boost/load
// Boost a load to the top of the board for 24 hours ($15)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { load_id } = await req.json();
    if (!load_id) return NextResponse.json({ error: 'load_id required' }, { status: 400 });

    // Verify load belongs to user
    const { data: load } = await supabase
      .from('loads')
      .select('id, broker_id')
      .eq('id', load_id)
      .eq('broker_id', user.id)
      .single();

    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 });

    // Create Stripe payment intent for boost ($15)
    const pi = await stripe.paymentIntents.create({
      amount: 1500,
      currency: 'usd',
      metadata: {
        type: 'load_boost',
        load_id,
        user_id: user.id,
        platform: 'haul_command',
      },
      description: `Load Boost — 24h top placement`,
    });

    // Set boost expiry (24 hours from now)
    const boostExpiry = new Date(Date.now() + 86400000).toISOString();
    await supabase
      .from('loads')
      .update({
        boosted: true,
        boost_expires_at: boostExpiry,
      })
      .eq('id', load_id);

    return NextResponse.json({
      client_secret: pi.client_secret,
      boost_expires_at: boostExpiry,
    });
  } catch (error: any) {
    console.error('Load boost error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
