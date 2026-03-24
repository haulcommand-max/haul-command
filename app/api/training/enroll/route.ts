import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';

// Certification tier → Stripe price ID env var mapping
const CERT_PRICE_IDS: Record<string, string> = {
  hc_certified: process.env.STRIPE_PRICE_HC_CERTIFIED || '',
  av_ready: process.env.STRIPE_PRICE_AV_READY || '',
  elite: process.env.STRIPE_PRICE_HC_ELITE || '',
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { certification_tier } = await req.json();
    if (!['hc_certified', 'av_ready', 'elite'].includes(certification_tier)) {
      return NextResponse.json({ error: 'Invalid certification tier' }, { status: 400 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('user_certifications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('certification_tier', certification_tier)
      .in('status', ['in_progress', 'passed'])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        already_enrolled: true,
        status: existing.status,
        certification_id: existing.id,
      });
    }

    // Check if user has Pro subscription (hc_certified is free for Pro)
    const { data: profile } = await supabase
      .from('operators')
      .select('subscription_status')
      .eq('user_id', user.id)
      .maybeSingle();

    const isPro = profile?.subscription_status === 'pro' || profile?.subscription_status === 'elite';
    const isFreeForUser = certification_tier === 'hc_certified' && isPro;

    if (isFreeForUser) {
      // Enroll directly
      await supabase.from('user_certifications').insert({
        user_id: user.id,
        certification_tier,
        status: 'in_progress',
      });
      return NextResponse.json({ enrolled: true });
    }

    // Requires payment — create Stripe checkout session
    const priceId = CERT_PRICE_IDS[certification_tier];
    if (!priceId) {
      // Fallback: enroll without payment (dev mode / missing env)
      await supabase.from('user_certifications').insert({
        user_id: user.id,
        certification_tier,
        status: 'in_progress',
      });
      return NextResponse.json({ enrolled: true, note: 'Payment bypassed — price ID not configured' });
    }

    const stripe = getStripe();
    const isSub = certification_tier !== 'hc_certified';

    const session = await stripe.checkout.sessions.create({
      mode: isSub ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/training/enrolled?tier=${certification_tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/training`,
      metadata: {
        user_id: user.id,
        certification_tier,
        type: 'certification_enrollment',
      },
      customer_email: user.email,
    });

    return NextResponse.json({ enrolled: false, checkout_url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
