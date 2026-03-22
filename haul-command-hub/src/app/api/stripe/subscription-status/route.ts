/**
 * POST /api/stripe/subscription-status
 *
 * Returns the subscription status for an operator.
 * Used by the client to show current plan info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { operatorId } = body;

    if (!operatorId) {
      return NextResponse.json({ error: 'Operator ID required' }, { status: 400 });
    }

    const sb = supabaseServer();
    const { data, error } = await sb
      .from('hc_places')
      .select('subscription_status, plan, stripe_customer_id, stripe_subscription_id')
      .eq('id', operatorId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: data?.subscription_status ?? 'free',
      plan: data?.plan ?? 'free',
      hasStripe: !!data?.stripe_customer_id,
    });
  } catch (err) {
    console.error('[Subscription Status] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
