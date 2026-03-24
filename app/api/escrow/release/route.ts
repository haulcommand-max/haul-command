import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-18.acacia' as any });

// POST /api/escrow/release
// Broker confirms job complete → release escrow to operator
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { escrow_id } = await req.json();
    if (!escrow_id) {
      return NextResponse.json({ error: 'escrow_id required' }, { status: 400 });
    }

    // Get escrow
    const { data: escrow } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrow_id)
      .eq('broker_id', user.id)
      .eq('status', 'held')
      .single();

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found or not held' }, { status: 404 });
    }

    // Capture the payment (releases from hold)
    if (escrow.stripe_payment_intent_id) {
      await stripe.paymentIntents.capture(escrow.stripe_payment_intent_id);
    }

    // Update escrow
    await supabase
      .from('escrow_transactions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('id', escrow_id);

    // Update load status
    if (escrow.load_id) {
      await supabase
        .from('loads')
        .update({ status: 'completed' })
        .eq('id', escrow.load_id);
    }

    // Notify operator of payout
    await supabase.from('notifications').insert({
      user_id: escrow.operator_id,
      type: 'payment_released',
      title: `\ud83d\udcb0 Payment Released \u2014 $${(escrow.amount * 0.95).toFixed(2)}`,
      body: 'Your escrow payment has been released. You\'ll receive the funds within 1-2 business days.',
      data: { escrow_id, load_id: escrow.load_id },
      action_url: `/loads/${escrow.load_id}`,
    });

    return NextResponse.json({
      status: 'released',
      operator_payout: escrow.amount * 0.95,
      platform_fee: escrow.amount * 0.05,
    });
  } catch (error: any) {
    console.error('Escrow release error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
