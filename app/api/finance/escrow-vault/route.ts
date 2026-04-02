import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// HAUL COMMAND: ESCROW & SETTLEMENT ENGINE
// Secures funds from Shippers/Brokers pending GPS-verified completion by Escort Operators.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { brokerId, escortId, loadId, quoteAmount, currency = 'USD' } = await req.json();

    if (!brokerId || !escortId || !loadId || !quoteAmount) {
      return NextResponse.json({ error: 'Missing required escrow settlement fields.' }, { status: 400 });
    }

    // 1. Log the financial observation (Tie-in to Phase 1/Layer 4: Closed jobs & Quotes)
    await supabase.from('hc_pricing_observations').insert({
      service_type: 'pilot_car_operator', // Defaulting for example
      pricing_layer: 'rfq_capture',
      quoted_amount: quoteAmount,
      actual_accepted_amount: quoteAmount,
      currency: currency,
      country_code: 'US', // Fallback, would be driven by load data
      confidence_score: 'Verified escrow lock'
    });

    // 2. Initiate Escrow Ledger Lock (Simulating Stripe Connect / Treasury)
    const { data: escrowLock, error: lockError } = await supabase.from('hc_financial_escrow').insert({
      broker_id: brokerId,
      escort_id: escortId,
      load_id: loadId,
      amount: quoteAmount,
      currency,
      status: 'FUNDS_LOCKED',
      held_at: new Date().toISOString()
    }).select().single();

    if (lockError) throw lockError;

    // Simulate Payment Gateway Link
    return NextResponse.json({
      success: true,
      escrowId: escrowLock.id,
      paymentLink: `https://checkout.haulcommand.com/pay/${escrowLock.id}`,
      message: `Successfully locked $${quoteAmount} in Escrow Vault for Load ${loadId}. Funds will release upon GPS delivery verification.`
    });

  } catch (error: any) {
    console.error('[ESCROW_API_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
