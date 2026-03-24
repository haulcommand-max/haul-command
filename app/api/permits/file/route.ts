import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe } from '@/lib/stripe';

// POST /api/permits/file
// Body: { state, permit_type, dimensions, route, load_id? }
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json();
  const { states, permit_type = 'oversize', dimensions, route, load_id, rush = false } = body;

  if (!states?.length || !dimensions) {
    return NextResponse.json({ error: 'states and dimensions required' }, { status: 400 });
  }

  // Get quote
  const quoteRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/permits/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ states, permit_type, dimensions, rush }),
  });
  const quote = await quoteRes.json();

  // Create Stripe checkout session
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: quote.line_items.map((item: { description: string; amount_cents: number }) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.description },
        unit_amount: item.amount_cents,
      },
      quantity: 1,
    })),
    metadata: {
      user_id: user.id,
      states: JSON.stringify(states),
      permit_type,
      load_id: load_id || '',
      rush: rush ? 'true' : 'false',
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/permits?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tools/permit-filing?cancelled=true`,
  });

  // Create pending permit filings
  const filingInserts = (states as string[]).map(state => ({
    user_id: user.id,
    load_id: load_id || null,
    state: state.toUpperCase(),
    permit_type,
    dimensions,
    route: route || {},
    status: 'pending_payment',
    stripe_payment_id: session.id,
    amount_cents: quote.line_items.find((i: { state: string; amount_cents: number }) => i.state === state.toUpperCase())?.amount_cents ?? 0,
  }));

  await supabase.from('permit_filings').insert(filingInserts);

  return NextResponse.json({ checkout_url: session.url, session_id: session.id, quote });
}

// GET /api/permits/file — list my permits
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: permits } = await supabase.from('permit_filings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ permits: permits || [] });
}
