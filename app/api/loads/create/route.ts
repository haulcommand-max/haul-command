import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * S1-02: Load Creation Hard-Stop
 * WAVE-1 — feat(marketplace): block load visibility until escrow pre-auth [WAVE-1]
 *
 * Rules enforced at the API layer (defense-in-depth over RLS):
 * 1. Must be authenticated
 * 2. Must have kyc_tier >= 2
 * 3. Must have a Stripe customer_id on file
 * 4. Job starts as 'DRAFT' — only transitions to 'OPEN' via webhook after pre-auth lock
 */
export async function POST(req: Request) {
  const supabase = createClient();

  // Auth check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile for KYC tier and Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_tier, kyc_level, stripe_customer_id, role')
    .eq('id', session.user.id)
    .single();

  // Role check
  if (profile?.role !== 'broker' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Only brokers can post loads' }, { status: 403 });
  }

  // KYC tier hard-stop — use canonical kyc_tier, fall back to kyc_level
  const tier = profile?.kyc_tier ?? profile?.kyc_level ?? 0;
  if (tier < 2) {
    return NextResponse.json({
      error: 'KYC verification required to post loads',
      required_tier: 2,
      current_tier: tier,
      upgrade_url: '/settings/verification',
    }, { status: 403 });
  }

  // Stripe customer hard-stop
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({
      error: 'Payment method required to post loads',
      setup_url: '/settings/billing',
    }, { status: 403 });
  }

  // Parse load payload
  const body = await req.json();
  const { origin_city, destination_city, description, budget_amount, payment_method = 'stripe', states_crossed = 1 } = body;

  if (!origin_city || !destination_city || !budget_amount) {
    return NextResponse.json({ error: 'origin_city, destination_city, and budget_amount are required' }, { status: 400 });
  }

  // Create load as DRAFT — invisible until escrow pre-auth succeeds
  const { data: load, error: loadError } = await supabase
    .from('hc_loads')
    .insert({
      broker_id: session.user.id,
      origin_city,
      destination_city,
      origin_state: body.origin_state || 'US',
      destination_state: body.destination_state || 'US',
      rate_total_cents: Math.round(budget_amount * 100),
      currency: 'usd',
      payment_terms: 'escrow',
      source_type: 'direct',
      urgency: 'standard',
      escorts_needed: 0,
      permits_required: false,
      tarp_required: false,
      load_status: 'draft', // Matches webhook expectation which shifts draft -> open
    })
    .select()
    .single();

  if (loadError || !load) {
    return NextResponse.json({ error: loadError?.message || 'Failed to create load' }, { status: 500 });
  }

  // Immediately initiate pre-auth via payments-preauth edge function
  const preAuthPayload = {
    load_id: load.id,
    amount_cents: load.rate_total_cents,
    broker_user_id: session.user.id,
    currency: 'usd',
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const preAuthRes = await fetch(`${supabaseUrl}/functions/v1/payments-preauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(preAuthPayload),
  });

  const preAuthData = await preAuthRes.json();

  if (!preAuthRes.ok || preAuthData.status === 'failed') {
    return NextResponse.json({
      load_id: load.id,
      status: 'preauth_failed',
      error: preAuthData.error || 'Payment pre-authorization failed',
      client_secret: null,
    }, { status: 402 });
  }

  return NextResponse.json({
    load_id: load.id,
    status: preAuthData.status, // 'preauth_created' or 'demo_authorized'
    client_secret: preAuthData.client_secret,
    payment_intent_id: preAuthData.payment_intent_id,
    note: 'Load is DRAFT until payment is confirmed. It will become visible on the board automatically.',
  }, { status: 201 });
}
