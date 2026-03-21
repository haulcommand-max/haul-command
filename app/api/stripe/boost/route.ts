import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in route handlers */ },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** One-click load boost purchase — $14 per boost */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loadId } = body as { loadId: string };

    if (!loadId) {
      return NextResponse.json({ error: 'loadId required' }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS.load_boost;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Load boost price not configured' },
        { status: 500 }
      );
    }

    const user = await getSupabaseUser();
    const stripe = getStripe();
    const origin = req.nextUrl.origin;

    let customerId: string | undefined;
    if (user?.email) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) customerId = existing.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ...(customerId ? { customer: customerId } : {
        customer_email: user?.email || undefined,
      }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/loads/${loadId}?boosted=true`,
      cancel_url: `${origin}/loads/${loadId}`,
      metadata: {
        user_id: user?.id || 'anonymous',
        load_id: loadId,
        type: 'load_boost',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Boost Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create boost session' },
      { status: 500 }
    );
  }
}
