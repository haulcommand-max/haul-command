import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-18.acacia' as any });

// POST /api/billing/checkout
// Create a Stripe Checkout session for plan upgrade
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan, success_url, cancel_url } = await req.json();

    const PRICE_MAP: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
      elite: process.env.STRIPE_PRICE_ELITE || 'price_elite_monthly',
      broker: process.env.STRIPE_PRICE_BROKER || 'price_broker_monthly',
    };

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, display_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.display_name || '',
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${process.env.NEXT_PUBLIC_SITE_URL}/settings?upgraded=true`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: {
        user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Billing checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
