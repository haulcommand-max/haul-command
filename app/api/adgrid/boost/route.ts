import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import Stripe from 'stripe';

/* ═══════════════════════════════════════════════════════════════════
   /api/adgrid/boost — Operator listing boosts
   POST { duration_days: 7|30|90 } — create Stripe checkout for boost
   GET — list my active boosts
   ═══════════════════════════════════════════════════════════════════ */

const BOOST_PRICING: Record<number, { price: number; label: string }> = {
  7:  { price: 1900,  label: '7-Day Boost ($19)' },
  30: { price: 5900,  label: '30-Day Boost ($59)' },
  90: { price: 14900, label: '90-Day Boost ($149)' },
};

export async function POST(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { duration_days } = await req.json();
    const plan = BOOST_PRICING[duration_days];
    if (!plan) return NextResponse.json({ error: 'Invalid duration. Use 7, 30, or 90.' }, { status: 400 });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Haul Command ${plan.label}`,
            description: `Priority listing for ${duration_days} days — gold border, Sponsored badge, top placement in search results`,
          },
          unit_amount: plan.price,
        },
        quantity: 1,
      }],
      metadata: {
        user_id: user.id,
        boost_type: 'directory_listing',
        duration_days: String(duration_days),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com'}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com'}/boost`,
    });

    // Record pending boost
    await sb.from('ad_boosts').insert({
      profile_id: user.id,
      duration_days,
      amount_cents: plan.price,
      stripe_session_id: session.id,
      status: 'pending',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration_days * 86400000).toISOString(),
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ boosts: [] });

    const { data } = await sb
      .from('ad_boosts')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ boosts: data || [] });
  } catch {
    return NextResponse.json({ boosts: [] });
  }
}
