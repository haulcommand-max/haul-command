import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

// POST /api/escrow/create
// Create an escrow payment intent for a load
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { load_id, amount, operator_id, conversation_id } = await req.json();
    if (!load_id || !amount || !operator_id) {
      return NextResponse.json({ error: 'load_id, amount, operator_id required' }, { status: 400 });
    }

    // Create Stripe payment intent (manual capture = escrow hold)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      capture_method: 'manual', // Hold funds until job complete
      metadata: {
        load_id,
        operator_id,
        broker_id: user.id,
        conversation_id: conversation_id || '',
        platform: 'haul_command',
      },
      description: `Haul Command Escrow — Load ${load_id.slice(0, 8)}`,
    });

    // Create escrow record
    const { data: escrow, error } = await supabase
      .from('escrow_transactions')
      .insert({
        load_id,
        operator_id,
        broker_id: user.id,
        amount,
        status: 'held',
        stripe_payment_intent_id: paymentIntent.id,
        conversation_id: conversation_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify operator
    await supabase.from('notifications').insert({
      user_id: operator_id,
      type: 'payment_released',
      title: `\ud83d\udd12 Escrow Created \u2014 $${amount}`,
      body: 'Payment is being held in escrow. Complete the job to receive your payout.',
      data: { escrow_id: escrow.id, load_id },
      action_url: `/loads/${load_id}`,
    });

    return NextResponse.json({
      escrow_id: escrow.id,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Escrow create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
